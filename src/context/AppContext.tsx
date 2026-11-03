import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  VideoItem, 
  BountyChallenge, 
  CommentItem, 
  TransactionItem, 
  PayoutMethodItem, 
  Creator, 
  ActiveTab 
} from '../types';
import { sounds } from '../utils/soundEffects';
import { 
  supabase, 
  saveVideoToSupabase, 
  updateVideoInSupabase,
  updateCreatorFollowersInSupabase,
  fileToDataUrl,
  deleteVideoFromSupabase,
  markVideoAsDeleted,
  fetchVideosFromSupabase, 
  recordTransactionToSupabase, 
  saveCommentToSupabase,
  testSupabaseConnection,
  signUpWithEmail,
  signInWithEmail,
  signOutSupabase,
  getCurrentSupabaseUser,
  fetchBountiesFromSupabase,
  fetchTransactionsFromSupabase
} from '../services/supabaseClient';
import { App as CapApp } from '@capacitor/app';
import { saveMediaBlob, cacheLiveVideoUrl } from '../utils/mediaStorage';
import { 
  validateNewRegistration, 
  recordNewRegistration, 
  validatePayoutChannelExclusivity 
} from '../utils/deviceFingerprint';

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  feedFilter: 'following' | 'foryou' | 'global' | 'fresh' | 'bounties' | 'ghana' | 'tech';
  setFeedFilter: (f: 'following' | 'foryou' | 'global' | 'fresh' | 'bounties' | 'ghana' | 'tech') => void;
  videos: VideoItem[];
  setVideos: React.Dispatch<React.SetStateAction<VideoItem[]>>;
  currentVideoIndex: number;
  setCurrentVideoIndex: (idx: number) => void;
  currentUser: Creator;
  isSupabaseConnected: boolean;
  wallet: {
    balanceGHS: number;
    balanceUSD: number;
    creatorTipsEarned: number;
    viewerWatchRewards: number;
    totalPlatformPayoutsTodayGHS: number;
    personalWatchEarningsTodayGHS: number;
  };
  transactions: TransactionItem[];
  payoutMethods: PayoutMethodItem[];
  bounties: BountyChallenge[];
  comments: Record<string, CommentItem[]>;
  deviceMode: 'mobile' | 'fullscreen' | 'iphone';
  setDeviceMode: (mode: 'mobile' | 'fullscreen' | 'iphone') => void;
  showSplash: boolean;
  setShowSplash: (show: boolean) => void;
  isFeedMuted: boolean;
  setIsFeedMuted: (muted: boolean) => void;
  
  // Modals & Overlays
  tipModalVideo: VideoItem | null;
  openTipModal: (video: VideoItem) => void;
  closeTipModal: () => void;
  
  cashoutDrawerOpen: boolean;
  openCashoutDrawer: () => void;
  closeCashoutDrawer: () => void;

  unlockPromptVideo: VideoItem | null;
  openUnlockPrompt: (video: VideoItem) => void;
  closeUnlockPrompt: () => void;

  analyticsVideo: VideoItem | null;
  openAnalytics: (video: VideoItem) => void;
  closeAnalytics: () => void;

  commentDrawerVideo: VideoItem | null;
  openCommentDrawer: (video: VideoItem) => void;
  closeCommentDrawer: () => void;

  shareModalVideo: VideoItem | null;
  openShareModal: (video: VideoItem) => void;
  closeShareModal: () => void;
  incrementShareCount: (videoId: string) => void;

  // Save / Bookmark & Device Download
  savedVideoIds: string[];
  toggleSaveVideo: (video: VideoItem) => void;
  isSaved: (videoId: string) => boolean;
  saveModalVideo: VideoItem | null;
  openSaveModal: (video: VideoItem) => void;
  closeSaveModal: () => void;

  // AI Content Transparency & Authenticity
  selectedAiDisclosureVideo: VideoItem | null;
  openAiDisclosureModal: (video: VideoItem) => void;
  closeAiDisclosureModal: () => void;
  humanTouchRatio: number;
  setHumanTouchRatio: (ratio: number) => void;

  // Next-Gen Creator Monetization (ValuSplit, Community Goal, Proof-of-Skill)
  selectedValuSplitVideo: VideoItem | null;
  openValuSplitModal: (video: VideoItem) => void;
  closeValuSplitModal: () => void;

  selectedCommunityGoalVideo: VideoItem | null;
  openCommunityGoalModal: (video: VideoItem) => void;
  closeCommunityGoalModal: () => void;

  selectedSkillQuizVideo: VideoItem | null;
  openSkillQuizModal: (video: VideoItem) => void;
  closeSkillQuizModal: () => void;

  shareToast: string | null;
  setShareToast: (msg: string | null) => void;
  clearShareToast: () => void;

  // Authentication (Supabase Email & Password)
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authMode: 'signin' | 'signup';
  setAuthMode: (mode: 'signin' | 'signup') => void;
  isLoggedIn: boolean;
  authUser: any | null;
  loginUser: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signupUser: (email: string, password: string, name: string, username: string, phone?: string) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  logoutUser: () => Promise<void>;
  loginAsDemoUser: () => void;
  updateUserProfile: (updates: { name?: string; username?: string; bio?: string; avatar?: string }) => Promise<void>;

  // Early-Stage Sustainable Funding & Pro Tools
  showFundingModal: boolean;
  setShowFundingModal: (show: boolean) => void;
  showProModal: boolean;
  setShowProModal: (show: boolean) => void;
  showSponsorModal: boolean;
  setShowSponsorModal: (show: boolean) => void;
  showWinPoolModal: boolean;
  setShowWinPoolModal: (show: boolean) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  isProMember: boolean;
  subscribePro: (tierName: string, priceGHS: number) => boolean;
  sponsorBounty: (title: string, sponsorName: string, poolGHS: number, category: string, paystackRef?: string) => void;
  fundingMetrics: {
    totalEscrowFloatGHS: number;
    creatorPayoutRatePercent: number;
    platformCommissionPercent: number;
    sponsoredBountiesFundedGHS: number;
    activeProSubscribers: number;
  };

  // Watch rewards progress & single-payout tracking per content
  watchRewardProgress: number; // 0 to 100
  totalMinutesWatched: number;
  rewardedVideoIds: string[];
  claimWatchReward: (videoId: string, videoTitle?: string, creatorUsername?: string) => boolean;
  isVideoRewarded: (videoId: string) => boolean;

  // Withdrawal rules & transparency limits
  cashoutLimitInfo: {
    minThresholdGHS: number;
    maxPerWeek: number;
    usedThisWeek: number;
    remainingThisWeek: number;
    isProMember: boolean;
    nextAvailableDate: Date | null;
    canCashout: boolean;
    reason?: string;
  };

  // Theme Mode ('light' default / 'dark')
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  // Actions
  toggleLikeVideo: (videoId: string) => void;
  toggleFollowCreator: (creatorId: string) => void;
  sendTip: (videoId: string, amountGHS: number, message?: string) => boolean;
  unlockContent: (videoId: string) => boolean;
  processCashout: (methodId: string, amountGHS: number, customRef?: string) => boolean;
  addFundsToWallet: (amountGHS: number, referenceId?: string, paymentMethod?: string) => void;
  addPayoutMethod: (method: Omit<PayoutMethodItem, 'id'>) => void;
  deletePayoutMethod: (methodId: string) => void;
  setDefaultPayoutMethod: (methodId: string) => void;
  addComment: (videoId: string, text: string, tipAmount?: number) => void;
  publishNewVideo: (video: Partial<VideoItem> & { fileBlob?: Blob | File }) => void;
  updateVideo: (videoId: string, updates: Partial<VideoItem>) => Promise<boolean>;
  deleteVideo: (videoId: string) => Promise<boolean>;
  shareVideoWithRewardLink: (video: VideoItem) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const GHS_TO_USD_RATE = 0.083; // Approx 1 USD = 12 GHS

const DEFAULT_AVATAR = '/default-avatar.jpg';

