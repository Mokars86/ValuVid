import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Award, 
  X, 
  Coins, 
  Sparkles, 
  Building2, 
  CheckCircle2, 
  ShieldCheck,
  Zap,
  Lock,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { launchPaystackPayment, saveEscrowDeposit, getPlatformCommissionPercent } from '../../services/paystackService';

export const SponsorBountyModal: React.FC = () => {
  const { showSponsorModal, setShowSponsorModal, sponsorBounty, currentUser, theme } = useApp();

  const [title, setTitle] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [rewardPoolGHS, setRewardPoolGHS] = useState(100);
  const [durationDays, setDurationDays] = useState(7);
  const [customDuration, setCustomDuration] = useState('');
  const [category, setCategory] = useState('Tech & Reviews');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!showSponsorModal) return null;

  const isLight = theme === 'light';

  const effectiveDuration = customDuration && Number(customDuration) > 0 
    ? Math.min(90, Math.max(1, Math.round(Number(customDuration)))) 
    : durationDays;

  const commissionRate = getPlatformCommissionPercent() / 100;
  const platformFee = Number((rewardPoolGHS * commissionRate).toFixed(2));
  const totalUpfront = Number((rewardPoolGHS + platformFee).toFixed(2));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !sponsorName.trim()) {
      alert('Please fill out the challenge title and brand name.');
      return;
    }
    if (rewardPoolGHS < 100) {
      alert('Minimum reward pool size is GHS 100.00 so creators can earn meaningful rewards.');
      return;
    }

    setIsProcessing(true);

    await launchPaystackPayment({
      email: currentUser?.email || 'sponsor@valuvid.app',
      amountGHS: totalUpfront,
      metadata: {
        type: 'bounty_escrow',
        bountyTitle: title,
        sponsorName,
        rewardPoolGHS,
        developerCommissionGHS: platformFee,
        durationDays: effectiveDuration,
      },
      onSuccess: (res) => {
        setIsProcessing(false);
        const bountyId = `bounty-${Date.now()}`;

        // 1. Save verifiable escrow record in local ledger
        saveEscrowDeposit({
          id: `escrow-${Date.now()}`,
          bountyId,
          bountyTitle: title,
          sponsorName,
          sponsorEmail: currentUser?.email || 'sponsor@valuvid.app',
          totalPrizeGHS: rewardPoolGHS,
          developerCommissionGHS: platformFee,
          totalFundedGHS: totalUpfront,
          paystackReference: res.reference,
          durationDays: effectiveDuration,
          status: 'ESCROW_LOCKED',
          createdAt: new Date().toISOString(),
        });

        // 2. Publish bounty challenge into ValuVid feed
        sponsorBounty(title, sponsorName, rewardPoolGHS, category, res.reference, effectiveDuration);

        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FF9F0A', '#00B2FE', '#10B981'],
        });

        setShowSponsorModal(false);
      },
      onClose: () => {
        setIsProcessing(false);
      },
    });
  };

  return (
    <div className={`fixed inset-0 z-50 ${isLight ? 'bg-black/60' : 'bg-black/85'} backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none`}>
      <form
        onSubmit={handleCreate}
        className={`w-full max-w-sm ${
          isLight ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' : 'bg-[#070E1B] border-[#FF9F0A]/30 text-white shadow-2xl'
        } border rounded-3xl p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-slate-200' : 'border-neutral-800'}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF9F0A] to-amber-600 p-[1.5px]">
              <div className={`w-full h-full ${isLight ? 'bg-slate-50' : 'bg-[#050B14]'} rounded-[10px] flex items-center justify-center`}>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Sponsor a Micro-Bounty</h3>
              <p className={`text-[10px] ${isLight ? 'text-amber-700 font-semibold' : 'text-amber-400'}`}>Paystack Secured • Upfront Brand Escrow</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSponsorModal(false)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              isLight ? 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>
          Fund an authentic creator video challenge upfront via Mobile Money or Card. Funds are locked safely in escrow until winning videos are verified.
        </p>

        <div>
          <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
            Challenge Title
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Best 30s Street Food Vlog Challenge"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none ${
              isLight
                ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                : 'bg-[#0A1628] border border-neutral-800 text-white placeholder-neutral-500 focus:border-[#00B2FE]'
            }`}
          />
        </div>

        <div>
          <label className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
            Brand / Sponsor Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Accra Tech Hub, Chale Fashion, Brand Co"
            value={sponsorName}
            onChange={(e) => setSponsorName(e.target.value)}
            className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none ${
              isLight
                ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                : 'bg-[#0A1628] border border-neutral-800 text-white placeholder-neutral-500 focus:border-[#00B2FE]'
            }`}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={`text-[11px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
              Reward Pool Size (Cedis)
            </label>
            <span className={`text-[10px] font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              Min: GHS 100
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {[100, 250, 500, 1000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setRewardPoolGHS(amt)}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  rewardPoolGHS === amt
                    ? (isLight ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'bg-[#FF9F0A] text-[#070E1B]')
                    : (isLight ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200' : 'bg-[#0A1628] text-neutral-300 border border-neutral-800')
                }`}
              >
                GHS {amt}
              </button>
            ))}
          </div>

          <div className="relative">
            <span className={`absolute left-3 top-2.5 text-xs font-bold ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
              GHS
            </span>
            <input
              type="number"
              min="100"
              step="10"
              placeholder="Or enter custom amount (min 100)"
              value={rewardPoolGHS || ''}
              onChange={(e) => setRewardPoolGHS(Math.max(0, Number(e.target.value)))}
              className={`w-full rounded-xl pl-12 pr-3 py-2 text-xs font-bold focus:outline-none ${
                isLight
                  ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                  : 'bg-[#0A1628] border border-neutral-800 text-white placeholder-neutral-500 focus:border-[#00B2FE]'
              }`}
            />
          </div>
        </div>

        {/* Challenge Duration */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <label className={`text-[11px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                Challenge Duration
              </label>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isLight ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}>
              {effectiveDuration} {effectiveDuration === 1 ? 'Day' : 'Days'} Active
            </span>
          </div>

          {/* Quick preset chips */}
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {[3, 7, 14, 30].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => {
                  setDurationDays(days);
                  setCustomDuration('');
                }}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  durationDays === days && !customDuration
                    ? (isLight ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'bg-[#FF9F0A] text-[#070E1B]')
                    : (isLight ? 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200' : 'bg-[#0A1628] text-neutral-300 border border-neutral-800 hover:border-neutral-700')
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>

          {/* Custom days input */}
          <div className="relative">
            <span className={`absolute left-3 top-2.5 text-xs font-bold ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
              Days
            </span>
            <input
              type="number"
              min="1"
              max="90"
              placeholder="Or enter custom days (e.g. 5, 21)"
              value={customDuration}
              onChange={(e) => {
                const val = e.target.value;
                setCustomDuration(val);
                if (val && Number(val) > 0) {
                  setDurationDays(Math.min(90, Math.max(1, Math.round(Number(val)))));
                } else if (!val) {
                  setDurationDays(7);
                }
              }}
              className={`w-full rounded-xl pl-14 pr-3 py-2 text-xs font-bold focus:outline-none ${
                isLight
                  ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                  : 'bg-[#0A1628] border border-neutral-800 text-white placeholder-neutral-500 focus:border-[#00B2FE]'
              }`}
            />
          </div>
          <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
            Creators have this duration to submit video entries before winners are selected and escrow is paid out.
          </p>
        </div>

        {/* Upfront Escrow Breakdown */}
        <div className={`p-3.5 rounded-2xl border flex flex-col gap-2 text-xs ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#0A1628] border border-neutral-800 text-neutral-400'
        }`}>
          <div className="flex justify-between">
            <span>Direct Creator Prize Pool (Locked in Escrow):</span>
            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>GHS {rewardPoolGHS.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Developer / Platform Commission ({getPlatformCommissionPercent()}%):</span>
            <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>GHS {platformFee.toFixed(2)}</span>
          </div>
          <div className={`flex justify-between pt-2 border-t font-bold ${
            isLight ? 'border-slate-200 text-slate-900' : 'border-neutral-800 text-neutral-300'
          }`}>
            <span>Total Escrow Deposit via Paystack:</span>
            <span className={`font-black ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>GHS {totalUpfront.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className={`w-full py-3.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50 ${
            isLight
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/25'
              : 'bg-white hover:bg-neutral-100 text-black shadow-xl shadow-white/20'
          }`}
        >
          <Lock className="w-4 h-4 text-slate-950" />
          <span>{isProcessing ? 'Opening Paystack Checkout...' : `Pay & Lock GHS ${totalUpfront.toFixed(2)} in Escrow`}</span>
        </button>
      </form>
    </div>
  );
};
