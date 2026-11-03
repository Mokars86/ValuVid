import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Coins, Heart, Sparkles, X, CheckCircle, ShieldCheck, Plus, Smartphone, Zap, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { launchPaystackPayment } from '../../services/paystackService';

export const QuickTipModal: React.FC = () => {
  const { tipModalVideo, closeTipModal, sendTip, wallet, addFundsToWallet, currentUser, theme } = useApp();
  const [selectedAmount, setSelectedAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [cheerMessage, setCheerMessage] = useState('');
  const [tipSuccess, setTipSuccess] = useState(false);
  const [momoProvider, setMomoProvider] = useState<'mtn' | 'telecel'>('mtn');
  const [topUpToast, setTopUpToast] = useState<string | null>(null);
  const [isProcessingPaystack, setIsProcessingPaystack] = useState(false);

  if (!tipModalVideo) return null;

  const isLight = theme === 'light';

  const tipPresets = [2, 5, 10, 20, 50];
  const finalAmount = isCustom ? parseFloat(customAmount) : selectedAmount;
  const validAmount = !isNaN(finalAmount) && finalAmount > 0 ? finalAmount : 0;
  const isBalanceSufficient = wallet.balanceGHS >= validAmount;
  const deficitAmount = Number(Math.max(0, validAmount - wallet.balanceGHS).toFixed(2));

  // Escrow Split: 92% to creator, 8% platform fee
  const creatorTakeGHS = (validAmount * 0.92).toFixed(2);
  const platformFeeGHS = (validAmount * 0.08).toFixed(2);

  const handleQuickTopUp = async (amount: number) => {
    if (isProcessingPaystack) return;
    setIsProcessingPaystack(true);

    await launchPaystackPayment({
      email: currentUser.email || `${currentUser.username || 'user'}@valuvid.app`,
      amountGHS: amount,
      metadata: {
        type: 'wallet_topup',
        username: currentUser.username,
        userId: currentUser.id,
        momo_channel: momoProvider,
      },
      onSuccess: (res) => {
        setIsProcessingPaystack(false);
        addFundsToWallet(amount, res.reference, `Paystack ${momoProvider === 'mtn' ? 'MTN MoMo' : 'Telecel Cash'}`);
        setTopUpToast(`+GHS ${amount.toFixed(2)} added to ValuWallet! 💳`);
        setTimeout(() => setTopUpToast(null), 3000);
      },
      onClose: () => {
        setIsProcessingPaystack(false);
      },
    });
  };

  const handleSendTip = async () => {
    if (validAmount <= 0) {
      alert('Please enter a valid tip amount');
      return;
    }

    // 1. If wallet balance is sufficient, tip directly from wallet
    if (isBalanceSufficient) {
      const success = sendTip(tipModalVideo.id, validAmount, cheerMessage);
      if (success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#00B2FE', '#FFFFFF'],
        });

        setTipSuccess(true);
        setTimeout(() => {
          setTipSuccess(false);
          closeTipModal();
        }, 1500);
      }
      return;
    }

    // 2. If balance is short, launch Paystack to securely fund the deficit first
    if (isProcessingPaystack) return;
    setIsProcessingPaystack(true);
    const topUpRequired = Number(deficitAmount.toFixed(2));

    await launchPaystackPayment({
      email: currentUser.email || `${currentUser.username || 'user'}@valuvid.app`,
      amountGHS: topUpRequired,
      metadata: {
        type: 'creator_tip_topup',
        username: currentUser.username,
        userId: currentUser.id,
        creatorId: tipModalVideo.creator.id,
        videoId: tipModalVideo.id,
      },
      onSuccess: (res) => {
        setIsProcessingPaystack(false);
        // Credit the topped-up amount with genuine Paystack reference
        addFundsToWallet(topUpRequired, res.reference, `Paystack ${momoProvider === 'mtn' ? 'MTN MoMo' : 'Telecel Cash'}`);

        // Complete the tip transaction to creator
        setTimeout(() => {
          const success = sendTip(tipModalVideo.id, validAmount, cheerMessage);
          if (success) {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#F59E0B', '#10B981', '#00B2FE', '#FFFFFF'],
            });

            setTipSuccess(true);
            setTimeout(() => {
              setTipSuccess(false);
              closeTipModal();
            }, 1500);
          }
        }, 100);
      },
      onClose: () => {
        setIsProcessingPaystack(false);
      },
    });
  };

  return (
    <div className={`fixed inset-0 z-50 ${isLight ? 'bg-black/60' : 'bg-black/85'} backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none`}>
      <div className={`w-full max-w-sm ${
        isLight ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' : 'bg-[#070E1B] border-amber-500/30 text-white shadow-2xl'
      } border rounded-3xl p-5 flex flex-col gap-3.5 max-h-[85vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-slate-200' : 'border-neutral-800'}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 p-[1.5px]">
              <div className={`w-full h-full ${isLight ? 'bg-slate-50' : 'bg-[#050B14]'} rounded-[10px] flex items-center justify-center`}>
                <Coins className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Send Creator Tip</h3>
              <p className={`text-[10px] font-semibold flex items-center gap-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                <ShieldCheck className={`w-3 h-3 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} /> Paystack Secured • Direct Creator Support
              </p>
            </div>
          </div>
          <button
            onClick={closeTipModal}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              isLight ? 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {tipSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h4 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Tip Sent Successfully!</h4>
            <p className={`text-xs mt-1 ${isLight ? 'text-amber-800 font-semibold' : 'text-amber-300'}`}>
              @{tipModalVideo.creator.username} received GHS {creatorTakeGHS} directly into their ValuWallet.
            </p>
            <span className={`text-[10px] mt-2 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              Platform service fee (8%): GHS {platformFeeGHS}
            </span>
          </div>
        ) : (
          <>
            {/* Creator Recipient Card */}
            <div className={`flex items-center gap-3 p-3 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950 border-neutral-800'
            }`}>
              <img
                src={tipModalVideo.creator.avatar}
                alt={tipModalVideo.creator.username}
                className="w-10 h-10 rounded-full object-cover border border-amber-400/40"
              />
              <div className="truncate flex-1">
                <div className={`text-xs font-bold truncate flex items-center gap-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <span>@{tipModalVideo.creator.username}</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-700 px-1 rounded font-bold">Creator</span>
                </div>
                <div className={`text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  {tipModalVideo.title || 'Creator Video'}
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Total Tips</span>
                <span className={`text-xs font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                  GHS {(tipModalVideo.stats?.tipsTotalGHS || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-[11px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                  Select Tip Amount
                </label>
                <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Ghana Cedis (GHS)</span>
              </div>

              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {tipPresets.map((amt) => {
                  const isChosen = !isCustom && selectedAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setIsCustom(false);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        isChosen
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-md shadow-amber-500/20 scale-105'
                          : (isLight
                              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                              : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800 border border-neutral-800')
                      }`}
                    >
                      GHS {amt}
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount Toggle */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCustom(!isCustom)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium ${
                    isCustom
                      ? (isLight ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-amber-500/20 border-amber-400 text-amber-300')
                      : (isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-neutral-950 border-neutral-800 text-neutral-400')
                  }`}
                >
                  Custom
                </button>
                {isCustom && (
                  <div className={`flex-1 flex items-center rounded-lg px-2.5 py-1 border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950 border-neutral-800'
                  }`}>
                    <span className={`text-xs font-bold mr-1 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>GHS</span>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      placeholder="Amount"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className={`w-full bg-transparent text-xs focus:outline-none ${isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-neutral-500'}`}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Split Transparency Card */}
            <div className={`rounded-2xl p-2.5 text-[11px] flex items-center justify-between border ${
              isLight ? 'bg-cyan-50/80 border-cyan-200 text-slate-800' : 'bg-[#0A1628] border-cyan-500/30 text-neutral-300'
            }`}>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>
                  Creator gets <strong className={isLight ? 'text-emerald-700' : 'text-emerald-400'}>GHS {creatorTakeGHS}</strong> (92%)
                </span>
              </div>
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                Fee: GHS {platformFeeGHS} (8%)
              </span>
            </div>

            {/* Cheer Message */}
            <div>
              <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                Cheer Note (Optional)
              </label>
              <input
                type="text"
                placeholder="Add an encouraging note..."
                value={cheerMessage}
                onChange={(e) => setCheerMessage(e.target.value)}
                maxLength={60}
                className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-200 focus:border-amber-500'
                    : 'bg-neutral-950 text-white placeholder-neutral-500 border-neutral-800 focus:border-amber-400'
                }`}
              />
            </div>

            {/* Wallet Balance Info & Quick MoMo Top-Up */}
            <div className={`p-3 rounded-2xl border flex flex-col gap-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950 border-neutral-800'
            }`}>
              <div className="flex items-center justify-between text-xs">
                <span className={isLight ? 'text-slate-600' : 'text-neutral-400'}>Your ValuWallet Balance:</span>
                <span className={`font-bold ${
                  isBalanceSufficient 
                    ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
                    : 'text-rose-500'
                }`}>
                  GHS {wallet.balanceGHS.toFixed(2)}
                </span>
              </div>

              {topUpToast && (
                <div className={`text-[10px] font-bold p-1.5 rounded-lg text-center animate-fade-in border ${
                  isLight ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                  {topUpToast}
                </div>
              )}

              {/* 1-Tap MoMo Top-Up Row */}
              <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-neutral-900'}`}>
                <div className="flex items-center justify-between text-[10px] mb-1.5">
                  <span className={`flex items-center gap-1 font-semibold ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                    <Smartphone className="w-3 h-3 text-amber-500" />
                    Instant MoMo Top-Up:
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMomoProvider('mtn')}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
                        momoProvider === 'mtn'
                          ? 'bg-amber-400 text-black'
                          : (isLight ? 'bg-slate-200 text-slate-700' : 'bg-neutral-900 text-neutral-400')
                      }`}
                    >
                      MTN
                    </button>
                    <button
                      type="button"
                      onClick={() => setMomoProvider('telecel')}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${
                        momoProvider === 'telecel'
                          ? 'bg-red-500 text-white'
                          : (isLight ? 'bg-slate-200 text-slate-700' : 'bg-neutral-900 text-neutral-400')
                      }`}
                    >
                      Telecel
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[5, 10, 20, 50].map((topAmt) => (
                    <button
                      key={topAmt}
                      type="button"
                      disabled={isProcessingPaystack}
                      onClick={() => handleQuickTopUp(topAmt)}
                      className={`py-1 px-1 rounded-lg border text-[10px] font-bold transition-colors flex items-center justify-center gap-0.5 active:scale-95 disabled:opacity-50 ${
                        isLight
                          ? 'bg-white hover:bg-slate-100 border-slate-200 text-amber-700 hover:border-amber-400'
                          : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-amber-300 hover:border-amber-400/50'
                      }`}
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>{topAmt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Primary Submit Button */}
            <button
              onClick={handleSendTip}
              disabled={isProcessingPaystack || validAmount <= 0}
              className={`w-full py-3.5 rounded-xl font-black text-xs active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                isLight
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/25'
                  : 'bg-white hover:bg-neutral-100 text-black shadow-xl shadow-white/20'
              }`}
            >
              {isProcessingPaystack ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Connecting to Paystack...</span>
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4 text-slate-950" />
                  <span>
                    {isBalanceSufficient
                      ? `Tip GHS ${validAmount.toFixed(2)} Instantly`
                      : `Top-Up (+GHS ${deficitAmount.toFixed(2)}) & Tip GHS ${validAmount.toFixed(2)}`}
                  </span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
