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
  const { showFundingModal, setShowFundingModal, fundingMetrics, wallet, setShowProModal, setShowSponsorModal } = useApp();

  if (!showFundingModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
      <div className="w-full max-w-md bg-[#070E1B] border border-[#00B2FE]/30 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl max-h-[85vh] overflow-y-auto text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00B2FE] to-[#FF9F0A] p-[1.5px]">
              <div className="w-full h-full bg-[#050B14] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Sustainable Creator Funding Engine</h3>
              <p className="text-[10px] text-neutral-400">Zero Net-Cost Escrow & Startup Economics</p>
            </div>
          </div>
          <button
            onClick={() => setShowFundingModal(false)}
            className="w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. PEER-TO-PEER ESCROW FLOAT (ZERO NET-COST) */}
        <div className="bg-gradient-to-br from-[#00B2FE]/15 via-[#0A1628] to-[#070E1B] border border-[#00B2FE]/30 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#FF9F0A]" />
              Pillar 1: Peer-to-Peer Float
            </span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/40">
              Zero Out-of-Pocket Liability
            </span>
          </div>

          <div className="text-2xl font-black text-white tracking-tight">
            GHS {fundingMetrics.totalEscrowFloatGHS.toLocaleString()}{' '}
            <span className="text-xs font-semibold text-neutral-400">in Mobile Money Float</span>
          </div>
          <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
            Viewers pre-fund wallets via MTN MoMo / Telecel. Tips and unlock fees circulate directly from users to creators without burning startup runway.
          </p>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10 text-center">
            <div className="bg-black/40 p-2 rounded-xl border border-white/5">
              <span className="text-[10px] text-neutral-400 block">Direct Creator Share</span>
              <span className="text-sm font-black text-emerald-400">92%</span>
            </div>
            <div className="bg-black/40 p-2 rounded-xl border border-white/5">
              <span className="text-[10px] text-neutral-400 block">Platform Service Cut</span>
              <span className="text-sm font-black text-amber-400">8%</span>
            </div>
          </div>
        </div>

        {/* 2. SPONSORED MICRO-BOUNTIES & WATCH REWARD POOL */}
        <div className="bg-[#0A1628] border border-neutral-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Pillar 2: Brand-Funded Bounties & Watch Pools
              </h4>
            </div>
            <button
              onClick={() => {
                setShowFundingModal(false);
                setShowSponsorModal(true);
              }}
              className="text-[10px] text-amber-400 font-bold bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 transition-colors"
            >
              + Sponsor Challenge
            </button>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed mb-3">
            Local Ghanaian businesses & brands fund challenge prize pools upfront to get viral user-generated video reviews.
          </p>

          <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-neutral-800 text-xs mb-3">
            <span className="text-neutral-400">Upfront Brand Escrow Funded:</span>
            <span className="font-bold text-amber-300">
              GHS {fundingMetrics.sponsoredBountiesFundedGHS.toLocaleString()}
            </span>
          </div>

          {/* Explicit Watch-Reward Zero Developer Cost Explanation */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
              <Eye className="w-3.5 h-3.5" />
              <span>How "Watch-to-Earn" Rewards Are Funded (Zero Company Debt):</span>
            </div>
            <p className="text-[10px] text-neutral-300 leading-relaxed">
              Viewers are <strong>never paid from developer pockets</strong>. Watch rewards are strictly funded by:
            </p>
            <ul className="text-[10px] text-neutral-400 list-disc list-inside space-y-0.5">
              <li><strong className="text-white">15% of Brand Challenge Pools:</strong> Brands deposit cash upfront to reward viewers who watch and vote on submissions.</li>
              <li><strong className="text-white">In-Feed Ad Revenue Share:</strong> Advertisers pay GHS 0.10/impression; ValuVid passes 40% (GHS 0.04) directly to the viewer.</li>
            </ul>
          </div>
        </div>

        {/* 3. PRO SUBSCRIPTIONS & CREATOR TOOLS */}
        <div className="bg-[#0A1628] border border-neutral-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Pillar 3: Creator Pro Subscription
              </h4>
            </div>
            <button
              onClick={() => {
                setShowFundingModal(false);
                setShowProModal(true);
              }}
              className="text-[10px] text-cyan-300 font-bold bg-[#00B2FE]/10 hover:bg-[#00B2FE]/20 px-2 py-0.5 rounded-full border border-[#00B2FE]/30 transition-colors"
            >
              View Pro Tiers
            </button>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed mb-3">
            Recurring monthly subscription revenue from creators paying for priority 4K encoding, advanced retention analytics, and algorithm spotlight.
          </p>
          <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-neutral-800 text-xs">
            <span className="text-neutral-400">Active Pro Members:</span>
            <span className="font-bold text-cyan-300">{fundingMetrics.activeProSubscribers} Creators</span>
          </div>
        </div>

        {/* 4. ECOSYSTEM GRANTS & INVESTOR TRACTION */}
        <div className="bg-[#0A1628] border border-neutral-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Pillar 4: Grant & Seed Readiness
              </h4>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
              MEST & Google Africa Ready
            </span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed mb-3">
            Demonstrating a functional MVP that empowers African informal creators with local payment rails (MTN MoMo & Telecel Cash) without diluting platform equity prematurely.
          </p>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-black/40 p-2 rounded-xl border border-neutral-800">
              <span className="text-[10px] text-neutral-400 block">MoMo Success</span>
              <span className="font-bold text-emerald-400">99.4%</span>
            </div>
            <div className="bg-black/40 p-2 rounded-xl border border-neutral-800">
              <span className="text-[10px] text-neutral-400 block">Circulation Rate</span>
              <span className="font-bold text-cyan-300">4.2x</span>
            </div>
            <div className="bg-black/40 p-2 rounded-xl border border-neutral-800">
              <span className="text-[10px] text-neutral-400 block">Startup Risk</span>
              <span className="font-bold text-emerald-400">Zero Debt</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowFundingModal(false)}
          className="w-full py-3 rounded-xl bg-white hover:bg-neutral-100 text-black font-black text-xs shadow-lg shadow-white/20 active:scale-95 transition-all"
        >
          Got It • Continue Swiping
        </button>
      </div>
    </div>
  );
};
