import React, { useEffect, useRef } from 'react';
import { Track } from '../types/music';

// Extend window for YouTube iframe API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubeAudioOnlyPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  seekTime: number | null;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onEnded: () => void;
  onPlaybackError?: (track: Track) => void;
}

export const YouTubeAudioOnlyPlayer: React.FC<YouTubeAudioOnlyPlayerProps> = ({
  currentTrack,
  isPlaying,
  volume,
  seekTime,
  onTimeUpdate,
  onPlayStateChange,
  onEnded,
  onPlaybackError,
}) => {
  const playerRef = useRef<any>(null);
  const isApiReadyRef = useRef<boolean>(false);
  const currentVideoIdRef = useRef<string | null>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  const isYouTubeTrack = Boolean(currentTrack?.youtubeId);

  // 1. Load the official YouTube Iframe API script once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.YT && window.YT.Player) {
      isApiReadyRef.current = true;
      return;
    }

    const existingScript = document.getElementById('youtube-iframe-api-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'youtube-iframe-api-script';
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => {
        console.warn('Failed to load YouTube iframe API script (network filtered)');
        if (currentTrack) onPlaybackError?.(currentTrack);
      };
      document.body.appendChild(script);

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        isApiReadyRef.current = true;
        if (typeof prevCallback === 'function') {
          prevCallback();
        }
      };
    }
  }, [currentTrack, onPlaybackError]);

  // Clean watchdog timer
  const clearWatchdog = () => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  };

  // 2. Initialize or switch video when currentTrack changes
  useEffect(() => {
    if (!isYouTubeTrack || !currentTrack?.youtubeId) {
      currentVideoIdRef.current = null;
      clearWatchdog();
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        try {
          playerRef.current.pauseVideo();
        } catch {
          // Ignore
        }
      }
      return;
    }

    const videoId = currentTrack.youtubeId;
    if (currentVideoIdRef.current === videoId && playerRef.current) {
      return;
    }

    currentVideoIdRef.current = videoId;
    clearWatchdog();

    // Watchdog: If playback doesn't start in 8s (e.g. YouTube blocked or requires bot check), trigger seamless audio fallback
    watchdogTimerRef.current = setTimeout(() => {
      console.warn('YouTube audio playback watchdog timed out for', videoId, 'triggering fallback');
      onPlaybackError?.(currentTrack);
    }, 8000);

    let retryCount = 0;
    const initOrLoadPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        retryCount++;
        if (retryCount > 25) {
          console.warn('Timed out waiting for YT API object');
          clearWatchdog();
          onPlaybackError?.(currentTrack);
          return;
        }
        setTimeout(initOrLoadPlayer, 200);
        return;
      }

      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        try {
          playerRef.current.loadVideoById({
            videoId,
            startSeconds: 0,
          });
          playerRef.current.unMute();
          playerRef.current.setVolume(Math.round(volume * 100));
          if (isPlaying) {
            playerRef.current.playVideo();
          }
          return;
        } catch (e) {
          console.warn('Error reusing YouTube player, recreating instance:', e);
          try {
            playerRef.current.destroy();
          } catch {
            // Ignore
          }
          playerRef.current = null;
        }
      }

      // Ensure host element exists in the container
      const container = document.getElementById('yt-audio-player-container');
      if (!container) return;

      let host = document.getElementById('yt-audio-player-host');
      if (!host) {
        host = document.createElement('div');
        host.id = 'yt-audio-player-host';
        container.appendChild(host);
      }

      try {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        playerRef.current = new window.YT.Player('yt-audio-player-host', {
          height: '320',
          width: '320',
          videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin,
          },
          events: {
            onReady: (event: any) => {
              try {
                event.target.unMute();
                event.target.setVolume(Math.round(volume * 100));
                if (isPlaying) {
                  event.target.playVideo();
                }
              } catch {
                // Ignore
              }
            },
            onStateChange: (event: any) => {
              // 1 = PLAYING
              if (event.data === 1) {
                clearWatchdog();
                onPlayStateChange(true);
              }
              // 2 = PAUSED
              else if (event.data === 2) {
                onPlayStateChange(false);
              }
              // 0 = ENDED
              else if (event.data === 0) {
                clearWatchdog();
                onPlayStateChange(false);
                onEnded();
              }
            },
            onError: (event: any) => {
              console.warn('YouTube Player error code:', event.data);
              clearWatchdog();
              // Error 100, 101, 150 = Cannot play in embedded player or robot check triggered
              onPlaybackError?.(currentTrack);
            },
          },
        });
      } catch (err) {
        console.warn('Failed to construct YT.Player:', err);
        clearWatchdog();
        onPlaybackError?.(currentTrack);
      }
    };

    initOrLoadPlayer();

    return () => {
      clearWatchdog();
    };
  }, [currentTrack?.youtubeId, isYouTubeTrack]);

  // 3. React to isPlaying changes
  useEffect(() => {
    if (!isYouTubeTrack || !playerRef.current) return;
    try {
      if (isPlaying) {
        if (typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
      } else {
        if (typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo();
        }
      }
    } catch {
      // Ignore
    }
  }, [isPlaying, isYouTubeTrack]);

  // 4. React to volume changes
  useEffect(() => {
    if (!isYouTubeTrack || !playerRef.current) return;
    try {
      if (typeof playerRef.current.setVolume === 'function') {
        playerRef.current.setVolume(Math.round(volume * 100));
      }
    } catch {
      // Ignore
    }
  }, [volume, isYouTubeTrack]);

  // 5. React to seekTime changes
  useEffect(() => {
    if (!isYouTubeTrack || !playerRef.current || seekTime === null) return;
    try {
      if (typeof playerRef.current.seekTo === 'function') {
        playerRef.current.seekTo(seekTime, true);
        if (isPlaying && typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
      }
    } catch {
      // Ignore
    }
  }, [seekTime, isYouTubeTrack, isPlaying]);

  // 6. Polling for Scrubber & Duration synchronization
  useEffect(() => {
    if (!isYouTubeTrack) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    pollTimerRef.current = window.setInterval(() => {
      if (!playerRef.current || !isPlaying) return;
      try {
        if (
          typeof playerRef.current.getCurrentTime === 'function' &&
          typeof playerRef.current.getDuration === 'function'
        ) {
          const cur = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration() || currentTrack?.duration || 210;
          if (typeof cur === 'number' && !isNaN(cur)) {
            onTimeUpdate(cur, dur);
          }
        }
      } catch {
        // Ignore
      }
    }, 500);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [isYouTubeTrack, isPlaying, currentTrack?.duration, onTimeUpdate]);

  // Pure audio engine: The player is rendered with valid computed dimensions (320x320)
  // so YouTube's anti-bot heuristics are satisfied, but placed far off-screen so
  // NO video frame is visible to the user. Pure Spotify-style audio!
  return (
    <div
      id="yt-audio-player-container"
      style={{
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        width: '320px',
        height: '320px',
        opacity: 0,
        pointerEvents: 'none',
        zIndex: -100,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      <div id="yt-audio-player-host" />
    </div>
  );
};
