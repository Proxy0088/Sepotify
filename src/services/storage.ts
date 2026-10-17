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

// Download a track: fetch its real audio stream, store ArrayBuffer/Blob and metadata in IndexedDB
export async function downloadTrackToIndexedDB(track: Track): Promise<boolean> {
  try {
    const db = await openDB();

    // Determine download URL
    let downloadUrl: string;

    if (
      track.audioUrl &&
      track.audioUrl.startsWith('http') &&
      !track.youtubeId &&
      !track.audioUrl.includes('youtube.com') &&
      !track.audioUrl.includes('youtu.be') &&
      track.audioUrl.includes('.mp3')
    ) {
      // Direct MP3 - route through proxy to avoid CORS
      downloadUrl = `/api/audio/stream?url=${encodeURIComponent(track.audioUrl)}`;
    } else {
      // YouTube track or dynamic source - resolve real MP3 audio via server download engine
      downloadUrl = `/api/audio/download?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist || '')}&youtubeId=${encodeURIComponent(track.youtubeId || '')}&url=${encodeURIComponent(track.audioUrl || '')}`;
    }

    const response = await fetch(downloadUrl);
    let blob: Blob;

    if (response.ok) {
      blob = await response.blob();
    } else {
      throw new Error(`Download endpoint returned HTTP ${response.status}`);
    }

    if (blob.size < 1000) {
      throw new Error('Downloaded audio blob is too small');
    }

    // Convert to ArrayBuffer for universal browser/WebKit IndexedDB serialization without DataCloneError
    let buffer: ArrayBuffer | null = null;
    try {
      buffer = await blob.arrayBuffer();
    } catch {
      // Fallback to storing blob directly
    }

    const storagePayload = buffer
      ? { buffer, type: blob.type || 'audio/mpeg', size: blob.size }
      : blob;

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_TRACKS, STORE_AUDIO_BLOBS], 'readwrite');
      const trackStore = tx.objectStore(STORE_TRACKS);
      const blobStore = tx.objectStore(STORE_AUDIO_BLOBS);

      trackStore.put({ ...track, isDownloaded: true, downloadedAt: Date.now() });
      blobStore.put(storagePayload, track.id);

      // Also index by youtubeId if available to guarantee retrieval under both keys
      if (track.youtubeId && track.youtubeId !== track.id) {
        blobStore.put(storagePayload, track.youtubeId);
        blobStore.put(storagePayload, `yt-${track.youtubeId}`);
      }

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Download error for track:', track.title, error);
    return false;
  }
}

// Retrieve cached audio blob URL for offline playback
export async function getDownloadedAudioUrl(trackId: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_AUDIO_BLOBS, 'readonly');
      const store = tx.objectStore(STORE_AUDIO_BLOBS);

      const candidateKeys = [
        trackId,
        trackId.startsWith('yt-') ? trackId.replace(/^yt-/, '') : `yt-${trackId}`,
      ];

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
            } else if (result?.buffer && (result.buffer instanceof ArrayBuffer || ArrayBuffer.isView(result.buffer))) {
              audioBlob = new Blob([result.buffer], {
                type: result.type && result.type.startsWith('audio/') ? result.type : 'audio/mpeg',
              });
            } else if (result instanceof ArrayBuffer) {
              audioBlob = new Blob([result], { type: 'audio/mpeg' });
            }

            if (audioBlob && audioBlob.size > 1000) {
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
      tx.objectStore(STORE_TRACKS).delete(trackId);
      tx.objectStore(STORE_AUDIO_BLOBS).delete(trackId);
      if (trackId.startsWith('yt-')) {
        tx.objectStore(STORE_AUDIO_BLOBS).delete(trackId.replace(/^yt-/, ''));
      } else {
        tx.objectStore(STORE_AUDIO_BLOBS).delete(`yt-${trackId}`);
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
