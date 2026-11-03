import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Search, 
  Coins, 
  Award, 
  Sparkles, 
  Users, 
  Clock, 
  ArrowRight, 
  Eye, 
  CheckCircle2, 
  Share2,
  Lock,
  Trophy,
  Play,
  Check,
  ShieldCheck,
  FilterX
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BountyChallenge, VideoItem } from '../../types';
import { sounds } from '../../utils/soundEffects';

export const DiscoverScreen: React.FC = () => {
  const { 
    theme,
    videos, 
    bounties, 
    transactions,
    setCurrentVideoIndex, 
    setActiveTab, 
    setActiveTab: setAppTab, 
    openTipModal,
    setShowSponsorModal,
    showWinPoolModal,
    setShowWinPoolModal
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('trending');
  const [activeBountyModal, setActiveBountyModal] = useState<BountyChallenge | null>(null);
  const [bountyTab, setBountyTab] = useState<'overview' | 'submissions' | 'payouts'>('overview');
  const [awardedWinner, setAwardedWinner] = useState<{ creator: string; amount: number; rank: string } | null>(null);

  const totalWinPoolGHS = useMemo(() => {
    return bounties.reduce((sum, b) => sum + (b.rewardPoolGHS || 0), 0);
  }, [bounties]);

  const latestBountyTx = useMemo(() => {
    return transactions.find((t) => t.type === 'bounty_reward');
  }, [transactions]);

  const filters = [
    { id: 'trending', label: '🔥 Trending' },
    { id: 'ghana', label: '🇬🇭 Local Ghana' },
    { id: 'tech', label: '⚡️ Tech & AI' },
    { id: 'fashion', label: '✨ Fashion & Design' },
    { id: 'education', label: '🎓 Tutorials' },
    { id: 'bounties', label: '🏆 Micro-Bounties' },
  ];

  // Filter videos based on category and search query
  const filteredVideos = useMemo(() => {
    return videos.filter((video) => {
      const matchesSearch =
        searchQuery === '' ||
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.hashtags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedFilter === 'trending' || video.category === selectedFilter;

      return matchesSearch && matchesCategory;
    });
  }, [videos, searchQuery, selectedFilter]);

  const handleSelectVideo = (video: VideoItem) => {
    const idx = videos.findIndex((v) => v.id === video.id);
    if (idx !== -1) {
      setCurrentVideoIndex(idx);
      setActiveTab('feed');
    }
  };

  const handleJoinBounty = (bounty: BountyChallenge) => {
    setActiveBountyModal(null);
    setAppTab('create');
  };

  const handleAwardWinner = (creatorName: string, amount: number, rank: string) => {
    sounds.playSuccessPayout();
    confetti({
      particleCount: 120,
      spread: 85,
      origin: { y: 0.55 },
      colors: ['#FF9F0A', '#00B2FE', '#10B981', '#FFFFFF'],
    });
    setAwardedWinner({ creator: creatorName, amount, rank });
  };

  return (
    <div className={`w-full h-full ${theme === 'light' ? 'bg-[#F8FAFC] text-slate-900' : 'bg-neutral-950 text-white'} flex flex-col overflow-y-auto overscroll-contain pb-20 select-none transition-colors duration-200`}>
      {/* SEARCH & FILTERS HEADER - COMPACT & FULLY RESPONSIVE */}
      <div className={`sticky top-0 z-30 ${theme === 'light' ? 'bg-white/95 border-slate-200' : 'bg-neutral-950/95 border-neutral-900'} backdrop-blur-md px-3 sm:px-4 pt-8 sm:pt-4 pb-2 border-b transition-colors`}>
        <div className="relative w-full mb-2 sm:mb-2.5">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 ${theme === 'light' ? 'text-slate-400' : 'text-neutral-400'}`} />
          <input
            type="text"
            placeholder="Search creators, #AccraTech, bounties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${
              theme === 'light'
                ? 'bg-slate-100 text-slate-900 placeholder-slate-400 border-slate-200 focus:border-amber-500 focus:ring-amber-500'
                : 'bg-neutral-900 text-white placeholder-neutral-500 border-neutral-800 focus:border-amber-400 focus:ring-amber-400'
            } text-xs sm:text-sm rounded-xl pl-8 sm:pl-9 pr-14 py-2 sm:py-2.5 border focus:outline-none focus:ring-1 transition-all placeholder:truncate`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] sm:text-xs ${
                theme === 'light' ? 'text-slate-500 hover:text-slate-900 bg-slate-200' : 'text-neutral-400 hover:text-white bg-neutral-800/80'
              } px-1.5 py-0.5 rounded`}
            >
              Clear
            </button>
          )}
        </div>

        {/* FEED FILTERS (Horizontal Scroll with shrink-0 buttons) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
          {filters.map((filter) => {
            const isSelected = selectedFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`shrink-0 text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full whitespace-nowrap transition-all font-medium ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                    : theme === 'light'
                    ? 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-xs'
                    : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-3 sm:px-4 py-2.5 sm:py-3 flex flex-col gap-3.5 sm:gap-4">
        {/* LIVE WIN POOL ESCROW HIGHLIGHT BANNER */}
        <div 
          onClick={() => setShowWinPoolModal(true)}
          className={`relative overflow-hidden rounded-2xl border p-3 sm:p-3.5 cursor-pointer active:scale-[0.99] transition-all group ${
            theme === 'light'
              ? 'bg-gradient-to-r from-amber-50 via-slate-50 to-cyan-50 border-amber-300 hover:border-amber-400 shadow-md text-slate-900'
              : 'bg-gradient-to-r from-[#071325] via-[#0B1E38] to-[#151D2A] border-[#FF9F0A]/40 hover:border-[#FF9F0A]/70 text-white shadow-xl'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF9F0A] to-amber-600 flex items-center justify-center text-black font-black shrink-0 shadow-lg shadow-[#FF9F0A]/20">
                <Trophy className="w-5 h-5 text-black" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] uppercase font-black tracking-wider ${theme === 'light' ? 'text-amber-800' : 'text-amber-400'}`}>
                    Live Win Pool Escrow
                  </span>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold border ${
                    theme === 'light'
                      ? 'text-emerald-800 bg-emerald-100/70 border-emerald-300'
                      : 'text-emerald-400 bg-emerald-950/80 border-emerald-800/80'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Guaranteed
                  </span>
                </div>
                <div className={`text-sm sm:text-base font-black flex items-baseline gap-1 sm:gap-1.5 flex-wrap ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  <span>GHS {totalWinPoolGHS.toLocaleString()}</span>
                  <span className={`text-[10px] font-normal ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>(${(totalWinPoolGHS * 0.083).toFixed(0)} USD)</span>
                  <span className={`text-[10px] font-semibold ${theme === 'light' ? 'text-cyan-700' : 'text-cyan-300'}`}>• {bounties.length} Pools</span>
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-1 text-[11px] font-bold group-hover:translate-x-0.5 transition-transform shrink-0 border px-2 sm:px-2.5 py-1 rounded-xl ${
              theme === 'light'
                ? 'text-amber-800 bg-amber-100/80 border-amber-300'
                : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
            }`}>
              <span>Win Pool</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Live Winner Ticker footer */}
          <div className={`mt-2 pt-2 border-t flex items-center justify-between text-[10px] ${
            theme === 'light' ? 'border-slate-200 text-slate-600' : 'border-neutral-800/80 text-neutral-400'
          }`}>
            <div className="flex items-center gap-1 truncate">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">
                {latestBountyTx
                  ? `Recent: ${latestBountyTx.title} (GHS ${latestBountyTx.amountGHS}) • Dispatched via MoMo`
                  : 'Live Escrow Float Protected • Automated Mobile Money Dispatches'}
              </span>
            </div>
            <span className={`font-bold shrink-0 ml-1 ${theme === 'light' ? 'text-cyan-700' : 'text-cyan-400'}`}>Instant 2s Payout</span>
          </div>
        </div>

        {/* MICRO-BOUNTY BANNER CAROUSEL */}
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
              <h2 className={`text-xs sm:text-sm font-bold tracking-wide truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Featured Micro-Bounties</h2>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                onClick={() => setShowSponsorModal(true)}
                className={`text-[10px] sm:text-[11px] ${
                  theme === 'light' ? 'text-cyan-700 bg-cyan-50 border-cyan-200 hover:bg-cyan-100' : 'text-cyan-300 bg-[#00B2FE]/15 border-[#00B2FE]/30 hover:bg-[#00B2FE]/25'
                } border px-2 sm:px-2.5 py-0.5 rounded-full font-bold transition-colors whitespace-nowrap`}
              >
                + Brand Sponsor
              </button>
              <button
                onClick={() => setShowWinPoolModal(true)}
                className={`text-[10px] sm:text-[11px] ${
                  theme === 'light'
                    ? 'text-amber-800 bg-amber-50 border-amber-300 hover:bg-amber-100'
                    : 'text-amber-300 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-400/50 hover:bg-amber-500/30'
                } border px-2 sm:px-2.5 py-0.5 rounded-full font-bold transition-all flex items-center gap-1 shadow-xs active:scale-95`}
              >
                <Trophy className="w-3 h-3 text-amber-500 animate-pulse" />
                <span>Win Pool Hub</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar snap-x pb-1">
            {bounties.length === 0 ? (
              <div className="w-full py-6 px-4 text-center rounded-2xl bg-neutral-900/60 border border-neutral-800">
                <p className="text-xs text-neutral-300 font-bold">No active sponsored challenges right now.</p>
                <p className="text-[10px] text-neutral-400 mt-1">Brands and creators can tap "+ Brand Sponsor" to launch a cash bounty!</p>
              </div>
            ) : (
              bounties.map((bounty) => (
                <div
                  key={bounty.id}
                  onClick={() => setActiveBountyModal(bounty)}
                  className={`snap-center shrink-0 w-[240px] min-[360px]:w-[260px] sm:w-[280px] bg-gradient-to-br ${bounty.bannerColor} rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xl cursor-pointer hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden group`}
                >
                  <div className="absolute right-2 -bottom-2 opacity-15 text-5xl sm:text-6xl group-hover:scale-110 transition-transform pointer-events-none">
                    {bounty.sponsorLogo}
                  </div>

                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-white/90 mb-1">
                      <span className="bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full truncate max-w-[120px]">
                        {bounty.sponsor}
                      </span>
                      <span className="flex items-center gap-1 text-white bg-black/40 px-2 py-0.5 rounded-full shrink-0">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {bounty.daysRemaining}d left
                      </span>
                    </div>

                    <h3 className="font-bold text-xs sm:text-sm text-white leading-tight mb-2 line-clamp-2 min-h-[2rem]">
                      {bounty.title}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-white/20 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-white/80 block">Prize Pool:</span>
                      <div className="text-sm sm:text-base font-black text-white leading-none">
                        GHS {bounty.rewardPoolGHS.toLocaleString()}{' '}
                        <span className="text-[10px] sm:text-xs font-normal text-white/80">(${bounty.rewardPoolUSD})</span>
                      </div>
                    </div>

                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-neutral-950 flex items-center justify-center font-bold text-xs shadow-md group-hover:translate-x-0.5 transition-transform shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                </div>
              </div>
            )))}
          </div>
        </div>

        {/* 2-COLUMN MASONRY GRID - OPTIMIZED FOR ALL PHONES (IPHONE SE 375PX & 320PX) */}
        <div>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h3 className={`text-xs sm:text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-neutral-200'}`}>
              {selectedFilter === 'bounties' ? 'Bounty Video Submissions' : 'Top Community Creations'}
            </h3>
            <span className={`text-[11px] sm:text-xs ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
              {filteredVideos.length} videos
            </span>
          </div>

          {/* Contextual Win Pool notice if bounties filter is active */}
          {selectedFilter === 'bounties' && (
            <div className={`mb-3 ${
              theme === 'light'
                ? 'bg-amber-50/80 border-amber-300 shadow-sm'
                : 'bg-gradient-to-r from-amber-500/15 via-[#0A182E] to-[#00B2FE]/15 border-amber-400/40 shadow-md'
            } border rounded-xl p-2.5 flex items-center justify-between gap-2`}>
              <div className="flex items-center gap-2 min-w-0">
                <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <span className={`font-bold text-[11px] block truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    Competing for GHS {totalWinPoolGHS.toLocaleString()} Win Pools
                  </span>
                  <span className={`text-[10px] block truncate ${theme === 'light' ? 'text-slate-600' : 'text-neutral-400'}`}>
                    Your tips & watch-time count as community votes for creators!
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowWinPoolModal(true)}
                className="px-2.5 py-1 bg-amber-500 text-black font-black text-[10px] rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0"
              >
                Prizes
              </button>
            </div>
          )}

          {filteredVideos.length === 0 ? (
            <div className={`${
              theme === 'light' ? 'bg-white border-slate-200 text-slate-500 shadow-sm' : 'bg-neutral-900/60 border-neutral-800 text-neutral-400'
            } border rounded-2xl p-6 text-center flex flex-col items-center gap-2`}>
              <FilterX className="w-8 h-8 text-neutral-400" />
              <p className={`text-xs font-semibold ${theme === 'light' ? 'text-slate-800' : 'text-neutral-300'}`}>No videos match your search or filter</p>
              <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-500'}`}>Try searching for other tags or clear the active filter.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFilter('trending');
                }}
                className={`mt-1 px-3 py-1 ${
                  theme === 'light' ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-500 hover:text-white' : 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500 hover:text-black'
                } border rounded-xl text-xs font-bold transition-colors`}
              >
                Reset Search & Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => handleSelectVideo(video)}
                  className={`group relative rounded-xl sm:rounded-2xl overflow-hidden ${
                    theme === 'light' ? 'bg-white border-slate-200 shadow-sm hover:border-amber-400' : 'bg-neutral-900 border-neutral-800/80 hover:border-amber-500/40'
                  } border cursor-pointer transition-all flex flex-col`}
                >
                  {/* Video Thumbnail */}
                  <div className="relative aspect-[9/13] w-full overflow-hidden bg-neutral-950">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Top Tip Badge Overlay */}
                    <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 flex items-center gap-1 bg-neutral-950/85 backdrop-blur-md px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-400/40 shadow-md">
                      <Coins className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                      <span className="text-[9px] sm:text-[10px] font-bold text-amber-300 leading-tight">
                        GHS {video.stats.tipsTotalGHS.toFixed(1)}
                      </span>
                    </div>

                    {/* Locked badge if gated */}
                    {video.isPayPerUnlock && !video.isUnlocked && (
                      <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 bg-black/80 backdrop-blur-md p-1 sm:p-1.5 rounded-full border border-amber-500/50">
                        <Lock className="w-3 h-3 text-amber-400" />
                      </div>
                    )}

                    {/* Views count */}
                    <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 z-10 flex items-center gap-1 text-[9px] sm:text-[10px] text-white/90 drop-shadow-md">
                      <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span>{video.stats.views.toLocaleString()}</span>
                    </div>

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                  </div>

                  {/* Video Info Card Footer with protected min-w-0 flexbox */}
                  <div className={`p-2 sm:p-2.5 flex flex-col gap-1 sm:gap-1.5 ${theme === 'light' ? 'bg-white' : 'bg-neutral-900'}`}>
                    <p className={`text-[11px] sm:text-xs font-semibold line-clamp-1 transition-colors ${
                      theme === 'light' ? 'text-slate-800 group-hover:text-amber-600' : 'text-neutral-200 group-hover:text-amber-400'
                    }`}>
                      {video.title}
                    </p>

                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] gap-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                        <img
                          src={video.creator.avatar}
                          alt={video.creator.username}
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full object-cover shrink-0"
                        />
                        <span className={`truncate text-[10px] sm:text-[11px] ${theme === 'light' ? 'text-slate-600' : 'text-neutral-400'}`}>@{video.creator.username}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openTipModal(video);
                        }}
                        className={`px-1.5 sm:px-2 py-0.5 shrink-0 ${
                          theme === 'light' ? 'bg-amber-100 text-amber-800 hover:bg-amber-500 hover:text-white' : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-neutral-950'
                        } rounded-md text-[9px] sm:text-[10px] font-bold transition-colors`}
                      >
                        Tip
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOUNTY DETAIL & SUBMISSION WORKFLOW MODAL - RESPONSIVE FOR ALL SCREEN HEIGHTS */}
      {activeBountyModal && (
        <div className={`fixed inset-0 z-50 ${theme === 'light' ? 'bg-black/60' : 'bg-black/85'} backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none`}>
          <div className={`w-full max-w-md ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' : 'bg-[#070E1B] border-[#FF9F0A]/30 text-white shadow-2xl'
          } border rounded-3xl p-4 sm:p-5 flex flex-col gap-3 sm:gap-4 max-h-[85vh] overflow-y-auto`}>
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
              <span className={`text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border truncate ${
                theme === 'light' ? 'text-amber-800 bg-amber-50 border-amber-300' : 'text-amber-400 bg-amber-950/80 border-amber-800'
              }`}>
                {activeBountyModal.category} • Brand Escrow
              </span>
              <button
                onClick={() => {
                  setActiveBountyModal(null);
                  setAwardedWinner(null);
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  theme === 'light' ? 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900' : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Banner with Upfront Guaranteed Pool */}
            <div className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r ${activeBountyModal.bannerColor} text-white shadow-lg relative overflow-hidden`}>
              <div className="text-[11px] sm:text-xs text-white/90 font-medium">{activeBountyModal.sponsor} presents</div>
              <h2 className="text-base sm:text-lg font-black mt-0.5 mb-1 sm:mb-2 leading-tight">{activeBountyModal.title}</h2>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xl sm:text-2xl font-black">
                  GHS {activeBountyModal.rewardPoolGHS.toLocaleString()}
                </span>
                <span className="text-[10px] sm:text-xs text-white/80 font-semibold">
                  (${activeBountyModal.rewardPoolUSD} USD Guaranteed Escrow)
                </span>
              </div>
            </div>

            {/* Sub-Tabs: Overview | Submissions | Prize Payouts */}
            <div className={`grid grid-cols-3 gap-1 p-1 rounded-xl border text-[11px] sm:text-xs font-bold ${
              theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-black/60 border-neutral-800'
            }`}>
              <button
                type="button"
                onClick={() => setBountyTab('overview')}
                className={`py-1 sm:py-1.5 rounded-lg transition-all ${
                  bountyTab === 'overview'
                    ? 'bg-amber-500 text-black shadow-sm font-black'
                    : (theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white')
                }`}
              >
                Brief
              </button>
              <button
                type="button"
                onClick={() => setBountyTab('submissions')}
                className={`py-1 sm:py-1.5 rounded-lg transition-all ${
                  bountyTab === 'submissions'
                    ? 'bg-amber-500 text-black shadow-sm font-black'
                    : (theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white')
                }`}
              >
                Entries ({activeBountyModal.submissionsCount})
              </button>
              <button
                type="button"
                onClick={() => setBountyTab('payouts')}
                className={`py-1 sm:py-1.5 rounded-lg transition-all ${
                  bountyTab === 'payouts'
                    ? 'bg-amber-500 text-black shadow-sm font-black'
                    : (theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white')
                }`}
              >
                Prizes 🏆
              </button>
            </div>

            {/* AWARDED WINNER CELEBRATION CARD */}
            {awardedWinner && (
              <div className={`border p-3 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col items-center text-center animate-fade-in ${
                theme === 'light' ? 'bg-emerald-50 border-emerald-300' : 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/10 border-emerald-400/50'
              }`}>
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500 mb-1 animate-bounce" />
                <h4 className={`text-xs sm:text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Prize Money Dispatched!</h4>
                <p className={`text-[11px] sm:text-xs mt-0.5 ${theme === 'light' ? 'text-emerald-800' : 'text-emerald-300'}`}>
                  @{awardedWinner.creator} was awarded {awardedWinner.rank}: <span className="font-bold">GHS {awardedWinner.amount.toFixed(2)}</span>
                </p>
                <span className={`text-[9px] sm:text-[10px] mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Transferred from Brand Escrow to Creator's MTN MoMo Wallet in 2s ⚡
                </span>
              </div>
            )}

            {/* TAB 1: OVERVIEW & BRIEF */}
            {bountyTab === 'overview' && (
              <div className="flex flex-col gap-3">
                <div className={`flex items-center justify-around py-2 sm:py-2.5 rounded-xl border text-center ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-neutral-800'
                }`}>
                  <div>
                    <div className={`text-[9px] sm:text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Total Entries</div>
                    <div className={`text-[11px] sm:text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{activeBountyModal.submissionsCount} videos</div>
                  </div>
                  <div className={`w-px h-6 ${theme === 'light' ? 'bg-slate-200' : 'bg-neutral-800'}`} />
                  <div>
                    <div className={`text-[9px] sm:text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Participants</div>
                    <div className={`text-[11px] sm:text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{activeBountyModal.participantsCount} creators</div>
                  </div>
                  <div className={`w-px h-6 ${theme === 'light' ? 'bg-slate-200' : 'bg-neutral-800'}`} />
                  <div>
                    <div className={`text-[9px] sm:text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Judging In</div>
                    <div className={`text-[11px] sm:text-xs font-bold ${theme === 'light' ? 'text-amber-700' : 'text-amber-400'}`}>{activeBountyModal.daysRemaining} days left</div>
                  </div>
                </div>

                <div>
                  <h4 className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-1 ${
                    theme === 'light' ? 'text-slate-700' : 'text-neutral-300'
                  }`}>
                    Challenge Guidelines
                  </h4>
                  <p className={`text-[11px] sm:text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-neutral-300'}`}>
                    {activeBountyModal.description}
                  </p>
                </div>

                <div>
                  <h4 className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-1.5 sm:mb-2 ${
                    theme === 'light' ? 'text-slate-700' : 'text-neutral-300'
                  }`}>
                    Entry Criteria & Checklist
                  </h4>
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    {activeBountyModal.requirements.map((req, i) => (
                      <div key={i} className={`flex items-start gap-2 text-[11px] sm:text-xs ${theme === 'light' ? 'text-slate-700' : 'text-neutral-300'}`}>
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`} />
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`flex items-center gap-2 p-2.5 sm:p-3 rounded-xl border text-[10px] sm:text-[11px] ${
                  theme === 'light' ? 'bg-cyan-50/80 border-cyan-200 text-slate-700' : 'bg-[#0A1628] border-neutral-800 text-neutral-400'
                }`}>
                  <ShieldCheck className={`w-4 h-4 shrink-0 ${theme === 'light' ? 'text-cyan-600' : 'text-cyan-400'}`} />
                  <span>
                    Upfront Escrow Guaranteed: Brand deposited GHS {activeBountyModal.rewardPoolGHS} prior to challenge launch.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: SUBMISSIONS GALLERY */}
            {bountyTab === 'submissions' && (() => {
              const tag = (activeBountyModal.submissionTag || '').toLowerCase().replace(/^#/, '');
              const bountySubmissions = videos.filter((v) => 
                (v.caption || '').toLowerCase().includes(tag) ||
                (v.hashtags || []).some((h) => h.toLowerCase() === tag)
              );

              if (bountySubmissions.length === 0) {
                return (
                  <div className={`py-6 px-4 text-center rounded-2xl border flex flex-col items-center gap-2 ${
                    theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-neutral-800'
                  }`}>
                    <Award className="w-7 h-7 text-amber-500" />
                    <p className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>No submissions entered yet!</p>
                    <p className={`text-[10px] max-w-xs ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                      Be the first creator to record a video with {activeBountyModal.submissionTag} to claim from the GHS {activeBountyModal.rewardPoolGHS} prize pool.
                    </p>
                    <button
                      onClick={() => handleJoinBounty(activeBountyModal)}
                      className="mt-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-bold rounded-xl active:scale-95 transition-transform"
                    >
                      Record First Video
                    </button>
                  </div>
                );
              }

              return (
                <div className="flex flex-col gap-2">
                  <div className={`flex items-center justify-between text-[10px] sm:text-xs pb-1 border-b ${
                    theme === 'light' ? 'border-slate-200 text-slate-500' : 'border-neutral-800 text-neutral-400'
                  }`}>
                    <span>Top Competing Creator Entries</span>
                    <span>Ranked by Views</span>
                  </div>

                  {bountySubmissions.map((v, idx) => {
                    const prizePercent = idx === 0 ? 0.6 : idx === 1 ? 0.25 : 0.15;
                    const prize = activeBountyModal.rewardPoolGHS * prizePercent;
                    const rankLabel = idx === 0 ? '1st Place Contender' : idx === 1 ? '2nd Place Contender' : `${idx + 1}th Place Contender`;

                    return (
                      <div
                        key={v.id}
                        className={`border rounded-xl sm:rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-2 transition-colors ${
                          theme === 'light'
                            ? 'bg-slate-50 border-slate-200 hover:border-amber-400'
                            : 'bg-black/50 border-neutral-800 hover:border-amber-400/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <div 
                            className="relative w-10 h-14 sm:w-12 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden bg-neutral-900 shrink-0 cursor-pointer" 
                            onClick={() => handleSelectVideo(v)}
                          >
                            <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white fill-white" />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className={`text-[9px] sm:text-[10px] font-bold px-1 py-0.2 rounded border shrink-0 ${
                                theme === 'light' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-950 text-amber-400 border-amber-800'
                              }`}>
                                #{idx + 1}
                              </span>
                              <span className={`text-[11px] sm:text-xs font-bold truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                @{v.creator?.username}
                              </span>
                            </div>
                            <div className={`text-[10px] truncate mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                              {v.title}
                            </div>
                            <div className={`flex items-center gap-1.5 text-[9px] sm:text-[10px] mt-0.5 truncate ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                              <span className={`font-medium ${theme === 'light' ? 'text-cyan-700' : 'text-cyan-300'}`}>{(v.stats?.views || 0).toLocaleString()} views</span>
                              <span>•</span>
                              <span className={`font-bold truncate ${theme === 'light' ? 'text-amber-700' : 'text-amber-400'}`}>GHS {prize.toFixed(0)} Prize</span>
                            </div>
                          </div>
                        </div>

                        {/* Brand Award Winner Trigger */}
                        <button
                          onClick={() => handleAwardWinner(v.creator?.username || 'creator', prize, rankLabel)}
                          className="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-gradient-to-r from-[#FF9F0A] to-amber-600 text-black font-black rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] shadow-md hover:scale-105 active:scale-95 transition-all flex items-center gap-1 shrink-0"
                        >
                          <Trophy className="w-3 h-3 text-black" />
                          <span>Award</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* TAB 3: PRIZE MONEY DISTRIBUTION */}
            {bountyTab === 'payouts' && (
              <div className="flex flex-col gap-2.5 sm:gap-3">
                <div className={`text-[11px] sm:text-xs leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-neutral-300'}`}>
                  The brand's total prize pool is divided transparently among the top 3 best video submissions:
                </div>

                <div className="flex flex-col gap-2">
                  <div className={`border p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2 ${
                    theme === 'light'
                      ? 'bg-amber-50/70 border-amber-300'
                      : 'bg-gradient-to-r from-amber-500/20 to-transparent border-amber-400/40'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg sm:text-xl shrink-0">🥇</span>
                      <div className="min-w-0">
                        <div className={`text-[11px] sm:text-xs font-bold truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>1st Grand Winner (60%)</div>
                        <div className={`text-[9px] sm:text-[10px] line-clamp-1 ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Best quality & adherence to brief</div>
                      </div>
                    </div>
                    <span className={`text-xs sm:text-sm font-black shrink-0 ${theme === 'light' ? 'text-amber-800' : 'text-amber-400'}`}>
                      GHS {(activeBountyModal.rewardPoolGHS * 0.6).toFixed(2)}
                    </span>
                  </div>

                  <div className={`border p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2 ${
                    theme === 'light'
                      ? 'bg-cyan-50/70 border-cyan-300'
                      : 'bg-gradient-to-r from-cyan-500/15 to-transparent border-cyan-400/30'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg sm:text-xl shrink-0">🥈</span>
                      <div className="min-w-0">
                        <div className={`text-[11px] sm:text-xs font-bold truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>2nd Runner-Up (25%)</div>
                        <div className={`text-[9px] sm:text-[10px] line-clamp-1 ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>High retention rate & community engagement</div>
                      </div>
                    </div>
                    <span className={`text-xs sm:text-sm font-black shrink-0 ${theme === 'light' ? 'text-cyan-800' : 'text-cyan-300'}`}>
                      GHS {(activeBountyModal.rewardPoolGHS * 0.25).toFixed(2)}
                    </span>
                  </div>

                  <div className={`border p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2 ${
                    theme === 'light'
                      ? 'bg-orange-50/70 border-orange-300'
                      : 'bg-gradient-to-r from-orange-500/15 to-transparent border-orange-400/30'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg sm:text-xl shrink-0">🥉</span>
                      <div className="min-w-0">
                        <div className={`text-[11px] sm:text-xs font-bold truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>3rd Finalist (15%)</div>
                        <div className={`text-[9px] sm:text-[10px] line-clamp-1 ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Creative storytelling & audience comments</div>
                      </div>
                    </div>
                    <span className={`text-xs sm:text-sm font-black shrink-0 ${theme === 'light' ? 'text-orange-800' : 'text-orange-400'}`}>
                      GHS {(activeBountyModal.rewardPoolGHS * 0.15).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-[10px] sm:text-xs flex flex-col gap-1 ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-black/40 border-neutral-800 text-neutral-300'
                }`}>
                  <span className={`font-bold flex items-center gap-1.5 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    How Winners Receive Their Money:
                  </span>
                  <p className={`text-[10px] sm:text-[11px] leading-normal ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                    Prize funds are held in Bank/MoMo escrow. Once the brand selects the winner or community voting ends, the prize automatically credits to the creator's ValuWallet for instant cashout to MTN MoMo or Telecel Cash.
                  </p>
                </div>
              </div>
            )}

            {/* ACTION BUTTON */}
            <button
              onClick={() => handleJoinBounty(activeBountyModal)}
              className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-[#FF9F0A] via-[#F59E0B] to-amber-600 text-black font-black text-xs sm:text-sm shadow-lg shadow-[#FF9F0A]/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5 mt-0.5"
            >
              <Award className="w-4 h-4 text-black shrink-0" />
              <span className="truncate">Record & Submit Video (+{activeBountyModal.submissionTag})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
