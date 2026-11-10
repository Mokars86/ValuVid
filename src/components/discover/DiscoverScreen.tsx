import React, { useState, useMemo, useEffect } from 'react';
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
  User
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BountyChallenge, VideoItem } from '../../types';
import { sounds } from '../../utils/soundEffects';
import { getAllKnownUsers, getUserAvatar } from '../../utils/userDirectory';
import { searchProfilesInSupabase, getDeletedVideoIds } from '../../services/supabaseClient';
import { formatCompactNumber } from '../../utils/formatNumber';

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
    toggleFollowCreator,
    currentUser,
    discoverSearchQuery,
    setDiscoverSearchQuery,
    openCreatorProfile,
    playVideo
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

  const filters = [
    { id: 'all', label: '🔥 Trending & All', badge: 'Live', scope: 'all' },
    { id: 'global', label: '🌍 Global Scale', badge: 'Worldwide', scope: 'global' },
    { id: 'local-ghana', label: '🇬🇭 Local African Hub', badge: 'Ghana', scope: 'local' },
    { id: 'high-engagement', label: '⚡️ High Engagement', badge: 'Viral', scope: 'performance' },
    { id: 'tech', label: '💻 Tech & AI', badge: 'Code', scope: 'niche' },
    { id: 'fashion-culture', label: '✨ Culture & Fashion', badge: 'Vibes', scope: 'niche' },
    { id: 'education', label: '🎓 Tutorials & Skills', badge: 'Learn', scope: 'niche' },
    { id: 'bounties', label: '🏆 Cash Bounties', badge: 'Escrow', scope: 'bounties' },
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
      if (isInvalid) return false;

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

      const combinedText = `${video.title} ${video.caption} ${(video.hashtags || []).join(' ')} ${video.category} ${video.creator?.username}`.toLowerCase();

      if (selectedFilter === 'global') {
        // High reach worldwide videos
        return (video.stats?.views || 0) > 200 || !combinedText.includes('local');
      }

      if (selectedFilter === 'local-ghana') {
        // Local African & Ghanaian creators, culture, or local tags
        const isGhanaianCreator = ['mokarstech', 'mokarsstitches', 'aaish'].some(
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

      return getEngagementScore(b) - getEngagementScore(a);
    });
  }, [videos, cleanQuery, selectedFilter]);

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

    const isMockAccount = (uname?: string) => {
      if (!uname) return true;
      const u = uname.toLowerCase().replace(/^@/, '');
      return (
        u === 'emmanuel_creator' ||
        u === 'kwame_code' ||
        u === 'user_current' ||
        u === 'user_fintech' ||
        u === 'demo-creator-1' ||
        u === 'deleted' ||
        u.startsWith('test')
      );
    };

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
    <div className={`w-full h-full ${theme === 'light' ? 'bg-[#F8FAFC] text-slate-900' : 'bg-neutral-950 text-white'} flex flex-col overflow-y-auto overscroll-contain pb-20 select-none transition-colors duration-200`}>
      {/* SEARCH & FILTERS HEADER - COMPACT & FULLY RESPONSIVE */}
      <div className={`sticky top-0 z-30 ${theme === 'light' ? 'bg-white/95 border-slate-200' : 'bg-neutral-950/95 border-neutral-900'} backdrop-blur-md px-3 sm:px-4 pt-8 sm:pt-4 pb-2 border-b transition-colors`}>
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
                          src={creator.avatar}
                          alt={creator.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-amber-500/40 group-hover:scale-105 transition-transform shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = getUserAvatar(undefined, creator.name || creator.username);
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
                      {creator.username !== currentUser?.username ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFollowCreator(creator.id || creator.username);
                          }}
                          className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer shrink-0 ${
                            creator.isFollowing
                              ? 'bg-neutral-800/90 hover:bg-neutral-700/90 text-emerald-400 border border-emerald-500/30'
                              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black shadow-amber-500/20'
                          }`}
                          title={creator.isFollowing ? 'Click to unfollow' : 'Follow creator'}
                        >
                          {creator.isFollowing ? (
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
                      ) : (
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
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
                    <img
                      src={video.thumbnailUrl || '/default-avatar.svg'}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/default-avatar.svg';
                      }}
                    />

                    {/* Top Tip Badge Overlay - Only shown when tips are earned */}
                    {(video.stats?.tipsTotalGHS || 0) > 0 && (
                      <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 flex items-center gap-1 bg-neutral-950/85 backdrop-blur-md px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-400/40 shadow-md">
                        <Coins className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                        <span className="text-[9px] sm:text-[10px] font-bold text-amber-300 leading-tight">
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
                    <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 z-10 flex items-center gap-1 text-[9px] sm:text-[10px] text-white/90 drop-shadow-md">
                      <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span>{formatCompactNumber(video.stats?.views || 0)}</span>
                    </div>

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                  </div>

                  {/* Video Info Card Footer with protected min-w-0 flexbox */}
                  <div className={`p-2 sm:p-2.5 flex flex-col gap-1 sm:gap-1.5 ${theme === 'light' ? 'bg-white' : 'bg-neutral-900'}`}>
                    <p className={`text-[11px] sm:text-xs font-semibold line-clamp-1 transition-colors ${
                      theme === 'light' ? 'text-slate-800 group-hover:text-amber-600' : 'text-neutral-200 group-hover:text-amber-400'
                    }`}>
                      {video.title}
                    </p>

                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] gap-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                        <img
                          src={getUserAvatar(video.creator.avatar, video.creator.username)}
                          alt={video.creator.username}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full object-cover shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/default-avatar.svg';
                          }}
                        />
                        <span className={`truncate text-[10px] sm:text-[11px] ${theme === 'light' ? 'text-slate-600' : 'text-neutral-400'}`}>@{video.creator.username}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openTipModal(video);
                        }}
                        className={`px-1.5 sm:px-2 py-0.5 shrink-0 ${
                          theme === 'light' ? 'bg-amber-100 text-amber-800 hover:bg-amber-500 hover:text-white' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-neutral-950'
                        } rounded-md text-[9px] sm:text-[10px] font-bold transition-colors`}
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
    </div>
  );
};
