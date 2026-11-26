import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Search, 
  Coins, 
  Award, 
  Sparkles, 
  Users, 
  Clock, 
  ArrowRight, 
  Eye, 
  CheckCircle2, 
  Share2,
  Lock,
  Trophy,
  Play,
  Check,
  ShieldCheck,
  FilterX,
  Plus,
  User,
  ChevronLeft,
  ChevronRight,
  Flame,
  Crown,
  Medal,
  Leaf,
  Bot,
  Vote,
  TrendingUp,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BountyChallenge, VideoItem } from '../../types';
import { sounds } from '../../utils/soundEffects';
import { getAllKnownUsers, getUserAvatar, isTestUserOrMockVideo, isMockAccount } from '../../utils/userDirectory';
import { searchProfilesInSupabase, getDeletedVideoIds } from '../../services/supabaseClient';
import { formatCompactNumber } from '../../utils/formatNumber';
import { PublishedVideoThumbnail } from '../common/PublishedVideoThumbnail';

export const DiscoverScreen: React.FC = () => {
  const { 
    theme,
    videos, 
    bounties, 
    transactions,
    setCurrentVideoIndex, 
    setActiveTab, 
    setActiveTab: setAppTab, 
    openTipModal,
    setShowSponsorModal,
    showWinPoolModal,
    setShowWinPoolModal,
    isFollowingCreator,
    toggleFollowCreator,
    currentUser,
    discoverSearchQuery,
    setDiscoverSearchQuery,
    openCreatorProfile,
    playVideo,
    recordVideoView,
    wallet,
    backPredictionWithWallet
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Synchronize incoming deep link queries
  useEffect(() => {
    if (discoverSearchQuery) {
      setSearchQuery(discoverSearchQuery);
    }
  }, [discoverSearchQuery]);
  const [activeBountyModal, setActiveBountyModal] = useState<BountyChallenge | null>(null);
  const [bountyTab, setBountyTab] = useState<'overview' | 'submissions' | 'payouts'>('overview');
  const [awardedWinner, setAwardedWinner] = useState<{ creator: string; amount: number; rank: string } | null>(null);
  const [remoteCreators, setRemoteCreators] = useState<any[]>([]);

  const totalWinPoolGHS = useMemo(() => {
    return bounties.reduce((sum, b) => sum + (b.rewardPoolGHS || 0), 0);
  }, [bounties]);

  const latestBountyTx = useMemo(() => {
    return transactions.find((t) => t.type === 'bounty_reward');
  }, [transactions]);

  // COMMUNITY "VOTE & WIN" PREDICTIONS (Real Data & User Created - All Mock Questions Removed)
  const [predictions, setPredictions] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('valuvid_community_predictions_v3');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Strictly exclude old mock questions (pred-1, pred-2, pred-3)
          return parsed.filter((p: any) => p && !['pred-1', 'pred-2', 'pred-3'].includes(p.id));
        }
      }
    } catch {}
    return [];
  });

  const [votedPredictions, setVotedPredictions] = useState<Record<string, 'A' | 'B'>>(() => {
    try {
      const raw = localStorage.getItem('valuvid_prediction_votes_v3');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [showCreatePredictionModal, setShowCreatePredictionModal] = useState(false);
  const [newPredQuestion, setNewPredQuestion] = useState('');
  const [newPredCategory, setNewPredCategory] = useState('Creator Milestones');
  const [newPredOptionA, setNewPredOptionA] = useState('🔥 Yes, 100%');
  const [newPredOptionB, setNewPredOptionB] = useState('⏳ Not yet');
  const [newPredPoolGHS, setNewPredPoolGHS] = useState(10);
  const [newPredDuration, setNewPredDuration] = useState('3 days left');
  const [predictionFeedback, setPredictionFeedback] = useState<string | null>(null);

  const handleVotePrediction = (predId: string, option: 'A' | 'B') => {
    if (votedPredictions[predId]) return;
    try {
      sounds.playLikePop();
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {}

    const updatedVoted: Record<string, 'A' | 'B'> = { ...votedPredictions, [predId]: option };
    setVotedPredictions(updatedVoted);
    try {
      localStorage.setItem('valuvid_prediction_votes_v3', JSON.stringify(updatedVoted));
    } catch {}

    setPredictions((prev) => {
      const nextList = prev.map((p) => {
        if (p.id === predId) {
          const newA = option === 'A' ? p.optionA.votes + 1 : p.optionA.votes;
          const newB = option === 'B' ? p.optionB.votes + 1 : p.optionB.votes;
          const total = newA + newB;
          const pctA = total > 0 ? Math.round((newA / total) * 100) : 50;
          const pctB = total > 0 ? 100 - pctA : 50;
          return {
            ...p,
            optionA: { ...p.optionA, votes: newA, percent: pctA },
            optionB: { ...p.optionB, votes: newB, percent: pctB },
          };
        }
        return p;
      });
      try {
        localStorage.setItem('valuvid_community_predictions_v3', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    setPredictionFeedback('✅ Vote cast! You are in the community prediction reward pool.');
    setTimeout(() => setPredictionFeedback(null), 3000);
  };

  const handleBackPredictionPool = (predId: string) => {
    const targetPred = predictions.find((p) => p.id === predId);
    if (!targetPred) return;

    // Check if user has real money in ValuWallet
    if (wallet.balanceGHS < 1.00) {
      setPredictionFeedback(`⚠️ Insufficient ValuWallet balance (GHS ${wallet.balanceGHS.toFixed(2)}). Please top up your wallet to back predictions!`);
      setTimeout(() => setPredictionFeedback(null), 4000);
      return;
    }

    // Deduct real cash from ValuWallet and log transaction receipt
    const success = backPredictionWithWallet(predId, targetPred.question, 1.00);
    if (!success) {
      setPredictionFeedback('⚠️ Transaction could not be completed. Please try again.');
      setTimeout(() => setPredictionFeedback(null), 3000);
      return;
    }

    // Update prediction prize pool (Confetti removed for clean UX)
    setPredictions((prev) => {
      const nextList = prev.map((p) => {
        if (p.id === predId) {
          return { ...p, poolGHS: Number((p.poolGHS + 1).toFixed(2)) };
        }
        return p;
      });
      try {
        localStorage.setItem('valuvid_community_predictions_v3', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    setPredictionFeedback(`🎉 GHS 1.00 backed! Deducted from ValuWallet & added to prize pool (GHS ${Number((targetPred.poolGHS + 1).toFixed(2))}).`);
    setTimeout(() => setPredictionFeedback(null), 3500);
  };

  const handleCreatePrediction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPredQuestion.trim()) return;

    sounds.playCoinTip();
    try {
      confetti({
        particleCount: 40,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {}

    const newPred = {
      id: `pred-${Date.now()}`,
      question: newPredQuestion.trim(),
      category: newPredCategory,
      poolGHS: Math.max(0, Number(newPredPoolGHS) || 0),
      endsIn: newPredDuration,
      createdAt: new Date().toISOString(),
      creatorUsername: currentUser?.username || 'creator',
      optionA: { id: 'A' as const, label: newPredOptionA.trim() || '🔥 Yes', votes: 0, percent: 50 },
      optionB: { id: 'B' as const, label: newPredOptionB.trim() || '⏳ No', votes: 0, percent: 50 },
    };

    setPredictions((prev) => {
      const nextList = [newPred, ...prev];
      try {
        localStorage.setItem('valuvid_community_predictions_v3', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    setShowCreatePredictionModal(false);
    setNewPredQuestion('');
    setPredictionFeedback('🎉 New prediction published live on Discover!');
    setTimeout(() => setPredictionFeedback(null), 3500);
  };

  const filters = [
    { id: 'all', label: 'Trending & All', badge: 'Live', scope: 'all' },
    { id: 'human-only', label: '100% Human Only', badge: 'Authentic', scope: 'human' },
    { id: 'ai-lab', label: 'AI Creative Lab', badge: 'AI', scope: 'ai' },
    { id: 'global', label: 'Global Scale', badge: 'Worldwide', scope: 'global' },
    { id: 'local-ghana', label: 'Local African Hub', badge: 'Ghana', scope: 'local' },
    { id: 'high-engagement', label: 'High Engagement', badge: 'Viral', scope: 'performance' },
    { id: 'tech', label: 'Tech & AI', badge: 'Code', scope: 'niche' },
    { id: 'fashion-culture', label: 'Culture & Fashion', badge: 'Vibes', scope: 'niche' },
    { id: 'education', label: 'Tutorials & Skills', badge: 'Learn', scope: 'niche' },
    { id: 'bounties', label: 'Cash Bounties', badge: 'Escrow', scope: 'bounties' },
  ];

  const cleanQuery = searchQuery.trim().toLowerCase().replace(/^@/, '');

  // Performance engagement calculator: Views + Likes + Comments + Shares + Tips
  const getEngagementScore = (v: VideoItem) => {
    const views = v.stats?.views || 0;
    const likes = v.stats?.likes || 0;
    const comments = v.stats?.comments || 0;
    const shares = v.stats?.shares || 0;
    const tips = v.stats?.tipsCount || 0;
    return views + likes * 3 + comments * 4 + shares * 5 + tips * 8;
  };

  // Weekly Top-Tipped Creators Podium calculation
  const topTippedCreators = useMemo(() => {
    const creatorMap = new Map<string, { creator: any; totalTipsGHS: number; tipsCount: number; topVideo?: VideoItem }>();

    videos.forEach((v) => {
      if (!v || !v.creator?.username || isTestUserOrMockVideo(v) || isMockAccount(v.creator.username)) return;
      const key = v.creator.username.toLowerCase().replace(/^@/, '');
      const current = creatorMap.get(key) || {
        creator: v.creator,
        totalTipsGHS: 0,
        tipsCount: 0,
        topVideo: v
      };
      const vTips = typeof v.stats?.tipsTotalGHS === 'number' ? v.stats.tipsTotalGHS : 0;
      const vTipsCount = typeof v.stats?.tipsCount === 'number' ? v.stats.tipsCount : 0;
      current.totalTipsGHS += vTips;
      current.tipsCount += vTipsCount;
      if (vTips >= (current.topVideo?.stats?.tipsTotalGHS || 0)) {
        current.topVideo = v;
      }
      creatorMap.set(key, current);
    });

    const list = Array.from(creatorMap.values()).filter((c) => c.creator && c.creator.username);

    list.sort((a, b) => {
      if (b.totalTipsGHS !== a.totalTipsGHS) {
        return b.totalTipsGHS - a.totalTipsGHS;
      }
      return (b.creator.followers || 0) - (a.creator.followers || 0);
    });

    return list.slice(0, 5);
  }, [videos]);

  // Filter & rank videos based on performance metrics, local Ghanaian/African tags, and global scaling
  const filteredVideos = useMemo(() => {
    const deletedIds = getDeletedVideoIds();
    // 1. Text & creator search filter
    const searchMatches = videos.filter((video) => {
      // Exclude system follow/like records, deleted items, and test entries
      const cat = (video?.category as string) || '';
      const isInvalid =
        !video ||
        deletedIds.includes(video.id) ||
        video.id === 'test_follow_record' ||
        video.id.startsWith('test') ||
        video.id.startsWith('test_') ||
        (video.title || '').toLowerCase().includes('test follow') ||
        video.caption === '[DELETED]' ||
        (video.title || '').includes('[DELETED]') ||
        video.caption === '[FOLLOW_RECORD]' ||
        video.caption === '[LIKE_RECORD]' ||
        cat === 'deleted' ||
        cat === 'follow_record' ||
        cat === 'like_record' ||
        cat === 'user_registry';
      if (isInvalid || isTestUserOrMockVideo(video)) return false;

      const creatorUsername = (video.creator?.username || '').toLowerCase();
      const creatorName = (video.creator?.name || '').toLowerCase();
      const videoTitle = (video.title || '').toLowerCase();
      const videoCaption = (video.caption || '').toLowerCase();

      return (
        !cleanQuery ||
        creatorUsername.includes(cleanQuery) ||
        creatorName.includes(cleanQuery) ||
        videoTitle.includes(cleanQuery) ||
        videoCaption.includes(cleanQuery) ||
        (video.hashtags && video.hashtags.some((tag) => tag.toLowerCase().replace(/^#/, '').includes(cleanQuery)))
      );
    });

    // 2. Categorize and rank dynamically based on selected channel & engagement
    let categorized = searchMatches.filter((video) => {
      if (selectedFilter === 'all') return true;

      if (selectedFilter === 'human-only') {
        // 100% Authentic Human Creations (Strictly non-generative content)
        return !video.isAiContent && video.aiDisclosureType !== 'generated';
      }

      if (selectedFilter === 'ai-lab') {
        // AI-Assisted & Generative Creative Lab showcases
        return Boolean(video.isAiContent) || video.aiDisclosureType === 'generated' || video.aiDisclosureType === 'assisted';
      }

      const combinedText = `${video.title} ${video.caption} ${(video.hashtags || []).join(' ')} ${video.category} ${video.creator?.username}`.toLowerCase();

      if (selectedFilter === 'global') {
        // High reach worldwide videos
        return (video.stats?.views || 0) > 200 || !combinedText.includes('local');
      }

      if (selectedFilter === 'local-ghana') {
        // Local African & Ghanaian creators, culture, or local tags
        const isGhanaianCreator = ['mokarstech', 'aaish'].some(
          (u) => video.creator?.username?.toLowerCase().includes(u)
        );
        return (
          video.category === 'ghana' ||
          video.category === 'fashion' ||
          isGhanaianCreator ||
          combinedText.includes('ghana') ||
          combinedText.includes('accra') ||
          combinedText.includes('kumasi') ||
          combinedText.includes('africa') ||
          combinedText.includes('momo')
        );
      }

      if (selectedFilter === 'high-engagement') {
        // Top performance engagement (high like/view ratio or high tip count)
        const score = getEngagementScore(video);
        return score >= 150 || (video.stats?.likes || 0) >= 15 || (video.stats?.tipsCount || 0) > 0;
      }

      if (selectedFilter === 'tech') {
        return (
          video.category === 'tech' ||
          video.category === 'education' ||
          combinedText.includes('tech') ||
          combinedText.includes('ai') ||
          combinedText.includes('code') ||
          combinedText.includes('software') ||
          combinedText.includes('crypto') ||
          combinedText.includes('developer')
        );
      }

      if (selectedFilter === 'fashion-culture') {
        return (
          video.category === 'fashion' ||
          combinedText.includes('fashion') ||
          combinedText.includes('style') ||
          combinedText.includes('art') ||
          combinedText.includes('design') ||
          combinedText.includes('music') ||
          combinedText.includes('dance') ||
          combinedText.includes('culture')
        );
      }

      if (selectedFilter === 'education') {
        return (
          video.category === 'education' ||
          combinedText.includes('tutorial') ||
          combinedText.includes('learn') ||
          combinedText.includes('how to') ||
          combinedText.includes('guide') ||
          combinedText.includes('masterclass') ||
          combinedText.includes('skills')
        );
      }

      if (selectedFilter === 'bounties') {
        return video.category === 'bounties' || Boolean(video.bountyTag);
      }

      return true;
    });

    // 3. Sort: Prioritize fresh community creations at the top of Top Community Creations
    return categorized.sort((a, b) => {
      const isUserA = a.id.startsWith('vid-user-');
      const isUserB = b.id.startsWith('vid-user-');

      if (isUserA && isUserB) {
        const timeA = parseInt(a.id.replace('vid-user-', '')) || 0;
        const timeB = parseInt(b.id.replace('vid-user-', '')) || 0;
        if (timeA !== timeB) return timeB - timeA;
      }
      if (isUserA && !isUserB) return -1;
      if (!isUserA && isUserB) return 1;

      if (a.createdAt && b.createdAt) {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        if (dateA !== dateB) return dateB - dateA;
      }

      return getEngagementScore(b) - getEngagementScore(a);
    });
  }, [videos, cleanQuery, selectedFilter]);

  // Fresh Creators Spotlight Video Reel (Newest genuine uploads from creators)
  const freshCreatorVideos = useMemo(() => {
    const deletedIds = getDeletedVideoIds();
    return videos
      .filter((v) => {
        if (!v || deletedIds.includes(v.id)) return false;
        if (v.caption === '[DELETED]' || v.title === '[DELETED]' || (v.title || '').includes('[DELETED]')) return false;
        const cat = (v.category as string) || '';
        if (cat === 'deleted' || cat === 'user_registry' || cat === 'follow_record' || cat === 'like_record') return false;
        return true;
      })
      .sort((a, b) => {
        const isUserA = a.id.startsWith('vid-user-');
        const isUserB = b.id.startsWith('vid-user-');
        if (isUserA && isUserB) {
          const timeA = parseInt(a.id.replace('vid-user-', '')) || 0;
          const timeB = parseInt(b.id.replace('vid-user-', '')) || 0;
          if (timeA !== timeB) return timeB - timeA;
        }
        if (isUserA && !isUserB) return -1;
        if (!isUserA && isUserB) return 1;
        if (a.createdAt && b.createdAt) {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          if (dateA !== dateB) return dateB - dateA;
        }
        return getEngagementScore(b) - getEngagementScore(a);
      })
      .slice(0, 10);
  }, [videos]);

  const spotlightScrollRef = useRef<HTMLDivElement | null>(null);
  const [activeSpotlightIdx, setActiveSpotlightIdx] = useState(0);
  const [isSpotlightPaused, setIsSpotlightPaused] = useState(false);
  const pauseTimeoutRef = useRef<any>(null);

  // Automatic slide advance every 3.5 seconds (pauses upon user touch / interaction)
  useEffect(() => {
    if (freshCreatorVideos.length <= 1 || isSpotlightPaused) return;

    const interval = setInterval(() => {
      setActiveSpotlightIdx((prev) => {
        const next = (prev + 1) % freshCreatorVideos.length;
        if (spotlightScrollRef.current) {
          const container = spotlightScrollRef.current;
          const firstCard = container.firstElementChild as HTMLElement | null;
          const cardWidth = firstCard ? firstCard.offsetWidth + 12 : 200;
          container.scrollTo({
            left: next * cardWidth,
            behavior: 'smooth'
          });
        }
        return next;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [freshCreatorVideos.length, isSpotlightPaused]);

  // Automatically record view for active spotlight video when previewed
  useEffect(() => {
    const currentSpotlightVideo = freshCreatorVideos[activeSpotlightIdx];
    if (!currentSpotlightVideo || !currentSpotlightVideo.id) return;
    const timer = setTimeout(() => {
      recordVideoView(currentSpotlightVideo.id, currentUser);
    }, 2500);
    return () => clearTimeout(timer);
  }, [activeSpotlightIdx, freshCreatorVideos, recordVideoView, currentUser]);

  const handleSpotlightTouch = () => {
    setIsSpotlightPaused(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsSpotlightPaused(false);
    }, 5000);
  };

  const handleSpotlightScroll = () => {
    if (!spotlightScrollRef.current) return;
    const container = spotlightScrollRef.current;
    const firstCard = container.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard ? firstCard.offsetWidth + 12 : 200;
    const idx = Math.round(container.scrollLeft / cardWidth);
    if (idx >= 0 && idx < freshCreatorVideos.length && idx !== activeSpotlightIdx) {
      setActiveSpotlightIdx(idx);
    }
  };

  const slideSpotlightPrev = () => {
    handleSpotlightTouch();
    setActiveSpotlightIdx((prev) => {
      const next = prev === 0 ? freshCreatorVideos.length - 1 : prev - 1;
      if (spotlightScrollRef.current) {
        const container = spotlightScrollRef.current;
        const firstCard = container.firstElementChild as HTMLElement | null;
        const cardWidth = firstCard ? firstCard.offsetWidth + 12 : 200;
        container.scrollTo({ left: next * cardWidth, behavior: 'smooth' });
      }
      return next;
    });
  };

  const slideSpotlightNext = () => {
    handleSpotlightTouch();
    setActiveSpotlightIdx((prev) => {
      const next = (prev + 1) % freshCreatorVideos.length;
      if (spotlightScrollRef.current) {
        const container = spotlightScrollRef.current;
        const firstCard = container.firstElementChild as HTMLElement | null;
        const cardWidth = firstCard ? firstCard.offsetWidth + 12 : 200;
        container.scrollTo({ left: next * cardWidth, behavior: 'smooth' });
      }
      return next;
    });
  };

  // Live asynchronous query to Supabase for creators & users matching search
  useEffect(() => {
    if (!cleanQuery) {
      setRemoteCreators([]);
      return;
    }
    let isSubscribed = true;
    searchProfilesInSupabase(cleanQuery).then((results) => {
      if (isSubscribed && results && results.length > 0) {
        setRemoteCreators(results);
      }
    });
    return () => {
      isSubscribed = false;
    };
  }, [cleanQuery]);

  // Helper to accurately determine if a creator is followed by currentUser
  const isCreatorFollowed = (creatorId?: string, username?: string) => {
    if (!creatorId && !username) return false;
    const cId = (creatorId || '').toLowerCase().trim();
    const cUser = (username || '').toLowerCase().trim().replace(/^@/, '');
    try {
      const raw = localStorage.getItem('valuvid_followed_creators');
      if (raw) {
        const followed: string[] = JSON.parse(raw);
        const set = new Set(followed.map(x => x.toLowerCase().trim().replace(/^@/, '')));
        if (cUser && set.has(cUser)) return true;
        if (cId && set.has(cId)) return true;
      }
    } catch {}
    return videos.some(
      (v) =>
        ((cId && ((v.creator?.id || '').toLowerCase() === cId || (v.creator?.username || '').toLowerCase() === cId)) ||
         (cUser && (v.creator?.username || '').toLowerCase().replace(/^@/, '') === cUser)) &&
        Boolean(v.creator?.isFollowing)
    );
  };

  // Comprehensive creator and user matcher across Supabase, local directory & videos (Strictly REAL users)
  const matchedCreators = useMemo(() => {
    if (!cleanQuery) return [];

    const isRealVideo = (v: VideoItem) =>
      v.id !== 'vid-user-1793960000000' &&
      v.id !== 'vid-user-1' &&
      v.id !== 'vid-masterclass-1' &&
      !v.id.startsWith('test-') &&
      v.caption !== '[USER_REGISTRY]' &&
      (v.category as string) !== 'user_registry' &&
      v.caption !== '[DELETED]' &&
      (v.category as string) !== 'deleted';

    const map = new Map<string, {
      id: string;
      name: string;
      username: string;
      avatar: string;
      bio?: string;
      verified?: boolean;
      followers?: number;
      isFollowing?: boolean;
      videoCount: number;
      firstVideo?: VideoItem;
    }>();

    // 1. FIRST: Include currently logged-in real user if matching
    if (currentUser && currentUser.username && !isMockAccount(currentUser.username)) {
      const cu = currentUser.username.toLowerCase();
      const cn = (currentUser.name || '').toLowerCase();
      if (cu.includes(cleanQuery) || cn.includes(cleanQuery)) {
        const userVideos = videos.filter((v) => isRealVideo(v) && (v.creator?.username || '').toLowerCase() === cu);
        map.set(cu, {
          id: currentUser.id || cu,
          name: currentUser.name || currentUser.username,
          username: currentUser.username,
          avatar: getUserAvatar(currentUser.avatar, currentUser.name || currentUser.username),
          bio: currentUser.bio || 'ValuVid Creator 🇬🇭',
          verified: currentUser.verified || false,
          followers: currentUser.followers || 0,
          isFollowing: false,
          videoCount: userVideos.length,
          firstVideo: userVideos[0]
        });
      }
    }

    // 2. Search registered accounts from local directory (signups, logins)
    const allKnown = getAllKnownUsers();
    allKnown.forEach((user) => {
      if (isMockAccount(user.username)) return;
      const u = (user.username || '').toLowerCase().replace(/^@/, '');
      const n = (user.name || '').toLowerCase();
      if ((u.includes(cleanQuery) || n.includes(cleanQuery)) && !map.has(u)) {
        const userVideos = videos.filter((v) => isRealVideo(v) && (v.creator?.username || '').toLowerCase().replace(/^@/, '') === u);
        const isFollowed = isCreatorFollowed(user.id, user.username);
        const rawFollowers = (typeof user.followers === 'number' && user.followers !== 12 && user.followers !== 18 && user.followers !== 24800)
          ? user.followers
          : 0;
        const followers = isFollowed ? Math.max(1, rawFollowers) : rawFollowers;
        map.set(u, {
          id: user.id || u,
          name: user.name || user.username,
          username: user.username,
          avatar: getUserAvatar(user.avatar, user.name || user.username),
          bio: user.bio || 'ValuVid Creator 🇬🇭',
          verified: user.verified || false,
          followers: followers,
          isFollowing: isFollowed,
          videoCount: userVideos.length,
          firstVideo: userVideos[0]
        });
      }
    });

    // 3. Search real remote Supabase profiles
    remoteCreators.forEach((creator) => {
      if (isMockAccount(creator.username)) return;
      const u = (creator.username || '').toLowerCase().replace(/^@/, '');
      const n = (creator.name || '').toLowerCase();
      if (u.includes(cleanQuery) || n.includes(cleanQuery)) {
        const userVideos = videos.filter((v) => isRealVideo(v) && (v.creator?.username || '').toLowerCase().replace(/^@/, '') === u);
        const isFollowed = isCreatorFollowed(creator.id, creator.username);
        const rawFollowers = (typeof creator.followers === 'number' && creator.followers !== 12 && creator.followers !== 18 && creator.followers !== 24800)
          ? creator.followers
          : 0;
        const followers = isFollowed ? Math.max(1, rawFollowers) : rawFollowers;
        map.set(u, {
          id: creator.id || u,
          name: creator.name || creator.username,
          username: creator.username,
          avatar: getUserAvatar(creator.avatar, creator.name || creator.username),
          bio: creator.bio || 'ValuVid Creator 🇬🇭',
          verified: creator.verified || false,
          followers: followers,
          isFollowing: isFollowed,
          videoCount: userVideos.length,
          firstVideo: userVideos[0]
        });
      }
    });

    // 4. Search currently loaded video creators
    videos.forEach((video) => {
      if (!isRealVideo(video) || !video.creator?.username || isMockAccount(video.creator.username)) return;
      const u = video.creator.username.toLowerCase().replace(/^@/, '');
      const n = (video.creator.name || '').toLowerCase();
      if (u.includes(cleanQuery) || n.includes(cleanQuery)) {
        const userVideos = videos.filter((v) => isRealVideo(v) && (v.creator?.username || '').toLowerCase().replace(/^@/, '') === u);
        const isFollowed = isCreatorFollowed(video.creator.id, video.creator.username) || Boolean(video.creator.isFollowing);
        const rawFollowers = (typeof video.creator.followers === 'number' && video.creator.followers !== 12 && video.creator.followers !== 18 && video.creator.followers !== 24800)
          ? video.creator.followers
          : 0;
        const followers = isFollowed ? Math.max(1, rawFollowers) : rawFollowers;
        const existing = map.get(u);
        if (!existing) {
          map.set(u, {
            id: video.creator.id || u,
            name: video.creator.name || video.creator.username,
            username: video.creator.username,
            avatar: getUserAvatar(video.creator.avatar, video.creator.name || video.creator.username),
            bio: video.creator.bio || 'ValuVid Creator 🇬🇭',
            verified: video.creator.verified || false,
            followers: followers,
            isFollowing: isFollowed,
            videoCount: userVideos.length,
            firstVideo: userVideos[0]
          });
        } else {
          existing.followers = followers;
          existing.isFollowing = isFollowed;
          if (!existing.firstVideo && userVideos.length > 0) {
            existing.firstVideo = userVideos[0];
            existing.videoCount = userVideos.length;
          }
        }
      }
    });

    return Array.from(map.values());
  }, [cleanQuery, videos, remoteCreators, currentUser]);

  const handleSelectVideo = (video: VideoItem) => {
    recordVideoView(video.id, currentUser);
    playVideo(video);
  };

  const handleJoinBounty = (bounty: BountyChallenge) => {
    setActiveBountyModal(null);
    setAppTab('create');
  };

  const handleAwardWinner = (creatorName: string, amount: number, rank: string) => {
    sounds.playSuccessPayout();
    confetti({
      particleCount: 120,
      spread: 85,
      origin: { y: 0.55 },
      colors: ['#FF9F0A', '#00B2FE', '#10B981', '#FFFFFF'],
    });
    setAwardedWinner({ creator: creatorName, amount, rank });
  };

  return (
    <div className={`w-full h-full ${theme === 'light' ? 'bg-[#F8FAFC] text-slate-900' : 'bg-neutral-950 text-white'} flex flex-col overflow-y-auto overscroll-contain pb-[max(5.5rem,calc(env(safe-area-inset-bottom,0px)+5rem))] select-none transition-colors duration-200`}>
      {/* SEARCH & FILTERS HEADER - COMPACT & FULLY RESPONSIVE */}
      <div className={`sticky top-0 z-30 ${theme === 'light' ? 'bg-white/95 border-slate-200' : 'bg-neutral-950/95 border-neutral-900'} backdrop-blur-md px-3 sm:px-4 pt-[max(2.25rem,calc(env(safe-area-inset-top,0px)+0.5rem))] sm:pt-4 pb-2 border-b transition-colors`}>
        <div className="relative w-full mb-2 sm:mb-2.5">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 ${theme === 'light' ? 'text-slate-400' : 'text-neutral-400'}`} />
          <input
            type="text"
            placeholder="Search creators, #AccraTech, bounties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${
              theme === 'light'
                ? 'bg-slate-100 text-slate-900 placeholder-slate-400 border-slate-200 focus:border-amber-500 focus:ring-amber-500'
                : 'bg-neutral-900 text-white placeholder-neutral-500 border-neutral-800 focus:border-amber-400 focus:ring-amber-400'
            } text-xs sm:text-sm rounded-xl pl-8 sm:pl-9 pr-14 py-2 sm:py-2.5 border focus:outline-none focus:ring-1 transition-all placeholder:truncate`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] sm:text-xs ${
                theme === 'light' ? 'text-slate-500 hover:text-slate-900 bg-slate-200' : 'text-neutral-400 hover:text-white bg-neutral-800/80'
              } px-1.5 py-0.5 rounded`}
            >
              Clear
            </button>
          )}
        </div>

        {/* 100% HUMAN VS AI AUTHENTICITY SWITCHER PILLS - FULLY RESPONSIVE FOR IPHONE SE & ALL SCREENS */}
        <div className={`flex items-center gap-1 min-[360px]:gap-1.5 p-1 rounded-2xl border backdrop-blur-md mb-2 sm:mb-2.5 ${
          theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-neutral-900/80 border-neutral-800'
        }`}>
          <button
            onClick={() => setSelectedFilter('all')}
            className={`flex-1 py-1 min-[360px]:py-1.5 px-1 min-[360px]:px-2 rounded-xl text-[10px] min-[360px]:text-[11px] font-bold transition-all flex items-center justify-center active:scale-95 truncate ${
              selectedFilter === 'all'
                ? 'bg-amber-500 text-neutral-950 font-black shadow-sm'
                : theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="truncate">All Creations</span>
          </button>

          <button
            onClick={() => setSelectedFilter('human-only')}
            className={`flex-1 py-1 min-[360px]:py-1.5 px-1 min-[360px]:px-2 rounded-xl text-[10px] min-[360px]:text-[11px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95 truncate ${
              selectedFilter === 'human-only'
                ? 'bg-emerald-500 text-neutral-950 font-black shadow-md shadow-emerald-500/25 ring-1 ring-emerald-300'
                : theme === 'light' ? 'text-emerald-700 hover:text-emerald-900' : 'text-neutral-400 hover:text-emerald-400'
            }`}
            title="Filter to 100% genuine human storytelling, culture, and dance (no generative AI)"
          >
            <span className="truncate">100% Human</span>
            <span className="hidden min-[360px]:inline text-[8px] uppercase tracking-wider px-1 py-0.2 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 shrink-0">
              C2PA
            </span>
          </button>

          <button
            onClick={() => setSelectedFilter('ai-lab')}
            className={`flex-1 py-1 min-[360px]:py-1.5 px-1 min-[360px]:px-2 rounded-xl text-[10px] min-[360px]:text-[11px] font-bold transition-all flex items-center justify-center active:scale-95 truncate ${
              selectedFilter === 'ai-lab'
                ? 'bg-purple-600 text-white font-black shadow-md shadow-purple-500/25 ring-1 ring-purple-300'
                : theme === 'light' ? 'text-purple-700 hover:text-purple-900' : 'text-neutral-400 hover:text-purple-400'
            }`}
            title="Explore generative AI innovations and AI-assisted workflows"
          >
            <span className="truncate">AI Lab</span>
          </button>
        </div>

        {/* FEED FILTERS: GLOBAL & LOCAL SCALING CHANNEL CHIPS */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {filters.map((filter) => {
            const isSelected = selectedFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`shrink-0 text-[11px] sm:text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex items-center gap-1.5 font-semibold active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-neutral-950 font-black shadow-md shadow-amber-500/30 scale-[1.02]'
                    : theme === 'light'
                    ? 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/90 shadow-xs'
                    : 'bg-neutral-900/90 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-800 shadow-xs'
                }`}
              >
                <span>{filter.label}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                  isSelected
                    ? 'bg-black/25 text-neutral-950'
                    : filter.scope === 'human'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : filter.scope === 'ai'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : filter.scope === 'local'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : filter.scope === 'global'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : filter.scope === 'performance'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {filter.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col gap-3.5 sm:gap-4">
        {/* MATCHED CREATORS / USERS SECTION (Shown when searching) */}
        {cleanQuery && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                <h3 className={`text-xs sm:text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  Creators & Users ({matchedCreators.length})
                </h3>
              </div>
              <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                Searching "{searchQuery}"
              </span>
            </div>

            {matchedCreators.length > 0 ? (
              <div className="flex flex-col gap-2">
                {matchedCreators.map((creator) => (
                  <div
                    key={creator.id}
                    className={`flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl border transition-all ${
                      theme === 'light'
                        ? 'bg-white border-slate-200 hover:border-amber-300 shadow-sm'
                        : 'bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 shadow-md'
                    }`}
                  >
                    <div 
                      onClick={() => openCreatorProfile(creator)}
                      className="flex items-center gap-2.5 sm:gap-3 min-w-0 cursor-pointer group flex-1"
                      title="Click to view creator profile & videos"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={getUserAvatar(creator.avatar, creator.name || creator.username)}
                          alt={creator.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-amber-500/40 group-hover:scale-105 transition-transform shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/default-avatar.jpg';
                          }}
                        />
                        {creator.verified && (
                          <div className="absolute -bottom-0.5 -right-0.5 bg-amber-500 text-black rounded-full p-0.5 shadow-sm">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-xs sm:text-sm font-bold truncate group-hover:text-amber-500 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                            {creator.name}
                          </span>
                        </div>
                        <p className={`text-[11px] truncate font-mono ${theme === 'light' ? 'text-amber-800' : 'text-amber-400'}`}>
                          @{creator.username}
                        </p>
                        <div className={`flex items-center gap-1.5 text-[10px] mt-0.5 truncate ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                          <span className="shrink-0">{formatCompactNumber(creator.followers || 0)} {creator.followers === 1 ? 'follower' : 'followers'}</span>
                          <span>•</span>
                          <span className="shrink-0">{creator.videoCount || 0} {creator.videoCount === 1 ? 'video' : 'videos'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {creator.username !== currentUser?.username ? (() => {
                        const isFollowing = Boolean(creator.isFollowing || isFollowingCreator(creator.username) || (creator.id && isFollowingCreator(creator.id)));
                        return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFollowCreator(creator.id || creator.username);
                            }}
                            className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer shrink-0 ${
                              isFollowing
                                ? 'bg-neutral-800/90 hover:bg-neutral-700/90 text-emerald-400 border border-emerald-500/30'
                                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black shadow-amber-500/20'
                            }`}
                            title={isFollowing ? 'Click to unfollow' : 'Follow creator'}
                          >
                            {isFollowing ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" />
                                <span className="text-[11px] sm:text-xs">Following</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                                <span className="text-[11px] sm:text-xs">Follow</span>
                              </>
                            )}
                          </button>
                        );
                      })() : (
                        <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
                          theme === 'light' 
                            ? 'bg-slate-100 text-slate-500 border-slate-200' 
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                        }`}>
                          You
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-3.5 rounded-2xl border text-center text-xs ${
                theme === 'light' 
                  ? 'bg-white border-slate-200 text-slate-500' 
                  : 'bg-neutral-900/50 border-neutral-800 text-neutral-400'
              }`}>
                No creator accounts matching "@{cleanQuery}". See matching videos below.
              </div>
            )}
          </div>
        )}

        {/* HIDE PROMOTIONAL HERO BANNERS WHEN ACTIVELY SEARCHING */}
        {!cleanQuery && (
          <>
            {/* FRESH CREATORS HORIZONTAL HERO SPOTLIGHT REEL */}
            {freshCreatorVideos.length > 0 && (
              <div 
                className="flex flex-col gap-2"
                onMouseEnter={handleSpotlightTouch}
                onTouchStart={handleSpotlightTouch}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                      <Flame className="w-3.5 h-3.5 fill-white" />
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <h2 className={`text-sm sm:text-base font-bold tracking-tight truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                        Fresh Creators Spotlight
                      </h2>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        Live
                      </span>
                    </div>
                  </div>

                  {/* Manual Controls & Progress Indicator */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}>
                      {activeSpotlightIdx + 1} / {freshCreatorVideos.length}
                    </span>

                    <div className="hidden sm:flex items-center gap-1">
                      <button
                        onClick={slideSpotlightPrev}
                        aria-label="Previous creator video"
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                          theme === 'light' ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                        }`}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={slideSpotlightNext}
                        aria-label="Next creator video"
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                          theme === 'light' ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
                        }`}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Horizontal Auto-Sliding Reel */}
                <div
                  ref={spotlightScrollRef}
                  onScroll={handleSpotlightScroll}
                  className="flex gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory py-1 scroll-smooth"
                >
                  {freshCreatorVideos.map((video, idx) => {
                    const isActive = idx === activeSpotlightIdx;

                    // Extract genuine creator hashtags from video hashtags array and caption
                    const realHashtags: string[] = [];
                    if (Array.isArray(video.hashtags)) {
                      video.hashtags.forEach((tag) => {
                        if (tag && typeof tag === 'string') {
                          const clean = tag.replace(/^#/, '').trim();
                          if (clean && !realHashtags.includes(clean)) realHashtags.push(clean);
                        }
                      });
                    }
                    if (video.caption) {
                      const matches = video.caption.match(/#([a-zA-Z0-9_]+)/g);
                      if (matches) {
                        matches.forEach((m) => {
                          const clean = m.replace(/^#/, '').trim();
                          if (clean && !realHashtags.includes(clean)) realHashtags.push(clean);
                        });
                      }
                    }
                    if (realHashtags.length === 0 && video.category) {
                      realHashtags.push(video.category);
                    }

                    return (
                      <div
                        key={`spotlight-${video.id}`}
                        onClick={() => handleSelectVideo(video)}
                        className={`snap-start shrink-0 w-[170px] min-[360px]:w-[190px] sm:w-[215px] aspect-[9/13.5] rounded-2xl overflow-hidden relative group cursor-pointer border transition-all duration-300 ${
                          isActive
                            ? 'ring-2 ring-amber-400/90 shadow-xl shadow-amber-500/20 scale-[1.01]'
                            : theme === 'light'
                            ? 'border-slate-200 bg-slate-900 hover:border-slate-300 shadow-sm opacity-95'
                            : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700 shadow-md opacity-90'
                        }`}
                      >
                        {/* Video Preview or Thumbnail Cover */}
                        {isActive && video.videoUrl && !video.videoUrl.startsWith('blob:') ? (
                          <video
                            src={video.videoUrl}
                            muted
                            autoPlay
                            loop
                            playsInline
                            poster={video.thumbnailUrl && !video.thumbnailUrl.includes('avatar') ? video.thumbnailUrl : undefined}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <PublishedVideoThumbnail
                            video={video}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}

                        {/* Top Overlay Badges */}
                        <div className="absolute top-2 inset-x-2 flex items-center justify-between z-10 pointer-events-none">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-amber-400 border border-amber-400/30 flex items-center gap-1 shadow-sm">
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Fresh
                          </span>

                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white/90 flex items-center gap-0.5">
                            <Eye className="w-2.5 h-2.5" />
                            {formatCompactNumber(video.stats?.views || 1)}
                          </span>
                        </div>

                        {/* Dark Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

                        {/* Bottom Creator & Video Overlay Info */}
                        <div className="absolute bottom-2.5 inset-x-2.5 z-10 flex flex-col gap-1 pointer-events-none">
                          <div className="flex items-center gap-1.5">
                            <div className="relative shrink-0">
                              <img
                                src={getUserAvatar(video.creator?.avatar, video.creator?.username)}
                                alt={video.creator?.name || 'Creator'}
                                className="w-6 h-6 rounded-full object-cover border border-amber-400 shadow-sm"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = '/default-avatar.jpg';
                                }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-white truncate drop-shadow-sm">
                              @{video.creator?.username}
                            </span>
                          </div>

                          <h3 className="text-xs font-extrabold text-white line-clamp-1 leading-snug drop-shadow-sm">
                            {video.title}
                          </h3>

                          <div className="flex items-center justify-between pt-0.5 mt-0.5 border-t border-white/15 gap-1.5">
                            <div className="flex items-center gap-1.5 overflow-hidden truncate">
                              {realHashtags.slice(0, 3).map((tag, tIdx) => (
                                <span
                                  key={`spotlight-tag-${video.id}-${tIdx}`}
                                  className="text-[10px] text-amber-300 font-semibold shrink-0"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-950 bg-amber-400 hover:bg-amber-300 px-2 py-0.5 rounded-full shadow-sm group-hover:scale-105 transition-transform pointer-events-auto shrink-0">
                              <Play className="w-2.5 h-2.5 fill-current" />
                              <span>Watch</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LIVE WIN POOL ESCROW HIGHLIGHT BANNER */}
        <div 
          onClick={() => setShowWinPoolModal(true)}
          className={`relative overflow-hidden rounded-2xl border p-3 sm:p-3.5 cursor-pointer active:scale-[0.99] transition-all group ${
            theme === 'light'
              ? 'bg-gradient-to-r from-amber-50 via-slate-50 to-cyan-50 border-amber-300 hover:border-amber-400 shadow-md text-slate-900'
              : 'bg-gradient-to-r from-[#071325] via-[#0B1E38] to-[#151D2A] border-[#FF9F0A]/40 hover:border-[#FF9F0A]/70 text-white shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF9F0A] to-amber-600 flex items-center justify-center text-black font-black shrink-0 shadow-lg shadow-[#FF9F0A]/20">
                <Trophy className="w-5 h-5 text-black" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] uppercase font-black tracking-wider ${theme === 'light' ? 'text-amber-800' : 'text-amber-400'}`}>
                    Live Win Pool Escrow
                  </span>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${
                    theme === 'light'
                      ? 'text-emerald-800 bg-emerald-100/70 border-emerald-300'
                      : 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Guaranteed
                  </span>
                </div>
                <div className={`text-sm sm:text-base font-black flex items-baseline gap-1 sm:gap-1.5 flex-wrap ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  <span>GHS {totalWinPoolGHS.toLocaleString()}</span>
                  <span className={`text-[10px] font-normal ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>(${(totalWinPoolGHS * 0.083).toFixed(0)} USD)</span>
                  <span className={`text-[10px] font-semibold ${theme === 'light' ? 'text-cyan-700' : 'text-cyan-300'}`}>• {bounties.length} Pools</span>
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-1 text-[11px] font-bold group-hover:translate-x-0.5 transition-transform shrink-0 border px-2 sm:px-2.5 py-1 rounded-xl ${
              theme === 'light'
                ? 'text-amber-800 bg-amber-100/80 border-amber-300'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
            }`}>
              <span>Win Pool</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Live Winner Ticker footer */}
          <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] ${
            theme === 'light' ? 'border-slate-200 text-slate-600' : 'border-neutral-800/80 text-neutral-400'
          }`}>
            <div className="flex items-center gap-1 truncate">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">
                {latestBountyTx
                  ? `Recent: ${latestBountyTx.title} (GHS ${latestBountyTx.amountGHS}) • Dispatched via MoMo`
                  : 'Live Escrow Float Protected • Automated Mobile Money Dispatches'}
              </span>
            </div>
            <span className={`font-bold shrink-0 ml-1 ${theme === 'light' ? 'text-cyan-700' : 'text-cyan-400'}`}>Instant 2s Payout</span>
          </div>
        </div>

        {/* WEEKLY TOP-TIPPED CREATORS PODIUM */}
        {topTippedCreators.length > 0 && (
          <div className={`rounded-2xl sm:rounded-3xl border p-3.5 sm:p-4 relative overflow-hidden ${
            theme === 'light'
              ? 'bg-gradient-to-b from-amber-50/70 via-white to-amber-50/40 border-amber-200 shadow-md'
              : 'bg-gradient-to-b from-[#0e1626] via-[#090e18] to-black border-amber-500/30 shadow-xl'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 flex items-center justify-center text-neutral-950 shadow-md shadow-amber-500/30 shrink-0">
                  <Crown className="w-4 h-4 text-neutral-950 fill-neutral-950" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className={`text-xs sm:text-sm font-black tracking-tight truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      Weekly Top-Tipped Creators
                    </h2>
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Podium
                    </span>
                  </div>
                  <p className={`text-[10px] truncate ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Celebrating creators backed by real Mobile Money micro-tips
                  </p>
                </div>
              </div>

              <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                theme === 'light' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                Weekly Reset
              </div>
            </div>

            {/* 3-Tier Podium Grid - FULLY RESPONSIVE FOR IPHONE SE & SMALL MOBILES */}
            <div className="grid grid-cols-3 gap-1.5 min-[360px]:gap-2 sm:gap-3 items-end pt-1 sm:pt-2 pb-1">
              {/* RANK 2: SILVER (Left) */}
              {topTippedCreators[1] ? (
                <div className="flex flex-col items-center text-center group">
                  <div 
                    onClick={() => openCreatorProfile(topTippedCreators[1].creator)}
                    className="relative cursor-pointer mb-1.5 active:scale-95 transition-transform"
                  >
                    <div className="w-10 h-10 min-[360px]:w-12 min-[360px]:h-12 min-[380px]:w-14 min-[380px]:h-14 sm:w-16 sm:h-16 aspect-square shrink-0 rounded-full p-0.5 ring-2 ring-slate-300/80 shadow-md shadow-slate-300/20 overflow-hidden bg-neutral-900">
                      <img
                        src={getUserAvatar(topTippedCreators[1].creator.avatar, topTippedCreators[1].creator.username)}
                        alt={topTippedCreators[1].creator.name || topTippedCreators[1].creator.username}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/default-avatar.jpg';
                        }}
                      />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 text-neutral-950 font-black text-[9px] min-[360px]:text-[10px] flex items-center justify-center shadow-md ring-1.5 min-[360px]:ring-2 ring-black">
                      2
                    </span>
                  </div>

                  <span 
                    onClick={() => openCreatorProfile(topTippedCreators[1].creator)}
                    className={`text-[10px] min-[360px]:text-[11px] sm:text-xs font-bold truncate max-w-[70px] min-[360px]:max-w-[85px] sm:max-w-[110px] cursor-pointer hover:underline ${
                      theme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {topTippedCreators[1].creator.name || topTippedCreators[1].creator.username}
                  </span>
                  <span className={`text-[8.5px] min-[360px]:text-[9px] truncate max-w-[65px] min-[360px]:max-w-[80px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                    @{topTippedCreators[1].creator.username}
                  </span>

                  <div className="mt-0.5 min-[360px]:mt-1 flex items-center gap-0.5 text-slate-300 font-extrabold text-[9px] min-[360px]:text-[10px] sm:text-[11px]">
                    <Coins className="w-2.5 h-2.5 min-[360px]:w-3 min-[360px]:h-3 text-slate-300 shrink-0" />
                    <span>${topTippedCreators[1].totalTipsGHS.toFixed(2)}</span>
                  </div>

                  {topTippedCreators[1].topVideo && (
                    <button
                      onClick={() => {
                        sounds.playLikePop();
                        openTipModal(topTippedCreators[1].topVideo!);
                      }}
                      className="mt-1 min-[360px]:mt-1.5 px-2 min-[360px]:px-2.5 py-0.5 rounded-full text-[9px] min-[360px]:text-[10px] font-black bg-slate-300/20 hover:bg-slate-300/30 text-slate-200 border border-slate-300/40 shadow-xs active:scale-95 transition-all"
                    >
                      Tip
                    </button>
                  )}

                  <div className="w-full h-11 min-[360px]:h-14 sm:h-16 mt-2 rounded-t-xl bg-gradient-to-b from-slate-300/25 via-slate-400/10 to-transparent border-t-2 border-x border-slate-300/40 flex items-center justify-center font-black text-slate-300/60 text-base min-[360px]:text-lg">
                    2
                  </div>
                </div>
              ) : <div />}

              {/* RANK 1: GOLD (Center) */}
              {topTippedCreators[0] && (
                <div className="flex flex-col items-center text-center group -mt-2 min-[360px]:-mt-3">
                  <Crown className="w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 text-amber-400 fill-amber-400 animate-bounce mb-0.5 min-[360px]:mb-1 drop-shadow-[0_2px_8px_rgba(251,191,36,0.8)]" />

                  <div 
                    onClick={() => openCreatorProfile(topTippedCreators[0].creator)}
                    className="relative cursor-pointer mb-1.5 active:scale-95 transition-transform"
                  >
                    <div className="w-12 h-12 min-[360px]:w-15 min-[360px]:h-15 min-[380px]:w-16 min-[380px]:h-16 sm:w-20 sm:h-20 aspect-square shrink-0 rounded-full p-0.5 ring-2.5 min-[360px]:ring-3 min-[380px]:ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)] overflow-hidden bg-neutral-900">
                      <img
                        src={getUserAvatar(topTippedCreators[0].creator.avatar, topTippedCreators[0].creator.username)}
                        alt={topTippedCreators[0].creator.name || topTippedCreators[0].creator.username}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/default-avatar.jpg';
                        }}
                      />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 min-[360px]:w-6 min-[360px]:h-6 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-neutral-950 font-black text-[10px] min-[360px]:text-xs flex items-center justify-center shadow-lg ring-1.5 min-[360px]:ring-2 ring-black">
                      1
                    </span>
                  </div>

                  <span 
                    onClick={() => openCreatorProfile(topTippedCreators[0].creator)}
                    className={`text-[11px] min-[360px]:text-xs sm:text-sm font-black truncate max-w-[80px] min-[360px]:max-w-[95px] sm:max-w-[125px] cursor-pointer hover:underline ${
                      theme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {topTippedCreators[0].creator.name || topTippedCreators[0].creator.username}
                  </span>
                  <span className={`text-[8.5px] min-[360px]:text-[9px] truncate max-w-[75px] min-[360px]:max-w-[85px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                    @{topTippedCreators[0].creator.username}
                  </span>

                  <div className="mt-0.5 min-[360px]:mt-1 flex items-center gap-0.5 text-amber-400 font-black text-[10px] min-[360px]:text-xs sm:text-sm">
                    <Coins className="w-3 h-3 min-[360px]:w-3.5 min-[360px]:h-3.5 text-amber-400 shrink-0" />
                    <span>${topTippedCreators[0].totalTipsGHS.toFixed(2)}</span>
                  </div>

                  {topTippedCreators[0].topVideo && (
                    <button
                      onClick={() => {
                        sounds.playCoinTip();
                        openTipModal(topTippedCreators[0].topVideo!);
                      }}
                      className="mt-1 min-[360px]:mt-1.5 px-2.5 min-[360px]:px-3 py-0.5 rounded-full text-[9px] min-[360px]:text-[10px] font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 shadow-md shadow-amber-500/30 active:scale-95 transition-all"
                    >
                      Tip Leader
                    </button>
                  )}

                  <div className="w-full h-16 min-[360px]:h-20 sm:h-24 mt-2 rounded-t-xl bg-gradient-to-b from-amber-400/30 via-amber-500/15 to-transparent border-t-2 border-x border-amber-400/60 flex items-center justify-center font-black text-amber-400/80 text-lg min-[360px]:text-2xl shadow-inner">
                    1
                  </div>
                </div>
              )}

              {/* RANK 3: BRONZE (Right) */}
              {topTippedCreators[2] ? (
                <div className="flex flex-col items-center text-center group">
                  <div 
                    onClick={() => openCreatorProfile(topTippedCreators[2].creator)}
                    className="relative cursor-pointer mb-1.5 active:scale-95 transition-transform"
                  >
                    <div className="w-10 h-10 min-[360px]:w-12 min-[360px]:h-12 min-[380px]:w-14 min-[380px]:h-14 sm:w-16 sm:h-16 aspect-square shrink-0 rounded-full p-0.5 ring-2 ring-amber-700/80 shadow-md shadow-amber-900/30 overflow-hidden bg-neutral-900">
                      <img
                        src={getUserAvatar(topTippedCreators[2].creator.avatar, topTippedCreators[2].creator.username)}
                        alt={topTippedCreators[2].creator.name || topTippedCreators[2].creator.username}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/default-avatar.jpg';
                        }}
                      />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 rounded-full bg-gradient-to-tr from-amber-700 to-orange-500 text-white font-black text-[9px] min-[360px]:text-[10px] flex items-center justify-center shadow-md ring-1.5 min-[360px]:ring-2 ring-black">
                      3
                    </span>
                  </div>

                  <span 
                    onClick={() => openCreatorProfile(topTippedCreators[2].creator)}
                    className={`text-[10px] min-[360px]:text-[11px] sm:text-xs font-bold truncate max-w-[70px] min-[360px]:max-w-[85px] sm:max-w-[110px] cursor-pointer hover:underline ${
                      theme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {topTippedCreators[2].creator.name || topTippedCreators[2].creator.username}
                  </span>
                  <span className={`text-[8.5px] min-[360px]:text-[9px] truncate max-w-[65px] min-[360px]:max-w-[80px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                    @{topTippedCreators[2].creator.username}
                  </span>

                  <div className="mt-0.5 min-[360px]:mt-1 flex items-center gap-0.5 text-amber-500 font-extrabold text-[9px] min-[360px]:text-[10px] sm:text-[11px]">
                    <Coins className="w-2.5 h-2.5 min-[360px]:w-3 min-[360px]:h-3 text-amber-500 shrink-0" />
                    <span>${topTippedCreators[2].totalTipsGHS.toFixed(2)}</span>
                  </div>

                  {topTippedCreators[2].topVideo && (
                    <button
                      onClick={() => {
                        sounds.playLikePop();
                        openTipModal(topTippedCreators[2].topVideo!);
                      }}
                      className="mt-1 min-[360px]:mt-1.5 px-2 min-[360px]:px-2.5 py-0.5 rounded-full text-[9px] min-[360px]:text-[10px] font-black bg-amber-700/20 hover:bg-amber-700/30 text-amber-400 border border-amber-700/40 shadow-xs active:scale-95 transition-all"
                    >
                      Tip
                    </button>
                  )}

                  <div className="w-full h-8 min-[360px]:h-10 sm:h-12 mt-2 rounded-t-xl bg-gradient-to-b from-amber-700/20 via-orange-900/10 to-transparent border-t-2 border-x border-amber-700/40 flex items-center justify-center font-black text-amber-700/60 text-xs min-[360px]:text-sm sm:text-base">
                    3
                  </div>
                </div>
              ) : <div />}
            </div>
          </div>
        )}

        {/* COMMUNITY "VOTE & WIN" PREDICTION CARDS (Option 5) */}
        <div className="flex flex-col gap-2 min-[360px]:gap-2.5">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-5 h-5 min-[360px]:w-6 min-[360px]:h-6 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Vote className="w-3 h-3 min-[360px]:w-3.5 min-[360px]:h-3.5 fill-white" />
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <h2 className={`text-xs min-[360px]:text-sm sm:text-base font-bold tracking-tight truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  Community Predictions
                </h2>
                <span className="hidden min-[400px]:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">
                  Vote & Win 🏆
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowCreatePredictionModal(true)}
                className="text-[9.5px] min-[360px]:text-[10px] sm:text-[11px] font-bold px-2 min-[360px]:px-2.5 py-1 rounded-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 flex items-center gap-1 active:scale-95 transition-all shadow-xs whitespace-nowrap"
              >
                <Plus className="w-3 h-3 text-amber-400" />
                <span>+ Add Question</span>
              </button>
              <span className={`hidden min-[360px]:inline-block text-[9px] min-[360px]:text-[10px] font-bold whitespace-nowrap ${theme === 'light' ? 'text-amber-800' : 'text-amber-300'}`}>
                GHS Pools
              </span>
            </div>
          </div>

          {/* Feedback Toast */}
          {predictionFeedback && (
            <div className="bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl animate-fade-in flex items-center justify-between gap-1.5">
              <span className="truncate">{predictionFeedback}</span>
              <button onClick={() => setPredictionFeedback(null)} className="text-amber-400 hover:text-white ml-2 text-sm font-bold shrink-0">×</button>
            </div>
          )}

          {/* Predictions Grid or Empty State */}
          {predictions.length === 0 ? (
            <div className={`p-6 sm:p-8 rounded-2xl border text-center flex flex-col items-center justify-center gap-3 transition-all ${
              theme === 'light' ? 'bg-white border-slate-200 shadow-xs' : 'bg-neutral-900/60 border-neutral-800 shadow-md'
            }`}>
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Vote className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-400/20" />
              </div>
              <div className="max-w-xs">
                <h3 className={`text-xs min-[360px]:text-sm sm:text-base font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  No Community Predictions Live Yet
                </h3>
                <p className={`text-[10.5px] min-[360px]:text-[11px] sm:text-xs mt-1 leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Ask the ValuVid community a real question! Users can vote, back the GHS pool with real funds, and win.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreatePredictionModal(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create First Prediction</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {predictions.map((pred) => {
                const myVote = votedPredictions[pred.id];
                return (
                  <div
                    key={pred.id}
                    className={`rounded-2xl border p-3 min-[360px]:p-3.5 flex flex-col justify-between transition-all relative overflow-hidden ${
                      theme === 'light'
                        ? 'bg-white border-slate-200 shadow-xs hover:border-amber-400'
                        : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-700 shadow-md'
                    }`}
                  >
                    <div>
                      {/* Category & Prize Pool Badge */}
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <span className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 truncate max-w-[140px] min-[360px]:max-w-[180px]">
                          {pred.category}
                        </span>
                        <span className="text-[8.5px] sm:text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono shrink-0 whitespace-nowrap">
                          <Coins className="w-2.5 h-2.5 text-amber-400" />
                          <span>GHS {pred.poolGHS}</span>
                        </span>
                      </div>

                      <h3 className={`text-xs sm:text-sm font-bold leading-snug mb-2.5 min-[360px]:mb-3 break-words ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                        {pred.question}
                      </h3>
                    </div>

                    {/* Voting Options */}
                    <div className="flex flex-col gap-1.5 min-[360px]:gap-2">
                      {/* Option A */}
                      <button
                        type="button"
                        onClick={() => handleVotePrediction(pred.id, 'A')}
                        className={`relative w-full rounded-xl p-2 min-[360px]:p-2.5 border text-left transition-all overflow-hidden active:scale-[0.98] ${
                          myVote === 'A'
                            ? 'border-amber-400 bg-amber-500/20 shadow-xs'
                            : (theme === 'light'
                                ? 'bg-slate-50 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
                                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700')
                        }`}
                      >
                        {/* Consensus Percentage Bar */}
                        {myVote && (
                          <div
                            className="absolute inset-y-0 left-0 bg-amber-500/20 transition-all duration-700 pointer-events-none"
                            style={{ width: `${pred.optionA.percent}%` }}
                          />
                        )}
                        <div className="relative z-10 flex items-center justify-between gap-1 text-[11px] min-[360px]:text-xs">
                          <span className={`font-bold truncate pr-1 ${myVote === 'A' ? 'text-amber-300' : (theme === 'light' ? 'text-slate-800' : 'text-white')}`}>
                            {pred.optionA.label}
                          </span>
                          {myVote && (
                            <span className="font-mono font-black text-amber-400 text-[11px] min-[360px]:text-xs shrink-0 whitespace-nowrap">
                              {pred.optionA.percent}%
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Option B */}
                      <button
                        type="button"
                        onClick={() => handleVotePrediction(pred.id, 'B')}
                        className={`relative w-full rounded-xl p-2 min-[360px]:p-2.5 border text-left transition-all overflow-hidden active:scale-[0.98] ${
                          myVote === 'B'
                            ? 'border-amber-400 bg-amber-500/20 shadow-xs'
                            : (theme === 'light'
                                ? 'bg-slate-50 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
                                : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700')
                        }`}
                      >
                        {/* Consensus Percentage Bar */}
                        {myVote && (
                          <div
                            className="absolute inset-y-0 left-0 bg-amber-500/20 transition-all duration-700 pointer-events-none"
                            style={{ width: `${pred.optionB.percent}%` }}
                          />
                        )}
                        <div className="relative z-10 flex items-center justify-between gap-1 text-[11px] min-[360px]:text-xs">
                          <span className={`font-bold truncate pr-1 ${myVote === 'B' ? 'text-amber-300' : (theme === 'light' ? 'text-slate-800' : 'text-white')}`}>
                            {pred.optionB.label}
                          </span>
                          {myVote && (
                            <span className="font-mono font-black text-amber-400 text-[11px] min-[360px]:text-xs shrink-0 whitespace-nowrap">
                              {pred.optionB.percent}%
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Footer Info & Back Pool Button */}
                      <div className="flex items-center justify-between gap-1 pt-1 text-[9px] min-[360px]:text-[9.5px] sm:text-[10px] text-neutral-400">
                        <span className="font-mono truncate pr-1">
                          {pred.optionA.votes + pred.optionB.votes === 0
                            ? `0 votes • Be first!`
                            : `${(pred.optionA.votes + pred.optionB.votes).toLocaleString()} votes • ${pred.endsIn}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleBackPredictionPool(pred.id)}
                          className="font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 active:scale-95 shrink-0 whitespace-nowrap"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Back GHS 1</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MICRO-BOUNTY BANNER CAROUSEL */}
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
              <h2 className={`text-xs sm:text-sm font-bold tracking-wide truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Featured Micro-Bounties</h2>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                onClick={() => setShowSponsorModal(true)}
                className={`text-[10px] sm:text-[11px] ${
                  theme === 'light' ? 'text-cyan-700 bg-cyan-50 border-cyan-200 hover:bg-cyan-100' : 'text-cyan-300 bg-[#00B2FE]/15 border-[#00B2FE]/30 hover:bg-[#00B2FE]/25'
                } border px-2 sm:px-2.5 py-0.5 rounded-full font-bold transition-colors whitespace-nowrap`}
              >
                + Brand Sponsor
              </button>
              <button
                onClick={() => setShowWinPoolModal(true)}
                className={`text-[10px] sm:text-[11px] ${
                  theme === 'light'
                    ? 'text-amber-800 bg-amber-50 border-amber-300 hover:bg-amber-100'
                    : 'text-amber-300 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/50 hover:bg-amber-500/30'
                } border px-2 sm:px-2.5 py-0.5 rounded-full font-bold transition-all flex items-center gap-1 shadow-xs active:scale-95`}
              >
                <Trophy className="w-3 h-3 text-amber-500 animate-pulse" />
                <span>Win Pool Hub</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar snap-x pb-1">
            {bounties.length === 0 ? (
              <div className="w-full py-6 px-4 text-center rounded-2xl bg-neutral-900/60 border border-neutral-800">
                <p className="text-xs text-neutral-300 font-bold">No active sponsored challenges right now.</p>
                <p className="text-[10px] text-neutral-400 mt-1">Brands and creators can tap "+ Brand Sponsor" to launch a cash bounty!</p>
              </div>
            ) : (
              bounties.map((bounty) => (
                <div
                  key={bounty.id}
                  onClick={() => setActiveBountyModal(bounty)}
                  className={`snap-center shrink-0 w-[240px] min-[360px]:w-[260px] sm:w-[280px] bg-gradient-to-br ${bounty.bannerColor} rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xl cursor-pointer hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden group`}
                >
                  <div className="absolute right-2 -bottom-2 opacity-15 text-5xl sm:text-6xl group-hover:scale-110 transition-transform pointer-events-none">
                    {bounty.sponsorLogo}
                  </div>

                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-white/90 mb-1">
                      <span className="bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full truncate max-w-[120px]">
                        {bounty.sponsor}
                      </span>
                      <span className="flex items-center gap-1 text-white bg-black/40 px-2 py-0.5 rounded-full shrink-0">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {bounty.daysRemaining}d left
                      </span>
                    </div>

                    <h3 className="font-bold text-xs sm:text-sm text-white leading-tight mb-2 line-clamp-2 min-h-[2rem]">
                      {bounty.title}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-white/20 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-white/80 block">Prize Pool:</span>
                      <div className="text-sm sm:text-base font-black text-white leading-none">
                        GHS {bounty.rewardPoolGHS.toLocaleString()}{' '}
                        <span className="text-[10px] sm:text-xs font-normal text-white/80">(${bounty.rewardPoolUSD})</span>
                      </div>
                    </div>

                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-neutral-950 flex items-center justify-center font-bold text-xs shadow-md group-hover:translate-x-0.5 transition-transform shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                </div>
              </div>
            )))}
          </div>
        </div>
      </>
    )}

        {/* 2-COLUMN MASONRY GRID - OPTIMIZED FOR ALL PHONES (IPHONE SE 375PX & 320PX) */}
        <div>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className={`text-xs sm:text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-neutral-200'}`}>
              {cleanQuery ? `Videos matching "${searchQuery}"` : selectedFilter === 'local-ghana' ? '🇬🇭 Local African Creator Hub' : selectedFilter === 'global' ? '🌍 Global Worldwide Viral Feed' : selectedFilter === 'high-engagement' ? '⚡️ Highest Engagement Velocity' : selectedFilter === 'bounties' ? '🏆 Cash Micro-Bounty Submissions' : '🔥 Top Community Creations'}
            </h3>
            <span className={`text-[11px] sm:text-xs ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
              {filteredVideos.length} {filteredVideos.length === 1 ? 'video' : 'videos'}
            </span>
          </div>

          {/* Contextual Win Pool notice if bounties filter is active */}
          {selectedFilter === 'bounties' && (
            <div className={`mb-3 ${
              theme === 'light'
                ? 'bg-amber-50/80 border-amber-300 shadow-sm'
                : 'bg-gradient-to-r from-amber-500/15 via-[#0A182E] to-[#00B2FE]/15 border-amber-400/40 shadow-md'
            } border rounded-xl p-2.5 flex items-center justify-between gap-2`}>
              <div className="flex items-center gap-2 min-w-0">
                <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <span className={`font-bold text-[11px] block truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    Competing for GHS {totalWinPoolGHS.toLocaleString()} Win Pools
                  </span>
                  <span className={`text-[10px] block truncate ${theme === 'light' ? 'text-slate-600' : 'text-neutral-400'}`}>
                    Your tips & watch-time count as community votes for creators!
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowWinPoolModal(true)}
                className="px-2.5 py-1 bg-amber-500 text-black font-black text-[10px] rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0"
              >
                Prizes
              </button>
            </div>
          )}

          {filteredVideos.length === 0 ? (
            <div className={`${
              theme === 'light' ? 'bg-white border-slate-200 text-slate-500 shadow-sm' : 'bg-neutral-900/60 border-neutral-800 text-neutral-400'
            } border rounded-2xl p-6 text-center flex flex-col items-center gap-2`}>
              <Sparkles className="w-8 h-8 text-amber-500" />
              <p className={`text-xs font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-neutral-300'}`}>
                {cleanQuery ? 'No videos match your search' : 'No community creations yet'}
              </p>
              <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-500'}`}>
                {cleanQuery ? 'Try searching for other tags or clear the active filter.' : 'Be the first creator to upload a video to ValuVid!'}
              </p>
              {cleanQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('trending');
                  }}
                  className={`mt-1 px-3 py-1 ${
                    theme === 'light' ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-500 hover:text-white' : 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500 hover:text-black'
                  } border rounded-xl text-xs font-bold transition-colors`}
                >
                  Reset Search
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-1 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Upload First Video
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-1.5 min-[360px]:gap-2 sm:gap-3 md:gap-4">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => handleSelectVideo(video)}
                  className={`group relative rounded-xl sm:rounded-2xl overflow-hidden ${
                    theme === 'light' ? 'bg-white border-slate-200 shadow-sm hover:border-amber-400' : 'bg-neutral-900 border-neutral-800/80 hover:border-amber-500/40'
                  } border cursor-pointer transition-all flex flex-col`}
                >
                  {/* Video Thumbnail */}
                  <div className="relative aspect-[9/13] w-full overflow-hidden bg-neutral-950">
                    <PublishedVideoThumbnail
                      video={video}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Top Tip Badge Overlay - Only shown when tips are earned */}
                    {(video.stats?.tipsTotalGHS || 0) > 0 && (
                      <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 flex items-center gap-1 bg-neutral-950/85 backdrop-blur-md px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-400/40 shadow-md">
                        <Coins className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                        <span className="text-[8.5px] min-[360px]:text-[9px] sm:text-[10px] font-bold text-amber-300 leading-tight">
                          GHS {video.stats.tipsTotalGHS.toFixed(1)}
                        </span>
                      </div>
                    )}

                    {/* Locked badge if gated */}
                    {video.isPayPerUnlock && !video.isUnlocked && (
                      <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 bg-black/80 backdrop-blur-md p-1 sm:p-1.5 rounded-full border border-amber-500/50">
                        <Lock className="w-3 h-3 text-amber-400" />
                      </div>
                    )}

                    {/* Views count */}
                    <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 z-10 flex items-center gap-1 text-[8.5px] min-[360px]:text-[9px] sm:text-[10px] text-white/90 drop-shadow-md">
                      <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span>{formatCompactNumber(Math.max(1, video.stats?.views || 1))}</span>
                    </div>

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                  </div>

                  {/* Video Info Card Footer with protected min-w-0 flexbox */}
                  <div className={`p-1.5 min-[360px]:p-2 sm:p-2.5 flex flex-col gap-0.5 min-[360px]:gap-1 sm:gap-1.5 ${theme === 'light' ? 'bg-white' : 'bg-neutral-900'}`}>
                    <p className={`text-[10px] min-[360px]:text-[11px] sm:text-xs font-semibold line-clamp-1 transition-colors ${
                      theme === 'light' ? 'text-slate-800 group-hover:text-amber-600' : 'text-neutral-200 group-hover:text-amber-400'
                    }`}>
                      {video.title}
                    </p>

                    <div className="flex items-center justify-between text-[9px] min-[360px]:text-[10px] sm:text-[11px] gap-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                        <img
                          src={getUserAvatar(video.creator.avatar, video.creator.username)}
                          alt={video.creator.username}
                          className="w-3 h-3 min-[360px]:w-3.5 min-[360px]:h-3.5 sm:w-4 sm:h-4 rounded-full object-cover shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/default-avatar.jpg';
                          }}
                        />
                        <span className={`truncate text-[9px] min-[360px]:text-[10px] sm:text-[11px] ${theme === 'light' ? 'text-slate-600' : 'text-neutral-400'}`}>@{video.creator.username}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openTipModal(video);
                        }}
                        className={`px-1.5 min-[360px]:px-2 py-0.5 shrink-0 ${
                          theme === 'light' ? 'bg-amber-100 text-amber-800 hover:bg-amber-500 hover:text-white' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-neutral-950'
                        } rounded-md text-[8.5px] min-[360px]:text-[9px] sm:text-[10px] font-bold transition-colors`}
                      >
                        Tip
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOUNTY DETAIL & SUBMISSION WORKFLOW MODAL - RESPONSIVE FOR ALL SCREEN HEIGHTS */}
      {activeBountyModal && (
        <div className={`fixed inset-0 z-50 ${theme === 'light' ? 'bg-black/60' : 'bg-black/85'} backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none`}>
          <div className={`w-full max-w-md ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' : 'bg-[#070E1B] border-[#FF9F0A]/30 text-white shadow-2xl'
          } border rounded-3xl p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 max-h-[85vh] overflow-y-auto`}>
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border truncate ${
                theme === 'light' ? 'text-amber-800 bg-amber-50 border-amber-300' : 'text-amber-400 bg-amber-950/80 border-amber-800'
              }`}>
                {activeBountyModal.category} • Brand Escrow
              </span>
              <button
                onClick={() => {
                  setActiveBountyModal(null);
                  setAwardedWinner(null);
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  theme === 'light' ? 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Banner with Upfront Guaranteed Pool */}
            <div className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r ${activeBountyModal.bannerColor} text-white shadow-lg relative overflow-hidden`}>
              <div className="text-[11px] sm:text-xs text-white/90 font-medium">{activeBountyModal.sponsor} presents</div>
              <h2 className="text-base sm:text-lg font-black mt-0.5 mb-1 sm:mb-2 leading-tight">{activeBountyModal.title}</h2>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xl sm:text-2xl font-black">
                  GHS {activeBountyModal.rewardPoolGHS.toLocaleString()}
                </span>
                <span className="text-[10px] sm:text-xs text-white/80 font-semibold">
                  (${activeBountyModal.rewardPoolUSD} USD Guaranteed Escrow)
                </span>
              </div>
            </div>

            {/* Sub-Tabs: Overview | Submissions | Prize Payouts */}
            <div className={`grid grid-cols-3 gap-1 p-1 rounded-xl border text-[11px] sm:text-xs font-bold ${
              theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-black/60 border-neutral-800'
            }`}>
              <button
                type="button"
                onClick={() => setBountyTab('overview')}
                className={`py-1 sm:py-1.5 rounded-lg transition-all ${
                  bountyTab === 'overview'
                    ? 'bg-amber-500 text-black shadow-sm font-black'
                    : (theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white')
                }`}
              >
                Brief
              </button>
              <button
                type="button"
                onClick={() => setBountyTab('submissions')}
                className={`py-1 sm:py-1.5 rounded-lg transition-all ${
                  bountyTab === 'submissions'
                    ? 'bg-amber-500 text-black shadow-sm font-black'
                    : (theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white')
                }`}
              >
                Entries ({activeBountyModal.submissionsCount})
              </button>
              <button
                type="button"
                onClick={() => setBountyTab('payouts')}
                className={`py-1 sm:py-1.5 rounded-lg transition-all ${
                  bountyTab === 'payouts'
                    ? 'bg-amber-500 text-black shadow-sm font-black'
                    : (theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white')
                }`}
              >
                Prizes 🏆
              </button>
            </div>

            {/* AWARDED WINNER CELEBRATION CARD */}
            {awardedWinner && (
              <div className={`border p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col items-center text-center animate-fade-in ${
                theme === 'light' ? 'bg-emerald-50 border-emerald-300' : 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/10 border-emerald-400/50'
              }`}>
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 mb-1 animate-bounce" />
                <h4 className={`text-xs sm:text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Prize Money Dispatched!</h4>
                <p className={`text-[11px] sm:text-xs mt-0.5 ${theme === 'light' ? 'text-emerald-800' : 'text-emerald-300'}`}>
                  @{awardedWinner.creator} was awarded {awardedWinner.rank}: <span className="font-bold">GHS {awardedWinner.amount.toFixed(2)}</span>
                </p>
                <span className={`text-[9px] sm:text-[10px] mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Transferred from Brand Escrow to Creator's MTN MoMo Wallet in 2s ⚡
                </span>
              </div>
            )}

            {/* TAB 1: OVERVIEW & BRIEF */}
            {bountyTab === 'overview' && (
              <div className="flex flex-col gap-3">
                <div className={`flex items-center justify-around py-2 sm:py-2.5 rounded-xl border text-center ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-neutral-800'
                }`}>
                  <div>
                    <div className={`text-[9px] sm:text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Total Entries</div>
                    <div className={`text-[11px] sm:text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{activeBountyModal.submissionsCount} videos</div>
                  </div>
                  <div className={`w-px h-6 ${theme === 'light' ? 'bg-slate-200' : 'bg-neutral-800'}`} />
                  <div>
                    <div className={`text-[9px] sm:text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Participants</div>
                    <div className={`text-[11px] sm:text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{activeBountyModal.participantsCount} creators</div>
                  </div>
                  <div className={`w-px h-6 ${theme === 'light' ? 'bg-slate-200' : 'bg-neutral-800'}`} />
                  <div>
                    <div className={`text-[9px] sm:text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Judging In</div>
                    <div className={`text-[11px] sm:text-xs font-bold ${theme === 'light' ? 'text-amber-700' : 'text-amber-400'}`}>{activeBountyModal.daysRemaining} days left</div>
                  </div>
                </div>

                <div>
                  <h4 className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-1 ${
                    theme === 'light' ? 'text-slate-700' : 'text-neutral-300'
                  }`}>
                    Challenge Guidelines
                  </h4>
                  <p className={`text-[11px] sm:text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-neutral-300'}`}>
                    {activeBountyModal.description}
                  </p>
                </div>

                <div>
                  <h4 className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-1.5 sm:mb-2 ${
                    theme === 'light' ? 'text-slate-700' : 'text-neutral-300'
                  }`}>
                    Entry Criteria & Checklist
                  </h4>
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    {activeBountyModal.requirements.map((req, i) => (
                      <div key={i} className={`flex items-start gap-2 text-[11px] sm:text-xs ${theme === 'light' ? 'text-slate-700' : 'text-neutral-300'}`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`} />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`flex items-center gap-2 p-2.5 sm:p-3 rounded-xl border text-[10px] sm:text-[11px] ${
                  theme === 'light' ? 'bg-cyan-50/80 border-cyan-200 text-slate-700' : 'bg-[#0A1628] border-neutral-800 text-neutral-400'
                }`}>
                  <ShieldCheck className={`w-4 h-4 shrink-0 ${theme === 'light' ? 'text-cyan-600' : 'text-cyan-400'}`} />
                  <span>
                    Upfront Escrow Guaranteed: Brand deposited GHS {activeBountyModal.rewardPoolGHS} prior to challenge launch.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: SUBMISSIONS GALLERY */}
            {bountyTab === 'submissions' && (() => {
              const tag = (activeBountyModal.submissionTag || '').toLowerCase().replace(/^#/, '');
              const bountySubmissions = videos.filter((v) => 
                (v.caption || '').toLowerCase().includes(tag) ||
                (v.hashtags || []).some((h) => h.toLowerCase() === tag)
              );

              if (bountySubmissions.length === 0) {
                return (
                  <div className={`py-6 px-4 text-center rounded-2xl border flex flex-col items-center gap-2 ${
                    theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-neutral-800'
                  }`}>
                    <Award className="w-7 h-7 text-amber-500" />
                    <p className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>No submissions entered yet!</p>
                    <p className={`text-[10px] max-w-xs ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                      Be the first creator to record a video with {activeBountyModal.submissionTag} to claim from the GHS {activeBountyModal.rewardPoolGHS} prize pool.
                    </p>
                    <button
                      onClick={() => handleJoinBounty(activeBountyModal)}
                      className="mt-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-bold rounded-xl active:scale-95 transition-transform"
                    >
                      Record First Video
                    </button>
                  </div>
                );
              }

              return (
                <div className="flex flex-col gap-2">
                  <div className={`flex items-center justify-between text-[10px] sm:text-xs pb-1 border-b ${
                    theme === 'light' ? 'border-slate-200 text-slate-500' : 'border-neutral-800 text-neutral-400'
                  }`}>
                    <span>Top Competing Creator Entries</span>
                    <span>Ranked by Views</span>
                  </div>

                  {bountySubmissions.map((v, idx) => {
                    const prizePercent = idx === 0 ? 0.6 : idx === 1 ? 0.25 : 0.15;
                    const prize = activeBountyModal.rewardPoolGHS * prizePercent;
                    const rankLabel = idx === 0 ? '1st Place Contender' : idx === 1 ? '2nd Place Contender' : `${idx + 1}th Place Contender`;

                    return (
                      <div
                        key={v.id}
                        className={`border rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 transition-colors ${
                          theme === 'light'
                            ? 'bg-slate-50 border-slate-200 hover:border-amber-400'
                            : 'bg-black/50 border-neutral-800 hover:border-amber-400/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div 
                            className="relative w-10 h-14 sm:w-12 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden bg-neutral-900 shrink-0 cursor-pointer" 
                            onClick={() => handleSelectVideo(v)}
                          >
                            <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white fill-white" />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className={`text-[9px] sm:text-[10px] font-bold px-1 py-0.2 rounded border shrink-0 ${
                                theme === 'light' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-950 text-amber-400 border-amber-800'
                              }`}>
                                #{idx + 1}
                              </span>
                              <span className={`text-[11px] sm:text-xs font-bold truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                @{v.creator?.username}
                              </span>
                            </div>
                            <div className={`text-[10px] truncate mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                              {v.title}
                            </div>
                            <div className={`flex items-center gap-1.5 text-[9px] sm:text-[10px] mt-0.5 truncate ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                              <span className={`font-medium ${theme === 'light' ? 'text-cyan-700' : 'text-cyan-300'}`}>{formatCompactNumber(v.stats?.views || 0)} views</span>
                              <span>•</span>
                              <span className={`font-bold truncate ${theme === 'light' ? 'text-amber-700' : 'text-amber-400'}`}>GHS {prize.toFixed(0)} Prize</span>
                            </div>
                          </div>
                        </div>

                        {/* Brand Award Winner Trigger */}
                        <button
                          onClick={() => handleAwardWinner(v.creator?.username || 'creator', prize, rankLabel)}
                          className="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-gradient-to-r from-[#FF9F0A] to-amber-600 text-black font-black rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1 shrink-0"
                        >
                          <Trophy className="w-3 h-3 text-black" />
                          <span>Award</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* TAB 3: PRIZE MONEY DISTRIBUTION */}
            {bountyTab === 'payouts' && (
              <div className="flex flex-col gap-2.5 sm:gap-3">
                <div className={`text-[11px] sm:text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-neutral-300'}`}>
                  The brand's total prize pool is divided transparently among the top 3 best video submissions:
                </div>

                <div className="flex flex-col gap-2">
                  <div className={`border p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2 ${
                    theme === 'light'
                      ? 'bg-amber-50/70 border-amber-300'
                      : 'bg-gradient-to-r from-amber-500/20 to-transparent border-amber-400/40'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg sm:text-xl shrink-0">🥇</span>
                      <div className="min-w-0">
                        <div className={`text-[11px] sm:text-xs font-bold truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>1st Grand Winner (60%)</div>
                        <div className={`text-[9px] sm:text-[10px] line-clamp-1 ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Best quality & adherence to brief</div>
                      </div>
                    </div>
                    <span className={`text-xs sm:text-sm font-black shrink-0 ${theme === 'light' ? 'text-amber-800' : 'text-amber-400'}`}>
                      GHS {(activeBountyModal.rewardPoolGHS * 0.6).toFixed(2)}
                    </span>
                  </div>

                  <div className={`border p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2 ${
                    theme === 'light'
                      ? 'bg-cyan-50/70 border-cyan-300'
                      : 'bg-gradient-to-r from-cyan-500/15 to-transparent border-cyan-400/30'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg sm:text-xl shrink-0">🥈</span>
                      <div className="min-w-0">
                        <div className={`text-[11px] sm:text-xs font-bold truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>2nd Runner-Up (25%)</div>
                        <div className={`text-[9px] sm:text-[10px] line-clamp-1 ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>High retention rate & community engagement</div>
                      </div>
                    </div>
                    <span className={`text-xs sm:text-sm font-black shrink-0 ${theme === 'light' ? 'text-cyan-800' : 'text-cyan-300'}`}>
                      GHS {(activeBountyModal.rewardPoolGHS * 0.25).toFixed(2)}
                    </span>
                  </div>

                  <div className={`border p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2 ${
                    theme === 'light'
                      ? 'bg-orange-50/70 border-orange-300'
                      : 'bg-gradient-to-r from-orange-500/15 to-transparent border-orange-400/30'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg sm:text-xl shrink-0">🥉</span>
                      <div className="min-w-0">
                        <div className={`text-[11px] sm:text-xs font-bold truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>3rd Finalist (15%)</div>
                        <div className={`text-[9px] sm:text-[10px] line-clamp-1 ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Creative storytelling & audience comments</div>
                      </div>
                    </div>
                    <span className={`text-xs sm:text-sm font-black shrink-0 ${theme === 'light' ? 'text-orange-800' : 'text-orange-400'}`}>
                      GHS {(activeBountyModal.rewardPoolGHS * 0.15).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-[10px] sm:text-xs flex flex-col gap-1 ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-black/40 border-neutral-800 text-neutral-300'
                }`}>
                  <span className={`font-bold flex items-center gap-1.5 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    How Winners Receive Their Money:
                  </span>
                  <p className={`text-[10px] sm:text-[11px] leading-normal ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Prize funds are held in Bank/MoMo escrow. Once the brand selects the winner or community voting ends, the prize automatically credits to the creator's ValuWallet for instant cashout to MTN MoMo or Telecel Cash.
                  </p>
                </div>
              </div>
            )}

            {/* ACTION BUTTON */}
            <button
              onClick={() => handleJoinBounty(activeBountyModal)}
              className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-[#FF9F0A] via-[#F59E0B] to-amber-600 text-black font-black text-xs sm:text-sm shadow-lg shadow-[#FF9F0A]/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5 mt-0.5"
            >
              <Award className="w-4 h-4 text-black shrink-0" />
              <span className="truncate">Record & Submit Video (+{activeBountyModal.submissionTag})</span>
            </button>
          </div>
        </div>
      )}

      {/* CREATE COMMUNITY PREDICTION MODAL */}
      {showCreatePredictionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 min-[360px]:p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' : 'bg-[#0A101D] border-[#FF9F0A]/30 text-white shadow-2xl'
          } border rounded-2xl min-[360px]:rounded-3xl p-3 min-[360px]:p-4 sm:p-5 flex flex-col gap-3 sm:gap-3.5 max-h-[88vh] sm:max-h-[90vh] overflow-y-auto overscroll-contain`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-2 border-b pb-2.5 sm:pb-3 border-neutral-800/40">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 min-[360px]:w-7 min-[360px]:h-7 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Vote className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs min-[360px]:text-sm sm:text-base font-black leading-tight truncate">Create Community Prediction</h3>
                  <p className={`text-[8.5px] min-[360px]:text-[10px] truncate ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Ask the ValuVid community to vote and stake on real outcomes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreatePredictionModal(false)}
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  theme === 'light' ? 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePrediction} className="flex flex-col gap-2.5 min-[360px]:gap-3">
              {/* Question */}
              <div>
                <label className={`block text-[10px] min-[360px]:text-[11px] font-bold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-neutral-300'}`}>
                  Prediction Question *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newPredQuestion}
                  onChange={(e) => setNewPredQuestion(e.target.value)}
                  placeholder="e.g. Will King Promise win Artiste of the Year at the 2026 TGMAs?"
                  className={`w-full px-2.5 min-[360px]:px-3 py-1.5 min-[360px]:py-2 text-[11px] min-[360px]:text-xs rounded-xl border outline-none resize-none transition-all ${
                    theme === 'light'
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                      : 'bg-neutral-900/90 border-neutral-800 text-white focus:border-amber-400'
                  }`}
                />
              </div>

              {/* Category */}
              <div>
                <label className={`block text-[10px] min-[360px]:text-[11px] font-bold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-neutral-300'}`}>
                  Category
                </label>
                <div className="flex flex-wrap gap-1 min-[360px]:gap-1.5">
                  {[
                    'Creator Milestones',
                    'Sound Culture',
                    'Ethics & Economy',
                    'Entertainment & Sports',
                    'Tech & AI Trends',
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewPredCategory(cat)}
                      className={`px-2 min-[360px]:px-2.5 py-1 min-[360px]:py-1.5 rounded-lg min-[360px]:rounded-xl border text-[9px] min-[360px]:text-[10px] font-bold text-left transition-all whitespace-nowrap active:scale-95 ${
                        newPredCategory === cat
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-extrabold shadow-xs'
                          : (theme === 'light'
                              ? 'bg-slate-50 border-slate-200 text-slate-700 hover:border-amber-300'
                              : 'bg-neutral-900/60 border-neutral-800 text-neutral-300 hover:border-neutral-700')
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voting Options */}
              <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-1.5 min-[360px]:gap-2">
                <div>
                  <label className={`block text-[9.5px] min-[360px]:text-[10.5px] font-bold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-neutral-300'}`}>
                    Option A (Choice 1)
                  </label>
                  <input
                    type="text"
                    required
                    value={newPredOptionA}
                    onChange={(e) => setNewPredOptionA(e.target.value)}
                    placeholder="🔥 Yes / Option A"
                    className={`w-full px-2 min-[360px]:px-2.5 py-1.5 min-[360px]:py-2 text-[11px] min-[360px]:text-xs rounded-xl border outline-none ${
                      theme === 'light'
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                        : 'bg-neutral-900/90 border-neutral-800 text-white focus:border-amber-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[9.5px] min-[360px]:text-[10.5px] font-bold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-neutral-300'}`}>
                    Option B (Choice 2)
                  </label>
                  <input
                    type="text"
                    required
                    value={newPredOptionB}
                    onChange={(e) => setNewPredOptionB(e.target.value)}
                    placeholder="⏳ No / Option B"
                    className={`w-full px-2 min-[360px]:px-2.5 py-1.5 min-[360px]:py-2 text-[11px] min-[360px]:text-xs rounded-xl border outline-none ${
                      theme === 'light'
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                        : 'bg-neutral-900/90 border-neutral-800 text-white focus:border-amber-400'
                    }`}
                  />
                </div>
              </div>

              {/* Pool & Duration */}
              <div className="grid grid-cols-1 min-[340px]:grid-cols-2 gap-1.5 min-[360px]:gap-2">
                <div>
                  <label className={`block text-[9.5px] min-[360px]:text-[10.5px] font-bold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-neutral-300'}`}>
                    Initial Seed Pool (GHS)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="5"
                      value={newPredPoolGHS}
                      onChange={(e) => setNewPredPoolGHS(Math.max(0, Number(e.target.value) || 0))}
                      className={`w-full pl-6 min-[360px]:pl-7 pr-2 min-[360px]:pr-2.5 py-1.5 min-[360px]:py-2 text-[11px] min-[360px]:text-xs font-mono font-bold rounded-xl border outline-none ${
                        theme === 'light'
                          ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                          : 'bg-neutral-900/90 border-neutral-800 text-white focus:border-amber-400'
                      }`}
                    />
                    <Coins className="w-3 h-3 min-[360px]:w-3.5 min-[360px]:h-3.5 text-amber-400 absolute left-2 min-[360px]:left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className={`block text-[9.5px] min-[360px]:text-[10.5px] font-bold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-neutral-300'}`}>
                    Duration
                  </label>
                  <select
                    value={newPredDuration}
                    onChange={(e) => setNewPredDuration(e.target.value)}
                    className={`w-full px-2 min-[360px]:px-2.5 py-1.5 min-[360px]:py-2 text-[11px] min-[360px]:text-xs font-bold rounded-xl border outline-none ${
                      theme === 'light'
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                        : 'bg-neutral-900/90 border-neutral-800 text-white focus:border-amber-400'
                    }`}
                  >
                    <option value="24h left">24 Hours</option>
                    <option value="3 days left">3 Days</option>
                    <option value="5 days left">5 Days</option>
                    <option value="7 days left">7 Days</option>
                  </select>
                </div>
              </div>

              {/* Notice */}
              <div className={`p-2 min-[360px]:p-2.5 rounded-xl border text-[9px] min-[360px]:text-[10px] flex items-center gap-1.5 min-[360px]:gap-2 ${
                theme === 'light' ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
              }`}>
                <Sparkles className="w-3 h-3 min-[360px]:w-3.5 min-[360px]:h-3.5 text-amber-400 shrink-0" />
                <span className="leading-tight">Your prediction will be published live with 0 votes. Users vote with real consensus metrics!</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 min-[360px]:py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-black font-black text-xs min-[360px]:text-sm shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 mt-0.5"
              >
                <Vote className="w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 fill-black" />
                <span>Publish Prediction Live</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
