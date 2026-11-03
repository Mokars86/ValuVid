import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Award, 
  ShieldCheck, 
  Package, 
  Send, 
  Smartphone, 
  MapPin, 
  Phone, 
  User,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';

export interface MilestoneCertificateData {
  id: string;
  title: string;
  category: 'viral_views' | 'top_tipped' | 'leaderboard' | 'skill_academy';
  badgeName: string;
  badgeIcon: string;
  milestoneDescription: string;
  recipientName: string;
  recipientUsername: string;
  recipientAvatar?: string;
  issueDate: string;
  credentialId: string;
  metricLabel: string;
  metricValue: string;
  plaqueEligible?: boolean;
  plaqueTier?: 'Rising Star Acrylic' | 'Gold Metallic' | 'Diamond NFC Crystal' | 'Crowned Crystal of the Year';
  plaqueImage?: string;
  isPlaqueAward?: boolean;
  isUnlocked?: boolean;
  targetCount?: number;
  currentCount?: number;
}

interface MilestoneCertificateModalProps {
  certificate: MilestoneCertificateData | null;
  onClose: () => void;
  onShareToast: (msg: string) => void;
}

export const MilestoneCertificateModal: React.FC<MilestoneCertificateModalProps> = ({
  certificate,
  onClose,
  onShareToast,
}) => {
  const { theme } = useApp();
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'trophy' | 'certificate'>(
    certificate?.plaqueImage ? 'trophy' : 'certificate'
  );
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [nfcTapped, setNfcTapped] = useState(false);

  // Delivery Form State
  const [shippingName, setShippingName] = useState(certificate?.recipientName || '');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');

  if (!certificate) return null;

  const isLight = theme === 'light';
  const isUnlocked = certificate.isUnlocked ?? true;

  const shareText = `🏆 I unlocked the official "${certificate.title}" on ValuVid! Check my creator profile: https://valuvid.app/@${certificate.recipientUsername} #ValuVidCreator #MilestoneAward`;

  const handleCopyLink = () => {
    if (!isUnlocked) {
      onShareToast('Milestone locked! Reach this goal before sharing your trophy. 🔒');
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).catch(() => {});
    }
    setCopied(true);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
    onShareToast('Award credential & link copied to clipboard! 📋');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (!isUnlocked) {
      onShareToast('Milestone locked! Reach this goal before sharing your trophy. 🔒');
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ValuVid Award: ${certificate.title}`,
          text: shareText,
          url: `https://valuvid.app/@${certificate.recipientUsername}`,
        });
        onShareToast('Shared successfully! 🚀');
        confetti({ particleCount: 50, spread: 80, origin: { y: 0.5 } });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  const handleNfcSimulate = () => {
    setNfcTapped(true);
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.7 } });
    onShareToast(`📲 NFC Tag read! Opened ValuVid profile @${certificate.recipientUsername}`);
    setTimeout(() => setNfcTapped(false), 2000);
  };

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const existingClaims = JSON.parse(localStorage.getItem('valuvid_claimed_plaques') || '[]');
      const newClaim = {
        awardId: certificate.id,
        awardTitle: certificate.title,
        recipientUsername: certificate.recipientUsername,
        shippingName,
        shippingAddress,
        shippingCity,
        shippingPhone,
        claimedAt: new Date().toISOString(),
      };
      localStorage.setItem('valuvid_claimed_plaques', JSON.stringify([...existingClaims, newClaim]));
    } catch {}

    setClaimSubmitted(true);
    confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 } });
    onShareToast('Physical ValuPlaque dispatched for custom engraving & shipping! 📦✨');
  };

  return (
    <div className={`fixed inset-0 z-50 ${isLight ? 'bg-black/60' : 'bg-black/90'} backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in select-none`}>
      <div className={`w-full max-w-sm sm:max-w-md ${
        isLight ? 'bg-white border-amber-400/40 text-slate-900 shadow-2xl' : 'bg-[#070D18] border-amber-500/40 text-white shadow-2xl'
      } border rounded-3xl p-5 sm:p-6 flex flex-col gap-4 max-h-[92vh] overflow-y-auto relative`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors z-20 ${
            isLight ? 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-500 text-base">
            {certificate.badgeIcon || '🏆'}
          </div>
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              <span>{certificate.title}</span>
              {isUnlocked && (
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                  isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  Verified
                </span>
              )}
            </h3>
            <p className={`text-[10px] ${isLight ? 'text-amber-800 font-semibold' : 'text-amber-400/80 font-medium'}`}>Official ValuVid Creator Milestone Achievement</p>
          </div>
        </div>

        {/* Mode Switcher if Plaque Image is Available */}
        {certificate.plaqueImage && (
          <div className={`grid grid-cols-2 p-1 rounded-2xl border text-xs font-semibold ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-neutral-900/90 border-neutral-800'
          }`}>
            <button
              onClick={() => setViewMode('trophy')}
              className={`py-1.5 rounded-xl transition-all ${
                viewMode === 'trophy'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold shadow-md'
                  : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white')
              }`}
            >
              🏆 Physical Plaque Trophy
            </button>
            <button
              onClick={() => setViewMode('certificate')}
              className={`py-1.5 rounded-xl transition-all ${
                viewMode === 'certificate'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold shadow-md'
                  : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white')
              }`}
            >
              📜 Verified Certificate Pass
            </button>
          </div>
        )}

        {/* 1. PHYSICAL TROPHY PLAQUE VIEW */}
        {viewMode === 'trophy' && certificate.plaqueImage ? (
          <div className="flex flex-col gap-3">
            <div className={`relative w-full aspect-square border-2 border-amber-400/60 rounded-2xl overflow-hidden flex items-center justify-center group ${
              isLight ? 'bg-slate-50 shadow-md' : 'bg-[#030712] shadow-[0_0_35px_rgba(245,158,11,0.25)]'
            }`}>
              <img
                src={certificate.plaqueImage}
                alt={certificate.title}
                className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
              />

              {/* Personalization Overlay for Rising Star Award */}
              {certificate.id === 'plaque-rising-star' && certificate.recipientAvatar && (
                <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-200/90 shadow-md pointer-events-none">
                  <img
                    src={certificate.recipientAvatar}
                    alt={certificate.recipientUsername}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* NFC interactive tap simulation for Diamond Creator Trophy */}
              {certificate.id === 'plaque-diamond' && (
                <button
                  onClick={handleNfcSimulate}
                  className={`absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-lg transition-transform active:scale-95 ${
                    nfcTapped ? 'border-cyan-400 text-cyan-300 scale-105' : 'border-cyan-500/40 text-cyan-400 hover:border-cyan-400'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 animate-pulse" />
                  <span>{nfcTapped ? 'NFC Link Activated! ✨' : 'Tap Base NFC Chip ((( • )))'}</span>
                </button>
              )}

              {/* Unlocked / In Progress Stamp */}
              <div className="absolute top-3 right-3">
                {isUnlocked ? (
                  <span className="bg-emerald-500/90 text-neutral-950 font-black text-[9px] px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    Issued
                  </span>
                ) : (
                  <span className="bg-black/80 backdrop-blur-md text-amber-400 border border-amber-400/50 font-bold text-[9px] px-2.5 py-1 rounded-full shadow-lg">
                    Milestone In Progress
                  </span>
                )}
              </div>
            </div>

            <div className="text-center">
              <h4 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{certificate.title}</h4>
              <p className={`text-[11px] mt-1 max-w-xs mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>
                {certificate.milestoneDescription}
              </p>
              <div className={`mt-2 inline-flex items-center gap-2 border px-3 py-1 rounded-full text-xs ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-neutral-900 border-amber-500/30'
              }`}>
                <span className={`font-semibold ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>{certificate.metricLabel}:</span>
                <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{certificate.metricValue}</span>
              </div>
            </div>
          </div>
        ) : (
          /* 2. HIGH-RES DIGITAL CERTIFICATE PASS CARD (Ready for IG Story / WhatsApp) */
          <div className="relative w-full aspect-[4/5] bg-gradient-to-b from-[#0B1527] via-[#091120] to-[#040810] border-2 border-amber-400/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-[0_0_30px_rgba(245,158,11,0.15)] overflow-hidden">
            {/* Guilloche / Gold Border Corners */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-400/80 rounded-tl-lg pointer-events-none" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-400/80 rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-400/80 rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-400/80 rounded-br-lg pointer-events-none" />

            {/* ValuVid Watermark Logo in center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
              <img src="/logo.png" alt="ValuVid" className="w-48 h-48 object-contain" />
            </div>

            {/* Certificate Top Header */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <img src="/logo.png" alt="ValuVid" className="w-6 h-6 object-contain" />
                <span className="text-xs font-black tracking-wider uppercase text-amber-300">
                  ValuVid Honors
                </span>
              </div>
              <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                #{certificate.credentialId}
              </span>
            </div>

            {/* Certificate Body */}
            <div className="relative z-10 flex flex-col items-center text-center my-auto py-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-600 p-[2px] shadow-lg shadow-amber-500/20 mb-2">
                <div className="w-full h-full bg-[#070D18] rounded-[14px] flex items-center justify-center text-3xl">
                  {certificate.badgeIcon}
                </div>
              </div>

              <span className="text-[10px] tracking-widest uppercase text-neutral-400 font-bold mb-0.5">
                Certificate of Achievement
              </span>

              <h2 className="text-base sm:text-lg font-black text-white leading-tight gold-gradient-text px-2">
                {certificate.title}
              </h2>

              <p className="text-[11px] text-neutral-300 mt-1 max-w-[240px] leading-relaxed">
                Awarded to <strong className="text-white">@{certificate.recipientUsername}</strong> for outstanding creator milestones on ValuVid.
              </p>

              {/* Achievement Metric Tag */}
              <div className="mt-3 bg-neutral-900/90 border border-amber-500/40 px-3 py-1 rounded-xl flex items-center gap-2 shadow-sm">
                <span className="text-[10px] text-neutral-400 font-semibold">{certificate.metricLabel}:</span>
                <span className="text-xs font-black text-emerald-400">{certificate.metricValue}</span>
              </div>
            </div>

            {/* Certificate Footer / Seal */}
            <div className="relative z-10 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[9px] text-neutral-400">
              <div className="flex flex-col">
                <span className="font-bold text-neutral-300">ValuVid Creator Council</span>
                <span className="font-mono text-neutral-500 text-[8px]">{certificate.issueDate}</span>
              </div>

              {/* Digital Gold Seal */}
              <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/60 px-2 py-1 rounded-full text-amber-300 font-bold shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Verified Authentic</span>
              </div>
            </div>
          </div>
        )}

        {/* Locked Milestone Requirement Notice if not yet unlocked */}
        {!isUnlocked && (
          <div className="bg-[#140E05] border border-amber-500/40 rounded-2xl p-3.5 flex items-start gap-3 text-left shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Lock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-300">Milestone Locked</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-400 font-mono font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                  {certificate.metricValue}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-1 leading-snug">
                You must reach this verified milestone before this trophy/plaque can be shared to socials or claimed. Keep creating to unlock!
              </p>
            </div>
          </div>
        )}

        {/* Claim Physical Plaque Section / Form (Strictly Unlocked only) */}
        {certificate.plaqueEligible && isUnlocked && (
          <div className="bg-gradient-to-r from-amber-600/20 via-yellow-600/15 to-orange-600/20 border border-amber-500/50 rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-lg">
            {!showClaimForm && !claimSubmitted ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-xl shrink-0">
                    📦
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-white block">Physical Hardware Award Ready!</span>
                    <span className="text-[10px] text-amber-300">
                      Eligible for the <strong>{certificate.plaqueTier || 'Physical Plaque'}</strong>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowClaimForm(true)}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-100 text-black font-bold text-xs shadow-md shrink-0 hover:scale-105 active:scale-95 transition-all"
                >
                  Claim Award
                </button>
              </div>
            ) : claimSubmitted ? (
              <div className="flex items-center gap-2.5 text-left py-1">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-300 block">Plaque Claimed Successfully!</span>
                  <p className="text-[10px] text-neutral-300">
                    Your physical trophy is now queued for custom engraving and courier dispatch.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="flex flex-col gap-2.5 text-left animate-fade-in">
                <div className={`flex items-center justify-between border-b pb-1.5 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                  <span className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <Package className="w-3.5 h-3.5 text-amber-500" />
                    Delivery Dispatch Details (Free Worldwide Delivery)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowClaimForm(false)}
                    className={`text-[10px] ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-neutral-400 hover:text-white'}`}
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className={`text-[10px] font-semibold block mb-0.5 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Full Recipient Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={shippingName}
                      onChange={(e) => setShippingName(e.target.value)}
                      placeholder="e.g. Samuel Mensah"
                      className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none ${
                        isLight 
                          ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500' 
                          : 'bg-black/60 border border-neutral-700 text-white focus:border-amber-400'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`text-[10px] font-semibold block mb-0.5 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Shipping Address / Digital Address</label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="e.g. GA-183-9022, Ring Road Central"
                      className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none ${
                        isLight 
                          ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500' 
                          : 'bg-black/60 border border-neutral-700 text-white focus:border-amber-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`text-[10px] font-semibold block mb-0.5 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>City / Region</label>
                    <input
                      type="text"
                      required
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      placeholder="Accra, Greater Accra"
                      className={`w-full px-3 py-1.5 rounded-xl text-xs focus:outline-none ${
                        isLight 
                          ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500' 
                          : 'bg-black/60 border border-neutral-700 text-white focus:border-amber-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`text-[10px] font-semibold block mb-0.5 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>Phone / WhatsApp</label>
                    <div className="relative">
                      <Phone className="w-3 h-3 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={shippingPhone}
                        onChange={(e) => setShippingPhone(e.target.value)}
                        placeholder="024 123 4567"
                        className={`w-full pl-7 pr-3 py-1.5 rounded-xl text-xs focus:outline-none ${
                          isLight 
                            ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500' 
                            : 'bg-black/60 border border-neutral-700 text-white focus:border-amber-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full mt-1 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-95 transition-all ${
                    isLight 
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-white hover:bg-neutral-100 text-black shadow-md'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 text-slate-950" />
                  <span>Confirm Free Plaque Dispatch</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Action Buttons: 1-Tap Share to Socials (Only when milestone is achieved) */}
        {isUnlocked ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleNativeShare}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all ${
                isLight
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-white hover:bg-neutral-100 text-black shadow-xl shadow-white/20'
              }`}
            >
              <Share2 className="w-4 h-4 text-slate-950" />
              <span>Share Achievement to Socials 🚀</span>
            </button>

            <button
              onClick={handleCopyLink}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 active:scale-95 transition-colors border ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
              <span>{copied ? 'Credential Copied!' : 'Copy Award Credential & Link'}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              disabled
              className={`w-full py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed select-none opacity-80 ${
                isLight ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-neutral-900/90 border-neutral-800 text-neutral-400'
              }`}
            >
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Milestone Locked • Cannot Share Trophy Yet</span>
            </button>
            <p className={`text-[10px] text-center ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
              Complete the milestone requirements to unlock official sharing and claiming.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
