import { Track } from '../types/music';
import { getDownloadedAudioUrl } from './storage';

export interface AudioEngineCallbacks {
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onEnded: () => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onError: (errorMsg: string) => void;
}

class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private currentVolume = 0.8;
  private currentTrack: Track | null = null;

  private callbacks: AudioEngineCallbacks = {
    onTimeUpdate: () => {},
    onEnded: () => {},
    onPlayStateChange: () => {},
    onError: () => {},
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.preload = 'auto';
      this.audio.volume = this.currentVolume;

      this.audio.addEventListener('loadedmetadata', () => {
        if (this.audio && !this.currentTrack?.youtubeId && isFinite(this.audio.duration) && this.audio.duration > 0) {
          this.callbacks.onTimeUpdate(this.audio.currentTime, this.audio.duration);
        }
      });

      this.audio.addEventListener('durationchange', () => {
        if (this.audio && !this.currentTrack?.youtubeId && isFinite(this.audio.duration) && this.audio.duration > 0) {
          this.callbacks.onTimeUpdate(this.audio.currentTime, this.audio.duration);
        }
      });

      this.audio.addEventListener('timeupdate', () => {
        if (this.audio && !this.currentTrack?.youtubeId) {
          const duration =
            isFinite(this.audio.duration) && this.audio.duration > 0
              ? this.audio.duration
              : this.currentTrack?.duration || 180;
          this.callbacks.onTimeUpdate(this.audio.currentTime, duration);
        }
      });

      this.audio.addEventListener('play', () => {
        if (!this.currentTrack?.youtubeId) {
          this.callbacks.onPlayStateChange(true);
        }
      });

      this.audio.addEventListener('pause', () => {
        if (!this.currentTrack?.youtubeId) {
          this.callbacks.onPlayStateChange(false);
        }
      });

      this.audio.addEventListener('ended', () => {
        if (!this.currentTrack?.youtubeId) {
          this.callbacks.onPlayStateChange(false);
          this.callbacks.onEnded();
        }
      });

      this.audio.addEventListener('error', (e) => {
        if (!this.currentTrack?.youtubeId) {
          console.warn('Audio tag error:', e);
          // If proxy stream failed, try direct src as fallback
          if (this.audio && this.audio.src && this.audio.src.includes('/api/audio/stream') && this.currentTrack?.audioUrl) {
            console.log('Falling back to direct audioUrl...');
            this.audio.src = this.currentTrack.audioUrl;
            this.audio.load();
            this.audio.play().catch(() => {});
            return;
          }
          this.callbacks.onError('خطا در پخش فایل صوتی');
        }
      });
    }
  }

  public setCallbacks(callbacks: AudioEngineCallbacks) {
    this.callbacks = callbacks;
  }

  public async playTrack(track: Track): Promise<void> {
    this.currentTrack = track;

    // If it's a YouTube track, HTML5 audio must NOT play
    if (track.youtubeId) {
      if (this.audio) {
        this.audio.pause();
        this.audio.removeAttribute('src');
        this.audio.load();
      }
      // YouTube player component handles playback
      this.callbacks.onPlayStateChange(true);
      return;
    }

    // Standard catalog track or direct MP3
    if (!this.audio) return;

    try {
      const offlineUrl = await getDownloadedAudioUrl(track.id);
      let targetSrc = offlineUrl || track.audioUrl;

      // If remote external MP3 and not cached offline, route through audio proxy for HTTP Range & zero-cutoff streaming
      if (!offlineUrl && targetSrc.startsWith('http') && !targetSrc.includes('/api/audio/stream')) {
        targetSrc = `/api/audio/stream?url=${encodeURIComponent(targetSrc)}`;
      }

      this.audio.src = targetSrc;
      this.audio.load();

      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        await playPromise.catch((err) => {
          console.warn('HTML5 Audio play prevented:', err);
          this.callbacks.onError('عدم امکان پخش خودکار مرورگر');
        });
      }
    } catch (e: any) {
      console.warn('Playback error:', e);
      this.callbacks.onError(e.message || 'خطا در بارگذاری');
    }
  }

  public resume(): void {
    if (this.currentTrack?.youtubeId) {
      this.callbacks.onPlayStateChange(true);
    } else if (this.audio && this.audio.src) {
      this.audio.play().catch((e) => {
        console.warn('Resume failed:', e);
      });
    }
  }

  public pause(): void {
    if (this.currentTrack?.youtubeId) {
      this.callbacks.onPlayStateChange(false);
    } else if (this.audio) {
      this.audio.pause();
    }
    this.callbacks.onPlayStateChange(false);
  }

  public seek(timeInSeconds: number): void {
    if (!this.currentTrack?.youtubeId && this.audio && isFinite(this.audio.duration)) {
      this.audio.currentTime = timeInSeconds;
    }
  }

  public setVolume(volume: number): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.currentVolume;
    }
  }

  public getVolume(): number {
    return this.currentVolume;
  }
}

export const audioEngine = new AudioEngine();
