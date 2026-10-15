import express from 'express';
import { createServer as createViteServer } from 'vite';
import https from 'https';
import http from 'http';
import path from 'path';

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Persian artist transliteration map for better unblocked searches
const PERSIAN_ARTIST_MAP: Record<string, string> = {
  'معین': 'Moein',
  'شادمهر': 'Shadmehr Aghili',
  'شادمهر عقیلی': 'Shadmehr Aghili',
  'ابی': 'Ebi',
  'هایده': 'Hayedeh',
  'مهستی': 'Mahasti',
  'داریوش': 'Dariush',
  'گوگوش': 'Googoosh',
  'محسن یگانه': 'Mohsen Yeganeh',
  'محسن چاوشی': 'Mohsen Chavoshi',
  'همایون شجریان': 'Homayoun Shajarian',
  'محمدرضا شجریان': 'Mohammad Reza Shajarian',
  'سیروان': 'Sirvan Khosravi',
  'سیروان خسروی': 'Sirvan Khosravi',
  'زانیار': 'Xaniar Khosravi',
  'یاس': 'Yas',
  'شایع': 'Shayea',
  'رضا پیشرو': 'Reza Pishro',
  'هیچکس': 'Hichkas',
  'بهنام بانی': 'Behnam Bani',
  'رضا صادقی': 'Reza Sadeghi',
  'ماکان بند': 'Macan Band',
  'علیرضا طلیسچی': 'Alireza Talischi',
  'احسان خواجه امیری': 'Ehsan Khajehamiri',
  'سیاوش قمیشی': 'Siavash Ghomayshi',
  'امید': 'Omid',
  'آصف آریا': 'Asef Aria',
  'حامیم': 'Haamim',
  'مسیح و آرش': 'Masih Arash',
  'سهراب پاکزاد': 'Sohrab Pakzad',
};

// Generic helper to fetch text from an HTTP/HTTPS URL with timeout
function fetchText(url: string, timeoutMs = 4000): Promise<string> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const mod = parsed.protocol === 'https:' ? https : http;
      const req = mod.get(
        url,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'fa,en-US,en;q=0.9',
          },
          timeout: timeoutMs,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve(data));
        }
      );
      req.on('error', () => resolve(''));
      req.on('timeout', () => {
        req.destroy();
        resolve('');
      });
    } catch {
      resolve('');
    }
  });
}

const FULL_TRACKS_CACHE = new Map<string, { tracks: any[]; time: number }>();

