import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { 
  VideoItem, 
  BountyChallenge, 
  CommentItem, 
  TransactionItem, 
  PayoutMethodItem, 
  Creator, 
  ActiveTab,
  ProductItem,
  ShopOrder
} from '../types';
import { sounds } from '../utils/soundEffects';
import { 
  supabase, 
  saveVideoToSupabase, 
  updateVideoInSupabase,
  updateCreatorFollowersInSupabase,
  saveFollowRecordInSupabase,
  saveLikeRecordInSupabase,
  fetchUserLikedVideoIdsFromSupabase,
  fetchUserProfileFromSupabase,
  fetchFollowingListFromSupabase,
  fileToDataUrl,
  deleteVideoFromSupabase,
  markVideoAsDeleted,
  getDeletedVideoIds,
  fetchDeletedVideoIdsFromSupabase,
  fetchVideosFromSupabase, 
  recordTransactionToSupabase, 
  saveCommentToSupabase,
  testSupabaseConnection,
  signUpWithEmail,
  signInWithEmail,
  signOutSupabase,
  getCurrentSupabaseUser,
  fetchBountiesFromSupabase,
  fetchTransactionsFromSupabase,
  saveUserProfileToSupabase
} from '../services/supabaseClient';
import { App as CapApp } from '@capacitor/app';
import { saveMediaBlob, cacheLiveVideoUrl } from '../utils/mediaStorage';
import { 
  validateNewRegistration, 
  recordNewRegistration, 
  validatePayoutChannelExclusivity 
} from '../utils/deviceFingerprint';
import { recordKnownUser } from '../utils/userDirectory';
import { INITIAL_COMMUNITY_VIDEOS, getInitialFeedVideos } from '../data/communityVideos';

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  feedFilter: 'following' | 'foryou' | 'global' | 'fresh' | 'bounties' | 'ghana' | 'tech';
  setFeedFilter: (f: 'following' | 'foryou' | 'global' | 'fresh' | 'bounties' | 'ghana' | 'tech') => void;
  videos: VideoItem[];
  setVideos: React.Dispatch<React.SetStateAction<VideoItem[]>>;
  isVideosLoading: boolean;
  refreshVideosFromSupabase: () => void;
  currentVideoIndex: number;
  setCurrentVideoIndex: React.Dispatch<React.SetStateAction<number>>;
  discoverSearchQuery: string;
  setDiscoverSearchQuery: (query: string) => void;
  selectedCreatorProfile: Creator | null;
  openCreatorProfile: (creator: any) => void;
  closeCreatorProfile: () => void;
  playVideo: (video: VideoItem) => void;
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
  sponsorBounty: (title: string, sponsorName: string, poolGHS: number, category: string, paystackRef?: string, durationDays?: number) => void;
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

  // ValuShop E-Commerce Layer
  products: ProductItem[];
  orders: ShopOrder[];
  selectedProduct: ProductItem | null;
  isProductCheckoutOpen: boolean;
  openProductCheckout: (product: ProductItem) => void;
  closeProductCheckout: () => void;
  buyProduct: (orderData: {
    productId: string;
    productTitle: string;
    sellerUsername: string;
    amountGHS: number;
    platformFeeGHS: number;
    deliveryAddress: string;
    contactPhone: string;
    paymentMethod: string;
  }) => Promise<void>;
  confirmDelivery: (orderId: string) => Promise<void>;
  addProduct: (productData: Omit<ProductItem, 'id' | 'salesCount'>) => void;
  deleteProduct: (productId: string) => void;

  // Actions
  toggleLikeVideo: (videoId: string) => void;
  toggleFollowCreator: (creatorId: string) => void;
  sendTip: (videoId: string, amountGHS: number, message?: string) => boolean;
  unlockContent: (videoId: string) => boolean;
  processCashout: (methodId: string, amountGHS: number, customRef?: string) => boolean;
  addFundsToWallet: (amountGHS: number, referenceId?: string, paymentMethod?: string) => void;
  addPayoutMethod: (method: Omit<PayoutMethodItem, 'id'>) => string;
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

const DEFAULT_AVATAR = '/default-avatar.svg';

const getStoredProfile = (): Creator | null => {
  try {
    const raw = localStorage.getItem('valuvid_user_profile') || localStorage.getItem('valuvid_custom_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.followers !== 'number' || parsed.followers < 0) {
        parsed.followers = 0;
      }
      if (typeof parsed.following !== 'number' || parsed.following < 0) {
        parsed.following = 0;
      }
      if (typeof parsed.likes !== 'number' || parsed.likes < 0) {
        parsed.likes = 0;
      }
      if (typeof parsed.totalTipsEarned !== 'number' || parsed.totalTipsEarned < 0) {
        parsed.totalTipsEarned = 0;
      }
      if (parsed.avatar && parsed.avatar.includes('unsplash.com')) {
        parsed.avatar = DEFAULT_AVATAR;
      }
      return parsed;
    }
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
  if (saved?.avatar && saved.avatar !== '/default-avatar.jpg' && !saved.avatar.includes('/default-avatar.jpg') && !saved.avatar.includes('unsplash.com')) return saved.avatar;
  if (metaAvatar && !metaAvatar.includes('dicebear.com') && !metaAvatar.includes('unsplash.com')) return metaAvatar;
  return DEFAULT_AVATAR;
};

