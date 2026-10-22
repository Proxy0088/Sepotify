import { Genre, Track } from '../types/music';

export const AUDIUS_APP_NAME = 'Sepotify';
export const AUDIUS_DEFAULT_ENDPOINT = 'https://api.audius.co/v1';

// Discovery nodes list for fallback if api.audius.co is restricted or blocked
const AUDIUS_DISCOVERY_NODES = [
  'https://api.audius.co/v1',
  'https://discoveryprovider.audius.co/v1',
  'https://audius-discovery-1.cultur3stake.com/v1',
  'https://audius-discovery-2.altego.net/v1',
  'https://dn1.monophonic.digital/v1',
];

// Helper to format duration in mm:ss
export function formatSecondsToTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// Helper to sanitize filename for downloads (Artist - Title.mp3)
export function sanitizeTrackFilename(artist: string, title: string): string {
  const safeArtist = (artist || 'Artist')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .trim()
    .slice(0, 50);
  const safeTitle = (title || 'Track')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .trim()
    .slice(0, 60);
  return `${safeArtist} - ${safeTitle}.mp3`;
}

// Map Audius genres to app's Genre type
function mapAudiusGenre(genre?: string): Genre {
  if (!genre) return 'Pop';
  const g = genre.toLowerCase();
  if (g.includes('electronic') || g.includes('dance') || g.includes('edm') || g.includes('house') || g.includes('techno')) {
    return 'Electronic';
  }
  if (g.includes('hip-hop') || g.includes('rap') || g.includes('trap')) {
    return 'Hip-Hop';
  }
  if (g.includes('rock') || g.includes('metal') || g.includes('punk')) {
    return 'Rock';
  }
  if (g.includes('chill') || g.includes('ambient') || g.includes('lo-fi') || g.includes('lofi')) {
    return 'Chill';
  }
  if (g.includes('acoustic') || g.includes('folk')) {
    return 'Acoustic';
  }
  if (g.includes('classical')) {
    return 'Classical';
  }
  if (g.includes('persian') || g.includes('iran')) {
    return 'Persian Pop';
  }
  return 'Pop';
}

export interface AudiusSearchResult {
  tracks: Track[];
  error?: string;
  isNetworkError?: boolean;
  usedNode?: string;
}

/**
 * Searches Audius official API for tracks matching the user's query.
 * Handles network failures, timeout, fallback nodes, and backend proxy fallback.
 */
export async function searchAudiusTracks(
  query: string,
  limit = 10,
  signal?: AbortSignal
): Promise<AudiusSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { tracks: [] };
  }

  const encodedQuery = encodeURIComponent(trimmed);
  let lastError: Error | null = null;
  let isNetworkBlocked = false;

  // 1. Try direct Audius API discovery nodes
  for (const nodeBase of AUDIUS_DISCOVERY_NODES) {
    if (signal?.aborted) {
      return { tracks: [] };
    }

    const url = `${nodeBase}/tracks/search?query=${encodedQuery}&limit=${limit}&app_name=${AUDIUS_APP_NAME}`;

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: signal || AbortSignal.timeout(6000),
      });

      if (!response.ok) {
        throw new Error(`Audius API returned HTTP ${response.status}`);
      }

      const json = await response.json();
      const rawData = Array.isArray(json?.data) ? json.data : [];

      const tracks: Track[] = rawData.map((item: any) => {
        const id = item.id ? String(item.id) : (item.track_id ? String(item.track_id) : Math.random().toString(36).slice(2));
        const title = (item.title || 'بدون عنوان').trim();
        const artist = (item.user?.name || item.user?.handle || 'هنرمند ناشناس').trim();
        const duration = typeof item.duration === 'number' ? Math.round(item.duration) : 180;
        
        // Artwork resolution hierarchy
        const coverUrl =
          item.artwork?.['480x480'] ||
          item.artwork?.['150x150'] ||
          item.artwork?.['1000x1000'] ||
          item.user?.profile_picture?.['480x480'] ||
          item.user?.profile_picture?.['150x150'] ||
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=480&q=80';

        // Official Audius endpoints
        const audioUrl = `${nodeBase}/tracks/${id}/stream?app_name=${AUDIUS_APP_NAME}`;
        const downloadUrl = `${nodeBase}/tracks/${id}/download?app_name=${AUDIUS_APP_NAME}`;

        // Streamable & Downloadable permissions
        const isStreamable = item.is_streamable !== false && item.access?.stream !== false;
        const isDownloadable = Boolean(item.is_downloadable && item.access?.download !== false);

        return {
          id: `audius-${id}`,
          audiusId: id,
          title,
          artist,
          album: item.genre || 'Audius Decentralized Music',
          duration,
          durationFormatted: formatSecondsToTime(duration),
          coverUrl,
          audioUrl,
          downloadUrl,
          genre: mapAudiusGenre(item.genre),
          isAudius: true,
          isFullSong: true,
          isStreamable,
          isDownloadable,
          plays: typeof item.play_count === 'number' ? item.play_count : 1000,
        };
      });

      return { tracks, usedNode: nodeBase };
    } catch (err: any) {
      if (signal?.aborted || err?.name === 'AbortError') {
        return { tracks: [] };
      }
      lastError = err;
      if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') {
        isNetworkBlocked = true;
      }
    }
  }

  // 2. Fallback to server proxy route in case client-side direct request is blocked by ISP / CORS
  try {
    const proxyUrl = `/api/audius/search?q=${encodedQuery}&limit=${limit}`;
    const proxyRes = await fetch(proxyUrl, {
      signal: signal || AbortSignal.timeout(8000),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (Array.isArray(data.tracks) && data.tracks.length > 0) {
        return { tracks: data.tracks, usedNode: 'server-proxy' };
      }
    }
  } catch (proxyErr) {
    console.warn('Audius proxy fallback failed:', proxyErr);
  }

  return {
    tracks: [],
    error: isNetworkBlocked
      ? 'خطای اتصال به سرورهای Audius: به نظر می‌رسد دسترسی به این سرویس بدون فیلترشکن (VPN) با محدودیت مواجه شده است.'
      : lastError?.message || 'خطا در برقراری ارتباط با Audius',
    isNetworkError: isNetworkBlocked,
  };
}
