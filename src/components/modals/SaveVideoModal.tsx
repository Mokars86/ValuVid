import React, { useState } from 'react';
import { 
  X, 
  Bookmark, 
  Download, 
  Check, 
  Copy, 
  Loader2, 
  Film,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { downloadVideoToDevice } from '../../utils/downloadHelper';

export const SaveVideoModal: React.FC = () => {
  const { 
    saveModalVideo, 
    closeSaveModal, 
    isSaved, 
    toggleSaveVideo, 
    setShareToast 
  } = useApp();

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  if (!saveModalVideo) return null;

  const bookmarked = isSaved(saveModalVideo.id);

  const handleToggleBookmark = () => {
    toggleSaveVideo(saveModalVideo);
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadMsg('Downloading MP4 to device...');

    const result = await downloadVideoToDevice(
      saveModalVideo.videoUrl,
      saveModalVideo.title,
      (status) => setDownloadMsg(status)
    );

    setIsDownloading(false);
    if (result.success) {
      setDownloadSuccess(true);
      setShareToast(result.message);
      setTimeout(() => {
        setDownloadSuccess(false);
        setDownloadMsg('');
      }, 3500);
    } else {
      setShareToast(result.message);
      setDownloadMsg(result.message);
      setTimeout(() => setDownloadMsg(''), 4000);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `https://valuvid.app/v/${saveModalVideo.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setLinkCopied(true);
    setShareToast('Video link copied to clipboard! 📋');
    setTimeout(() => setLinkCopied(false), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none"
      onClick={closeSaveModal}
    >
      <div 
        className="w-full max-w-sm bg-[#080E1C] border border-cyan-500/30 rounded-3xl p-5 flex flex-col gap-4 shadow-2xl text-white max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Bookmark className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Save Video</h3>
              <p className="text-[10px] text-neutral-400">Choose how you want to save this video</p>
            </div>
          </div>
          <button
            onClick={closeSaveModal}
            className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white active:scale-95 transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Preview Card */}
        <div className="flex items-center gap-3 bg-neutral-950/70 p-2.5 rounded-2xl border border-white/10">
          <img
            src={saveModalVideo.thumbnailUrl}
            alt={saveModalVideo.title}
            className="w-12 h-16 rounded-xl object-cover shrink-0 border border-white/10"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white truncate">{saveModalVideo.title}</h4>
            <p className="text-[11px] text-cyan-400 font-medium truncate">@{saveModalVideo.creator?.username}</p>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-400">
              <span className="flex items-center gap-1">
                <Film className="w-3 h-3 text-amber-400" />
                HD MP4
              </span>
              <span>•</span>
              <span>{(saveModalVideo.stats?.views || 0).toLocaleString()} views</span>
            </div>
          </div>
        </div>

        {/* Option 1: Bookmark to Profile */}
        <button
          onClick={handleToggleBookmark}
          className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.98] ${
            bookmarked 
              ? 'bg-amber-500/15 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
              : 'bg-neutral-900/80 border-white/10 hover:border-amber-500/40 hover:bg-neutral-800/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              bookmarked ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-amber-400 border border-white/10'
            }`}>
              <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-black' : ''}`} />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                {bookmarked ? 'Saved in Profile Bookmarks' : 'Save to In-App Bookmarks'}
                {bookmarked && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <div className="text-[10px] text-neutral-400">
                {bookmarked 
                  ? 'Saved! Tap to remove from your saved collection.' 
                  : 'Replay anytime in your Profile Saved collection.'}
              </div>
            </div>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
            bookmarked
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-neutral-800 text-neutral-300 border-white/10'
          }`}>
            {bookmarked ? 'Saved' : 'Bookmark'}
          </span>
        </button>

        {/* Option 2: Download to Phone Gallery */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.98] ${
            downloadSuccess
              ? 'bg-emerald-500/15 border-emerald-500/50'
              : 'bg-neutral-900/80 border-cyan-500/30 hover:border-cyan-400 hover:bg-neutral-800/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              downloadSuccess 
                ? 'bg-emerald-500 text-black' 
                : 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-400'
            }`}>
              {isDownloading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : downloadSuccess ? (
                <Check className="w-5 h-5" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                Download to Device Gallery
                <span className="text-[9px] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 px-1 py-0.2 rounded font-bold">
                  MP4
                </span>
              </div>
              <div className="text-[10px] text-neutral-400">
                {downloadMsg || 'Save video directly to phone storage / camera roll'}
              </div>
            </div>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
            downloadSuccess 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
          }`}>
            {isDownloading ? 'Saving...' : downloadSuccess ? 'Downloaded' : 'Download'}
          </span>
        </button>

        {/* Option 3: Copy Video Link */}
        <button
          onClick={handleCopyLink}
          className="w-full p-3 rounded-2xl bg-neutral-900/60 border border-white/5 hover:border-white/20 flex items-center justify-between transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-300">
              {linkCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-neutral-200">
                {linkCopied ? 'Link Copied!' : 'Copy Video Link'}
              </div>
              <div className="text-[10px] text-neutral-400">https://valuvid.app/v/{saveModalVideo.id}</div>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-amber-400/80" />
        </button>
      </div>
    </div>
  );
};
