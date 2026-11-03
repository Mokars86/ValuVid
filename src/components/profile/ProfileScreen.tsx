import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Settings, 
  Grid3X3, 
  Heart, 
  Lock, 
  Coins, 
  Eye, 
  TrendingUp, 
  Share2, 
  Award, 
  Play, 
  BarChart3,
  CheckCircle2,
  Crown,
  GraduationCap,
  BadgeCheck,
  ShieldCheck,
  Edit3,
  Video,
  ExternalLink,
  X,
  Check,
  UserCheck,
  LogIn,
  Sparkles,
  Trash2,
  AlertCircle,
  Save,
  Bookmark,
  SlidersHorizontal,
  Camera,
  Image as ImageIcon,
  Trophy,
  Sun,
  Moon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VideoItem } from '../../types';
import { sounds } from '../../utils/soundEffects';
import { MilestoneCertificateModal, MilestoneCertificateData } from './MilestoneCertificateModal';
import { ProfileShareModal } from './ProfileShareModal';

export const ProfileScreen: React.FC = () => {
  const { 
    currentUser, 
    videos, 
    setVideos,
    setCurrentVideoIndex, 
    setActiveTab, 
    openAnalytics,
    wallet,
    savedVideoIds,
    setShowProModal,
    isProMember,
    setShowSettings,
    setShareToast,
    setAuthModalOpen,
    setAuthMode,
    authUser,
    updateVideo,
    deleteVideo,
    updateUserProfile,
    theme,
    toggleTheme
  } = useApp();

  const [activeTab, setActiveTabState] = useState<'videos' | 'liked' | 'saved' | 'unlocked' | 'trophies'>('videos');
  const [selectedCertificate, setSelectedCertificate] = useState<MilestoneCertificateData | null>(null);
  const [profileShareOpen, setProfileShareOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bioText, setBioText] = useState(currentUser.bio);
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatar);

  const headerAvatarInputRef = useRef<HTMLInputElement | null>(null);
  const modalAvatarInputRef = useRef<HTMLInputElement | null>(null);

  // Keep state in sync with currentUser changes or when opening edit modal
  useEffect(() => {
    setDisplayName(currentUser.name);
    setUsername(currentUser.username);
    setBioText(currentUser.bio);
    setAvatarPreview(currentUser.avatar);
  }, [currentUser.name, currentUser.username, currentUser.bio, currentUser.avatar, editProfileOpen]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setShareToast('Please select an image file (JPG, PNG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // High quality square center crop for optimal avatar presentation
        const canvas = document.createElement('canvas');
        const minDim = Math.min(img.width, img.height);
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 300, 300);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setAvatarPreview(dataUrl);
          updateUserProfile({ avatar: dataUrl });
          sounds.playSuccessPayout();
          setShareToast('Profile picture updated successfully! ✨');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Content Management (Edit & Delete uploaded videos)
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editHashtags, setEditHashtags] = useState('');
  const [editCategory, setEditCategory] = useState<'ghana' | 'tech' | 'fashion' | 'education' | 'trending' | 'bounties'>('trending');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Filter videos created by user, liked by user, and unlocked (strict matching: no mock videos)
  const myVideos = useMemo(() => {
    return videos.filter((v) => {
      if (authUser?.id && v.creator?.id === authUser.id) return true;
      if (currentUser?.id && v.creator?.id === currentUser.id) return true;
      if (authUser?.email && v.creator?.email && v.creator.email.toLowerCase() === authUser.email.toLowerCase()) return true;
      if (currentUser?.email && v.creator?.email && v.creator.email.toLowerCase() === currentUser.email.toLowerCase()) return true;
      if (currentUser?.username && v.creator?.username && v.creator.username.toLowerCase() === currentUser.username.toLowerCase()) return true;
      if (authUser?.user_metadata?.username && v.creator?.username && v.creator.username.toLowerCase() === authUser.user_metadata.username.toLowerCase()) return true;
      return false;
    });
  }, [videos, currentUser, authUser]);

  const likedVideos = useMemo(() => {
    const fromState = videos.filter((v) => v.isLiked);
    try {
      const cachedLikes: VideoItem[] = JSON.parse(localStorage.getItem('valuvid_liked_videos') || '[]');
      const likedIds: string[] = JSON.parse(localStorage.getItem('valuvid_liked_video_ids') || '[]');

      const map = new Map<string, VideoItem>();
      fromState.forEach((v) => map.set(v.id, v));
      cachedLikes.forEach((cv) => {
        if (!map.has(cv.id)) {
          map.set(cv.id, { ...cv, isLiked: true });
        }
      });

      return Array.from(map.values()).filter((v) => {
        if (likedIds.length > 0) {
          return likedIds.includes(v.id);
        }
        return !!v.isLiked;
      });
    } catch {
      return fromState;
    }
  }, [videos]);
  const unlockedVideos = videos.filter((v) => v.isUnlocked && v.isPayPerUnlock);

  const savedVideos = useMemo(() => {
    return videos.filter((v) => savedVideoIds.includes(v.id));
  }, [videos, savedVideoIds]);

  // Compute real analytics dynamically from creator's genuine uploads
  const totalMyViews = useMemo(() => {
    return myVideos.reduce((sum: number, v: VideoItem) => sum + (v.stats?.views || 0), 0);
  }, [myVideos]);

  const totalMyLikes = useMemo(() => {
    return myVideos.reduce((sum: number, v: VideoItem) => sum + (v.stats?.likes || 0), 0);
  }, [myVideos]);

  const totalMyTips = useMemo(() => {
    return myVideos.reduce((sum: number, v: VideoItem) => sum + (v.stats?.tipsTotalGHS || 0), 0);
  }, [myVideos]);

  const realTipsEarned = useMemo(() => {
    return Number((currentUser.totalTipsEarned || totalMyTips || 0).toFixed(2));
  }, [currentUser.totalTipsEarned, totalMyTips]);

  const realFollowersCount = useMemo(() => {
    const videoMaxFollowers = myVideos.reduce((max, v) => Math.max(max, v.creator?.followers || 0), 0);
    return Math.max(currentUser.followers || 0, videoMaxFollowers);
  }, [currentUser.followers, myVideos]);

  // Real milestone progress calculations based on actual user data
  const viewsProgress = useMemo(() => {
    return Math.min(100, Math.round((totalMyViews / 10000) * 100));
  }, [totalMyViews]);

  const tipsProgress = useMemo(() => {
    return Math.min(100, Math.round((realTipsEarned / 1000) * 100));
  }, [realTipsEarned]);

  const followersProgress = useMemo(() => {
    return Math.min(100, Math.round((realFollowersCount / 10000) * 100));
  }, [realFollowersCount]);

  // Real physical plaques progress
  const risingStarPlaqueProgress = useMemo(() => {
    return Math.min(100, Math.round(Math.max((realFollowersCount / 10000) * 100, (realTipsEarned / 1000) * 100)));
  }, [realFollowersCount, realTipsEarned]);

  const goldPlaqueProgress = useMemo(() => {
    return Math.min(100, Math.round(Math.max((realFollowersCount / 100000) * 100, (realTipsEarned / 10000) * 100)));
  }, [realFollowersCount, realTipsEarned]);

  const diamondPlaqueProgress = useMemo(() => {
    return Math.min(100, Math.round((realFollowersCount / 1000000) * 100));
  }, [realFollowersCount]);

  const mostTippedYearProgress = useMemo(() => {
    return Math.min(100, Math.round((realTipsEarned / 10000) * 100));
  }, [realTipsEarned]);

  // Real unlocked certificates based exclusively on genuine user achievements
  const realCertificates: MilestoneCertificateData[] = useMemo(() => {
    const list: MilestoneCertificateData[] = [];

    // 1. Any real skill certificates earned
    if (currentUser.certificates && currentUser.certificates.length > 0) {
      currentUser.certificates.forEach((cert) => {
        list.push({
          id: cert.id,
          title: cert.title,
          category: 'skill_academy',
          badgeName: cert.badgeName,
          badgeIcon: cert.badgeIcon || '🎓',
          milestoneDescription: `Verified certification issued by ${cert.creatorName} on "${cert.videoTitle}".`,
          recipientName: currentUser.name,
          recipientUsername: currentUser.username,
          issueDate: cert.issueDate,
          credentialId: cert.credentialId,
          metricLabel: 'Credential',
          metricValue: cert.badgeName,
          plaqueEligible: false,
        });
      });
    }

    // 2. Real Viral Reach Milestone (unlocked when user's genuine uploads cross 10,000 views)
    if (totalMyViews >= 10000) {
      list.push({
        id: 'cert-real-views',
        title: '10,000 Views Viral Certificate',
        category: 'viral_views',
        badgeName: 'Viral Creator 🚀',
        badgeIcon: '🚀',
        milestoneDescription: `Crossed ${totalMyViews.toLocaleString()} genuine views across ValuVid vertical video feeds.`,
        recipientName: currentUser.name,
        recipientUsername: currentUser.username,
        issueDate: 'Verified',
        credentialId: `VV-VIRAL-${currentUser.username.toUpperCase()}`,
        metricLabel: 'Total Views',
        metricValue: `${totalMyViews.toLocaleString()} Views`,
        plaqueEligible: totalMyViews >= 100000,
        plaqueTier: 'Rising Star Acrylic',
      });
    }

    // 3. Real Community Tips Milestone (unlocked when tips cross GHS 100)
    if (realTipsEarned >= 100) {
      list.push({
        id: 'cert-real-tips',
        title: 'Community Supported Creator',
        category: 'top_tipped',
        badgeName: 'Valu-Tipped Pro 💎',
        badgeIcon: '💎',
        milestoneDescription: `Earned GHS ${realTipsEarned.toFixed(2)} in direct community micro-tips via Mobile Money.`,
        recipientName: currentUser.name,
        recipientUsername: currentUser.username,
        issueDate: 'Verified',
        credentialId: `VV-TIP-${currentUser.username.toUpperCase()}`,
        metricLabel: 'Tips Received',
        metricValue: `GHS ${realTipsEarned.toFixed(2)}`,
        plaqueEligible: realTipsEarned >= 1000,
        plaqueTier: 'Rising Star Acrylic',
      });
    }

    // 4. Follower & Community Milestone Certificates
    if (realFollowersCount >= 1000) {
      list.push({
        id: 'cert-real-followers',
        title: 'Community Builder Award',
        category: 'leaderboard',
        badgeName: 'Top Influencer 👑',
        badgeIcon: '👑',
        milestoneDescription: `Built a verified following of ${realFollowersCount.toLocaleString()} supporters on ValuVid.`,
        recipientName: currentUser.name,
        recipientUsername: currentUser.username,
        recipientAvatar: currentUser.avatar,
        issueDate: 'Verified',
        credentialId: `VV-COMMUNITY-${currentUser.username.toUpperCase()}`,
        metricLabel: 'Audience Size',
        metricValue: `${realFollowersCount.toLocaleString()} Followers`,
        plaqueEligible: false,
      });
    }

    // 5. OFFICIAL PHYSICAL TROPHY ACHIEVEMENTS (ISSUED WHEN REACHED)
    // Tier 1: Rising Star Creators Award (10,000 Followers)
    if (realFollowersCount >= 10000 || realTipsEarned >= 1000) {
      list.push({
        id: 'plaque-rising-star',
        title: 'Rising Star Creators Award',
        category: 'leaderboard',
        badgeName: 'Rising Star Creator 🥉',
        badgeIcon: '🥉',
        milestoneDescription: `Officially awarded for reaching 10,000 followers on ValuVid. Personalized acrylic plaque with @${currentUser.username}.`,
        recipientName: currentUser.name,
        recipientUsername: currentUser.username,
        recipientAvatar: currentUser.avatar,
        issueDate: 'Verified Lifetime Milestone',
        credentialId: `VV-STAR-10K-${currentUser.username.toUpperCase()}`,
        metricLabel: 'Followers Milestone',
        metricValue: `${realFollowersCount.toLocaleString()} Followers`,
        plaqueEligible: true,
        plaqueTier: 'Rising Star Acrylic',
        plaqueImage: '/trophies/plaque-rising-star.jpg',
        isPlaqueAward: true,
        isUnlocked: true,
      });
    }

    // Tier 2: Gold Creator Award (100,000 Followers)
    if (realFollowersCount >= 100000 || realTipsEarned >= 10000) {
      list.push({
        id: 'plaque-gold',
        title: 'Gold Creator Award',
        category: 'leaderboard',
        badgeName: 'Gold Creator 🥈',
        badgeIcon: '🥈',
        milestoneDescription: `Awarded for reaching 100,000 followers. Heavy brushed metallic plaque featuring the 3D ValuVid Play Arrow.`,
        recipientName: currentUser.name,
        recipientUsername: currentUser.username,
        recipientAvatar: currentUser.avatar,
        issueDate: 'Verified Lifetime Milestone',
        credentialId: `VV-GOLD-100K-${currentUser.username.toUpperCase()}`,
        metricLabel: 'Followers Milestone',
        metricValue: `${realFollowersCount.toLocaleString()} Followers`,
        plaqueEligible: true,
        plaqueTier: 'Gold Metallic',
        plaqueImage: '/trophies/plaque-gold.jpg',
        isPlaqueAward: true,
        isUnlocked: true,
      });
    }

    // Tier 3: Diamond Creator Award (1,000,000 Followers)
    if (realFollowersCount >= 1000000) {
      list.push({
        id: 'plaque-diamond',
        title: 'Diamond Creator Award',
        category: 'leaderboard',
        badgeName: 'Diamond Creator 💎',
        badgeIcon: '💎',
        milestoneDescription: `Awarded for achieving 1,000,000 followers. 3D crystal prism trophy with embedded NFC chip opening profile on phone tap. Dream Bigger. Reach Higher!`,
        recipientName: currentUser.name,
        recipientUsername: currentUser.username,
        recipientAvatar: currentUser.avatar,
        issueDate: 'Verified Lifetime Milestone',
        credentialId: `VV-DIAMOND-1M-${currentUser.username.toUpperCase()}`,
        metricLabel: 'Followers Milestone',
        metricValue: `${realFollowersCount.toLocaleString()} Followers`,
        plaqueEligible: true,
        plaqueTier: 'Diamond NFC Crystal',
        plaqueImage: '/trophies/plaque-diamond.jpg',
        isPlaqueAward: true,
        isUnlocked: true,
      });
    }

    // Flagship Annual Award: Most Tipped Creator of the Year
    if (realTipsEarned >= 10000 || currentUser.badge?.includes('Top Tipped')) {
      list.push({
        id: 'trophy-most-tipped',
        title: 'Most Tipped Creator of the Year',
        category: 'top_tipped',
        badgeName: 'Crowned Creator of the Year 👑💰',
        badgeIcon: '👑',
        milestoneDescription: 'ValuVid Flagship Annual Trophy recognizing outstanding creator earnings, viewer tipping volume, and community generosity. "Your Talent Deserves More!"',
        recipientName: currentUser.name,
        recipientUsername: currentUser.username,
        recipientAvatar: currentUser.avatar,
        issueDate: 'Annual Honor',
        credentialId: `VV-CROWN-${currentUser.username.toUpperCase()}`,
        metricLabel: 'Tips Earned',
        metricValue: `GHS ${realTipsEarned.toFixed(2)}`,
        plaqueEligible: true,
        plaqueTier: 'Crowned Crystal of the Year',
        plaqueImage: '/trophies/trophy-most-tipped.jpg',
        isPlaqueAward: true,
        isUnlocked: true,
      });
    }

    return list;
  }, [currentUser, totalMyViews, realTipsEarned, realFollowersCount]);

  const isChampion = Boolean(
    currentUser.badge || 
    realCertificates.length > 0 || 
    realFollowersCount >= 1000 || 
    totalMyViews >= 10000
  );

  const handleOpenEditVideo = (e: React.MouseEvent, video: VideoItem) => {
    e.stopPropagation();
    sounds.playLikePop();
    setEditingVideo(video);
    setEditTitle(video.title);
    setEditCaption(video.caption);
    setEditHashtags(video.hashtags ? video.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ') : '');
    setEditCategory((video.category as any) || 'trending');
    setConfirmDeleteId(null);
  };

  const handleSaveVideoEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;
    setIsSavingEdit(true);

    const tagList = editHashtags
      .split(/[\s,]+/)
      .map((t) => t.replace(/^#/, '').trim())
      .filter(Boolean);

    await updateVideo(editingVideo.id, {
      title: editTitle.trim() || editingVideo.title,
      caption: editCaption.trim() || editingVideo.caption,
      hashtags: tagList.length > 0 ? tagList : editingVideo.hashtags,
      category: editCategory,
    });

    setIsSavingEdit(false);
    setEditingVideo(null);
  };

  const handleDeleteVideo = async (videoId: string) => {
    sounds.playLikePop();
    await deleteVideo(videoId);
    setEditingVideo(null);
    setConfirmDeleteId(null);
  };

  const handleSelectVideo = (video: VideoItem) => {
    let idx = videos.findIndex((v) => v.id === video.id);
    if (idx === -1) {
      setVideos((prev) => [video, ...prev]);
      idx = 0;
    }
    setCurrentVideoIndex(idx);
    setActiveTab('feed');
  };

  const handleShareProfile = () => {
    sounds.playLikePop();
    setProfileShareOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: displayName.trim(),
      username: username.trim().replace(/^@/, '').toLowerCase(),
      bio: bioText.trim(),
      avatar: avatarPreview || currentUser.avatar,
    });
    sounds.playSuccessPayout();
    setEditProfileOpen(false);
    setShareToast('Profile updated successfully! ✨');
  };

  return (
    <div className={`w-full h-full ${theme === 'light' ? 'bg-[#F8FAFC] text-slate-900' : 'bg-neutral-950 text-white'} flex flex-col overflow-y-auto pb-20 select-none transition-colors duration-200`}>
      {/* HEADER NAV */}
      <div className={`sticky top-0 z-20 ${theme === 'light' ? 'bg-white/95 border-slate-200' : 'bg-neutral-950/95 border-neutral-900'} backdrop-blur-md px-4 pt-8 sm:pt-4 pb-2.5 border-b flex items-center justify-between transition-colors`}>
        <div className="flex flex-col">
          <div className="text-sm font-bold flex items-center gap-1.5">
            <span className={theme === 'light' ? 'text-slate-900' : 'text-white'}>@{currentUser.username}</span>
            <span className="w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center text-[9px] text-neutral-950 font-black">
              ✓
            </span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-500 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30 flex items-center gap-1">
              <UserCheck className="w-2.5 h-2.5" /> Human 🧑🏽‍🦱
            </span>
          </div>
          {(currentUser.email || authUser?.email) && (
            <span className="text-[10px] text-cyan-500 font-mono mt-0.5">
              {currentUser.email || authUser?.email}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Sun / Moon Theme Switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className={`w-8 h-8 rounded-full ${
              theme === 'light'
                ? 'bg-amber-500/15 border border-amber-400/40 text-amber-500 shadow-sm hover:scale-105 active:scale-95'
                : 'bg-neutral-900 border border-neutral-800 text-cyan-400 hover:text-white hover:scale-105 active:scale-95'
            } flex items-center justify-center transition-all`}
            title={theme === 'light' ? 'Switch to Dark Mode 🌙' : 'Switch to Day Mode ☀️'}
          >
            {theme === 'light' ? <Sun className="w-4 h-4 text-amber-500 fill-amber-500/30" /> : <Moon className="w-4 h-4 text-cyan-400 fill-cyan-400/30" />}
          </button>

          <button
            onClick={handleShareProfile}
            aria-label="Share Profile"
            className={`w-8 h-8 rounded-full ${
              theme === 'light'
                ? 'bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            } flex items-center justify-center transition-colors`}
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            aria-label="Open Settings"
            className={`w-8 h-8 rounded-full ${
              theme === 'light'
                ? 'bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            } flex items-center justify-center transition-colors`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 py-3.5 flex flex-col gap-4">
        {/* GUEST BANNER IF NOT LOGGED IN */}
        {!authUser && (
          <div className="bg-gradient-to-r from-cyan-950/80 via-blue-950/80 to-amber-950/40 border border-cyan-500/40 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Sign In to ValuVid
              </span>
              <span className="text-[10px] text-neutral-300">
                Create an account to start earning MoMo rewards & publishing.
              </span>
            </div>
            <button
              onClick={() => {
                sounds.playLikePop();
                setAuthMode('signup');
                setAuthModalOpen(true);
              }}
              className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs whitespace-nowrap shadow-md shadow-cyan-500/20 active:scale-95"
            >
              Sign Up
            </button>
          </div>
        )}

        {/* PROFILE HEADER AREA */}
        <div className="flex flex-col items-center text-center">
          <div 
            onClick={() => headerAvatarInputRef.current?.click()}
            className="relative mb-2.5 group cursor-pointer"
            title="Click to change profile picture"
          >
            {/* ValuVid Champion Golden Frame (only if creator holds verified milestone) */}
            {isChampion && (
              <>
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 animate-pulse-glow opacity-80 blur-[2px]" />
                <div className="absolute -top-1.5 -right-1 w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-neutral-950 shadow-md border-2 border-[#050608] z-10" title="ValuVid Milestone Leaderboard Champion">
                  <Crown className="w-3.5 h-3.5 fill-neutral-950" />
                </div>
              </>
            )}
            <div className={`relative w-20 h-20 rounded-full p-[2.5px] overflow-hidden ${
              isChampion 
                ? 'bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-600 shadow-xl shadow-amber-500/25' 
                : 'bg-gradient-to-tr from-[#00B2FE] via-amber-400 to-[#FF9F0A] shadow-xl shadow-[#00B2FE]/20'
            }`}>
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-full h-full rounded-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/45 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
                <span className="text-[9px] font-bold text-white mt-0.5">Change</span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                headerAvatarInputRef.current?.click();
              }}
              className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-[#00B2FE] to-[#FF9F0A] text-neutral-950 p-1.5 rounded-full border-2 border-neutral-950 shadow-md hover:scale-110 active:scale-95 transition-transform z-10"
              title="Upload new profile picture"
            >
              <Camera className="w-3.5 h-3.5 text-black stroke-[2.5]" />
            </button>
          </div>

          <input
            ref={headerAvatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFileChange}
          />

          <h1 className={`text-base font-bold leading-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{currentUser.name}</h1>
          <p className={`text-xs max-w-xs mt-1 leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-neutral-400'}`}>
            {currentUser.bio}
          </p>

          {/* EDIT & SHARE & AUTH ACTION BUTTONS */}
          <div className="flex items-center flex-wrap justify-center gap-2 mt-3">
            <button
              onClick={() => setEditProfileOpen(true)}
              className={`px-3.5 py-1.5 rounded-full ${
                theme === 'light'
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-sm'
                  : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-white'
              } border text-xs font-bold flex items-center gap-1.5 transition-colors`}
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-500" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleShareProfile}
              className={`px-3.5 py-1.5 rounded-full ${
                theme === 'light'
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800 shadow-sm'
                  : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-white'
              } border text-xs font-bold flex items-center gap-1.5 transition-colors`}
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-500" />
              <span>Share</span>
            </button>
            <button
              onClick={() => {
                sounds.playLikePop();
                setAuthMode(authUser ? 'signin' : 'signup');
                setAuthModalOpen(true);
              }}
              className={`px-3.5 py-1.5 rounded-full ${
                theme === 'light'
                  ? 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-800'
                  : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-500/40 text-cyan-300'
              } border text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm`}
            >
              <LogIn className="w-3.5 h-3.5 text-cyan-500" />
              <span>{authUser ? 'Switch ID' : 'Sign In / Register'}</span>
            </button>
          </div>

          {/* TOTAL COMMUNITY TIPS RECEIVED BADGE */}
          <div className={`mt-3 flex items-center gap-2 ${
            theme === 'light'
              ? 'bg-gradient-to-r from-amber-50 via-amber-100/60 to-yellow-50 border-amber-300 shadow-sm'
              : 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-yellow-500/20 border-amber-400/50 shadow-lg shadow-amber-500/10'
          } border px-3.5 py-1.5 rounded-full`}>
            <Coins className="w-4 h-4 text-amber-500" />
            <span className={`text-xs font-bold ${theme === 'light' ? 'text-amber-800' : 'text-amber-300'}`}>
              GHS {totalMyTips.toFixed(2)} Community Tips Received
            </span>
          </div>

          {/* FOLLOWER / LIKES STATS */}
          <div className={`flex items-center justify-center gap-3 min-[360px]:gap-6 mt-3.5 w-full py-2 border-y ${
            theme === 'light' ? 'border-slate-200' : 'border-neutral-900'
          }`}>
            <div className="flex flex-col items-center">
              <span className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {currentUser.following || 0}
              </span>
              <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Following</span>
            </div>
            <div className={`w-px h-6 ${theme === 'light' ? 'bg-slate-200' : 'bg-neutral-800'}`} />
            <div className="flex flex-col items-center">
              <span className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {realFollowersCount.toLocaleString()}
              </span>
              <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Followers</span>
            </div>
            <div className={`w-px h-6 ${theme === 'light' ? 'bg-slate-200' : 'bg-neutral-800'}`} />
            <div className="flex flex-col items-center">
              <span className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {totalMyLikes.toLocaleString()}
              </span>
              <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Likes</span>
            </div>
          </div>
        </div>

        {/* CREATOR ANALYTICS SNAPSHOT */}
        <div className={`${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-neutral-900 border-neutral-800'} border rounded-3xl p-4 transition-colors`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h2 className={`text-xs font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-800' : 'text-neutral-200'}`}>
                Creator Performance Snapshot
              </h2>
            </div>
            <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>All Time</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className={`${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/60 border-neutral-800/80'} p-3 rounded-2xl border`}>
              <span className={`text-[10px] block mb-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Est. Creator Yield</span>
              <div className="text-base font-bold text-emerald-500">
                GHS {(wallet.creatorTipsEarned || totalMyTips).toFixed(2)}
              </div>
              <span className={`text-[9px] flex items-center gap-1 mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-neutral-500'}`}>
                <span className="text-emerald-500 font-bold">{myVideos.length}</span> uploads
              </span>
            </div>

            <div className={`${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/60 border-neutral-800/80'} p-3 rounded-2xl border`}>
              <span className={`text-[10px] block mb-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Total Video Views</span>
              <div className={`text-base font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {totalMyViews > 999 ? `${(totalMyViews / 1000).toFixed(1)}K` : totalMyViews}
              </div>
              <span className={`text-[9px] flex items-center gap-1 mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-neutral-500'}`}>
                <span className="text-cyan-500 font-bold">{myVideos.length > 0 ? 'Verified' : 'No views yet'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* VALUVID PRO CARD */}
        <div 
          onClick={() => setShowProModal(true)}
          className="bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-purple-600/20 border border-amber-500/40 rounded-3xl p-4 cursor-pointer hover:border-amber-400 transition-colors shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-neutral-950 font-black shadow-md">
                <Crown className="w-5 h-5 text-neutral-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white">ValuVid Creator Pro</h3>
                  {isProMember ? (
                    <span className="text-[9px] bg-amber-400 text-black px-1.5 py-0.2 rounded font-black">ACTIVE</span>
                  ) : (
                    <span className="text-[9px] bg-amber-500/30 text-amber-300 px-1.5 py-0.2 rounded">GHS 29/mo</span>
                  )}
                </div>
                <p className="text-[10px] text-neutral-400">Priority video encoding, boost reach & analytics</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400">
              {isProMember ? 'Manage' : 'Upgrade →'}
            </span>
          </div>
        </div>

        {/* TABBED CONTENT GRID */}
        <div>
          {/* Tab Switcher */}
          <div className={`grid grid-cols-5 border-b ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'} mb-3`}>
            <button
              onClick={() => setActiveTabState('videos')}
              className={`flex items-center justify-center gap-1 py-2 px-0.5 text-[10px] min-[360px]:text-[11px] sm:text-xs font-semibold relative transition-colors ${
                activeTab === 'videos'
                  ? (theme === 'light' ? 'text-amber-600 font-bold' : 'text-amber-400 font-bold')
                  : (theme === 'light' ? 'text-slate-500 hover:text-slate-900' : 'text-neutral-400 hover:text-white')
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Videos ({myVideos.length})</span>
              {activeTab === 'videos' && (
                <span className={`absolute bottom-0 inset-x-1 sm:inset-x-2 h-0.5 ${theme === 'light' ? 'bg-amber-500' : 'bg-amber-400'} rounded-full`} />
              )}
            </button>

            <button
              onClick={() => setActiveTabState('saved')}
              className={`flex items-center justify-center gap-1 py-2 px-0.5 text-[10px] min-[360px]:text-[11px] sm:text-xs font-semibold relative transition-colors ${
                activeTab === 'saved'
                  ? (theme === 'light' ? 'text-amber-600 font-bold' : 'text-amber-400 font-bold')
                  : (theme === 'light' ? 'text-slate-500 hover:text-slate-900' : 'text-neutral-400 hover:text-white')
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'saved' ? (theme === 'light' ? 'fill-amber-500 text-amber-500' : 'fill-amber-400 text-amber-400') : ''}`} />
              <span className="truncate">Saved ({savedVideos.length})</span>
              {activeTab === 'saved' && (
                <span className={`absolute bottom-0 inset-x-1 sm:inset-x-2 h-0.5 ${theme === 'light' ? 'bg-amber-500' : 'bg-amber-400'} rounded-full`} />
              )}
            </button>

            <button
              onClick={() => setActiveTabState('liked')}
              className={`flex items-center justify-center gap-1 py-2 px-0.5 text-[10px] min-[360px]:text-[11px] sm:text-xs font-semibold relative transition-colors ${
                activeTab === 'liked'
                  ? (theme === 'light' ? 'text-amber-600 font-bold' : 'text-amber-400 font-bold')
                  : (theme === 'light' ? 'text-slate-500 hover:text-slate-900' : 'text-neutral-400 hover:text-white')
              }`}
            >
              <Heart className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Liked ({likedVideos.length})</span>
              {activeTab === 'liked' && (
                <span className={`absolute bottom-0 inset-x-1 sm:inset-x-2 h-0.5 ${theme === 'light' ? 'bg-amber-500' : 'bg-amber-400'} rounded-full`} />
              )}
            </button>

            <button
              onClick={() => setActiveTabState('unlocked')}
              className={`flex items-center justify-center gap-1 py-2 px-0.5 text-[10px] min-[360px]:text-[11px] sm:text-xs font-semibold relative transition-colors ${
                activeTab === 'unlocked'
                  ? (theme === 'light' ? 'text-amber-600 font-bold' : 'text-amber-400 font-bold')
                  : (theme === 'light' ? 'text-slate-500 hover:text-slate-900' : 'text-neutral-400 hover:text-white')
              }`}
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Unlocked ({unlockedVideos.length})</span>
              {activeTab === 'unlocked' && (
                <span className={`absolute bottom-0 inset-x-1 sm:inset-x-2 h-0.5 ${theme === 'light' ? 'bg-amber-500' : 'bg-amber-400'} rounded-full`} />
              )}
            </button>

            <button
              onClick={() => setActiveTabState('trophies')}
              className={`flex items-center justify-center gap-1 py-2 px-0.5 text-[10px] min-[360px]:text-[11px] sm:text-xs font-semibold relative transition-colors ${
                activeTab === 'trophies'
                  ? (theme === 'light' ? 'text-amber-600 font-bold' : 'text-amber-400 font-bold')
                  : (theme === 'light' ? 'text-slate-500 hover:text-slate-900' : 'text-neutral-400 hover:text-white')
              }`}
            >
              <Trophy className={`w-3.5 h-3.5 shrink-0 ${theme === 'light' ? 'text-amber-500' : 'text-amber-400'}`} />
              <span className="truncate">Awards ({realCertificates.length})</span>
              {activeTab === 'trophies' && (
                <span className={`absolute bottom-0 inset-x-1 sm:inset-x-2 h-0.5 ${theme === 'light' ? 'bg-amber-500' : 'bg-amber-400'} rounded-full`} />
              )}
            </button>
          </div>

          {/* TAB CONTENT: TROPHIES & MILESTONES */}
          {activeTab === 'trophies' ? (
            <div className="flex flex-col gap-4 animate-fade-in pb-4">
              {/* 1. LIVE MILESTONE PROGRESS ENGINE (REAL DATA ONLY) */}
              <div className={`${
                theme === 'light'
                  ? 'bg-white border-amber-400/40 text-slate-900 shadow-md'
                  : 'bg-gradient-to-b from-[#0E1B33] via-[#091224] to-[#060D1A] border-amber-500/40 text-white shadow-xl'
              } border rounded-2xl p-4 flex flex-col gap-3 transition-colors`}>
                <div className={`flex items-center justify-between border-b pb-2 ${theme === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <div className="text-left">
                      <h4 className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>My Trophies & Milestones</h4>
                      <p className={`text-[10px] ${theme === 'light' ? 'text-amber-700' : 'text-amber-300'}`}>Live progress towards verified certificates & physical plaques</p>
                    </div>
                  </div>
                  {isChampion && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-500 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      Milestone Active 🏆
                    </span>
                  )}
                </div>

                {/* Milestone 1: 10,000 Views Viral Certificate */}
                <div className={`flex flex-col gap-1.5 p-3 rounded-xl border ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/5'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold flex items-center gap-1.5 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      <span>🚀</span> 10,000 Views Viral Certificate
                    </span>
                    <span className={`text-[10px] font-mono font-bold ${theme === 'light' ? 'text-amber-600' : 'text-amber-400'}`}>
                      {viewsProgress}%
                    </span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden p-[0.5px] ${theme === 'light' ? 'bg-slate-200' : 'bg-neutral-800'}`}>
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                      style={{ width: `${viewsProgress}%` }}
                    />
                  </div>
                  <div className={`flex items-center justify-between text-[9px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                    <span>{totalMyViews.toLocaleString()} views reached</span>
                    <span className={`${theme === 'light' ? 'text-amber-700 font-bold' : 'text-amber-300 font-semibold'}`}>{viewsProgress}% to your 10,000 Views Certificate</span>
                  </div>
                </div>

                {/* Milestone 2: Rising Star Acrylic Plaque (GHS 1,000 Tipped) */}
                <div className={`flex flex-col gap-1.5 p-3 rounded-xl border ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/5'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold flex items-center gap-1.5 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      <span>💎</span> Rising Star Acrylic Plaque (GHS 1,000 Tipped)
                    </span>
                    <span className={`text-[10px] font-mono font-bold ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`}>
                      {tipsProgress}%
                    </span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden p-[0.5px] ${theme === 'light' ? 'bg-slate-200' : 'bg-neutral-800'}`}>
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                      style={{ width: `${tipsProgress}%` }}
                    />
                  </div>
                  <div className={`flex items-center justify-between text-[9px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                    <span>GHS {realTipsEarned.toFixed(2)} in community tips</span>
                    <span className={`${theme === 'light' ? 'text-emerald-700 font-bold' : 'text-emerald-300 font-semibold'}`}>{tipsProgress}% to Rising Star Physical Plaque</span>
                  </div>
                </div>

                {/* Milestone 3: Gold Creator Award Milestone */}
                <div className={`flex flex-col gap-1.5 p-3 rounded-xl border ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/5'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold flex items-center gap-1.5 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      <span>🥈</span> Gold Creator Award (100,000 Followers)
                    </span>
                    <span className={`text-[10px] font-mono font-bold ${theme === 'light' ? 'text-amber-600' : 'text-yellow-300'}`}>
                      {goldPlaqueProgress}%
                    </span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden p-[0.5px] ${theme === 'light' ? 'bg-slate-200' : 'bg-neutral-800'}`}>
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]"
                      style={{ width: `${goldPlaqueProgress}%` }}
                    />
                  </div>
                  <div className={`flex items-center justify-between text-[9px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                    <span>{realFollowersCount.toLocaleString()} / 100,000 followers</span>
                    <span className={`${theme === 'light' ? 'text-amber-700 font-bold' : 'text-yellow-300 font-semibold'}`}>{goldPlaqueProgress}% to 100k Gold Plaque</span>
                  </div>
                </div>
              </div>

              {/* 2. UNLOCKED DIGITAL CERTIFICATES & PASSES (BASED ONLY ON REAL DATA) */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    theme === 'light' ? 'text-slate-700' : 'text-neutral-300'
                  }`}>
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    Verified Digital Certificates & Awards ({realCertificates.length})
                  </h4>
                  {realCertificates.length > 0 && (
                    <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-500'}`}>Tap to View & Share</span>
                  )}
                </div>

                {realCertificates.length > 0 ? (
                  realCertificates.map((cert) => (
                    <div
                      key={cert.id}
                      onClick={() => setSelectedCertificate(cert)}
                      className={`border rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-95 group ${
                        theme === 'light'
                          ? 'bg-white border-amber-300/80 hover:border-amber-500 shadow-sm'
                          : 'bg-neutral-900/90 border-amber-400/50 hover:border-amber-400 shadow-lg'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/50 overflow-hidden flex items-center justify-center text-2xl shrink-0 group-hover:rotate-6 transition-transform shadow-inner">
                          {cert.plaqueImage ? (
                            <img src={cert.plaqueImage} alt={cert.title} className="w-full h-full object-contain p-1" />
                          ) : (
                            cert.badgeIcon
                          )}
                        </div>
                        <div className="min-w-0 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{cert.badgeName}</span>
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-600 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30 shrink-0">
                              Verified
                            </span>
                          </div>
                          <div className={`text-[10px] truncate mt-0.5 ${theme === 'light' ? 'text-slate-600' : 'text-neutral-300'}`}>
                            {cert.title}
                          </div>
                          <div className={`text-[9px] flex items-center gap-1 mt-0.5 font-mono ${theme === 'light' ? 'text-slate-500' : 'text-neutral-500'}`}>
                            <span className="text-amber-500 font-semibold">#{cert.credentialId}</span>
                            <span>•</span>
                            <span>{cert.issueDate}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold text-[10px] shrink-0 shadow-md flex items-center gap-1 active:scale-90 transition-transform"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>View Pass</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className={`border rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-2 ${
                    theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-neutral-900/60 border-neutral-800'
                  }`}>
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-1">
                      <Award className="w-6 h-6" />
                    </div>
                    <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>No Verified Certificates Yet</span>
                    <p className={`text-[10px] max-w-xs leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                      Certificates unlock as you grow on ValuVid. Reach 10,000 views, earn GHS 100 in community tips, or complete skill checkpoints to earn verified shareable certificates!
                    </p>
                  </div>
                )}
              </div>

              {/* 3. PHYSICAL "VALUPLAQUES" SHOWCASE (CALCULATED FROM REAL DATA) */}
              <div className={`border rounded-2xl p-4 flex flex-col gap-3 transition-colors ${
                theme === 'light' ? 'bg-white border-slate-200 shadow-md' : 'bg-[#0A1220] border-neutral-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <h4 className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Physical ValuPlaques Award Program</h4>
                  </div>
                  <span className={`text-[9px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Custom Crafted</span>
                </div>

                <p className={`text-[10px] leading-relaxed text-left ${theme === 'light' ? 'text-slate-600' : 'text-neutral-400'}`}>
                  Unlike platforms that only reward follower counts, ValuVid sends physical hardware awards based on community tips and creator excellence.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 text-left">
                  {/* Plaque 1: Rising Star Creators Award */}
                  <div 
                    onClick={() => {
                      sounds.playLikePop();
                      setSelectedCertificate({
                        id: 'plaque-rising-star',
                        title: 'Rising Star Creators Award',
                        category: 'leaderboard',
                        badgeName: 'Rising Star Creator 🥉',
                        badgeIcon: '🥉',
                        milestoneDescription: `Officially awarded for reaching 10,000 followers on ValuVid. Personalized acrylic plaque with @${currentUser.username}.`,
                        recipientName: currentUser.name,
                        recipientUsername: currentUser.username,
                        recipientAvatar: currentUser.avatar,
                        issueDate: 'Official ValuVid Milestone',
                        credentialId: `VV-STAR-10K-${currentUser.username.toUpperCase()}`,
                        metricLabel: 'Followers Requirement',
                        metricValue: `${realFollowersCount.toLocaleString()} / 10,000 Followers`,
                        plaqueEligible: risingStarPlaqueProgress >= 100,
                        plaqueTier: 'Rising Star Acrylic',
                        plaqueImage: '/trophies/plaque-rising-star.jpg',
                        isPlaqueAward: true,
                        isUnlocked: risingStarPlaqueProgress >= 100,
                      });
                    }}
                    className={`border rounded-2xl p-3 flex flex-col justify-between gap-2.5 shadow-md hover:scale-[1.02] cursor-pointer transition-all group ${
                      theme === 'light'
                        ? 'bg-slate-50 border-amber-300 hover:border-amber-500 hover:bg-white'
                        : 'bg-black/60 border-amber-400/40 hover:border-amber-400'
                    }`}
                  >
                    <div>
                      {/* Plaque Photo Header */}
                      <div className={`relative aspect-square w-full rounded-xl overflow-hidden mb-2.5 border flex items-center justify-center ${
                        theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
                      }`}>
                        <img 
                          src="/trophies/plaque-rising-star.jpg" 
                          alt="Rising Star Creators Award"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute top-2 right-2">
                          {risingStarPlaqueProgress >= 100 ? (
                            <span className="text-[9px] bg-emerald-500 text-neutral-950 font-black px-2 py-0.5 rounded-full shadow-md">
                              🏆 ISSUED
                            </span>
                          ) : (
                            <span className="text-[9px] bg-black/80 backdrop-blur-md text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                              🔒 {risingStarPlaqueProgress}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold flex items-center gap-1 ${theme === 'light' ? 'text-amber-700' : 'text-amber-300'}`}>
                          🥉 Rising Star
                        </span>
                        <span className="text-[9px] bg-amber-500/20 text-amber-600 px-1.5 py-0.2 rounded font-bold">
                          Tier 1
                        </span>
                      </div>
                      <div className={`text-[11px] font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Rising Star Creators Award</div>
                      <p className={`text-[9px] mt-1 leading-tight ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                        Personalized acrylic plaque with @handle & official ValuVid seal.
                      </p>
                    </div>

                    <div className={`pt-2 border-t flex flex-col gap-1 ${theme === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
                      <span className={`text-[8px] font-mono ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Requirement: 10,000 Followers</span>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${theme === 'light' ? 'bg-slate-200' : 'bg-neutral-800'}`}>
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                          style={{ width: `${risingStarPlaqueProgress}%` }}
                        />
                      </div>
                      <span className={`text-[9px] font-bold ${
                        risingStarPlaqueProgress >= 100 
                          ? (theme === 'light' ? 'text-emerald-700' : 'text-emerald-400')
                          : (theme === 'light' ? 'text-amber-700' : 'text-amber-400')
                      }`}>
                        {risingStarPlaqueProgress}% Completed • Tap to Preview
                      </span>
                    </div>
                  </div>

                  {/* Plaque 2: Gold Creator Award */}
                  <div 
                    onClick={() => {
                      sounds.playLikePop();
                      setSelectedCertificate({
                        id: 'plaque-gold',
                        title: 'Gold Creator Award',
                        category: 'leaderboard',
                        badgeName: 'Gold Creator 🥈',
                        badgeIcon: '🥈',
                        milestoneDescription: 'Awarded for reaching 100,000 followers. Heavy brushed metallic plaque featuring the 3D ValuVid Play Arrow.',
                        recipientName: currentUser.name,
                        recipientUsername: currentUser.username,
                        recipientAvatar: currentUser.avatar,
                        issueDate: 'Official ValuVid Milestone',
                        credentialId: `VV-GOLD-100K-${currentUser.username.toUpperCase()}`,
                        metricLabel: 'Followers Requirement',
                        metricValue: `${realFollowersCount.toLocaleString()} / 100,000 Followers`,
                        plaqueEligible: goldPlaqueProgress >= 100,
                        plaqueTier: 'Gold Metallic',
                        plaqueImage: '/trophies/plaque-gold.jpg',
                        isPlaqueAward: true,
                        isUnlocked: goldPlaqueProgress >= 100,
                      });
                    }}
                    className={`border rounded-2xl p-3 flex flex-col justify-between gap-2.5 shadow-md hover:scale-[1.02] cursor-pointer transition-all group ${
                      theme === 'light'
                        ? 'bg-slate-50 border-slate-200 hover:border-amber-400 hover:bg-white'
                        : 'bg-black/60 border-neutral-800 hover:border-yellow-400/80'
                    }`}
                  >
                    <div>
                      {/* Plaque Photo Header */}
                      <div className={`relative aspect-square w-full rounded-xl overflow-hidden mb-2.5 border flex items-center justify-center ${
                        theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
                      }`}>
                        <img 
                          src="/trophies/plaque-gold.jpg" 
                          alt="Gold Creator Award"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute top-2 right-2">
                          {goldPlaqueProgress >= 100 ? (
                            <span className="text-[9px] bg-emerald-500 text-neutral-950 font-black px-2 py-0.5 rounded-full shadow-md">
                              🏆 ISSUED
                            </span>
                          ) : (
                            <span className="text-[9px] bg-black/80 backdrop-blur-md text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                              🔒 {goldPlaqueProgress}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold flex items-center gap-1 ${theme === 'light' ? 'text-amber-700' : 'text-yellow-300'}`}>
                          🥈 Gold Plaque
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${theme === 'light' ? 'bg-slate-200 text-slate-700' : 'bg-neutral-800 text-neutral-400'}`}>
                          Tier 2
                        </span>
                      </div>
                      <div className={`text-[11px] font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Gold Creator Award</div>
                      <p className={`text-[9px] mt-1 leading-tight ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                        Brushed gold metallic plaque with 3D Play Arrow and Rising Curve.
                      </p>
                    </div>

                    <div className={`pt-2 border-t flex flex-col gap-1 ${theme === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
                      <span className={`text-[8px] font-mono ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Requirement: 100,000 Followers</span>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${theme === 'light' ? 'bg-slate-200' : 'bg-neutral-800'}`}>
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-500 to-amber-300 rounded-full"
                          style={{ width: `${goldPlaqueProgress}%` }}
                        />
                      </div>
                      <span className={`text-[9px] font-bold ${
                        goldPlaqueProgress >= 100 
                          ? (theme === 'light' ? 'text-emerald-700' : 'text-emerald-400')
                          : (theme === 'light' ? 'text-amber-700' : 'text-amber-400')
                      }`}>
                        {goldPlaqueProgress}% Completed • Tap to Preview
                      </span>
                    </div>
                  </div>

                  {/* Plaque 3: Diamond Creator Award */}
                  <div 
                    onClick={() => {
                      sounds.playLikePop();
                      setSelectedCertificate({
                        id: 'plaque-diamond',
                        title: 'Diamond Creator Award',
                        category: 'leaderboard',
                        badgeName: 'Diamond Creator 💎',
                        badgeIcon: '💎',
                        milestoneDescription: 'Awarded for achieving 1,000,000 followers. 3D crystal prism trophy with embedded NFC chip opening profile on phone tap. Dream Bigger. Reach Higher!',
                        recipientName: currentUser.name,
                        recipientUsername: currentUser.username,
                        recipientAvatar: currentUser.avatar,
                        issueDate: 'Official ValuVid Milestone',
                        credentialId: `VV-DIAMOND-1M-${currentUser.username.toUpperCase()}`,
                        metricLabel: 'Followers Requirement',
                        metricValue: `${realFollowersCount.toLocaleString()} / 1,000,000 Followers`,
                        plaqueEligible: diamondPlaqueProgress >= 100,
                        plaqueTier: 'Diamond NFC Crystal',
                        plaqueImage: '/trophies/plaque-diamond.jpg',
                        isPlaqueAward: true,
                        isUnlocked: diamondPlaqueProgress >= 100,
                      });
                    }}
                    className={`border rounded-2xl p-3 flex flex-col justify-between gap-2.5 shadow-md hover:scale-[1.02] cursor-pointer transition-all group ${
                      theme === 'light'
                        ? 'bg-slate-50 border-slate-200 hover:border-cyan-500 hover:bg-white'
                        : 'bg-black/60 border-neutral-800 hover:border-cyan-400/80'
                    }`}
                  >
                    <div>
                      {/* Plaque Photo Header */}
                      <div className={`relative aspect-square w-full rounded-xl overflow-hidden mb-2.5 border flex items-center justify-center ${
                        theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
                      }`}>
                        <img 
                          src="/trophies/plaque-diamond.jpg" 
                          alt="Diamond Creator Trophy"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute top-2 right-2">
                          {diamondPlaqueProgress >= 100 ? (
                            <span className="text-[9px] bg-emerald-500 text-neutral-950 font-black px-2 py-0.5 rounded-full shadow-md">
                              🏆 ISSUED
                            </span>
                          ) : (
                            <span className="text-[9px] bg-black/80 backdrop-blur-md text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded-full font-bold">
                              🔒 {diamondPlaqueProgress}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold flex items-center gap-1 ${theme === 'light' ? 'text-cyan-700' : 'text-cyan-300'}`}>
                          💎 Diamond Plaque
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${theme === 'light' ? 'bg-slate-200 text-slate-700' : 'bg-neutral-800 text-neutral-400'}`}>
                          Tier 3
                        </span>
                      </div>
                      <div className={`text-[11px] font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Diamond Creator Award</div>
                      <p className={`text-[9px] mt-1 leading-tight ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                        3D crystal trophy with embedded micro-chip NFC tag opening creator profile on phone tap.
                      </p>
                    </div>

                    <div className={`pt-2 border-t flex flex-col gap-1 ${theme === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
                      <span className={`text-[8px] font-mono ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Requirement: 1,000,000 Followers</span>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${theme === 'light' ? 'bg-slate-200' : 'bg-neutral-800'}`}>
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                          style={{ width: `${diamondPlaqueProgress}%` }}
                        />
                      </div>
                      <span className={`text-[9px] font-bold ${
                        diamondPlaqueProgress >= 100 
                          ? (theme === 'light' ? 'text-emerald-700' : 'text-emerald-400')
                          : (theme === 'light' ? 'text-cyan-700' : 'text-cyan-400')
                      }`}>
                        {diamondPlaqueProgress}% Completed • Tap to Preview
                      </span>
                    </div>
                  </div>

                  {/* Plaque 4: Most Tipped Creator of the Year */}
                  <div 
                    onClick={() => {
                      sounds.playLikePop();
                      setSelectedCertificate({
                        id: 'trophy-most-tipped',
                        title: 'Most Tipped Creator of the Year',
                        category: 'top_tipped',
                        badgeName: 'Crowned Creator of the Year 👑💰',
                        badgeIcon: '👑',
                        milestoneDescription: 'ValuVid Flagship Annual Trophy recognizing outstanding creator earnings, viewer tipping volume, and community generosity. "Your Talent Deserves More!"',
                        recipientName: currentUser.name,
                        recipientUsername: currentUser.username,
                        recipientAvatar: currentUser.avatar,
                        issueDate: 'Annual Honor',
                        credentialId: `VV-CROWN-${currentUser.username.toUpperCase()}`,
                        metricLabel: 'Tips Requirement',
                        metricValue: `GHS ${realTipsEarned.toFixed(2)} / GHS 10,000`,
                        plaqueEligible: mostTippedYearProgress >= 100,
                        plaqueTier: 'Crowned Crystal of the Year',
                        plaqueImage: '/trophies/trophy-most-tipped.jpg',
                        isPlaqueAward: true,
                        isUnlocked: mostTippedYearProgress >= 100,
                      });
                    }}
                    className={`border rounded-2xl p-3 flex flex-col justify-between gap-2.5 shadow-xl hover:scale-[1.02] cursor-pointer transition-all group relative overflow-hidden ${
                      theme === 'light'
                        ? 'bg-amber-50/60 border-amber-300 hover:border-amber-500'
                        : 'bg-black/60 border-amber-500/60 hover:border-yellow-400'
                    }`}
                  >
                    {/* Golden Ambient Corner Glow */}
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/20 rounded-full blur-xl pointer-events-none" />

                    <div>
                      {/* Trophy Photo Header */}
                      <div className={`relative aspect-square w-full rounded-xl overflow-hidden mb-2.5 border flex items-center justify-center shadow-inner ${
                        theme === 'light' ? 'bg-amber-100/40 border-amber-200' : 'bg-black/40 border-amber-500/30'
                      }`}>
                        <img 
                          src="/trophies/trophy-most-tipped.jpg" 
                          alt="Most Tipped Creator of the Year"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="absolute top-2 right-2">
                          {mostTippedYearProgress >= 100 ? (
                            <span className="text-[9px] bg-gradient-to-r from-amber-400 to-yellow-300 text-neutral-950 font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                              👑 ISSUED
                            </span>
                          ) : (
                            <span className="text-[9px] bg-black/80 backdrop-blur-md text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold">
                              🔒 {mostTippedYearProgress}%
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold flex items-center gap-1 ${theme === 'light' ? 'text-amber-800' : 'text-amber-300'}`}>
                          👑 Creator of the Year
                        </span>
                        <span className="text-[9px] bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-700 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">
                          Annual Flagship
                        </span>
                      </div>
                      <div className={`text-[11px] font-bold leading-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Most Tipped Creator of the Year</div>
                      <p className={`text-[9px] mt-1 leading-tight ${theme === 'light' ? 'text-slate-600' : 'text-neutral-400'}`}>
                        Crowned crystal trophy with 3D gold dollar, laurel wreaths & engraved gold pedestal.
                      </p>
                    </div>

                    <div className={`pt-2 border-t flex flex-col gap-1 ${theme === 'light' ? 'border-amber-200' : 'border-white/10'}`}>
                      <span className={`text-[8px] font-mono ${theme === 'light' ? 'text-amber-800' : 'text-amber-300/80'}`}>Req: GHS 10,000 Tipped Volume</span>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${theme === 'light' ? 'bg-slate-200' : 'bg-neutral-800'}`}>
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                          style={{ width: `${mostTippedYearProgress}%` }}
                        />
                      </div>
                      <span className={`text-[9px] font-bold ${
                        mostTippedYearProgress >= 100 
                          ? (theme === 'light' ? 'text-amber-700' : 'text-amber-300')
                          : (theme === 'light' ? 'text-slate-500' : 'text-neutral-400')
                      }`}>
                        {mostTippedYearProgress}% Completed • Tap to Preview
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 3-COLUMN THUMBNAIL GRID FOR VIDEOS, LIKED, UNLOCKED */
            <div>
              {activeTab === 'videos' && (
                myVideos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {myVideos.map((video: VideoItem) => (
                      <div
                        key={video.id}
                        onClick={() => handleSelectVideo(video)}
                        className="relative aspect-[9/14] bg-neutral-900 rounded-xl overflow-hidden cursor-pointer group"
                      >
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />

                        {/* Creator Stats / Revenue Analytics */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAnalytics(video);
                          }}
                          className="absolute top-1 left-1 z-10 px-1.5 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-amber-500/40 text-amber-300 hover:text-white hover:bg-amber-500 hover:border-amber-400 text-[9px] font-bold flex items-center gap-1 shadow-md transition-all active:scale-90"
                          title="View video revenue and analytics"
                        >
                          <BarChart3 className="w-2.5 h-2.5" />
                          <span>Stats</span>
                        </button>

                        {/* Creator Quick Edit / Delete Overlay Trigger */}
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditVideo(e, video)}
                          className="absolute top-1 right-1 z-10 px-1.5 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/20 text-neutral-200 hover:text-white hover:bg-amber-500 hover:border-amber-400 text-[9px] font-bold flex items-center gap-1 shadow-md transition-all active:scale-90"
                          title="Edit details (title, hashtags, caption) or delete video"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          <span>Edit</span>
                        </button>

                        <div className="absolute bottom-1 inset-x-1 bg-black/80 backdrop-blur-md rounded-md px-1 py-0.5 flex items-center justify-between text-[9px] border border-amber-500/30">
                          <div className="flex items-center gap-0.5 text-amber-300 font-bold truncate">
                            <Coins className="w-2.5 h-2.5 shrink-0" />
                            <span>{(video.stats?.tipsTotalGHS || 0).toFixed(0)}</span>
                          </div>
                          <div className="flex items-center gap-0.5 text-neutral-300">
                            <Eye className="w-2.5 h-2.5 shrink-0" />
                            <span>{video.stats?.views > 999 ? `${((video.stats?.views || 0) / 1000).toFixed(1)}k` : (video.stats?.views || 0)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`py-8 text-center text-xs flex flex-col items-center gap-2.5 rounded-2xl border p-6 ${
                    theme === 'light' ? 'bg-white border-slate-200 text-slate-500 shadow-sm' : 'bg-neutral-900/40 border-neutral-800 text-neutral-400'
                  }`}>
                    <Video className="w-8 h-8 text-neutral-400" />
                    <div>
                      <p className={`font-bold text-xs ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>No Videos Published Yet</p>
                      <p className={`text-[11px] mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-neutral-500'}`}>Share your first vertical creation and start earning micro-tips in Cedis!</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('create')}
                      className={`px-4 py-2 font-black rounded-xl text-xs shadow-md active:scale-95 transition-all ${
                        theme === 'light' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-white hover:bg-neutral-100 text-black'
                      }`}
                    >
                      + Create in Studio
                    </button>
                  </div>
                )
              )}

              {activeTab === 'saved' && (
                savedVideos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {savedVideos.map((video) => (
                      <div
                        key={video.id}
                        onClick={() => handleSelectVideo(video)}
                        className="relative aspect-[9/14] bg-neutral-900 rounded-xl overflow-hidden cursor-pointer group border border-amber-500/20"
                      >
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute top-1 right-1 bg-black/75 p-1 rounded-full border border-amber-500/40">
                          <Bookmark className="w-3 h-3 text-amber-400 fill-amber-400" />
                        </div>
                        <div className="absolute bottom-1 inset-x-1 bg-black/80 backdrop-blur-md rounded-md px-1 py-0.5 flex items-center justify-between text-[9px] border border-amber-500/20">
                          <span className="text-[9px] font-bold text-white truncate">{video.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`py-8 text-center text-xs flex flex-col items-center gap-2.5 rounded-2xl border p-6 ${
                    theme === 'light' ? 'bg-white border-slate-200 text-slate-500 shadow-sm' : 'bg-neutral-900/40 border-neutral-800 text-neutral-400'
                  }`}>
                    <Bookmark className="w-8 h-8 text-amber-500/60" />
                    <div>
                      <p className={`font-bold text-xs ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>No Saved Videos</p>
                      <p className={`text-[11px] mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-neutral-500'}`}>Videos you bookmark from the feed will appear here for easy replay and downloading.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('feed')}
                      className={`px-4 py-2 font-bold rounded-xl text-xs transition-colors ${
                        theme === 'light' ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                      }`}
                    >
                      Explore Feed
                    </button>
                  </div>
                )
              )}

              {activeTab === 'liked' && (
                likedVideos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {likedVideos.map((video) => (
                      <div
                        key={video.id}
                        onClick={() => handleSelectVideo(video)}
                        className="relative aspect-[9/14] bg-neutral-900 rounded-xl overflow-hidden cursor-pointer group"
                      >
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute top-1 right-1 bg-black/70 p-1 rounded-full">
                          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`py-8 text-center text-xs flex flex-col items-center gap-2.5 rounded-2xl border p-6 ${
                    theme === 'light' ? 'bg-white border-slate-200 text-slate-500 shadow-sm' : 'bg-neutral-900/40 border-neutral-800 text-neutral-400'
                  }`}>
                    <Heart className="w-8 h-8 text-rose-400" />
                    <div>
                      <p className={`font-bold text-xs ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>No Liked Videos</p>
                      <p className={`text-[11px] mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-neutral-500'}`}>Videos you like will appear here for easy replay.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('feed')}
                      className={`px-4 py-2 font-bold rounded-xl text-xs transition-colors ${
                        theme === 'light' ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                      }`}
                    >
                      Browse Feed
                    </button>
                  </div>
                )
              )}

              {activeTab === 'unlocked' && (
                unlockedVideos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {unlockedVideos.map((video) => (
                      <div
                        key={video.id}
                        onClick={() => handleSelectVideo(video)}
                        className="relative aspect-[9/14] bg-neutral-900 rounded-xl overflow-hidden cursor-pointer group border border-emerald-500/40"
                      >
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute top-1 right-1 bg-emerald-500 text-neutral-950 p-1 rounded-full shadow-md">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`py-8 text-center text-xs flex flex-col items-center gap-2.5 rounded-2xl border p-6 ${
                    theme === 'light' ? 'bg-white border-slate-200 text-slate-500 shadow-sm' : 'bg-neutral-900/40 border-neutral-800 text-neutral-400'
                  }`}>
                    <Lock className="w-8 h-8 text-neutral-400" />
                    <div>
                      <p className={`font-bold text-xs ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>No Unlocked Tutorials</p>
                      <p className={`text-[11px] mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-neutral-500'}`}>Premium masterclasses unlocked with micro-fees will be stored here permanently.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('feed')}
                      className={`px-4 py-2 font-bold rounded-xl text-xs transition-colors ${
                        theme === 'light' ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                      }`}
                    >
                      Browse Masterclasses
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {editProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
          <form
            onSubmit={handleSaveProfile}
            className={`w-full max-w-sm ${
              theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#070E1B] border-neutral-800 text-white'
            } border rounded-3xl p-5 flex flex-col gap-3.5 shadow-2xl max-h-[85vh] overflow-y-auto`}
          >
            <div className={`flex items-center justify-between pb-2 border-b ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
              <h3 className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Edit Profile Details</h3>
              <button
                type="button"
                onClick={() => setEditProfileOpen(false)}
                className={`w-7 h-7 rounded-full ${
                  theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800' : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                } border flex items-center justify-center`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Avatar Selection */}
            <div className={`flex flex-col items-center gap-2.5 py-1 ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0A1628]/60 border-white/5'
            } p-3 rounded-2xl border`}>
              <div 
                onClick={() => modalAvatarInputRef.current?.click()}
                className="relative w-20 h-20 rounded-full p-[2.5px] bg-gradient-to-tr from-[#00B2FE] via-amber-400 to-[#FF9F0A] cursor-pointer group shadow-lg shadow-[#00B2FE]/20"
                title="Click to select a new profile photo"
              >
                <img
                  src={avatarPreview || currentUser.avatar}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                  <span className="text-[9px] font-bold text-white mt-0.5">Upload</span>
                </div>
              </div>

              <input
                ref={modalAvatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileChange}
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => modalAvatarInputRef.current?.click()}
                  className={`px-3.5 py-1.5 ${
                    theme === 'light' ? 'bg-cyan-50 border-cyan-200 text-cyan-700' : 'bg-[#00B2FE]/20 border-[#00B2FE]/50 text-cyan-300'
                  } border rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Upload Picture</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvatarPreview('/default-avatar.jpg');
                    updateUserProfile({ avatar: '/default-avatar.jpg' });
                    sounds.playLikePop();
                    setShareToast('Profile picture reset to default ValuVid logo');
                  }}
                  className={`px-3 py-1.5 ${
                    theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600' : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-400'
                  } border rounded-full text-[11px] font-semibold transition-colors`}
                >
                  Use Default Logo
                </button>
              </div>
            </div>

            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-neutral-400'}`}>
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={`w-full ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500' : 'bg-neutral-900 border-neutral-800 text-white focus:border-amber-400'
                } border rounded-xl px-3 py-2 text-xs focus:outline-none`}
              />
            </div>

            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-neutral-400'}`}>
                Username (@)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
                placeholder="username"
                className={`w-full ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500' : 'bg-neutral-900 border-neutral-800 text-white focus:border-cyan-400'
                } border rounded-xl px-3 py-2 text-xs focus:outline-none font-mono`}
              />
            </div>

            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${theme === 'light' ? 'text-slate-600' : 'text-neutral-400'}`}>
                Bio Description
              </label>
              <textarea
                rows={3}
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                className={`w-full ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500' : 'bg-neutral-900 border-neutral-800 text-white focus:border-amber-400'
                } border rounded-xl px-3 py-2 text-xs focus:outline-none resize-none`}
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 mt-1 ${
                theme === 'light' ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-white hover:bg-neutral-100 text-black'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Profile</span>
            </button>
          </form>
        </div>
      )}

      {/* EDIT VIDEO / CONTENT MANAGEMENT MODAL */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
          <form
            onSubmit={handleSaveVideoEdit}
            className="w-full max-w-sm bg-[#070E1B] border border-neutral-800 rounded-3xl p-5 flex flex-col gap-3 shadow-2xl text-white max-h-[85vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Manage Video Content</h3>
                  <p className="text-[10px] text-neutral-400">Edit details or remove video</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingVideo(null);
                  setConfirmDeleteId(null);
                }}
                className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Thumbnail Preview Strip */}
            <div className="flex items-center gap-3 bg-neutral-900/60 p-2.5 rounded-2xl border border-neutral-800">
              <img
                src={editingVideo.thumbnailUrl}
                alt={editingVideo.title}
                className="w-12 h-16 rounded-xl object-cover shrink-0 border border-neutral-700"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white truncate">{editingVideo.title}</h4>
                <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-1">
                  <span className="flex items-center gap-0.5 text-amber-300 font-bold">
                    <Coins className="w-2.5 h-2.5" />
                    {(editingVideo.stats?.tipsTotalGHS || 0).toFixed(0)} GHS
                  </span>
                  <span>•</span>
                  <span>{editingVideo.stats?.views || 0} views</span>
                  <span>•</span>
                  <span className="capitalize text-neutral-300">{editingVideo.category}</span>
                </div>
              </div>
            </div>

            {/* Field: Title */}
            <div>
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                Video Title / Hook
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Give your video an engaging title"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            {/* Field: Caption */}
            <div>
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                Caption / Description
              </label>
              <textarea
                rows={3}
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="What is this video about?"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            {/* Field: Hashtags */}
            <div>
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                Hashtags (separated by spaces)
              </label>
              <input
                type="text"
                value={editHashtags}
                onChange={(e) => setEditHashtags(e.target.value)}
                placeholder="#valuvid #creator #ghana #tech"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Field: Category */}
            <div>
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                Category
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['ghana', 'tech', 'fashion', 'education', 'trending', 'bounties'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setEditCategory(cat)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold capitalize transition-all ${
                      editCategory === cat
                        ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                        : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Delete Confirmation Box if triggered */}
            {confirmDeleteId === editingVideo.id ? (
              <div className="bg-rose-950/70 border border-rose-500/50 rounded-2xl p-3 flex flex-col gap-2 animate-fade-in">
                <div className="flex items-center gap-1.5 text-rose-300 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Permanently delete this video?</span>
                </div>
                <p className="text-[10px] text-neutral-300">
                  This action cannot be undone. The video will be removed from feeds and your channel.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteVideo(editingVideo.id)}
                    className="flex-1 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-md shadow-rose-600/30 flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
              {confirmDeleteId !== editingVideo.id && (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(editingVideo.id)}
                  className="px-3 py-2.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-bold transition-colors flex items-center gap-1.5 active:scale-95"
                  title="Delete Video"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isSavingEdit}
                className="flex-1 py-2.5 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSavingEdit ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSavingEdit ? 'Saving Changes...' : 'Save & Resave'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MILESTONE CERTIFICATE MODAL */}
      <MilestoneCertificateModal
        certificate={selectedCertificate}
        onClose={() => setSelectedCertificate(null)}
        onShareToast={(msg) => setShareToast(msg)}
      />

      {/* PROFILE SHARE & QR CODE MODAL */}
      <ProfileShareModal
        isOpen={profileShareOpen}
        onClose={() => setProfileShareOpen(false)}
        user={currentUser}
        onToast={(msg) => setShareToast(msg)}
      />
    </div>
  );
};