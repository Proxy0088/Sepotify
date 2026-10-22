import React, { useState } from 'react';
import { Play, Pause, Heart, Download, Check, Loader2, Youtube } from 'lucide-react';
import { Track } from '../types/music';

interface TrackRowProps {
  track: Track;
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  isLiked: boolean;
  isDownloaded: boolean;
  onPlay: (track: Track) => void;
  onToggleLike: (trackId: string) => void;
  onToggleDownload: (track: Track) => void;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  isCurrent,
  isPlaying,
  isLiked,
  isDownloaded,
  onPlay,
  onToggleLike,
  onToggleDownload,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    await onToggleDownload(track);
    setIsDownloading(false);
  };

  return (
    <div
      onClick={() => onPlay(track)}
      className={`group flex items-center justify-between px-3.5 py-2.5 rounded-[10px] transition-all duration-200 cursor-pointer ${
        isCurrent
          ? 'liquid-glass-elevated border-white/20 shadow-md'
          : 'hover:bg-white/[0.05] border border-transparent hover:border-white/5'
      }`}
    >
      {/* Left: Index / Equalizer */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-6 flex items-center justify-center shrink-0 text-xs text-[#b3b3b3]">
          {isCurrent && isPlaying ? (
            <div className="flex items-end gap-0.5 h-4">
              <span className="w-1 bg-[#1ed760] animate-eq-1 rounded-sm shadow-[0_0_6px_#1ed760]" />
              <span className="w-1 bg-[#1ed760] animate-eq-2 rounded-sm shadow-[0_0_6px_#1ed760]" />
              <span className="w-1 bg-[#1ed760] animate-eq-3 rounded-sm shadow-[0_0_6px_#1ed760]" />
            </div>
          ) : (
            <>
              <span className="group-hover:hidden tabular-nums">{index + 1}</span>
              <Play className="w-4 h-4 hidden group-hover:block text-white fill-white ml-0.5" />
            </>
          )}
        </div>

        {/* Cover */}
        <div className="relative w-11 h-11 rounded-[6px] overflow-hidden bg-black/40 border border-white/10 shrink-0">
          {!imgError ? (
            <img
              src={track.coverUrl}
              alt={track.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#292929] text-[10px] text-white">
              ♫
            </div>
          )}
          {track.youtubeId && (
            <span className="absolute bottom-0 right-0 bg-red-600/90 text-white p-0.5 rounded-tl-sm text-[8px]">
              <Youtube className="w-2.5 h-2.5" />
            </span>
          )}
        </div>

        {/* Title & Artist */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p
              className={`text-xs sm:text-sm font-semibold truncate ${
                isCurrent ? 'text-[#1ed760]' : 'text-white'
              }`}
            >
              {track.title}
            </p>
            {track.isAudius && (
              <span className="bg-purple-600/20 text-purple-300 border border-purple-500/40 text-[9px] px-1.5 py-0.5 rounded shrink-0 font-bold flex items-center gap-0.5">
                <span>💜 Audius</span>
              </span>
            )}
            {track.isAudius && !track.isDownloadable && (
              <span className="bg-white/5 text-[#a0a0a0] border border-white/10 text-[8px] px-1 py-0.5 rounded shrink-0">
                فقط استریم
              </span>
            )}
            {track.isAudius && track.isDownloadable && (
              <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[8px] px-1 py-0.5 rounded shrink-0">
                مجاز برای دانلود
              </span>
            )}
            {track.isFullSong && !track.isAudius && (
              <span className="bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/40 text-[9px] px-1.5 py-0.5 rounded shrink-0 font-bold flex items-center gap-0.5">
                <span>🎵 آهنگ کامل</span>
              </span>
            )}
            {track.isPreview && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] px-1.5 py-0.5 rounded shrink-0 font-medium">
                پیش‌نمایش
              </span>
            )}
            {track.isUnblocked && !track.isFullSong && !track.isAudius && (
              <span className="bg-[#1ed760]/15 text-[#1ed760] border border-[#1ed760]/30 text-[9px] px-1.5 py-0.5 rounded shrink-0 font-medium flex items-center gap-0.5">
                <span>⚡ بدون فیلترشکن</span>
              </span>
            )}
            {track.youtubeId && (
              <span className="bg-red-500/15 text-red-400 border border-red-500/30 text-[9px] px-1.5 py-0.5 rounded shrink-0 font-medium">
                YouTube
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#b3b3b3] truncate mt-0.5">
            <span className="truncate">{track.artist}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[11px] text-[#73777c]">{track.genre}</span>
          </div>
        </div>
      </div>

      {/* Right: Actions & Duration */}
      <div className="flex items-center gap-2.5 shrink-0 ml-2">
        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={`p-1.5 rounded-full transition-colors ${
            isDownloaded
              ? 'text-[#1ed760] hover:text-red-400'
              : track.isAudius && !track.isDownloadable
              ? 'text-white/20 hover:text-amber-400'
              : 'text-white/30 hover:text-white'
          }`}
          title={
            isDownloaded
              ? 'دانلود شده (حذف از آفلاین)'
              : track.isAudius && !track.isDownloadable
              ? 'دانلود توسط هنرمند مجاز نشده است (فقط پخش آنلاین)'
              : 'دانلود برای گوش دادن آفلاین'
          }
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#1ed760]" />
          ) : isDownloaded ? (
            <Check className="w-4 h-4 text-[#1ed760]" />
          ) : track.isAudius && !track.isDownloadable ? (
            <span className="text-[10px] opacity-60">🔒</span>
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>

        {/* Like Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike(track.id);
          }}
          className={`p-1.5 rounded-full transition-colors ${
            isLiked ? 'text-[#1ed760]' : 'text-white/30 hover:text-white'
          }`}
          title={isLiked ? 'حذف از لایک‌ها' : 'افزودن به علاقه‌مندی‌ها'}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#1ed760]' : ''}`} />
        </button>

        {/* Duration */}
        <span className="text-xs text-[#b3b3b3] tabular-nums w-10 text-left font-mono">
          {formatDuration(track.duration)}
        </span>
      </div>
    </div>
  );
};
