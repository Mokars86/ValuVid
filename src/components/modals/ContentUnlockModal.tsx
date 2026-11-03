import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Lock, Unlock, X, Sparkles, CheckCircle2, ShieldCheck, Coins, Plus, Smartphone, Zap, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { launchPaystackPayment } from '../../services/paystackService';

export const ContentUnlockModal: React.FC = () => {
  const { unlockPromptVideo, closeUnlockPrompt, unlockContent, wallet, addFundsToWallet, currentUser } = useApp();
  const [momoProvider, setMomoProvider] = useState<'mtn' | 'telecel'>('mtn');
  const [topUpToast, setTopUpToast] = useState<string | null>(null);
  const [isProcessingPaystack, setIsProcessingPaystack] = useState(false);

  if (!unlockPromptVideo) return null;

  const price = unlockPromptVideo.unlockPriceGHS || 5.00;
  const canAfford = wallet.balanceGHS >= price;
  const deficit = Number(Math.max(0, price - wallet.balanceGHS).toFixed(2));

  const handleQuickTopUp = async (amount: number) => {
    if (isProcessingPaystack) return;
    setIsProcessingPaystack(true);

    await launchPaystackPayment({
      email: currentUser.email || `${currentUser.username || 'user'}@valuvid.app`,
      amountGHS: amount,
      metadata: {
        type: 'content_unlock_topup',
        username: currentUser.username,
        userId: currentUser.id,
        momo_channel: momoProvider,
      },
      onSuccess: (res) => {
        setIsProcessingPaystack(false);
        addFundsToWallet(amount, res.reference, `Paystack ${momoProvider === 'mtn' ? 'MTN MoMo' : 'Telecel Cash'}`);
        setTopUpToast(`+GHS ${amount.toFixed(2)} added via Paystack! 💳`);
        setTimeout(() => setTopUpToast(null), 3000);
      },
      onClose: () => {
        setIsProcessingPaystack(false);
      },
    });
  };

  const handleUnlock = async () => {
    // 1. If balance is sufficient, unlock directly from wallet balance
    if (canAfford) {
      const success = unlockContent(unlockPromptVideo.id);
      if (success) {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#00B2FE', '#FFFFFF'],
        });
        closeUnlockPrompt();
      }
      return;
    }

    // 2. If short, trigger Paystack payment for deficit
    if (isProcessingPaystack) return;
    setIsProcessingPaystack(true);
    const topUpRequired = Number(deficit.toFixed(2));

    await launchPaystackPayment({
      email: currentUser.email || `${currentUser.username || 'user'}@valuvid.app`,
      amountGHS: topUpRequired,
      metadata: {
        type: 'content_unlock_topup',
        username: currentUser.username,
        userId: currentUser.id,
        videoId: unlockPromptVideo.id,
      },
      onSuccess: (res) => {
        setIsProcessingPaystack(false);
        addFundsToWallet(topUpRequired, res.reference, 'Paystack MoMo');
        setTimeout(() => {
          const success = unlockContent(unlockPromptVideo.id);
          if (success) {
            confetti({
              particleCount: 90,
              spread: 75,
              origin: { y: 0.6 },
              colors: ['#F59E0B', '#10B981', '#00B2FE', '#FFFFFF'],
            });
            closeUnlockPrompt();
          }
        }, 100);
      },
      onClose: () => {
        setIsProcessingPaystack(false);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
      <div className="w-full max-w-sm bg-[#070E1B] border border-amber-500/30 rounded-3xl p-6 flex flex-col gap-4 shadow-2xl text-white max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 p-[1.5px]">
              <div className="w-full h-full bg-[#050B14] rounded-[10px] flex items-center justify-center">
                <Lock className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Unlock Creator Masterclass</h3>
              <p className="text-[10px] text-cyan-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Micro-Monetization (Zero Platform Debt)
              </p>
            </div>
          </div>
          <button
            onClick={closeUnlockPrompt}
            className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Preview Card */}
        <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-neutral-950 border border-neutral-800">
          <img
            src={unlockPromptVideo.thumbnailUrl}
            alt={unlockPromptVideo.title}
            className="w-full h-full object-cover filter blur-[2px] opacity-40"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/30 border border-amber-400/50 flex items-center justify-center mb-2">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-xs font-bold text-white line-clamp-1">
              {unlockPromptVideo.title}
            </span>
            <span className="text-[10px] text-amber-300">
              by @{unlockPromptVideo.creator.username}
            </span>
          </div>
        </div>

        {/* Fee breakdown & Revenue Split */}
        <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>One-Time Masterclass Fee:</span>
            <span className="text-base font-black text-amber-400">
              GHS {price.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-300">
            <span>Creator Direct Share (90%):</span>
            <span className="text-emerald-400 font-bold">
              GHS {(price * 0.9).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-neutral-400">
            <span>Platform Service Fee (10%):</span>
            <span className="text-neutral-400">
              GHS {(price * 0.1).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-neutral-300 pt-2 border-t border-neutral-900">
            <span>Your Balance:</span>
            <span className={`font-bold ${canAfford ? 'text-white' : 'text-rose-400'}`}>
              GHS {wallet.balanceGHS.toFixed(2)}
            </span>
          </div>

          {topUpToast && (
            <div className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 p-1.5 rounded-lg text-center mt-1">
              {topUpToast}
            </div>
          )}

          {!canAfford && (
            <div className="pt-2 border-t border-neutral-900 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[10px] text-neutral-400">
                <span className="flex items-center gap-1 text-amber-400 font-semibold">
                  <Smartphone className="w-3 h-3" />
                  Quick Top-Up Deficit:
                </span>
                <span className="text-rose-300 font-mono">Short: GHS {deficit}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[5, 10, 20].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    disabled={isProcessingPaystack}
                    onClick={() => handleQuickTopUp(amt)}
                    className="py-1 px-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-bold text-amber-300 transition-colors flex items-center justify-center gap-0.5 active:scale-95 disabled:opacity-50"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>GHS {amt}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleUnlock}
          disabled={isProcessingPaystack}
          className="w-full py-3.5 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs shadow-xl shadow-white/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessingPaystack ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span>Connecting to Paystack...</span>
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4 text-black" />
              <span>
                {canAfford
                  ? `Unlock for GHS ${price.toFixed(2)}`
                  : `Top-Up (+GHS ${deficit.toFixed(2)}) & Unlock Now`}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
