import React from 'react';
import { Play, Pause, SkipForward, Heart, Check, Youtube } from 'lucide-react';
import { Track } from '../types/music';

interface MiniPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLiked: boolean;
  isDownloaded: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onToggleLike: (trackId: string) => void;
  onExpand: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  isLiked,
  isDownloaded,
  onPlayPause,
  onNext,
  onToggleLike,
  onExpand,
}) => {
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      onClick={onExpand}
      className="liquid-glass-elevated border-t border-white/[0.1] hover:bg-white/[0.08] transition-all cursor-pointer select-none relative backdrop-blur-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
    >
      {/* Top Thin Progress Bar */}
      <div className="w-full h-1 bg-white/10 relative overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#1ed760] to-emerald-400 transition-all duration-300 shadow-[0_0_8px_rgba(30,215,96,0.8)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="px-3.5 py-2 flex items-center justify-between gap-3 h-14">
        {/* Left: Cover Thumbnail & Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative w-10 h-10 rounded-[8px] overflow-hidden bg-black/40 border border-white/10 shrink-0 shadow-md">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className={`w-full h-full object-cover ${isPlaying ? 'scale-105' : ''} transition-transform`}
            />
            {currentTrack.youtubeId && (
              <span className="absolute top-0.5 right-0.5 bg-red-600/90 text-white p-0.5 rounded-full shadow-sm">
                <Youtube className="w-2.5 h-2.5" />
              </span>
            )}
            {isDownloaded && (
              <span className="absolute bottom-0 right-0 bg-black/80 rounded-tl-sm p-0.5 text-[#1ed760]">
                <Check className="w-2.5 h-2.5" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-xs sm:text-sm font-semibold text-white truncate leading-tight">
                {currentTrack.title}
              </p>
              {currentTrack.youtubeId && (
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] px-1 rounded font-bold shrink-0">
                  YouTube
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#b3b3b3] truncate mt-0.5">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div
          className="flex items-center gap-1.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onToggleLike(currentTrack.id)}
            className="p-2 text-white/50 hover:text-[#1ed760] transition-colors"
            title="علاقه‌مندی"
          >
            <Heart
              className={`w-4 h-4 ${
                isLiked ? 'fill-[#1ed760] text-[#1ed760]' : ''
              }`}
            />
          </button>

          <button
            onClick={onPlayPause}
            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-[0_2px_12px_rgba(255,255,255,0.3)]"
            title={isPlaying ? 'توقف' : 'پخش'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black" />
            ) : (
              <Play className="w-4 h-4 fill-black ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-2 text-white/50 hover:text-white transition-colors"
            title="آهنگ بعدی"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
