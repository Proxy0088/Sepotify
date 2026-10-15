import React from 'react';
import { Home, Search, Library, Sparkles, DownloadCloud } from 'lucide-react';

export type TabDestination = 'home' | 'search' | 'library' | 'discover' | 'offline';

interface BottomTabBarProps {
  currentTab: TabDestination;
  onTabChange: (tab: TabDestination) => void;
  downloadCount: number;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentTab,
  onTabChange,
  downloadCount,
}) => {
  const tabs = [
    { id: 'home' as TabDestination, label: 'خانه', icon: Home },
    { id: 'search' as TabDestination, label: 'جستجو', icon: Search },
    { id: 'discover' as TabDestination, label: 'پیشنهادی', icon: Sparkles },
    { id: 'library' as TabDestination, label: 'کتابخانه', icon: Library },
    {
      id: 'offline' as TabDestination,
      label: 'آفلاین',
      icon: DownloadCloud,
      badge: downloadCount > 0 ? downloadCount : undefined,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 liquid-glass-elevated border-t border-white/[0.1] px-2 py-1 select-none backdrop-blur-2xl">
      <div className="grid grid-cols-5 items-center h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-all relative ${
                isActive ? 'text-[#1ed760]' : 'text-white/40 hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.5px]' : 'stroke-2'
                  }`}
                />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-[#1ed760] text-black text-[9px] font-bold px-1 rounded-full min-w-3.5 h-3.5 flex items-center justify-center shadow-[0_0_8px_rgba(30,215,96,0.6)]">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight mt-1 font-medium transition-colors ${
                  isActive ? 'text-white font-bold' : ''
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-[#1ed760] mt-0.5 shadow-[0_0_6px_#1ed760]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
