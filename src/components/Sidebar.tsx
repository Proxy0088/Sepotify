import React from 'react';
import {
  Home,
  Search,
  Library,
  PlusSquare,
  Heart,
  DownloadCloud,
  Sparkles,
  Music2,
} from 'lucide-react';
import { TabDestination } from './BottomTabBar';
import { Playlist } from '../types/music';

interface SidebarProps {
  currentTab: TabDestination;
  onTabChange: (tab: TabDestination) => void;
  playlists: Playlist[];
  activePlaylistId: string | null;
  onSelectPlaylist: (playlist: Playlist) => void;
  onCreatePlaylist: () => void;
  likedCount: number;
  downloadCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  playlists,
  activePlaylistId,
  onSelectPlaylist,
  onCreatePlaylist,
  likedCount,
  downloadCount,
}) => {
  return (
    <aside className="w-64 bg-[#000000] h-full flex flex-col p-4 select-none shrink-0 border-l border-[#222222]">
      {/* Brand Logo */}
      <div className="flex items-center gap-2.5 px-3 py-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-[#1ed760] flex items-center justify-center text-black font-extrabold shadow-md">
          <svg className="w-5 h-5 fill-black" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.435-5.308-1.76-8.793-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.496 9.722 1.115.294.18.386.562.207.855zm1.225-2.724c-.227.368-.712.483-1.08.256-2.69-1.653-6.79-2.131-9.97-1.165-.413.125-.85-.108-.975-.521-.125-.413.108-.85.52-975 3.633-1.103 8.147-.568 11.25 1.326.368.226.482.712.255 1.079zm.105-2.835C14.692 8.95 8.085 8.729 4.24 9.897c-.494.15-1.02-.128-1.17-.622-.15-.494.128-1.02.622-1.17 4.417-1.34 11.67-1.08 15.38 1.122.444.263.59.84.327 1.284-.264.444-.84.59-1.285.327z" />
          </svg>
        </div>
        <span className="text-lg font-bold tracking-tight text-white font-sans">
          Spotify
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-1 mb-6">
        <button
          onClick={() => onTabChange('home')}
          className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-[6px] text-sm font-semibold transition-colors ${
            currentTab === 'home'
              ? 'bg-[#1f1f1f] text-white'
              : 'text-[#b3b3b3] hover:text-white'
          }`}
        >
          <Home className={`w-5 h-5 ${currentTab === 'home' ? 'text-[#1ed760]' : ''}`} />
          <span>خانه</span>
        </button>

        <button
          onClick={() => onTabChange('search')}
          className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-[6px] text-sm font-semibold transition-colors ${
            currentTab === 'search'
              ? 'bg-[#1f1f1f] text-white'
              : 'text-[#b3b3b3] hover:text-white'
          }`}
        >
          <Search className={`w-5 h-5 ${currentTab === 'search' ? 'text-[#1ed760]' : ''}`} />
          <span>جستجوی سریع</span>
        </button>

        <button
          onClick={() => onTabChange('discover')}
          className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-[6px] text-sm font-semibold transition-colors ${
            currentTab === 'discover'
              ? 'bg-[#1f1f1f] text-white'
              : 'text-[#b3b3b3] hover:text-white'
          }`}
        >
          <Sparkles className={`w-5 h-5 ${currentTab === 'discover' ? 'text-[#1ed760]' : ''}`} />
          <span>پیشنهادهای هوشمند</span>
        </button>

        <button
          onClick={() => onTabChange('library')}
          className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-[6px] text-sm font-semibold transition-colors ${
            currentTab === 'library'
              ? 'bg-[#1f1f1f] text-white'
              : 'text-[#b3b3b3] hover:text-white'
          }`}
        >
          <Library className={`w-5 h-5 ${currentTab === 'library' ? 'text-[#1ed760]' : ''}`} />
          <span>کتابخانه شما</span>
        </button>
      </nav>

      {/* Library Actions */}
      <div className="pt-4 border-t border-[#222222] space-y-1">
        <button
          onClick={onCreatePlaylist}
          className="w-full flex items-center gap-3.5 px-3 py-2 rounded-[6px] text-sm font-medium text-[#b3b3b3] hover:text-white transition-colors group"
        >
          <div className="w-6 h-6 rounded bg-[#b3b3b3] group-hover:bg-white text-black flex items-center justify-center transition-colors">
            <PlusSquare className="w-4 h-4 fill-black text-black" />
          </div>
          <span>ساخت لیست پخش جدید</span>
        </button>

        <button
          onClick={() => onTabChange('library')}
          className="w-full flex items-center gap-3.5 px-3 py-2 rounded-[6px] text-sm font-medium text-[#b3b3b3] hover:text-white transition-colors group"
        >
          <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-700 to-purple-400 text-white flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 fill-white" />
          </div>
          <span className="flex-1 text-right">آهنگ‌های پسندیده‌شده</span>
          {likedCount > 0 && (
            <span className="text-[11px] text-[#73777c] font-mono tabular-nums">
              {likedCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onTabChange('offline')}
          className={`w-full flex items-center gap-3.5 px-3 py-2 rounded-[6px] text-sm font-medium transition-colors ${
            currentTab === 'offline'
              ? 'bg-[#1f1f1f] text-white'
              : 'text-[#b3b3b3] hover:text-white'
          }`}
        >
          <div className="w-6 h-6 rounded bg-emerald-900 text-[#1ed760] flex items-center justify-center">
            <DownloadCloud className="w-3.5 h-3.5" />
          </div>
          <span className="flex-1 text-right">موزیک‌های دانلودشده</span>
          {downloadCount > 0 && (
            <span className="text-[11px] text-[#1ed760] font-mono tabular-nums">
              {downloadCount}
            </span>
          )}
        </button>
      </div>

      {/* Playlists List */}
      <div className="mt-4 pt-4 border-t border-[#222222] flex-1 overflow-y-auto">
        <p className="px-3 text-[11px] font-semibold tracking-wider text-[#73777c] uppercase mb-2">
          لیست‌های پخش
        </p>
        <div className="space-y-0.5">
          {playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => onSelectPlaylist(pl)}
              className={`w-full text-right px-3 py-1.5 rounded-[4px] text-xs truncate transition-colors ${
                activePlaylistId === pl.id
                  ? 'text-[#1ed760] font-semibold bg-[#1a1a1a]'
                  : 'text-[#b3b3b3] hover:text-white'
              }`}
            >
              {pl.name}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
