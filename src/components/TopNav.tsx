import React, { useRef } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Search,
  Wifi,
  WifiOff,
  Smartphone,
  Monitor,
  HelpCircle,
  Sparkles,
  Shield,
} from 'lucide-react';
import { TabDestination } from './BottomTabBar';

interface TopNavProps {
  currentTab: TabDestination;
  onTabChange: (tab: TabDestination) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isOfflineMode: boolean;
  onToggleOfflineMode: () => void;
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
  onOpenTestingGuide: () => void;
  onOpenNetworkProxy?: () => void;
  isVpnDetected?: boolean | null;
  onBack: () => void;
  onForward: () => void;
  canBack: boolean;
  canForward: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  isOfflineMode,
  onToggleOfflineMode,
  isMobileFrame,
  onToggleMobileFrame,
  onOpenTestingGuide,
  onOpenNetworkProxy,
  isVpnDetected,
  onBack,
  onForward,
  canBack,
  canForward,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="sticky top-0 z-30 liquid-glass px-3 sm:px-5 py-2.5 flex items-center justify-between gap-2.5 select-none border-b border-white/[0.08]">
      {/* Navigation Arrows */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onBack}
          disabled={!canBack}
          className={`w-8 h-8 rounded-full liquid-glass flex items-center justify-center transition-all ${
            canBack
              ? 'text-white hover:bg-white/10 active:scale-95'
              : 'text-white/20 cursor-not-allowed opacity-40'
          }`}
          title="بازگشت"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={onForward}
          disabled={!canForward}
          className={`w-8 h-8 rounded-full liquid-glass flex items-center justify-center transition-all ${
            canForward
              ? 'text-white hover:bg-white/10 active:scale-95'
              : 'text-white/20 cursor-not-allowed opacity-40'
          }`}
          title="جلو"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Center: Microkit Focus-Input Search Field */}
      <div className="flex-1 max-w-md mx-1 sm:mx-3">
        {currentTab === 'search' ? (
          <div className="liquid-focus-input-wrapper flex items-center px-3 py-1.5 transition-all">
            <Search className="w-4 h-4 text-[#1ed760] shrink-0 ml-2" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="جستجوی یوتیوب و آهنگ (نام آهنگ یا خواننده)..."
              autoFocus
              className="w-full bg-transparent text-white text-xs sm:text-sm outline-none placeholder:text-white/40 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-white/40 hover:text-white text-xs px-1.5 py-0.5 rounded-full"
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => onTabChange('search')}
            className="w-full liquid-glass hover:bg-white/[0.08] text-white/50 hover:text-white px-3.5 py-1.5 rounded-full text-xs flex items-center gap-2 transition-all border border-white/[0.08]"
          >
            <Search className="w-3.5 h-3.5 text-[#1ed760]" />
            <span className="truncate">جستجو و پخش زنده از یوتیوب و کاتالوگ...</span>
          </button>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Offline Mode Switch */}
        <button
          onClick={onToggleOfflineMode}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all ${
            isOfflineMode
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              : 'liquid-glass text-white/70 hover:text-white'
          }`}
          title={isOfflineMode ? 'قطع شبکه (آفلاین)' : 'شبیه‌ساز آنلاین/آفلاین'}
        >
          {isOfflineMode ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">آفلاین</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-[#1ed760]" />
              <span className="hidden sm:inline">آنلاین</span>
            </>
          )}
        </button>

        {/* Mobile View Toggle */}
        <button
          onClick={onToggleMobileFrame}
          className={`p-2 rounded-full transition-all ${
            isMobileFrame
              ? 'bg-[#1ed760] text-black shadow-[0_0_15px_rgba(30,215,96,0.5)]'
              : 'liquid-glass text-white/70 hover:text-white'
          }`}
          title={isMobileFrame ? 'نمای تمام‌صفحه وب' : 'قاب گوشی هوشمند'}
        >
          {isMobileFrame ? (
            <Smartphone className="w-3.5 h-3.5" />
          ) : (
            <Monitor className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Auto-detected Network & Proxy Status Button */}
        {onOpenNetworkProxy && (
          <button
            onClick={onOpenNetworkProxy}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full liquid-glass text-[11px] font-medium transition-all ${
              isVpnDetected
                ? 'border border-[#1ed760]/50 text-[#1ed760] shadow-[0_0_12px_rgba(30,215,96,0.2)]'
                : 'text-white/70 hover:text-white'
            }`}
            title={
              isVpnDetected
                ? 'فیلترشکن خودکار شناسایی شد (یوتیوب متصل است)'
                : 'اتصال مستقیم (بدون فیلترشکن)'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isVpnDetected === true
                  ? 'bg-[#1ed760] animate-pulse'
                  : isVpnDetected === false
                  ? 'bg-amber-400'
                  : 'bg-white/30'
              }`}
            />
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isVpnDetected === true
                ? 'VPN خودکار فعال'
                : isVpnDetected === false
                ? 'مستقیم (آزاد)'
                : 'بررسی VPN...'}
            </span>
          </button>
        )}

        {/* Planning & Testing Guide Modal Button */}
        <button
          onClick={onOpenTestingGuide}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white text-black hover:bg-white/90 text-xs font-bold transition-all shadow-md active:scale-95"
          title="راهنمای تست و برنامه‌ریزی"
        >
          <Sparkles className="w-3.5 h-3.5 text-black" />
          <span className="hidden md:inline">راهنمای تست</span>
        </button>
      </div>
    </header>
  );
};
