import React, { useState, useRef } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Download, 
  QrCode, 
  ExternalLink, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { sounds } from '../../utils/soundEffects';
import { useApp } from '../../context/AppContext';

interface ProfileShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
    bio?: string;
  };
  onToast: (msg: string) => void;
}

export const ProfileShareModal: React.FC<ProfileShareModalProps> = ({
  isOpen,
  onClose,
  user,
  onToast,
}) => {
  const { theme } = useApp();
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const profileUrl = `https://valuvid.app/@${user.username}`;
  const shareText = `Watch my videos and support me on ValuVid: ${profileUrl} 🎬✨`;

  const handleCopyLink = () => {
    sounds.playLikePop();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl).catch(() => {});
    }
    setCopied(true);
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#00B2FE', '#FF9F0A', '#10B981', '#FFFFFF'],
    });
    onToast(`Profile link copied: ${profileUrl} 📋`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    sounds.playLikePop();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user.name} (@${user.username}) on ValuVid`,
          text: `Check out @${user.username} on ValuVid! Watch short videos and earn micro-rewards.`,
          url: profileUrl,
        });
        onToast('Profile shared successfully! 🚀');
        confetti({ particleCount: 50, spread: 75, origin: { y: 0.5 } });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    sounds.playLikePop();
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `Check out @${user.username} on ValuVid!\n${profileUrl}`
    )}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTwitterShare = () => {
    sounds.playLikePop();
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      `Check out @${user.username} on ValuVid! Short videos & creator rewards 🎬✨`
    )}&url=${encodeURIComponent(profileUrl)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadQr = async () => {
    sounds.playLikePop();
    const canvas = qrCanvasRef.current;
    if (!canvas) {
      onToast('QR Code not ready yet');
      return;
    }

    setIsSaving(true);

    try {
      // Create high-res branded flyer canvas for physical/digital sharing
      const flyerCanvas = document.createElement('canvas');
      flyerCanvas.width = 640;
      flyerCanvas.height = 760;
      const ctx = flyerCanvas.getContext('2d');
      if (!ctx) {
        setIsSaving(false);
        return;
      }

      // Dark background with gradient accent
      ctx.fillStyle = '#070E1B';
      ctx.fillRect(0, 0, 640, 760);

      // Gold / Cyan top banner line
      const grad = ctx.createLinearGradient(0, 0, 640, 0);
      grad.addColorStop(0, '#00B2FE');
      grad.addColorStop(0.5, '#38bdf8');
      grad.addColorStop(1, '#FF9F0A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 8);

      // Creator Name
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(user.name, 320, 60);

      // Handle
      ctx.fillStyle = '#00B2FE';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`@${user.username}`, 320, 95);

      // White rounded card behind QR code
      ctx.fillStyle = '#FFFFFF';
      if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        ctx.roundRect(85, 130, 470, 480, 24);
        ctx.fill();
      } else {
        ctx.fillRect(85, 130, 470, 480);
      }

      // Draw QR Code centered inside the card
      ctx.drawImage(canvas, 120, 160, 400, 400);

      // Card footer caption
      ctx.fillStyle = '#070E1B';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText('Scan on ValuVid to Watch & Tip 🇬🇭', 320, 585);

      // Profile URL
      ctx.fillStyle = '#94A3B8';
      ctx.font = '15px monospace';
      ctx.fillText(profileUrl, 320, 655);

      // Bottom brand note
      ctx.fillStyle = '#FF9F0A';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('ValuVid • Instant MoMo Creator Support', 320, 705);

      flyerCanvas.toBlob(async (blob) => {
        setIsSaving(false);
        if (!blob) return;

        const fileName = `valuvid-qr-${user.username}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        // 1. Android & iOS Native File Share (triggers native "Save Image" / Gallery / Drive sheet)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `${user.name} (@${user.username}) QR Code`,
              text: `Scan to visit my profile and videos on ValuVid: ${profileUrl}`
            });
            onToast('QR Code saved / shared! 📲');
            confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
            return;
          } catch (err: any) {
            if (err.name === 'AbortError') return;
          }
        }

        // 2. Standard Blob Download for web / browsers
        try {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
          onToast('QR Code downloaded! 📲');
          confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
          return;
        } catch {}

        // 3. Fallback: Open image in new window for direct touch save
        const dataUrl = flyerCanvas.toDataURL('image/png');
        const w = window.open('');
        if (w) {
          w.document.write(`<img src="${dataUrl}" alt="ValuVid QR Code" style="width:100%;max-width:400px;margin:20px auto;display:block;"/><p style="text-align:center;font-family:sans-serif;">Long press image to Save</p>`);
        }
      }, 'image/png');
    } catch (err) {
      setIsSaving(false);
      console.warn('Failed to export QR code:', err);
      onToast('Could not export QR code automatically. Please take a screenshot.');
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${isLight ? 'bg-black/60' : 'bg-black/85'} backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none`}>
      <div className={`w-full max-w-sm ${
        isLight 
          ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' 
          : 'bg-gradient-to-b from-[#0B1528] via-[#070D18] to-neutral-950 border-[#00B2FE]/40 text-white shadow-2xl'
      } border rounded-3xl p-5 flex flex-col gap-4 relative overflow-hidden max-h-[92vh] overflow-y-auto`}>
        {/* Subtle Ambient Background Glows */}
        {!isLight && (
          <>
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#00B2FE]/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-[#FF9F0A]/15 rounded-full blur-2xl pointer-events-none" />
          </>
        )}

        {/* Header */}
        <div className={`relative z-10 flex items-center justify-between pb-2 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00B2FE] to-[#FF9F0A] p-[1.5px] shadow-md">
              <div className={`w-full h-full ${isLight ? 'bg-slate-50' : 'bg-[#060D19]'} rounded-[10px] flex items-center justify-center`}>
                <QrCode className="w-4 h-4 text-cyan-500" />
              </div>
            </div>
            <div>
              <h3 className={`text-sm font-bold leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>Creator QR & Share</h3>
              <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Scan to view videos & send tips</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isLight ? 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Creator Identity Header Card */}
        <div className={`relative z-10 flex items-center gap-3 rounded-2xl p-3 border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/10'
        }`}>
          <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-[#00B2FE] via-amber-400 to-[#FF9F0A] shrink-0 shadow-md">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/default-avatar.jpg';
              }}
            />
          </div>
          <div className="min-w-0 text-left flex-1">
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{user.name}</span>
              {user.verified && (
                <span className="w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center text-[9px] text-neutral-950 font-black shrink-0">
                  ✓
                </span>
              )}
            </div>
            <span className={`text-xs font-mono block truncate ${isLight ? 'text-cyan-700 font-semibold' : 'text-cyan-400'}`}>
              @{user.username}
            </span>
          </div>
        </div>

        {/* QR CODE CONTAINER WITH OFFICIAL APP LOGO EMBEDDED IN CENTER */}
        <div className={`relative z-10 flex flex-col items-center justify-center rounded-3xl p-4 shadow-sm border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-white shadow-2xl border-4 border-[#00B2FE]/30'
        }`}>
          <div className="flex items-center justify-center p-2 bg-white rounded-2xl shadow-sm border border-slate-100">
            <QRCodeCanvas
              ref={qrCanvasRef}
              value={profileUrl}
              size={200}
              level="H" // High error correction so center logo is 100% reliable
              bgColor="#FFFFFF"
              fgColor="#060C18"
              marginSize={2}
              imageSettings={{
                src: '/app-icon.jpg',
                height: 46,
                width: 46,
                excavate: true,
              }}
            />
          </div>

          <div className="flex items-center gap-1.5 mt-2.5 text-[11px] font-bold text-neutral-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>ValuVid Instant Creator Profile</span>
          </div>
        </div>

        {/* Share Link Input & 1-Tap Copy */}
        <div className={`relative z-10 flex items-center gap-1.5 rounded-2xl p-1.5 pl-3 border ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/60 border-white/15'
        }`}>
          <span className={`text-[11px] font-mono truncate flex-1 text-left ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
            {profileUrl}
          </span>
          <button
            onClick={handleCopyLink}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all ${
              copied
                ? 'bg-emerald-500 text-neutral-950 shadow-md shadow-emerald-500/20'
                : (isLight
                    ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                    : 'bg-white hover:bg-neutral-100 text-black shadow-md shadow-white/20 hover:scale-105 active:scale-95')
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 stroke-[3] text-inherit" /> : <Copy className="w-3.5 h-3.5 text-inherit" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Quick Social & Action Buttons */}
        <div className="relative z-10 flex flex-col gap-2 pt-1">
          <button
            onClick={handleNativeShare}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all ${
              isLight
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-white hover:bg-neutral-100 text-black shadow-lg shadow-white/20'
            }`}
          >
            <Share2 className="w-4 h-4 text-slate-950" />
            <span>Share via Apps / AirDrop</span>
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="py-2.5 px-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] font-bold text-[11px] flex items-center justify-center gap-1 transition-colors active:scale-95"
            >
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleTwitterShare}
              className={`py-2.5 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1 transition-colors active:scale-95 ${
                isLight
                  ? 'bg-sky-50 hover:bg-sky-100 border-sky-300 text-sky-700'
                  : 'bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-400'
              }`}
            >
              <span>X (Twitter)</span>
            </button>

            <button
              onClick={handleDownloadQr}
              disabled={isSaving}
              className={`py-2.5 px-2 rounded-xl disabled:opacity-50 border font-bold text-[11px] flex items-center justify-center gap-1 transition-colors active:scale-95 ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-200'
              }`}
            >
              <Download className={`w-3.5 h-3.5 text-amber-500 ${isSaving ? 'animate-bounce' : ''}`} />
              <span>{isSaving ? 'Saving...' : 'Save QR'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
