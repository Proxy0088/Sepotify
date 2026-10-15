import React, { useState } from 'react';
import { Play, Pause, Heart, Check, Youtube } from 'lucide-react';
import { Track } from '../types/music';

interface TrackCardProps {
  track: Track;
  isPlaying: boolean;
  isCurrent: boolean;
  isLiked: boolean;
  isDownloaded: boolean;
  onPlay: (track: Track) => void;
  onToggleLike: (trackId: string) => void;
  onToggleDownload: (track: Track) => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  isPlaying,
  isCurrent,
  isLiked,
  isDownloaded,
  onPlay,
  onToggleLike,
  onToggleDownload,
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onClick={() => onPlay(track)}
      className="group relative liquid-glass-card p-3 rounded-[12px] transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      {/* Cover Image */}
      <div className="relative aspect-square w-full rounded-[8px] overflow-hidden bg-black/40 shadow-md border border-white/5">
        {!imgError ? (
          <img
            src={track.coverUrl}
            alt={track.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1ed760]/20 to-black p-2 text-center">
            <span className="text-xs font-semibold text-white truncate max-w-full">{track.title}</span>
            <span className="text-[10px] text-[#b3b3b3]">{track.genre}</span>
          </div>
        )}

        {/* Floating Play Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay(track);
          }}
          className={`absolute bottom-2.5 left-2.5 w-10 h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-[0_4px_18px_rgba(30,215,96,0.6)] transition-all duration-300 ${
            isCurrent && isPlaying
              ? 'opacity-100 scale-100'
              : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 scale-95 hover:scale-105'
          }`}
          title={isCurrent && isPlaying ? 'توقف' : 'پخش'}
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-5 h-5 fill-black" />
          ) : (
            <Play className="w-5 h-5 fill-black ml-0.5" />
          )}
        </button>

        {/* YouTube or Download Badge */}
        {track.youtubeId && (
          <div className="absolute top-2 left-2 bg-red-600/90 backdrop-blur-md rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white flex items-center gap-1 shadow-md">
            <Youtube className="w-2.5 h-2.5" />
            <span>YT</span>
          </div>
        )}

        {isDownloaded && (
          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md rounded-full p-1 text-[#1ed760] shadow-sm">
            <Check className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-3">
        <div className="flex items-center justify-between gap-1">
          <h4
            className={`text-sm font-semibold truncate ${
              isCurrent ? 'text-[#1ed760]' : 'text-white'
            }`}
          >
            {track.title}
          </h4>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike(track.id);
            }}
            className="p-1 text-white/40 hover:text-[#1ed760] transition-colors"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                isLiked ? 'fill-[#1ed760] text-[#1ed760]' : ''
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#b3b3b3] mt-1 truncate">
          <span className="truncate">{track.artist}</span>
          <span aria-hidden="true">·</span>
          <span className="text-[11px] text-[#73777c]">{track.genre}</span>
        </div>
      </div>
    </div>
  );
};
