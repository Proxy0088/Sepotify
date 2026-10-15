import React, { useEffect, useRef, useState } from 'react';
import { Youtube, Minimize2, Maximize2, X, Music } from 'lucide-react';
import { Track } from '../types/music';

interface YouTubeAudioPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  seekTime: number | null;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onEnded: () => void;
  isSheetOpen: boolean;
}

export const YouTubeAudioPlayer: React.FC<YouTubeAudioPlayerProps> = ({
  currentTrack,
  isPlaying,
  volume,
  seekTime,
  onTimeUpdate,
  onPlayStateChange,
  onEnded,
  isSheetOpen,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [isPipMinimized, setIsPipMinimized] = useState(false);
  const lastVideoId = useRef<string | null>(null);

  const isYouTubeTrack = Boolean(currentTrack?.youtubeId);

  // Send postMessage command to YouTube iframe
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
    } catch (e) {
      console.warn('Failed to postMessage to YouTube:', e);
    }
  };

  // 1. Detect track change
  useEffect(() => {
    if (!isYouTubeTrack || !currentTrack?.youtubeId) {
      lastVideoId.current = null;
      setIsIframeLoaded(false);
      return;
    }

    if (lastVideoId.current !== currentTrack.youtubeId) {
      lastVideoId.current = currentTrack.youtubeId;
      setIsIframeLoaded(false);
    }
  }, [currentTrack?.youtubeId, isYouTubeTrack]);

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
          sendCommand('setVolume', [volume * 100]);
          if (isPlaying) {
            sendCommand('playVideo', []);
          }
        }

        if (data && data.event === 'infoDelivery' && data.info) {
          const info = data.info;

          // Current time update
          if (typeof info.currentTime === 'number') {
            const dur =
              typeof info.duration === 'number' && info.duration > 0
                ? info.duration
                : currentTrack?.duration || 210;
            onTimeUpdate(info.currentTime, dur);
          }

          // Player state: 1 = PLAYING, 2 = PAUSED, 0 = ENDED
          if (info.playerState === 1) {
            onPlayStateChange(true);
          } else if (info.playerState === 2) {
            onPlayStateChange(false);
          } else if (info.playerState === 0) {
            onPlayStateChange(false);
            onEnded();
          }
        }
      } catch {
        // Ignore parsing errors
      }
    };

    window.addEventListener('message', handleMessage);

    // Periodic time polling to ensure scrubber is always smooth
    const pollInterval = window.setInterval(() => {
      if (iframeRef.current && isPlaying) {
        sendCommand('getCurrentTime', []);
        sendCommand('getDuration', []);
      }
    }, 400);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(pollInterval);
    };
  }, [isYouTubeTrack, isPlaying, volume, currentTrack?.duration, onTimeUpdate, onPlayStateChange, onEnded]);

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

  // Use standard YouTube embed with autoplay and API enabled
  const embedUrl = `https://www.youtube-nocookie.com/embed/${currentTrack.youtubeId}?enablejsapi=1&autoplay=1&playsinline=1&controls=1&rel=0`;

  return (
    <div
      className={`fixed transition-all duration-300 ${
        isSheetOpen
          ? 'z-55 top-20 left-1/2 -translate-x-1/2 w-[280px] sm:w-[320px] h-[190px] sm:h-[220px] rounded-[18px] overflow-hidden liquid-glass-elevated border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.9)]'
          : isPipMinimized
          ? 'z-40 bottom-20 right-3 w-12 h-12 rounded-full overflow-hidden liquid-glass border border-red-500/40 shadow-xl flex items-center justify-center cursor-pointer'
          : 'z-40 bottom-20 right-3 w-48 sm:w-60 h-28 sm:h-36 rounded-[14px] overflow-hidden liquid-glass-elevated border border-white/20 shadow-2xl'
      }`}
    >
      {!isSheetOpen && isPipMinimized ? (
        <button
          onClick={() => setIsPipMinimized(false)}
          className="w-full h-full flex items-center justify-center text-red-500 hover:scale-110 transition-transform bg-black/80"
          title="نمایش پلیر ویدیو یوتیوب"
        >
          <Youtube className="w-6 h-6 animate-pulse" />
        </button>
      ) : (
        <div className="relative w-full h-full flex flex-col bg-black">
          {/* Top Pip Control Bar */}
          <div className="absolute top-1 left-1 right-1 z-10 flex items-center justify-between px-2.5 py-1 rounded-t-[10px] bg-black/80 backdrop-blur-md text-[10px] text-white">
            <span className="flex items-center gap-1.5 text-red-400 font-bold truncate max-w-[150px]">
              <Youtube className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="truncate">{currentTrack.title}</span>
            </span>
            {!isSheetOpen && (
              <button
                onClick={() => setIsPipMinimized(true)}
                className="p-1 hover:text-[#1ed760] transition-colors"
                title="کوچک کردن"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Genuine YouTube Iframe Player */}
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title={currentTrack.title}
            onLoad={() => {
              setIsIframeLoaded(true);
              setTimeout(() => {
                sendCommand('setVolume', [volume * 100]);
                if (isPlaying) {
                  sendCommand('playVideo', []);
                }
              }, 400);
            }}
            className="w-full h-full border-0 pt-5"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )}
    </div>
  );
};
