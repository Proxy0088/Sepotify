export type Genre =
  | 'Pop'
  | 'Hip-Hop'
  | 'Electronic'
  | 'Chill'
  | 'Rock'
  | 'Acoustic'
  | 'Persian Pop'
  | 'Classical';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverUrl: string;
  audioUrl: string;
  genre: Genre;
  lyrics?: string[];
  releaseYear?: number;
  plays?: number;
  isDownloaded?: boolean;
  youtubeId?: string;
  isYouTube?: boolean;
  isDirect?: boolean;
  isUnblocked?: boolean;
  isFullSong?: boolean;
  isPreview?: boolean;
  durationFormatted?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  trackIds: string[];
  isCustom?: boolean;
  createdBy?: string;
  colorGradient?: string;
}

export interface PlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  queue: Track[];
  history: Track[];
}

export interface UserStats {
  likedTrackIds: string[];
  playCounts: Record<string, number>;
  genreAffinity: Record<string, number>;
  downloadedTrackIds: string[];
}
