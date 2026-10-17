/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  Heart,
  Plus,
  Sparkles,
  DownloadCloud,
  Search,
  Music,
  ArrowRight,
  WifiOff,
  Flame,
  Radio,
  Clock,
  Compass,
  Youtube,
  Loader2,
  Tv,
  Shield,
  Globe,
} from 'lucide-react';
import { Track, Playlist, Genre } from './types/music';
import {
  MOCK_TRACKS,
  MOCK_PLAYLISTS,
  GENRE_COLORS,
  COVER_MIDNIGHT,
  COVER_LOFI,
  COVER_ACOUSTIC,
  COVER_ELECTRONIC,
} from './data/mockTracks';
import {
  downloadTrackToIndexedDB,
  removeTrackFromIndexedDB,
  getDownloadedTracks,
  getDownloadedAudioUrl,
  getStoredLikes,
  saveStoredLikes,
  getStoredPlaylists,
  saveStoredPlaylists,
  getStoredStats,
  recordTrackPlay,
} from './services/storage';
import { audioEngine } from './services/audioEngine';
import { calculatePersonalizedRecommendations } from './services/recommendation';

import { Sidebar } from './components/Sidebar';
import { BottomTabBar, TabDestination } from './components/BottomTabBar';
import { TopNav } from './components/TopNav';
import { QuickWidgetGrid } from './components/QuickWidgetGrid';
import { TrackCard } from './components/TrackCard';
import { TrackRow } from './components/TrackRow';
import { ArtistCard } from './components/ArtistCard';
import { MiniPlayer } from './components/MiniPlayer';
import { NowPlayingSheet } from './components/NowPlayingSheet';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { TestingGuideModal } from './components/TestingGuideModal';
import { NetworkProxyModal } from './components/NetworkProxyModal';
import { YouTubeAudioOnlyPlayer } from './components/YouTubeAudioOnlyPlayer';

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<TabDestination>('home');
  const [tabHistory, setTabHistory] = useState<TabDestination[]>(['home']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string | null>(null);
  const [fullTracks, setFullTracks] = useState<Track[]>([]);
  const [directResults, setDirectResults] = useState<Track[]>([]);
  const [youtubeResults, setYoutubeResults] = useState<Track[]>([]);
  const [deezerResults, setDeezerResults] = useState<Track[]>([]);
  const [previewResults, setPreviewResults] = useState<Track[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [activeSourceFilter, setActiveSourceFilter] = useState<'all' | 'full' | 'deezer' | 'direct' | 'youtube'>('all');
  const [youtubeStatus, setYoutubeStatus] = useState<{ isBlocked: boolean; usedProxy: string | null }>({
    isBlocked: false,
    usedProxy: null,
  });

  // Playlists & Selection
  const [customPlaylists, setCustomPlaylists] = useState<Playlist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);

  // Playback State
  const [currentTrack, setCurrentTrack] = useState<Track | null>(MOCK_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(MOCK_TRACKS[0].duration);
  const [volume, setVolume] = useState(0.8);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [queue, setQueue] = useState<Track[]>(MOCK_TRACKS);
  const [seekTarget, setSeekTarget] = useState<number | null>(null);

  // Likes & Downloads (IndexedDB)
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>([]);
  const [downloadedTracks, setDownloadedTracks] = useState<Track[]>([]);

  // Modals & UI Controls
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [isTestingGuideOpen, setIsTestingGuideOpen] = useState(false);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isMobileFrame, setIsMobileFrame] = useState(false);
  const [fallbackToast, setFallbackToast] = useState<string | null>(null);

  // User Play Stats for Recommendation Engine
  const [stats, setStats] = useState(() => getStoredStats());

  // Greeting based on time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صبح بخیر';
    if (hour < 18) return 'عصر بخیر';
    return 'شب بخیر';
  }, []);

  // Combined Playlists
  const allPlaylists = useMemo(() => {
    return [...MOCK_PLAYLISTS, ...customPlaylists];
  }, [customPlaylists]);

  // Downloaded track IDs
  const downloadedIdSet = useMemo(() => {
    return new Set(downloadedTracks.map((t) => t.id));
  }, [downloadedTracks]);

  // Initialize storage & audio engine callbacks
  useEffect(() => {
    setLikedTrackIds(getStoredLikes());
    setCustomPlaylists(getStoredPlaylists());
    getDownloadedTracks().then((tracks) => setDownloadedTracks(tracks));

    audioEngine.setCallbacks({
      onTimeUpdate: (cur, dur) => {
        setCurrentTime(cur);
        setDuration(dur);
      },
      onPlayStateChange: (playing) => {
        setIsPlaying(playing);
      },
      onEnded: () => {
        handleNextTrack();
      },
      onError: (msg) => {
        console.warn('Audio notice:', msg);
      },
    });
  }, []);

  // Client-Side Zero-Config VPN & YouTube Auto-Detection (Mobile & Desktop)
  const [isVpnDetected, setIsVpnDetected] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkVpn = () => {
      const img = new Image();
      const timer = setTimeout(() => {
        if (isMounted) setIsVpnDetected(false);
      }, 2500);

      img.onload = () => {
        clearTimeout(timer);
        if (isMounted) setIsVpnDetected(true);
      };
      img.onerror = () => {
        clearTimeout(timer);
        if (isMounted) setIsVpnDetected(false);
      };
      img.src = `https://www.youtube.com/favicon.ico?_=${Date.now()}`;
    };

    checkVpn();
    const interval = setInterval(checkVpn, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Unified Multi-Engine Live Search integration
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setFullTracks([]);
      setDirectResults([]);
      setYoutubeResults([]);
      setDeezerResults([]);
      setPreviewResults([]);
      setIsSearchingMusic(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingMusic(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setFullTracks(data.fullTracks || []);
        setDirectResults(data.directResults || []);
        setYoutubeResults(data.youtubeResults || []);
        setDeezerResults(data.deezerResults || []);
        setPreviewResults(data.previewResults || []);
        if (data.youtubeStatus) {
          setYoutubeStatus(data.youtubeStatus);
        }
      } catch (e) {
        console.warn('Search request error:', e);
      } finally {
        setIsSearchingMusic(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Navigation history handler
  const navigateTo = (tab: TabDestination) => {
    if (tab === currentTab && !activePlaylist && !selectedArtist) return;
    setActivePlaylist(null);
    setSelectedArtist(null);
    const newHist = tabHistory.slice(0, historyIndex + 1);
    newHist.push(tab);
    setTabHistory(newHist);
    setHistoryIndex(newHist.length - 1);
    setCurrentTab(tab);
  };

  const handleBack = () => {
    if (activePlaylist || selectedArtist) {
      setActivePlaylist(null);
      setSelectedArtist(null);
      return;
    }
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setCurrentTab(tabHistory[newIdx]);
    }
  };

  const handleForward = () => {
    if (historyIndex < tabHistory.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setCurrentTab(tabHistory[newIdx]);
    }
  };

  // Play track handler
  const handlePlayTrack = async (track: Track, newQueue?: Track[]) => {
    if (newQueue) {
      setQueue(newQueue);
    } else {
      setQueue((prev) => {
        if (!prev.find((t) => t.id === track.id)) {
          return [track, ...prev];
        }
        return prev;
      });
    }
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(track.duration || 210);
    setIsPlaying(true);
    setSeekTarget(null);
    recordTrackPlay(track);
    setStats(getStoredStats());

    // Check if this track is cached offline in IndexedDB
    const isDownloadedOffline = downloadedIdSet.has(track.id) || track.isDownloaded;
    const offlineUrl = await getDownloadedAudioUrl(track.id);

    if (offlineUrl || isDownloadedOffline) {
      // Offline playback: ALWAYS route through HTML5 audioEngine using the local blob
      audioEngine.playTrack(offlineUrl ? { ...track, audioUrl: offlineUrl } : track);
    } else if (track.youtubeId) {
      audioEngine.pause();
    } else {
      audioEngine.playTrack(track);
    }
  };

  const handlePlayPause = () => {
    if (!currentTrack) {
      if (MOCK_TRACKS.length > 0) {
        handlePlayTrack(MOCK_TRACKS[0]);
      }
      return;
    }
    const isDownloadedOffline = downloadedIdSet.has(currentTrack.id) || currentTrack.isDownloaded;
    if (currentTrack.youtubeId && !isDownloadedOffline) {
      setIsPlaying((prev) => !prev);
    } else {
      if (isPlaying) {
        audioEngine.pause();
      } else {
        audioEngine.resume();
      }
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    const isDownloadedOffline = currentTrack
      ? downloadedIdSet.has(currentTrack.id) || currentTrack.isDownloaded
      : false;
    if (currentTrack?.youtubeId && !isDownloadedOffline) {
      setSeekTarget(time);
    } else {
      audioEngine.seek(time);
    }
  };

  // Bot-check automatic fallback: if YouTube prompts for sign-in / bot check or network block
  const handleYouTubeFallback = async (failedTrack: Track) => {
    // If track is downloaded or user is currently in offline mode or network is down, do not run online fallback
    const isDownloaded = downloadedIdSet.has(failedTrack.id) || failedTrack.isDownloaded;
    const isOffline = isOfflineMode || (typeof navigator !== 'undefined' && !navigator.onLine);
    if (isDownloaded || isOffline) {
      return;
    }

    console.warn('YouTube playback restricted or bot-check triggered for:', failedTrack.title);

    // Clean track title to match against MP3s and Deezer
    const cleanTitle = failedTrack.title
      .replace(/\(Official.+?\)/gi, '')
      .replace(/\[Official.+?\]/gi, '')
      .replace(/\(Audio.+?\)/gi, '')
      .replace(/\(Video.+?\)/gi, '')
      .replace(/ft\..+$/gi, '')
      .replace(/feat\..+$/gi, '')
      .trim();

    const titleWords = cleanTitle.toLowerCase().split(/[\s-]+/).filter((w) => w.length >= 3);

    const isMatch = (t: Track) => {
      if (t.id === failedTrack.id) return false;
      const combined = (t.title + ' ' + t.artist).toLowerCase();
      return titleWords.some((w) => combined.includes(w));
    };

    let alternative =
      fullTracks.find(isMatch) ||
      deezerResults.find(isMatch) ||
      directResults.find(isMatch);

    // If not found in current list, try an instant fetch for the track's unblocked audio
    if (!alternative) {
      try {
        const queryTerm = cleanTitle || failedTrack.title.slice(0, 20);
        const res = await fetch(`/api/search?q=${encodeURIComponent(queryTerm)}`);
        const data = await res.json();
        const pool: Track[] = [
          ...(data.fullTracks || []),
          ...(data.deezerResults || []),
          ...(data.directResults || []),
        ];
        alternative = pool.find(isMatch) || pool[0];
      } catch {
        // Ignore
      }
    }

    // Ultimate fallback to first available unblocked track
    if (!alternative) {
      alternative = fullTracks[0] || deezerResults[0] || directResults[0];
    }

    if (alternative) {
      setFallbackToast(
        `محدودیت ربات‌یاب یوتیوب رد شد؛ در حال پخش نسخه صوتی («${alternative.title}»)`
      );
      setTimeout(() => setFallbackToast(null), 5000);
      handlePlayTrack(alternative);
    } else {
      setFallbackToast(
        'پخش این موزیک در یوتیوب محدود بود. لطفاً از بخش «آهنگ‌های کامل ۳۲۰» یا Deezer استفاده کنید.'
      );
      setTimeout(() => setFallbackToast(null), 6000);
    }
  };

  const handleNextTrack = () => {
    if (!currentTrack || queue.length === 0) return;

    if (repeatMode === 'one') {
      audioEngine.seek(0);
      audioEngine.resume();
      return;
    }

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * queue.length);
      handlePlayTrack(queue[randomIndex]);
      return;
    }

    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      handlePlayTrack(queue[currentIndex + 1]);
    } else if (repeatMode === 'all') {
      handlePlayTrack(queue[0]);
    } else {
      audioEngine.pause();
    }
  };

  const handlePrevTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    if (currentTime > 3) {
      audioEngine.seek(0);
      return;
    }
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    if (currentIndex > 0) {
      handlePlayTrack(queue[currentIndex - 1]);
    } else {
      handlePlayTrack(queue[queue.length - 1]);
    }
  };

  // Likes handler
  const handleToggleLike = (trackId: string) => {
    setLikedTrackIds((prev) => {
      const updated = prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId];
      saveStoredLikes(updated);
      return updated;
    });
  };

  // Offline download handler
  const handleToggleDownload = async (track: Track) => {
    const isAlreadyDownloaded = downloadedIdSet.has(track.id);
    if (isAlreadyDownloaded) {
      await removeTrackFromIndexedDB(track.id);
      setFallbackToast(`آهنگ «${track.title}» از حافظه آفلاین حذف شد.`);
      setTimeout(() => setFallbackToast(null), 3500);
    } else {
      setFallbackToast(`در حال دانلود و ذخیره‌سازی فایل صوتی «${track.title}» برای استفاده آفلاین بدون اینترنت...`);
      const ok = await downloadTrackToIndexedDB(track);
      if (ok) {
        setFallbackToast(`فایل صوتی «${track.title}» با موفقیت دانلود شد و بدون نیاز به اینترنت قابل پخش است.`);
      } else {
        setFallbackToast(`خطا در دانلود فایل صوتی «${track.title}».`);
      }
      setTimeout(() => setFallbackToast(null), 5000);
    }
    const updated = await getDownloadedTracks();
    setDownloadedTracks(updated);
  };

  // Create playlist
  const handleCreatePlaylist = (name: string, description: string) => {
    const newPlaylist: Playlist = {
      id: `custom-pl-${Date.now()}`,
      name,
      description,
      coverUrl: COVER_MIDNIGHT,
      trackIds: currentTrack ? [currentTrack.id] : [MOCK_TRACKS[0].id],
      isCustom: true,
      createdBy: 'شما',
    };
    const updated = [newPlaylist, ...customPlaylists];
    setCustomPlaylists(updated);
    saveStoredPlaylists(updated);
    setActivePlaylist(newPlaylist);
  };

  // Internal catalog search
  const filteredCatalogTracks = useMemo(() => {
    let list = MOCK_TRACKS;
    if (isOfflineMode) {
      list = downloadedTracks;
    }
    if (selectedGenreFilter) {
      list = list.filter((t) => t.genre === selectedGenreFilter);
    }
    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase().trim();
    return list.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.artist.toLowerCase().includes(query) ||
        t.album.toLowerCase().includes(query) ||
        t.genre.toLowerCase().includes(query)
    );
  }, [searchQuery, selectedGenreFilter, isOfflineMode, downloadedTracks]);

  // Recommendations calculation
  const recommendations = useMemo(() => {
    return calculatePersonalizedRecommendations(
      MOCK_TRACKS,
      likedTrackIds,
      stats.playCounts
    );
  }, [likedTrackIds, stats]);

  // Liked Tracks list
  const likedTracks = useMemo(() => {
    return MOCK_TRACKS.filter((t) => likedTrackIds.includes(t.id));
  }, [likedTrackIds]);

  // Unique artists list
  const uniqueArtists = useMemo(() => {
    const seen = new Set<string>();
    return MOCK_TRACKS.filter((t) => {
      if (seen.has(t.artist)) return false;
      seen.add(t.artist);
      return true;
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Liquid Ambient Fluid Lighting Orbs */}
      <div className="fixed top-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-[#1ed760]/10 filter blur-[140px] pointer-events-none animate-fluid-1 z-0" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-700/10 filter blur-[130px] pointer-events-none animate-fluid-2 z-0" />
      <div className="fixed top-[40%] left-[20%] w-[400px] h-[400px] rounded-full bg-cyan-600/8 filter blur-[150px] pointer-events-none z-0" />

      {/* Main Container: Mobile Frame Mode or Responsive Desktop */}
      <div
        className={`w-full flex-1 flex flex-col relative z-10 transition-all duration-300 ${
          isMobileFrame
            ? 'max-w-[390px] h-[min(820px,94vh)] my-auto mx-auto rounded-[42px] border-[5px] border-white/15 bg-black/85 backdrop-blur-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(30,215,96,0.12)] overflow-hidden'
            : 'max-w-full min-h-screen'
        }`}
      >
        {/* Dynamic Island on Mobile Frame */}
        {isMobileFrame && (
          <div className="w-full pt-2 pb-1 bg-black/60 backdrop-blur-md flex items-center justify-center shrink-0 border-b border-white/5">
            <div className="w-24 h-5 bg-black/90 rounded-full border border-white/10 flex items-center justify-between px-2.5 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-[#1ed760] animate-pulse" />
              <span className="text-[9px] font-mono text-white/50">Spotify</span>
              <span className="w-2 h-2 rounded-full bg-white/20" />
            </div>
          </div>
        )}

        {/* Top Header */}
        <TopNav
          currentTab={currentTab}
          onTabChange={navigateTo}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isOfflineMode={isOfflineMode}
          onToggleOfflineMode={() => setIsOfflineMode((v) => !v)}
          isMobileFrame={isMobileFrame}
          onToggleMobileFrame={() => setIsMobileFrame((v) => !v)}
          onOpenTestingGuide={() => setIsTestingGuideOpen(true)}
          onOpenNetworkProxy={() => setIsNetworkModalOpen(true)}
          isVpnDetected={isVpnDetected}
          onBack={handleBack}
          onForward={handleForward}
          canBack={historyIndex > 0 || !!activePlaylist || !!selectedArtist}
          canForward={historyIndex < tabHistory.length - 1}
        />

        {/* Offline Banner when simulator is active */}
        {isOfflineMode && (
          <div className="bg-amber-600/90 text-black px-4 py-1.5 text-xs font-bold flex items-center justify-between shrink-0 shadow-md">
            <span className="flex items-center gap-2">
              <WifiOff className="w-3.5 h-3.5" />
              حالت قطع شبکه فعال است — فقط موزیک‌های ذخیره‌شده در دیتابیس نمایش داده می‌شوند.
            </span>
            <button
              onClick={() => navigateTo('offline')}
              className="underline text-[11px] font-bold"
            >
              مشاهده لیست آفلاین
            </button>
          </div>
        )}

        {/* Center Layout: Desktop Sidebar + Content Feed */}
        <div className="flex-1 flex overflow-hidden">
          {/* Desktop Left Sidebar (hidden in mobile frame or small screens) */}
          {!isMobileFrame && (
            <div className="hidden md:flex">
              <Sidebar
                currentTab={currentTab}
                onTabChange={navigateTo}
                playlists={allPlaylists}
                activePlaylistId={activePlaylist?.id || null}
                onSelectPlaylist={(pl) => {
                  setActivePlaylist(pl);
                  setSelectedArtist(null);
                }}
                onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
                likedCount={likedTrackIds.length}
                downloadCount={downloadedTracks.length}
              />
            </div>
          )}

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto pb-32 md:pb-24 px-3 sm:px-6 py-4">
            {/* View 1: Active Playlist Detail */}
            {activePlaylist ? (
              <div className="animate-in fade-in duration-200">
                <button
                  onClick={() => setActivePlaylist(null)}
                  className="flex items-center gap-1.5 text-xs text-[#b3b3b3] hover:text-white mb-4"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت به {currentTab === 'home' ? 'خانه' : 'کتابخانه'}</span>
                </button>

                {/* Playlist Banner */}
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 liquid-glass p-6 rounded-[16px] mb-6 shadow-xl">
                  <div className="w-36 h-36 rounded-[10px] overflow-hidden bg-black/40 shadow-2xl shrink-0 border border-white/10">
                    <img
                      src={activePlaylist.coverUrl}
                      alt={activePlaylist.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-right">
                    <span className="text-[11px] font-bold tracking-wider text-[#1ed760] uppercase">
                      لیست پخش اختصاصی
                    </span>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-white mt-1 mb-2">
                      {activePlaylist.name}
                    </h1>
                    <p className="text-xs sm:text-sm text-[#b3b3b3]">
                      {activePlaylist.description}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-white/70 mt-3">
                      <span>{activePlaylist.createdBy || 'Spotify'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{activePlaylist.trackIds.length} آهنگ</span>
                    </div>
                  </div>
                </div>

                {/* Play All Button */}
                <div className="flex items-center gap-4 mb-4">
                  <button
                    onClick={() => {
                      const plTracks = MOCK_TRACKS.filter((t) =>
                        activePlaylist.trackIds.includes(t.id)
                      );
                      if (plTracks.length > 0) {
                        handlePlayTrack(plTracks[0], plTracks);
                      }
                    }}
                    className="w-12 h-12 rounded-full bg-[#1ed760] text-black flex items-center justify-center shadow-[0_4px_20px_rgba(30,215,96,0.5)] hover:scale-105 active:scale-95 transition-transform"
                    title="پخش کل لیست"
                  >
                    <Play className="w-6 h-6 fill-black ml-0.5" />
                  </button>
                </div>

                {/* Tracks Rows */}
                <div className="space-y-1.5">
                  {MOCK_TRACKS.filter((t) =>
                    activePlaylist.trackIds.includes(t.id)
                  ).map((track, i) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      index={i}
                      isCurrent={currentTrack?.id === track.id}
                      isPlaying={isPlaying}
                      isLiked={likedTrackIds.includes(track.id)}
                      isDownloaded={downloadedIdSet.has(track.id)}
                      onPlay={(t) =>
                        handlePlayTrack(
                          t,
                          MOCK_TRACKS.filter((item) =>
                            activePlaylist.trackIds.includes(item.id)
                          )
                        )
                      }
                      onToggleLike={handleToggleLike}
                      onToggleDownload={handleToggleDownload}
                    />
                  ))}
                </div>
              </div>
            ) : selectedArtist ? (
              /* View 2: Artist Detail */
              <div className="animate-in fade-in duration-200">
                <button
                  onClick={() => setSelectedArtist(null)}
                  className="flex items-center gap-1.5 text-xs text-[#b3b3b3] hover:text-white mb-4"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>بازگشت</span>
                </button>

                <div className="flex items-center gap-6 liquid-glass p-6 rounded-[16px] mb-6">
                  <div className="w-28 h-28 rounded-full overflow-hidden shadow-2xl bg-black/40 border border-white/10">
                    <img
                      src={
                        MOCK_TRACKS.find((t) => t.artist === selectedArtist)?.coverUrl ||
                        COVER_ACOUSTIC
                      }
                      alt={selectedArtist}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#1ed760] uppercase">
                      هنرمند تاییدشده
                    </span>
                    <h1 className="text-3xl font-extrabold text-white mt-1 mb-2">
                      {selectedArtist}
                    </h1>
                    <p className="text-xs text-[#b3b3b3]">
                      مجموعه ترک‌های منتخب و پرطرفدار
                    </p>
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-3">آهنگ‌های پرطرفدار</h3>
                <div className="space-y-1.5">
                  {MOCK_TRACKS.filter((t) => t.artist === selectedArtist).map(
                    (track, i) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        index={i}
                        isCurrent={currentTrack?.id === track.id}
                        isPlaying={isPlaying}
                        isLiked={likedTrackIds.includes(track.id)}
                        isDownloaded={downloadedIdSet.has(track.id)}
                        onPlay={(t) => handlePlayTrack(t)}
                        onToggleLike={handleToggleLike}
                        onToggleDownload={handleToggleDownload}
                      />
                    )
                  )}
                </div>
              </div>
            ) : currentTab === 'home' ? (
              /* View 3: Home Feed with Liquid Glass Widgets */
              <div className="space-y-8 animate-in fade-in duration-200">
                {/* 6-Tile Quick Access Grid */}
                <QuickWidgetGrid
                  playlists={allPlaylists}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                  onPlayPlaylist={(pl) => {
                    const plTracks = MOCK_TRACKS.filter((t) =>
                      pl.trackIds.includes(t.id)
                    );
                    if (plTracks.length > 0) {
                      handlePlayTrack(plTracks[0], plTracks);
                    }
                  }}
                  greetingText={greeting}
                />

                {/* Section: Trending Now */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Flame className="w-5 h-5 text-rose-500" />
                      داغ‌ترین ترک‌های امروز (Trending)
                    </h3>
                    <button
                      onClick={() => navigateTo('search')}
                      className="text-xs font-semibold text-[#b3b3b3] hover:text-white"
                    >
                      مشاهده همه
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {MOCK_TRACKS.slice(0, 6).map((track) => (
                      <TrackCard
                        key={track.id}
                        track={track}
                        isPlaying={isPlaying}
                        isCurrent={currentTrack?.id === track.id}
                        isLiked={likedTrackIds.includes(track.id)}
                        isDownloaded={downloadedIdSet.has(track.id)}
                        onPlay={(t) => handlePlayTrack(t, MOCK_TRACKS)}
                        onToggleLike={handleToggleLike}
                        onToggleDownload={handleToggleDownload}
                      />
                    ))}
                  </div>
                </section>

                {/* Section: Popular Artists */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">
                      هنرمندان محبوب
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {uniqueArtists.slice(0, 6).map((track) => (
                      <ArtistCard
                        key={track.artist}
                        name={track.artist}
                        genre={track.genre}
                        imageUrl={track.coverUrl}
                        onSelect={() => setSelectedArtist(track.artist)}
                      />
                    ))}
                  </div>
                </section>

                {/* Section: Recommended Mixes for You */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#1ed760]" />
                      پیشنهاد خودکار بر اساس سلیقه شما
                    </h3>
                    <button
                      onClick={() => navigateTo('discover')}
                      className="text-xs font-semibold text-[#b3b3b3] hover:text-white"
                    >
                      بخش پیشنهادی کامل
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {recommendations.slice(0, 6).map(({ track }) => (
                      <TrackCard
                        key={track.id}
                        track={track}
                        isPlaying={isPlaying}
                        isCurrent={currentTrack?.id === track.id}
                        isLiked={likedTrackIds.includes(track.id)}
                        isDownloaded={downloadedIdSet.has(track.id)}
                        onPlay={(t) =>
                          handlePlayTrack(
                            t,
                            recommendations.map((r) => r.track)
                          )
                        }
                        onToggleLike={handleToggleLike}
                        onToggleDownload={handleToggleDownload}
                      />
                    ))}
                  </div>
                </section>
              </div>
            ) : currentTab === 'search' ? (
              /* View 4: Search & YouTube Integration */
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Active Genre Filter Tag */}
                {selectedGenreFilter && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#b3b3b3]">فیلتر سبک:</span>
                    <button
                      onClick={() => setSelectedGenreFilter(null)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1ed760] text-black text-xs font-bold shadow-md"
                    >
                      <span>{selectedGenreFilter}</span>
                      <span>✕</span>
                    </button>
                  </div>
                )}

                {/* Search Results */}
                {searchQuery || selectedGenreFilter ? (
                  <div className="space-y-6">
                    {/* Source Filter Switcher Pills */}
                    {searchQuery && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs select-none">
                        <button
                          onClick={() => setActiveSourceFilter('all')}
                          className={`px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                            activeSourceFilter === 'all'
                              ? 'bg-white text-black shadow-md'
                              : 'liquid-glass text-white/60 hover:text-white'
                          }`}
                        >
                          همه آهنگ‌ها ({fullTracks.length + youtubeResults.length + deezerResults.length + directResults.length})
                        </button>
                        {fullTracks.length > 0 && (
                          <button
                            onClick={() => setActiveSourceFilter('full')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                              activeSourceFilter === 'full'
                                ? 'bg-[#1ed760] text-black shadow-md'
                                : 'liquid-glass text-[#1ed760] hover:bg-[#1ed760]/10 border border-[#1ed760]/30'
                            }`}
                          >
                            <span>🎵 آهنگ‌های کامل ۳۲۰kbps</span>
                            <span className="font-mono text-[11px]">({fullTracks.length})</span>
                          </button>
                        )}
                        {youtubeResults.length > 0 && (
                          <button
                            onClick={() => setActiveSourceFilter('youtube')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                              activeSourceFilter === 'youtube'
                                ? 'bg-red-600 text-white shadow-md'
                                : 'liquid-glass text-red-400 hover:bg-red-600/10 border border-red-500/30'
                            }`}
                          >
                            <span>🔴 یوتیوب (صوتی)</span>
                            <span className="font-mono text-[11px]">({youtubeResults.length})</span>
                          </button>
                        )}
                        {deezerResults.length > 0 && (
                          <button
                            onClick={() => setActiveSourceFilter('deezer')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                              activeSourceFilter === 'deezer'
                                ? 'bg-cyan-500 text-black shadow-md'
                                : 'liquid-glass text-cyan-400 hover:bg-cyan-500/10 border border-cyan-500/30'
                            }`}
                          >
                            <span>🌍 آهنگ‌های بین‌المللی</span>
                            <span className="font-mono text-[11px]">({deezerResults.length})</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Section 1: Real FULL Complete MP3 Songs (Unblocked, 320kbps, Full Length!) */}
                    {searchQuery && (activeSourceFilter === 'all' || activeSourceFilter === 'full') && (
                      <div className="liquid-glass p-4 rounded-[16px] border border-[#1ed760]/40 shadow-xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                            <span className="p-1 rounded bg-[#1ed760] text-black font-extrabold text-xs">
                              🎵
                            </span>
                            <span>آهنگ‌های کامل ۳۲۰kbps (پخش ۱۰۰٪ صوتی و بدون قطعی)</span>
                            {isSearchingMusic && fullTracks.length === 0 && (
                              <Loader2 className="w-4 h-4 text-[#1ed760] animate-spin mr-2" />
                            )}
                          </h3>
                          <span className="text-[11px] text-[#1ed760] font-medium hidden sm:inline">
                            کیفیت ۳۲۰kbps استودیو - فایل صوتی مستقیم
                          </span>
                        </div>

                        {fullTracks.length > 0 ? (
                          <div className="space-y-1.5">
                            {fullTracks.map((track, i) => (
                              <TrackRow
                                key={track.id}
                                track={track}
                                index={i}
                                isCurrent={currentTrack?.id === track.id}
                                isPlaying={isPlaying}
                                isLiked={likedTrackIds.includes(track.id)}
                                isDownloaded={downloadedIdSet.has(track.id)}
                                onPlay={(t) => handlePlayTrack(t, fullTracks)}
                                onToggleLike={handleToggleLike}
                                onToggleDownload={handleToggleDownload}
                              />
                            ))}
                          </div>
                        ) : isSearchingMusic ? (
                          <div className="py-6 text-center text-[#b3b3b3] text-xs">
                            در حال دریافت نزدیک‌ترین آهنگ‌های کامل با کیفیت اصلی...
                          </div>
                        ) : (
                          <div className="py-3 text-center text-[#b3b3b3] text-xs">
                            نام آهنگ یا خواننده را بنویسید تا فایل کامل ۳۲۰kbps پیدا شود.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Section 2: YouTube Pure Audio Stream (No video box, pure Spotify audio with fallback) */}
                    {searchQuery && (activeSourceFilter === 'all' || activeSourceFilter === 'youtube') && (
                      <div className="liquid-glass p-4 rounded-[16px] border border-red-500/20 shadow-xl">
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                            <span className="p-1 rounded bg-red-600 text-white">
                              <Youtube className="w-4 h-4" />
                            </span>
                            <span>آهنگ‌های یوتیوب (پخش صوتی خالص - بدون ویدیو)</span>
                            {isSearchingMusic && youtubeResults.length === 0 && (
                              <Loader2 className="w-4 h-4 text-red-400 animate-spin mr-2" />
                            )}
                          </h3>
                          <span className="text-[11px] text-[#b3b3b3]">
                            پخش مستقیم صوت و کاور موزیک بدون افت کیفیت
                          </span>
                        </div>

                        {youtubeResults.length > 0 ? (
                          <div className="space-y-1.5">
                            {youtubeResults.map((ytTrack, i) => (
                              <TrackRow
                                key={ytTrack.id}
                                track={ytTrack}
                                index={i}
                                isCurrent={currentTrack?.youtubeId === ytTrack.youtubeId}
                                isPlaying={isPlaying}
                                isLiked={likedTrackIds.includes(ytTrack.id)}
                                isDownloaded={downloadedIdSet.has(ytTrack.id)}
                                onPlay={(t) => handlePlayTrack(t, youtubeResults)}
                                onToggleLike={handleToggleLike}
                                onToggleDownload={handleToggleDownload}
                              />
                            ))}
                          </div>
                        ) : isSearchingMusic ? (
                          <div className="py-6 text-center text-[#b3b3b3] text-xs">
                            در حال جستجو در میان آهنگ‌های یوتیوب...
                          </div>
                        ) : (
                          <div className="py-4 text-center text-[#b3b3b3] text-xs">
                            موردی از یوتیوب یافت نشد. می‌توانید از آهنگ‌های کامل بخش‌های بالا استفاده کنید.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Section 3: International Music (Deezer) */}
                    {searchQuery && (activeSourceFilter === 'all' || activeSourceFilter === 'deezer') && deezerResults.length > 0 && (
                      <div className="liquid-glass p-4 rounded-[16px] border border-cyan-500/30 shadow-xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                            <span className="p-1 rounded bg-cyan-500 text-black font-extrabold text-xs">
                              <Globe className="w-4 h-4" />
                            </span>
                            <span>آهنگ‌های بین‌المللی و خارجی (صوتی خالص - بدون ویدیو)</span>
                            {isSearchingMusic && deezerResults.length === 0 && (
                              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin mr-2" />
                            )}
                          </h3>
                          <span className="text-[11px] text-cyan-400 font-medium hidden sm:inline">
                            پخش مستقیم صوتی با بالاترین کیفیت
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {deezerResults.map((track, i) => (
                            <TrackRow
                              key={track.id}
                              track={track}
                              index={i}
                              isCurrent={currentTrack?.id === track.id}
                              isPlaying={isPlaying}
                              isLiked={likedTrackIds.includes(track.id)}
                              isDownloaded={downloadedIdSet.has(track.id)}
                              onPlay={(t) => handlePlayTrack(t, deezerResults)}
                              onToggleLike={handleToggleLike}
                              onToggleDownload={handleToggleDownload}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section 3: Fallback Previews (Apple Music) */}
                    {searchQuery && (activeSourceFilter === 'all' || activeSourceFilter === 'direct') && fullTracks.length === 0 && deezerResults.length === 0 && directResults.length > 0 && (
                      <div className="liquid-glass p-4 rounded-[16px] border border-white/10 shadow-xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                            <span className="p-1 rounded bg-amber-500 text-black font-extrabold text-xs">
                              ⚡
                            </span>
                            <span>پیش‌نمایش آنلاین موزیک‌ها</span>
                          </h3>
                          <span className="text-[11px] text-amber-400 font-medium hidden sm:inline">
                            پیش‌نمایش رسمی
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {directResults.map((track, i) => (
                            <TrackRow
                              key={track.id}
                              track={track}
                              index={i}
                              isCurrent={currentTrack?.id === track.id}
                              isPlaying={isPlaying}
                              isLiked={likedTrackIds.includes(track.id)}
                              isDownloaded={downloadedIdSet.has(track.id)}
                              onPlay={(t) => handlePlayTrack(t, directResults)}
                              onToggleLike={handleToggleLike}
                              onToggleDownload={handleToggleDownload}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Catalog Results */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white mb-3">
                        ترک‌های آرشیو داخلی ({filteredCatalogTracks.length})
                      </h3>
                      {filteredCatalogTracks.length > 0 ? (
                        <div className="space-y-1.5">
                          {filteredCatalogTracks.map((track, i) => (
                            <TrackRow
                              key={track.id}
                              track={track}
                              index={i}
                              isCurrent={currentTrack?.id === track.id}
                              isPlaying={isPlaying}
                              isLiked={likedTrackIds.includes(track.id)}
                              isDownloaded={downloadedIdSet.has(track.id)}
                              onPlay={(t) => handlePlayTrack(t, filteredCatalogTracks)}
                              onToggleLike={handleToggleLike}
                              onToggleDownload={handleToggleDownload}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-[#b3b3b3] text-xs">
                          موردی در آرشیو داخلی یافت نشد.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Browse Categories Grid */
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">
                      مرور بر اساس سبک و ژانر
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {(
                        [
                          'Persian Pop',
                          'Electronic',
                          'Chill',
                          'Pop',
                          'Hip-Hop',
                          'Acoustic',
                          'Rock',
                          'Classical',
                        ] as Genre[]
                      ).map((genre) => (
                        <div
                          key={genre}
                          onClick={() => setSelectedGenreFilter(genre)}
                          className={`${
                            GENRE_COLORS[genre] || 'bg-slate-700'
                          } h-24 sm:h-28 rounded-[12px] p-3.5 flex flex-col justify-between cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg overflow-hidden relative border border-white/10`}
                        >
                          <span className="text-sm sm:text-base font-bold text-white">
                            {genre}
                          </span>
                          <span className="text-[11px] text-white/80">
                            {MOCK_TRACKS.filter((t) => t.genre === genre).length} موزیک
                          </span>
                          <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-black/20 rounded-full flex items-center justify-center">
                            <Radio className="w-6 h-6 text-white/40" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : currentTab === 'discover' ? (
              /* View 5: Smart Recommendations */
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="liquid-glass p-6 rounded-[16px] border border-[#1ed760]/20 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-2 text-[#1ed760] text-xs font-bold uppercase tracking-wider mb-1">
                    <Sparkles className="w-4 h-4" />
                    الگوریتم هوشمند پیشنهاد موسیقی
                  </div>
                  <h2 className="text-2xl font-extrabold text-white">
                    پیشنهادی بر اساس سلیقه شخصی شما
                  </h2>
                  <p className="text-xs sm:text-sm text-[#b3b3b3] mt-2 max-w-xl">
                    این لیست بر مبنای آهنگ‌های لایک‌شده ({likedTrackIds.length} ترک)، تعداد پخش‌های شما و سبک‌های محبوب به‌صورت بلادرنگ تنظیم می‌شود.
                  </p>
                </div>

                <div className="space-y-2">
                  {recommendations.map(({ track, score, reason }, i) => (
                    <div
                      key={track.id}
                      className="liquid-glass hover:bg-white/[0.08] p-2 rounded-[12px] transition-all border border-white/5"
                    >
                      <div className="flex items-center justify-between px-2 mb-1">
                        <span className="text-[10px] text-[#1ed760] font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {reason}
                        </span>
                        <span className="text-[10px] font-mono text-white/40">
                          امتیاز نزدیکی: {score.toFixed(1)}
                        </span>
                      </div>
                      <TrackRow
                        track={track}
                        index={i}
                        isCurrent={currentTrack?.id === track.id}
                        isPlaying={isPlaying}
                        isLiked={likedTrackIds.includes(track.id)}
                        isDownloaded={downloadedIdSet.has(track.id)}
                        onPlay={(t) =>
                          handlePlayTrack(
                            t,
                            recommendations.map((r) => r.track)
                          )
                        }
                        onToggleLike={handleToggleLike}
                        onToggleDownload={handleToggleDownload}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : currentTab === 'library' ? (
              /* View 6: Your Library */
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">کتابخانه شما</h2>
                  <button
                    onClick={() => setIsCreatePlaylistOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black text-xs font-bold hover:scale-105 active:scale-95 transition-transform shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>لیست جدید</span>
                  </button>
                </div>

                {/* Liked Songs Special Tile */}
                <div
                  onClick={() => {
                    if (likedTracks.length > 0) {
                      handlePlayTrack(likedTracks[0], likedTracks);
                    }
                  }}
                  className="bg-gradient-to-br from-indigo-700/80 via-purple-600/80 to-pink-500/60 backdrop-blur-2xl rounded-[16px] p-6 cursor-pointer hover:opacity-95 transition-opacity relative shadow-2xl border border-white/10"
                >
                  <Heart className="w-8 h-8 fill-white text-white mb-4" />
                  <h3 className="text-xl font-bold text-white">آهنگ‌های پسندیده‌شده</h3>
                  <p className="text-xs text-white/80 mt-1">
                    {likedTrackIds.length} آهنگ ذخیره‌شده
                  </p>
                </div>

                {/* Playlists Grid */}
                <h3 className="text-lg font-bold text-white mt-6 mb-3">
                  لیست‌های پخش شما ({allPlaylists.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {allPlaylists.map((pl) => (
                    <div
                      key={pl.id}
                      onClick={() => setActivePlaylist(pl)}
                      className="liquid-glass-card p-3 rounded-[12px] transition-all cursor-pointer group"
                    >
                      <div className="aspect-square rounded-[8px] overflow-hidden bg-black/40 mb-3 border border-white/5">
                        <img
                          src={pl.coverUrl}
                          alt={pl.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h4 className="text-sm font-semibold text-white truncate">
                        {pl.name}
                      </h4>
                      <p className="text-xs text-[#b3b3b3] mt-0.5">
                        {pl.trackIds.length} آهنگ
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* View 7: Offline Mode Downloads */
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="liquid-glass p-6 rounded-[16px] border border-[#1ed760]/30 shadow-2xl">
                  <div className="flex items-center gap-2 text-[#1ed760] text-xs font-bold uppercase tracking-wider mb-1">
                    <DownloadCloud className="w-4 h-4" />
                    ذخیره‌سازی آفلاین مرورگر (IndexedDB)
                  </div>
                  <h2 className="text-2xl font-extrabold text-white">
                    موزیک‌های دانلودشده و آماده پخش آفلاین
                  </h2>
                  <p className="text-xs sm:text-sm text-[#b3b3b3] mt-2">
                    این آهنگ‌ها در فضای اختصاصی پایگاه داده IndexedDB دستگاه شما ذخیره شده‌اند و حتی در صورت قطع کامل اینترنت قابل پخش هستند.
                  </p>
                  {downloadedTracks.length > 0 && (
                    <button
                      onClick={() => handlePlayTrack(downloadedTracks[0], downloadedTracks)}
                      className="mt-4 flex items-center gap-2 px-5 py-2 rounded-full bg-[#1ed760] text-black text-xs font-bold hover:scale-105 transition-transform shadow-[0_4px_16px_rgba(30,215,96,0.4)]"
                    >
                      <Play className="w-4 h-4 fill-black" />
                      پخش تمام آهنگ‌های آفلاین ({downloadedTracks.length})
                    </button>
                  )}
                </div>

                {downloadedTracks.length > 0 ? (
                  <div className="space-y-1.5">
                    {downloadedTracks.map((track, i) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        index={i}
                        isCurrent={currentTrack?.id === track.id}
                        isPlaying={isPlaying}
                        isLiked={likedTrackIds.includes(track.id)}
                        isDownloaded={true}
                        onPlay={(t) => handlePlayTrack(t, downloadedTracks)}
                        onToggleLike={handleToggleLike}
                        onToggleDownload={handleToggleDownload}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[#b3b3b3]">
                    <DownloadCloud className="w-10 h-10 mx-auto mb-3 text-[#73777c]" />
                    <p className="text-sm font-semibold">هنوز آهنگی را دانلود نکرده‌اید</p>
                    <p className="text-xs text-[#73777c] mt-1">
                      بر روی آیکون دانلود کنار هر آهنگ کلیک کنید تا برای دسترسی آفلاین ذخیره شود.
                    </p>
                    <button
                      onClick={() => navigateTo('home')}
                      className="mt-4 px-4 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-white/90"
                    >
                      کاوش و دانلود موزیک‌ها
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* Floating Mini Player */}
        {currentTrack && (
          <div className="fixed sm:sticky bottom-14 md:bottom-0 left-0 right-0 z-40">
            <MiniPlayer
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              isLiked={likedTrackIds.includes(currentTrack.id)}
              isDownloaded={downloadedIdSet.has(currentTrack.id)}
              onPlayPause={handlePlayPause}
              onNext={handleNextTrack}
              onToggleLike={handleToggleLike}
              onExpand={() => setIsNowPlayingOpen(true)}
            />
          </div>
        )}

        {/* Mobile Bottom Tab Bar */}
        <div className="md:hidden">
          <BottomTabBar
            currentTab={currentTab}
            onTabChange={navigateTo}
            downloadCount={downloadedTracks.length}
          />
        </div>

        {/* Full-Screen Now Playing Modal / Bottom Sheet */}
        {currentTrack && (
          <NowPlayingSheet
            isOpen={isNowPlayingOpen}
            onClose={() => setIsNowPlayingOpen(false)}
            track={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isShuffle={isShuffle}
            repeatMode={repeatMode}
            isLiked={likedTrackIds.includes(currentTrack.id)}
            isDownloaded={downloadedIdSet.has(currentTrack.id)}
            queue={queue}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onNext={handleNextTrack}
            onPrev={handlePrevTrack}
            onToggleShuffle={() => setIsShuffle((v) => !v)}
            onToggleRepeat={() =>
              setRepeatMode((prev) =>
                prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'
              )
            }
            onToggleLike={handleToggleLike}
            onToggleDownload={handleToggleDownload}
            onVolumeChange={(vol) => {
              setVolume(vol);
              audioEngine.setVolume(vol);
            }}
            onSelectQueueTrack={(t) => handlePlayTrack(t)}
          />
        )}

        {/* Background YouTube Audio-Only Engine (No video frame, zero-UI, pure Spotify music with bot-check auto-fallback) */}
        <YouTubeAudioOnlyPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          volume={volume}
          seekTime={seekTarget}
          isOffline={Boolean(
            currentTrack &&
              (downloadedIdSet.has(currentTrack.id) ||
                currentTrack.isDownloaded ||
                isOfflineMode ||
                (typeof navigator !== 'undefined' && !navigator.onLine))
          )}
          onTimeUpdate={(cur, dur) => {
            setCurrentTime(cur);
            setDuration(dur);
            setSeekTarget(null);
          }}
          onPlayStateChange={(playing) => {
            setIsPlaying(playing);
          }}
          onEnded={() => {
            handleNextTrack();
          }}
          onPlaybackError={handleYouTubeFallback}
        />

        {/* Modals */}
        <CreatePlaylistModal
          isOpen={isCreatePlaylistOpen}
          onClose={() => setIsCreatePlaylistOpen(false)}
          onCreate={handleCreatePlaylist}
        />

        <TestingGuideModal
          isOpen={isTestingGuideOpen}
          onClose={() => setIsTestingGuideOpen(false)}
          onTestInstantPlay={() => handlePlayTrack(MOCK_TRACKS[0], MOCK_TRACKS)}
          onTestLikesBatch={() => {
            const popTracks = MOCK_TRACKS.filter(
              (t) => t.genre === 'Persian Pop' || t.genre === 'Pop'
            ).map((t) => t.id);
            setLikedTrackIds((prev) => {
              const merged = Array.from(new Set([...prev, ...popTracks]));
              saveStoredLikes(merged);
              return merged;
            });
          }}
          onTestDownloadTopTracks={async () => {
            await downloadTrackToIndexedDB(MOCK_TRACKS[0]);
            await downloadTrackToIndexedDB(MOCK_TRACKS[1]);
            const updated = await getDownloadedTracks();
            setDownloadedTracks(updated);
          }}
          onToggleOffline={() => setIsOfflineMode((v) => !v)}
          isOfflineMode={isOfflineMode}
          onToggleMobileFrame={() => setIsMobileFrame((v) => !v)}
          isMobileFrame={isMobileFrame}
        />

        <NetworkProxyModal
          isOpen={isNetworkModalOpen}
          onClose={() => setIsNetworkModalOpen(false)}
          onProxyUpdated={() => {
            // Trigger a search refresh if a query is active
            if (searchQuery.trim().length >= 2) {
              fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
                .then((r) => r.json())
                .then((data) => {
                  setFullTracks(data.fullTracks || []);
                  setDirectResults(data.directResults || []);
                  setYoutubeResults(data.youtubeResults || []);
                  setDeezerResults(data.deezerResults || []);
                  if (data.youtubeStatus) setYoutubeStatus(data.youtubeStatus);
                })
                .catch(() => {});
            }
          }}
        />

        {/* Floating Fallback / Bot-Check Notification Toast */}
        {fallbackToast && (
          <div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[90%] px-4 py-3 rounded-2xl liquid-glass-elevated border border-emerald-500/30 text-white shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-xl"
            dir="rtl"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1ed760] shrink-0 animate-pulse shadow-[0_0_8px_#1ed760]" />
              <p className="text-xs font-medium text-emerald-100 leading-relaxed truncate">
                {fallbackToast}
              </p>
            </div>
            <button
              onClick={() => setFallbackToast(null)}
              className="p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10 shrink-0 text-xs"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
