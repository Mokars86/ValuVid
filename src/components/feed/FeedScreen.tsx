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
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VideoPlayer } from './VideoPlayer';
import { VideoItem } from '../../types';
import { sounds } from '../../utils/soundEffects';
import { preloadVideo } from '../../utils/mediaStorage';

export const FeedScreen: React.FC = () => {
  const { 
    videos, 
    feedFilter, 
    setFeedFilter, 
    toggleLikeVideo, 
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
    setShowFundingModal,
    isLoggedIn,
    authUser,
    setAuthModalOpen,
    setAuthMode,
    setShareToast,
    setActiveTab,
    currentUser
  } = useApp();

  const [activeIndex, setActiveIndex] = useState(currentVideoIndex || 0);
  const [slideDirection, setSlideDirection] = useState<'up' | 'down' | null>(null);

  // Sync activeIndex whenever parent navigation changes currentVideoIndex or videos list updates
  useEffect(() => {
    if (typeof currentVideoIndex === 'number' && currentVideoIndex >= 0) {
      setActiveIndex(currentVideoIndex);
      setIsCleanScreen(false);
    }
  }, [currentVideoIndex, videos.length]);

  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [isCleanScreen, setIsCleanScreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Swipe / Touch / Pointer Tracking Refs
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const touchStartTime = useRef<number>(0);

  const pointerStartY = useRef<number>(0);
  const pointerStartX = useRef<number>(0);
  const isPointerDown = useRef<boolean>(false);

  const lastWheelTime = useRef<number>(0);

  // Filter videos according to active tab
  const filteredVideos = useMemo(() => {
    let list = videos;
    if (feedFilter === 'following') {
      list = videos.filter((v) => v.creator.isFollowing);
    } else if (feedFilter === 'global') {
      // Sort by highest views across all regions
      list = [...videos].sort((a, b) => b.stats.views - a.stats.views);
    } else if (feedFilter === 'fresh') {
      list = videos.filter((v) => (v.creator.followers || 0) < 1500);
    } else if (feedFilter === 'bounties') {
      list = videos.filter((v) => v.category === 'bounties' || Boolean(v.bountyTag));
    } else if (feedFilter === 'ghana') {
      list = videos.filter((v) => v.category === 'ghana');
    } else if (feedFilter === 'tech') {
      list = videos.filter((v) => v.category === 'tech' || v.category === 'education');
    }

    // Pillar 3: Algorithmic Preference ("Human Touch" Authenticity Filter)
    if (humanTouchRatio >= 95) {
      // 100% Real People Only (Filter out pure synthetic AI)
      return list.filter((v) => v.aiDisclosureType !== 'generated');
    }

    return list;
  }, [videos, feedFilter, humanTouchRatio]);

  // Clamp active index if list length changes
  useEffect(() => {
    if (activeIndex >= filteredVideos.length) {
      setActiveIndex(Math.max(0, filteredVideos.length - 1));
    }
  }, [filteredVideos.length, activeIndex]);

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

  const currentVideo: VideoItem | undefined = filteredVideos[activeIndex] || filteredVideos[0];

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

  // Fair Per-Video Watch-to-Earn Engine:
  // - Rewards viewer ONCE per unique piece of content (GHS 0.02).
  // - If the user repeats, replays, or loops the video, NO second reward is issued.
  useEffect(() => {
    if (!currentVideo) return;
    if (currentVideo.isPayPerUnlock && !currentVideo.isUnlocked) return;
    if (isVideoRewarded(currentVideo.id)) return; // Already claimed: loop/repeat will NEVER reward again

    const interval = setInterval(() => {
      setCurrentVideoProgress((prev) => {
        if (prev >= 100) {
          // Reached 100% genuine watch-time! Award GHS 0.02 once
          claimWatchReward(currentVideo.id, currentVideo.title, currentVideo.creator?.username);
          return 100;
        }
        return Math.min(100, prev + 6); // ~16 seconds active watch time
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentVideo?.id, currentVideo?.isPayPerUnlock, currentVideo?.isUnlocked, currentVideo?.title, currentVideo?.creator?.username, isVideoRewarded, claimWatchReward]);

  const handleNextVideo = useCallback(() => {
    if (activeIndex < filteredVideos.length - 1) {
      setSlideDirection('up');
      setActiveIndex((prev) => {
        const next = prev + 1;
        setCurrentVideoIndex(next);
        return next;
      });
      setCaptionExpanded(false);
    }
  }, [activeIndex, filteredVideos.length, setCurrentVideoIndex]);

  const handlePrevVideo = useCallback(() => {
    if (activeIndex > 0) {
      setSlideDirection('down');
      setActiveIndex((prev) => {
        const next = prev - 1;
        setCurrentVideoIndex(next);
        return next;
      });
      setCaptionExpanded(false);
    }
  }, [activeIndex, setCurrentVideoIndex]);

  // Touch swipe events for mobile devices
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const elapsed = Date.now() - touchStartTime.current;

    // Minimum swipe threshold: 38px, vertical dominance, under 900ms
    if (Math.abs(deltaY) > 38 && Math.abs(deltaY) > Math.abs(deltaX) * 1.15 && elapsed < 900) {
      if (deltaY > 0) {
        // Swiped UP -> Next video
        handleNextVideo();
      } else {
        // Swiped DOWN -> Previous video
        handlePrevVideo();
      }
    }
  };

  // Pointer drag events for desktop web users (click & drag up/down)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore if clicking interactive controls (buttons, links, inputs)
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

    if (Math.abs(deltaY) > 40 && Math.abs(deltaY) > Math.abs(deltaX) * 1.15) {
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

  // Keyboard navigation for power users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const handleLike = () => {
    if (!currentVideo) return;
    const isOwner = (currentUser?.id && currentVideo.creator?.id && currentUser.id === currentVideo.creator.id) ||
                    (currentUser?.username && currentVideo.creator?.username && currentUser.username.toLowerCase() === currentVideo.creator.username.toLowerCase());
    if (isOwner) {
      setShareToast("Creators cannot like their own videos 🚫");
      return;
    }
    toggleLikeVideo(currentVideo.id);
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
    toggleFollowCreator(currentVideo.creator.id);
    const willFollow = !currentVideo.creator.isFollowing;
    setShareToast(willFollow ? `Now following @${currentVideo.creator.username}! 🎉` : `Unfollowed @${currentVideo.creator.username}`);
  };

  const handleTip = () => {
    if (!currentVideo) return;
    if (!requireAuth('tip creators with Mobile Money')) return;
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

  if (!currentVideo) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-neutral-950 text-white">
        <Sparkles className="w-12 h-12 text-amber-400 mb-3 animate-bounce" />
        <h3 className="text-lg font-bold">No user videos in this feed</h3>
        <p className="text-sm text-neutral-400 mt-1 mb-5 max-w-xs">
          Template videos have been removed. Upload or record your own videos to appear here!
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <button
            onClick={() => setActiveTab('create')}
            className="w-full py-3 bg-white hover:bg-neutral-100 text-black font-bold rounded-xl text-sm shadow-xl shadow-white/10 active:scale-95 transition-all"
          >
            Upload Video in Studio 🚀
          </button>
          {feedFilter !== 'foryou' && (
            <button
              onClick={() => setFeedFilter('foryou')}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium rounded-xl text-xs transition-colors"
            >
              View For You Feed
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
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onWheel={handleWheel}
      onClick={() => {
        if (isCleanScreen) {
          setIsCleanScreen(false);
        }
      }}
      className="relative w-full h-full bg-black select-none overflow-hidden flex flex-col justify-between"
    >
      {/* 9:16 Video Player Container with vertical slide transition */}
      <div 
        key={currentVideo.id}
        className={`absolute inset-0 z-0 ${
          slideDirection === 'up' ? 'animate-slide-up' : slideDirection === 'down' ? 'animate-slide-down' : ''
        }`}
        onAnimationEnd={() => setSlideDirection(null)}
      >
        <VideoPlayer
          video={currentVideo}
          isActive={!isLocked}
          onDoubleTapLike={handleLike}
          isCleanScreen={isCleanScreen}
          onToggleCleanScreen={(clean) => setIsCleanScreen(clean)}
        />
      </div>

      {/* CLEAN FULLSCREEN INDICATOR TOAST */}
      {isCleanScreen && (
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
              <span className="text-amber-400 font-bold text-base">GHS {(currentVideo.unlockPriceGHS || 5.00).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span>Your Wallet Balance:</span>
              <span className="text-emerald-400 font-medium">GHS {wallet.balanceGHS.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleUnlock}
            className="w-full max-w-xs py-3.5 px-6 rounded-xl bg-white hover:bg-neutral-100 text-black font-bold text-sm shadow-xl shadow-white/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Lock className="w-4 h-4 text-black" />
            Unlock Now for GHS {(currentVideo.unlockPriceGHS || 5.00).toFixed(2)}
          </button>
        </div>
      )}

      {/* TOP HEADER BAR (Clean, Centered, No Horizontal Scroll) */}
      <header className={`relative z-20 w-full pt-8 sm:pt-5 pb-2 px-4 transition-all duration-300 flex items-center justify-center ${
        isCleanScreen ? 'opacity-0 -translate-y-6 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}>
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => setFeedFilter('following')}
            className={`text-sm font-bold transition-all ${
              feedFilter === 'following'
                ? 'text-white border-b-2 border-white pb-0.5 scale-105'
                : 'text-white/60 hover:text-white pb-0.5'
            }`}
          >
            Following
          </button>
          <span className="text-white/30 text-xs">|</span>
          <button
            onClick={() => setFeedFilter('foryou')}
            className={`text-sm font-bold transition-all ${
              feedFilter === 'foryou' || !['following', 'foryou'].includes(feedFilter)
                ? 'text-white border-b-2 border-white pb-0.5 scale-105'
                : 'text-white/60 hover:text-white pb-0.5'
            }`}
          >
            For You
          </button>
        </div>
      </header>

      {/* RIGHT ACTION SIDEBAR (Hidden in Clean Fullscreen Mode) */}
      <aside className={`absolute right-2.5 min-[380px]:right-3 bottom-14 min-[380px]:bottom-20 z-20 flex flex-col items-center gap-2 min-[380px]:gap-3.5 transition-all duration-300 ${
        isCleanScreen ? 'opacity-0 translate-x-6 pointer-events-none' : 'opacity-100 translate-x-0'
      }`}>
        {/* Creator Avatar & Follow Button */}
        <div className="relative group mb-0.5">
          <div 
            onClick={() => setActiveTab('profile')}
            className="w-10 h-10 min-[380px]:w-12 min-[380px]:h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 to-rose-500 shadow-md cursor-pointer active:scale-95 transition-transform"
            title={`View @${currentVideo.creator.username}'s Profile`}
          >
            <img
              src={currentVideo.creator.avatar || '/default-avatar.jpg'}
              alt={currentVideo.creator.name || 'Creator'}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/default-avatar.jpg';
              }}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          {currentVideo.creator.username !== currentUser.username && (
            <button
              onClick={handleFollow}
              aria-label="Follow creator"
              className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 min-[380px]:w-5 min-[380px]:h-5 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 ${
                currentVideo.creator.isFollowing
                  ? 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400 scale-105'
                  : 'bg-rose-500 text-white hover:bg-rose-600'
              }`}
            >
              {currentVideo.creator.isFollowing ? (
                <Check className="w-2.5 h-2.5 min-[380px]:w-3 min-[380px]:h-3 stroke-[3]" />
              ) : (
                <Plus className="w-2.5 h-2.5 min-[380px]:w-3 min-[380px]:h-3 stroke-[3]" />
              )}
            </button>
          )}
        </div>

        {/* VALU-TIP BUTTON (Highlighted with Logo Colors & Live Tip Counter) */}
        <button
          onClick={handleTip}
          className="flex flex-col items-center group relative focus:outline-none"
          aria-label="Tip creator"
        >
          <div className="w-10 h-10 min-[380px]:w-12 min-[380px]:h-12 rounded-2xl bg-gradient-to-tr from-[#00B2FE] via-[#0284C7] to-[#FF9F0A] p-[2px] shadow-lg shadow-[#00B2FE]/30 animate-pulse-glow group-hover:scale-105 active:scale-95 transition-transform">
            <div className="w-full h-full bg-[#060D19] rounded-[14px] flex items-center justify-center">
              <Coins className="w-5 h-5 min-[380px]:w-6 min-[380px]:h-6 text-[#FF9F0A] group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div className="mt-0.5 min-[380px]:mt-1 bg-[#060D19]/90 border border-[#00B2FE]/50 backdrop-blur-md px-1.5 py-0.2 min-[380px]:py-0.5 rounded-full shadow-sm">
            <span className="text-[9px] min-[380px]:text-[10px] font-bold text-cyan-300">
              GHS {(currentVideo.stats.tipsTotalGHS || 0).toFixed(1)}
            </span>
          </div>
          <span className="text-[8px] min-[380px]:text-[9px] font-semibold text-neutral-300 mt-0.5">Valu-Tip</span>
        </button>

        {/* Like Button */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center group"
          aria-label="Like video"
        >
          <div className="w-9 h-9 min-[380px]:w-10 min-[380px]:h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-black/60 transition-colors">
            <Heart
              className={`w-4 h-4 min-[380px]:w-5 min-[380px]:h-5 transition-transform group-hover:scale-110 ${
                currentVideo.isLiked
                  ? 'text-rose-500 fill-rose-500'
                  : 'text-white'
              }`}
            />
          </div>
          <span className="text-[10px] min-[380px]:text-[11px] font-medium text-white drop-shadow-md mt-0.5 min-[380px]:mt-1">
            {(currentVideo.stats.likes || 0).toLocaleString()}
          </span>
        </button>

        {/* Comment Drawer Trigger */}
        <button
          onClick={handleComment}
          className="flex flex-col items-center group"
          aria-label="Comments"
        >
          <div className="w-9 h-9 min-[380px]:w-10 min-[380px]:h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-black/60 transition-colors">
            <MessageCircle className="w-4 h-4 min-[380px]:w-5 min-[380px]:h-5 text-white group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-[10px] min-[380px]:text-[11px] font-medium text-white drop-shadow-md mt-0.5 min-[380px]:mt-1">
            {(currentVideo.stats.comments || 0).toLocaleString()}
          </span>
        </button>

        {/* Share & Reward Button with Persistent Live Count */}
        <button
          onClick={() => shareVideoWithRewardLink(currentVideo)}
          className="flex flex-col items-center group relative active:scale-95 transition-transform"
          aria-label="Share and earn curator reward"
        >
          <div className="w-9 h-9 min-[380px]:w-10 min-[380px]:h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-black/60 transition-colors">
            <Share2 className="w-4 h-4 min-[380px]:w-5 min-[380px]:h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <span className="text-[10px] min-[380px]:text-[11px] font-medium text-white drop-shadow-md mt-0.5 min-[380px]:mt-1">
            {(currentVideo.stats.shares || 0).toLocaleString()}
          </span>
          <span className="text-[7px] min-[380px]:text-[8px] font-bold text-cyan-300 bg-cyan-950/80 px-1 py-0.2 rounded-full border border-cyan-500/40 leading-none mt-0.5">
            +5%
          </span>
        </button>

        {/* Save Video Action (Bookmarks & Device Download) */}
        <button
          onClick={handleSave}
          className="flex flex-col items-center group active:scale-95 transition-transform"
          aria-label="Save or download video"
        >
          <div className={`w-9 h-9 min-[380px]:w-10 min-[380px]:h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border transition-all ${
            isSaved(currentVideo.id)
              ? 'border-amber-400 bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
              : 'border-white/10 group-hover:bg-black/60'
          }`}>
            <Bookmark className={`w-4 h-4 min-[380px]:w-4.5 min-[380px]:h-4.5 group-hover:scale-110 transition-transform ${
              isSaved(currentVideo.id) ? 'text-amber-400 fill-amber-400' : 'text-neutral-200'
            }`} />
          </div>
          <span className="text-[10px] min-[380px]:text-[11px] font-medium text-white drop-shadow-md mt-0.5 min-[380px]:mt-1">
            {(currentVideo.stats?.saves ?? (isSaved(currentVideo.id) ? 1 : 0)).toLocaleString()}
          </span>
          <span className="text-[7px] min-[380px]:text-[8px] font-semibold text-neutral-400 leading-none mt-0.5">
            {isSaved(currentVideo.id) ? 'Saved' : 'Save'}
          </span>
        </button>
      </aside>

      {/* BOTTOM OVERLAY (Hidden in Clean Fullscreen Mode) */}
      <footer className={`relative z-20 w-full px-3 min-[380px]:px-4 pb-2.5 min-[380px]:pb-3 flex flex-col gap-1.5 min-[380px]:gap-2 transition-all duration-300 ${
        isCleanScreen ? 'opacity-0 translate-y-6 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}>
        {/* Sleek Live Watch Progress Pill (Rewards strictly ONCE per unique video) */}
        <div 
          onClick={() => setShowFundingModal(true)}
          className={`self-start flex items-center gap-2 backdrop-blur-md rounded-full px-3 py-1.5 cursor-pointer shadow-lg shadow-black/50 transition-all active:scale-95 group ${
            isCurrentRewarded 
              ? 'bg-emerald-950/70 border border-emerald-500/50 hover:border-emerald-400' 
              : 'bg-black/60 border border-amber-400/35 hover:border-amber-400/70'
          }`}
          title={isCurrentRewarded ? 'Reward Claimed for this video • Scroll to earn on next video' : 'Watch-to-Earn: Genuine attention reward funded by Brand Escrow'}
        >
          {isCurrentRewarded ? (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span className="text-[10px] font-bold text-emerald-300">Reward Claimed (+0.02)</span>
              <span className="text-[9px] text-neutral-400 font-medium pl-1 border-l border-white/10 hidden sm:inline">
                Scroll for next
              </span>
            </div>
          ) : (
            <>
              <div className="relative flex items-center">
                <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0 group-hover:rotate-12 transition-transform" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div className="w-16 min-[360px]:w-20 h-1.5 bg-white/20 rounded-full overflow-hidden p-[0.5px]">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                  style={{ width: `${Math.min(100, Math.max(0, currentVideoProgress))}%` }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-300">
                {currentVideoProgress}%
              </span>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-1 py-0.2 rounded-full leading-none">
                +0.02
              </span>
            </>
          )}
        </div>

        {/* Creator Info & Caption */}
        <div className="pr-14 min-[380px]:pr-16 max-w-sm">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-sm font-bold text-white drop-shadow-md">
              @{currentVideo.creator.username}
            </span>
            {currentVideo.creator.verified && (
              <span className="w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center text-[9px] text-neutral-950 font-black shrink-0">
                ✓
              </span>
            )}

            {/* HD Resolution Quality Badge */}
            <span className="text-[9px] bg-black/60 border border-white/20 text-neutral-300 font-bold px-1.5 py-0.2 rounded backdrop-blur-md">
              {currentVideo.videoResolution?.qualityLabel || '720p HD'}
            </span>

            {/* Modern AI Badge with Sparkle / Intelligence Indicator */}
            {currentVideo.isAiContent && currentVideo.aiDisclosureType === 'generated' ? (
              <button
                onClick={() => openAiDisclosureModal(currentVideo)}
                className="flex items-center gap-1 bg-gradient-to-r from-purple-950/90 via-indigo-950/80 to-purple-900/90 border border-purple-400/50 hover:border-purple-300 px-2 py-0.5 rounded-full text-[9px] font-bold text-purple-200 backdrop-blur-md shadow-sm transition-all active:scale-95 group"
                title="AI Generated Content (Synthetic)"
              >
                <Sparkles className="w-2.5 h-2.5 text-purple-300 group-hover:rotate-12 transition-transform" />
                <span>AI</span>
              </button>
            ) : currentVideo.isAiContent && currentVideo.aiDisclosureType === 'assisted' ? (
              <button
                onClick={() => openAiDisclosureModal(currentVideo)}
                className="flex items-center gap-1 bg-gradient-to-r from-cyan-950/90 via-blue-950/80 to-cyan-900/90 border border-cyan-400/50 hover:border-cyan-300 px-2 py-0.5 rounded-full text-[9px] font-bold text-cyan-200 backdrop-blur-md shadow-sm transition-all active:scale-95 group"
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
              className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-300 backdrop-blur-md mb-1 transition-colors"
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
              className="flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-300 backdrop-blur-md mb-1 transition-colors"
            >
              <GraduationCap className="w-3 h-3 text-emerald-400" />
              <span>Skill Checkpoint (+GHS {currentVideo.skillQuiz.rewardGHS.toFixed(2)})</span>
            </button>
          )}

          {/* Expandable Caption with Hashtags */}
          <div className="text-xs text-neutral-200 leading-relaxed drop-shadow-md">
            <p className={captionExpanded ? '' : 'line-clamp-2'}>
              {currentVideo.caption}
            </p>
            {currentVideo.caption.length > 70 && (
              <button
                onClick={() => setCaptionExpanded(!captionExpanded)}
                className="text-[11px] font-bold text-amber-300 mt-0.5 hover:underline"
              >
                {captionExpanded ? 'Show less' : '...more'}
              </button>
            )}
          </div>

          {/* Sound / Music Track Link with rotating vinyl */}
          <div className="flex items-center gap-2 mt-2">
            <Music className="w-3.5 h-3.5 text-neutral-300 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-[11px] text-neutral-300 truncate font-medium">
              {currentVideo.audioTrack.title} • {currentVideo.audioTrack.artist}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