const INITIAL_USER: Creator = (() => {
  const stored = getStoredProfile();
  if (stored && stored.id) {
    return {
      ...stored,
      followers: Math.max(0, stored.followers || 0),
      following: Math.max(0, stored.following || 0),
      likes: Math.max(0, stored.likes || 0),
      totalTipsEarned: Math.max(0, stored.totalTipsEarned || 0)
    };
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

const INITIAL_SHOP_PRODUCTS: ProductItem[] = [];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('feed');
  const [feedFilter, setFeedFilter] = useState<'following' | 'foryou' | 'global' | 'fresh' | 'bounties' | 'ghana' | 'tech'>('foryou');
  const [videos, setVideos] = useState<VideoItem[]>(() => getInitialFeedVideos());
  const [isVideosLoading, setIsVideosLoading] = useState<boolean>(() => {
    try {
      const initial = getInitialFeedVideos();
      return initial.length === 0;
    } catch {
      return true;
    }
  });
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [discoverSearchQuery, setDiscoverSearchQuery] = useState('');
  const [selectedCreatorProfile, setSelectedCreatorProfile] = useState<Creator | null>(null);

  const openCreatorProfile = useCallback((creator: any) => {
    setSelectedCreatorProfile(creator);
  }, []);

  const closeCreatorProfile = useCallback(() => {
    setSelectedCreatorProfile(null);
  }, []);

  const playVideo = useCallback((targetVideo: VideoItem) => {
    if (!targetVideo) return;
    try {
      sounds.playLikePop();
    } catch {}
    setFeedFilter('foryou');
    setSelectedCreatorProfile(null);

    setVideos((prev) => {
      const existingIdx = prev.findIndex((v) => v.id === targetVideo.id);
      if (existingIdx !== -1) {
        setCurrentVideoIndex(existingIdx);
        return prev;
      }
      setCurrentVideoIndex(0);
      return [targetVideo, ...prev];
    });

    setActiveTab('feed');
  }, [setFeedFilter, setVideos, setCurrentVideoIndex, setActiveTab]);

  // ValuShop E-Commerce Layer State (Real Products Only)
  const [products, setProducts] = useState<ProductItem[]>(() => {
    try {
      const stored = localStorage.getItem('valuvid_shop_products');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Cleanse legacy mock products
          return parsed.filter(
            (p: ProductItem) =>
              p &&
              p.id &&
              !p.id.startsWith('prod-kausar') &&
              !p.id.startsWith('prod-kwesi') &&
              !p.id.startsWith('prod-valuvid')
          );
        }
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('valuvid_shop_products', JSON.stringify(products));
    } catch {}
  }, [products]);

  const [orders, setOrders] = useState<ShopOrder[]>(() => {
    try {
      const stored = localStorage.getItem('valuvid_shop_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('valuvid_shop_orders', JSON.stringify(orders));
    } catch {}
  }, [orders]);

  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [isProductCheckoutOpen, setIsProductCheckoutOpen] = useState(false);

  const openProductCheckout = useCallback((product: ProductItem) => {
    setSelectedProduct(product);
    setIsProductCheckoutOpen(true);
  }, []);

  const closeProductCheckout = useCallback(() => {
    setIsProductCheckoutOpen(false);
    setSelectedProduct(null);
  }, []);

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
          return parsed.filter(
            (tx) =>
              tx.id &&
              !tx.id.startsWith('tx-10') &&
              !tx.id.startsWith('tx-mock') &&
              !tx.subtitle?.includes('@kwame_d') &&
              !tx.subtitle?.includes('FinTech in Accra')
          );
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

  const buyProduct = useCallback(async (orderData: {
    productId: string;
    productTitle: string;
    sellerUsername: string;
    amountGHS: number;
    platformFeeGHS: number;
    deliveryAddress: string;
    contactPhone: string;
    paymentMethod: string;
  }) => {
    const orderId = `order-${Date.now()}`;
    const newOrder: ShopOrder = {
      id: orderId,
      productId: orderData.productId,
      productTitle: orderData.productTitle,
      sellerUsername: orderData.sellerUsername,
      buyerUsername: currentUser?.username || 'me',
      amountGHS: orderData.amountGHS,
      platformFeeGHS: orderData.platformFeeGHS,
      status: 'escrow_locked',
      createdAt: new Date().toISOString(),
      deliveryAddress: orderData.deliveryAddress,
      contactPhone: orderData.contactPhone,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // If paid using ValuWallet balance, deduct
    if (orderData.paymentMethod === 'In-App Wallet') {
      setWallet((prev) => {
        const nextBal = Math.max(0, prev.balanceGHS - orderData.amountGHS);
        return {
          ...prev,
          balanceGHS: Number(nextBal.toFixed(2)),
          balanceUSD: Number((nextBal * GHS_TO_USD_RATE).toFixed(2)),
        };
      });
    }

    // Record buyer transaction in transaction ledger
    const newTx: TransactionItem = {
      id: `tx-order-${Date.now()}`,
      type: 'product_purchase',
      title: `ValuShop: ${orderData.productTitle}`,
      subtitle: `4% Fee (GHS ${orderData.platformFeeGHS.toFixed(2)}) • Escrow Locked`,
      amountGHS: -orderData.amountGHS,
      timestamp: new Date().toISOString(),
      status: 'completed',
      method: orderData.paymentMethod,
      referenceId: orderId,
    };

    setTransactions((prev) => [newTx, ...prev]);
    sounds.playCashOut();
  }, [currentUser]);

  const confirmDelivery = useCallback(async (orderId: string) => {
    let targetOrder: ShopOrder | undefined;

    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          targetOrder = ord;
          return { ...ord, status: 'delivered' };
        }
        return ord;
      })
    );

    // If current user is the seller, release escrow funds (net earnings after 4% platform fee)
    if (targetOrder && targetOrder.sellerUsername === currentUser?.username) {
      const netSellerEarnings = Number((targetOrder.amountGHS - targetOrder.platformFeeGHS).toFixed(2));
      setWallet((prev) => {
        const nextBal = prev.balanceGHS + netSellerEarnings;
        return {
          ...prev,
          balanceGHS: Number(nextBal.toFixed(2)),
          balanceUSD: Number((nextBal * GHS_TO_USD_RATE).toFixed(2)),
        };
      });

      const sellerTx: TransactionItem = {
        id: `tx-sale-released-${Date.now()}`,
        type: 'product_sale',
        title: `ValuShop Sale: ${targetOrder.productTitle}`,
        subtitle: `Escrow Released (Net: GHS ${netSellerEarnings.toFixed(2)})`,
        amountGHS: netSellerEarnings,
        timestamp: new Date().toISOString(),
        status: 'completed',
        method: 'ValuWallet Escrow',
        referenceId: orderId,
      };
      setTransactions((prev) => [sellerTx, ...prev]);
    }
    sounds.playCoinReward();
  }, [currentUser]);

  const addProduct = useCallback((productData: Omit<ProductItem, 'id' | 'salesCount'>) => {
    const newProd: ProductItem = {
      ...productData,
      id: `prod-user-${Date.now()}`,
      salesCount: 0,
    };
    setProducts((prev) => [newProd, ...prev]);
    sounds.playUpload();
  }, []);

  const deleteProduct = useCallback((productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    sounds.playLikePop();
  }, []);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethodItem[]>(() => {
    try {
      const stored = localStorage.getItem('valuvid_payout_methods');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const realMethods = parsed.filter((m) => m.id !== 'pm-mtn-default');
          if (realMethods.length > 0) return realMethods;
        }
      }
      // Auto-recover payout number from persistent storage if available so it never disappears
      const savedPhone = localStorage.getItem('valuvid_user_payout_phone') || localStorage.getItem('valuvid_saved_phone');
      if (savedPhone && savedPhone.replace(/[^\d]/g, '').length >= 9) {
        const clean = savedPhone.trim();
        const isTelecel = clean.startsWith('020') || clean.startsWith('050');
        const isBank = clean.length > 11 && !clean.startsWith('0');
        return [{
          id: `pm-saved-primary`,
          type: isBank ? 'bank' : isTelecel ? 'telecel_cash' : 'mtn_momo',
          name: isBank ? 'Ghana Bank Account' : isTelecel ? 'Telecel Cash' : 'MTN Mobile Money',
          accountNumber: clean,
          accountHolder: 'ValuVid Creator',
          isDefault: true,
          iconType: isBank ? 'bank' : 'momo'
        }];
      }
    } catch {}
    return [];
  });

  // Permanently sync payoutMethods across app sessions & restarts
  useEffect(() => {
    try {
      localStorage.setItem('valuvid_payout_methods', JSON.stringify(payoutMethods));
      const def = payoutMethods.find((m) => m.isDefault) || payoutMethods[0];
      if (def?.accountNumber) {
        localStorage.setItem('valuvid_user_payout_phone', def.accountNumber);
      }
    } catch (e) {
      console.warn('[Storage] Failed to save payout methods:', e);
    }
  }, [payoutMethods]);
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
    fetchDeletedVideoIdsFromSupabase().catch(() => {});
    fetchVideosFromSupabase().then((dbVideos) => {
      if (dbVideos !== null) {
        try {
          const deletedIds = getDeletedVideoIds();
          const rawLocalVideos: VideoItem[] = JSON.parse(localStorage.getItem('valuvid_user_videos') || '[]');
          const localVideos = rawLocalVideos.filter((v) => 
            !deletedIds.includes(v.id) &&
            v.id !== 'vid-user-1' && 
            v.id !== 'vid-masterclass-1' && 
            v.id !== 'vid-user-1793762676066' &&
            v.id !== 'vid-user-1793960000000' &&
            v.id !== 'test_follow_record' &&
            !v.id.startsWith('vid-sample') && 
            !v.id.startsWith('test') &&
            !v.id.startsWith('test_') &&
            !(v.title || '').toLowerCase().includes('test follow') &&
            !(v.title || '').includes('[DELETED]') &&
            v.caption !== '[DELETED]' &&
            v.caption !== '[FOLLOW_RECORD]' &&
            v.caption !== '[LIKE_RECORD]' &&
            (v.category as string) !== 'deleted' &&
            (v.category as string) !== 'follow_record' &&
            (v.category as string) !== 'like_record' &&
            !v.videoUrl?.includes('/videos/sample')
          );
          const followed: string[] = JSON.parse(localStorage.getItem('valuvid_followed_creators') || '[]');
          const likedIds: string[] = JSON.parse(localStorage.getItem('valuvid_liked_video_ids') || '[]');

          // Master feed merge: User uploads first (newest to oldest), cloud DB videos, then pre-seeded community videos
          const cleanLocal = localVideos.filter(
            (v) => (Boolean(v.videoUrl) || Boolean(v.thumbnailUrl)) && 
              !deletedIds.includes(v.id) &&
              v.caption !== '[DELETED]' && 
              !(v.title || '').includes('[DELETED]') &&
              v.caption !== '[FOLLOW_RECORD]' && 
              v.caption !== '[LIKE_RECORD]' && 
              (v.category as string) !== 'deleted' && 
              (v.category as string) !== 'follow_record' && 
              (v.category as string) !== 'like_record' && 
              v.id !== 'vid-user-1793762676066' && 
              v.id !== 'vid-user-1793960000000' && 
              v.id !== 'test_follow_record' &&
              !v.id.startsWith('test') &&
              !v.id.startsWith('test_') &&
              !(v.title || '').toLowerCase().includes('test follow')
          );
          cleanLocal.sort((a, b) => {
            const timeA = parseInt(a.id.replace('vid-user-', '')) || 0;
            const timeB = parseInt(b.id.replace('vid-user-', '')) || 0;
            return timeB - timeA;
          });

          const cleanDb = (dbVideos || []).filter(
            (v) => 
              v &&
              !deletedIds.includes(v.id) &&
              v.id !== 'vid-user-1793762676066' && 
              v.id !== 'vid-user-1793960000000' && 
              v.id !== 'test_follow_record' &&
              !v.id.startsWith('test') &&
              !v.id.startsWith('test_') &&
              !(v.title || '').toLowerCase().includes('test follow') &&
              !(v.title || '').includes('[DELETED]') &&
              v.caption !== '[DELETED]' &&
              v.caption !== '[FOLLOW_RECORD]' &&
              v.caption !== '[LIKE_RECORD]' &&
              (v.category as string) !== 'deleted' &&
              (v.category as string) !== 'follow_record' &&
              (v.category as string) !== 'like_record'
          );

          // Synchronize local user uploads with latest cloud stats (likes, views, tips, followers)
          const dbMap = new Map<string, VideoItem>();
          cleanDb.forEach((v) => dbMap.set(v.id, v));

          const updatedLocal = cleanLocal.map((lv) => {
            const remote = dbMap.get(lv.id);
            if (remote) {
              return {
                ...lv,
                stats: {
                  ...lv.stats,
                  ...remote.stats,
                  likes: remote.stats?.likes ?? lv.stats?.likes ?? 0,
                  views: Math.max(lv.stats?.views || 1, remote.stats?.views || 1),
                  comments: remote.stats?.comments ?? lv.stats?.comments ?? 0,
                  shares: remote.stats?.shares ?? lv.stats?.shares ?? 0,
                  tipsTotalGHS: remote.stats?.tipsTotalGHS ?? lv.stats?.tipsTotalGHS ?? 0,
                  tipsCount: remote.stats?.tipsCount ?? lv.stats?.tipsCount ?? 0,
                },
                creator: {
                  ...lv.creator,
                  followers: remote.creator?.followers ?? lv.creator?.followers ?? 0,
                  following: remote.creator?.following ?? lv.creator?.following ?? 0,
                }
              };
            }
            return lv;
          });

          try {
            localStorage.setItem('valuvid_user_videos', JSON.stringify(updatedLocal));
          } catch {}

          const masterMap = new Map<string, VideoItem>();
          // Cloud DB is the authoritative source for published feed
          cleanDb.forEach((v) => masterMap.set(v.id, v));
          // Overlay local uploads (preserving fresh local media stream URLs)
          updatedLocal.forEach((v) => {
            if (masterMap.has(v.id)) {
              const existing = masterMap.get(v.id)!;
              masterMap.set(v.id, {
                ...existing,
                videoUrl: v.videoUrl || existing.videoUrl,
                thumbnailUrl: v.thumbnailUrl || existing.thumbnailUrl,
              });
            } else {
              masterMap.set(v.id, v);
            }
          });
          INITIAL_COMMUNITY_VIDEOS.forEach((v) => {
            if (!masterMap.has(v.id)) masterMap.set(v.id, v);
          });

          const combined = Array.from(masterMap.values());

          // Save to local cache for 0ms instant launch on subsequent visits
          try {
            localStorage.setItem('valuvid_cached_feed_videos', JSON.stringify(combined.slice(0, 30)));
          } catch {}

          const followedNormalized = new Set(
            followed.map((id) => id.toLowerCase().trim().replace(/^@/, ''))
          );

          setVideos(
            combined.map((v) => {
              const creatorUsername = (v.creator?.username || '').toLowerCase().replace(/^@/, '');
              const creatorId = (v.creator?.id || '').toLowerCase();
              const isFollowing =
                followedNormalized.has(creatorUsername) ||
                (creatorId ? followedNormalized.has(creatorId) : false) ||
                Boolean(v.creator?.isFollowing);

              const cleanFollowers = typeof v.creator?.followers === 'number'
                ? Math.max(0, v.creator.followers)
                : 0;
              const cleanFollowing = typeof v.creator?.following === 'number'
                ? Math.max(0, v.creator.following)
                : 0;

              const isMockTag =
                v.productTag &&
                (v.productTag.id === 'prod-kwesi-drumkit' ||
                  v.productTag.title?.toLowerCase().includes('drum kit') ||
                  v.productTag.title?.toLowerCase().includes('afro beats'));
              const cleanProductTag = isMockTag ? undefined : v.productTag;

              const currentLikes = typeof v.stats?.likes === 'number' ? Math.max(0, v.stats.likes) : 0;
              const currentTips = typeof v.stats?.tipsTotalGHS === 'number' ? Math.max(0, v.stats.tipsTotalGHS) : 0;
              const currentShares = typeof v.stats?.shares === 'number' ? Math.max(0, v.stats.shares) : 0;
              const currentComments = typeof v.stats?.comments === 'number' ? Math.max(0, v.stats.comments) : (v.stats?.commentsList?.length ?? 0);

              return {
                ...v,
                productTag: cleanProductTag,
                isLiked: likedIds.includes(v.id) || !!v.isLiked,
                creator: {
                  ...v.creator,
                  followers: cleanFollowers,
                  following: cleanFollowing,
                  isFollowing,
                },
                stats: {
                  likes: currentLikes,
                  views: Math.max(1, v.stats?.views ?? 1),
                  shares: currentShares,
                  comments: currentComments,
                  tipsCount: typeof v.stats?.tipsCount === 'number' ? Math.max(0, v.stats.tipsCount) : 0,
                  tipsTotalGHS: currentTips,
                  commentsList: Array.isArray(v.stats?.commentsList) ? v.stats.commentsList : [],
                },
              };
            })
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

        // Set loading false once videos are fetched
        setIsVideosLoading(false);

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
    }).catch(() => {}).finally(() => {
      setIsVideosLoading(false);
    });
  }, []);

  const handleSetActiveTab = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'feed' || tab === 'profile') {
      refreshVideosFromSupabase();
      if (currentUser?.username && currentUser.username !== 'creator') {
        fetchUserProfileFromSupabase(currentUser.username).then((p) => {
          if (p) {
            setCurrentUser((prev) => ({
              ...prev,
              followers: p.followers,
              following: p.following,
              likes: p.likes,
            }));
          }
        }).catch(() => {});
      }
    }
  }, [refreshVideosFromSupabase, currentUser?.username]);

  // Supabase Backend Connectivity, Real-time Data Sync & Auth Session
  useEffect(() => {
    // Immediately load initial feed with clean state
    try {
      if (typeof window !== 'undefined' && localStorage.getItem('valuvid_clean_community_v5') !== 'true') {
        localStorage.removeItem('valuvid_user_videos');
        localStorage.removeItem('valuvid_cached_feed_videos');
        localStorage.setItem('valuvid_clean_community_v5', 'true');
      }
      const initialFeed = getInitialFeedVideos(currentUser?.username);
      setVideos(initialFeed);
      if (initialFeed.length > 0) {
        setIsVideosLoading(false);
      }
    } catch {}

    // Safety timeout: ensure loading screen resolves within 3.5s even on slow 2G/offline
    const safetyTimer = setTimeout(() => {
      setIsVideosLoading(false);
    }, 3500);

    testSupabaseConnection().then(({ connected }) => {
      setIsSupabaseConnected(connected);
      if (connected) {
        fetchDeletedVideoIdsFromSupabase().then(() => {
          refreshVideosFromSupabase();
        }).catch(() => {
          refreshVideosFromSupabase();
        });

        // 2. Fetch live brand bounties from Supabase
        fetchBountiesFromSupabase().then((dbBounties) => {
          if (dbBounties && dbBounties.length > 0) {
            setBounties(dbBounties);
          }
        });

        // 3. Fetch real transactions from Supabase (Scoped strictly to current authenticated user)
        const currentUserId = authUser?.id || (currentUser?.id && currentUser.id !== 'user_current' ? currentUser.id : undefined);
        if (currentUserId && isLoggedIn) {
          fetchTransactionsFromSupabase(currentUserId).then((dbTxs) => {
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
      }
    });

    // Helper to sync currentUser stats from Supabase
    const syncUserStats = (userHandle: string) => {
      if (!userHandle || userHandle === 'creator') return;
      fetchUserProfileFromSupabase(userHandle).then((profile) => {
        if (profile) {
          setCurrentUser((prev) => {
            const updated = {
              ...prev,
              followers: profile.followers,
              following: profile.following,
              likes: profile.likes,
            };
            try {
              localStorage.setItem('valuvid_user_profile', JSON.stringify(updated));
              localStorage.setItem('valuvid_custom_profile', JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      }).catch(() => {});
    };

    // Check existing Supabase session (online & offline persistent session)
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
            following: Math.max(0, custom?.following || 0),
            followers: Math.max(0, custom?.followers || 0),
            likes: Math.max(0, custom?.likes || 0),
          };
          try {
            localStorage.setItem('valuvid_user_profile', JSON.stringify(updated));
            localStorage.setItem('valuvid_custom_profile', JSON.stringify(updated));
            localStorage.setItem('valuvid_is_logged_in', 'true');
            localStorage.setItem('valuvid_auth_user', JSON.stringify(session.user));
          } catch {}
          return updated;
        });
        syncUserStats(userHandle);
        refreshVideosFromSupabase();
      } else {
        // If Supabase session is temporarily missing (e.g. offline or starting up)
        // BUT user has stored credentials in localStorage, ALWAYS preserve them!
        const storedIsLoggedIn = getStoredIsLoggedIn();
        const storedUser = getStoredAuthUser();
        const storedProfile = getStoredProfile();
        if (storedIsLoggedIn && storedProfile && storedProfile.username) {
          setIsLoggedIn(true);
          if (storedUser) setAuthUser(storedUser);
          setCurrentUser(storedProfile);
          syncUserStats(storedProfile.username);
        }
      }
    }).catch((err) => {
      console.warn('[Supabase Auth] Offline / using cached local credentials:', err);
      // Offline fallback: keep user logged in with local profile
      const storedIsLoggedIn = getStoredIsLoggedIn();
      const storedUser = getStoredAuthUser();
      const storedProfile = getStoredProfile();
      if (storedIsLoggedIn && storedProfile && storedProfile.username) {
        setIsLoggedIn(true);
        if (storedUser) setAuthUser(storedUser);
        setCurrentUser(storedProfile);
      }
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
            following: Math.max(0, custom?.following || 0),
            followers: Math.max(0, custom?.followers || 0),
            likes: Math.max(0, custom?.likes || 0),
          };
          try {
            localStorage.setItem('valuvid_user_profile', JSON.stringify(updated));
            localStorage.setItem('valuvid_custom_profile', JSON.stringify(updated));
            localStorage.setItem('valuvid_is_logged_in', 'true');
            localStorage.setItem('valuvid_auth_user', JSON.stringify(session.user));
          } catch {}
          return updated;
        });
        syncUserStats(userHandle);
        refreshVideosFromSupabase();
      }
      // Never wipe persistent session on spontaneous background sign out events.
      // Deliberate user sign out is handled exclusively through logoutUser().
    });

    // Live Supabase Realtime synchronization for likes, comments, and follower updates
    const realtimeChannel = supabase
      .channel('valuvid-live-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'videos' },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedRow: any = payload.new;
            if (
              updatedRow.category !== 'user_registry' &&
              updatedRow.category !== 'follow_record' &&
              updatedRow.category !== 'like_record'
            ) {
              setVideos((prev) =>
                prev.map((v) => {
                  if (v.id === updatedRow.id) {
                    const newStats = updatedRow.stats || v.stats;
                    const newLikes = typeof newStats.likes === 'number' ? newStats.likes : v.stats.likes;
                    return {
                      ...v,
                      stats: {
                        ...v.stats,
                        ...newStats,
                        likes: newLikes,
                      },
                      creator: {
                        ...v.creator,
                        followers: typeof updatedRow.creator_data?.followers === 'number'
                          ? updatedRow.creator_data.followers
                          : v.creator.followers,
                      },
                    };
                  }
                  return v;
                })
              );

              // Keep local user video stats in sync
              try {
                const localRaw = localStorage.getItem('valuvid_user_videos');
                if (localRaw) {
                  const localVideos: VideoItem[] = JSON.parse(localRaw);
                  const updatedLocal = localVideos.map((lv) =>
                    lv.id === updatedRow.id
                      ? {
                          ...lv,
                          stats: {
                            ...lv.stats,
                            ...(updatedRow.stats || {}),
                          },
                        }
                      : lv
                  );
                  localStorage.setItem('valuvid_user_videos', JSON.stringify(updatedLocal));
                }
              } catch {}
            } else if (updatedRow.category === 'user_registry' || updatedRow.category === 'follow_record') {
              // User registry / follow change - re-sync
              const cur = getStoredProfile();
              if (cur?.username) syncUserStats(cur.username);
            }
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            const row: any = payload.new || payload.old;
            if (row && (row.category === 'follow_record' || row.category === 'like_record')) {
              const cur = getStoredProfile();
              if (cur?.username) syncUserStats(cur.username);
              refreshVideosFromSupabase();
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(realtimeChannel);
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
  // - Free accounts: 1 withdrawal every 30 days (once a month)
  // - Pro subscribed creators: 2 withdrawals every 7 days (twice a week)
  const cashoutLimitInfo = useMemo(() => {
    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const periodMs = isProMember ? SEVEN_DAYS_MS : THIRTY_DAYS_MS;
    const maxPerPeriod = isProMember ? 2 : 1;
    const recent = cashoutTimestamps.filter((ts) => (now - ts) < periodMs);
    const usedInPeriod = recent.length;
    const remainingInPeriod = Math.max(0, maxPerPeriod - usedInPeriod);
    const canCashout = remainingInPeriod > 0 && wallet.balanceGHS >= 50.00;

    let nextAvailableDate: Date | null = null;
    let reason: string | undefined;

    if (remainingInPeriod === 0) {
      const oldestTs = Math.min(...recent);
      nextAvailableDate = new Date(oldestTs + periodMs);
      reason = isProMember
        ? 'Weekly withdrawal limit of 2 cashouts reached.'
        : 'Monthly withdrawal limit (1 cashout per 30 days for Free tier accounts) reached. Upgrade to Pro for expedited weekly withdrawals.';
    } else if (wallet.balanceGHS < 50.00) {
      reason = `Minimum withdrawal threshold is GHS 50.00. Current balance: GHS ${wallet.balanceGHS.toFixed(2)}`;
    }

    return {
      minThresholdGHS: 50.00,
      maxPerWeek: maxPerPeriod,
      usedThisWeek: usedInPeriod,
      remainingThisWeek: remainingInPeriod,
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
    // Prevent creators from liking their own content if authenticated or distinctly identified
    const targetVideo = videos.find((v) => v.id === videoId);
    if (targetVideo) {
      const isOwner = Boolean(
        (authUser?.id && targetVideo.creator?.id && authUser.id === targetVideo.creator.id) ||
        (authUser?.email && targetVideo.creator?.email && authUser.email.toLowerCase() === targetVideo.creator.email.toLowerCase()) ||
        (currentUser?.id && targetVideo.creator?.id && currentUser.id === targetVideo.creator.id && currentUser.id !== 'user_current' && currentUser.id !== 'creator') ||
        (currentUser?.username && targetVideo.creator?.username && currentUser.username.toLowerCase() === targetVideo.creator.username.toLowerCase() && currentUser.username.toLowerCase() !== 'creator')
      );
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

          // 4. Persist to Supabase Database with unique user like record
          const userKey = authUser?.id || currentUser?.username || currentUser?.id || 'guest';
          saveLikeRecordInSupabase(userKey, videoId, isLiked, nextLikes);

          return updatedVideo;
        }
        return v;
      })
    );
  }, [videos, currentUser, authUser]);

  const toggleFollowCreator = useCallback((creatorIdOrUsername: string) => {
    if (!creatorIdOrUsername) return;
    sounds.playLikePop();

    // 1. Resolve canonical creator info from current videos or known users
    const cleanKey = creatorIdOrUsername.trim().toLowerCase().replace(/^@/, '');
    const matchedVideo = videos.find(
      (v) =>
        (v.creator?.username && v.creator.username.toLowerCase().replace(/^@/, '') === cleanKey) ||
        (v.creator?.id && v.creator.id.toLowerCase() === cleanKey)
    );

    const targetUsername = matchedVideo?.creator?.username?.toLowerCase().replace(/^@/, '') || cleanKey;
    const targetId = (matchedVideo?.creator?.id || creatorIdOrUsername).toLowerCase();

    // Prevent user from following themselves
    const myUsername = (currentUser?.username || '').toLowerCase().replace(/^@/, '');
    const myId = (currentUser?.id || '').toLowerCase();
    const isSelf = Boolean(
      (myUsername && myUsername !== 'creator' && targetUsername === myUsername) ||
      (myId && myId !== 'user_current' && myId !== 'creator' && (targetId === myId || targetUsername === myId))
    );
    if (isSelf) {
      setShareToast("You cannot follow your own account 😄");
      return;
    }

    // 2. Read existing followed identifiers
    let followedList: string[] = [];
    try {
      followedList = JSON.parse(localStorage.getItem('valuvid_followed_creators') || '[]');
    } catch {
      followedList = [];
    }

    // Strict single-follow check: check if target is already followed
    const isCurrentlyFollowing = followedList.some((item) => {
      const clean = item.toLowerCase().trim().replace(/^@/, '');
      return clean === targetUsername || clean === targetId;
    });

    const willFollow = !isCurrentlyFollowing;
    const delta = willFollow ? 1 : -1;

    // Filter out target from existing followed list to ensure clean toggle
    let nextFollowed = followedList.filter((item) => {
      const clean = item.toLowerCase().trim().replace(/^@/, '');
      return clean !== targetUsername && clean !== targetId;
    });

    // If following, add canonical username and target ID (guaranteed only ONCE)
    if (willFollow) {
      nextFollowed.push(targetUsername);
      if (targetId && targetId !== targetUsername) {
        nextFollowed.push(targetId);
      }
    }

    try {
      localStorage.setItem('valuvid_followed_creators', JSON.stringify(nextFollowed));
    } catch {}

    // 3. Calculate EXACT real following count for currentUser (unique creators followed)
    const uniqueFollowedUsernames = Array.from(
      new Set(
        nextFollowed
          .map((x) => x.toLowerCase().trim().replace(/^@/, ''))
          .filter((x) => x && x !== myUsername && x !== myId)
      )
    );
    const realFollowingCount = uniqueFollowedUsernames.length;

    setCurrentUser((prev) => {
      const updated = {
        ...prev,
        following: realFollowingCount,
      };
      try {
        localStorage.setItem('valuvid_user_profile', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // 4. Update videos state to reflect new following status and follower count across feed
    setVideos((prev) =>
      prev.map((v) => {
        const cUser = (v.creator?.username || '').toLowerCase().replace(/^@/, '');
        const cId = (v.creator?.id || '').toLowerCase();
        if (cUser === targetUsername || cId === targetId || cId === targetUsername) {
          const currentFollowers = typeof v.creator?.followers === 'number'
            ? Math.max(0, v.creator.followers)
            : 0;
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

    // 5. Toast feedback
    const displayTarget = matchedVideo?.creator?.username || targetUsername;
    setShareToast(willFollow ? `Now following @${displayTarget}! 🎉` : `Unfollowed @${displayTarget}`);

    // 6. Persist follower change to Supabase with dedicated follow record
    saveFollowRecordInSupabase(myUsername || myId || 'user', targetUsername, willFollow);
  }, [videos, currentUser]);

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

    // 3. Withdrawal frequency limits (1x/month for Free accounts, 2x/week for Subscribed Pro)
    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const periodMs = isProMember ? SEVEN_DAYS_MS : THIRTY_DAYS_MS;
    const maxPerPeriod = isProMember ? 2 : 1;
    const recent = cashoutTimestamps.filter((ts) => (now - ts) < periodMs);

    if (recent.length >= maxPerPeriod) {
      const oldestTs = Math.min(...recent);
      const nextTime = new Date(oldestTs + periodMs);
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
          : `Monthly withdrawal limit reached (1 withdrawal per 30 days for Free tier accounts).\n\nYour next withdrawal window opens on: ${formattedDate}.\n\nUpgrade to ValuVid Pro to withdraw anytime weekly!`
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

    // Tier-based liquidity handling: Free creators queue into a safe 24-48h batch payout window ('pending'),
    // while Pro Creator Tier members get instant expedited priority rails ('completed')
    const isPendingQueue = !isProMember;
    const txStatus: 'pending' | 'completed' = isPendingQueue ? 'pending' : 'completed';

    const newTx: TransactionItem = {
      id: `tx-cashout-${Date.now()}`,
      type: 'cashout',
      title: isPendingQueue
        ? `Cashout to ${method?.name || 'Mobile Money'} (Processing)`
        : `Instant Cashout to ${method?.name || 'Mobile Money'}`,
      subtitle: isPendingQueue
        ? `Scheduled Batch Queue (Within 24-48 Hours) • To ${method?.accountNumber || 'Primary Channel'}`
        : `Dispatched to ${method?.accountNumber || 'Primary Channel'} (${method?.accountHolder || 'User'})`,
      amountGHS: -amountGHS,
      timestamp: 'Just now',
      status: txStatus,
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

  // Automatic fulfillment of pending cashouts once liquidity float/funds replenish
  useEffect(() => {
    const hasPending = transactions.some((t) => t.type === 'cashout' && t.status === 'pending');
    if (!hasPending) return;

    // After batch window or float available, complete pending cashouts automatically
    const timer = setTimeout(() => {
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.type === 'cashout' && t.status === 'pending') {
            return {
              ...t,
              status: 'completed',
              title: t.title.replace(' (Processing)', ' (Completed)'),
              subtitle: t.subtitle.replace('Scheduled Batch Queue (Within 24-48 Hours)', 'Dispatched via Batch Escrow Float'),
            };
          }
          return t;
        })
      );
    }, 45000);

    return () => clearTimeout(timer);
  }, [transactions]);

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

  const addPayoutMethod = useCallback((method: Omit<PayoutMethodItem, 'id'>): string => {
    // Validate payout channel exclusivity (1 MoMo/Bank number = 1 Creator)
    const cleanNum = method.accountNumber.replace(/[^\d+]/g, '');
    if (cleanNum.length >= 7) {
      const check = validatePayoutChannelExclusivity(method.accountNumber, currentUser.username);
      if (!check.allowed) {
        alert(check.reason || 'This payout channel is already registered to another account.');
        return '';
      }
    }

    sounds.playLikePop();
    const newId = `pm-${Date.now()}`;
    const newMethod: PayoutMethodItem = {
      ...method,
      id: newId,
      isDefault: true,
    };

    setPayoutMethods((prev) => {
      // Remove any existing card with the exact same account number to avoid duplicates
      const filtered = prev.filter(
        (m) => m.accountNumber.replace(/[^\d+]/g, '') !== cleanNum
      );
      const updated = [newMethod, ...filtered.map((m) => ({ ...m, isDefault: false }))];
      try {
        localStorage.setItem('valuvid_payout_methods', JSON.stringify(updated));
        localStorage.setItem('valuvid_user_payout_phone', method.accountNumber);
      } catch {}
      return updated;
    });

    // Also persist into currentUser and local profile
    try {
      localStorage.setItem('valuvid_user_payout_phone', method.accountNumber);
      setCurrentUser((prev) => ({ ...prev, phone: method.accountNumber }));
    } catch {}

    return newId;
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
      // Prevent localStorage 5MB quota exhaustion by keeping heavy raw base64 data in IndexedDB
      const safeVideo = {
        ...createdVideo,
        videoUrl: (persistentVideoUrl && persistentVideoUrl.length > 500000) ? '' : persistentVideoUrl,
        thumbnailUrl: (createdVideo.thumbnailUrl && createdVideo.thumbnailUrl.length > 500000)
          ? (currentUser.avatar || '/default-avatar.jpg')
          : createdVideo.thumbnailUrl,
      };
      localStorage.setItem('valuvid_user_videos', JSON.stringify([safeVideo, ...filtered]));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

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

    try {
      const cachedVideos: VideoItem[] = JSON.parse(localStorage.getItem('valuvid_cached_feed_videos') || '[]');
      const filteredCached = cachedVideos.filter((v) => v.id !== videoId);
      localStorage.setItem('valuvid_cached_feed_videos', JSON.stringify(filteredCached));
    } catch {}

    setVideos((prev) => prev.filter((v) => v.id !== videoId));

    await deleteVideoFromSupabase(videoId);
    setShareToast('Video permanently deleted 🗑️');
    return true;
  }, []);

  const shareVideoWithRewardLink = useCallback((video: VideoItem) => {
    openShareModal(video);
  }, [openShareModal]);

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

  const sponsorBounty = useCallback((title: string, sponsorName: string, poolGHS: number, category: string, paystackRef?: string, durationDays: number = 7) => {
    sounds.playCoinTip();
    const effectiveDays = Math.max(1, durationDays || 7);
    const newBounty: BountyChallenge = {
      id: `bounty-${Date.now()}`,
      title,
      sponsor: sponsorName,
      sponsorLogo: '💼',
      rewardPoolGHS: poolGHS,
      rewardPoolUSD: Number((poolGHS * GHS_TO_USD_RATE).toFixed(0)),
      participantsCount: 0,
      submissionsCount: 0,
      daysRemaining: effectiveDays,
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
      subtitle: `Funded #${newBounty.submissionTag} via Paystack MoMo (${effectiveDays}d)`,
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
      days_remaining: effectiveDays,
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
      const userHandle = meta.username || res.user.email?.split('@')[0] || 'creator';
      const userName = meta.name || res.user.email?.split('@')[0] || 'ValuVid Creator';
      const userAvatar = meta.avatar || DEFAULT_AVATAR;
      const updatedUser: Creator = {
        id: res.user.id,
        email: res.user.email,
        name: userName,
        username: userHandle,
        avatar: userAvatar,
        bio: meta.bio || 'ValuVid Creator & Storyteller 🇬🇭',
        followers: 0,
        following: 0,
        likes: 0,
        totalTipsEarned: 0,
        verified: false,
        isHumanVerified: true,
        authenticityScore: 100,
        certificates: [],
      };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('valuvid_is_logged_in', 'true');
        localStorage.setItem('valuvid_auth_user', JSON.stringify(res.user));
        localStorage.setItem('valuvid_user_profile', JSON.stringify(updatedUser));
        localStorage.setItem('valuvid_custom_profile', JSON.stringify(updatedUser));
      } catch {}

      // Fetch live stats, followed creators, and liked videos from Supabase
      fetchUserProfileFromSupabase(userHandle).then((profile) => {
        if (profile) {
          setCurrentUser((prev) => {
            const up = {
              ...prev,
              followers: profile.followers,
              following: profile.following,
              likes: profile.likes,
            };
            try {
              localStorage.setItem('valuvid_user_profile', JSON.stringify(up));
              localStorage.setItem('valuvid_custom_profile', JSON.stringify(up));
            } catch {}
            return up;
          });
        }
      }).catch(() => {});

      fetchUserLikedVideoIdsFromSupabase(userHandle).then((likedIds) => {
        if (likedIds && likedIds.length > 0) {
          try {
            const currentLiked: string[] = JSON.parse(localStorage.getItem('valuvid_liked_video_ids') || '[]');
            const merged = Array.from(new Set([...currentLiked, ...likedIds]));
            localStorage.setItem('valuvid_liked_video_ids', JSON.stringify(merged));
          } catch {}
        }
      }).catch(() => {});

      fetchFollowingListFromSupabase(userHandle).then((followingList: any[]) => {
        if (followingList && followingList.length > 0) {
          try {
            const currentFollowed: string[] = JSON.parse(localStorage.getItem('valuvid_followed_creators') || '[]');
            const newFollowed = followingList.map((f: any) => f.username);
            const merged = Array.from(new Set([...currentFollowed, ...newFollowed]));
            localStorage.setItem('valuvid_followed_creators', JSON.stringify(merged));
          } catch {}
        }
      }).catch(() => {});
      setAuthModalOpen(false);
      setShareToast(`Welcome back, ${userName}!`);
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

        // Record in searchable known creators registry & Supabase
        const newProfile = {
          id: res.user.id,
          username: cleanUsername,
          name: cleanName,
          avatar: DEFAULT_AVATAR,
          bio: 'ValuVid Creator 🇬🇭',
          email,
          phone: phoneToValidate,
        };
        recordKnownUser(newProfile);
        saveUserProfileToSupabase(newProfile);
      }

      if (res.session && res.user) {
        setAuthUser(res.user);
        setIsLoggedIn(true);
        const newCurrentUser: Creator = {
          id: res.user.id,
          email: res.user.email,
          name: cleanName,
          username: cleanUsername,
          avatar: DEFAULT_AVATAR,
          bio: 'ValuVid Creator 🇬🇭',
          followers: 0,
          following: 0,
          likes: 0,
          totalTipsEarned: 0,
          verified: false,
          isHumanVerified: true,
          authenticityScore: 100,
          certificates: [],
        };
        setCurrentUser(newCurrentUser);
        setWallet(DEFAULT_WALLET);
        setTransactions([]);
        try {
          localStorage.setItem('valuvid_is_logged_in', 'true');
          localStorage.setItem('valuvid_auth_user', JSON.stringify(res.user));
          localStorage.setItem('valuvid_user_profile', JSON.stringify(newCurrentUser));
          localStorage.setItem('valuvid_custom_profile', JSON.stringify(newCurrentUser));
          localStorage.setItem('valuvid_user_wallet', JSON.stringify(DEFAULT_WALLET));
          localStorage.setItem('valuvid_transactions', JSON.stringify([]));
        } catch {}
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
    let updatedProfileSnapshot: Creator | null = null;
    setCurrentUser((prev) => {
      const next = {
        ...prev,
        name: updates.name !== undefined ? updates.name : prev.name,
        username: updates.username !== undefined ? updates.username : prev.username,
        bio: updates.bio !== undefined ? updates.bio : prev.bio,
        avatar: updates.avatar !== undefined ? updates.avatar : prev.avatar,
      };
      updatedProfileSnapshot = next;
      try {
        localStorage.setItem('valuvid_custom_profile', JSON.stringify(next));
        localStorage.setItem('valuvid_user_profile', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (updatedProfileSnapshot) {
      recordKnownUser(updatedProfileSnapshot);
      saveUserProfileToSupabase(updatedProfileSnapshot);
    }

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
      followers: 0,
      following: 0,
      likes: 0,
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
        setActiveTab: handleSetActiveTab,
        feedFilter,
        setFeedFilter,
        videos,
        setVideos,
        isVideosLoading,
        refreshVideosFromSupabase,
        currentVideoIndex,
        setCurrentVideoIndex,
        discoverSearchQuery,
        setDiscoverSearchQuery,
        selectedCreatorProfile,
        openCreatorProfile,
        closeCreatorProfile,
        playVideo,
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
        products,
        orders,
        selectedProduct,
        isProductCheckoutOpen,
        openProductCheckout,
        closeProductCheckout,
        buyProduct,
        confirmDelivery,
        addProduct,
        deleteProduct,
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
