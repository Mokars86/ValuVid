import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Coins, 
  Plus, 
  Check, 
  Lock, 
  Music, 
  BarChart3, 
  Bookmark,
  Sparkles,
  TrendingUp,
  Award,
  Bot,
  UserCheck,
  Scale,
  Users,
  Target,
  GraduationCap,
  Eye,
  CheckCircle2,
  RefreshCw,
  Play,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VideoPlayer } from './VideoPlayer';
import { VideoItem } from '../../types';
import { sounds } from '../../utils/soundEffects';
import { preloadVideo, getImmediateVideoUrl } from '../../utils/mediaStorage';
import { formatCompactNumber, formatPublishedTime } from '../../utils/formatNumber';
import { INITIAL_COMMUNITY_VIDEOS } from '../../data/communityVideos';
import { getUserAvatar, isTestUserOrMockVideo } from '../../utils/userDirectory';
import { detectVideoTopicReaction } from '../../utils/topicReaction';
import { TopicReactionIcon } from './TopicReactionIcon';
import { recordViewerForVideo } from './VideoViewersModal';
import { getDeletedVideoIds } from '../../services/supabaseClient';

export const FeedScreen: React.FC = () => {
  const { 
    videos, 
    isVideosLoading,
    refreshVideosFromSupabase,
    feedFilter, 
    setFeedFilter, 
    toggleLikeVideo, 
    likeVideo,
    isFollowingCreator,
    toggleFollowCreator, 
    openTipModal, 
    openCommentDrawer, 
    openUnlockPrompt, 
    openAnalytics,
    shareVideoWithRewardLink,
    isSaved,
    toggleSaveVideo,
    openSaveModal,
    openAiDisclosureModal,
    openValuSplitModal,
    openCommunityGoalModal,
    openSkillQuizModal,
    humanTouchRatio,
    wallet,
    watchRewardProgress,
    totalMinutesWatched,
    rewardedVideoIds,
    claimWatchReward,
    isVideoRewarded,
    currentVideoIndex,
    setCurrentVideoIndex,
    requestedVideoId,
    clearRequestedVideoId,
    setShowFundingModal,
    isLoggedIn,
    authUser,
    setAuthModalOpen,
    setAuthMode,
    setShareToast,
    setActiveTab,
    setDiscoverSearchQuery,
    currentUser,
    openProductCheckout,
    openCreatorProfile,
    isCinemaMode,
    isNativePip,
    recordVideoView,
    comments
  } = useApp();

  const [slideDirection, setSlideDirection] = useState<'up' | 'down' | null>(null);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [isCleanScreen, setIsCleanScreen] = useState(false);
  const [topicLikeBurst, setTopicLikeBurst] = useState<{ topic: string; emoji: string; glowColor: string; key: number } | null>(null);
  const topicBurstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filter videos according to active tab
  const filteredVideos = useMemo(() => {
    const deletedIds = getDeletedVideoIds();
    const rawList = videos && videos.length > 0 ? videos : INITIAL_COMMUNITY_VIDEOS;
    let list = rawList.filter(
      (v) =>
        !deletedIds.includes(v.id) &&
        v.caption !== '[DELETED]' &&
        (v.category as string) !== 'deleted' &&
        !(v.title || '').includes('[DELETED]') &&
        !isTestUserOrMockVideo(v)
    );
    if (feedFilter === 'following') {
      const followingVideos = list.filter((v) => v.creator?.isFollowing);
      // Fallback: If user isn't following anyone yet, gracefully display videos so screen is never empty
      list = followingVideos.length > 0 ? followingVideos : list;
    } else if (feedFilter === 'global') {
      // Sort by highest views across all regions
      list = [...list].sort((a, b) => b.stats.views - a.stats.views);
    } else if (feedFilter === 'fresh') {
      // Highlighting rising Ghanaian creators with under 1,000 followers
      const freshVideos = list.filter((v) => (v.creator?.followers || 0) < 1000);
      list = freshVideos.length > 0 ? freshVideos : list;
    } else if (feedFilter === 'bounties') {
      const bountyVideos = list.filter((v) => v.category === 'bounties' || Boolean(v.bountyTag));
      list = bountyVideos.length > 0 ? bountyVideos : list;
    } else if (feedFilter === 'ghana') {
      const ghanaVideos = list.filter((v) => v.category === 'ghana');
      list = ghanaVideos.length > 0 ? ghanaVideos : list;
    } else if (feedFilter === 'tech') {
      const techVideos = list.filter((v) => v.category === 'tech' || v.category === 'education');
      list = techVideos.length > 0 ? techVideos : list;
    }

    // Pillar 3: Algorithmic Preference ("Human Touch" Authenticity Filter)
    if (humanTouchRatio >= 95) {
      const humanList = list.filter((v) => v.aiDisclosureType !== 'generated' || v.id === requestedVideoId);
      return humanList.length > 0 ? humanList : list;
    }

    return list.length > 0 ? list : INITIAL_COMMUNITY_VIDEOS;
  }, [videos, feedFilter, humanTouchRatio, requestedVideoId]);

  // Jump directly to a video requested from Discover / Profile
  useEffect(() => {
    if (!requestedVideoId || filteredVideos.length === 0) return;
    const targetIdx = filteredVideos.findIndex((v) => v.id === requestedVideoId);
    if (targetIdx !== -1) {
      setCurrentVideoIndex(targetIdx);
      clearRequestedVideoId();
    }
  }, [requestedVideoId, filteredVideos, setCurrentVideoIndex, clearRequestedVideoId]);

  // Safe activeIndex derived directly from requestedVideoId or AppContext currentVideoIndex
  const activeIndex = useMemo(() => {
    if (requestedVideoId) {
      const reqIdx = filteredVideos.findIndex((v) => v.id === requestedVideoId);
      if (reqIdx !== -1) return reqIdx;
    }
    if (typeof currentVideoIndex !== 'number' || currentVideoIndex < 0) return 0;
    return currentVideoIndex < filteredVideos.length ? currentVideoIndex : 0;
  }, [requestedVideoId, currentVideoIndex, filteredVideos]);

  // Swipe / Touch / Pointer Tracking Refs
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const touchStartTime = useRef<number>(0);

  const pointerStartY = useRef<number>(0);
  const pointerStartX = useRef<number>(0);
  const isPointerDown = useRef<boolean>(false);

  const lastWheelTime = useRef<number>(0);

  // Clamp currentVideoIndex if list length changes
  useEffect(() => {
    if (filteredVideos.length > 0 && currentVideoIndex >= filteredVideos.length) {
      setCurrentVideoIndex(Math.max(0, filteredVideos.length - 1));
    }
  }, [filteredVideos.length, currentVideoIndex, setCurrentVideoIndex]);

  // TikTok Architecture: Predictive Next/Previous Video Preloading into IndexedDB buffer
  useEffect(() => {
    if (!filteredVideos || filteredVideos.length === 0) return;
    const nextVideo = filteredVideos[activeIndex + 1];
    if (nextVideo && nextVideo.videoUrl) {
      preloadVideo(nextVideo.id, nextVideo.videoUrl);
    }
    const prevVideo = filteredVideos[activeIndex - 1];
    if (prevVideo && prevVideo.videoUrl) {
      preloadVideo(prevVideo.id, prevVideo.videoUrl);
    }
  }, [activeIndex, filteredVideos]);

  const currentVideo: VideoItem | undefined = filteredVideos[activeIndex] || filteredVideos[0] || INITIAL_COMMUNITY_VIDEOS[0];

  const isCurrentRewarded = Boolean(currentVideo && isVideoRewarded(currentVideo.id));
  const [currentVideoProgress, setCurrentVideoProgress] = useState(0);

  // Sync progress when active video changes or if already rewarded
  useEffect(() => {
    if (!currentVideo) return;
    if (isVideoRewarded(currentVideo.id)) {
      setCurrentVideoProgress(100);
    } else {
      setCurrentVideoProgress(0);
    }
  }, [currentVideo?.id, isVideoRewarded]);

  // TikTok-style view counting: views are triggered via VideoPlayer's onPlaybackStart
  // the exact moment frame 1 begins playing for this impression (not blindly on mount).

  // Fair Per-Video Watch-to-Earn Engine:
  // - Rewards viewer ONCE per unique piece of content (GHS 0.02).
  // - Synchronized directly to actual video playback duration:
  //   Users cannot swipe through videos without watching; progress strictly tracks currentTime.
  // - Reward unlocks when at least 85% of video duration is genuinely watched (or min 12s on long videos).
  const handlePlaybackTimeUpdate = useCallback((currentTime: number, duration: number) => {
    if (!currentVideo) return;
    if (currentVideo.isPayPerUnlock && !currentVideo.isUnlocked) return;
    if (isVideoRewarded(currentVideo.id)) {
      setCurrentVideoProgress(100);
      return;
    }

    const effectiveDuration = duration > 0 ? duration : (currentVideo.durationSeconds || 15);
    const progressPercent = Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100));

    setCurrentVideoProgress(Math.round(progressPercent));

    // Full video completion threshold: 85% watched (or 12 seconds minimum on longer videos)
    const isCompleted = progressPercent >= 85 && (effectiveDuration < 12 || currentTime >= 12 || progressPercent >= 90);

    if (isCompleted) {
      claimWatchReward(currentVideo.id, currentVideo.title, currentVideo.creator?.username);
      setCurrentVideoProgress(100);
    }
  }, [currentVideo, isVideoRewarded, claimWatchReward]);

  const handleNextVideo = useCallback(() => {
    if (filteredVideos.length <= 1) return;
    setSlideDirection('up');
    setCurrentVideoIndex((prev) => (prev + 1) % filteredVideos.length);
    setCaptionExpanded(false);
    setIsCleanScreen(false);
  }, [filteredVideos.length, setCurrentVideoIndex]);

  const handlePrevVideo = useCallback(() => {
    if (filteredVideos.length <= 1) return;
    setSlideDirection('down');
    setCurrentVideoIndex((prev) => (prev === 0 ? filteredVideos.length - 1 : prev - 1));
    setCaptionExpanded(false);
    setIsCleanScreen(false);
  }, [filteredVideos.length, setCurrentVideoIndex]);

  // Touch swipe events for mobile devices
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, a, input, select, textarea, aside, [role="button"]')) {
      return;
    }
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartTime.current) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    touchStartTime.current = 0;

    // Minimum swipe threshold: 28px, vertical dominance
    if (Math.abs(deltaY) > 28 && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY > 0) {
        // Swiped UP -> Next video
        handleNextVideo();
      } else {
        // Swiped DOWN -> Previous video
        handlePrevVideo();
      }
    }
  };

  const handleTouchCancel = () => {
    touchStartTime.current = 0;
  };

  // Pointer drag events for desktop web users (click & drag up/down with mouse)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only handle mouse events here to prevent conflicting with touch swipe on mobile devices
    if (e.pointerType !== 'mouse') return;
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) {
      return;
    }
    isPointerDown.current = true;
    pointerStartY.current = e.clientY;
    pointerStartX.current = e.clientX;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    const deltaY = pointerStartY.current - e.clientY;
    const deltaX = pointerStartX.current - e.clientX;

    if (Math.abs(deltaY) > 28 && Math.abs(deltaY) > Math.abs(deltaX)) {
      if (deltaY > 0) {
        handleNextVideo();
      } else {
        handlePrevVideo();
      }
    }
  };

  const handlePointerCancel = () => {
    isPointerDown.current = false;
  };

  // Mouse wheel & trackpad swipe events (scroll down -> next video, scroll up -> previous video)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 400) return; // Debounce rapid wheel events

    if (e.deltaY > 30) {
      lastWheelTime.current = now;
      handleNextVideo();
    } else if (e.deltaY < -30) {
      lastWheelTime.current = now;
      handlePrevVideo();
    }
  };

  // Keyboard navigation for power users (ignore while typing in inputs/textareas)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'j') {
        handleNextVideo();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        handlePrevVideo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextVideo, handlePrevVideo]);

  const requireAuth = (actionDescription: string): boolean => {
    if (!authUser && !isLoggedIn) {
      sounds.playRewardTick();
      setAuthMode('signup');
      setAuthModalOpen(true);
      setShareToast(`Sign in or create an account to ${actionDescription}!`);
      return false;
    }
    return true;
  };

  const triggerTopicLikeBurst = (video: VideoItem) => {
    const reaction = detectVideoTopicReaction(video);
    if (topicBurstTimerRef.current) clearTimeout(topicBurstTimerRef.current);
    setTopicLikeBurst({ topic: reaction.topic, emoji: reaction.emoji, glowColor: reaction.glowColor, key: Date.now() });
    topicBurstTimerRef.current = setTimeout(() => {
      setTopicLikeBurst(null);
    }, 800);
  };

  useEffect(() => {
    setTopicLikeBurst(null);
    if (topicBurstTimerRef.current) {
      clearTimeout(topicBurstTimerRef.current);
      topicBurstTimerRef.current = null;
    }
  }, [currentVideo?.id]);

  const handleLike = () => {
    if (!currentVideo) return;
    if (!requireAuth('like videos')) return;
    if (!currentVideo.isLiked) {
      triggerTopicLikeBurst(currentVideo);
    } else {
      setTopicLikeBurst(null);
    }
    toggleLikeVideo(currentVideo.id);
  };

  const handleDoubleTapLike = () => {
    if (!currentVideo) return;
    if (!requireAuth('like videos')) return;
    triggerTopicLikeBurst(currentVideo);
    likeVideo(currentVideo.id);
  };

  const handleSave = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentVideo) return;
    if (!isSaved(currentVideo.id)) {
      toggleSaveVideo(currentVideo);
    }
    openSaveModal(currentVideo);
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentVideo) return;
    toggleFollowCreator(currentVideo.creator.id || currentVideo.creator.username);
  };

  const lastTipTapRef = useRef<number>(0);
  const handleTip = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const now = Date.now();
    if (now - lastTipTapRef.current < 350) return;
    lastTipTapRef.current = now;

    if (!currentVideo) return;
    sounds.playCoinTip();
    openTipModal(currentVideo);
  };

  const handleComment = () => {
    if (!currentVideo) return;
    if (!requireAuth('join discussions and post comments')) return;
    openCommentDrawer(currentVideo);
  };

  const handleUnlock = () => {
    if (!currentVideo) return;
    if (!requireAuth('unlock premium masterclass videos')) return;
    openUnlockPrompt(currentVideo);
  };

  // 1. Sleek TikTok/Reels Style Loading Screen (avoids flashing "No user videos" during network fetch)
  if (isVideosLoading && (!currentVideo || filteredVideos.length === 0)) {
    return (
      <div className="relative w-full h-full bg-[#050811] flex flex-col items-center justify-center overflow-hidden select-none">
        {/* Ambient Glow */}
        <div className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-amber-500/10 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />

        {/* Center Animated Logo & Status */}
        <div className="relative z-10 flex flex-col items-center px-6 text-center animate-fade-in">
          <div className="relative mb-5 flex items-center justify-center">
            {/* Smooth Spinning Ring */}
            <div className="absolute w-20 h-20 rounded-full border-2 border-transparent border-t-amber-500 border-r-amber-400 animate-spin" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF9F0A] to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/30">
              <Sparkles className="w-8 h-8 text-neutral-950 animate-pulse" />
            </div>
          </div>

          <h3 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
            ValuVid Stream Engine
          </h3>
          <p className="text-xs text-neutral-400 mt-1 animate-pulse">
            Loading creators and video feed...
          </p>

          <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
              Connecting HD Feed
            </span>
          </div>
        </div>

        {/* Shimmering Vertical Video Overlay Skeletons */}
        <div className="absolute right-3.5 bottom-24 flex flex-col items-center gap-4 z-10 opacity-25 pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-neutral-800 animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-neutral-800 animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-neutral-800 animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-neutral-800 animate-pulse" />
        </div>

        <div className="absolute left-4 bottom-16 w-3/5 flex flex-col gap-2 z-10 opacity-25 pointer-events-none">
          <div className="w-28 h-4 bg-neutral-800 rounded-md animate-pulse" />
          <div className="w-48 h-3.5 bg-neutral-800 rounded-md animate-pulse" />
          <div className="w-32 h-3 bg-neutral-800 rounded-md animate-pulse" />
        </div>
      </div>
    );
  }

  // 2. Empty Feed Screen (only shown AFTER loading completes and no videos exist in current filter)
  if (!currentVideo) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-neutral-950 text-white select-none">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400">
          <Sparkles className="w-8 h-8 animate-bounce" />
        </div>
        <h3 className="text-lg font-bold">No videos in this feed yet</h3>
        <p className="text-xs text-neutral-400 mt-1 mb-6 max-w-xs leading-relaxed">
          Be the first creator to record or upload a video here and earn viewer tips and watch rewards!
        </p>
        <div className="flex flex-col gap-2.5 w-full max-w-xs">
          <button
            onClick={() => setActiveTab('create')}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black rounded-xl text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
          >
            Upload Video in Studio 🚀
          </button>
          
          <button
            onClick={() => refreshVideosFromSupabase()}
            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Check for New Videos</span>
          </button>

          {feedFilter !== 'foryou' && (
            <button
              onClick={() => setFeedFilter('foryou')}
              className="w-full py-2 text-neutral-400 hover:text-white font-medium text-xs transition-colors"
            >
              Switch to For You Feed
            </button>
          )}
        </div>
      </div>
    );
  }

  const isLocked = currentVideo.isPayPerUnlock && !currentVideo.isUnlocked;

  return (
    <div 
      ref={containerRef} 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onWheel={handleWheel}
      onClick={() => {
        if (isCleanScreen) {
          setIsCleanScreen(false);
        }
      }}
      style={{ touchAction: 'none' }}
      className="relative w-full h-full bg-black select-none overflow-hidden flex flex-col justify-between touch-none"
    >
      {/* 9:16 Video Player Container with vertical slide transition */}
      <div 
        key={currentVideo.id}
        className={`absolute inset-0 z-10 ${
          slideDirection === 'up' ? 'animate-slide-up' : slideDirection === 'down' ? 'animate-slide-down' : ''
        }`}
        onAnimationEnd={() => setSlideDirection(null)}
      >
        <VideoPlayer
          video={currentVideo}
          isActive={!isLocked}
          onDoubleTapLike={handleDoubleTapLike}
          isCleanScreen={isCleanScreen}
          onToggleCleanScreen={(clean) => setIsCleanScreen(clean)}
          onPlaybackTimeUpdate={handlePlaybackTimeUpdate}
          onPlaybackStart={() => {
            if (currentVideo && currentVideo.id) {
              recordVideoView(currentVideo.id, currentUser);
            }
          }}
        />
      </div>

      {/* CLEAN FULLSCREEN INDICATOR TOAST */}
      {isCleanScreen && !isCinemaMode && !isNativePip && (
        <div className="absolute top-8 sm:top-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-fade-in flex items-center gap-1.5 bg-black/75 backdrop-blur-md border border-white/20 text-white/90 text-[10px] font-semibold px-3.5 py-1.5 rounded-full shadow-2xl">
          <Eye className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Clean Fullscreen • Tap anywhere to restore buttons</span>
        </div>
      )}

      {/* Pay-Per-Unlock Overlay if content is gated */}
      {isLocked && (
        <div className="absolute inset-0 z-20 backdrop-blur-xl bg-black/75 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/20 animate-pulse">
            <Lock className="w-8 h-8 text-amber-400" />
          </div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/40 mb-2">
            Creator Paywall • Micro-Unlock
          </span>
          <h2 className="text-xl font-bold text-white mb-2 leading-tight">
            {currentVideo.title}
          </h2>
          <p className="text-xs text-neutral-300 max-w-xs mb-6">
            Unlock instant full HD access to this exclusive creator masterclass and support @{currentVideo.creator.username}.
          </p>

          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 w-full max-w-xs mb-4">
            <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
              <span>Unlock Micro-Fee:</span>
              <span className="text-amber-400 font-bold text-base">${(currentVideo.unlockPriceGHS || 5.00).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span>Your Wallet Balance:</span>
              <span className="text-emerald-400 font-medium">${wallet.balanceUSD.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleUnlock}
            className="w-full max-w-xs py-3.5 px-6 rounded-xl bg-white hover:bg-neutral-100 text-black font-bold text-sm shadow-xl shadow-white/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Lock className="w-4 h-4 text-black" />
            Unlock Now for ${(currentVideo.unlockPriceGHS || 5.00).toFixed(2)}
          </button>
        </div>
      )}

      {/* TOP HEADER BAR (TikTok-Style, Centered, Following | For You | Fresh Creators) */}
      <header className={`relative z-20 w-full pt-[max(2.25rem,calc(env(safe-area-inset-top,0px)+0.75rem))] sm:pt-5 pb-2 px-3 sm:px-4 transition-all duration-300 flex items-center justify-center ${
        isNativePip ? 'hidden' : (isCleanScreen || isCinemaMode) ? 'opacity-0 -translate-y-6 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}>
        <div className="flex items-center justify-center gap-2 min-[360px]:gap-3 sm:gap-5">
          <button
            onClick={() => setFeedFilter('following')}
            className={`relative py-1 px-1.5 min-[360px]:px-2 text-[15px] min-[360px]:text-base sm:text-[17px] transition-all tracking-tight ${
              feedFilter === 'following'
                ? 'text-white font-extrabold scale-105 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]'
                : 'text-white/65 hover:text-white font-bold drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]'
            }`}
          >
            Following
            {feedFilter === 'following' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            )}
          </button>
          <span className="text-white/25 text-xs select-none">|</span>
          <button
            onClick={() => setFeedFilter('foryou')}
            className={`relative py-1 px-1.5 min-[360px]:px-2 text-[15px] min-[360px]:text-base sm:text-[17px] transition-all tracking-tight ${
              feedFilter === 'foryou' || !['following', 'foryou', 'fresh'].includes(feedFilter)
                ? 'text-white font-extrabold scale-105 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]'
                : 'text-white/65 hover:text-white font-bold drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]'
            }`}
          >
            For You
            {(feedFilter === 'foryou' || !['following', 'foryou', 'fresh'].includes(feedFilter)) && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            )}
          </button>
          <span className="text-white/25 text-xs select-none">|</span>
          <button
            onClick={() => setFeedFilter('fresh')}
            className={`relative py-1 px-1.5 min-[360px]:px-2 text-[15px] min-[360px]:text-base sm:text-[17px] transition-all tracking-tight ${
              feedFilter === 'fresh'
                ? 'text-white font-extrabold scale-105 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]'
                : 'text-white/65 hover:text-white font-bold drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]'
            }`}
            title="Highlighting creators under 1,000 followers"
          >
            Fresh Creators
            {feedFilter === 'fresh' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            )}
          </button>
        </div>
      </header>

      {/* DESKTOP PREVIOUS / NEXT VIDEO CONTROLS */}
      {!isCleanScreen && !isCinemaMode && filteredVideos.length > 1 && (
        <div className="hidden lg:flex flex-col gap-2.5 absolute left-3 top-1/2 -translate-y-1/2 z-30">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevVideo();
            }}
            className="w-10 h-10 rounded-full bg-black/55 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
            title="Previous video (↑)"
            aria-label="Previous video"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNextVideo();
            }}
            className="w-10 h-10 rounded-full bg-black/55 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer"
            title="Next video (↓)"
            aria-label="Next video"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* RIGHT ACTION SIDEBAR (Authentic TikTok Style: Full-bleed icons, bold metrics, spinning vinyl record) */}
      <aside 
        style={{ touchAction: 'manipulation' }}
        className={`absolute right-2 min-[380px]:right-3.5 bottom-[max(4.25rem,calc(env(safe-area-inset-bottom,0px)+3.75rem))] min-[380px]:bottom-[max(4.75rem,calc(env(safe-area-inset-bottom,0px)+4.25rem))] z-35 pointer-events-auto flex flex-col items-center gap-2.5 min-[380px]:gap-3.5 transition-all duration-300 ${
          isNativePip ? 'hidden' : (isCleanScreen || isCinemaMode) ? 'opacity-0 translate-x-6 pointer-events-none' : 'opacity-100 translate-x-0'
        }`}
      >
        {/* Creator Avatar & TikTok Red Follow Pill */}
        <div className="relative group mb-1">
          <div 
            onClick={() => {
              if (currentVideo.creator.username === currentUser.username) {
                setActiveTab('profile');
              } else {
                openCreatorProfile(currentVideo.creator);
              }
            }}
            className="w-11 h-11 min-[380px]:w-12 min-[380px]:h-12 rounded-full p-[2px] border-2 border-white/90 shadow-[0_2px_10px_rgba(0,0,0,0.6)] cursor-pointer active:scale-95 transition-transform overflow-hidden bg-neutral-900"
            title={`View @${currentVideo.creator.username}'s Profile`}
          >
            <img
              src={getUserAvatar(currentVideo.creator.avatar, currentVideo.creator.name || currentVideo.creator.username)}
              alt={currentVideo.creator.name || 'Creator'}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/default-avatar.jpg';
              }}
              className="w-full h-full rounded-full object-cover"
            />
          </div>

          {/* TikTok Red Follow Plus Button: Animates cleanly away upon following */}
          {currentVideo.creator.username !== currentUser.username &&
            !currentVideo.creator.isFollowing &&
            !isFollowingCreator(currentVideo.creator.username) &&
            !isFollowingCreator(currentVideo.creator.id) && (
            <button
              onClick={handleFollow}
              aria-label="Follow creator"
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full flex items-center justify-center shadow-lg bg-[#FE2C55] hover:bg-[#e0264a] text-white transition-all active:scale-75 cursor-pointer animate-in zoom-in-50 ring-2 ring-black"
              title={`Follow @${currentVideo.creator.username}`}
            >
              <Plus className="w-3 h-3 stroke-[3.5]" />
            </button>
          )}
        </div>

        {/* Like Button (Modern Gradient Ruby-Rose Heart with Ring Ripple & Sparkle Burst) */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center group active:scale-115 transition-transform"
          aria-label="Like video"
        >
          <div className="relative flex items-center justify-center w-9 h-9 min-[380px]:w-10 min-[380px]:h-10">
            {currentVideo.isLiked && (
              <>
                <span
                  key={`ring-${currentVideo.id}-${currentVideo.stats?.likes || 0}`}
                  className="absolute inset-0 rounded-full border-2 border-rose-400/80 pointer-events-none animate-like-ring"
                />
                {[0, 60, 120, 180, 240, 300].map((deg) => (
                  <span
                    key={`sp-${deg}-${currentVideo.stats?.likes || 0}`}
                    style={{ '--sparkle-angle': `${deg}deg` } as React.CSSProperties}
                    className={`absolute w-1.5 h-1.5 rounded-full pointer-events-none animate-like-sparkle ${
                      deg % 120 === 0 ? 'bg-amber-300' : 'bg-rose-400'
                    }`}
                  />
                ))}
              </>
            )}

            {topicLikeBurst ? (
              <div key={topicLikeBurst.key} className="animate-topic-pop flex items-center justify-center">
                <TopicReactionIcon
                  topic={topicLikeBurst.topic}
                  emoji={topicLikeBurst.emoji}
                  glowColor={topicLikeBurst.glowColor}
                />
              </div>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className={`w-7 h-7 min-[380px]:w-8 min-[380px]:h-8 transition-all duration-200 ${
                  currentVideo.isLiked
                    ? 'animate-spring-pop drop-shadow-[0_0_12px_rgba(254,44,85,0.75)]'
                    : 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] group-hover:scale-105'
                }`}
              >
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill={currentVideo.isLiked ? '#FE2C55' : 'rgba(255,255,255,0.14)'}
                  stroke={currentVideo.isLiked ? 'none' : '#FFFFFF'}
                  strokeWidth={currentVideo.isLiked ? '0' : '1.75'}
                />
                {currentVideo.isLiked && (
                  <path
                    d="M7.2 6.2c-1.1.3-1.8 1.1-2 2.1"
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    fill="none"
                  />
                )}
              </svg>
            )}
          </div>
          <span className="text-[11px] min-[380px]:text-[12px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] mt-0.5 select-none">
            {formatCompactNumber(currentVideo.stats?.likes || 0)}
          </span>
        </button>

        {/* Comment Drawer Trigger (Full-bleed Speech Bubble) */}
        <button
          onClick={handleComment}
          className="flex flex-col items-center group active:scale-125 transition-transform"
          aria-label="Comments"
        >
          <div className="flex items-center justify-center">
            <MessageCircle className="w-7 h-7 min-[380px]:w-8 min-[380px]:h-8 text-white fill-white/10 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] hover:text-white transition-colors" />
          </div>
          <span className="text-[11px] min-[380px]:text-[12px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] mt-0.5 select-none">
            {formatCompactNumber(Math.max(currentVideo.stats?.comments || 0, (comments[currentVideo.id] || []).length))}
          </span>
        </button>

        {/* Save / Bookmark Action (Full-bleed Ribbon, TikTok #FACE15 Gold Fill) */}
        <button
          onClick={handleSave}
          className="flex flex-col items-center group active:scale-125 transition-transform"
          aria-label="Save video"
        >
          <div className="flex items-center justify-center">
            <Bookmark className={`w-7 h-7 min-[380px]:w-8 min-[380px]:h-8 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] transition-colors ${
              isSaved(currentVideo.id) ? 'text-[#FACE15] fill-[#FACE15]' : 'text-white fill-white/10 hover:text-white'
            }`} />
          </div>
          <span className="text-[11px] min-[380px]:text-[12px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] mt-0.5 select-none">
            {formatCompactNumber(currentVideo.stats?.saves ?? (isSaved(currentVideo.id) ? 1 : 0))}
          </span>
        </button>

        {/* Share Button (Full-bleed Curved Arrow) */}
        <button
          onClick={() => shareVideoWithRewardLink(currentVideo)}
          className="flex flex-col items-center group active:scale-125 transition-transform"
          aria-label="Share video"
        >
          <div className="flex items-center justify-center">
            <Share2 className="w-7 h-7 min-[380px]:w-8 min-[380px]:h-8 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] hover:text-white transition-colors" />
          </div>
          <span className="text-[11px] min-[380px]:text-[12px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] mt-0.5 select-none">
            {formatCompactNumber(currentVideo.stats?.shares || 0)}
          </span>
        </button>

        {/* VALU-TIP / GIFT BUTTON */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleTip(e);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            handleTip(e);
          }}
          style={{ touchAction: 'manipulation' }}
          className="flex flex-col items-center group relative active:scale-110 transition-transform cursor-pointer pointer-events-auto select-none"
          aria-label="Tip creator"
          title="Tip creator"
        >
          <div className="w-8 h-8 min-[380px]:w-9 min-[380px]:h-9 rounded-full bg-gradient-to-tr from-amber-500/30 to-amber-400/20 border border-amber-400/80 flex items-center justify-center backdrop-blur-md shadow-[0_2px_10px_rgba(245,158,11,0.35)] group-hover:scale-105 transition-all pointer-events-none">
            <Coins className="w-4 h-4 min-[380px]:w-4.5 min-[380px]:h-4.5 text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]" />
          </div>
          <span className="text-[10px] min-[380px]:text-[11px] font-bold text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] mt-0.5 select-none tracking-tight pointer-events-none">
            ${(currentVideo.stats?.tipsTotalGHS || 0).toFixed(2)}
          </span>
        </button>

        {/* Classic TikTok Spinning Vinyl Record Disc with Floating Music Notes */}
        <div className="relative mt-1 flex items-center justify-center cursor-pointer group" onClick={handleSave}>
          {/* Floating animated musical notes */}
          <span className="absolute -top-1 right-2 text-white/80 text-xs font-bold pointer-events-none select-none animate-music-note-1">
            ♪
          </span>
          <span className="absolute -top-2 left-1 text-white/70 text-[10px] font-bold pointer-events-none select-none animate-music-note-2">
            ♫
          </span>

          {/* Vinyl Record */}
          <div className="w-10 h-10 min-[380px]:w-11 min-[380px]:h-11 rounded-full bg-gradient-to-tr from-neutral-950 via-neutral-900 to-neutral-800 border-2 border-neutral-700/80 p-1.5 flex items-center justify-center shadow-2xl animate-[spin_4s_linear_infinite] group-active:scale-95 transition-transform">
            {/* Center Album Artwork / Creator Avatar */}
            <img
              src={currentVideo.audioTrack?.coverUrl || getUserAvatar(currentVideo.creator.avatar, currentVideo.creator.name || currentVideo.creator.username)}
              alt="Music"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/default-avatar.jpg';
              }}
              className="w-5 h-5 rounded-full object-cover border border-white/40"
            />
          </div>
        </div>
      </aside>

      {/* BOTTOM OVERLAY (Hidden in Clean Fullscreen Mode) */}
      <footer className={`relative z-20 w-full px-3 min-[380px]:px-4 pb-[max(4.5rem,calc(env(safe-area-inset-bottom,0px)+4rem))] min-[380px]:pb-[max(5rem,calc(env(safe-area-inset-bottom,0px)+4.25rem))] flex flex-col gap-1.5 min-[380px]:gap-2 transition-all duration-300 pointer-events-none ${
        isNativePip ? 'hidden' : (isCleanScreen || isCinemaMode) ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'
      }`}>
        {/* Sleek Mini Watch Progress Pill (Ultra-compact, 70% less space) */}
        <div 
          onClick={() => setShowFundingModal(true)}
          className={`self-start flex items-center gap-1.5 backdrop-blur-md rounded-full px-2.5 py-1 cursor-pointer shadow-md transition-all active:scale-95 group pointer-events-auto ${
            isCurrentRewarded 
              ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-400' 
              : 'bg-black/50 border border-amber-400/40 text-amber-300'
          }`}
          title={isCurrentRewarded ? 'Reward Claimed • Scroll for next video' : 'Watch-to-Earn: Genuine attention reward funded by Brand Escrow'}
        >
          {isCurrentRewarded ? (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] font-bold text-emerald-300">+0.02 Claimed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="relative flex items-center">
                <Coins className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="absolute -top-0.5 -right-0.5 w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div className="w-10 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-300 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                  style={{ width: `${Math.min(100, Math.max(0, currentVideoProgress))}%` }}
                />
              </div>
              <span className="text-[9px] font-mono font-bold text-amber-300">
                {currentVideoProgress}%
              </span>
            </div>
          )}
        </div>

        {/* ValuShop: Interactive Shoppable Video Product Pin (only for authentic creator products, never mock text) */}
        {currentVideo.productTag &&
          currentVideo.productTag.id !== 'prod-kwesi-drumkit' &&
          !currentVideo.productTag.title?.toLowerCase().includes('drum kit') &&
          !currentVideo.productTag.title?.toLowerCase().includes('afro beats') && (
          <button
            onClick={() => openProductCheckout(currentVideo.productTag!)}
            className="self-start flex items-center gap-2 bg-neutral-900/90 hover:bg-neutral-850 border border-amber-400/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white shadow-xl shadow-black/60 active:scale-95 transition-all mb-1 group"
          >
            <span className="text-sm group-hover:scale-125 transition-transform">🛍️</span>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-amber-300 line-clamp-1 max-w-[190px]">
                {currentVideo.productTag.title}
              </span>
              <span className="text-[10px] font-mono font-bold text-white">
                GHS {currentVideo.productTag.priceGHS.toFixed(2)}
              </span>
            </div>
            <span className="ml-1 text-[9px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              Buy
            </span>
          </button>
        )}

        {/* Creator Info & Caption */}
        <div className="pr-16 min-[380px]:pr-20 max-w-[calc(100%-4.25rem)] pointer-events-none select-none">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span 
              onClick={() => {
                if (currentVideo.creator.username === currentUser.username) {
                  setActiveTab('profile');
                } else {
                  openCreatorProfile(currentVideo.creator);
                }
              }}
              className="text-sm font-bold text-white drop-shadow-md cursor-pointer hover:underline active:scale-95 transition-transform pointer-events-auto"
            >
              @{currentVideo.creator.username}
            </span>
            {currentVideo.creator.verified && (
              <span className="w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center text-[9px] text-neutral-950 font-black shrink-0">
                ✓
              </span>
            )}

            {/* Published Relative Time (TikTok-style e.g. "· 20m" or "· 1h") */}
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white/70 drop-shadow-sm select-none">
              <span className="text-white/40 font-bold">·</span>
              <span>{formatPublishedTime(currentVideo.createdAt, currentVideo.id)}</span>
            </span>

            {/* Modern AI Badge with Sparkle / Intelligence Indicator */}
            {currentVideo.isAiContent && currentVideo.aiDisclosureType === 'generated' ? (
              <button
                onClick={() => openAiDisclosureModal(currentVideo)}
                className="flex items-center gap-1 bg-gradient-to-r from-purple-950/90 via-indigo-950/80 to-purple-900/90 border border-purple-400/50 hover:border-purple-300 px-2 py-0.5 rounded-full text-[9px] font-bold text-purple-200 backdrop-blur-md shadow-sm transition-all active:scale-95 group pointer-events-auto"
                title="AI Generated Content (Synthetic)"
              >
                <Sparkles className="w-2.5 h-2.5 text-purple-300 group-hover:rotate-12 transition-transform" />
                <span>AI</span>
              </button>
            ) : currentVideo.isAiContent && currentVideo.aiDisclosureType === 'assisted' ? (
              <button
                onClick={() => openAiDisclosureModal(currentVideo)}
                className="flex items-center gap-1 bg-gradient-to-r from-cyan-950/90 via-blue-950/80 to-cyan-900/90 border border-cyan-400/50 hover:border-cyan-300 px-2 py-0.5 rounded-full text-[9px] font-bold text-cyan-200 backdrop-blur-md shadow-sm transition-all active:scale-95 group pointer-events-auto"
                title="AI-Assisted Production"
              >
                <Sparkles className="w-2.5 h-2.5 text-cyan-300 group-hover:scale-110 transition-transform" />
                <span>AI</span>
              </button>
            ) : null}
          </div>

          {/* Interactive Feature: Subtle 1-line chips only if attached */}
          {currentVideo.communityGoal && (
            <button
              onClick={() => openCommunityGoalModal(currentVideo)}
              className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-300 backdrop-blur-md mb-1 transition-colors pointer-events-auto"
            >
              <Target className="w-3 h-3 text-amber-400" />
              <span className="truncate max-w-[200px]">Goal: {currentVideo.communityGoal.title}</span>
              <span className="font-mono text-white text-[9px]">
                {Math.min(100, Math.round((currentVideo.communityGoal.currentGHS / currentVideo.communityGoal.targetGHS) * 100))}%
              </span>
            </button>
          )}

          {currentVideo.skillQuiz && (
            <button
              onClick={() => openSkillQuizModal(currentVideo)}
              className="flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-300 backdrop-blur-md mb-1 transition-colors pointer-events-auto"
            >
              <GraduationCap className="w-3 h-3 text-emerald-400" />
              <span>Skill Checkpoint (+GHS {currentVideo.skillQuiz.rewardGHS.toFixed(2)})</span>
            </button>
          )}

          {/* 1-Line Clean Video Caption with ...more */}
          <div className="flex flex-col drop-shadow-md">
            {currentVideo.title && currentVideo.title.toLowerCase() !== (currentVideo.caption || '').toLowerCase() && (
              <h2 className={`font-bold text-white text-xs sm:text-sm tracking-tight leading-snug drop-shadow-md ${
                captionExpanded ? '' : 'line-clamp-1'
              }`}>
                {currentVideo.title}
              </h2>
            )}

            {currentVideo.caption && (
              <div className="text-xs text-neutral-200 leading-relaxed">
                <p className={captionExpanded ? '' : 'line-clamp-1'}>
                  {currentVideo.caption}
                </p>
                {((currentVideo.caption && currentVideo.caption.length > 50) || (currentVideo.hashtags && currentVideo.hashtags.length > 0)) && (
                  <button
                    onClick={() => setCaptionExpanded(!captionExpanded)}
                    className="text-[11px] font-bold text-amber-300 hover:text-amber-200 hover:underline mt-0.5 inline-block pointer-events-auto"
                  >
                    {captionExpanded ? 'Show less' : '...more'}
                  </button>
                )}
              </div>
            )}

            {/* Video Hashtags (revealed only upon clicking ...more to keep screen 100% clean) */}
            {captionExpanded && currentVideo.hashtags && currentVideo.hashtags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5 animate-fade-in pointer-events-auto">
                {currentVideo.hashtags.map((tag, idx) => {
                  const rawTag = (tag || '').trim();
                  if (!rawTag) return null;
                  const displayTag = rawTag.startsWith('#') ? rawTag : `#${rawTag}`;
                  return (
                    <span
                      key={idx}
                      onClick={() => {
                        setDiscoverSearchQuery(displayTag);
                        setActiveTab('discover');
                      }}
                      className="text-[11px] font-bold text-amber-300 hover:text-amber-200 cursor-pointer active:scale-95 transition-transform"
                    >
                      {displayTag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sound / Music Track Link with rotating vinyl */}
          <div className="flex items-center gap-2 mt-1.5 pointer-events-auto">
            <Music className="w-3 h-3 text-neutral-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-[10px] text-neutral-300 truncate font-medium max-w-[200px]">
              {currentVideo.audioTrack?.title || 'Original Sound'} • {currentVideo.audioTrack?.artist || currentVideo.creator?.name || 'Creator'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
