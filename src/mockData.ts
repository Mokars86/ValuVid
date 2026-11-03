import { VideoItem, BountyChallenge, CommentItem, TransactionItem, PayoutMethodItem, Creator } from './types';

export const CURRENT_USER: Creator = {
  id: 'user_current',
  name: 'Emmanuel Osei',
  username: 'emmanuel_creator',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  bio: 'Digital story-teller & tech creator based in Accra 🇬🇭. Building the future of creator monetization on ValuVid.',
  followers: 4820,
  following: 342,
  likes: 24500,
  totalTipsEarned: 890.50,
  verified: true,
  badge: 'Top Earner 🏆',
  isHumanVerified: true,
  authenticityScore: 100,
  certificates: [
    {
      id: 'cert-1',
      title: 'Digital Creator Monetization Pro',
      badgeName: 'Monetization Pro ⚡️',
      badgeIcon: '⚡️',
      issueDate: 'Oct 2026',
      credentialId: 'VV-CERT-90412',
      creatorName: 'ValuVid Academy',
      videoTitle: 'Foundations of Micro-Tipping & MoMo Rails'
    }
  ]
};

export const INITIAL_VIDEOS: VideoItem[] = [];

export const BOUNTIES_DATA: BountyChallenge[] = [
  {
    id: 'bounty-1',
    title: 'ValuVid App Review & MoMo Cashout Showcase',
    sponsor: 'ValuVid Official & Paystack',
    sponsorLogo: '💎',
    rewardPoolGHS: 1500,
    rewardPoolUSD: 100,
    participantsCount: 42,
    submissionsCount: 28,
    daysRemaining: 4,
    category: 'Tech & Reviews',
    description: 'Create an authentic 30-60s video demonstrating ValuVid tipping, watch rewards, or instant Mobile Money cashout.',
    requirements: [
      'Screen recording or live phone footage of instant payout',
      'Mention how creator micro-tipping helps African creatives',
      'Use hashtag #ValuVidReview and link your creator profile'
    ],
    submissionTag: '#ValuVidReview',
    bannerColor: 'from-amber-600 via-orange-600 to-rose-600'
  },
  {
    id: 'bounty-2',
    title: 'Accra Street Food & Hidden Gems Spotlight',
    sponsor: 'Chale Wote Creative Fund',
    sponsorLogo: '🇬🇭',
    rewardPoolGHS: 3000,
    rewardPoolUSD: 200,
    participantsCount: 88,
    submissionsCount: 56,
    daysRemaining: 7,
    category: 'Culture & Food',
    description: 'Document your favorite local vendor (Waakye, Kelewele, Ga Kenkey) and share their story to help them receive community tips!',
    requirements: [
      'Interview the vendor or showcase food prep',
      'Clear audio and vibrant visual grading',
      'Use hashtag #AccraEatsBounty'
    ],
    submissionTag: '#AccraEatsBounty',
    bannerColor: 'from-emerald-600 via-teal-600 to-cyan-600'
  },
  {
    id: 'bounty-3',
    title: 'Next-Gen AI Tools for African Creatives',
    sponsor: 'Kite Digital Labs',
    sponsorLogo: '⚡️',
    rewardPoolGHS: 4500,
    rewardPoolUSD: 300,
    participantsCount: 31,
    submissionsCount: 19,
    daysRemaining: 11,
    category: 'AI & Automation',
    description: 'Demonstrate a practical generative AI workflow that can help freelance designers, video editors, or writers double their output.',
    requirements: [
      'Step-by-step actionable walkthrough under 90s',
      'Show before/after results',
      'Tag #CreativeAI2026'
    ],
    submissionTag: '#CreativeAI2026',
    bannerColor: 'from-purple-600 via-indigo-600 to-blue-600'
  }
];

