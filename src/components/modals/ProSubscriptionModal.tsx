import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Check, 
  X, 
  Crown, 
  Zap, 
  ShieldCheck, 
  Video, 
  BarChart3, 
  Coins 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ProSubscriptionModal: React.FC = () => {
  const { showProModal, setShowProModal, isProMember, subscribePro, wallet, theme } = useApp();
  const [selectedPlan, setSelectedPlan] = useState<'creator_pro' | 'supporter_vip'>('creator_pro');

  if (!showProModal) return null;

  const handleSubscribe = () => {
    const price = selectedPlan === 'creator_pro' ? 29.00 : 12.00;
    const planName = selectedPlan === 'creator_pro' ? 'ValuVid Creator Pro' : 'Supporter VIP Pass';

    const success = subscribePro(planName, price);
    if (success) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00B2FE', '#FF9F0A', '#10B981', '#FFFFFF'],
      });
      setTimeout(() => {
        setShowProModal(false);
      }, 1200);
    }
  };

  const isLight = theme === 'light';

  return (
    <div className={`fixed inset-0 z-50 ${isLight ? 'bg-black/60' : 'bg-black/85'} backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none`}>
      <div className={`w-full max-w-sm ${
        isLight ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' : 'bg-[#070E1B] border-[#00B2FE]/30 text-white shadow-2xl'
      } border rounded-3xl p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-slate-200' : 'border-neutral-800'}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00B2FE] to-[#FF9F0A] p-[1.5px]">
              <div className={`w-full h-full ${isLight ? 'bg-slate-50' : 'bg-[#050B14]'} rounded-[10px] flex items-center justify-center`}>
                <Crown className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>ValuVid Subscriptions</h3>
              <p className={`text-[10px] ${isLight ? 'text-cyan-700 font-semibold' : 'text-cyan-300'}`}>Sustainable Recurring Creator Model</p>
            </div>
          </div>
          <button
            onClick={() => setShowProModal(false)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              isLight ? 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Plan Switcher */}
        <div className={`grid grid-cols-2 gap-2 p-1 rounded-2xl border ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/50 border-neutral-800'
        }`}>
          <button
            type="button"
            onClick={() => setSelectedPlan('creator_pro')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              selectedPlan === 'creator_pro'
                ? 'bg-gradient-to-r from-[#00B2FE] to-[#0284C7] text-white shadow-md shadow-[#00B2FE]/30'
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white')
            }`}
          >
            Creator Pro
          </button>
          <button
            type="button"
            onClick={() => setSelectedPlan('supporter_vip')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              selectedPlan === 'supporter_vip'
                ? 'bg-gradient-to-r from-[#FF9F0A] to-[#F59E0B] text-black shadow-md shadow-[#FF9F0A]/30'
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white')
            }`}
          >
            Supporter VIP
          </button>
        </div>

        {/* Selected Plan Details */}
        {selectedPlan === 'creator_pro' ? (
          <div className={`${
            isLight ? 'bg-slate-50 border-cyan-200' : 'bg-[#0A1628] border-[#00B2FE]/30'
          } border rounded-2xl p-4 flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  isLight ? 'text-cyan-700' : 'text-cyan-300'
                }`}>
                  For Serious African Creators
                </span>
                <h4 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Creator Pro Pass</h4>
              </div>
              <div className="text-right">
                <span className={`text-xl font-black ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>GHS 29</span>
                <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>/ month</span>
              </div>
            </div>

            <div className={`flex flex-col gap-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-neutral-800'}`}>
              {[
                'Priority 4K 60FPS Video Transcoding & CDN delivery',
                'Advanced Audience Retention & Tipper Deep-Dive',
                '2.5x Algorithm Spotlight in Discover & For You Feed',
                'Official Gold Creator Badge & Custom Tipping Tiers',
                'Instant 0% Payout Fee to MTN MoMo & Telecel',
                'Twice-Weekly Withdrawal Frequency (Free: 1x/week • Pro: 2x/week)',
              ].map((feat, i) => (
                <div key={i} className={`flex items-start gap-2 text-xs ${isLight ? 'text-slate-700' : 'text-neutral-200'}`}>
                  <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`${
            isLight ? 'bg-slate-50 border-amber-200' : 'bg-[#0A1628] border-[#FF9F0A]/30'
          } border rounded-2xl p-4 flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  isLight ? 'text-amber-700' : 'text-amber-400'
                }`}>
                  For Super Viewers & Fans
                </span>
                <h4 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Supporter VIP Pass</h4>
              </div>
              <div className="text-right">
                <span className={`text-xl font-black ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>GHS 12</span>
                <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>/ month</span>
              </div>
            </div>

            <div className={`flex flex-col gap-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-neutral-800'}`}>
              {[
                '100% Ad-Free & Sponsored-Free Clean Stream',
                '2x Watch-Reward Earning Multiplier (+GHS 0.40/cycle)',
                'VIP Supporter Profile Badge in Comment Sections',
                'Direct micro-fee discount on unlocked creator masterclasses',
              ].map((feat, i) => (
                <div key={i} className={`flex items-start gap-2 text-xs ${isLight ? 'text-slate-700' : 'text-neutral-200'}`}>
                  <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Balance Status */}
        <div className={`flex items-center justify-between text-xs px-1 ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
          <span>Your Wallet Balance:</span>
          <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
            GHS {wallet.balanceGHS.toFixed(2)}
          </span>
        </div>

        {/* Subscribe Button */}
        <button
          onClick={handleSubscribe}
          className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all ${
            isLight
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'bg-white hover:bg-neutral-100 text-black shadow-xl shadow-white/20'
          }`}
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>
            {isProMember ? 'Renew Pro Subscription' : `Activate for GHS ${selectedPlan === 'creator_pro' ? '29.00' : '12.00'} / mo`}
          </span>
        </button>
      </div>
    </div>
  );
};
