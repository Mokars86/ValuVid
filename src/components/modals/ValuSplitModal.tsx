import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Users, 
  X, 
  Coins, 
  Check, 
  Sparkles, 
  ArrowRight, 
  Share2, 
  ShieldCheck, 
  Percent 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VideoItem } from '../../types';
import { sounds } from '../../utils/soundEffects';

interface ValuSplitModalProps {
  video: VideoItem | null;
  onClose: () => void;
}

export const ValuSplitModal: React.FC<ValuSplitModalProps> = ({ video, onClose }) => {
  const { wallet, sendTip } = useApp();
  const [selectedTip, setSelectedTip] = useState<number>(10);
  const [customTip, setCustomTip] = useState<string>('');
  const [splitSuccess, setSplitSuccess] = useState<string | null>(null);

  if (!video || !video.valuSplit) return null;

  const { valuSplit, creator } = video;
  const tipAmount = customTip ? parseFloat(customTip) || 0 : selectedTip;
  const primaryShare = Number(((tipAmount * valuSplit.primaryCreatorSharePercent) / 100).toFixed(2));
  const collabShare = Number(((tipAmount * valuSplit.collaboratorSharePercent) / 100).toFixed(2));

  const handleSendSplitTip = () => {
    if (tipAmount <= 0) return;
    if (wallet.balanceGHS < tipAmount) {
      alert(`Insufficient balance (GHS ${wallet.balanceGHS.toFixed(2)}). Please top up your wallet.`);
      return;
    }

    const success = sendTip(
      video.id, 
      tipAmount, 
      `ValuSplit Tip: GHS ${primaryShare.toFixed(2)} to @${creator.username} & GHS ${collabShare.toFixed(2)} to @${valuSplit.collaborator.username}! 🤝✨`
    );

    if (success) {
      sounds.playSuccessPayout();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00B2FE', '#FF9F0A', '#10B981'],
      });

      setSplitSuccess(
        `Sent GHS ${tipAmount.toFixed(2)}! Split into GHS ${primaryShare.toFixed(2)} for @${creator.username} and GHS ${collabShare.toFixed(2)} for @${valuSplit.collaborator.username}`
      );

      setTimeout(() => {
        setSplitSuccess(null);
        onClose();
      }, 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
      <div className="w-full max-w-md bg-[#070E1B] border border-[#00B2FE]/40 rounded-3xl p-4 sm:p-5 flex flex-col gap-3.5 max-h-[85vh] overflow-y-auto text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00B2FE] to-cyan-600 p-[1.5px] shrink-0">
              <div className="w-full h-full bg-[#050B14] rounded-[10px] flex items-center justify-center">
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white tracking-wide">ValuSplit Co-Creation</h3>
                <span className="text-[9px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800/80 px-1.5 py-0.2 rounded-full">
                  ● Real-Time Split
                </span>
              </div>
              <p className="text-[10px] text-neutral-400">Automated Co-Creator Revenue Sharing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert */}
        {splitSuccess && (
          <div className="bg-emerald-500/20 border border-emerald-400/50 p-3 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{splitSuccess}</span>
          </div>
        )}

        {/* Both Collaborators Split Breakdown Card */}
        <div className="bg-gradient-to-br from-[#0A182E] via-[#071325] to-[#121A28] border border-cyan-500/30 rounded-2xl p-4 flex flex-col gap-3 shadow-lg">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Collaborative Video Revenue Pool</span>
            <span className="text-cyan-400 font-bold font-mono">
              Total Generated: GHS {(valuSplit.totalSplitEarnedGHS + video.stats.tipsTotalGHS).toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 relative">
            {/* Primary Creator */}
            <div className="bg-black/50 border border-amber-500/30 rounded-xl p-3 flex flex-col items-center text-center">
              <img
                src={creator.avatar}
                alt={creator.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 mb-1.5 shadow-md"
              />
              <span className="text-xs font-bold text-white truncate max-w-[120px]">
                @{creator.username}
              </span>
              <span className="text-[9px] text-amber-400 font-semibold mb-2">Original Creator</span>

              <div className="w-full bg-amber-500/10 border border-amber-500/30 py-1 rounded-lg">
                <span className="text-sm font-black text-amber-400">{valuSplit.primaryCreatorSharePercent}%</span>
                <span className="text-[9px] text-neutral-400 block">Share of all Tips</span>
              </div>
            </div>

            {/* Collaborator */}
            <div className="bg-black/50 border border-cyan-500/30 rounded-xl p-3 flex flex-col items-center text-center">
              <img
                src={valuSplit.collaborator.avatar}
                alt={valuSplit.collaborator.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400 mb-1.5 shadow-md"
              />
              <span className="text-xs font-bold text-white truncate max-w-[120px]">
                @{valuSplit.collaborator.username}
              </span>
              <span className="text-[9px] text-cyan-300 font-semibold truncate max-w-[120px] mb-2">
                {valuSplit.collaborator.role}
              </span>

              <div className="w-full bg-cyan-500/10 border border-cyan-500/30 py-1 rounded-lg">
                <span className="text-sm font-black text-cyan-300">{valuSplit.collaboratorSharePercent}%</span>
                <span className="text-[9px] text-neutral-400 block">Share of all Tips</span>
              </div>
            </div>

            {/* Handshake Badge in Center */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-[#070E1B] border border-white/20 rounded-full flex items-center justify-center text-xs shadow-md">
              🤝
            </div>
          </div>

          <div className="text-[10px] text-neutral-400 flex items-start gap-1.5 bg-black/40 p-2 rounded-xl">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Unlike TikTok Duets where original creators capture 100% of value, ValuSplit automatically divides tips directly between both creators' MoMo wallets.
            </span>
          </div>
        </div>

        {/* Tip Preset Selection */}
        <div>
          <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block mb-1.5">
            Send a Split-Tip to Both Creators
          </label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {[5, 10, 20, 50].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  setSelectedTip(amt);
                  setCustomTip('');
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedTip === amt && !customTip
                    ? 'bg-gradient-to-r from-[#00B2FE] to-cyan-500 text-black font-black shadow-md'
                    : 'bg-neutral-900 text-neutral-300 border border-neutral-800'
                }`}
              >
                GHS {amt}
              </button>
            ))}
          </div>

          {/* Custom Tip Input */}
          <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs">
            <span className="text-neutral-400">Custom Amount (GHS):</span>
            <input
              type="number"
              min="1"
              placeholder="Other amount"
              value={customTip}
              onChange={(e) => setCustomTip(e.target.value)}
              className="w-24 bg-transparent text-right font-bold text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Live Split Preview of this tip */}
        <div className="bg-black/50 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
          <div className="text-neutral-400">
            <span>@{creator.username} receives: </span>
            <strong className="text-amber-400">GHS {primaryShare.toFixed(2)}</strong>
          </div>
          <div className="text-neutral-400">
            <span>@{valuSplit.collaborator.username} receives: </span>
            <strong className="text-cyan-300">GHS {collabShare.toFixed(2)}</strong>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSendSplitTip}
          className="w-full py-3.5 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs shadow-lg shadow-white/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-1"
        >
          <Coins className="w-4 h-4 text-black" />
          <span>Confirm Split Tip (GHS {tipAmount.toFixed(2)})</span>
        </button>
      </div>
    </div>
  );
};