const getStoredProfile = (): Creator | null => {
  try {
    const raw = localStorage.getItem('valuvid_user_profile') || localStorage.getItem('valuvid_custom_profile');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

const getStoredAuthUser = () => {
  try {
    const raw = localStorage.getItem('valuvid_auth_user');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

const getStoredIsLoggedIn = (): boolean => {
  try {
    return localStorage.getItem('valuvid_is_logged_in') === 'true';
  } catch {
    return false;
  }
};

const resolveAvatar = (metaAvatar?: string) => {
  const saved = getStoredProfile();
  if (saved?.avatar) return saved.avatar;
  if (metaAvatar && !metaAvatar.includes('dicebear.com')) return metaAvatar;
  return DEFAULT_AVATAR;
};

const INITIAL_USER: Creator = (() => {
  const stored = getStoredProfile();
  if (stored && stored.id) {
    return stored;
  }
  return {
    id: stored?.id || '',
    name: stored?.name || 'ValuVid Creator',
    username: stored?.username || 'creator',
    avatar: resolveAvatar(),
    bio: stored?.bio || 'ValuVid Creator & Storyteller 🇬🇭',
    followers: 0,
    following: 0,
    likes: 0,
    totalTipsEarned: 0,
    verified: false,
    isHumanVerified: true,
    authenticityScore: 100,
    certificates: [],
  };
})();

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [feedFilter, setFeedFilter] = useState<'following' | 'foryou' | 'global' | 'fresh' | 'bounties' | 'ghana' | 'tech'>('foryou');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Day Mode ('light') is the default as requested
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('valuvid_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return 'light'; // Day mode default
    } catch {
      return 'light';
    }
  });

  const setTheme = useCallback((nextTheme: 'light' | 'dark') => {
    setThemeState(nextTheme);
    try {
      localStorage.setItem('valuvid_theme', nextTheme);
    } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('theme-dark', nextTheme === 'dark');
      document.documentElement.classList.toggle('theme-light', nextTheme === 'light');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    sounds.playLikePop();
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('valuvid_theme', next);
      } catch {}
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('theme-dark', next === 'dark');
        document.documentElement.classList.toggle('theme-light', next === 'light');
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('theme-dark', theme === 'dark');
      document.documentElement.classList.toggle('theme-light', theme === 'light');
    }
  }, [theme]);
  const [currentUser, setCurrentUser] = useState<Creator>(() => {
    const stored = getStoredProfile();
    return (stored && stored.id) ? stored : INITIAL_USER;
  });
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'fullscreen' | 'iphone'>('mobile');
  const [showSplash, setShowSplash] = useState(true);
  const [isFeedMuted, setIsFeedMutedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('valuvid_feed_muted') === 'true';
    } catch {
      return false; // Default unmuted for great video experience!
    }
  });

  const setIsFeedMuted = useCallback((muted: boolean) => {
    setIsFeedMutedState(muted);
    try {
      localStorage.setItem('valuvid_feed_muted', String(muted));
    } catch {}
  }, []);

  const DEFAULT_WALLET = {
    balanceGHS: 0.00,
    balanceUSD: 0.00,
    creatorTipsEarned: 0.00,
    viewerWatchRewards: 0.00,
    totalPlatformPayoutsTodayGHS: 0.00,
    personalWatchEarningsTodayGHS: 0.00,
  };

  const [wallet, setWallet] = useState(() => {
    try {
      const stored = localStorage.getItem('valuvid_user_wallet');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed?.balanceGHS === 'number') {
          return {
            balanceGHS: parsed.balanceGHS || 0.00,
            balanceUSD: parsed.balanceUSD || Number(((parsed.balanceGHS || 0) * GHS_TO_USD_RATE).toFixed(2)),
            creatorTipsEarned: parsed.creatorTipsEarned || 0.00,
            viewerWatchRewards: parsed.viewerWatchRewards || 0.00,
            totalPlatformPayoutsTodayGHS: parsed.totalPlatformPayoutsTodayGHS || 0.00,
            personalWatchEarningsTodayGHS: parsed.personalWatchEarningsTodayGHS || 0.00,
          };
        }
      }
    } catch {}
    return DEFAULT_WALLET;
  });

  const [transactions, setTransactions] = useState<TransactionItem[]>(() => {
    try {
      const stored = localStorage.getItem('valuvid_transactions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {}
    return [];
  });

  // Automatically persist wallet state across restarts
  useEffect(() => {
    try {
      localStorage.setItem('valuvid_user_wallet', JSON.stringify(wallet));
    } catch (e) {
      console.warn('[Storage] Failed to save wallet:', e);
    }
  }, [wallet]);

  // Automatically persist transactions across restarts
  useEffect(() => {
    try {
      localStorage.setItem('valuvid_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.warn('[Storage] Failed to save transactions:', e);
    }
  }, [transactions]);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethodItem[]>(() => {
    try {
      const stored = localStorage.getItem('valuvid_payout_methods');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out any previously seeded mock default
          const realMethods = parsed.filter((m) => m.id !== 'pm-mtn-default');
          return realMethods;
        }
      }
    } catch {}
    return [];
  });
  const [bounties, setBounties] = useState<BountyChallenge[]>([]);
  const [comments, setComments] = useState<Record<string, CommentItem[]>>(() => {
    try {
      const stored = localStorage.getItem('valuvid_comments');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return {};
  });

  // Automatically persist comments to localStorage across restarts
  useEffect(() => {
    try {
      localStorage.setItem('valuvid_comments', JSON.stringify(comments));
    } catch (e) {
      console.warn('[Storage] Failed to save comments:', e);
    }
  }, [comments]);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Authentication states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(getStoredIsLoggedIn);
  const [authUser, setAuthUser] = useState<any | null>(getStoredAuthUser);

  // Automatically persist user session & profile across online and offline app restarts
  useEffect(() => {
    try {
      localStorage.setItem('valuvid_is_logged_in', String(isLoggedIn));
      if (currentUser) {
        localStorage.setItem('valuvid_user_profile', JSON.stringify(currentUser));
        localStorage.setItem('valuvid_custom_profile', JSON.stringify(currentUser));
      }
      if (authUser) {
        localStorage.setItem('valuvid_auth_user', JSON.stringify(authUser));
      }
    } catch (e) {
      console.warn('[Storage] Failed to save auth session:', e);
    }
  }, [currentUser, isLoggedIn, authUser]);

  const refreshVideosFromSupabase = useCallback(() => {
    fetchVideosFromSupabase().then((dbVideos) => {
      if (dbVideos !== null) {
        try {
          const rawLocalVideos: VideoItem[] = JSON.parse(localStorage.getItem('valuvid_user_videos') || '[]');
          const localVideos = rawLocalVideos.filter((v) => 
            v.id !== 'vid-user-1' && 
            v.id !== 'vid-masterclass-1' && 
            !v.id.startsWith('vid-sample') && 
            !v.videoUrl?.includes('/videos/sample')
          );
          const followed: string[] = JSON.parse(localStorage.getItem('valuvid_followed_creators') || '[]');
          const likedIds: string[] = JSON.parse(localStorage.getItem('valuvid_liked_video_ids') || '[]');
          const combined = [...dbVideos];
          for (const lv of localVideos) {
            if (!combined.some((v) => v.id === lv.id)) {
              combined.unshift(lv);
            }
          }
          setVideos(
            combined.map((v) => ({
              ...v,
              isLiked: likedIds.includes(v.id) || !!v.isLiked,
              creator: {
                ...v.creator,
                isFollowing: followed.includes(v.creator.id) || v.creator.isFollowing,
              },
            }))
          );
        } catch {
          const likedIds: string[] = JSON.parse(localStorage.getItem('valuvid_liked_video_ids') || '[]');
          setVideos(
            dbVideos.map((v) => ({
              ...v,
              isLiked: likedIds.includes(v.id) || !!v.isLiked,
            }))
          );
        }

        // Sync comments fetched from Supabase video stats so comments never disappear
        setComments((prev) => {
          const next = { ...prev };
          let hasNewComments = false;
          for (const v of dbVideos) {
            if (v.stats?.commentsList && v.stats.commentsList.length > 0) {
              const currentList = next[v.id] || [];
              const currentIds = new Set(currentList.map((c) => c.id));
              const newItems = v.stats.commentsList.filter((c: CommentItem) => !currentIds.has(c.id));
              if (newItems.length > 0) {
                next[v.id] = [...currentList, ...newItems];
                hasNewComments = true;
              }
            }
          }
          if (hasNewComments) {
            try {
              localStorage.setItem('valuvid_comments', JSON.stringify(next));
            } catch {}
          }
          return hasNewComments ? next : prev;
        });
      }
    });
  }, []);

  // Supabase Backend Connectivity, Real-time Data Sync & Auth Session
  useEffect(() => {
    // Immediately load any locally uploaded user videos so they appear instantly
    try {
      const rawLocalVideos: VideoItem[] = JSON.parse(localStorage.getItem('valuvid_user_videos') || '[]');
      const localVideos = rawLocalVideos.filter((v) => 
        v.id !== 'vid-user-1' && 
        v.id !== 'vid-masterclass-1' && 
        !v.id.startsWith('vid-sample') && 
        !v.videoUrl?.includes('/videos/sample')
      );
      const followed: string[] = JSON.parse(localStorage.getItem('valuvid_followed_creators') || '[]');
      const likedIds: string[] = JSON.parse(localStorage.getItem('valuvid_liked_video_ids') || '[]');
      if (localVideos.length > 0) {
        setVideos(
          localVideos.map((v) => ({
            ...v,
            isLiked: likedIds.includes(v.id) || !!v.isLiked,
            creator: {
              ...v.creator,
              isFollowing: followed.includes(v.creator.id) || v.creator.isFollowing,
            },
          }))
        );
      }
    } catch {}

    testSupabaseConnection().then(({ connected }) => {
      setIsSupabaseConnected(connected);
      if (connected) {
        refreshVideosFromSupabase();

        // 2. Fetch live brand bounties from Supabase
        fetchBountiesFromSupabase().then((dbBounties) => {
          if (dbBounties && dbBounties.length > 0) {
            setBounties(dbBounties);
          }
        });

        // 3. Fetch real transactions from Supabase & merge with local storage
        fetchTransactionsFromSupabase().then((dbTxs) => {
          if (dbTxs && dbTxs.length > 0) {
            setTransactions((prev) => {
              const map = new Map<string, TransactionItem>();
              dbTxs.forEach((tx) => map.set(tx.id, tx));
              prev.forEach((tx) => {
                if (!map.has(tx.id)) {
                  map.set(tx.id, tx);
                }
              });
              const merged = Array.from(map.values());
              try {
                localStorage.setItem('valuvid_transactions', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        });
      }
    });

    // Check existing Supabase session (online)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthUser(session.user);
        setIsLoggedIn(true);
        const meta = session.user.user_metadata || {};
        const custom = getStoredProfile();
        const userHandle = custom?.username || meta.username || session.user.email?.split('@')[0] || 'creator';
        setCurrentUser((prev) => {
          const updated = {
            ...prev,
            id: session.user.id,
            email: session.user.email,
            name: custom?.name || meta.name || session.user.email?.split('@')[0] || prev.name || 'ValuVid Creator',
            username: userHandle,
            avatar: custom?.avatar || resolveAvatar(meta.avatar),
            bio: custom?.bio || meta.bio || prev.bio || 'ValuVid Creator & Storyteller 🇬🇭',
            following: typeof custom?.following === 'number' ? custom.following : (prev.following || 0),
            followers: typeof custom?.followers === 'number' ? custom.followers : (prev.followers || 0),
          };
          try {
            localStorage.setItem('valuvid_user_profile', JSON.stringify(updated));
            localStorage.setItem('valuvid_custom_profile', JSON.stringify(updated));
          } catch {}
          return updated;
        });
        refreshVideosFromSupabase();
      }
    }).catch((err) => {
      console.warn('[Supabase Auth] Offline / using cached local credentials:', err);
    });

    // Subscribe to auth state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setAuthUser(session.user);
        setIsLoggedIn(true);
        const meta = session.user.user_metadata || {};
        const custom = getStoredProfile();
        const userHandle = custom?.username || meta.username || session.user.email?.split('@')[0] || 'creator';
        setCurrentUser((prev) => {
          const updated = {
            ...prev,
            id: session.user.id,
            email: session.user.email,
            name: custom?.name || meta.name || session.user.email?.split('@')[0] || prev.name || 'ValuVid Creator',
            username: userHandle,
            avatar: custom?.avatar || resolveAvatar(meta.avatar),
            bio: custom?.bio || meta.bio || prev.bio || 'ValuVid Creator & Storyteller 🇬🇭',
            following: typeof custom?.following === 'number' ? custom.following : (prev.following || 0),
            followers: typeof custom?.followers === 'number' ? custom.followers : (prev.followers || 0),
          };
          try {
            localStorage.setItem('valuvid_user_profile', JSON.stringify(updated));
            localStorage.setItem('valuvid_custom_profile', JSON.stringify(updated));
          } catch {}
          return updated;
        });
        refreshVideosFromSupabase();
      } else if (event === 'SIGNED_OUT') {
        // ONLY log out if the user deliberately triggered a sign-out
        try {
          localStorage.removeItem('valuvid_auth_user');
          localStorage.removeItem('valuvid_is_logged_in');
          localStorage.removeItem('valuvid_user_profile');
          localStorage.removeItem('valuvid_custom_profile');
        } catch {}
        setAuthUser(null);
        setIsLoggedIn(false);
        setCurrentUser(INITIAL_USER);
        refreshVideosFromSupabase();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Early-Stage Sustainable Funding & Pro Tools States
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [showWinPoolModal, setShowWinPoolModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isProMember, setIsProMember] = useState<boolean>(() => {
    try {
      return localStorage.getItem('valuvid_is_pro_member') === 'true';
    } catch {
      return false;
    }
  });

  // Cashout timestamps history to enforce fair & transparent weekly withdrawal limits
  const [cashoutTimestamps, setCashoutTimestamps] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('valuvid_cashout_timestamps') || '[]');
    } catch {
      return [];
    }
  });

  const [fundingMetrics, setFundingMetrics] = useState({
    totalEscrowFloatGHS: 48920.00,
    creatorPayoutRatePercent: 92,
    platformCommissionPercent: 8,
    sponsoredBountiesFundedGHS: 9000.00,
    activeProSubscribers: 142,
  });

  // Modals
  const [tipModalVideo, setTipModalVideo] = useState<VideoItem | null>(null);
  const [cashoutDrawerOpen, setCashoutDrawerOpen] = useState(false);
  const [unlockPromptVideo, setUnlockPromptVideo] = useState<VideoItem | null>(null);
  const [analyticsVideo, setAnalyticsVideo] = useState<VideoItem | null>(null);
  const [commentDrawerVideo, setCommentDrawerVideo] = useState<VideoItem | null>(null);
  const [shareModalVideo, setShareModalVideo] = useState<VideoItem | null>(null);
  const [saveModalVideo, setSaveModalVideo] = useState<VideoItem | null>(null);
  const [savedVideoIds, setSavedVideoIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('valuvid_saved_videos') || '[]');
    } catch {
      return [];
    }
  });
  const [selectedAiDisclosureVideo, setSelectedAiDisclosureVideo] = useState<VideoItem | null>(null);
  const [selectedValuSplitVideo, setSelectedValuSplitVideo] = useState<VideoItem | null>(null);
  const [selectedCommunityGoalVideo, setSelectedCommunityGoalVideo] = useState<VideoItem | null>(null);
  const [selectedSkillQuizVideo, setSelectedSkillQuizVideo] = useState<VideoItem | null>(null);
  const [humanTouchRatio, setHumanTouchRatio] = useState<number>(85); // 85% Human Priority default
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Android System Hardware/Software Back Arrow handler (Capacitor & Web)
  useEffect(() => {
    let listenerHandle: any = null;
    try {
      CapApp.addListener('backButton', () => {
        if (commentDrawerVideo) {
          setCommentDrawerVideo(null);
        } else if (tipModalVideo) {
          setTipModalVideo(null);
        } else if (cashoutDrawerOpen) {
          setCashoutDrawerOpen(false);
        } else if (authModalOpen) {
          setAuthModalOpen(false);
        } else if (showProModal) {
          setShowProModal(false);
        } else if (showWinPoolModal) {
          setShowWinPoolModal(false);
        } else if (showSponsorModal) {
          setShowSponsorModal(false);
        } else if (showSettings) {
          setShowSettings(false);
        } else if (unlockPromptVideo) {
          setUnlockPromptVideo(null);
        } else if (analyticsVideo) {
          setAnalyticsVideo(null);
        } else if (shareModalVideo) {
          setShareModalVideo(null);
        } else if (saveModalVideo) {
          setSaveModalVideo(null);
        } else if (selectedAiDisclosureVideo) {
          setSelectedAiDisclosureVideo(null);
        } else if (selectedValuSplitVideo) {
          setSelectedValuSplitVideo(null);
        } else if (selectedCommunityGoalVideo) {
          setSelectedCommunityGoalVideo(null);
        } else if (selectedSkillQuizVideo) {
          setSelectedSkillQuizVideo(null);
        } else if (activeTab !== 'feed') {
          setActiveTab('feed');
        } else {
          try {
            CapApp.exitApp();
          } catch {}
        }
      }).then((handle) => {
        listenerHandle = handle;
      });
    } catch {}

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (commentDrawerVideo) setCommentDrawerVideo(null);
        else if (tipModalVideo) setTipModalVideo(null);
        else if (cashoutDrawerOpen) setCashoutDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    commentDrawerVideo,
    tipModalVideo,
    cashoutDrawerOpen,
    authModalOpen,
    showProModal,
    showWinPoolModal,
    showSponsorModal,
    showSettings,
    unlockPromptVideo,
    analyticsVideo,
    shareModalVideo,
    saveModalVideo,
    selectedAiDisclosureVideo,
    selectedValuSplitVideo,
    selectedCommunityGoalVideo,
    selectedSkillQuizVideo,
    activeTab,
  ]);

  // Watch rewards single-payout per content engine (never repeated on loop)
  const [rewardedVideoIds, setRewardedVideoIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('valuvid_rewarded_video_ids') || '[]');
    } catch {
      return [];
    }
  });

  const [watchRewardProgress, setWatchRewardProgress] = useState(0);
  const [totalMinutesWatched, setTotalMinutesWatched] = useState(14);

  const isVideoRewarded = useCallback((videoId: string): boolean => {
    if (!videoId) return false;
    return rewardedVideoIds.includes(videoId);
  }, [rewardedVideoIds]);

  const claimWatchReward = useCallback((videoId: string, videoTitle?: string, creatorUsername?: string): boolean => {
    if (!videoId) return false;

    // Strict rule: Watch micro-reward is granted ONCE per unique piece of content.
    // Even if the user repeats, replays, or loops the video, no second reward is given.
    if (rewardedVideoIds.includes(videoId)) {
      return false;
    }

    const rewardGHS = 0.02;

    setWallet((w) => {
      const nextGHS = Number((w.balanceGHS + rewardGHS).toFixed(2));
      const updated = {
        ...w,
        balanceGHS: nextGHS,
        balanceUSD: Number((nextGHS * GHS_TO_USD_RATE).toFixed(2)),
        viewerWatchRewards: Number((w.viewerWatchRewards + rewardGHS).toFixed(2)),
        personalWatchEarningsTodayGHS: Number((w.personalWatchEarningsTodayGHS + rewardGHS).toFixed(2)),
      };
      try {
        localStorage.setItem('valuvid_user_wallet', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const newTx: TransactionItem = {
      id: `tx-watch-${Date.now()}-${videoId}`,
      type: 'watch_reward',
      title: 'Viewer Watch-Time Micro-Reward',
      subtitle: videoTitle ? `Watched: "${videoTitle}"` : (creatorUsername ? `@${creatorUsername}'s video` : 'Earned for genuine video watch-time'),
      amountGHS: rewardGHS,
      timestamp: 'Just now',
      status: 'completed',
      method: 'In-App Wallet',
      referenceId: `WRD-${Math.floor(10000 + Math.random() * 90000)}`
    };
    setTransactions((txs) => {
      const updated = [newTx, ...txs];
      try {
        localStorage.setItem('valuvid_transactions', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    recordTransactionToSupabase(newTx);
    setTotalMinutesWatched((m) => m + 1);

    const updated = [...rewardedVideoIds, videoId];
    setRewardedVideoIds(updated);
    try {
      localStorage.setItem('valuvid_rewarded_video_ids', JSON.stringify(updated));
    } catch {}

    // On-screen notification removed for non-intrusive viewer experience
    return true;
  }, [rewardedVideoIds]);

  // Fair & Transparent Cashout Limits Engine:
  // - Minimum withdrawal threshold: GHS 50.00
  // - Free accounts: 1 withdrawal every 7 days (once a week)
  // - Pro subscribed creators: 2 withdrawals every 7 days (twice a week)
  const cashoutLimitInfo = useMemo(() => {
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const recent = cashoutTimestamps.filter((ts) => (now - ts) < SEVEN_DAYS_MS);
    const maxPerWeek = isProMember ? 2 : 1;
    const usedThisWeek = recent.length;
    const remainingThisWeek = Math.max(0, maxPerWeek - usedThisWeek);
    const canCashout = remainingThisWeek > 0 && wallet.balanceGHS >= 50.00;

    let nextAvailableDate: Date | null = null;
    let reason: string | undefined;

    if (remainingThisWeek === 0) {
      const oldestTs = Math.min(...recent);
      nextAvailableDate = new Date(oldestTs + SEVEN_DAYS_MS);
      reason = isProMember
        ? 'Weekly withdrawal limit of 2 cashouts reached.'
        : 'Weekly withdrawal limit (1 cashout per 7 days) reached. Upgrade to Pro for 2x weekly withdrawals.';
    } else if (wallet.balanceGHS < 50.00) {
      reason = `Minimum withdrawal threshold is GHS 50.00. Current balance: GHS ${wallet.balanceGHS.toFixed(2)}`;
    }

    return {
      minThresholdGHS: 50.00,
      maxPerWeek,
      usedThisWeek,
      remainingThisWeek,
      isProMember,
      nextAvailableDate,
      canCashout,
      reason,
    };
  }, [cashoutTimestamps, isProMember, wallet.balanceGHS]);

  const openTipModal = (video: VideoItem) => {
    setTipModalVideo(video);
  };
  const closeTipModal = () => setTipModalVideo(null);

  const openCashoutDrawer = () => setCashoutDrawerOpen(true);
  const closeCashoutDrawer = () => setCashoutDrawerOpen(false);

  const openUnlockPrompt = (video: VideoItem) => setUnlockPromptVideo(video);
  const closeUnlockPrompt = () => setUnlockPromptVideo(null);

  const openAnalytics = (video: VideoItem) => setAnalyticsVideo(video);
  const closeAnalytics = () => setAnalyticsVideo(null);

  const openCommentDrawer = (video: VideoItem) => setCommentDrawerVideo(video);
  const closeCommentDrawer = () => setCommentDrawerVideo(null);

  const openShareModal = useCallback((video: VideoItem) => setShareModalVideo(video), []);
  const closeShareModal = useCallback(() => setShareModalVideo(null), []);

  const openSaveModal = useCallback((video: VideoItem) => setSaveModalVideo(video), []);
  const closeSaveModal = useCallback(() => setSaveModalVideo(null), []);

  const isSaved = useCallback((videoId: string) => {
    return savedVideoIds.includes(videoId);
  }, [savedVideoIds]);

  const toggleSaveVideo = useCallback((video: VideoItem) => {
    const isAlreadySaved = savedVideoIds.includes(video.id);
    const nextSavedState = !isAlreadySaved;

    // 1. Update savedVideoIds array in state & localStorage
    setSavedVideoIds((prev) => {
      const exists = prev.includes(video.id);
      let updated: string[];
      if (exists) {
        updated = prev.filter((id) => id !== video.id);
        setShareToast('Removed from Bookmarks');
      } else {
        updated = [video.id, ...prev];
        setShareToast('Saved to Bookmarks! 🔖');
      }
      try {
        localStorage.setItem('valuvid_saved_videos', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist saved videos', e);
      }
      return updated;
    });

    // 2. Update real-time saves count in videos list
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === video.id) {
          const currentCount = v.stats?.saves ?? 0;
          const newCount = nextSavedState ? currentCount + 1 : Math.max(0, currentCount - 1);
          const updatedStats = {
            ...v.stats,
            saves: newCount,
          };

          try {
            const localVideos: VideoItem[] = JSON.parse(localStorage.getItem('valuvid_user_videos') || '[]');
            const updated = localVideos.map((lv) => (lv.id === video.id ? { ...lv, stats: updatedStats } : lv));
            localStorage.setItem('valuvid_user_videos', JSON.stringify(updated));
          } catch {}

          return {
            ...v,
            stats: updatedStats,
          };
        }
        return v;
      })
    );
  }, [savedVideoIds, setShareToast]);

  const incrementShareCount = useCallback((videoId: string) => {
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          const nextShares = (v.stats.shares || 0) + 1;
          const updatedStats = {
            ...v.stats,
            shares: nextShares,
          };

          // 1. Persist to local user videos cache
          try {
            const localVideos: VideoItem[] = JSON.parse(localStorage.getItem('valuvid_user_videos') || '[]');
            const updated = localVideos.map((lv) => (lv.id === videoId ? { ...lv, stats: updatedStats } : lv));
            localStorage.setItem('valuvid_user_videos', JSON.stringify(updated));
          } catch {}

          // 2. Persist to Supabase database asynchronously
          supabase
            .from('videos')
            .update({ stats: updatedStats })
            .eq('id', videoId)
            .then(() => {});

          return {
            ...v,
            stats: updatedStats,
          };
        }
        return v;
      })
    );
  }, []);

  const clearShareToast = () => setShareToast(null);

  const toggleLikeVideo = useCallback((videoId: string) => {
    // Prevent creators from liking their own content
    const targetVideo = videos.find((v) => v.id === videoId);
    if (targetVideo) {
      const isOwner = (currentUser?.id && targetVideo.creator?.id && currentUser.id === targetVideo.creator.id) ||
                      (currentUser?.username && targetVideo.creator?.username && currentUser.username.toLowerCase() === targetVideo.creator.username.toLowerCase());
      if (isOwner) {
        setShareToast("Creators cannot like their own videos 🚫");
        return;
      }
    }

    sounds.playLikePop();
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          const isLiked = !v.isLiked;
          const nextLikes = isLiked ? (v.stats.likes || 0) + 1 : Math.max(0, (v.stats.likes || 1) - 1);
          const updatedStats = {
            ...v.stats,
            likes: nextLikes,
          };

          const updatedVideo: VideoItem = {
            ...v,
            isLiked,
            stats: updatedStats,
          };

          // 1. Persist liked IDs in localStorage
          try {
            const likedIds: string[] = JSON.parse(localStorage.getItem('valuvid_liked_video_ids') || '[]');
            const nextLikedIds = isLiked
              ? Array.from(new Set([...likedIds, videoId]))
              : likedIds.filter((id) => id !== videoId);
            localStorage.setItem('valuvid_liked_video_ids', JSON.stringify(nextLikedIds));

            // 2. Persist cached liked video objects for immediate display in profile liked tab
            const cachedLikes: VideoItem[] = JSON.parse(localStorage.getItem('valuvid_liked_videos') || '[]');
            const nextCached = isLiked
              ? [updatedVideo, ...cachedLikes.filter((item) => item.id !== videoId)]
              : cachedLikes.filter((item) => item.id !== videoId);
            localStorage.setItem('valuvid_liked_videos', JSON.stringify(nextCached));
          } catch {}

          // 3. Persist local user videos if applicable
          try {
            const localVideos: VideoItem[] = JSON.parse(localStorage.getItem('valuvid_user_videos') || '[]');
            const updated = localVideos.map((lv) => (lv.id === videoId ? updatedVideo : lv));
            localStorage.setItem('valuvid_user_videos', JSON.stringify(updated));
          } catch {}

          supabase
            .from('videos')
            .update({ stats: updatedStats })
            .eq('id', videoId)
            .then(() => {});

          return updatedVideo;
        }
        return v;
      })
    );
  }, [videos, currentUser]);

  const toggleFollowCreator = useCallback((creatorId: string) => {
    sounds.playLikePop();

    let willFollow = false;
    try {
      const followed: string[] = JSON.parse(localStorage.getItem('valuvid_followed_creators') || '[]');
      willFollow = !followed.includes(creatorId);
      const nextFollowed = willFollow
        ? Array.from(new Set([...followed, creatorId]))
        : followed.filter((id) => id !== creatorId);
      localStorage.setItem('valuvid_followed_creators', JSON.stringify(nextFollowed));
    } catch {}

    const delta = willFollow ? 1 : -1;

    // 1. Update following count on currentUser
    setCurrentUser((prev) => {
      const nextFollowing = Math.max(0, (prev.following || 0) + delta);
      const updated = {
        ...prev,
        following: nextFollowing,
      };
      try {
        localStorage.setItem('valuvid_user_profile', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 2. Update creator's follower count and isFollowing status across feed
    setVideos((prev) =>
      prev.map((v) => {
        if (v.creator.id === creatorId || v.creator.username === creatorId) {
          const currentFollowers = typeof v.creator.followers === 'number' ? v.creator.followers : 0;
          return {
            ...v,
            creator: {
              ...v.creator,
              isFollowing: willFollow,
              followers: Math.max(0, currentFollowers + delta),
            },
          };
        }
        return v;
      })
    );

    // 3. Persist follower count to Supabase database so User A receives follower credit
    updateCreatorFollowersInSupabase(creatorId, delta);
  }, []);

  const sendTip = useCallback((videoId: string, amountGHS: number, message?: string): boolean => {
    if (wallet.balanceGHS < amountGHS) {
      alert(`Insufficient balance. Please add funds or cash in first! Balance: GHS ${wallet.balanceGHS.toFixed(2)}`);
      return false;
    }

    sounds.playCoinTip();

    // Deduct from wallet
    setWallet((w) => {
      const nextGHS = Number((w.balanceGHS - amountGHS).toFixed(2));
      return {
        ...w,
        balanceGHS: nextGHS,
        balanceUSD: Number((nextGHS * GHS_TO_USD_RATE).toFixed(2)),
      };
    });

    // Update video stats & creator tips
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          return {
            ...v,
            stats: {
              ...v.stats,
              tipsTotalGHS: Number((v.stats.tipsTotalGHS + amountGHS).toFixed(2)),
              tipsCount: v.stats.tipsCount + 1,
            },
            creator: {
              ...v.creator,
              totalTipsEarned: Number((v.creator.totalTipsEarned + amountGHS).toFixed(2)),
            },
          };
        }
        return v;
      })
    );

    const targetVideo = videos.find((v) => v.id === videoId);

    // Record transaction
    const newTx: TransactionItem = {
      id: `tx-tip-${Date.now()}`,
      type: 'tip_sent',
      title: `Valu-Tip Sent to @${targetVideo?.creator.username || 'creator'}`,
      subtitle: message ? `"${message}"` : `Direct creator support on "${targetVideo?.title || 'video'}"`,
      amountGHS: -amountGHS,
      timestamp: 'Just now',
      status: 'completed',
      method: 'In-App Wallet',
      referenceId: `TIP-${Math.floor(10000 + Math.random() * 90000)}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
    recordTransactionToSupabase(newTx);

    // If message was provided, auto-post as high-value tipped comment
    if (message) {
      const tippedComment: CommentItem = {
        id: `c-tip-${Date.now()}`,
        videoId,
        user: {
          name: currentUser.name,
          username: currentUser.username,
          avatar: currentUser.avatar,
        },
        text: message,
        createdAt: 'Just now',
        likes: 1,
        tipAmountGHS: amountGHS,
      };
      setComments((prev) => {
        const next = {
          ...prev,
          [videoId]: [tippedComment, ...(prev[videoId] || [])],
        };
        try {
          localStorage.setItem('valuvid_comments', JSON.stringify(next));
        } catch {}
        return next;
      });
      // Persist permanently to Supabase cloud
      saveCommentToSupabase(videoId, tippedComment);
    }

    return true;
  }, [wallet.balanceGHS, videos, currentUser]);

  const unlockContent = useCallback((videoId: string): boolean => {
    const video = videos.find((v) => v.id === videoId);
    if (!video) return false;
    const price = video.unlockPriceGHS || 5.00;

    if (wallet.balanceGHS < price) {
      alert(`Insufficient balance (GHS ${wallet.balanceGHS.toFixed(2)}) to unlock this premium video (GHS ${price.toFixed(2)}).`);
      return false;
    }

    sounds.playCoinTip();

    setWallet((w) => {
      const nextGHS = Number((w.balanceGHS - price).toFixed(2));
      return {
        ...w,
        balanceGHS: nextGHS,
        balanceUSD: Number((nextGHS * GHS_TO_USD_RATE).toFixed(2)),
      };
    });

    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          return {
            ...v,
            isUnlocked: true,
          };
        }
        return v;
      })
    );

    const newTx: TransactionItem = {
      id: `tx-unlock-${Date.now()}`,
      type: 'content_unlock',
      title: `Unlocked Premium Video: "${video.title}"`,
      subtitle: `Paid micro-fee to @${video.creator.username}`,
      amountGHS: -price,
      timestamp: 'Just now',
      status: 'completed',
      method: 'In-App Wallet',
      referenceId: `LCK-${Math.floor(10000 + Math.random() * 90000)}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
    recordTransactionToSupabase(newTx);

    return true;
  }, [videos, wallet.balanceGHS]);

  const processCashout = useCallback((methodId: string, amountGHS: number, customRef?: string): boolean => {
    // 1. Minimum withdrawal threshold check (GHS 50.00)
    if (amountGHS < 50.00) {
      alert(`Minimum withdrawal threshold is GHS 50.00 (50 Cedis). You entered GHS ${amountGHS.toFixed(2)}.`);
      return false;
    }

    // 2. Insufficient funds check
    if (wallet.balanceGHS < amountGHS) {
      alert(`Insufficient funds. Your withdrawable balance is GHS ${wallet.balanceGHS.toFixed(2)}.`);
      return false;
    }

    // 3. Weekly withdrawal frequency limits (1x/week for Free, 2x/week for Subscribed Pro)
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const recent = cashoutTimestamps.filter((ts) => (now - ts) < SEVEN_DAYS_MS);
    const maxPerWeek = isProMember ? 2 : 1;

    if (recent.length >= maxPerWeek) {
      const oldestTs = Math.min(...recent);
      const nextTime = new Date(oldestTs + SEVEN_DAYS_MS);
      const formattedDate = nextTime.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      alert(
        isProMember
          ? `Weekly withdrawal limit reached (2 withdrawals per 7 days for Pro Members).\n\nYour next withdrawal window opens on: ${formattedDate}.`
          : `Weekly withdrawal limit reached (1 withdrawal per 7 days for Free accounts).\n\nYour next withdrawal window opens on: ${formattedDate}.\n\nUpgrade to ValuVid Pro to withdraw twice weekly!`
      );
      return false;
    }

    const method = payoutMethods.find((m) => m.id === methodId) || payoutMethods[0];

    sounds.playSuccessPayout();

    setWallet((w) => {
      const nextGHS = Number((w.balanceGHS - amountGHS).toFixed(2));
      return {
        ...w,
        balanceGHS: nextGHS,
        balanceUSD: Number((nextGHS * GHS_TO_USD_RATE).toFixed(2)),
      };
    });

    const newTx: TransactionItem = {
      id: `tx-cashout-${Date.now()}`,
      type: 'cashout',
      title: `Cashout to ${method?.name || 'Mobile Money'}`,
      subtitle: `Sent to ${method?.accountNumber || '+233 24 981 7261'} (${method?.accountHolder || 'User'})`,
      amountGHS: -amountGHS,
      timestamp: 'Just now',
      status: 'completed',
      method: (method?.name as any) || 'MTN MoMo',
      referenceId: customRef || `CSH-${Math.floor(10000 + Math.random() * 90000)}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
    recordTransactionToSupabase(newTx);

    // Record cashout timestamp for weekly withdrawal limit tracking
    const updatedTimestamps = [...recent, now];
    setCashoutTimestamps(updatedTimestamps);
    try {
      localStorage.setItem('valuvid_cashout_timestamps', JSON.stringify(updatedTimestamps));
    } catch {}

    return true;
  }, [wallet.balanceGHS, payoutMethods, cashoutTimestamps, isProMember]);

  const addFundsToWallet = useCallback((amountGHS: number, referenceId?: string, paymentMethod?: string) => {
    sounds.playCoinTip();
    setWallet((w) => {
      const nextGHS = Number((w.balanceGHS + amountGHS).toFixed(2));
      return {
        ...w,
        balanceGHS: nextGHS,
        balanceUSD: Number((nextGHS * GHS_TO_USD_RATE).toFixed(2)),
      };
    });

    const newTx: TransactionItem = {
      id: `tx-topup-${Date.now()}`,
      type: 'topup',
      title: `Wallet Top-Up (${paymentMethod || 'Paystack MoMo'})`,
      subtitle: 'Funds added to tip favorite creators & unlock content',
      amountGHS: amountGHS,
      timestamp: 'Just now',
      status: 'completed',
      method: paymentMethod || 'MTN MoMo',
      referenceId: referenceId || `PAY-${Math.floor(10000 + Math.random() * 90000)}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
    recordTransactionToSupabase(newTx);
  }, []);

  const addPayoutMethod = useCallback((method: Omit<PayoutMethodItem, 'id'>) => {
    // Validate payout channel exclusivity (1 MoMo/Bank number = 1 Creator)
    const check = validatePayoutChannelExclusivity(method.accountNumber, currentUser.username);
    if (!check.allowed) {
      alert(check.reason || 'This payout channel is already registered to another account.');
      return;
    }

    sounds.playLikePop();
    const newMethod: PayoutMethodItem = {
      ...method,
      id: `pm-${Date.now()}`,
    };
    setPayoutMethods((prev) => {
      const updated = [...prev.map((m) => method.isDefault ? { ...m, isDefault: false } : m), newMethod];
      try {
        localStorage.setItem('valuvid_payout_methods', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [currentUser.username]);

  const deletePayoutMethod = useCallback((methodId: string) => {
    sounds.playLikePop();
    setPayoutMethods((prev) => {
      const filtered = prev.filter((m) => m.id !== methodId);
      if (filtered.length > 0 && !filtered.some((m) => m.isDefault)) {
        filtered[0] = { ...filtered[0], isDefault: true };
      }
      try {
        localStorage.setItem('valuvid_payout_methods', JSON.stringify(filtered));
      } catch {}
      return filtered;
    });
  }, []);

  const setDefaultPayoutMethod = useCallback((methodId: string) => {
    sounds.playLikePop();
    setPayoutMethods((prev) => {
      const updated = prev.map((m) => ({
        ...m,
        isDefault: m.id === methodId,
      }));
      try {
        localStorage.setItem('valuvid_payout_methods', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const addComment = useCallback((videoId: string, text: string, tipAmount?: number) => {
    sounds.playLikePop();
    const newComment: CommentItem = {
      id: `c-${Date.now()}`,
      videoId,
      user: {
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar,
      },
      text,
      createdAt: 'Just now',
      likes: 0,
      tipAmountGHS: tipAmount,
    };

    setComments((prev) => {
      const nextComments = {
        ...prev,
        [videoId]: [newComment, ...(prev[videoId] || [])],
      };
      try {
        localStorage.setItem('valuvid_comments', JSON.stringify(nextComments));
      } catch {}
      return nextComments;
    });

    // Persist permanently to Supabase cloud database
    saveCommentToSupabase(videoId, newComment);

    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          return {
            ...v,
            stats: {
              ...v.stats,
              comments: v.stats.comments + 1,
            },
          };
        }
        return v;
      })
    );
  }, [currentUser]);

  const publishNewVideo = useCallback(async (newVideoData: Partial<VideoItem> & { fileBlob?: Blob | File }) => {
    sounds.playSuccessPayout();
    const videoId = `vid-user-${Date.now()}`;

    // If fileBlob is provided, persist it in IndexedDB for immediate & future playback
    if (newVideoData.fileBlob) {
      await saveMediaBlob(videoId, newVideoData.fileBlob);
      await saveMediaBlob('latest_upload', newVideoData.fileBlob);
      if (newVideoData.videoUrl) {
        cacheLiveVideoUrl(videoId, newVideoData.videoUrl);
      }
    }

    // Ensure videoUrl is universally streamable across all user devices (convert local blob to persistent Data URL if needed)
    let persistentVideoUrl = newVideoData.videoUrl || '';
    if ((!persistentVideoUrl || persistentVideoUrl.startsWith('blob:')) && newVideoData.fileBlob) {
      try {
        persistentVideoUrl = await fileToDataUrl(newVideoData.fileBlob);
      } catch (err) {
        console.warn('Failed to convert fileBlob to data URL:', err);
      }
    }

    const createdVideo: VideoItem = {
      id: videoId,
      videoUrl: persistentVideoUrl || newVideoData.videoUrl || '',
      thumbnailUrl: newVideoData.thumbnailUrl || (currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80'),
      title: newVideoData.title || 'New ValuVid Creation',
      caption: newVideoData.caption || 'Fresh drop on ValuVid! 🇬🇭 #valuvid',
      hashtags: newVideoData.hashtags || ['valuvid', 'creator'],
      creator: {
        ...currentUser,
        id: authUser?.id || currentUser.id || 'creator',
        email: authUser?.email || currentUser.email || '',
      },
      audioTrack: newVideoData.audioTrack || {
        title: 'Original Sound - ' + currentUser.name,
        artist: currentUser.name,
      },
      stats: {
        likes: 0,
        comments: 0,
        shares: 0,
        views: 1,
        saves: 0,
        tipsTotalGHS: 0,
        tipsCount: 0,
      },
      category: newVideoData.category || 'trending',
      isPayPerUnlock: newVideoData.isPayPerUnlock || false,
      unlockPriceGHS: newVideoData.unlockPriceGHS,
      isUnlocked: true,
      watchRewardGHSPerMin: newVideoData.aiDisclosureType === 'generated' ? 0.01 : 0.02,
      durationSeconds: newVideoData.durationSeconds || 30,
      videoResolution: newVideoData.videoResolution || { width: 720, height: 1280, qualityLabel: '720p HD' },
      isAiContent: newVideoData.isAiContent || false,
      aiDisclosureType: newVideoData.aiDisclosureType || 'none',
      aiToolsUsed: newVideoData.aiToolsUsed || [],
      aiDetails: newVideoData.aiDetails,
      monetizationCeiling: newVideoData.aiDisclosureType === 'generated' ? 'reduced_ai' : 'full_human',
    };

    // Cache locally in localStorage so user-created uploads persist reliably
    try {
      const localVideos: VideoItem[] = JSON.parse(localStorage.getItem('valuvid_user_videos') || '[]');
      const filtered = localVideos.filter((v) => v.id !== videoId);
      localStorage.setItem('valuvid_user_videos', JSON.stringify([createdVideo, ...filtered]));
    } catch {}

    setVideos((prev) => [createdVideo, ...prev.filter((v) => v.id !== videoId)]);
    setFeedFilter('foryou');
    setCurrentVideoIndex(0);
    setActiveTab('feed');

    // Asynchronously persist to Supabase Database
    saveVideoToSupabase(createdVideo);
  }, [currentUser]);

  const updateVideo = useCallback(async (videoId: string, updates: Partial<VideoItem>): Promise<boolean> => {
    sounds.playLikePop();
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id === videoId) {
          return {
            ...v,
            ...updates,
          };
        }
        return v;
      })
    );

    const res = await updateVideoInSupabase(videoId, {
      title: updates.title,
      caption: updates.caption,
      hashtags: updates.hashtags,
      category: updates.category,
      unlockPriceGHS: updates.unlockPriceGHS,
    });

    if (res.success) {
      setShareToast('Video details updated in cloud! ✨');
    } else {
      setShareToast('Video updated locally');
    }
    return true;
  }, []);

  const deleteVideo = useCallback(async (videoId: string): Promise<boolean> => {
    markVideoAsDeleted(videoId);

    try {
      const localVideos: VideoItem[] = JSON.parse(localStorage.getItem('valuvid_user_videos') || '[]');
      const filtered = localVideos.filter((v) => v.id !== videoId);
      localStorage.setItem('valuvid_user_videos', JSON.stringify(filtered));
    } catch {}

    setVideos((prev) => prev.filter((v) => v.id !== videoId));

    await deleteVideoFromSupabase(videoId);
    setShareToast('Video permanently deleted 🗑️');
    return true;
  }, []);

  const shareVideoWithRewardLink = useCallback((video: VideoItem) => {
    incrementShareCount(video.id);
    openShareModal(video);
  }, [incrementShareCount, openShareModal]);

  const openAiDisclosureModal = useCallback((video: VideoItem) => {
    setSelectedAiDisclosureVideo(video);
  }, []);

  const closeAiDisclosureModal = useCallback(() => {
    setSelectedAiDisclosureVideo(null);
  }, []);

  const openValuSplitModal = useCallback((video: VideoItem) => {
    setSelectedValuSplitVideo(video);
  }, []);

  const closeValuSplitModal = useCallback(() => {
    setSelectedValuSplitVideo(null);
  }, []);

  const openCommunityGoalModal = useCallback((video: VideoItem) => {
    setSelectedCommunityGoalVideo(video);
  }, []);

  const closeCommunityGoalModal = useCallback(() => {
    setSelectedCommunityGoalVideo(null);
  }, []);

  const openSkillQuizModal = useCallback((video: VideoItem) => {
    setSelectedSkillQuizVideo(video);
  }, []);

  const closeSkillQuizModal = useCallback(() => {
    setSelectedSkillQuizVideo(null);
  }, []);

  const subscribePro = useCallback((tierName: string, priceGHS: number): boolean => {
    if (wallet.balanceGHS < priceGHS) {
      alert(`Insufficient balance (GHS ${wallet.balanceGHS.toFixed(2)}) to subscribe to ${tierName} (GHS ${priceGHS.toFixed(2)}). Please top up first!`);
      return false;
    }
    sounds.playSuccessPayout();
    setWallet((w) => {
      const nextGHS = Number((w.balanceGHS - priceGHS).toFixed(2));
      return {
        ...w,
        balanceGHS: nextGHS,
        balanceUSD: Number((nextGHS * GHS_TO_USD_RATE).toFixed(2)),
      };
    });
    setIsProMember(true);
    try {
      localStorage.setItem('valuvid_is_pro_member', 'true');
    } catch {}
    setFundingMetrics((m) => ({
      ...m,
      activeProSubscribers: m.activeProSubscribers + 1,
      totalEscrowFloatGHS: Number((m.totalEscrowFloatGHS + priceGHS).toFixed(2)),
    }));
    const newTx: TransactionItem = {
      id: `tx-pro-${Date.now()}`,
      type: 'content_unlock',
      title: `${tierName} Activated`,
      subtitle: 'Advanced analytics, priority 4K 60fps & monetization boost',
      amountGHS: -priceGHS,
      timestamp: 'Just now',
      status: 'completed',
      method: 'In-App Wallet',
      referenceId: `PRO-${Math.floor(10000 + Math.random() * 90000)}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
    recordTransactionToSupabase(newTx);
    return true;
  }, [wallet.balanceGHS]);

  const sponsorBounty = useCallback((title: string, sponsorName: string, poolGHS: number, category: string, paystackRef?: string) => {
    sounds.playCoinTip();
    const newBounty: BountyChallenge = {
      id: `bounty-${Date.now()}`,
      title,
      sponsor: sponsorName,
      sponsorLogo: '💼',
      rewardPoolGHS: poolGHS,
      rewardPoolUSD: Number((poolGHS * GHS_TO_USD_RATE).toFixed(0)),
      participantsCount: 0,
      submissionsCount: 0,
      daysRemaining: 14,
      category,
      description: `Sponsored challenge by ${sponsorName}. Submit authentic video reviews & creative tutorials to win from the upfront escrow reward pool!`,
      requirements: [
        'High quality vertical video demonstration',
        `Include sponsor tag #${title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`,
        'Must link creator profile for instant MoMo escrow payout',
      ],
      submissionTag: `#${title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}`,
      bannerColor: 'from-blue-600 via-cyan-600 to-amber-500',
    };
    setBounties((prev) => [newBounty, ...prev]);

    const escrowTx: TransactionItem = {
      id: `tx-escrow-${Date.now()}`,
      type: 'bounty_reward',
      title: `Bounty Escrow Funded (${sponsorName})`,
      subtitle: `Funded #${newBounty.submissionTag} via Paystack MoMo`,
      amountGHS: poolGHS,
      timestamp: 'Just now',
      status: 'completed',
      method: 'Paystack Escrow',
      referenceId: paystackRef || `ESC-${Math.floor(10000 + Math.random() * 90000)}`,
    };
    setTransactions((prev) => [escrowTx, ...prev]);
    recordTransactionToSupabase(escrowTx);
    supabase.from('bounties').insert([{
      id: newBounty.id,
      title: newBounty.title,
      sponsor: newBounty.sponsor,
      sponsor_logo: newBounty.sponsorLogo,
      reward_pool_ghs: newBounty.rewardPoolGHS,
      reward_pool_usd: newBounty.rewardPoolUSD,
      participants_count: 0,
      submissions_count: 0,
      days_remaining: 14,
      category: newBounty.category,
      is_active: true,
      created_at: new Date().toISOString()
    }]).then(() => {});

    setFundingMetrics((m) => ({
      ...m,
      sponsoredBountiesFundedGHS: Number((m.sponsoredBountiesFundedGHS + poolGHS).toFixed(2)),
      totalEscrowFloatGHS: Number((m.totalEscrowFloatGHS + poolGHS).toFixed(2)),
    }));
    setShowSponsorModal(false);
  }, []);

  const loginUser = useCallback(async (email: string, password: string) => {
    const res = await signInWithEmail(email, password);
    if (res.success && res.user) {
      setAuthUser(res.user);
      setIsLoggedIn(true);
      const meta = res.user.user_metadata || {};
      setCurrentUser((prev) => ({
        ...prev,
        id: res.user!.id,
        email: res.user!.email,
        name: meta.name || res.user!.email?.split('@')[0] || 'ValuVid Creator',
        username: meta.username || res.user!.email?.split('@')[0] || 'creator',
        avatar: meta.avatar || prev.avatar,
      }));
      setAuthModalOpen(false);
      setShareToast(`Welcome back, ${meta.name || 'Creator'}!`);
      sounds.playSuccessPayout();
      return { success: true };
    }
    return { success: false, error: res.error };
  }, []);

  const signupUser = useCallback(async (email: string, password: string, name: string, username: string, phone?: string) => {
    // 1. Multi-Layer Anti-Duplicate Validation:
    // Enforces 1 User = 1 Account via Phone Uniqueness, Device Fingerprint & Identity Binding
    const phoneToValidate = phone || '';
    const validation = validateNewRegistration({
      phone: phoneToValidate,
      email,
      username,
    });

    if (!validation.allowed) {
      return { success: false, error: validation.reason };
    }

    const res = await signUpWithEmail(email, password, name, username, phone);
    if (res.success) {
      const cleanUsername = (username.trim().replace(/^@/, '') || email.split('@')[0]).toLowerCase();
      const cleanName = name.trim() || 'ValuVid Creator';

      // Bind identity to persistent hardware & phone registry
      if (res.user) {
        recordNewRegistration({
          id: res.user.id,
          username: cleanUsername,
          phone: phoneToValidate,
          email,
        });
      }

      if (res.session && res.user) {
        setAuthUser(res.user);
        setIsLoggedIn(true);
        setCurrentUser((prev) => ({
          ...prev,
          id: res.user!.id,
          email: res.user!.email,
          name: cleanName,
          username: cleanUsername,
          avatar: DEFAULT_AVATAR,
        }));
        setAuthModalOpen(false);
        setShareToast(`Account created! Welcome to ValuVid 🚀`);
        sounds.playSuccessPayout();
        return { success: true };
      } else {
        return { 
          success: true, 
          requiresEmailConfirmation: true,
          error: 'Account created! If email confirmation is enabled in your Supabase dashboard, please check your email inbox to verify.' 
        };
      }
    }
    return { success: false, error: res.error };
  }, []);

  const updateUserProfile = useCallback(async (updates: { name?: string; username?: string; bio?: string; avatar?: string }) => {
    setCurrentUser((prev) => {
      const next = {
        ...prev,
        name: updates.name !== undefined ? updates.name : prev.name,
        username: updates.username !== undefined ? updates.username : prev.username,
        bio: updates.bio !== undefined ? updates.bio : prev.bio,
        avatar: updates.avatar !== undefined ? updates.avatar : prev.avatar,
      };
      try {
        localStorage.setItem('valuvid_custom_profile', JSON.stringify(next));
        localStorage.setItem('valuvid_user_profile', JSON.stringify(next));
      } catch {}
      return next;
    });

    // Also update creator information on their local uploaded videos
    setVideos((prev) =>
      prev.map((v) => {
        if (v.creator.id === currentUser.id || v.creator.username === currentUser.username) {
          return {
            ...v,
            creator: {
              ...v.creator,
              name: updates.name ?? v.creator.name,
              username: updates.username ?? v.creator.username,
              bio: updates.bio ?? v.creator.bio,
              avatar: updates.avatar ?? v.creator.avatar,
            },
          };
        }
        return v;
      })
    );

    try {
      const localVideos: VideoItem[] = JSON.parse(localStorage.getItem('valuvid_user_videos') || '[]');
      const updatedLocal = localVideos.map((v) => {
        if (v.creator.id === currentUser.id || v.creator.username === currentUser.username) {
          return {
            ...v,
            creator: {
              ...v.creator,
              name: updates.name ?? v.creator.name,
              username: updates.username ?? v.creator.username,
              bio: updates.bio ?? v.creator.bio,
              avatar: updates.avatar ?? v.creator.avatar,
            },
          };
        }
        return v;
      });
      localStorage.setItem('valuvid_user_videos', JSON.stringify(updatedLocal));
    } catch {}

    // Update in Supabase auth user_metadata if logged in
    try {
      await supabase.auth.updateUser({
        data: {
          ...(updates.name ? { name: updates.name } : {}),
          ...(updates.username ? { username: updates.username } : {}),
          ...(updates.bio ? { bio: updates.bio } : {}),
          ...(updates.avatar ? { avatar: updates.avatar } : {}),
        }
      });
    } catch {}
  }, [currentUser]);

  const logoutUser = useCallback(async () => {
    try {
      await signOutSupabase();
    } catch {}
    try {
      localStorage.removeItem('valuvid_auth_user');
      localStorage.removeItem('valuvid_is_logged_in');
      localStorage.removeItem('valuvid_user_profile');
      localStorage.removeItem('valuvid_custom_profile');
    } catch {}
    setAuthUser(null);
    setIsLoggedIn(false);
    setCurrentUser(INITIAL_USER);
    setShareToast('Signed out of account');
    sounds.playLikePop();
  }, []);

  const loginAsDemoUser = useCallback(() => {
    setCurrentUser({
      id: 'demo-creator-1',
      name: 'Emmanuel Osei',
      username: 'emmanuel_creator',
      email: 'emmanuel@valuvid.test',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      bio: 'Digital story-teller & tech creator based in Accra 🇬🇭. Building on ValuVid.',
      followers: 120,
      following: 34,
      likes: 540,
      totalTipsEarned: 0,
      verified: true,
      isHumanVerified: true,
      authenticityScore: 100,
      certificates: [],
    });
    setIsLoggedIn(true);
    setAuthModalOpen(false);
    setShareToast('Switched to Demo Creator Mode');
    sounds.playLikePop();
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        feedFilter,
        setFeedFilter,
        videos,
        setVideos,
        currentVideoIndex,
        setCurrentVideoIndex,
        currentUser,
        wallet,
        transactions,
        payoutMethods,
        bounties,
        comments,
        deviceMode,
        setDeviceMode,
        showSplash,
        setShowSplash,
        isFeedMuted,
        setIsFeedMuted,
        authModalOpen,
        setAuthModalOpen,
        authMode,
        setAuthMode,
        isLoggedIn,
        authUser,
        loginUser,
        signupUser,
        logoutUser,
        loginAsDemoUser,
        updateUserProfile,
        tipModalVideo,
        openTipModal,
        closeTipModal,
        cashoutDrawerOpen,
        openCashoutDrawer,
        closeCashoutDrawer,
        unlockPromptVideo,
        openUnlockPrompt,
        closeUnlockPrompt,
        analyticsVideo,
        openAnalytics,
        closeAnalytics,
        commentDrawerVideo,
        openCommentDrawer,
        closeCommentDrawer,
        shareModalVideo,
        openShareModal,
        closeShareModal,
        incrementShareCount,
        savedVideoIds,
        toggleSaveVideo,
        isSaved,
        saveModalVideo,
        openSaveModal,
        closeSaveModal,
        selectedAiDisclosureVideo,
        openAiDisclosureModal,
        closeAiDisclosureModal,
        selectedValuSplitVideo,
        openValuSplitModal,
        closeValuSplitModal,
        selectedCommunityGoalVideo,
        openCommunityGoalModal,
        closeCommunityGoalModal,
        selectedSkillQuizVideo,
        openSkillQuizModal,
        closeSkillQuizModal,
        humanTouchRatio,
        setHumanTouchRatio,
        shareToast,
        setShareToast,
        clearShareToast,
        showFundingModal,
        setShowFundingModal,
        showProModal,
        setShowProModal,
        showSponsorModal,
        setShowSponsorModal,
        showWinPoolModal,
        setShowWinPoolModal,
        showSettings,
        setShowSettings,
        isProMember,
        subscribePro,
        sponsorBounty,
        fundingMetrics,
        watchRewardProgress,
        totalMinutesWatched,
        rewardedVideoIds,
        claimWatchReward,
        isVideoRewarded,
        cashoutLimitInfo,
        theme,
        setTheme,
        toggleTheme,
        toggleLikeVideo,
        toggleFollowCreator,
        sendTip,
        unlockContent,
        processCashout,
        addFundsToWallet,
        addPayoutMethod,
        deletePayoutMethod,
        setDefaultPayoutMethod,
        addComment,
        publishNewVideo,
        updateVideo,
        deleteVideo,
        shareVideoWithRewardLink,
        isSupabaseConnected,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
