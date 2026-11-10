import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Coins, 
  MessageCircle, 
  Send, 
  Sparkles,
  ExternalLink,
  Globe,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCompactNumber } from '../../utils/formatNumber';
import { buildVideoShareUrl } from '../../utils/urlHelper';

export const ShareModal: React.FC = () => {
  const { shareModalVideo, closeShareModal, currentUser, incrementShareCount, setShareToast, openAnalytics, theme } = useApp();
  const [copied, setCopied] = useState(false);

  if (!shareModalVideo) return null;

  const isLight = theme === 'light';

  const shareUrl = buildVideoShareUrl(shareModalVideo.id, currentUser?.username);
  const shareText = `Watch "${shareModalVideo.title}" by @${shareModalVideo.creator?.username} on ValuVid 🇬🇭✨`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setCopied(true);
    incrementShareCount(shareModalVideo.id);
    setShareToast('Curator referral link copied to clipboard! 📋');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareModalVideo.title,
          text: shareText,
          url: shareUrl,
        });
        incrementShareCount(shareModalVideo.id);
        closeShareModal();
      } catch (err) {
        // User dismissed native share sheet
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSocialShare = (platform: 'whatsapp' | 'twitter' | 'telegram' | 'facebook') => {
    incrementShareCount(shareModalVideo.id);
    let url = '';
    if (platform === 'whatsapp') {
      url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    } else if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    } else if (platform === 'telegram') {
      url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    } else if (platform === 'facebook') {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      setShareToast(`Sharing via ${platform.toUpperCase()}! 🚀`);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${isLight ? 'bg-black/60' : 'bg-black/85'} backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none`}>
      <div className={`w-full max-w-sm ${
        isLight ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' : 'bg-[#070E1B] border-cyan-500/30 text-white shadow-2xl'
      } border rounded-3xl p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-slate-200' : 'border-neutral-800'}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-500">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Share Video & Earn</h3>
              <p className={`text-[10px] font-semibold ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>+5% Curator Reward Active</p>
            </div>
          </div>
          <button
            onClick={closeShareModal}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              isLight ? 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Card Summary */}
        <div className={`flex items-center gap-3 p-2.5 rounded-2xl border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/70 border-neutral-800'
        }`}>
          <img
            src={shareModalVideo.thumbnailUrl}
            alt={shareModalVideo.title}
            className="w-12 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
          />
          <div className="min-w-0 flex-1">
            <h4 className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{shareModalVideo.title}</h4>
            <div className={`text-[10px] mt-0.5 truncate ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              by @{shareModalVideo.creator?.username}
            </div>
            <div className={`flex items-center gap-2 text-[9px] mt-1 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              <span className={`font-bold ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>{formatCompactNumber(shareModalVideo.stats?.shares || 0)} shares</span>
              <span>•</span>
              <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>GHS {(shareModalVideo.stats?.tipsTotalGHS || 0).toFixed(1)} Tips</span>
            </div>
          </div>
        </div>

        {/* Curator 5% Commission Callout */}
        <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
          isLight 
            ? 'bg-cyan-50/80 border-cyan-200 text-slate-700' 
            : 'bg-gradient-to-r from-cyan-950/70 via-blue-950/60 to-neutral-950 border-cyan-500/40 text-neutral-300'
        }`}>
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-600 shrink-0 mt-0.5">
            <Coins className="w-4 h-4" />
          </div>
          <div className="text-[11px] leading-snug">
            <strong className={isLight ? 'text-cyan-800 font-bold' : 'text-cyan-300'}>5% Curator Split:</strong> Share with friends! Whenever viewers watch or send Mobile Money tips to this creator through your link, you instantly earn <strong className={isLight ? 'text-amber-800 font-bold' : 'text-amber-300'}>5% commission</strong> into your ValuWallet.
          </div>
        </div>

        {/* Social Share Grid */}
        <div>
          <span className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${isLight ? 'text-slate-700' : 'text-neutral-400'}`}>
            Share To
          </span>
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleSocialShare('whatsapp')}
              className={`flex flex-col items-center gap-1 p-2 rounded-2xl border transition-all active:scale-95 ${
                isLight 
                  ? 'bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-400' 
                  : 'bg-neutral-950 hover:bg-emerald-950/40 border-neutral-800 hover:border-emerald-500/50'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-medium ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => handleSocialShare('twitter')}
              className={`flex flex-col items-center gap-1 p-2 rounded-2xl border transition-all active:scale-95 ${
                isLight 
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300' 
                  : 'bg-neutral-950 hover:bg-neutral-900 border-neutral-800 hover:border-white/40'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                isLight ? 'bg-slate-200 text-slate-900' : 'bg-white/10 text-white'
              }`}>
                𝕏
              </div>
              <span className={`text-[10px] font-medium ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>X / Post</span>
            </button>

            <button
              type="button"
              onClick={() => handleSocialShare('telegram')}
              className={`flex flex-col items-center gap-1 p-2 rounded-2xl border transition-all active:scale-95 ${
                isLight 
                  ? 'bg-slate-50 hover:bg-blue-50 border-slate-200 hover:border-blue-400' 
                  : 'bg-neutral-950 hover:bg-blue-950/40 border-neutral-800 hover:border-blue-500/50'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-medium ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>Telegram</span>
            </button>

            <button
              type="button"
              onClick={() => handleSocialShare('facebook')}
              className={`flex flex-col items-center gap-1 p-2 rounded-2xl border transition-all active:scale-95 ${
                isLight 
                  ? 'bg-slate-50 hover:bg-indigo-50 border-slate-200 hover:border-indigo-400' 
                  : 'bg-neutral-950 hover:bg-indigo-950/40 border-neutral-800 hover:border-indigo-500/50'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center font-black">
                f
              </div>
              <span className={`text-[10px] font-medium ${isLight ? 'text-slate-800' : 'text-neutral-200'}`}>Facebook</span>
            </button>
          </div>
        </div>

        {/* Copy Link Input Bar */}
        <div className={`flex items-center gap-2 p-2 rounded-2xl border ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-neutral-950 border-neutral-800'
        }`}>
          <input
            type="text"
            readOnly
            value={shareUrl}
            className={`flex-1 bg-transparent text-[11px] font-mono px-2 focus:outline-none truncate ${
              isLight ? 'text-slate-700' : 'text-neutral-300'
            }`}
          />
          <button
            type="button"
            onClick={handleCopyLink}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              copied
                ? 'bg-emerald-500 text-neutral-950'
                : (isLight
                    ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                    : 'bg-white hover:bg-neutral-100 text-black active:scale-95')
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 stroke-[3] text-inherit" /> : <Copy className="w-3.5 h-3.5 text-inherit" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Video Revenue & Analytics Shortcut */}
        <button
          type="button"
          onClick={() => {
            const vid = shareModalVideo;
            closeShareModal();
            setTimeout(() => openAnalytics(vid), 150);
          }}
          className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left group active:scale-[0.98] ${
            isLight
              ? 'bg-slate-50 border-amber-300/80 hover:border-amber-500 hover:bg-white shadow-sm'
              : 'bg-neutral-900/80 border-amber-500/30 hover:border-amber-400 hover:bg-neutral-800/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Video Revenue & Analytics
                <span className="text-[9px] bg-amber-500/20 text-amber-700 border border-amber-500/30 px-1 py-0.2 rounded font-bold">
                  Stats
                </span>
              </div>
              <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                {formatCompactNumber(shareModalVideo.stats?.views || 0)} views • GHS {(shareModalVideo.stats?.tipsTotalGHS || 0).toFixed(2)} earned
              </div>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 transition-colors ${isLight ? 'text-slate-400 group-hover:text-amber-600' : 'text-neutral-500 group-hover:text-amber-400'}`} />
        </button>

        {/* Native Web Share fallback button if supported */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            type="button"
            onClick={handleNativeShare}
            className={`w-full py-2.5 rounded-xl border text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-500" />
            <span>More Device Sharing Options...</span>
          </button>
        )}
      </div>
    </div>
  );
};
