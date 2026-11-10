import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Coins, 
  Eye, 
  Smartphone, 
  Building2, 
  CreditCard, 
  CheckCircle, 
  TrendingUp, 
  Clock, 
  ShieldCheck,
  ChevronRight,
  Zap,
  Lock,
  Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TransactionItem, PayoutMethodItem } from '../../types';
import { launchPaystackPayment, getPlatformCommissionPercent, GHANA_BANKS } from '../../services/paystackService';

export const ValuWallet: React.FC = () => {
  const { 
    theme,
    wallet, 
    transactions, 
    payoutMethods, 
    openCashoutDrawer, 
    addFundsToWallet, 
    addPayoutMethod,
    deletePayoutMethod,
    setDefaultPayoutMethod,
    setShowFundingModal,
    fundingMetrics,
    isSupabaseConnected,
    currentUser,
    cashoutLimitInfo,
    setShareToast
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'tips' | 'rewards' | 'cashouts'>('all');
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [addMethodModalOpen, setAddMethodModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(50);
  const [isProcessingPaystack, setIsProcessingPaystack] = useState(false);

  const handlePaystackTopUp = async () => {
    setIsProcessingPaystack(true);
    await launchPaystackPayment({
      email: currentUser.email || `${currentUser.username || 'user'}@valuvid.app`,
      amountGHS: topUpAmount,
      metadata: {
        type: 'wallet_topup',
        username: currentUser.username,
        userId: currentUser.id,
      },
      onSuccess: (res) => {
        setIsProcessingPaystack(false);
        addFundsToWallet(topUpAmount, res.reference, 'Paystack MoMo');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00B2FE', '#FF9F0A', '#10B981'],
        });
        setTopUpModalOpen(false);
      },
      onClose: () => {
        setIsProcessingPaystack(false);
      },
    });
  };

  // New payout method form state
  const [newMethodType, setNewMethodType] = useState<'mtn_momo' | 'telecel_cash' | 'bank'>('mtn_momo');
  const [selectedBank, setSelectedBank] = useState('GCB Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState(currentUser.name || '');
  const [bankBranch, setBankBranch] = useState('');

  const filteredTransactions = transactions.filter((tx) => {
    if (activeFilter === 'tips') return tx.type.includes('tip');
    if (activeFilter === 'rewards') return tx.type === 'watch_reward' || tx.type === 'bounty_reward';
    if (activeFilter === 'cashouts') return tx.type === 'cashout';
    return true;
  });

  const handleCreateMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim()) return;

    const name =
      newMethodType === 'bank'
        ? selectedBank
        : newMethodType === 'mtn_momo'
        ? 'MTN Mobile Money'
        : 'Telecel Cash';

    const formattedAccount =
      newMethodType === 'bank' && bankBranch.trim()
        ? `${accountNumber.trim()} • ${bankBranch.trim()}`
        : accountNumber.trim();

    addPayoutMethod({
      type: newMethodType,
      name,
      accountNumber: formattedAccount,
      accountHolder: accountHolder.trim() || currentUser.name || 'ValuVid Creator',
      isDefault: true,
      iconType: newMethodType === 'bank' ? 'bank' : 'momo',
    });

    try {
      localStorage.setItem('valuvid_user_payout_phone', formattedAccount);
    } catch {}

    setAccountNumber('');
    setBankBranch('');
    setAddMethodModalOpen(false);
    setShareToast('Payout channel saved as primary! 💳');
  };

  return (
    <div className={`w-full h-full ${theme === 'light' ? 'bg-[#F8FAFC] text-slate-900' : 'bg-neutral-950 text-white'} flex flex-col overflow-y-auto overflow-x-hidden overscroll-contain max-w-full pb-32 select-none touch-pan-y transition-colors duration-200`}>
      {/* HEADER BAR */}
      <div className={`sticky top-0 z-20 ${theme === 'light' ? 'bg-white/95 border-slate-200' : 'bg-neutral-950/90 border-neutral-900'} backdrop-blur-md px-3 sm:px-4 pt-8 sm:pt-4 pb-2.5 sm:pb-3 border-b flex items-center justify-between gap-2 max-w-full transition-colors`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-600 p-[1.5px] shrink-0">
            <div className={`w-full h-full ${theme === 'light' ? 'bg-amber-50' : 'bg-neutral-950'} rounded-[10px] flex items-center justify-center`}>
              <WalletIcon className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="min-w-0">
            <h1 className={`text-sm sm:text-base font-bold leading-none truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>ValuWallet</h1>
            <span className={`text-[9px] sm:text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'} truncate block`}>Ghanaian Cedi & USD</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className={`flex items-center gap-1 sm:gap-1.5 ${
            theme === 'light' ? 'bg-cyan-50 border-cyan-200' : 'bg-[#00B2FE]/15 border-[#00B2FE]/40'
          } border px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-xs`}>
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-500 fill-cyan-500/30" />
            <span className={`text-[9px] sm:text-[10px] font-bold ${theme === 'light' ? 'text-cyan-700' : 'text-cyan-300'}`}>
              <span className="hidden min-[380px]:inline">Paystack </span>MoMo
            </span>
          </div>
          {isSupabaseConnected && (
            <div className={`flex items-center gap-1 ${
              theme === 'light' ? 'bg-emerald-50 border-emerald-200' : 'bg-cyan-950/80 border-cyan-800/80'
            } border px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full`}>
              <span className={`w-1.5 h-1.5 rounded-full ${theme === 'light' ? 'bg-emerald-500' : 'bg-cyan-400'} animate-ping`} />
              <span className={`text-[9px] sm:text-[10px] font-bold ${theme === 'light' ? 'text-emerald-700' : 'text-cyan-300'}`}>
                <span className="hidden min-[400px]:inline">Cloud </span>Sync
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-3 sm:px-4 py-4 flex flex-col gap-4 w-full max-w-full">
        {/* BALANCE HEADER CARD */}
        <div className={`relative rounded-3xl p-5 ${
          theme === 'light'
            ? 'bg-gradient-to-br from-white via-amber-50/50 to-amber-100/40 border-amber-300 shadow-sm'
            : 'bg-gradient-to-br from-neutral-900 via-neutral-900 to-amber-950/30 border-amber-500/30 shadow-xl'
        } border overflow-hidden`}>
          {/* Subtle gold glow circle */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className={`flex items-center justify-between text-xs mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
            <span>Total Available Balance</span>
            <span className={`font-semibold px-2 py-0.5 rounded-full border ${
              theme === 'light' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-950/80 text-amber-400 border-amber-800/50'
            }`}>
              Live Wallet
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className={`text-3xl font-black tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              GHS {wallet.balanceGHS.toFixed(2)}
            </span>
            <span className={`text-sm font-semibold ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
              ≈ ${wallet.balanceUSD.toFixed(2)} USD
            </span>
          </div>

          {/* SPLIT INDICATORS: Creator Tips vs Viewer Watch Rewards */}
          <div className={`grid grid-cols-2 gap-2.5 py-3 border-t ${theme === 'light' ? 'border-amber-200/60' : 'border-neutral-800/80'} mb-4`}>
            <div className={`${theme === 'light' ? 'bg-white/80 border-amber-200' : 'bg-neutral-950/80 border-neutral-800'} p-2.5 rounded-2xl border`}>
              <div className="flex items-center gap-1.5 text-[11px] text-amber-500 font-medium mb-1">
                <Coins className="w-3.5 h-3.5" />
                <span>Creator Tips Earned</span>
              </div>
              <div className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                GHS {wallet.creatorTipsEarned.toFixed(2)}
              </div>
            </div>

            <div className={`${theme === 'light' ? 'bg-white/80 border-amber-200' : 'bg-neutral-950/80 border-neutral-800'} p-2.5 rounded-2xl border`}>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium mb-1">
                <Eye className="w-3.5 h-3.5" />
                <span>Watch Rewards</span>
              </div>
              <div className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                GHS {wallet.viewerWatchRewards.toFixed(2)}
              </div>
            </div>
          </div>

          {/* PRIMARY QUICK ACTIONS */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={openCashoutDrawer}
              className={`py-3 px-4 rounded-xl ${
                theme === 'light' ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-white hover:bg-neutral-100 text-black'
              } font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Cash Out Now
            </button>

            <button
              onClick={() => setTopUpModalOpen(true)}
              className={`py-3 px-4 rounded-xl ${
                theme === 'light'
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700'
              } font-bold text-xs border active:scale-95 transition-transform flex items-center justify-center gap-1.5`}
            >
              <Plus className="w-4 h-4 text-emerald-300" />
              Add Funds
            </button>
          </div>
        </div>

        {/* FAIR & TRANSPARENT WITHDRAWAL RULES CARD */}
        <div className={`${
          theme === 'light' ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-[#080F1E] border-amber-500/30 text-white'
        } border rounded-3xl p-4 flex flex-col gap-2.5 shadow-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <h3 className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Fair & Transparent Liquidity Policy</h3>
            </div>
            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              theme === 'light' ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              Min. 50 Cedis
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className={`${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/70 border-neutral-800/80'} p-2 rounded-xl border`}>
              <span className={`block ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Free Account:</span>
              <span className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>1 Withdrawal / Week</span>
            </div>
            <div className={`${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/70 border-neutral-800/80'} p-2 rounded-xl border`}>
              <span className="text-amber-500 font-semibold block">Pro Subscribed:</span>
              <span className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>2 Withdrawals / Week</span>
            </div>
          </div>

          {/* User's Current Status */}
          <div className={`pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800/60'} flex items-center justify-between text-[10px]`}>
            <span className={theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}>
              Your status: <strong className={theme === 'light' ? 'text-slate-900' : 'text-white'}>{cashoutLimitInfo.isProMember ? '👑 Pro Member' : '⚡ Free Tier'}</strong>
            </span>
            <span className={`font-mono font-bold ${cashoutLimitInfo.remainingThisWeek > 0 ? (theme === 'light' ? 'text-emerald-600' : 'text-emerald-400') : 'text-rose-500'}`}>
              {cashoutLimitInfo.remainingThisWeek} of {cashoutLimitInfo.maxPerWeek} cashout{cashoutLimitInfo.maxPerWeek > 1 ? 's' : ''} left
            </span>
          </div>

          {/* Progress to 50 Cedis threshold */}
          {wallet.balanceGHS < 50 && (
            <div className={`flex flex-col gap-1 pt-1 border-t ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800/40'}`}>
              <div className="flex items-center justify-between text-[9px]">
                <span className={theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}>Progress to Minimum Cashout:</span>
                <span className="font-bold text-amber-500">
                  GHS {wallet.balanceGHS.toFixed(2)} / GHS 50.00 ({Math.min(100, Math.round((wallet.balanceGHS / 50) * 100))}%)
                </span>
              </div>
              <div className={`w-full h-1.5 ${theme === 'light' ? 'bg-slate-200' : 'bg-neutral-900'} rounded-full overflow-hidden`}>
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(5, (wallet.balanceGHS / 50) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* SUSTAINABLE FUNDING & ZERO NET-COST ESCROW BADGE */}
        <div 
          onClick={() => setShowFundingModal(true)}
          className={`${
            theme === 'light'
              ? 'bg-gradient-to-r from-cyan-50 via-white to-amber-50 border-cyan-200 hover:border-cyan-400 shadow-sm'
              : 'bg-gradient-to-r from-[#00B2FE]/10 via-[#0A1628] to-[#FF9F0A]/10 border-[#00B2FE]/30 hover:border-[#00B2FE]/60 shadow-md'
          } border rounded-3xl p-4 flex items-center justify-between cursor-pointer transition-all group w-full max-w-full overflow-hidden`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00B2FE] to-[#FF9F0A] p-[1.5px] shadow-md shrink-0">
              <div className={`w-full h-full ${theme === 'light' ? 'bg-white' : 'bg-[#060D19]'} rounded-[14px] flex items-center justify-center`}>
                <ShieldCheck className="w-5 h-5 text-cyan-500" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900 group-hover:text-cyan-700' : 'text-white group-hover:text-cyan-300'} transition-colors truncate`}>
                  Zero Net-Cost Escrow Funding
                </h4>
                <span className={`text-[9px] ${theme === 'light' ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-400'} font-bold px-1.5 py-0.2 rounded shrink-0`}>
                  P2P Model
                </span>
              </div>
              <p className={`text-[10px] ${theme === 'light' ? 'text-slate-600' : 'text-neutral-400'} mt-0.5 truncate`}>
                92% to Creators • 8% Escrow Float • Upfront Brand Bounties
              </p>
            </div>
          </div>

          <div className={`text-[11px] font-bold ${theme === 'light' ? 'text-cyan-700' : 'text-cyan-400'} group-hover:translate-x-1 transition-transform flex items-center gap-0.5 shrink-0 ml-2`}>
            <span>Learn</span>
            <span>→</span>
          </div>
        </div>

        {/* PAYOUT METHODS MANAGER CARD */}
        <div className={`${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-neutral-900 border-neutral-800'} border rounded-3xl p-4 w-full max-w-full overflow-hidden transition-colors`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-amber-500" />
              <h3 className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-neutral-200'}`}>Payout Channels</h3>
            </div>
            <button
              onClick={() => setAddMethodModalOpen(true)}
              className="text-[11px] text-amber-500 font-bold flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3 h-3" />
              Add Method
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {payoutMethods.length === 0 ? (
              <div className={`py-6 px-4 text-center rounded-2xl ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/60 border-neutral-800/80'} border flex flex-col items-center gap-2.5 animate-fade-in`}>
                <div className={`w-12 h-12 rounded-2xl ${theme === 'light' ? 'bg-white border-slate-200 text-amber-500' : 'bg-neutral-900 border-neutral-800 text-amber-400'} border flex items-center justify-center`}>
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <p className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>No Payout Channels Linked</p>
                  <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'} mt-0.5 max-w-xs leading-relaxed`}>
                    Link your MTN Mobile Money, Telecel Cash, or Ghana Bank Account to receive instant earnings and tips.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddMethodModalOpen(true)}
                  className={`mt-1 px-4 py-2 ${
                    theme === 'light' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-white hover:bg-neutral-100 text-black'
                  } font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Payout Channel</span>
                </button>
              </div>
            ) : (
              payoutMethods.map((method) => (
                <div
                  key={method.id}
                  className={`${
                    theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950 border-neutral-800/80'
                  } p-3 rounded-2xl border transition-all flex items-center justify-between ${
                    method.isDefault ? (theme === 'light' ? 'border-amber-400 shadow-xs' : 'border-amber-400/50 shadow-sm') : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                      {method.type.includes('momo') || method.type.includes('telecel') ? (
                        <Smartphone className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Building2 className="w-4 h-4 text-cyan-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} flex items-center gap-1.5 truncate`}>
                        <span>{method.name}</span>
                        {method.isDefault && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-600 px-1.5 py-0.2 rounded font-semibold shrink-0">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'} truncate`}>
                        {method.accountNumber} • {method.accountHolder}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!method.isDefault && (
                      <button
                        type="button"
                        onClick={() => setDefaultPayoutMethod(method.id)}
                        className={`text-[10px] ${
                          theme === 'light' ? 'text-slate-600 hover:text-amber-600 bg-white border-slate-200' : 'text-neutral-400 hover:text-amber-400 bg-neutral-900 border-neutral-800'
                        } px-2 py-1 rounded-lg border transition-colors`}
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deletePayoutMethod(method.id)}
                      className={`p-1.5 ${theme === 'light' ? 'text-slate-400 hover:text-rose-500 hover:bg-slate-200' : 'text-neutral-500 hover:text-rose-400 hover:bg-neutral-900'} rounded-lg transition-colors`}
                      title="Remove channel"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RECENT EARNINGS FEED */}
        <div className="w-full max-w-full">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h3 className={`text-xs font-bold uppercase tracking-wider truncate ${theme === 'light' ? 'text-slate-900' : 'text-neutral-200'}`}>
              Recent Earnings & Payouts
            </h3>
            <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-500'} shrink-0`}>Real-time ledger</span>
          </div>

          {/* Transaction Filters */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-none pb-1 max-w-full w-full">
            {(['all', 'tips', 'rewards', 'cashouts'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`text-[11px] px-3 py-1 rounded-full capitalize font-semibold transition-colors shrink-0 ${
                  activeFilter === filter
                    ? (theme === 'light' ? 'bg-slate-900 text-white font-black' : 'bg-white text-black font-black')
                    : (theme === 'light' ? 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs' : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800')
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Transaction list */}
          <div className="flex flex-col gap-2 max-w-full w-full">
            {filteredTransactions.length === 0 ? (
              <div className={`py-6 px-3 text-center rounded-2xl ${theme === 'light' ? 'bg-white border-slate-200 shadow-xs' : 'bg-neutral-950/60 border-neutral-800/60'} border w-full`}>
                <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-neutral-400'}`}>No transactions recorded yet.</p>
                <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-500'} mt-0.5`}>Micro-tips, watch-rewards, and MoMo deposits will show up here.</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const isPositive = tx.amountGHS > 0;
                return (
                  <div
                    key={tx.id}
                    className={`${
                      theme === 'light' ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300' : 'bg-neutral-900/90 border-neutral-800/80 hover:border-neutral-700'
                    } border rounded-2xl p-3 flex items-center justify-between gap-3 transition-colors max-w-full overflow-hidden`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isPositive
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-bold truncate ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{tx.title}</div>
                        <div className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'} truncate`}>{tx.subtitle}</div>
                        <div className={`text-[9px] ${theme === 'light' ? 'text-slate-400' : 'text-neutral-500'} mt-0.5 flex items-center gap-1 truncate`}>
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{tx.timestamp}</span>
                          <span>•</span>
                          <span className="font-mono truncate">{tx.referenceId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs font-black ${
                          isPositive ? (theme === 'light' ? 'text-emerald-600' : 'text-emerald-400') : (theme === 'light' ? 'text-slate-800' : 'text-neutral-200')
                        }`}
                      >
                        {isPositive ? `+GHS ${tx.amountGHS.toFixed(2)}` : `-GHS ${Math.abs(tx.amountGHS).toFixed(2)}`}
                      </div>
                      {tx.status === 'pending' || tx.status === 'processing' ? (
                        <span className={`text-[9px] font-bold ${
                          theme === 'light' ? 'text-amber-800 bg-amber-50 border border-amber-200' : 'text-amber-300 bg-amber-500/20 border border-amber-500/30'
                        } px-2 py-0.5 rounded-full inline-flex items-center gap-1`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>Pending (24-48h)</span>
                        </span>
                      ) : tx.status === 'failed' ? (
                        <span className={`text-[9px] font-bold ${
                          theme === 'light' ? 'text-rose-700 bg-rose-50 border border-rose-200' : 'text-rose-300 bg-rose-500/20 border border-rose-500/30'
                        } px-1.5 py-0.5 rounded-full inline-block`}>
                          Failed
                        </span>
                      ) : (
                        <span className={`text-[9px] font-semibold ${
                          theme === 'light' ? 'text-emerald-700 bg-emerald-50' : 'text-emerald-400/90 bg-emerald-950/60'
                        } px-1.5 py-0.2 rounded inline-block`}>
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* TOP-UP MODAL */}
      {topUpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
          <div className={`w-full max-w-sm ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' : 'bg-neutral-900 border-neutral-800 text-white shadow-xl'
          } border rounded-3xl p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto`}>
            <div className={`flex items-center justify-between pb-2 border-b ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                  <Plus className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Top Up ValuWallet</h3>
                  <span className="text-[10px] text-emerald-500 font-semibold">Paystack Secured • Instant MoMo</span>
                </div>
              </div>
              <button
                onClick={() => setTopUpModalOpen(false)}
                className={`text-xs ${theme === 'light' ? 'text-slate-400 hover:text-slate-700' : 'text-neutral-400 hover:text-white'}`}
              >
                ✕
              </button>
            </div>

            <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-neutral-300'} leading-relaxed`}>
              Top up your wallet with Ghanaian Cedis (GHS) to tip creators, unlock masterclasses, and support community challenges.
            </p>

            <div className="grid grid-cols-4 gap-2">
              {[20, 50, 100, 250].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopUpAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    topUpAmount === amt
                      ? (theme === 'light' ? 'bg-amber-500 text-white font-black shadow-md' : 'bg-amber-500 text-neutral-950 font-black shadow-md')
                      : (theme === 'light' ? 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100' : 'bg-neutral-950 text-neutral-300 border border-neutral-800 hover:border-neutral-700')
                  }`}
                >
                  GHS {amt}
                </button>
              ))}
            </div>

            <div className={`${
              theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-neutral-950/80 border-neutral-800 text-neutral-400'
            } p-3 rounded-2xl border flex items-center justify-between text-xs`}>
              <span>Supported Channels:</span>
              <span className={`font-bold flex items-center gap-1.5 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                <span>📱 MTN MoMo</span>
                <span>•</span>
                <span>Telecel</span>
                <span>•</span>
                <span>💳 Card</span>
              </span>
            </div>

            <button
              onClick={handlePaystackTopUp}
              disabled={isProcessingPaystack}
              className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                theme === 'light'
                  ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                  : 'bg-white hover:bg-neutral-100 text-black shadow-white/20'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>
                {isProcessingPaystack ? 'Opening Paystack...' : `Pay GHS ${topUpAmount}.00 with Paystack`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ADD PAYOUT METHOD MODAL */}
      {addMethodModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
          <form
            onSubmit={handleCreateMethod}
            className={`w-full max-w-sm ${
              theme === 'light' ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' : 'bg-neutral-900 border-neutral-800 text-white shadow-xl'
            } border rounded-3xl p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto`}
          >
            <div className={`flex items-center justify-between pb-2 border-b ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
              <h3 className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Add Payout Channel</h3>
              <button
                type="button"
                onClick={() => setAddMethodModalOpen(false)}
                className={`text-xs ${theme === 'light' ? 'text-slate-400 hover:text-slate-700' : 'text-neutral-400 hover:text-white'}`}
              >
                ✕
              </button>
            </div>

            <div>
              <label className={`text-xs font-semibold ${theme === 'light' ? 'text-slate-700' : 'text-neutral-300'} block mb-1`}>
                Channel Provider
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'mtn_momo', label: 'MTN MoMo' },
                  { id: 'telecel_cash', label: 'Telecel Cash' },
                  { id: 'bank', label: 'Bank Account' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setNewMethodType(p.id as any);
                      setAccountNumber('');
                    }}
                    className={`py-2 px-1 text-[11px] font-bold rounded-xl border text-center transition-all ${
                      newMethodType === p.id
                        ? (theme === 'light' ? 'bg-amber-500 text-white border-amber-600 font-black shadow-sm' : 'bg-amber-500 text-neutral-950 border-amber-400 font-black shadow-md')
                        : (theme === 'light' ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white')
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bank Selector if Bank Account chosen */}
            {newMethodType === 'bank' && (
              <div className="animate-fade-in">
                <label className={`text-xs font-semibold ${theme === 'light' ? 'text-slate-700' : 'text-neutral-300'} block mb-1`}>
                  Select Ghanaian Bank
                </label>
                <div className="relative">
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className={`w-full ${
                      theme === 'light'
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                        : 'bg-neutral-950 border-neutral-800 text-white focus:border-amber-400'
                    } border rounded-xl px-3 py-2 text-xs appearance-none cursor-pointer focus:outline-none`}
                  >
                    {GHANA_BANKS.map((bank) => (
                      <option key={bank} value={bank} className={theme === 'light' ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'}>
                        {bank}
                      </option>
                    ))}
                  </select>
                  <Building2 className={`w-4 h-4 ${theme === 'light' ? 'text-slate-400' : 'text-neutral-400'} absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none`} />
                </div>
              </div>
            )}

            <div>
              <label className={`text-xs font-semibold ${theme === 'light' ? 'text-slate-700' : 'text-neutral-300'} block mb-1`}>
                {newMethodType === 'bank' ? 'Bank Account Number' : 'Mobile Money Phone Number'}
              </label>
              <input
                type={newMethodType === 'bank' ? 'text' : 'tel'}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={
                  newMethodType === 'bank'
                    ? 'e.g. 1441000123456 (10-16 digits)'
                    : newMethodType === 'mtn_momo'
                    ? 'e.g. 024 123 4567 or +233 24 123 4567'
                    : 'e.g. 020 123 4567 or +233 20 123 4567'
                }
                required
                className={`w-full ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500 placeholder-slate-400'
                    : 'bg-neutral-950 border-neutral-800 text-white focus:border-amber-400 placeholder-neutral-500'
                } border rounded-xl px-3 py-2 text-xs focus:outline-none`}
              />
            </div>

            <div>
              <label className={`text-xs font-semibold ${theme === 'light' ? 'text-slate-700' : 'text-neutral-300'} block mb-1`}>
                Account Holder Name
              </label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Full Legal Name on Account"
                required
                className={`w-full ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500 placeholder-slate-400'
                    : 'bg-neutral-950 border-neutral-800 text-white focus:border-amber-400 placeholder-neutral-500'
                } border rounded-xl px-3 py-2 text-xs focus:outline-none`}
              />
            </div>

            {/* Optional Branch Name for Banks */}
            {newMethodType === 'bank' && (
              <div className="animate-fade-in">
                <label className={`text-xs font-semibold ${theme === 'light' ? 'text-slate-700' : 'text-neutral-300'} block mb-1`}>
                  Branch Name <span className={`${theme === 'light' ? 'text-slate-400' : 'text-neutral-500'} font-normal`}>(Optional)</span>
                </label>
                <input
                  type="text"
                  value={bankBranch}
                  onChange={(e) => setBankBranch(e.target.value)}
                  placeholder="e.g. Accra Main Branch, Airport City"
                  className={`w-full ${
                    theme === 'light'
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500 placeholder-slate-400'
                      : 'bg-neutral-950 border-neutral-800 text-white focus:border-amber-400 placeholder-neutral-500'
                  } border rounded-xl px-3 py-2 text-xs focus:outline-none`}
                />
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                  : 'bg-white hover:bg-neutral-100 text-black shadow-white/20'
              }`}
            >
              Save Payout Channel
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