// 1. Search Real FULL Songs (320kbps / 128kbps complete MP3s) from Iranian CDNs (Unblocked in Iran)
async function searchFullPersianMusic(query: string): Promise<any[]> {
  const cacheKey = query.trim().toLowerCase();
  const cached = FULL_TRACKS_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.time < 30 * 60 * 1000) {
    return cached.tracks;
  }

  try {
    let cleanQuery = query.trim();
    // Check if query is in English but matches a Persian artist
    for (const [fa, en] of Object.entries(PERSIAN_ARTIST_MAP)) {
      if (cleanQuery.toLowerCase().includes(en.toLowerCase())) {
        cleanQuery = fa;
        break;
      }
    }

    // Try search with full query
    let searchUrl = `https://nex1music.com/?s=${encodeURIComponent(cleanQuery)}`;
    let searchHtml = await fetchText(searchUrl, 5000);

    // If no results and query has multiple words (e.g. "شادمهر عقیلی"), try primary artist token (e.g. "شادمهر")
    let rawMatches = [...searchHtml.matchAll(/<h2[^>]*><a[^>]*href=\"([^\"]+)\"[^>]*>([^<]+)<\/a><\/h2>/g)];
    if (rawMatches.length === 0 && cleanQuery.includes(' ')) {
      const firstWord = cleanQuery.split(' ')[0];
      if (firstWord.length >= 2) {
        searchUrl = `https://nex1music.com/?s=${encodeURIComponent(firstWord)}`;
        searchHtml = await fetchText(searchUrl, 4500);
        rawMatches = [...searchHtml.matchAll(/<h2[^>]*><a[^>]*href=\"([^\"]+)\"[^>]*>([^<]+)<\/a><\/h2>/g)];
      }
    }

    if (rawMatches.length === 0) return [];

    // Select top 4 candidate posts for speedy retrieval
    const candidatePosts = rawMatches.slice(0, 4).map((m) => ({
      url: m[1],
      rawTitle: m[2].trim(),
    }));

    // Fetch individual track pages in parallel to extract direct full MP3 URLs
    const pages = await Promise.all(candidatePosts.map((p) => fetchText(p.url, 6000)));

    const tracks: any[] = [];
    candidatePosts.forEach((post, i) => {
      const pageHtml = pages[i];
      if (!pageHtml) return;

      // Extract direct MP3 links
      const mp3Matches = [...pageHtml.matchAll(/href=\"(https?:\/\/[^\"]+\.mp3)\"/gi)].map((m) => m[1]);
      if (mp3Matches.length === 0) return;

      // Prefer 320kbps quality if available, else first mp3
      const bestMp3 = mp3Matches.find((u) => u.includes('320')) || mp3Matches[0];

      // Extract album cover artwork
      const imgMatch =
        pageHtml.match(/<div class=\"post\">[\s\S]*?<img[^>]*src=\"(https?:\/\/[^\"]+\.(?:jpg|png|jpeg))\"/i) ||
        pageHtml.match(/<img[^>]*src=\"(https?:\/\/[^\"]+\.(?:jpg|png|jpeg))\"/i);
      const coverUrl = imgMatch
        ? imgMatch[1]
        : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500';

      // Parse clean artist and title
      let title = post.rawTitle
        .replace(/^دانلود\s+آهنگ\s+/i, '')
        .replace(/^دانلود\s+ریمیکس\s+/i, '')
        .replace(/\s*\+\s*متن\s+آهنگ.*$/i, '')
        .trim();

      let artist = 'موسیقی ایرانی';
      if (title.includes(' به نام ')) {
        const parts = title.split(' به نام ');
        artist = parts[0].trim();
        title = parts[1].trim();
      }

      tracks.push({
        id: `full-${Buffer.from(bestMp3).toString('base64').replace(/[/+=]/g, '').slice(-16)}`,
        title,
        artist,
        album: 'آهنگ کامل (Full MP3)',
        duration: 215,
        durationFormatted: '3:35',
        coverUrl,
        audioUrl: bestMp3,
        genre: 'Persian Pop',
        isDirect: true,
        isFullSong: true,
        isUnblocked: true,
        plays: 350000 + Math.floor(Math.random() * 850000),
      });
    });

    if (tracks.length > 0) {
      FULL_TRACKS_CACHE.set(cacheKey, { tracks, time: Date.now() });
    }

    return tracks;
  } catch (err) {
    console.warn('Full Persian music search error:', err);
    return [];
  }
}

// 2. Query YouTube with a fast timeout (unblocked or when VPN is active)
function searchYouTubeMusic(query: string): Promise<any[]> {
  return new Promise((resolve) => {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    const req = https.get(
      searchUrl,
      {
        timeout: 2500, // Short timeout: fail fast if YouTube is blocked by firewall
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'fa,en-US,en;q=0.9',
        },
      },
      (ytRes) => {
        let html = '';
        ytRes.on('data', (chunk) => (html += chunk));
        ytRes.on('end', () => {
          try {
            const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
            if (!match) {
              resolve([]);
              return;
            }

            const json = JSON.parse(match[1]);
            const contents =
              json.contents?.twoColumnSearchResultsRenderer?.primaryContents
                ?.sectionListRenderer?.contents[0]?.itemSectionRenderer
                ?.contents || [];

            const results: any[] = [];

            for (const item of contents) {
              const v = item.videoRenderer;
              if (v && v.videoId && v.title?.runs?.[0]?.text) {
                const title = v.title.runs[0].text;
                const channel = v.ownerText?.runs?.[0]?.text || 'YouTube';
                const durationStr = v.lengthText?.simpleText || '3:30';

                const timeParts = durationStr.split(':').map((p: string) => parseInt(p, 10));
                let durationSec = 210;
                if (timeParts.length === 2 && !isNaN(timeParts[0]) && !isNaN(timeParts[1])) {
                  durationSec = timeParts[0] * 60 + timeParts[1];
                } else if (timeParts.length === 3) {
                  durationSec = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
                }

                const thumb =
                  v.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
                  `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`;

                results.push({
                  id: `yt-${v.videoId}`,
                  youtubeId: v.videoId,
                  title,
                  artist: channel,
                  album: 'YouTube Music (پخش کامل ویدیو و صوت)',
                  duration: durationSec,
                  durationFormatted: durationStr,
                  coverUrl: thumb,
                  audioUrl: `https://www.youtube.com/watch?v=${v.videoId}`,
                  genre: 'Pop',
                  isYouTube: true,
                  isFullSong: true,
                  plays: parseInt(v.viewCountText?.simpleText?.replace(/\D/g, '') || '500000', 10),
                });

                if (results.length >= 8) break;
              }
            }

            resolve(results);
          } catch {
            resolve([]);
          }
        });
      }
    );

    req.on('error', () => resolve([]));
    req.on('timeout', () => {
      req.destroy();
      resolve([]);
    });
  });
}

// 3. Fallback: Query Apple iTunes Unblocked Music Database (Clearly labeled as 30s preview)
function searchUnblockedMusic(term: string): Promise<any[]> {
  return new Promise((resolve) => {
    let queryTerm = term;
    for (const [fa, en] of Object.entries(PERSIAN_ARTIST_MAP)) {
      if (term.includes(fa)) {
        queryTerm = term.replace(fa, en);
        break;
      }
    }

    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
      queryTerm
    )}&media=music&entity=song&limit=6`;

    const req = https.get(itunesUrl, { timeout: 3500 }, (res) => {
      let data = '';
      res.on('data', (chunk) => (chunk += data));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (!json.results || !Array.isArray(json.results)) {
            resolve([]);
            return;
          }

          const tracks = json.results
            .filter((r: any) => r.previewUrl)
            .map((r: any) => {
              const highResCover = r.artworkUrl100
                ? r.artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg')
                : r.artworkUrl100;

              return {
                id: `preview-${r.trackId}`,
                title: r.trackName,
                artist: r.artistName,
                album: r.collectionName || 'Single',
                duration: 30, // Exact duration of preview so progress bar is 100% accurate!
                durationFormatted: '0:30 (پیش‌نمایش)',
                coverUrl: highResCover,
                audioUrl: r.previewUrl,
                genre: r.primaryGenreName || 'Pop',
                isDirect: true,
                isPreview: true,
                isFullSong: false,
                isUnblocked: true,
                plays: Math.floor(Math.random() * 800000) + 200000,
              };
            });

          resolve(tracks);
        } catch {
          resolve([]);
        }
      });
    });

    req.on('error', () => resolve([]));
    req.on('timeout', () => {
      req.destroy();
      resolve([]);
    });
  });
}

// 4. Audio Streaming Proxy with HTTP Range Requests (Ensures seamless scrubbing and no mobile cutoff)
app.get('/api/audio/stream', (req, res) => {
  const targetUrl = (req.query.url as string) || '';
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(400).send('Invalid or missing audio URL');
  }

  try {
    const parsed = new URL(targetUrl);
    const mod = parsed.protocol === 'https:' ? https : http;
    const clientHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: '*/*',
    };

    if (req.headers.range) {
      clientHeaders['Range'] = req.headers.range;
    }

    const proxyReq = mod.get(targetUrl, { headers: clientHeaders, timeout: 15000 }, (remoteRes) => {
      // Forward status code (200 or 206)
      res.status(remoteRes.statusCode || 200);

      // Forward crucial audio streaming headers
      const forwardHeaders = [
        'content-type',
        'content-length',
        'content-range',
        'accept-ranges',
        'cache-control',
      ];

      forwardHeaders.forEach((h) => {
        if (remoteRes.headers[h]) {
          res.setHeader(h, remoteRes.headers[h] as string);
        }
      });

      // Enable CORS & Range
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');

      remoteRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.warn('Audio proxy request failed:', err.message);
      if (!res.headersSent) {
        res.status(502).send('Error streaming remote audio');
      }
    });

    req.on('close', () => {
      proxyReq.destroy();
    });
  } catch (e: any) {
    if (!res.headersSent) {
      res.status(500).send(e.message || 'Stream proxy error');
    }
  }
});

// 5. Unified Multi-Engine Music Search API (Full Songs First!)
app.get(['/api/search', '/api/youtube/search'], async (req, res) => {
  const query = ((req.query.q as string) || '').trim();
  if (!query) {
    return res.json({
      results: [],
      fullTracks: [],
      directResults: [],
      youtubeResults: [],
      previewResults: [],
    });
  }

  try {
    // Run full Persian music search, YouTube, and iTunes search in parallel
    const [fullTracks, youtubeTracks, previewTracks] = await Promise.all([
      searchFullPersianMusic(query),
      searchYouTubeMusic(query),
      searchUnblockedMusic(query),
    ]);

    // Unblocked direct results: prefer full tracks over 30s previews
    const directResults = fullTracks.length > 0 ? fullTracks : previewTracks;

    // Combined list: Full complete tracks first, then YouTube, then previews if needed
    const combined = [...fullTracks, ...youtubeTracks, ...(fullTracks.length === 0 ? previewTracks : [])];

    res.json({
      results: combined,
      fullTracks,
      directResults,
      youtubeResults: youtubeTracks,
      previewResults: previewTracks,
      query,
      fullCount: fullTracks.length,
      unblockedCount: directResults.length,
      youtubeCount: youtubeTracks.length,
    });
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ results: [], error: err.message });
  }
});

// Setup Vite in middleware mode
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Spotify Liquid Glass player running on http://0.0.0.0:${port}`);
  });
}

startServer();
