import React from 'react';
import { Play, Pause } from 'lucide-react';
import { Playlist, Track } from '../types/music';

interface QuickWidgetGridProps {
  playlists: Playlist[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayPlaylist: (playlist: Playlist) => void;
  greetingText: string;
}

export const QuickWidgetGrid: React.FC<QuickWidgetGridProps> = ({
  playlists,
  currentTrack,
  isPlaying,
  onPlayPlaylist,
  greetingText,
}) => {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>{greetingText}</span>
          <span className="w-2 h-2 rounded-full bg-[#1ed760] animate-pulse" />
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
        {playlists.slice(0, 6).map((playlist) => {
          const isPlaylistActive =
            currentTrack && playlist.trackIds.includes(currentTrack.id);

          return (
            <div
              key={playlist.id}
              onClick={() => onPlayPlaylist(playlist)}
              className="group relative flex items-center liquid-glass-card rounded-[10px] overflow-hidden cursor-pointer shadow-lg pr-0 pl-3 h-14 sm:h-16"
            >
              {/* Cover Art */}
              <div className="w-14 sm:w-16 h-full shrink-0 overflow-hidden relative">
                <img
                  src={playlist.coverUrl}
                  alt={playlist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/20 pointer-events-none" />
              </div>

              {/* Title & Track Count */}
              <div className="flex-1 px-3 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-white truncate leading-snug">
                  {playlist.name}
                </p>
                <span className="text-[11px] text-[#b3b3b3] truncate block mt-0.5">
                  {playlist.trackIds.length} قطعه موسیقی
                </span>
              </div>

              {/* Instant Play Button */}
              <div className="ml-1 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayPlaylist(playlist);
                  }}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-[0_4px_16px_rgba(30,215,96,0.5)] transition-all duration-200 ${
                    isPlaylistActive && isPlaying
                      ? 'opacity-100 scale-100'
                      : 'opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 scale-95 hover:scale-105'
                  }`}
                  title="پخش سریع"
                >
                  {isPlaylistActive && isPlaying ? (
                    <Pause className="w-4 h-4 fill-black" />
                  ) : (
                    <Play className="w-4 h-4 fill-black ml-0.5" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
