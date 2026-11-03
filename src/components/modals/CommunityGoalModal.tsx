import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Target, 
  X, 
  Coins, 
  Sparkles, 
  Trophy, 
  CheckCircle2, 
  Users, 
  Play, 
  Lock, 
  Unlock, 
  ArrowRight,
  Flame
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { VideoItem } from '../../types';
import { sounds } from '../../utils/soundEffects';

interface CommunityGoalModalProps {
  video: VideoItem | null;
  onClose: () => void;
}

export const CommunityGoalModal: React.FC<CommunityGoalModalProps> = ({ video, onClose }) => {
  const { wallet, sendTip, currentUser } = useApp();
  const [selectedAmount, setSelectedAmount] = useState<number>(20);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [goal, setGoal] = useState(video?.communityGoal);
  const [unlockedSuccess, setUnlockedSuccess] = useState(false);

  if (!video || !video.communityGoal) return null;

  const currentGoal = goal || video.communityGoal;
  const contribution = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;
  const progressPercent = Math.min(100, Math.round((currentGoal.currentGHS / currentGoal.targetGHS) * 100));
  const remainingGHS = Math.max(0, currentGoal.targetGHS - currentGoal.currentGHS);

  const handleContribute = () => {
    if (contribution <= 0) return;
    if (wallet.balanceGHS < contribution) {
      alert(`Insufficient balance (GHS ${wallet.balanceGHS.toFixed(2)}). Please top up your wallet.`);
      return;
    }

    const success = sendTip(
      video.id,
      contribution,
      `🎯 Community Goal Contribution: GHS ${contribution.toFixed(2)} towards "${currentGoal.title}"!`
    );

    if (success) {
      sounds.playSuccessPayout();
      const updatedCurrent = Number((currentGoal.currentGHS + contribution).toFixed(2));
      const reached = updatedCurrent >= currentGoal.targetGHS;

      setGoal({
        ...currentGoal,
        currentGHS: updatedCurrent,
        isCompleted: reached,
        contributorsCount: currentGoal.contributorsCount + 1,
        recentContributors: [
          { username: currentUser.username, amountGHS: contribution, timeAgo: 'Just now' },
          ...(currentGoal.recentContributors || [])
        ]
      });

      confetti({
        particleCount: reached ? 200 : 90,
        spread: reached ? 100 : 70,
        origin: { y: 0.55 },
        colors: ['#FF9F0A', '#10B981', '#00B2FE', '#E11D48'],
      });

      if (reached) {
        setUnlockedSuccess(true);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
      <div className="w-full max-w-md bg-[#070E1B] border border-[#FF9F0A]/40 rounded-3xl p-4 sm:p-5 flex flex-col gap-3.5 max-h-[85vh] overflow-y-auto text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 p-[1.5px] shrink-0">
              <div className="w-full h-full bg-[#050B14] rounded-[10px] flex items-center justify-center">
                <Target className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white tracking-wide">Community Goal</h3>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                  currentGoal.isCompleted
                    ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800'
                    : 'text-amber-400 bg-amber-950/80 border-amber-800 animate-pulse'
                }`}>
                  {currentGoal.isCompleted ? '🎉 Goal Unlocked!' : '● Live Micro-Funding'}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400">Tipping with a Purpose • Shared Milestone Unlock</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Goal Hero Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#0A182E] to-rose-500/15 border border-[#FF9F0A]/40 p-4 shadow-xl">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Creator Milestone
            </span>
            <span>{currentGoal.contributorsCount} Community Supporters</span>
          </div>

          <h3 className="text-base font-black text-white leading-tight mb-2">
            {currentGoal.title}
          </h3>

          {/* Progress Bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-lg font-black text-amber-400">
                GHS {currentGoal.currentGHS.toFixed(2)}{' '}
                <span className="text-xs font-normal text-neutral-400">/ GHS {currentGoal.targetGHS.toFixed(2)}</span>
              </span>
              <span className="text-xs font-black text-white font-mono">{progressPercent}%</span>
            </div>

            <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden border border-neutral-700/80">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 transition-all duration-700 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-0.5">
              <span>{currentGoal.isCompleted ? 'Target 100% Achieved!' : `GHS ${remainingGHS.toFixed(2)} remaining to unlock`}</span>
              <span className="text-emerald-400 font-bold">Automatic Group Unlock 🔓</span>
            </div>
          </div>
        </div>

        {/* Reward Card: What unlocks for everyone */}
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
          currentGoal.isCompleted 
            ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200' 
            : 'bg-black/50 border-neutral-800 text-neutral-300'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              currentGoal.isCompleted ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400'
            }`}>
              {currentGoal.isCompleted ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                {currentGoal.isCompleted ? 'Reward Unlocked for You!' : 'Community Reward Trigger:'}
              </span>
              <p className="text-[11px] font-semibold text-white truncate">
                {currentGoal.rewardDescription}
              </p>
            </div>
          </div>

          {currentGoal.isCompleted && (
            <button
              onClick={() => alert('Launching Unlocked Behind-the-Scenes 4K Masterclass Video!')}
              className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] rounded-xl flex items-center gap-1 shadow-md shrink-0"
            >
              <Play className="w-3 h-3 fill-black" />
              <span>Watch</span>
            </button>
          )}
        </div>

        {/* Preset Contribution Grid */}
        {!currentGoal.isCompleted ? (
          <div>
            <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block mb-1.5">
              Select Your Contribution:
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[10, 20, 50, 100].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount('');
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedAmount === amt && !customAmount
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-black shadow-md'
                      : 'bg-neutral-900 text-neutral-300 border border-neutral-800'
                  }`}
                >
                  GHS {amt}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs">
              <span className="text-neutral-400">Custom Cedis:</span>
              <input
                type="number"
                min="1"
                placeholder="Other amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-24 bg-transparent text-right font-bold text-white focus:outline-none"
              />
            </div>

            {/* Action button */}
            <button
              onClick={handleContribute}
              className="w-full py-3.5 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs shadow-lg shadow-white/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2.5"
            >
              <Coins className="w-4 h-4 text-black" />
              <span>Contribute GHS {contribution.toFixed(2)} to Goal</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-2 text-xs text-emerald-400 font-bold bg-emerald-950/20 rounded-xl border border-emerald-500/30">
            Goal complete! Thank you for backing authentic African creators.
          </div>
        )}

        {/* Live Recent Contributors Ticker */}
        {currentGoal.recentContributors && currentGoal.recentContributors.length > 0 && (
          <div className="bg-black/40 rounded-xl p-2.5 border border-neutral-800">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1.5 tracking-wider">
              Recent Goal Backers:
            </span>
            <div className="flex flex-col gap-1.5">
              {currentGoal.recentContributors.slice(0, 3).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] text-neutral-300">
                  <span className="text-white font-medium">@{c.username}</span>
                  <span className="text-amber-400 font-bold">+GHS {c.amountGHS.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};