import { Playlist, Track } from '../types/music';

const DB_NAME = 'SpotifyOfflineDB';
const DB_VERSION = 1;
const STORE_TRACKS = 'downloaded_tracks';
const STORE_AUDIO_BLOBS = 'audio_blobs';

// Initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_TRACKS)) {
        db.createObjectStore(STORE_TRACKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_AUDIO_BLOBS)) {
        db.createObjectStore(STORE_AUDIO_BLOBS);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export interface DownloadResult {
  success: boolean;
  message: string;
  filename?: string;
  sizeBytes?: number;
}

// Download a track: fetch its real audio stream, store ArrayBuffer/Blob and metadata in IndexedDB
export async function downloadTrackToIndexedDB(track: Track): Promise<DownloadResult> {
  // 1. Check download permission (Requirement 3: do not download unpermitted tracks)
  if (track.isAudius && track.isDownloadable === false) {
    return {
      success: false,
      message: 'این قطعه توسط هنرمند در Audius برای دانلود مجاز نشده است (دانلود غیرمجاز).',
    };
  }

  try {
    const db = await openDB();

    // 2. Determine download URL
    let downloadUrl: string;

    if (track.isAudius && (track.downloadUrl || track.audiusId)) {
      // Official Audius download endpoint
      downloadUrl =
        track.downloadUrl ||
        `https://api.audius.co/v1/tracks/${track.audiusId}/download?app_name=Sepotify`;
    } else if (
      track.audioUrl &&
      track.audioUrl.startsWith('http') &&
      !track.youtubeId &&
      !track.audioUrl.includes('youtube.com') &&
      !track.audioUrl.includes('youtu.be') &&
      track.audioUrl.includes('.mp3')
    ) {
      // Direct MP3
      downloadUrl = `/api/audio/stream?url=${encodeURIComponent(track.audioUrl)}`;
    } else {
      downloadUrl = `/api/audio/download?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist || '')}&youtubeId=${encodeURIComponent(track.youtubeId || '')}&url=${encodeURIComponent(track.audioUrl || '')}`;
    }

    let response: Response;
    try {
      response = await fetch(downloadUrl);
      if (!response.ok && track.isAudius && track.audiusId) {
        // Fallback through backend proxy if direct fetch received CORS or network block
        const proxyUrl = `/api/audius/download?trackId=${encodeURIComponent(track.audiusId)}&url=${encodeURIComponent(downloadUrl)}`;
        response = await fetch(proxyUrl);
      }
    } catch (netErr) {
      if (track.isAudius && track.audiusId) {
        const proxyUrl = `/api/audius/download?trackId=${encodeURIComponent(track.audiusId)}&url=${encodeURIComponent(downloadUrl)}`;
        response = await fetch(proxyUrl);
      } else {
        throw netErr;
      }
    }

    if (!response || !response.ok) {
      throw new Error(`خطای سرور دانلود (کد ${response?.status || 'نامشخص'})`);
    }

    const blob = await response.blob();

    if (blob.size < 1000) {
      throw new Error('فایل صوتی دریافت شده ناقص است یا حجم آن غیرمعتبر است.');
    }

    // Convert to ArrayBuffer for universal browser/WebKit IndexedDB serialization without DataCloneError
    let buffer: ArrayBuffer | null = null;
    try {
      buffer = await blob.arrayBuffer();
    } catch {
      // Fallback to storing blob directly
    }

    const contentType = blob.type && blob.type.startsWith('audio/') ? blob.type : 'audio/mpeg';
    const storagePayload = buffer
      ? { buffer, type: contentType, size: blob.size }
      : blob;

    // Sanitize filename: Artist - Title.mp3
    const safeArtist = (track.artist || 'Artist').replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim().slice(0, 50);
    const safeTitle = (track.title || 'Track').replace(/[<>:"/\\|?*\x00-\x1F]/g, '').trim().slice(0, 60);
    const filename = `${safeArtist} - ${safeTitle}.mp3`;

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([STORE_TRACKS, STORE_AUDIO_BLOBS], 'readwrite');
      const trackStore = tx.objectStore(STORE_TRACKS);
      const blobStore = tx.objectStore(STORE_AUDIO_BLOBS);

      trackStore.put({
        ...track,
        isDownloaded: true,
        downloadedAt: Date.now(),
        localFilename: filename,
        fileSizeBytes: blob.size,
      });

      // Save blob under primary ID
      blobStore.put(storagePayload, track.id);

      // Also index by audiusId / youtubeId variants to ensure robust offline retrieval
      if (track.audiusId) {
        blobStore.put(storagePayload, track.audiusId);
        blobStore.put(storagePayload, `audius-${track.audiusId}`);
      }
      if (track.youtubeId) {
        blobStore.put(storagePayload, track.youtubeId);
        blobStore.put(storagePayload, `yt-${track.youtubeId}`);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    return {
      success: true,
      message: `آهنگ «${track.title}» با موفقیت دانلود شد و برای استفاده آفلاین ذخیره گردید.`,
      filename,
      sizeBytes: blob.size,
    };
  } catch (error: any) {
    console.error('Download error for track:', track.title, error);
    return {
      success: false,
      message: error?.message || 'خطا در بارگیری یا ذخیره‌سازی فایل صوتی.',
    };
  }
}

// Retrieve cached audio blob URL for offline playback
export async function getDownloadedAudioUrl(
  trackId: string,
  secondaryId?: string
): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_AUDIO_BLOBS, 'readonly');
      const store = tx.objectStore(STORE_AUDIO_BLOBS);

      const candidateKeys = Array.from(
        new Set([
          trackId,
          trackId.startsWith('audius-') ? trackId.replace(/^audius-/, '') : `audius-${trackId}`,
          trackId.startsWith('yt-') ? trackId.replace(/^yt-/, '') : `yt-${trackId}`,
          ...(secondaryId
            ? [
                secondaryId,
                secondaryId.startsWith('audius-')
                  ? secondaryId.replace(/^audius-/, '')
                  : `audius-${secondaryId}`,
                secondaryId.startsWith('yt-')
                  ? secondaryId.replace(/^yt-/, '')
                  : `yt-${secondaryId}`,
              ]
            : []),
        ])
      );

      const checkNext = (idx: number) => {
        if (idx >= candidateKeys.length) {
          resolve(null);
          return;
        }

        const key = candidateKeys[idx];
        const req = store.get(key);

        req.onsuccess = () => {
          const result = req.result;
          if (!result) {
            checkNext(idx + 1);
            return;
          }

          try {
            let audioBlob: Blob | null = null;
            if (result instanceof Blob) {
              audioBlob = new Blob([result], {
                type: result.type && result.type.startsWith('audio/') ? result.type : 'audio/mpeg',
              });
            } else if (
              result?.buffer &&
              (result.buffer instanceof ArrayBuffer || ArrayBuffer.isView(result.buffer))
            ) {
              audioBlob = new Blob([result.buffer], {
                type: result.type && result.type.startsWith('audio/') ? result.type : 'audio/mpeg',
              });
            } else if (result instanceof ArrayBuffer) {
              audioBlob = new Blob([result], { type: 'audio/mpeg' });
            }

            if (audioBlob && audioBlob.size > 500) {
              const url = URL.createObjectURL(audioBlob);
              resolve(url);
            } else {
              checkNext(idx + 1);
            }
          } catch (e) {
            console.warn('Error reading audio blob from IndexedDB:', e);
            checkNext(idx + 1);
          }
        };

        req.onerror = () => checkNext(idx + 1);
      };

      checkNext(0);
    });
  } catch {
    return null;
  }
}