export const INITIAL_TRANSACTIONS: TransactionItem[] = [
  {
    id: 'tx-101',
    type: 'tip_received',
    title: 'Creator Tip Received',
    subtitle: 'From @kwame_d on "FinTech in Accra"',
    amountGHS: 15.00,
    timestamp: '12 mins ago',
    status: 'completed',
    method: 'In-App Wallet',
    referenceId: 'TIP-89214'
  },
  {
    id: 'tx-102',
    type: 'watch_reward',
    title: 'Viewer Watch-Time Reward',
    subtitle: 'Earned 12 mins watch rewards across 6 videos',
    amountGHS: 1.80,
    timestamp: '45 mins ago',
    status: 'completed',
    method: 'In-App Wallet',
    referenceId: 'WRD-44120'
  },
  {
    id: 'tx-103',
    type: 'tip_received',
    title: 'Creator Micro-Tip Received',
    subtitle: 'From @abena_music on "Beadmaking Tutorial"',
    amountGHS: 5.00,
    timestamp: '2 hours ago',
    status: 'completed',
    method: 'In-App Wallet',
    referenceId: 'TIP-78190'
  },
  {
    id: 'tx-104',
    type: 'cashout',
    title: 'Instant Cashout to MTN MoMo',
    subtitle: 'Sent to +233 24 **** 892 (Emmanuel O.)',
    amountGHS: -120.00,
    timestamp: 'Yesterday at 4:15 PM',
    status: 'completed',
    method: 'MTN MoMo',
    referenceId: 'CSH-90142'
  },
  {
    id: 'tx-105',
    type: 'content_unlock',
    title: 'Premium Content Unlock Revenue',
    subtitle: 'User unlocked "Viral Hook Framework"',
    amountGHS: 5.00,
    timestamp: 'Yesterday at 11:30 AM',
    status: 'completed',
    method: 'In-App Wallet',
    referenceId: 'LCK-33921'
  },
  {
    id: 'tx-106',
    type: 'bounty_reward',
    title: 'Micro-Bounty Winner Prize Pool',
    subtitle: '2nd Place: Mobile Video Challenge',
    amountGHS: 350.00,
    timestamp: '3 days ago',
    status: 'completed',
    method: 'In-App Wallet',
    referenceId: 'BNT-11029'
  }
];

export const INITIAL_PAYOUT_METHODS: PayoutMethodItem[] = [
  {
    id: 'pm-1',
    type: 'mtn_momo',
    name: 'MTN Mobile Money',
    accountNumber: '+233 24 981 7261',
    accountHolder: 'Emmanuel Osei',
    isDefault: true,
    iconType: 'momo'
  },
  {
    id: 'pm-2',
    type: 'telecel_cash',
    name: 'Telecel Cash',
    accountNumber: '+233 20 441 9082',
    accountHolder: 'Emmanuel Osei',
    isDefault: false,
    iconType: 'telecel'
  },
  {
    id: 'pm-3',
    type: 'bank',
    name: 'GCB Bank PLC (Accra Main)',
    accountNumber: '**** **** 8192',
    accountHolder: 'Emmanuel Osei',
    isDefault: false,
    iconType: 'bank'
  }
];

export const INITIAL_COMMENTS: Record<string, CommentItem[]> = {
  'vid-1': [
    {
      id: 'c-1',
      videoId: 'vid-1',
      user: {
        name: 'Ama Mensah',
        username: 'amastyle',
        avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&auto=format&fit=crop&q=80',
        isCreator: true
      },
      text: '📌 PINNED: Tipping starts at just GHS 1! Every single tip helps me produce higher quality 4K street documentaries for you all ❤️',
      createdAt: '1 hour ago',
      likes: 64,
      isLiked: true,
      isPinned: true
    },
    {
      id: 'c-2',
      videoId: 'vid-1',
      user: {
        name: 'Kofi Asare',
        username: 'kofi_a',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
      },
      text: 'Just tipped GHS 10! The MoMo integration is crazy fast, took 2 seconds.',
      createdAt: '45 mins ago',
      likes: 18,
      tipAmountGHS: 10.00
    },
    {
      id: 'c-3',
      videoId: 'vid-1',
      user: {
        name: 'Esi Poku',
        username: 'esi_p',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
      },
      text: 'Proud to see a platform built for African creators that respects our payment rails 🇬🇭✨',
      createdAt: '30 mins ago',
      likes: 9
    }
  ],
  'vid-2': [
    {
      id: 'c-201',
      videoId: 'vid-2',
      user: {
        name: 'David Mensah',
        username: 'david_m',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80'
      },
      text: 'Unlocked this masterclass yesterday, totally worth the GHS 5 micro-fee! Hook framework doubled my completion rate.',
      createdAt: '3 hours ago',
      likes: 27
    }
  ]
};
