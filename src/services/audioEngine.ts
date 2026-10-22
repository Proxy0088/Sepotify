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
        if (this.audio && isFinite(this.audio.duration) && this.audio.duration > 0) {
          this.callbacks.onTimeUpdate(this.audio.currentTime, this.audio.duration);
        }
      });

      this.audio.addEventListener('durationchange', () => {
        if (this.audio && isFinite(this.audio.duration) && this.audio.duration > 0) {
          this.callbacks.onTimeUpdate(this.audio.currentTime, this.audio.duration);
        }
      });

      this.audio.addEventListener('timeupdate', () => {
        if (this.audio) {
          const duration =
            isFinite(this.audio.duration) && this.audio.duration > 0
              ? this.audio.duration
              : this.currentTrack?.duration || 180;
          this.callbacks.onTimeUpdate(this.audio.currentTime, duration);
        }
      });

      this.audio.addEventListener('play', () => {
        this.callbacks.onPlayStateChange(true);
      });

      this.audio.addEventListener('pause', () => {
        this.callbacks.onPlayStateChange(false);
      });

      this.audio.addEventListener('ended', () => {
        this.callbacks.onPlayStateChange(false);
        this.callbacks.onEnded();
      });

      this.audio.addEventListener('error', (e) => {
        console.warn('Audio tag error:', e);
        // If proxy stream failed, try direct src as fallback (only for non-YouTube direct audio links)
        if (
          this.audio &&
          this.audio.src &&
          this.audio.src.includes('/api/audio/stream') &&
          this.currentTrack?.audioUrl &&
          !this.currentTrack.audioUrl.includes('youtube.com') &&
          !this.currentTrack.audioUrl.includes('youtu.be')
        ) {
          console.log('Falling back to direct audioUrl...');
          this.audio.src = this.currentTrack.audioUrl;
          this.audio.load();
          this.audio.play().catch(() => {});
          return;
        }
        this.callbacks.onError('خطا در پخش فایل صوتی');
      });
    }
  }

  public setCallbacks(callbacks: AudioEngineCallbacks) {
    this.callbacks = callbacks;
  }

  public async playTrack(track: Track): Promise<void> {
    this.currentTrack = track;

    if (!this.audio) return;

    try {
      // Requirement 2: Check if track is streamable
      if (track.isStreamable === false) {
        this.callbacks.onError('این قطعه توسط هنرمند در Audius برای پخش آنلاین مجاز نشده است.');
        return;
      }

      // 1. Check if track is cached offline in IndexedDB
      const offlineUrl = await getDownloadedAudioUrl(track.id, track.audiusId || track.youtubeId);
      let targetSrc =
        (track.audioUrl?.startsWith('blob:') ? track.audioUrl : null) ||
        offlineUrl ||
        track.audioUrl;

      // 2. If this is an offline local blob, play directly with HTML5 audio
      if (targetSrc?.startsWith('blob:')) {
        this.audio.src = targetSrc;
        this.audio.load();
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
          await playPromise.catch((err) => {
            if (err?.name !== 'AbortError') {
              console.warn('HTML5 offline audio play prevented:', err);
              this.callbacks.onError('عدم امکان پخش خودکار مرورگر');
            }
          });
        }
        return;
      }

      // 3. If YouTube track without offline blob: let YouTube iframe engine handle it
      if (!offlineUrl && (track.youtubeId || targetSrc.includes('youtube.com') || targetSrc.includes('youtu.be'))) {
        this.audio.pause();
        return;
      }

      // 4. Remote Audius / MP3 stream:
      // Try direct stream first; if blocked by browser CORS / network, fallback through audio proxy
      this.audio.src = targetSrc;
      this.audio.load();

      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        await playPromise.catch(async (err) => {
          if (err?.name !== 'AbortError') {
            console.warn('HTML5 direct stream error, attempting proxy fallback:', err);
            if (!targetSrc.includes('/api/audio/stream') && targetSrc.startsWith('http') && this.audio) {
              try {
                this.audio.src = `/api/audio/stream?url=${encodeURIComponent(targetSrc)}`;
                this.audio.load();
                await this.audio.play();
              } catch (proxyErr: any) {
                if (proxyErr?.name !== 'AbortError') {
                  this.callbacks.onError('عدم امکان پخش استریم آهنگ. وضعیت اینترنت یا VPN خود را بررسی کنید.');
                }
              }
            } else {
              this.callbacks.onError('عدم امکان پخش خودکار مرورگر');
            }
          }
        });
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.warn('Playback error:', e);
        this.callbacks.onError(e.message || 'خطا در بارگذاری');
      }
    }
  }

  public resume(): void {
    if (this.audio && this.audio.src) {
      this.audio.play().catch((e) => {
        console.warn('Resume failed:', e);
      });
    }
  }

  public pause(): void {
    if (this.audio) {
      this.audio.pause();
    }
    this.callbacks.onPlayStateChange(false);
  }

  public seek(timeInSeconds: number): void {
    if (this.audio && isFinite(this.audio.duration)) {
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
