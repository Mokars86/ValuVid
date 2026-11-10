import React from 'react';
import { 
  BarChart3, 
  X, 
  Coins, 
  Eye, 
  TrendingUp, 
  Award, 
  Clock, 
  Share2, 
  Users,
  Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCompactNumber } from '../../utils/formatNumber';

export const VideoAnalyticsModal: React.FC = () => {
  const { analyticsVideo, closeAnalytics } = useApp();

  if (!analyticsVideo) return null;

  const totalTips = analyticsVideo.stats.tipsTotalGHS;
  const watchRewardsEst = Number((analyticsVideo.stats.views * 0.008).toFixed(2));
  const unlockRevenue = analyticsVideo.isPayPerUnlock ? Number((totalTips * 0.4).toFixed(2)) : 0;
  const grandTotal = Number((totalTips + watchRewardsEst + unlockRevenue).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl p-5 flex flex-col gap-4 shadow-2xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-sm font-bold text-white">Video Revenue & Analytics</h3>
          </div>
          <button
            onClick={closeAnalytics}
            className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video snapshot */}
        <div className="flex items-center gap-3 bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
          <img
            src={analyticsVideo.thumbnailUrl}
            alt={analyticsVideo.title}
            className="w-12 h-16 rounded-xl object-cover"
          />
          <div className="truncate flex-1">
            <h4 className="text-xs font-bold text-white line-clamp-1">
              {analyticsVideo.title}
            </h4>
            <div className="text-[10px] text-neutral-400">
              by @{analyticsVideo.creator.username}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.2 rounded-full border border-amber-500/30">
                {analyticsVideo.category}
              </span>
            </div>
          </div>
        </div>

        {/* Grand Total Revenue Card */}
        <div className="bg-gradient-to-br from-amber-500/20 via-neutral-900 to-neutral-950 p-4 rounded-2xl border border-amber-500/40">
          <span className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider block mb-1">
            Total Monetized Revenue
          </span>
          <div className="text-2xl font-black text-white">
            GHS {grandTotal.toFixed(2)}{' '}
            <span className="text-xs font-normal text-neutral-400">
              (≈ ${(grandTotal * 0.083).toFixed(2)} USD)
            </span>
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-neutral-800 text-center">
            <div>
              <div className="text-[10px] text-neutral-400">Direct Tips</div>
              <div className="text-xs font-bold text-amber-400 mt-0.5">
                GHS {totalTips.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-400">Watch Pool</div>
              <div className="text-xs font-bold text-emerald-400 mt-0.5">
                GHS {watchRewardsEst.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-neutral-400">Unlocks</div>
              <div className="text-xs font-bold text-cyan-400 mt-0.5">
                GHS {unlockRevenue.toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div>
          <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
            Engagement & Audience Metrics
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-neutral-300">Total Views</span>
              </div>
              <span className="text-xs font-bold text-white">
                {formatCompactNumber(analyticsVideo.stats?.views || 0)}
              </span>
            </div>

            <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-rose-500" />
                <span className="text-xs text-neutral-300">Likes</span>
              </div>
              <span className="text-xs font-bold text-rose-400">
                {formatCompactNumber(analyticsVideo.stats?.likes || 0)}
              </span>
            </div>

            <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-neutral-300">Comments</span>
              </div>
              <span className="text-xs font-bold text-white">
                {formatCompactNumber(analyticsVideo.stats?.comments || 0)}
              </span>
            </div>

            <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-neutral-300">Shares</span>
              </div>
              <span className="text-xs font-bold text-white">
                {formatCompactNumber(analyticsVideo.stats?.shares || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Viewer Retention Curve Simulation */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Audience Retention Graph
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold">
              Above Average Retention
            </span>
          </div>

          <div className="h-16 bg-neutral-950 rounded-xl border border-neutral-800 p-2 flex items-end justify-between gap-1">
            {[100, 94, 88, 82, 79, 75, 71, 68, 64, 60, 58, 55].map((pct, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-amber-500 to-amber-300 rounded-t"
                style={{ height: `${pct}%` }}
                title={`${i * 3}s: ${pct}%`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-neutral-500 mt-1">
            <span>0s (Start)</span>
            <span>15s (Hook)</span>
            <span>30s (Finish)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
