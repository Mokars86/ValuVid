import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  X, 
  Coins, 
  Sparkles, 
  ShieldCheck, 
  Award, 
  Clock, 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  Zap, 
  TrendingUp, 
  Users,
  ChevronRight,
  Flame,
  BadgeCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BountyChallenge } from '../../types';

export const WinPoolModal: React.FC = () => {
  const { 
    showWinPoolModal, 
    setShowWinPoolModal, 
    bounties, 
    transactions,
    setShowSponsorModal,
    setActiveTab,
    setFeedFilter,
    videos,
    setCurrentVideoIndex,
    theme
  } = useApp();

  const [activeTab, setActiveTabLocal] = useState<'pools' | 'winners' | 'rules' | 'leaderboard'>('pools');

  const isLight = theme === 'light';

  const totalPoolGHS = useMemo(() => bounties.reduce((sum, b) => sum + (b.rewardPoolGHS || 0), 0), [bounties]);
  const totalPoolUSD = Math.round(totalPoolGHS * 0.083);

  const realWinners = useMemo(() => {
    return transactions.filter((t) => t.type === 'bounty_reward');
  }, [transactions]);

  const realTopCreators = useMemo(() => {
    const creatorStatsMap = new Map<string, { name: string; username: string; avatar: string; tips: number; views: number; videosCount: number }>();
    videos.forEach((v) => {
      if (!v.creator?.username) return;
      const existing = creatorStatsMap.get(v.creator.username) || {
        name: v.creator.name || v.creator.username,
        username: v.creator.username,
        avatar: v.creator.avatar,
        tips: 0,
        views: 0,
        videosCount: 0
      };
      existing.tips += v.stats?.tipsTotalGHS || 0;
      existing.views += v.stats?.views || 0;
      existing.videosCount += 1;
      creatorStatsMap.set(v.creator.username, existing);
    });
    return Array.from(creatorStatsMap.values()).sort((a, b) => b.tips - a.tips);
  }, [videos]);

  if (!showWinPoolModal) return null;

  const handleEnterChallenge = (bounty: BountyChallenge) => {
    setShowWinPoolModal(false);
    setActiveTab('create');
  };

  const handleWatchContenders = (bounty: BountyChallenge) => {
    setShowWinPoolModal(false);
    setFeedFilter('bounties');
    setActiveTab('feed');
  };

  return (
    <div className={`fixed inset-0 z-50 ${isLight ? 'bg-black/60' : 'bg-black/85'} backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none`}>
      <div className={`w-full max-w-md ${
        isLight ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' : 'bg-[#070E1B] border-[#FF9F0A]/35 text-white shadow-2xl'
      } border rounded-3xl p-4 sm:p-5 flex flex-col gap-3.5 max-h-[85vh] overflow-y-auto`}>
        {/* HEADER */}
        <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-slate-200' : 'border-neutral-800/80'}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#FF9F0A] to-amber-600 p-[1.5px] shrink-0">
              <div className={`w-full h-full ${isLight ? 'bg-slate-50' : 'bg-[#050B14]'} rounded-[10px] flex items-center justify-center`}>
                <Trophy className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className={`text-sm font-black tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>ValuVid Win Pool Hub</h3>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                  isLight ? 'text-emerald-700 bg-emerald-50 border-emerald-300' : 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80'
                }`}>
                  ● Live Escrow
                </span>
              </div>
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Upfront Brand-Funded Cash Prizes for Creators</p>
            </div>
          </div>
          <button
            onClick={() => setShowWinPoolModal(false)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors shrink-0 ${
              isLight ? 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* HERO PRIZE POOL BANNER */}
        <div className={`relative overflow-hidden rounded-2xl border p-4 shadow-md ${
          isLight 
            ? 'bg-gradient-to-br from-amber-500/15 via-slate-50 to-cyan-500/10 border-amber-300 text-slate-900' 
            : 'bg-gradient-to-br from-amber-500/20 via-[#0A182E] to-[#00B2FE]/15 border-[#FF9F0A]/40 text-white shadow-xl'
        }`}>
          <div className="relative z-10 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 ${
                isLight ? 'text-amber-800' : 'text-amber-400'
              }`}>
                <Sparkles className="w-3 h-3 text-amber-500" /> Total Active Guaranteed Escrow
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isLight ? 'text-cyan-800 bg-cyan-100/70 border-cyan-300' : 'text-cyan-300 bg-cyan-950/80 border-cyan-800/70'
              }`}>
                {bounties.length} Active Pools
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                GHS {totalPoolGHS.toLocaleString()}
              </span>
              <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                (~${totalPoolUSD} USD)
              </span>
            </div>

            <div className={`flex items-center justify-between text-[10px] pt-2.5 mt-1 border-t ${
              isLight ? 'border-slate-200 text-slate-600' : 'border-white/10 text-neutral-300'
            }`}>
              <div className={`flex items-center gap-1 font-medium ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>100% Locked in MoMo Escrow</span>
              </div>
              <div className={`flex items-center gap-1 font-medium ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span>Instant 2s Payout</span>
              </div>
            </div>
          </div>

          <div className="absolute right-[-10px] -bottom-3 text-7xl opacity-10 select-none pointer-events-none">
            🏆
          </div>
        </div>

        {/* NAVIGATION SUB-TABS */}
        <div className={`grid grid-cols-4 gap-1 p-1 rounded-xl border text-[10px] sm:text-xs font-bold ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-black/60 border-neutral-800'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTabLocal('pools')}
            className={`py-1.5 rounded-lg transition-all ${
              activeTab === 'pools'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white')
            }`}
          >
            Active Pools
          </button>
          <button
            type="button"
            onClick={() => setActiveTabLocal('winners')}
            className={`py-1.5 rounded-lg transition-all ${
              activeTab === 'winners'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white')
            }`}
          >
            Winners 💸
          </button>
          <button
            type="button"
            onClick={() => setActiveTabLocal('leaderboard')}
            className={`py-1.5 rounded-lg transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white')
            }`}
          >
            Top Hunters
          </button>
          <button
            type="button"
            onClick={() => setActiveTabLocal('rules')}
            className={`py-1.5 rounded-lg transition-all ${
              activeTab === 'rules'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                : (isLight ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white')
            }`}
          >
            How to Win
          </button>
        </div>

        {/* TAB 1: ACTIVE WIN POOLS */}
        {activeTab === 'pools' && (
          <div className="flex flex-col gap-3">
            <div className={`flex items-center justify-between text-[11px] px-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              <span>Choose a pool, record a video, win direct cash</span>
              <span className={`font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{bounties.length} Available</span>
            </div>

            {bounties.length === 0 ? (
              <div className={`py-8 px-4 text-center rounded-2xl border flex flex-col items-center gap-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900/60 border-neutral-800'
              }`}>
                <Trophy className="w-8 h-8 text-amber-500" />
                <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>No active win pools yet</p>
                <p className={`text-[10px] max-w-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Brands can launch a sponsored video challenge to fund upfront creator prizes.
                </p>
                <button
                  onClick={() => {
                    setShowWinPoolModal(false);
                    setShowSponsorModal(true);
                  }}
                  className="mt-2 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold rounded-xl active:scale-95 transition-transform"
                >
                  + Sponsor a Pool
                </button>
              </div>
            ) : (
              bounties.map((bounty) => {
                const prize1 = ((bounty.rewardPoolGHS || 0) * 0.6).toFixed(0);
                const prize2 = ((bounty.rewardPoolGHS || 0) * 0.25).toFixed(0);
                const prize3 = ((bounty.rewardPoolGHS || 0) * 0.15).toFixed(0);

                return (
                  <div
                    key={bounty.id}
                    className={`border rounded-2xl p-3.5 flex flex-col gap-2.5 transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 hover:border-amber-400 shadow-sm'
                        : 'bg-neutral-900/90 border-neutral-800 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`border px-2 py-0.5 rounded-full font-bold ${
                        isLight ? 'bg-cyan-50 text-cyan-800 border-cyan-200' : 'bg-[#00B2FE]/15 text-cyan-300 border-[#00B2FE]/30'
                      }`}>
                        {bounty.sponsor}
                      </span>
                      <span className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded-full ${
                        isLight ? 'text-amber-800 bg-amber-100/70 border border-amber-300' : 'text-amber-400 bg-amber-950/60'
                      }`}>
                        <Clock className="w-3 h-3" /> {bounty.daysRemaining} days left
                      </span>
                    </div>

                    <div>
                      <h4 className={`text-xs sm:text-sm font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {bounty.title}
                      </h4>
                      <p className={`text-[11px] mt-1 line-clamp-2 ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                        {bounty.description}
                      </p>
                    </div>

                    {/* 3-Tier Prize Breakdown */}
                    <div className={`grid grid-cols-3 gap-1.5 rounded-xl p-2 border text-center ${
                      isLight ? 'bg-white border-slate-200' : 'bg-black/40 border-neutral-800/80'
                    }`}>
                      <div>
                        <span className={`text-[9px] block ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>🥇 1st Place</span>
                        <span className={`text-[11px] sm:text-xs font-black ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                          GHS {prize1}
                        </span>
                      </div>
                      <div className={`border-x ${isLight ? 'border-slate-200' : 'border-neutral-800'}`}>
                        <span className={`text-[9px] block ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>🥈 2nd Place</span>
                        <span className={`text-[11px] sm:text-xs font-black ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>
                          GHS {prize2}
                        </span>
                      </div>
                      <div>
                        <span className={`text-[9px] block ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>🥉 3rd Place</span>
                        <span className={`text-[11px] sm:text-xs font-black ${isLight ? 'text-orange-700' : 'text-orange-400'}`}>
                          GHS {prize3}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleWatchContenders(bounty)}
                        className={`flex-1 py-2 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition-colors ${
                          isLight
                            ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                        }`}
                      >
                        <Play className={`w-3 h-3 ${isLight ? 'text-slate-700 fill-slate-700' : 'text-neutral-300 fill-neutral-300'}`} />
                        <span>Watch Entries ({bounty.submissionsCount || 0})</span>
                      </button>
                      <button
                        onClick={() => handleEnterChallenge(bounty)}
                        className={`flex-1 py-2 rounded-xl font-black text-[11px] flex items-center justify-center gap-1 shadow-md hover:scale-[1.02] active:scale-95 transition-all ${
                          isLight
                            ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                            : 'bg-white hover:bg-neutral-100 text-black'
                        }`}
                      >
                        <Award className="w-3 h-3 text-slate-950" />
                        <span>Submit Video</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: RECENT WINNERS & PROOF OF PAYOUT */}
        {activeTab === 'winners' && (
          <div className="flex flex-col gap-2.5">
            <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
              isLight ? 'bg-cyan-50/80 border-cyan-200' : 'bg-[#0A1628] border-cyan-800/50'
            }`}>
              <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
                <BadgeCheck className={`w-4 h-4 shrink-0 ${isLight ? 'text-cyan-600' : 'text-cyan-400'}`} />
                <span>Verified MoMo Payout Ledger</span>
              </span>
              <span className={`font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Live Supabase Sync</span>
            </div>

            {realWinners.length === 0 ? (
              <div className={`py-8 px-4 text-center rounded-2xl border flex flex-col items-center gap-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900/60 border-neutral-800'
              }`}>
                <Trophy className="w-8 h-8 text-amber-500" />
                <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>No prize payouts recorded yet</p>
                <p className={`text-[10px] max-w-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  When sponsored challenges conclude, verified automated MoMo payouts will appear here in real time.
                </p>
              </div>
            ) : (
              realWinners.map((win) => (
                <div
                  key={win.id}
                  className={`border rounded-xl p-3 flex items-center justify-between gap-2.5 transition-colors ${
                    isLight ? 'bg-slate-50 border-slate-200 hover:border-amber-400' : 'bg-neutral-900/90 border-neutral-800 hover:border-amber-400/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-500 font-bold shrink-0">
                      🏆
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{win.title}</div>
                      <div className={`text-[10px] truncate mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>{win.subtitle}</div>
                      <div className={`text-[9px] flex items-center gap-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
                        <span className={`${isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400'}`}>⚡ {win.method || 'MTN MoMo'}</span>
                        <span>•</span>
                        <span className="font-mono">{win.referenceId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`text-xs sm:text-sm font-black ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                      +GHS {win.amountGHS.toFixed(2)}
                    </div>
                    <span className={`text-[9px] block ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>{win.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: LEADERBOARD / TOP BOUNTY HUNTERS */}
        {activeTab === 'leaderboard' && (
          <div className="flex flex-col gap-2.5">
            <div className={`text-[11px] px-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              Creators ranked dynamically by community tips & challenge earnings
            </div>

            {realTopCreators.length === 0 ? (
              <div className={`py-8 px-4 text-center rounded-2xl border flex flex-col items-center gap-2 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900/60 border-neutral-800'
              }`}>
                <Flame className="w-8 h-8 text-amber-500" />
                <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Leaderboard currently empty</p>
                <p className={`text-[10px] max-w-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Rankings calculate live as creators publish vertical videos and receive micro-tips.
                </p>
              </div>
            ) : (
              realTopCreators.map((creator, idx) => (
                <div
                  key={creator.username}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                    idx === 0
                      ? (isLight ? 'bg-amber-50/70 border-amber-300' : 'bg-gradient-to-r from-amber-500/15 to-transparent border-amber-400/50')
                      : idx === 1
                      ? (isLight ? 'bg-cyan-50/70 border-cyan-300' : 'bg-gradient-to-r from-cyan-500/10 to-transparent border-cyan-400/30')
                      : (isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-neutral-800')
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className={`w-6 text-center font-black text-sm shrink-0 ${
                      idx === 0 ? (isLight ? 'text-amber-700' : 'text-amber-400') : idx === 1 ? (isLight ? 'text-cyan-700' : 'text-cyan-300') : (isLight ? 'text-slate-600' : 'text-neutral-400')
                    }`}>
                      #{idx + 1}
                    </span>

                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{creator.name}</div>
                      <div className={`text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>@{creator.username} • {creator.videosCount} video{creator.videosCount === 1 ? '' : 's'}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`text-xs sm:text-sm font-black ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                      GHS {creator.tips.toFixed(1)}
                    </div>
                    <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>{creator.views.toLocaleString()} views</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: HOW TO WIN & VOTING RULES */}
        {activeTab === 'rules' && (
          <div className={`flex flex-col gap-3 text-xs ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
            <div className={`p-3 rounded-2xl border flex flex-col gap-1.5 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0A1628] border-neutral-800'
            }`}>
              <span className={`font-bold flex items-center gap-1.5 text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                The 50 / 50 Winner Determination Formula:
              </span>
              <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                Win pools are not decided by bots or opaque algorithms. The winner is determined transparently:
              </p>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className={`p-2 rounded-xl border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-black/50 border-neutral-800'
                }`}>
                  <span className={`font-bold block text-[11px] ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>50% Community Vote</span>
                  <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Likes, watch-time retention & community tips sent to your video.</p>
                </div>
                <div className={`p-2 rounded-xl border ${
                  isLight ? 'bg-white border-slate-200' : 'bg-black/50 border-neutral-800'
                }`}>
                  <span className={`font-bold block text-[11px] ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`}>50% Brand Judging</span>
                  <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Creativity, storytelling, and adherence to challenge brief.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className={`font-bold uppercase text-[10px] tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                How It Works Step-by-Step
              </span>
              {[
                { step: '1', title: 'Pick an Active Win Pool', desc: 'Browse live sponsored pools with guaranteed upfront escrow.' },
                { step: '2', title: 'Record in ValuVid Studio', desc: 'Shoot a 30-60s vertical video and include the official challenge hashtag.' },
                { step: '3', title: 'Share & Gather Community Support', desc: 'Your video enters the challenge feed where users watch, tip, and vote.' },
                { step: '4', title: 'Instant Mobile Money Payout', desc: 'When the timer expires, prize money automatically deposits to your ValuWallet for instant cashout.' }
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {s.step}
                  </span>
                  <div>
                    <h5 className={`text-[11px] font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{s.title}</h5>
                    <p className={`text-[10px] leading-normal ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOTTOM BRAND SPONSOR TRIGGER */}
        <div className={`pt-2 border-t flex items-center justify-between text-xs ${isLight ? 'border-slate-200' : 'border-neutral-800'}`}>
          <div className="min-w-0 flex-1">
            <span className={`text-[11px] font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>Are you a Brand or Business?</span>
            <span className={`text-[10px] truncate block ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>Sponsor authentic video challenges from GHS 500</span>
          </div>
          <button
            onClick={() => {
              setShowWinPoolModal(false);
              setShowSponsorModal(true);
            }}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-colors shrink-0 ${
              isLight
                ? 'bg-cyan-50 text-cyan-800 border border-cyan-300 hover:bg-cyan-100'
                : 'bg-[#00B2FE]/20 text-cyan-300 border border-[#00B2FE]/40 hover:bg-[#00B2FE]/30'
            }`}
          >
            + Sponsor Pool
          </button>
        </div>
      </div>
    </div>
  );
};