// Remove downloaded track from IndexedDB
export async function removeTrackFromIndexedDB(trackId: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_TRACKS, STORE_AUDIO_BLOBS], 'readwrite');
      const trackStore = tx.objectStore(STORE_TRACKS);
      const blobStore = tx.objectStore(STORE_AUDIO_BLOBS);

      trackStore.delete(trackId);
      blobStore.delete(trackId);

      // Clean all aliases
      if (trackId.startsWith('audius-')) {
        const raw = trackId.replace(/^audius-/, '');
        trackStore.delete(raw);
        blobStore.delete(raw);
      } else {
        blobStore.delete(`audius-${trackId}`);
      }

      if (trackId.startsWith('yt-')) {
        const raw = trackId.replace(/^yt-/, '');
        trackStore.delete(raw);
        blobStore.delete(raw);
      } else {
        blobStore.delete(`yt-${trackId}`);
      }

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    return false;
  }
}

// Get all downloaded tracks from IndexedDB
export async function getDownloadedTracks(): Promise<Track[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_TRACKS, 'readonly');
      const store = tx.objectStore(STORE_TRACKS);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// LocalStorage helpers for Likes, Custom Playlists & Play History
const LIKES_KEY = 'spotify_liked_tracks';
const PLAYLISTS_KEY = 'spotify_custom_playlists';
const STATS_KEY = 'spotify_user_stats';

export function getStoredLikes(): string[] {
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredLikes(likedIds: string[]): void {
  try {
    localStorage.setItem(LIKES_KEY, JSON.stringify(likedIds));
  } catch (e) {
    console.error('Failed to save likes:', e);
  }
}

export function getStoredPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(PLAYLISTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredPlaylists(playlists: Playlist[]): void {
  try {
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  } catch (e) {
    console.error('Failed to save playlists:', e);
  }
}

export function getStoredStats(): {
  playCounts: Record<string, number>;
  genreAffinity: Record<string, number>;
} {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : { playCounts: {}, genreAffinity: {} };
  } catch {
    return { playCounts: {}, genreAffinity: {} };
  }
}

export function recordTrackPlay(track: Track): void {
  try {
    const stats = getStoredStats();
    stats.playCounts[track.id] = (stats.playCounts[track.id] || 0) + 1;
    stats.genreAffinity[track.genre] = (stats.genreAffinity[track.genre] || 0) + 1;
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to record play stats:', e);
  }
}
