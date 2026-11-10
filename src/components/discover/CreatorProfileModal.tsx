import React, { useState, useMemo } from 'react';
import { 
  X, 
  Check, 
  UserPlus, 
  UserCheck, 
  Share2, 
  Play, 
  Eye, 
  Heart, 
  Sparkles, 
  Film, 
  BadgeCheck 
} from 'lucide-react';
import { VideoItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCompactNumber } from '../../utils/formatNumber';
import { ProfileShareModal } from '../profile/ProfileShareModal';
import { FollowersListModal } from '../profile/FollowersListModal';
import { VideoViewersModal } from '../feed/VideoViewersModal';
import { sounds } from '../../utils/soundEffects';
import { getUserAvatar } from '../../utils/userDirectory';
import { fetchUserProfileFromSupabase, getDeletedVideoIds } from '../../services/supabaseClient';

interface CreatorProfileModalProps {
  creator: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    bio?: string;
    verified?: boolean;
    followers?: number;
    following?: number;
    isFollowing?: boolean;
    videoCount?: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo: (video: VideoItem) => void;
}

export const CreatorProfileModal: React.FC<CreatorProfileModalProps> = ({
  creator,
  isOpen,
  onClose,
  onSelectVideo,
}) => {
  const { videos, currentUser, toggleFollowCreator, theme, setShareToast } = useApp();
  const [showShareModal, setShowShareModal] = useState(false);
  const [followersListOpen, setFollowersListOpen] = useState(false);
  const [followersListTab, setFollowersListTab] = useState<'followers' | 'following'>('followers');
  const [viewersModalVideo, setViewersModalVideo] = useState<VideoItem | null>(null);
  const [liveProfile, setLiveProfile] = useState<{ followers: number; following: number; likes: number } | null>(null);

  // Unconditionally evaluate safe handle & memo hooks to strictly follow React Rules of Hooks
  const cleanUsername = useMemo(() => {
    if (!creator?.username) return '';
    return creator.username.toLowerCase().replace(/^@/, '');
  }, [creator?.username]);

  // Fetch real-time follower/following counts from Supabase when modal opens
  React.useEffect(() => {
    if (cleanUsername && isOpen) {
      fetchUserProfileFromSupabase(cleanUsername).then((p) => {
        if (p) {
          setLiveProfile({
            followers: p.followers,
            following: p.following,
            likes: p.likes,
          });
        }
      }).catch(() => {});
    }
  }, [cleanUsername, isOpen]);

  const isMe = useMemo(() => {
    if (!currentUser?.username || !cleanUsername) return false;
    return currentUser.username.toLowerCase().replace(/^@/, '') === cleanUsername;
  }, [currentUser?.username, cleanUsername]);

  const isCurrentlyFollowing = useMemo(() => {
    if (isMe || !creator) return false;
    try {
      const followed: string[] = JSON.parse(localStorage.getItem('valuvid_followed_creators') || '[]');
      const hasFollowed =
        (creator.id && followed.includes(creator.id)) ||
        (creator.username && (followed.includes(creator.username) || followed.includes(creator.username.toLowerCase()))) ||
        (cleanUsername && followed.includes(cleanUsername));
      return Boolean(hasFollowed || creator.isFollowing);
    } catch {
      return Boolean(creator.isFollowing);
    }
  }, [isMe, creator, cleanUsername]);

  const creatorVideos = useMemo(() => {
    if (!cleanUsername) return [];
    const deletedIds = getDeletedVideoIds();
    return videos.filter((v) => {
      const u = (v.creator?.username || '').toLowerCase().replace(/^@/, '');
      return (
        u === cleanUsername &&
        v.id !== 'vid-user-1793960000000' &&
        !v.id.startsWith('test-') &&
        !deletedIds.includes(v.id) &&
        v.caption !== '[USER_REGISTRY]' &&
        (v.category as string) !== 'user_registry' &&
        v.caption !== '[DELETED]' &&
        (v.category as string) !== 'deleted' &&
        !(v.title || '').includes('[DELETED]')
      );
    });
  }, [videos, cleanUsername]);

  const totalViews = useMemo(() => {
    return creatorVideos.reduce((acc, v) => acc + (v.stats?.views || 0), 0);
  }, [creatorVideos]);

  const totalLikes = useMemo(() => {
    if (liveProfile && typeof liveProfile.likes === 'number') {
      return liveProfile.likes;
    }
    return creatorVideos.reduce((acc, v) => acc + (v.stats?.likes || 0), 0);
  }, [creatorVideos, liveProfile]);

  const displayedFollowers = useMemo(() => {
    if (liveProfile && typeof liveProfile.followers === 'number') {
      return liveProfile.followers;
    }
    if (!creator) return 0;
    const base = typeof creator.followers === 'number' ? Math.max(0, creator.followers) : 0;
    return isCurrentlyFollowing ? Math.max(1, base) : Math.max(0, base);
  }, [creator, isCurrentlyFollowing, liveProfile]);

  const displayedFollowing = useMemo(() => {
    if (liveProfile && typeof liveProfile.following === 'number') {
      return liveProfile.following;
    }
    if (!creator) return 0;
    return typeof creator.following === 'number' ? Math.max(0, creator.following) : 0;
  }, [creator, liveProfile]);

  // Early return safely AFTER all React hooks have executed
  if (!isOpen || !creator) {
    return null;
  }

  const isLight = theme === 'light';
  const displayName = creator.name || creator.username || 'ValuVid Creator';
  const displayAvatar = getUserAvatar(creator.avatar, displayName || cleanUsername);

  const handleFollowClick = () => {
    sounds.playLikePop();
    toggleFollowCreator(creator.id || creator.username);
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 select-none animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className={`w-full max-w-md md:max-w-xl lg:max-w-2xl h-[90vh] sm:h-[86vh] ${
          isLight ? 'bg-white text-slate-900 border-slate-200' : 'bg-[#0A0D14] text-white border-neutral-800'
        } border rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl relative z-10`}
      >
        {/* Top Header Bar */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${isLight ? 'border-slate-100 bg-slate-50/90' : 'border-neutral-900 bg-neutral-950/90'} backdrop-blur-md z-10 shrink-0`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className={`text-xs font-bold font-mono truncate ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
              @{creator.username}
            </span>
            {creator.verified && (
              <span className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/30">
                <BadgeCheck className="w-3 h-3 text-amber-500" />
                VERIFIED
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className={`p-2 rounded-full transition-colors ${
                isLight ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-700' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
              }`}
              title="Share Profile Link"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                isLight ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-700' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Creator Profile Hero Banner */}
          <div className={`relative px-5 pt-6 pb-4 flex flex-col items-center text-center border-b ${
            isLight ? 'bg-gradient-to-b from-amber-500/10 via-white to-white border-slate-100' : 'bg-gradient-to-b from-amber-500/10 via-neutral-950 to-[#0A0D14] border-neutral-900'
          }`}>
            <div className="relative mb-3">
              <img
                src={displayAvatar}
                alt={displayName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-amber-500 shadow-xl shadow-amber-500/20"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = getUserAvatar(undefined, displayName || cleanUsername);
                }}
              />
              {creator.verified && (
                <div className="absolute bottom-1 right-1 bg-amber-500 text-neutral-950 rounded-full p-1 shadow-md">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            <h2 className={`text-lg font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {displayName}
            </h2>
            <p className={`text-xs font-mono mt-0.5 ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
              @{creator.username}
            </p>

            <p className={`text-xs mt-2.5 max-w-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>
              {creator.bio || 'ValuVid Content Creator 🇬🇭✨'}
            </p>

            {/* Follow / Share Action Buttons */}
            <div className="flex items-center gap-2.5 mt-4 w-full max-w-xs">
              {!isMe && (
                <button
                  onClick={handleFollowClick}
                  className={`flex-1 py-2.5 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer ${
                    isCurrentlyFollowing
                      ? 'bg-neutral-800/90 hover:bg-neutral-700/90 text-emerald-400 border border-emerald-500/30'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 shadow-amber-500/20'
                  }`}
                  title={isCurrentlyFollowing ? 'Click to unfollow' : 'Follow Creator'}
                >
                  {isCurrentlyFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 stroke-[2.5]" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 stroke-[2.5]" />
                      <span>Follow Creator</span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => setShowShareModal(true)}
                className={`py-2.5 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800' 
                    : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-200'
                }`}
              >
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Share</span>
              </button>
            </div>

            {/* Metrics Counter Bar (Compact Formatted & Interactive) */}
            <div className={`grid grid-cols-4 gap-2 w-full mt-5 p-3 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900/60 border-neutral-800'
            }`}>
              <button 
                onClick={() => {
                  setFollowersListTab('followers');
                  setFollowersListOpen(true);
                }}
                className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity active:scale-95"
                title="View Followers list"
              >
                <span className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {formatCompactNumber(displayedFollowers)}
                </span>
                <span className={`text-[10px] font-medium uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Followers
                </span>
              </button>

              <button 
                onClick={() => {
                  setFollowersListTab('following');
                  setFollowersListOpen(true);
                }}
                className="flex flex-col items-center border-l border-neutral-700/30 cursor-pointer hover:opacity-80 transition-opacity active:scale-95"
                title="View Following list"
              >
                <span className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {formatCompactNumber(displayedFollowing)}
                </span>
                <span className={`text-[10px] font-medium uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Following
                </span>
              </button>

              <div className="flex flex-col items-center border-l border-neutral-700/30">
                <span className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {formatCompactNumber(creatorVideos.length)}
                </span>
                <span className={`text-[10px] font-medium uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Videos
                </span>
              </div>

              <div className="flex flex-col items-center border-l border-neutral-700/30">
                <span className={`text-sm font-black ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>
                  {formatCompactNumber(totalViews)}
                </span>
                <span className={`text-[10px] font-medium uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Views
                </span>
              </div>
            </div>
          </div>

          {/* Videos Grid Section Header */}
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-500" />
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                Videos by @{creator.username} ({creatorVideos.length})
              </h3>
            </div>
          </div>

          {/* Videos Grid */}
          {creatorVideos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 px-4 pb-6">
              {creatorVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => {
                    onSelectVideo(video);
                    onClose();
                  }}
                  className={`group relative rounded-2xl overflow-hidden aspect-[9/14] border cursor-pointer transition-all active:scale-[0.98] ${
                    isLight 
                      ? 'bg-slate-100 border-slate-200 hover:border-amber-400 shadow-sm' 
                      : 'bg-neutral-900 border-neutral-800 hover:border-amber-500/60 shadow-md'
                  }`}
                >
                  <img
                    src={video.thumbnailUrl || '/default-thumbnail.jpg'}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-2.5">
                    <p className="text-white text-xs font-bold line-clamp-2 leading-snug drop-shadow-sm">
                      {video.title}
                    </p>

                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-neutral-300">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewersModalVideo(video);
                        }}
                        className="flex items-center gap-1 font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer active:scale-90 transition-all p-0.5 rounded"
                        title="See who watched this video"
                      >
                        <Eye className="w-3 h-3 text-cyan-400" />
                        {formatCompactNumber(video.stats?.views || 0)}
                      </button>

                      <span className="flex items-center gap-1 font-semibold text-rose-400">
                        <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                        {formatCompactNumber(video.stats?.likes || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Play Hover Pill */}
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white opacity-85 group-hover:opacity-100 group-hover:scale-110 transition-all">
                    <Play className="w-3 h-3 fill-white ml-0.5" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
                isLight ? 'bg-slate-100 text-slate-400' : 'bg-neutral-900 text-neutral-500'
              }`}>
                <Film className="w-7 h-7" />
              </div>
              <p className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>
                No Videos Uploaded Yet
              </p>
              <p className={`text-xs mt-1 max-w-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                @{creator.username} is a registered creator on ValuVid. Follow them to be notified when they publish their next creation!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Profile Share Modal */}
      {showShareModal && (
        <ProfileShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          user={{
            name: displayName,
            username: creator.username,
            avatar: displayAvatar,
            verified: creator.verified,
            bio: creator.bio,
          }}
          onToast={setShareToast}
        />
      )}

      {/* Followers & Following List Modal */}
      {followersListOpen && (
        <FollowersListModal
          isOpen={followersListOpen}
          onClose={() => setFollowersListOpen(false)}
          creatorUsername={creator.username}
          creatorName={displayName}
          initialTab={followersListTab}
        />
      )}

      {/* Video Viewers Modal */}
      <VideoViewersModal
        isOpen={Boolean(viewersModalVideo)}
        video={viewersModalVideo}
        onClose={() => setViewersModalVideo(null)}
      />
    </div>
  );
};
