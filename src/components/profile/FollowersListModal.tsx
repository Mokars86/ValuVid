import React, { useState, useMemo } from 'react';
import { X, Search, Check, Plus, Users, UserCheck } from 'lucide-react';
import { Creator } from '../../types';
import { useApp } from '../../context/AppContext';
import { getUserAvatar } from '../../utils/userDirectory';
import { formatCompactNumber } from '../../utils/formatNumber';
import { fetchFollowersListFromSupabase, fetchFollowingListFromSupabase } from '../../services/supabaseClient';

interface FollowersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'followers' | 'following';
  targetCreator?: Creator | null;
  creatorUsername?: string;
  creatorName?: string;
}

export const FollowersListModal: React.FC<FollowersListModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'following',
  targetCreator,
  creatorUsername,
  creatorName,
}) => {
  const { 
    theme, 
    currentUser, 
    toggleFollowCreator, 
    openCreatorProfile, 
    videos 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  // Target user whose list we are viewing
  const user: Partial<Creator> = useMemo(() => {
    if (targetCreator) return targetCreator;
    if (creatorUsername) {
      return {
        id: `creator_${creatorUsername}`,
        name: creatorName || creatorUsername,
        username: creatorUsername,
        avatar: getUserAvatar(undefined, creatorUsername),
        bio: 'ValuVid Creator 🇬🇭',
        followers: 0,
        following: 0,
        likes: 0,
        totalTipsEarned: 0,
        verified: false,
        isFollowing: false,
      };
    }
    return currentUser;
  }, [targetCreator, creatorUsername, creatorName, currentUser]);

  const isViewingSelf = (user.username || '').toLowerCase() === (currentUser?.username || '').toLowerCase();

  const [remoteFollowers, setRemoteFollowers] = useState<Creator[]>([]);
  const [remoteFollowing, setRemoteFollowing] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch real followers and following from Supabase
  React.useEffect(() => {
    if (!isOpen || !user.username) return;
    setIsLoading(true);
    Promise.all([
      fetchFollowersListFromSupabase(user.username),
      fetchFollowingListFromSupabase(user.username)
    ]).then(([followers, following]) => {
      setRemoteFollowers(followers);
      setRemoteFollowing(following);
    }).catch(() => {}).finally(() => {
      setIsLoading(false);
    });
  }, [isOpen, user.username]);

  // Read current user's followed creators
  const myFollowedSet = useMemo(() => {
    try {
      const list: string[] = JSON.parse(localStorage.getItem('valuvid_followed_creators') || '[]');
      return new Set(list.map((u) => u.toLowerCase().trim().replace(/^@/, '')));
    } catch {
      return new Set<string>();
    }
  }, [currentUser]);

  // Compute following list from real followed users and remote data
  const followingList: Creator[] = useMemo(() => {
    if (remoteFollowing.length > 0) {
      return remoteFollowing.map(u => ({
        ...u,
        isFollowing: myFollowedSet.has(u.username.toLowerCase()) || isViewingSelf,
      }));
    }

    const list: Creator[] = [];
    const seen = new Set<string>();

    myFollowedSet.forEach((username) => {
      if (username && !seen.has(username) && username !== (currentUser?.username || '').toLowerCase()) {
        seen.add(username);
        const matched = videos.find(
          (v) => (v.creator?.username || '').toLowerCase().replace(/^@/, '') === username
        );
        list.push({
          id: matched?.creator?.id || `user_${username}`,
          name: matched?.creator?.name || username.charAt(0).toUpperCase() + username.slice(1),
          username: username,
          avatar: getUserAvatar(matched?.creator?.avatar, username),
          bio: matched?.creator?.bio || 'ValuVid Creator 🇬🇭',
          followers: matched?.creator?.followers || 0,
          following: matched?.creator?.following || 0,
          likes: 0,
          totalTipsEarned: 0,
          verified: matched?.creator?.verified || false,
          isFollowing: true,
        });
      }
    });

    return list;
  }, [myFollowedSet, videos, currentUser, remoteFollowing, isViewingSelf]);

  // Compute followers list (people who follow target user)
  const followersList: Creator[] = useMemo(() => {
    return remoteFollowers.map(u => ({
      ...u,
      isFollowing: myFollowedSet.has(u.username.toLowerCase()),
    }));
  }, [remoteFollowers, myFollowedSet]);

  const currentList = activeTab === 'following' ? followingList : followersList;

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/^@/, '');
    if (!q) return currentList;
    return currentList.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q)
    );
  }, [currentList, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full sm:max-w-md max-h-[85vh] sm:max-h-[80vh] flex flex-col rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          theme === 'light'
            ? 'bg-white border-slate-200'
            : 'bg-neutral-900 border-neutral-800'
        }`}
      >
        {/* TikTok Style Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          theme === 'light' ? 'border-slate-200 bg-slate-50' : 'border-neutral-800 bg-neutral-950/60'
        }`}>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <h3 className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              @{user.username}
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className={`p-1.5 rounded-full transition-colors ${
              theme === 'light' ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-neutral-800 text-neutral-300'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Following vs Followers */}
        <div className={`flex border-b text-xs font-bold ${
          theme === 'light' ? 'border-slate-200 bg-white' : 'border-neutral-800 bg-neutral-900'
        }`}>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-3 text-center transition-all relative ${
              activeTab === 'following'
                ? theme === 'light' ? 'text-amber-600' : 'text-amber-400'
                : theme === 'light' ? 'text-slate-500 hover:text-slate-800' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Following ({formatCompactNumber(followingList.length)})
            {activeTab === 'following' && (
              <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-amber-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-3 text-center transition-all relative ${
              activeTab === 'followers'
                ? theme === 'light' ? 'text-amber-600' : 'text-amber-400'
                : theme === 'light' ? 'text-slate-500 hover:text-slate-800' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Followers ({formatCompactNumber(followersList.length)})
            {activeTab === 'followers' && (
              <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-amber-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Search Filter */}
        <div className="px-4 py-2.5">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
            theme === 'light'
              ? 'bg-slate-100 border-slate-200 text-slate-800'
              : 'bg-neutral-800 border-neutral-700 text-white'
          }`}>
            <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full bg-transparent text-xs focus:outline-none placeholder:text-neutral-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-neutral-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* User Items List */}
        <div className="flex-1 overflow-y-auto px-4 py-1 divide-y divide-neutral-800/20 max-h-96">
          {filteredList.length > 0 ? (
            filteredList.map((creator) => {
              const isMe = creator.username.toLowerCase() === (currentUser?.username || '').toLowerCase();
              const isFollowed = myFollowedSet.has(creator.username.toLowerCase());

              return (
                <div
                  key={creator.id || creator.username}
                  className="py-3 flex items-center justify-between gap-3 group"
                >
                  <div
                    onClick={() => {
                      onClose();
                      openCreatorProfile(creator);
                    }}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <img
                      src={getUserAvatar(creator.avatar, creator.name || creator.username)}
                      alt={creator.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/default-avatar.svg';
                      }}
                      className="w-10 h-10 rounded-full object-cover border border-amber-500/30 group-hover:scale-105 transition-transform shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-xs font-bold truncate ${
                          theme === 'light' ? 'text-slate-900' : 'text-white'
                        }`}>
                          {creator.name}
                        </span>
                        {creator.verified && (
                          <Check className="w-3 h-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-amber-500 truncate">
                        @{creator.username}
                      </p>
                    </div>
                  </div>

                  {!isMe && (
                    <button
                      onClick={() => toggleFollowCreator(creator.username)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer shadow-sm ${
                        isFollowed
                          ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black'
                      }`}
                    >
                      {isFollowed ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center flex flex-col items-center gap-2">
              <Users className="w-10 h-10 text-neutral-500/30" />
              <p className={`text-xs font-semibold ${theme === 'light' ? 'text-slate-600' : 'text-neutral-400'}`}>
                {searchQuery
                  ? `No accounts matching "${searchQuery}"`
                  : activeTab === 'following'
                  ? 'Not following any accounts yet'
                  : 'No followers yet'}
              </p>
              <p className="text-[11px] text-neutral-500 max-w-xs">
                {activeTab === 'following'
                  ? 'Follow creators on the feed or discover tab to see their latest videos.'
                  : 'Share your profile or upload videos to grow your audience!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
