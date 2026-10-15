import React, { useState } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Heart,
  Download,
  Check,
  Volume2,
  VolumeX,
  ListMusic,
  FileText,
  Loader2,
  Share2,
  Youtube,
  Tv,
} from 'lucide-react';
import { Track } from '../types/music';

interface NowPlayingSheetProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  isLiked: boolean;
  isDownloaded: boolean;
  queue: Track[];
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onNext: () => void;
  onPrev: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleLike: (trackId: string) => void;
  onToggleDownload: (track: Track) => Promise<void>;
  onVolumeChange: (vol: number) => void;
  onSelectQueueTrack: (track: Track) => void;
}

export const NowPlayingSheet: React.FC<NowPlayingSheetProps> = ({
  isOpen,
  onClose,
  track,
  isPlaying,
  currentTime,
  duration,
  volume,
  isShuffle,
  repeatMode,
  isLiked,
  isDownloaded,
  queue,
  onPlayPause,
  onSeek,
  onNext,
  onPrev,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLike,
  onToggleDownload,
  onVolumeChange,
  onSelectQueueTrack,
}) => {
  const [activeTab, setActiveTab] = useState<'player' | 'lyrics' | 'queue'>('player');
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [showVideoEmbed, setShowVideoEmbed] = useState(false);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(parseFloat(e.target.value));
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    await onToggleDownload(track);
    setIsDownloading(false);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#050608]/90 backdrop-blur-3xl text-white overflow-hidden animate-in fade-in slide-in-from-bottom duration-300">
      {/* Dynamic Background Glow from Track */}
      <div
        className="absolute inset-0 opacity-25 filter blur-[120px] pointer-events-none scale-125 transition-all duration-1000"
        style={{
          backgroundImage: `url(${track.coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 py-3 shrink-0 border-b border-white/[0.08] relative z-10">
        <button
          onClick={onClose}
          className="p-2 -mr-2 text-white/60 hover:text-white transition-colors"
          title="بستن صفحه پلیر"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center min-w-0">
          <p className="text-[10px] font-bold tracking-wider text-white/50 uppercase">
            {track.youtubeId ? 'پخش مستقیم از یوتیوب' : 'در حال پخش از آلبوم'}
          </p>
          <p className="text-xs font-bold text-white truncate max-w-[220px]">
            {track.album || track.genre}
          </p>
        </div>

        <button
          onClick={handleShare}
          className="p-2 -ml-2 text-white/60 hover:text-white transition-colors relative"
          title="اشتراک‌گذاری"
        >
          <Share2 className="w-5 h-5" />
          {copiedToast && (
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#1ed760] text-black text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-md">
              لینک کپی شد
            </span>
          )}
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col justify-between max-w-lg mx-auto w-full relative z-10">
        {activeTab === 'player' && (
          <div className="flex flex-col items-center my-auto w-full">
            {/* Visual Frame: Cover Art / YouTube Frame Anchor */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-[20px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] liquid-glass my-3 group border border-white/10">
              <img
                src={track.coverUrl}
                alt={track.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-100' : 'scale-95 opacity-90'
                }`}
              />
              {track.youtubeId && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-end p-4 text-center">
                  <div className="bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                    <Youtube className="w-4 h-4" />
                    <span>پخش زنده ویدیو یوتیوب</span>
                  </div>
                </div>
              )}
            </div>

            {/* Title & Artist & Action Icons */}
            <div className="w-full flex items-center justify-between mt-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold truncate text-white">
                    {track.title}
                  </h2>
                  {track.isFullSong && (
                    <span className="bg-[#1ed760]/20 text-[#1ed760] border border-[#1ed760]/40 text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 flex items-center gap-1">
                      <span>🎵</span>
                      <span>آهنگ کامل ۳۲۰</span>
                    </span>
                  )}
                  {track.isPreview && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0">
                      پیش‌نمایش
                    </span>
                  )}
                  {track.youtubeId && (
                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0">
                      YouTube
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-[#b3b3b3] mt-1">
                  <span className="truncate">{track.artist}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-xs text-[#73777c]">{track.genre}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className={`p-2.5 rounded-full transition-all ${
                    isDownloaded
                      ? 'text-[#1ed760] bg-[#1ed760]/15 border border-[#1ed760]/30 shadow-[0_0_15px_rgba(30,215,96,0.3)]'
                      : 'text-white/60 hover:text-white liquid-glass'
                  }`}
                  title={isDownloaded ? 'دانلود شده آفلاین' : 'دانلود آهنگ'}
                >
                  {isDownloading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#1ed760]" />
                  ) : isDownloaded ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={() => onToggleLike(track.id)}
                  className={`p-2.5 rounded-full transition-all ${
                    isLiked
                      ? 'text-[#1ed760] bg-[#1ed760]/15 border border-[#1ed760]/30 shadow-[0_0_15px_rgba(30,215,96,0.3)]'
                      : 'text-white/60 hover:text-white liquid-glass'
                  }`}
                  title="علاقه‌مندی"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isLiked ? 'fill-[#1ed760] text-[#1ed760]' : ''
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Scrubber Progress Slider */}
            <div className="w-full mt-6">
              <div className="relative group flex items-center">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.5"
                  value={currentTime}
                  onChange={handleSliderChange}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#1ed760] focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center text-xs text-white/50 mt-2 font-mono tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Controls Row */}
            <div className="w-full flex items-center justify-between mt-5">
              <button
                onClick={onToggleShuffle}
                className={`p-3 rounded-full transition-colors ${
                  isShuffle ? 'text-[#1ed760]' : 'text-white/40 hover:text-white'
                }`}
                title="پخش تصادفی"
              >
                <Shuffle className="w-5 h-5" />
              </button>

              <button
                onClick={onPrev}
                className="p-3 text-white hover:text-[#1ed760] transition-colors"
                title="آهنگ قبلی"
              >
                <SkipBack className="w-7 h-7" />
              </button>

              <button
                onClick={onPlayPause}
                className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-[0_4px_24px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-transform"
                title={isPlaying ? 'توقف' : 'پخش'}
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 fill-black" />
                ) : (
                  <Play className="w-8 h-8 fill-black ml-1" />
                )}
              </button>

              <button
                onClick={onNext}
                className="p-3 text-white hover:text-[#1ed760] transition-colors"
                title="آهنگ بعدی"
              >
                <SkipForward className="w-7 h-7" />
              </button>

              <button
                onClick={onToggleRepeat}
                className={`p-3 rounded-full transition-colors ${
                  repeatMode !== 'off'
                    ? 'text-[#1ed760]'
                    : 'text-white/40 hover:text-white'
                }`}
                title={`تکرار (${repeatMode})`}
              >
                <Repeat className="w-5 h-5" />
              </button>
            </div>

            {/* Volume Control Slider */}
            <div className="w-full flex items-center gap-3 mt-5 px-4 py-2 liquid-glass rounded-full border border-white/10">
              <button
                onClick={() => onVolumeChange(volume > 0 ? 0 : 0.8)}
                className="text-white/60 hover:text-white"
              >
                {volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#1ed760]"
              />
              <span className="text-[10px] text-white/60 font-mono tabular-nums w-8 text-left">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Lyrics */}
        {activeTab === 'lyrics' && (
          <div className="flex-1 overflow-y-auto py-4 px-2 text-center space-y-4">
            <h3 className="text-lg font-bold text-white mb-6">متن ترانه (Lyrics)</h3>
            {track.lyrics && track.lyrics.length > 0 ? (
              track.lyrics.map((line, i) => (
                <p
                  key={i}
                  className="text-base sm:text-lg leading-relaxed text-[#c5c5c5] hover:text-[#1ed760] transition-colors"
                >
                  {line}
                </p>
              ))
            ) : (
              <div className="py-12 text-[#b3b3b3]">
                <p className="text-sm">متن همگام برای این موزیک در دسترس نیست.</p>
                <p className="text-xs text-[#73777c] mt-1">
                  پخش صوتی بدون وقفه در حال اجراست.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Queue */}
        {activeTab === 'queue' && (
          <div className="flex-1 overflow-y-auto py-2">
            <h3 className="text-base font-bold text-white mb-3">صف پخش ({queue.length})</h3>
            <div className="space-y-1">
              {queue.map((qTrack, i) => (
                <div
                  key={qTrack.id}
                  onClick={() => onSelectQueueTrack(qTrack)}
                  className={`flex items-center gap-3 p-2.5 rounded-[10px] cursor-pointer transition-all ${
                    qTrack.id === track.id
                      ? 'liquid-glass-elevated text-[#1ed760]'
                      : 'hover:bg-white/[0.05] text-white'
                  }`}
                >
                  <span className="text-xs text-[#b3b3b3] font-mono w-4">{i + 1}</span>
                  <img
                    src={qTrack.coverUrl}
                    alt={qTrack.title}
                    className="w-10 h-10 rounded-[6px] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{qTrack.title}</p>
                    <p className="text-[11px] text-[#b3b3b3] truncate">{qTrack.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Selector Footer */}
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-white/10 shrink-0">
          <button
            onClick={() => setActiveTab('player')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'player'
                ? 'bg-white text-black shadow-md'
                : 'liquid-glass text-white/60 hover:text-white'
            }`}
          >
            پلیر اصلی
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'lyrics'
                ? 'bg-white text-black shadow-md'
                : 'liquid-glass text-white/60 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            متن آهنگ
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'queue'
                ? 'bg-white text-black shadow-md'
                : 'liquid-glass text-white/60 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            صف پخش ({queue.length})
          </button>
        </div>
      </div>
    </div>
  );
};
