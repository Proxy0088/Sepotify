import React, { useEffect, useRef, useState } from 'react';
import { Youtube, Music, Eye, EyeOff, AlertCircle, RefreshCw, X } from 'lucide-react';
import { Track } from '../types/music';

interface YouTubePlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  seekTime: number | null;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onEnded: () => void;
  onFallbackAudio?: (track: Track) => void;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  currentTrack,
  isPlaying,
  volume,
  seekTime,
  onTimeUpdate,
  onPlayStateChange,
  onEnded,
  onFallbackAudio,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [isAudioOnlyMode, setIsAudioOnlyMode] = useState(true); // Default: Pure audio mode (no video visible!)
  const [hasPlaybackStarted, setHasPlaybackStarted] = useState(false);
  const [botCheckDetected, setBotCheckDetected] = useState(false);
  const lastVideoId = useRef<string | null>(null);
  const playTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isYouTubeTrack = Boolean(currentTrack?.youtubeId);

  // Send command to YouTube iframe via postMessage
  const sendCommand = (func: string, args: any[] = []) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func,
          args,
        }),
        '*'
      );
    } catch {
      // Ignore
    }
  };

  // 1. Detect track change
  useEffect(() => {
    if (!isYouTubeTrack || !currentTrack?.youtubeId) {
      lastVideoId.current = null;
      setIsIframeLoaded(false);
      setHasPlaybackStarted(false);
      setBotCheckDetected(false);
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
      return;
    }

    if (lastVideoId.current !== currentTrack.youtubeId) {
      lastVideoId.current = currentTrack.youtubeId;
      setIsIframeLoaded(false);
      setHasPlaybackStarted(false);
      setBotCheckDetected(false);

      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
      // Watchdog: If playback doesn't start in 6 seconds (bot check or region block)
      playTimeoutRef.current = setTimeout(() => {
        if (!hasPlaybackStarted) {
          console.warn('YouTube playback timed out, possibly blocked by bot check.');
          setBotCheckDetected(true);
        }
      }, 6000);
    }

    return () => {
      if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    };
  }, [currentTrack?.youtubeId, isYouTubeTrack, hasPlaybackStarted]);

  // 2. Setup message listener for YouTube player state & time updates
  useEffect(() => {
    if (!isYouTubeTrack) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        let data = event.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch {
            return;
          }
        }

        if (data && data.event === 'initialDelivery') {
          sendCommand('addEventListener', ['onStateChange']);
          sendCommand('addEventListener', ['onError']);
          sendCommand('setVolume', [volume * 100]);
          if (isPlaying) {
            sendCommand('playVideo', []);
          }
        }

        // Handle error codes: 101/150 = bot check or embed restricted by owner
        if (data && data.event === 'onError') {
          console.warn('YouTube player error:', data.info);
          setBotCheckDetected(true);
          return;
        }

        if (data && data.event === 'infoDelivery' && data.info) {
          const info = data.info;

          // Time update
          if (typeof info.currentTime === 'number') {
            const dur =
              typeof info.duration === 'number' && info.duration > 0
                ? info.duration
                : currentTrack?.duration || 210;
            onTimeUpdate(info.currentTime, dur);
          }

          // Player state: 1 = PLAYING, 2 = PAUSED, 0 = ENDED
          if (info.playerState === 1) {
            setHasPlaybackStarted(true);
            setBotCheckDetected(false);
            if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
            onPlayStateChange(true);
          } else if (info.playerState === 2) {
            onPlayStateChange(false);
          } else if (info.playerState === 0) {
            onPlayStateChange(false);
            onEnded();
          }
        }
      } catch {
        // Ignore
      }
    };

    window.addEventListener('message', handleMessage);

    // Periodic scrubber sync
    const pollInterval = window.setInterval(() => {
      if (iframeRef.current && isPlaying) {
        sendCommand('getCurrentTime', []);
        sendCommand('getDuration', []);
      }
    }, 450);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(pollInterval);
    };
  }, [isYouTubeTrack, isPlaying, volume, currentTrack, onTimeUpdate, onPlayStateChange, onEnded]);

  // 3. React to isPlaying changes
  useEffect(() => {
    if (!isYouTubeTrack || !isIframeLoaded) return;
    if (isPlaying) {
      sendCommand('playVideo', []);
    } else {
      sendCommand('pauseVideo', []);
    }
  }, [isPlaying, isYouTubeTrack, isIframeLoaded]);

  // 4. React to volume changes
  useEffect(() => {
    if (!isYouTubeTrack || !isIframeLoaded) return;
    sendCommand('setVolume', [Math.round(volume * 100)]);
  }, [volume, isYouTubeTrack, isIframeLoaded]);

  // 5. React to seekTime changes
  useEffect(() => {
    if (!isYouTubeTrack || !isIframeLoaded || seekTime === null) return;
    sendCommand('seekTo', [seekTime, true]);
    if (isPlaying) {
      sendCommand('playVideo', []);
    }
  }, [seekTime, isYouTubeTrack, isIframeLoaded, isPlaying]);

  if (!isYouTubeTrack || !currentTrack?.youtubeId) {
    return null;
  }

  // Standard www.youtube.com embed with origin and autoplay (avoids cookie-stripping bot-detection)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const embedUrl = `https://www.youtube.com/embed/${currentTrack.youtubeId}?enablejsapi=1&autoplay=1&playsinline=1&controls=0&rel=0&origin=${encodeURIComponent(origin)}`;

  return (
    <div
      className="fixed bottom-24 right-3 z-40 transition-all duration-300 w-56 sm:w-64 h-32 rounded-[18px] overflow-hidden liquid-glass-elevated border border-white/20 shadow-2xl"
      dir="rtl"
    >
      <div className="relative w-full h-full bg-black flex flex-col">
        {/* Top Header Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-2.5 py-1.5 bg-black/80 backdrop-blur-md border-b border-white/10 text-[10px] text-white">
          <div className="flex items-center gap-1.5 truncate max-w-[150px]">
            <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="truncate font-medium">{currentTrack.title}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Audio-Only / Video Toggle */}
            <button
              onClick={() => setIsAudioOnlyMode((v) => !v)}
              className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title={isAudioOnlyMode ? 'مشاهده تصویر ویدیو' : 'حالت فقط صوتی (مخفی کردن ویدیو)'}
            >
              {isAudioOnlyMode ? (
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-white/50" />
              )}
            </button>
          </div>
        </div>

        {/* 1. Underlying Legitimate YouTube Iframe (gives Chrome active media session so audio plays!) */}
        <div className="w-full h-full pt-6">
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title={currentTrack.title}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture"
            onLoad={() => {
              setIsIframeLoaded(true);
              setTimeout(() => {
                sendCommand('setVolume', [volume * 100]);
                if (isPlaying) {
                  sendCommand('playVideo', []);
                }
              }, 350);
            }}
          />
        </div>

        {/* 2. Audio-Only Visual Overlay (hides the video box with gorgeous album art when Audio-Only mode is active!) */}
        {isAudioOnlyMode && (
          <div className="absolute inset-0 z-10 pt-6 bg-black flex items-center gap-3 px-3">
            {/* Album Cover */}
            <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg border border-white/10 shrink-0 bg-black/60 relative">
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="flex items-center gap-0.5">
                    <span className="w-1 h-3 bg-[#1ed760] rounded-full animate-bounce" />
                    <span className="w-1 h-5 bg-[#1ed760] rounded-full animate-bounce delay-100" />
                    <span className="w-1 h-2 bg-[#1ed760] rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-[10px] text-[#1ed760] font-bold">
                <Music className="w-3 h-3 shrink-0" />
                <span>حالت فقط صوتی</span>
              </div>
              <h4 className="text-xs font-bold text-white truncate mt-0.5">{currentTrack.title}</h4>
              <p className="text-[10px] text-white/60 truncate">{currentTrack.artist}</p>
            </div>
          </div>
        )}

        {/* 3. Bot-Check Warning & Fallback Banner (Triggered if YouTube blocks embed) */}
        {botCheckDetected && (
          <div className="absolute inset-0 z-30 bg-black/95 p-3 flex flex-col justify-between text-xs text-amber-200 animate-in fade-in duration-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300 text-[11px]">یوتیوب پخش ویدیو را محدود کرد</p>
                <p className="text-[10px] text-white/70 mt-0.5">
                  به دلیل فیلترشکن، یوتیوب نیاز به تایید ربات دارد.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {onFallbackAudio && (
                <button
                  onClick={() => onFallbackAudio(currentTrack)}
                  className="flex-1 py-1.5 px-2 bg-[#1ed760] hover:bg-[#1ed760]/90 text-black font-bold text-[10px] rounded-lg shadow-md transition-all text-center"
                >
                  پخش مستقیم نسخه صوتی (MP3)
                </button>
              )}
              <button
                onClick={() => {
                  setBotCheckDetected(false);
                  sendCommand('playVideo', []);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="تلاش مجدد"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
