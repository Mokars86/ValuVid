import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Heart, 
  Coins, 
  Pin, 
  Sparkles,
  MessageCircle,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { App as CapApp } from '@capacitor/app';

export const CommentDrawer: React.FC = () => {
  const { 
    commentDrawerVideo, 
    closeCommentDrawer, 
    comments, 
    addComment,
    openTipModal,
    authUser,
    isLoggedIn,
    setAuthModalOpen,
    setAuthMode,
    setShareToast,
    theme
  } = useApp();

  const [newCommentText, setNewCommentText] = useState('');
  const [includeTip, setIncludeTip] = useState(false);
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});

  const isLight = theme === 'light';

  // Native phone back button listener for immediate drawer close
  useEffect(() => {
    let listenerHandle: any = null;
    try {
      CapApp.addListener('backButton', () => {
        closeCommentDrawer();
      }).then((handle) => {
        listenerHandle = handle;
      });
    } catch {}

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCommentDrawer();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (listenerHandle && typeof listenerHandle.remove === 'function') {
        listenerHandle.remove();
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeCommentDrawer]);

  const toggleCommentLike = (commentId: string) => {
    setLikedComments((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  if (!commentDrawerVideo) return null;

  const videoComments = comments[commentDrawerVideo.id] || [];

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    if (!authUser && !isLoggedIn) {
      setAuthMode('signup');
      setAuthModalOpen(true);
      setShareToast('Sign in or register to join the discussion!');
      return;
    }

    if (includeTip) {
      // Trigger tip modal with this comment pre-set
      openTipModal(commentDrawerVideo);
      closeCommentDrawer();
      return;
    }

    addComment(commentDrawerVideo.id, newCommentText.trim());
    setNewCommentText('');
  };

  return (
    <div 
      onClick={closeCommentDrawer}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in select-none"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm border rounded-t-3xl sm:rounded-3xl flex flex-col h-[75vh] max-h-[620px] shadow-2xl relative overflow-hidden transition-colors ${
          isLight 
            ? 'bg-white border-slate-200 text-slate-900' 
            : 'bg-neutral-900 border-neutral-800 text-white'
        }`}
      >
        {/* Top Pull Bar for Touch / Mobile */}
        <div 
          onClick={closeCommentDrawer}
          className="w-full flex justify-center pt-2.5 pb-1 cursor-pointer active:opacity-60"
        >
          <div className={`w-12 h-1.5 rounded-full ${isLight ? 'bg-slate-300' : 'bg-neutral-700'}`} />
        </div>

        {/* Drawer Header */}
        <div className={`px-4 pt-1 pb-3 border-b flex items-center justify-between ${
          isLight ? 'border-slate-200' : 'border-neutral-800'
        }`}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeCommentDrawer}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
              }`}
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-amber-500" />
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Comments ({videoComments.length})
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCommentDrawer}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {videoComments.length === 0 ? (
            <div className={`flex-1 flex flex-col items-center justify-center text-center text-xs py-8 ${
              isLight ? 'text-slate-400' : 'text-neutral-500'
            }`}>
              <MessageCircle className={`w-8 h-8 mb-2 ${isLight ? 'text-slate-300' : 'text-neutral-700'}`} />
              <span>No comments yet. Be the first to cheer this creator!</span>
            </div>
          ) : (
            videoComments.map((comment) => (
              <div
                key={comment.id}
                className={`flex gap-3 p-2.5 rounded-2xl transition-colors border ${
                  comment.isPinned
                    ? (isLight ? 'bg-amber-50/80 border-amber-300' : 'bg-amber-500/10 border-amber-500/30')
                    : comment.tipAmountGHS
                    ? (isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-neutral-950 border-amber-400/20')
                    : (isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/60 border-neutral-800/60')
                }`}
              >
                <img
                  src={comment.user.avatar}
                  alt={comment.user.username}
                  className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                />

                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        @{comment.user.username}
                      </span>

                      {comment.isPinned && (
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isLight ? 'text-amber-800 bg-amber-100 border-amber-300' : 'text-amber-400 bg-amber-950 border-amber-800'
                        }`}>
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      )}

                      {/* Golden Tipper Badge */}
                      {comment.tipAmountGHS && (
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isLight ? 'text-amber-800 bg-amber-100 border-amber-300' : 'text-amber-300 bg-amber-500/20 border-amber-400/40'
                        }`}>
                          <Coins className="w-3 h-3 text-amber-500" />
                          Tipped GHS {comment.tipAmountGHS.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <span className={`text-xs ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      {comment.createdAt}
                    </span>
                  </div>

                  <p className={`text-sm min-[380px]:text-[15px] leading-relaxed break-words ${isLight ? 'text-slate-800' : 'text-neutral-100'}`}>
                    {comment.text}
                  </p>

                  <div className={`flex items-center gap-4 text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                    <button 
                      type="button"
                      onClick={() => toggleCommentLike(comment.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        likedComments[comment.id] ? 'text-rose-500 font-bold' : 'hover:text-rose-400'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${likedComments[comment.id] ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{(comment.likes || 0) + (likedComments[comment.id] ? 1 : 0)}</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setNewCommentText(`@${comment.user.username} `)}
                      className={isLight ? 'hover:text-slate-900 font-medium' : 'hover:text-white'}
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment input footer - Elevated above Android Back Arrow / Home Navigation Bar */}
        <form
          onSubmit={handlePostComment}
          className={`p-3 pt-2.5 border-t flex flex-col gap-2 transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-neutral-950 border-neutral-800'
          }`}
          style={{
            paddingBottom: 'max(2.5rem, calc(env(safe-area-inset-bottom, 2.5rem) + 1.25rem))'
          }}
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add a comment... (or tip to highlight!)"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className={`flex-1 rounded-xl px-3.5 py-2.5 text-sm min-[380px]:text-[15px] focus:outline-none ${
                isLight 
                  ? 'bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500' 
                  : 'bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:border-amber-400'
              }`}
            />
            <button
              type="submit"
              disabled={!newCommentText.trim()}
              className="w-10 h-10 rounded-xl bg-amber-500 disabled:bg-neutral-800 text-neutral-950 disabled:text-neutral-500 flex items-center justify-center font-bold active:scale-95 transition-transform shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] px-1">
            <button
              type="button"
              onClick={() => {
                openTipModal(commentDrawerVideo);
                closeCommentDrawer();
              }}
              className={`flex items-center gap-1.5 font-bold hover:underline ${
                isLight ? 'text-amber-700' : 'text-amber-400'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Attach Valu-Tip to comment</span>
            </button>
            <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>Fast & moderated</span>
          </div>
        </form>
      </div>
    </div>
  );
};
