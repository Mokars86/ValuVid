import React from 'react';
import { 
  ShieldCheck, 
  Coins, 
  Award, 
  TrendingUp, 
  Zap, 
  CheckCircle2, 
  X, 
  Building2, 
  Lock, 
  Layers,
  ArrowRight,
  ExternalLink,
  Eye
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FundingEconomicsModal: React.FC = () => {
  const { 
    showFundingModal, 
    setShowFundingModal, 
    fundingMetrics, 
    wallet, 
    setShowProModal, 
    setShowSponsorModal,
    theme 
  } = useApp();

  if (!showFundingModal) return null;

  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
      <div className={`w-full max-w-md ${
        isLight ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' : 'bg-[#070E1B] border-[#00B2FE]/30 text-white shadow-2xl'
      } border rounded-3xl p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto transition-colors`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-neutral-800'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00B2FE] to-[#FF9F0A] p-[1.5px] shrink-0">
              <div className={`w-full h-full ${isLight ? 'bg-cyan-50' : 'bg-[#050B14]'} rounded-[10px] flex items-center justify-center`}>
                <ShieldCheck className="w-4 h-4 text-cyan-500" />
              </div>
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Sustainable Creator Funding Engine</h3>
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Zero Net-Cost Escrow & Startup Economics</p>
            </div>
          </div>
          <button
            onClick={() => setShowFundingModal(false)}
            className={`w-7 h-7 rounded-full ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600' : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-400 hover:text-white'
            } border flex items-center justify-center transition-colors`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. PEER-TO-PEER ESCROW FLOAT (ZERO NET-COST) */}
        <div className={`${
          isLight
            ? 'bg-gradient-to-br from-cyan-50/80 via-slate-50 to-amber-50/40 border-cyan-200/80'
            : 'bg-gradient-to-br from-[#00B2FE]/15 via-[#0A1628] to-[#070E1B] border-[#00B2FE]/30'
        } border p-4 rounded-2xl relative overflow-hidden`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold ${isLight ? 'text-cyan-800' : 'text-cyan-300'} uppercase tracking-wider flex items-center gap-1.5`}>
              <Zap className="w-3.5 h-3.5 text-[#FF9F0A]" />
              Pillar 1: Peer-to-Peer Float
            </span>
            <span className={`text-[9px] ${
              isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            } px-2 py-0.5 rounded-full font-bold border`}>
              Zero Out-of-Pocket Liability
            </span>
          </div>

          <div className={`text-2xl font-black ${isLight ? 'text-slate-900' : 'text-white'} tracking-tight`}>
            GHS {fundingMetrics.totalEscrowFloatGHS.toLocaleString()}{' '}
            <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>in Mobile Money Float</span>
          </div>
          <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-neutral-300'} mt-1 leading-relaxed`}>
            Viewers pre-fund wallets via MTN MoMo / Telecel. Tips and unlock fees circulate directly from users to creators without burning startup runway.
          </p>

          <div className={`grid grid-cols-2 gap-2 mt-3 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-white/10'} text-center`}>
            <div className={`${isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-black/40 border-white/5'} p-2 rounded-xl border`}>
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'} block`}>Direct Creator Share</span>
              <span className={`text-sm font-black ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>92%</span>
            </div>
            <div className={`${isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-black/40 border-white/5'} p-2 rounded-xl border`}>
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'} block`}>Platform Service Cut</span>
              <span className={`text-sm font-black ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>8%</span>
            </div>
          </div>
        </div>

        {/* 2. SPONSORED MICRO-BOUNTIES & WATCH REWARD POOL */}
        <div className={`${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A1628] border-neutral-800'} border p-4 rounded-2xl`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'} uppercase tracking-wider`}>
                Pillar 2: Brand-Funded Bounties & Watch Pools
              </h4>
            </div>
            <button
              onClick={() => {
                setShowFundingModal(false);
                setShowSponsorModal(true);
              }}
              className={`text-[10px] ${
                isLight ? 'text-amber-700 font-bold bg-amber-100 hover:bg-amber-200 border-amber-300' : 'text-amber-400 font-bold bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30'
              } px-2 py-0.5 rounded-full border transition-colors`}
            >
              + Sponsor Challenge
            </button>
          </div>
          <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-neutral-300'} leading-relaxed mb-3`}>
            Local Ghanaian businesses & brands fund challenge prize pools upfront to get viral user-generated video reviews.
          </p>

          <div className={`flex items-center justify-between ${isLight ? 'bg-white border-slate-200' : 'bg-black/40 border-neutral-800'} p-2.5 rounded-xl border text-xs mb-3`}>
            <span className={isLight ? 'text-slate-500' : 'text-neutral-400'}>Upfront Brand Escrow Funded:</span>
            <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>
              GHS {fundingMetrics.sponsoredBountiesFundedGHS.toLocaleString()}
            </span>
          </div>

          {/* Explicit Watch-Reward Zero Developer Cost Explanation */}
          <div className={`${
            isLight ? 'bg-emerald-50/80 border-emerald-200' : 'bg-emerald-950/40 border-emerald-500/30'
          } border rounded-xl p-3 flex flex-col gap-1.5`}>
            <div className={`flex items-center gap-1.5 ${isLight ? 'text-emerald-800' : 'text-emerald-400'} font-bold text-[11px]`}>
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>How "Watch-to-Earn" Rewards Are Funded (Zero Company Debt):</span>
            </div>
            <p className={`text-[10px] ${isLight ? 'text-slate-700' : 'text-neutral-300'} leading-relaxed`}>
              Viewers are <strong>never paid from developer pockets</strong>. Watch rewards are strictly funded by:
            </p>
            <ul className={`text-[10px] ${isLight ? 'text-slate-600' : 'text-neutral-400'} list-disc list-inside space-y-0.5`}>
              <li><strong className={isLight ? 'text-slate-900' : 'text-white'}>15% of Brand Challenge Pools:</strong> Brands deposit cash upfront to reward viewers who watch and vote on submissions.</li>
              <li><strong className={isLight ? 'text-slate-900' : 'text-white'}>In-Feed Ad Revenue Share:</strong> Advertisers pay GHS 0.10/impression; ValuVid passes 40% (GHS 0.04) directly to the viewer.</li>
            </ul>
          </div>
        </div>

        {/* 3. PRO SUBSCRIPTIONS & CREATOR TOOLS */}
        <div className={`${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A1628] border-neutral-800'} border p-4 rounded-2xl`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-500" />
              <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'} uppercase tracking-wider`}>
                Pillar 3: Creator Pro Subscription
              </h4>
            </div>
            <button
              onClick={() => {
                setShowFundingModal(false);
                setShowProModal(true);
              }}
              className={`text-[10px] ${
                isLight ? 'text-cyan-800 font-bold bg-cyan-100 hover:bg-cyan-200 border-cyan-300' : 'text-cyan-300 font-bold bg-[#00B2FE]/10 hover:bg-[#00B2FE]/20 border-[#00B2FE]/30'
              } px-2 py-0.5 rounded-full border transition-colors`}
            >
              View Pro Tiers
            </button>
          </div>
          <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-neutral-300'} leading-relaxed mb-3`}>
            Recurring monthly subscription revenue from creators paying for priority 4K encoding, advanced retention analytics, and algorithm spotlight.
          </p>
          <div className={`flex items-center justify-between ${isLight ? 'bg-white border-slate-200' : 'bg-black/40 border-neutral-800'} p-2.5 rounded-xl border text-xs`}>
            <span className={isLight ? 'text-slate-500' : 'text-neutral-400'}>Active Pro Members:</span>
            <span className={`font-bold ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>{fundingMetrics.activeProSubscribers} Creators</span>
          </div>
        </div>

        {/* 4. ECOSYSTEM GRANTS & INVESTOR TRACTION */}
        <div className={`${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A1628] border-neutral-800'} border p-4 rounded-2xl`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-500" />
              <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'} uppercase tracking-wider`}>
                Pillar 4: Grant & Seed Readiness
              </h4>
            </div>
            <span className={`text-[10px] ${
              isLight ? 'text-emerald-800 font-bold bg-emerald-100 border-emerald-300' : 'text-emerald-400 font-bold bg-emerald-950/60 border-emerald-800'
            } px-2 py-0.5 rounded-full border`}>
              MEST & Google Africa Ready
            </span>
          </div>
          <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-neutral-300'} leading-relaxed mb-3`}>
            Demonstrating a functional MVP that empowers African informal creators with local payment rails (MTN MoMo & Telecel Cash) without diluting platform equity prematurely.
          </p>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className={`${isLight ? 'bg-white border-slate-200' : 'bg-black/40 border-neutral-800'} p-2 rounded-xl border`}>
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'} block`}>MoMo Success</span>
              <span className={`font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>99.4%</span>
            </div>
            <div className={`${isLight ? 'bg-white border-slate-200' : 'bg-black/40 border-neutral-800'} p-2 rounded-xl border`}>
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'} block`}>Circulation Rate</span>
              <span className={`font-bold ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>4.2x</span>
            </div>
            <div className={`${isLight ? 'bg-white border-slate-200' : 'bg-black/40 border-neutral-800'} p-2 rounded-xl border`}>
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'} block`}>Startup Risk</span>
              <span className={`font-bold ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>Zero Debt</span>
            </div>
          </div>
        </div>

        {/* 5. DEVELOPER MONETIZATION & MONTHLY SETTLEMENT SCHEDULE */}
        <div className={`${isLight ? 'bg-amber-50/70 border-amber-200' : 'bg-[#131A26] border-amber-500/30'} border p-4 rounded-2xl`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-500" />
              <h4 className={`text-xs font-bold ${isLight ? 'text-amber-900' : 'text-amber-300'} uppercase tracking-wider`}>
                Developer Revenue & Monthly Settlement
              </h4>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
              isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}>
              1st of Every Month
            </span>
          </div>

          <p className={`text-xs ${isLight ? 'text-slate-700' : 'text-neutral-300'} leading-relaxed mb-3`}>
            As the platform developer, you take a transparent percentage of transactions flowing through ValuVid. Accumulated fees are automatically disbursed to your developer MoMo / Bank account on the 1st of every month.
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className={`${isLight ? 'bg-white border-amber-200' : 'bg-black/40 border-white/5'} p-2 rounded-xl border`}>
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'} block`}>Tip Commission</span>
              <span className="font-bold text-amber-600">8% Platform Cut</span>
            </div>
            <div className={`${isLight ? 'bg-white border-amber-200' : 'bg-black/40 border-white/5'} p-2 rounded-xl border`}>
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'} block`}>Ad Revenue Split</span>
              <span className="font-bold text-cyan-600">60% Developer Net</span>
            </div>
            <div className={`${isLight ? 'bg-white border-amber-200' : 'bg-black/40 border-white/5'} p-2 rounded-xl border`}>
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'} block`}>Brand Challenge Fee</span>
              <span className="font-bold text-emerald-600">15% Host Fee</span>
            </div>
            <div className={`${isLight ? 'bg-white border-amber-200' : 'bg-black/40 border-white/5'} p-2 rounded-xl border`}>
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'} block`}>Pro Subscriptions</span>
              <span className="font-bold text-purple-600">100% Platform Net</span>
            </div>
          </div>

          <div className={`flex items-center justify-between ${isLight ? 'bg-white border-amber-200' : 'bg-black/50 border-neutral-800'} p-2.5 rounded-xl border text-xs`}>
            <span className={isLight ? 'text-slate-600' : 'text-neutral-400'}>Next Monthly Settlement:</span>
            <span className="font-bold text-emerald-500">1st of Next Month (Automated Rail)</span>
          </div>
        </div>

        <button
          onClick={() => setShowFundingModal(false)}
          className={`w-full py-3.5 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all ${
            isLight
              ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
              : 'bg-white hover:bg-neutral-100 text-black shadow-white/20'
          }`}
        >
          Got It • Continue Swiping
        </button>
      </div>
    </div>
  );
};
