export interface SkillCertificate {
  id: string;
  title: string;
  badgeName: string;
  badgeIcon: string;
  issueDate: string;
  credentialId: string;
  creatorName: string;
  videoTitle: string;
}

export interface Creator {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  likes: number;
  totalTipsEarned: number;
  isFollowing?: boolean;
  verified?: boolean;
  badge?: string;
  isPro?: boolean;
  isHumanVerified?: boolean;
  authenticityScore?: number;
  certificates?: SkillCertificate[];
}

export interface ValuSplitConfig {
  collaborator: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    role: string;
  };
  primaryCreatorSharePercent: number;
  collaboratorSharePercent: number;
  totalSplitEarnedGHS: number;
}

export interface CommunityGoal {
  id: string;
  title: string;
  targetGHS: number;
  currentGHS: number;
  rewardDescription: string;
  isCompleted: boolean;
  contributorsCount: number;
  recentContributors?: Array<{ username: string; amountGHS: number; timeAgo: string }>;
}

export interface SkillQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SkillQuiz {
  id: string;
  title: string;
  badgeName: string;
  badgeIcon: string;
  rewardGHS: number;
  passingScore: number;
  questions: SkillQuizQuestion[];
}

export interface VideoItem {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  title: string;
  caption: string;
  hashtags: string[];
  creator: Creator;
  audioTrack: {
    title: string;
    artist: string;
    coverUrl?: string;
    audioUrl?: string;
    duration?: number;
  };
  musicVolume?: number;
  stats: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    saves?: number;
    tipsTotalGHS: number;
    tipsCount: number;
    commentsList?: CommentItem[];
  };
  category: 'trending' | 'ghana' | 'tech' | 'fashion' | 'education' | 'bounties';
  isLiked?: boolean;
  isSaved?: boolean;
  isPayPerUnlock?: boolean;
  unlockPriceGHS?: number;
  isUnlocked?: boolean;
  watchRewardGHSPerMin?: number;
  bountyTag?: string;
  durationSeconds?: number;
  videoResolution?: { width: number; height: number; qualityLabel: string };
  // AI Transparency & Fair Monetization Policy
  isAiContent?: boolean;
  aiDisclosureType?: 'generated' | 'assisted' | 'none';
  aiToolsUsed?: string[];
  aiDetails?: string;
  monetizationCeiling?: 'full_human' | 'reduced_ai';
  // Advanced Creator Monetization Features
  valuSplit?: ValuSplitConfig;
  communityGoal?: CommunityGoal;
  skillQuiz?: SkillQuiz;
}

export interface CommentItem {
  id: string;
  videoId: string;
  user: {
    name: string;
    username: string;
    avatar: string;
    isCreator?: boolean;
  };
  text: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
  isPinned?: boolean;
  tipAmountGHS?: number;
}

export interface BountyChallenge {
  id: string;
  title: string;
  sponsor: string;
  sponsorLogo: string;
  rewardPoolGHS: number;
  rewardPoolUSD: number;
  participantsCount: number;
  submissionsCount: number;
  daysRemaining: number;
  category: string;
  description: string;
  requirements: string[];
  submissionTag: string;
  bannerColor: string;
}

export interface TransactionItem {
  id: string;
  type: 'tip_received' | 'tip_sent' | 'watch_reward' | 'cashout' | 'content_unlock' | 'topup' | 'bounty_reward';
  title: string;
  subtitle: string;
  amountGHS: number;
  timestamp: string;
  status: 'completed' | 'processing' | 'failed';
  method?: 'MTN MoMo' | 'Telecel Cash' | 'Bank Transfer' | 'Stripe' | 'In-App Wallet' | string;
  referenceId: string;
}

export interface PayoutMethodItem {
  id: string;
  type: 'mtn_momo' | 'telecel_cash' | 'bank' | 'stripe';
  name: string;
  accountNumber: string;
  accountHolder: string;
  isDefault: boolean;
  iconType: string;
}

export interface EarlyFundingMetrics {
  totalEscrowFloatGHS: number;
  creatorPayoutRatePercent: number; // e.g. 92%
  platformCommissionPercent: number; // e.g. 8%
  sponsoredBountiesFundedGHS: number;
  monthlyProSubscribers: number;
  investorGrantReadinessScore: number; // e.g. 98/100
}

export type ActiveTab = 'feed' | 'discover' | 'create' | 'wallet' | 'profile';
