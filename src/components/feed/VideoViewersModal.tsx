import React, { useState, useMemo } from 'react';
import { X, Eye, Search, Check, Plus, ShieldCheck, Sparkles, UserCheck } from 'lucide-react';
import { VideoItem, Creator } from '../../types';
import { useApp } from '../../context/AppContext';
import { getUserAvatar } from '../../utils/userDirectory';
import { formatCompactNumber } from '../../utils/formatNumber';

export interface VideoViewer {
  userId: string;
  username: string;
  name: string;
  avatar: string;
  watchedAt: string;
  watchDurationSec?: number;
}

interface VideoViewersModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoItem | null;
}

export const VideoViewersModal: React.FC<VideoViewersModalProps> = ({
  isOpen,
  onClose,
  video,
}) => {
  const { theme, currentUser, toggleFollowCreator, openCreatorProfile } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  // Read recorded real viewers for this video from localStorage
  const viewers: VideoViewer[] = useMemo(() => {
    if (!video) return [];
    try {
      const stored = localStorage.getItem(`valuvid_viewers_${video.id}`);
      if (stored) {
        const parsed: VideoViewer[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    // If no viewer records exist yet, generate real creator engagement entries if video has views
    const totalViews = video.stats?.views || 1;
    const list: VideoViewer[] = [];

    // Current viewer record
    if (currentUser && currentUser.username) {
      list.push({
        userId: currentUser.id || currentUser.username,
        username: currentUser.username,
        name: currentUser.name || currentUser.username,
        avatar: getUserAvatar(currentUser.avatar, currentUser.username),
        watchedAt: 'Just now',
        watchDurationSec: 15,
      });
    }

    return list;
  }, [video, currentUser]);

  const filteredViewers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/^@/, '');
    if (!q) return viewers;
    return viewers.filter(
      (v) =>
        v.username.toLowerCase().includes(q) ||
        v.name.toLowerCase().includes(q)
    );
  }, [viewers, searchQuery]);

  if (!isOpen || !video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full sm:max-w-md max-h-[85vh] sm:max-h-[80vh] flex flex-col rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          theme === 'light'
            ? 'bg-white border-slate-200'
            : 'bg-neutral-900 border-neutral-800'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          theme === 'light' ? 'border-slate-200 bg-slate-50' : 'border-neutral-800 bg-neutral-950/60'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Eye className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                Video Viewers
              </h3>
              <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                {formatCompactNumber(video.stats?.views || viewers.length)} total {video.stats?.views === 1 ? 'view' : 'views'}
              </p>
            </div>
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

        {/* Video Snapshot Pill */}
        <div className={`px-4 py-2.5 border-b flex items-center gap-3 ${
          theme === 'light' ? 'border-slate-100 bg-amber-50/40' : 'border-neutral-800/80 bg-neutral-900/60'
        }`}>
          <div className="w-10 h-14 rounded-lg overflow-hidden bg-black shrink-0 border border-amber-400/30">
            <img
              src={video.thumbnailUrl || '/default-avatar.svg'}
              alt={video.title}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/default-avatar.svg';
              }}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-semibold truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              {video.title}
            </p>
            <p className={`text-[11px] truncate ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
              @{video.creator?.username}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2">
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
              placeholder="Search viewers by name or handle..."
              className="w-full bg-transparent text-xs focus:outline-none placeholder:text-neutral-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-neutral-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Viewers List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 divide-y divide-neutral-800/20 max-h-96">
          {filteredViewers.length > 0 ? (
            filteredViewers.map((viewer) => {
              const isMe = viewer.username.toLowerCase() === currentUser?.username.toLowerCase();
              return (
                <div
                  key={`${viewer.userId}-${viewer.watchedAt}`}
                  className="py-2.5 flex items-center justify-between gap-3 group"
                >
                  <div 
                    onClick={() => {
                      onClose();
                      openCreatorProfile({
                        id: viewer.userId,
                        username: viewer.username,
                        name: viewer.name,
                        avatar: viewer.avatar,
                      });
                    }}
                    className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                  >
                    <img
                      src={getUserAvatar(viewer.avatar, viewer.name || viewer.username)}
                      alt={viewer.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/default-avatar.svg';
                      }}
                      className="w-10 h-10 rounded-full object-cover border border-amber-500/30 group-hover:scale-105 transition-transform shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-bold truncate ${
                          theme === 'light' ? 'text-slate-900' : 'text-white'
                        }`}>
                          {viewer.name}
                        </span>
                        {isMe && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-amber-500 truncate">
                        @{viewer.username}
                      </p>
                      <p className={`text-[10px] ${theme === 'light' ? 'text-slate-400' : 'text-neutral-500'}`}>
                        Watched {viewer.watchedAt}
                      </p>
                    </div>
                  </div>

                  {!isMe && (
                    <button
                      onClick={() => toggleFollowCreator(viewer.username)}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-sm active:scale-95 transition-all flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                      <span>Follow</span>
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center flex flex-col items-center gap-2">
              <Eye className="w-8 h-8 text-neutral-500/40" />
              <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                {searchQuery ? `No viewers matching "${searchQuery}"` : 'No viewers recorded yet'}
              </p>
              <p className="text-[11px] text-neutral-500">
                Viewers who watch this video appear here in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Record a real viewer when they watch a video
 */
export function recordViewerForVideo(videoId: string, viewer: Partial<Creator> | null): void {
  if (!videoId || !viewer || !viewer.username) return;
  try {
    const key = `valuvid_viewers_${videoId}`;
    const raw = localStorage.getItem(key);
    const existing: VideoViewer[] = raw ? JSON.parse(raw) : [];

    const cleanUsername = viewer.username.toLowerCase().replace(/^@/, '');
    const alreadyRecorded = existing.some((v) => v.username.toLowerCase().replace(/^@/, '') === cleanUsername);

    if (!alreadyRecorded) {
      existing.unshift({
        userId: viewer.id || cleanUsername,
        username: viewer.username,
        name: viewer.name || viewer.username,
        avatar: getUserAvatar(viewer.avatar, viewer.username),
        watchedAt: 'Just now',
        watchDurationSec: 15,
      });
      // Keep up to 100 viewers per video
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 100)));
    }
  } catch {}
}
