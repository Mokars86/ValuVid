import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowUpRight, 
  X, 
  Smartphone, 
  Building2, 
  CheckCircle2, 
  ShieldCheck, 
  Coins, 
  Clock,
  Sparkles,
  Plus,
  Zap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GHANA_BANKS } from '../../services/paystackService';

export const CashoutDrawer: React.FC = () => {
  const { 
    theme,
    cashoutDrawerOpen, 
    closeCashoutDrawer, 
    wallet, 
    payoutMethods, 
    processCashout,
    addPayoutMethod,
    currentUser,
    cashoutLimitInfo,
    setShowProModal
  } = useApp();

  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    payoutMethods[0]?.id || ''
  );
  const [cashoutAmount, setCashoutAmount] = useState<number>(50);
  const [isSuccess, setIsSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState<{ amount: number; method: string; ref: string; isPending?: boolean } | null>(null);

  // Quick inline add channel state inside drawer
  const [showAddInDrawer, setShowAddInDrawer] = useState(payoutMethods.length === 0);
  const [newType, setNewType] = useState<'mtn_momo' | 'telecel_cash' | 'bank'>('mtn_momo');
  const [selectedBank, setSelectedBank] = useState<string>(GHANA_BANKS[0] || 'GCB Bank');
  const [bankBranch, setBankBranch] = useState('');
  const [newNum, setNewNum] = useState('');
  const [newName, setNewName] = useState(currentUser.name || 'ValuVid Creator');

  // Synchronize active payout channel whenever drawer opens or methods update
  useEffect(() => {
    if (payoutMethods.length > 0) {
      const def = payoutMethods.find((m) => m.isDefault) || payoutMethods[0];
      if (def && (!selectedMethodId || !payoutMethods.some((m) => m.id === selectedMethodId))) {
        setSelectedMethodId(def.id);
      }
      setShowAddInDrawer(false);
    } else {
      setShowAddInDrawer(true);
    }
  }, [cashoutDrawerOpen, payoutMethods, selectedMethodId]);

  if (!cashoutDrawerOpen) return null;

  const activeMethodId = selectedMethodId || payoutMethods[0]?.id || '';
  const selectedMethod = payoutMethods.find((m) => m.id === activeMethodId) || payoutMethods[0];

  const handleCashout = () => {
    if (!selectedMethod) {
      setShowAddInDrawer(true);
      return;
    }

    if (cashoutLimitInfo.remainingThisWeek <= 0) {
      alert(cashoutLimitInfo.reason || 'Weekly withdrawal limit reached.');
      return;
    }

    if (cashoutAmount < 50) {
      alert('Minimum cashout threshold is GHS 50.00 (50 Cedis).');
      return;
    }

    if (cashoutAmount > wallet.balanceGHS) {
      alert(`Insufficient funds. Your withdrawable balance is GHS ${wallet.balanceGHS.toFixed(2)}`);
      return;
    }

    const paystackTransferRef = `TRF_PSTK_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const success = processCashout(selectedMethod.id, cashoutAmount, paystackTransferRef);
    if (success) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#10B981', '#F59E0B', '#3B82F6', '#FFFFFF'],
      });

      setReceiptData({
        amount: cashoutAmount,
        method: selectedMethod.name,
        ref: paystackTransferRef,
        isPending: !currentUser?.isPro,
      });
      setIsSuccess(true);
    }
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNum.trim()) return;

    let methodName = '';
    if (newType === 'mtn_momo') {
      methodName = 'MTN Mobile Money';
    } else if (newType === 'telecel_cash') {
      methodName = 'Telecel Cash';
    } else {
      methodName = bankBranch.trim() ? `${selectedBank} (${bankBranch.trim()})` : selectedBank;
    }

    const newId = addPayoutMethod({
      type: newType,
      name: methodName,
      accountNumber: newNum.trim(),
      accountHolder: newName.trim(),
      isDefault: true,
      iconType: newType === 'bank' ? 'bank' : 'momo',
    });

    if (newId) {
      setSelectedMethodId(newId);
    }
    setShowAddInDrawer(false);
    setNewNum('');
    setBankBranch('');
  };

  const handleClose = () => {
    setIsSuccess(false);
    setReceiptData(null);
    setShowAddInDrawer(false);
    closeCashoutDrawer();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
      <div className={`w-full max-w-sm ${
        theme === 'light' ? 'bg-white border-slate-200 text-slate-900 shadow-2xl' : 'bg-neutral-900 border-neutral-800 text-white shadow-2xl'
      } border rounded-3xl p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-2 border-b ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Instant MoMo Cash-Out</h3>
              <p className="text-[10px] text-emerald-500 font-semibold">Paystack Transfers • 0% Fee</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`w-7 h-7 rounded-full ${
              theme === 'light' ? 'bg-slate-100 text-slate-400 hover:text-slate-700' : 'bg-neutral-800 text-neutral-400 hover:text-white'
            } flex items-center justify-center transition-colors`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess && receiptData ? (
          <div className="py-4 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className={`w-16 h-16 rounded-full ${
              receiptData.isPending ? 'bg-amber-500/20 border-2 border-amber-400' : 'bg-emerald-500/20 border-2 border-emerald-400'
            } flex items-center justify-center mb-3`}>
              {receiptData.isPending ? (
                <Clock className="w-8 h-8 text-amber-500" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              )}
            </div>
            <h4 className={`text-base font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              {receiptData.isPending ? 'Payout Queued (Processing)' : 'Payout Dispatched!'}
            </h4>
            <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-neutral-300'} mt-1 max-w-xs leading-relaxed`}>
              {receiptData.isPending
                ? 'Your payout is queued in the scheduled batch queue (within 24–48 hours) as a Free Creator Tier holder. Funds will disburse automatically to your Mobile Money account once escrow float is verified.'
                : 'Funds transferred instantly to your Mobile Money account via Paystack Priority Rails.'}
            </p>

            {/* Receipt Card */}
            <div className={`w-full ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950 border-neutral-800'
            } border rounded-2xl p-4 my-4 text-left flex flex-col gap-2`}>
              <div className={`flex items-center justify-between text-xs ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                <span>Amount:</span>
                <span className="text-base font-black text-emerald-500">
                  GHS {receiptData.amount.toFixed(2)}
                </span>
              </div>
              <div className={`flex items-center justify-between text-xs ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                <span>Payout Status:</span>
                <span className={`font-bold ${receiptData.isPending ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {receiptData.isPending ? 'Pending Batch Queue (24-48h)' : 'Completed (Instant)'}
                </span>
              </div>
              <div className={`flex items-center justify-between text-xs ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                <span>Destination:</span>
                <span className={`font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{receiptData.method}</span>
              </div>
              <div className={`flex items-center justify-between text-xs ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                <span>Phone / Account:</span>
                <span className={`font-mono ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{selectedMethod?.accountNumber}</span>
              </div>
              <div className={`flex items-center justify-between text-xs ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                <span>Reference:</span>
                <span className="text-amber-500 font-mono font-bold">{receiptData.ref}</span>
              </div>
              <div className={`flex items-center justify-between text-xs ${theme === 'light' ? 'text-slate-500 border-slate-200' : 'text-neutral-400 border-neutral-900'} pt-2 border-t`}>
                <span>Network Processing Fee:</span>
                <span className="text-emerald-500 font-bold">GHS 0.00 (Zero Fee)</span>
              </div>
            </div>

            {receiptData.isPending && (
              <div className={`w-full p-3 rounded-xl border mb-3 text-left flex items-center justify-between gap-2 ${
                theme === 'light' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}>
                <div className="text-[10px] leading-tight">
                  <span className="font-bold block">Need instant zero-wait cashouts?</span>
                  <span className={theme === 'light' ? 'text-amber-800' : 'text-neutral-400'}>Pro Creator Tier members bypass the batch queue.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    setShowProModal(true);
                  }}
                  className="px-2.5 py-1 text-[10px] bg-amber-500 text-black font-bold rounded-lg shrink-0"
                >
                  View Pro
                </button>
              </div>
            )}

            <button
              onClick={handleClose}
              className={`w-full py-3 rounded-xl font-bold text-xs transition-colors ${
                theme === 'light' ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-neutral-800 hover:bg-neutral-700 text-white'
              }`}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Wallet Balance Display & Threshold Progress */}
            <div className={`${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950 border-neutral-800'
            } p-3.5 rounded-2xl border flex flex-col gap-2.5`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'} block`}>Available Withdrawable Balance</span>
                  <span className={`text-xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    GHS {wallet.balanceGHS.toFixed(2)}
                  </span>
                </div>
                {wallet.balanceGHS >= 50 && (
                  <button
                    onClick={() => setCashoutAmount(Math.floor(wallet.balanceGHS))}
                    className={`px-2.5 py-1 ${
                      theme === 'light' ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-500 hover:text-white' : 'bg-amber-500/20 border-amber-400/40 text-amber-300 hover:bg-amber-500 hover:text-neutral-950'
                    } border rounded-lg text-xs font-bold transition-colors`}
                  >
                    Max Balance
                  </button>
                )}
              </div>

              {/* Progress to 50 Cedis minimum threshold */}
              {wallet.balanceGHS < 50 && (
                <div className={`flex flex-col gap-1 pt-1.5 border-t ${theme === 'light' ? 'border-slate-200' : 'border-neutral-900'}`}>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}>Withdrawal Threshold (50 Cedis):</span>
                    <span className="font-bold text-amber-500">
                      GHS {wallet.balanceGHS.toFixed(2)} / GHS 50.00 ({Math.min(100, Math.round((wallet.balanceGHS / 50) * 100))}%)
                    </span>
                  </div>
                  <div className={`w-full h-1.5 ${theme === 'light' ? 'bg-slate-200' : 'bg-neutral-900'} rounded-full overflow-hidden`}>
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, (wallet.balanceGHS / 50) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Fair & Transparent Withdrawal Policy Banner */}
            <div className={`${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950/90 border-neutral-800'
            } border rounded-2xl p-3 flex flex-col gap-2`}>
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 font-bold">
                  {cashoutLimitInfo.isProMember ? (
                    <span className="text-amber-500 flex items-center gap-1">
                      👑 Pro Creator Pass
                    </span>
                  ) : (
                    <span className={`${theme === 'light' ? 'text-slate-800' : 'text-neutral-300'} flex items-center gap-1`}>
                      ⚡ Free Creator Tier
                    </span>
                  )}
                </div>
                <span className={`text-[10px] ${
                  theme === 'light' ? 'bg-white text-slate-700 border-slate-200' : 'bg-neutral-900 text-neutral-300 border-neutral-800'
                } px-2 py-0.5 rounded-full border font-mono`}>
                  Min. GHS 50.00
                </span>
              </div>

              <div className={`flex items-center justify-between text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                <span>Withdrawal Frequency:</span>
                <span className={`font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {cashoutLimitInfo.isProMember ? 'Twice a week (2x / 7 days)' : 'Once a month (1x / 30 days)'}
                </span>
              </div>

              <div className={`flex items-center justify-between text-[10px] ${theme === 'light' ? 'text-slate-500 border-slate-200' : 'text-neutral-400 border-neutral-900'} pt-1 border-t`}>
                <span>Remaining this {cashoutLimitInfo.isProMember ? 'week' : 'month'}:</span>
                <span className={`font-bold ${cashoutLimitInfo.remainingThisWeek > 0 ? (theme === 'light' ? 'text-emerald-600' : 'text-emerald-400') : 'text-rose-500'}`}>
                  {cashoutLimitInfo.remainingThisWeek} of {cashoutLimitInfo.maxPerWeek} available
                </span>
              </div>

              {cashoutLimitInfo.remainingThisWeek === 0 && (
                <div className={`mt-1 ${
                  theme === 'light' ? 'bg-rose-50 border-rose-200' : 'bg-rose-950/40 border-rose-500/40'
                } border p-2.5 rounded-xl flex flex-col gap-1.5`}>
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold ${theme === 'light' ? 'text-rose-700' : 'text-rose-300'}`}>
                    <Clock className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{cashoutLimitInfo.isProMember ? 'Weekly' : 'Monthly'} withdrawal limit reached</span>
                  </div>
                  {cashoutLimitInfo.nextAvailableDate && (
                    <span className={`text-[9px] ${theme === 'light' ? 'text-slate-600' : 'text-neutral-300'}`}>
                      Next withdrawal opens: <strong>{cashoutLimitInfo.nextAvailableDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                    </span>
                  )}
                  {!cashoutLimitInfo.isProMember && (
                    <button
                      type="button"
                      onClick={() => {
                        closeCashoutDrawer();
                        setShowProModal(true);
                      }}
                      className="mt-1 py-1.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 rounded-lg text-[10px] font-bold shadow-md hover:scale-[1.01] active:scale-95 transition-all text-center flex items-center justify-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Upgrade to Pro to Withdraw Twice a Week</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Select Destination or Quick Add */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-[11px] font-bold ${theme === 'light' ? 'text-slate-700' : 'text-neutral-300'} uppercase tracking-wider block`}>
                  Payout Destination
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddInDrawer(!showAddInDrawer)}
                  className="text-[11px] text-amber-500 hover:text-amber-600 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>{showAddInDrawer ? 'Select Existing' : '+ Add Channel'}</span>
                </button>
              </div>

              {showAddInDrawer ? (
                /* Inline Quick Channel Form */
                <form onSubmit={handleQuickAdd} className={`${
                  theme === 'light' ? 'bg-slate-50 border-amber-300' : 'bg-neutral-950 border-amber-500/40'
                } p-3 rounded-2xl border flex flex-col gap-2.5 animate-fade-in`}>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'mtn_momo', label: 'MTN MoMo' },
                      { id: 'telecel_cash', label: 'Telecel' },
                      { id: 'bank', label: 'Bank' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setNewType(p.id as any)}
                        className={`py-1.5 text-[10px] font-bold rounded-lg border text-center transition-all ${
                          newType === p.id
                            ? (theme === 'light' ? 'bg-amber-500 text-white border-amber-600 font-black' : 'bg-amber-500 text-neutral-950 border-amber-400 font-black')
                            : (theme === 'light' ? 'bg-white text-slate-700 border-slate-200' : 'bg-neutral-900 text-neutral-400 border-neutral-800')
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {newType === 'bank' && (
                    <div className="space-y-2">
                      <div className="relative">
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className={`w-full ${
                            theme === 'light' ? 'bg-white border-slate-200 text-slate-900 focus:border-amber-500' : 'bg-neutral-900 border-neutral-800 text-white focus:border-amber-400'
                          } border rounded-xl px-3 py-1.5 text-xs appearance-none cursor-pointer focus:outline-none`}
                        >
                          {GHANA_BANKS.map((b) => (
                            <option key={b} value={b} className={theme === 'light' ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'}>
                              {b}
                            </option>
                          ))}
                        </select>
                        <Building2 className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-slate-400' : 'text-neutral-400'} absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none`} />
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Branch Name (Optional)"
                          value={bankBranch}
                          onChange={(e) => setBankBranch(e.target.value)}
                          className={`w-full ${
                            theme === 'light' ? 'bg-white border-slate-200 text-slate-900 focus:border-amber-500 placeholder-slate-400' : 'bg-neutral-900 border-neutral-800 text-white focus:border-amber-400 placeholder-neutral-500'
                          } border rounded-xl px-3 py-1.5 text-xs focus:outline-none`}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <input
                      type={newType === 'bank' ? 'text' : 'tel'}
                      required
                      placeholder={
                        newType === 'bank'
                          ? 'Bank Account Number (10-16 digits)'
                          : newType === 'mtn_momo'
                          ? 'MTN Phone e.g. 024 123 4567'
                          : 'Telecel Phone e.g. 020 123 4567'
                      }
                      value={newNum}
                      onChange={(e) => setNewNum(e.target.value)}
                      className={`w-full ${
                        theme === 'light' ? 'bg-white border-slate-200 text-slate-900 focus:border-amber-500 placeholder-slate-400' : 'bg-neutral-900 border-neutral-800 text-white focus:border-amber-400 placeholder-neutral-500'
                      } border rounded-xl px-3 py-1.5 text-xs focus:outline-none`}
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Account Holder Full Name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className={`w-full ${
                        theme === 'light' ? 'bg-white border-slate-200 text-slate-900 focus:border-amber-500 placeholder-slate-400' : 'bg-neutral-900 border-neutral-800 text-white focus:border-amber-400 placeholder-neutral-500'
                      } border rounded-xl px-3 py-1.5 text-xs focus:outline-none`}
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-2 font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all ${
                      theme === 'light' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-white hover:bg-neutral-100 text-black'
                    }`}
                  >
                    Save & Select Channel
                  </button>
                </form>
              ) : (
                <div className="flex flex-col gap-2">
                  {payoutMethods.length > 0 ? (
                    payoutMethods.map((method) => {
                      const isSelected = activeMethodId === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setSelectedMethodId(method.id)}
                          className={`p-3 rounded-xl flex items-center justify-between transition-all text-left cursor-pointer border ${
                            isSelected
                              ? (theme === 'light' ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs' : 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/10')
                              : (theme === 'light' ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700' : 'bg-neutral-950 hover:bg-neutral-800/80 border-neutral-800 text-neutral-300')
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg ${theme === 'light' ? 'bg-white border-slate-200 text-amber-500' : 'bg-neutral-900 text-amber-400'} border flex items-center justify-center`}>
                              {method.type.includes('bank') ? (
                                <Building2 className="w-4 h-4" />
                              ) : (
                                <Smartphone className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} flex items-center gap-1`}>
                                <span>{method.name}</span>
                                {method.isDefault && (
                                  <span className="text-[8px] bg-emerald-500/20 text-emerald-600 px-1 py-0.2 rounded font-mono">
                                    Primary
                                  </span>
                                )}
                              </div>
                              <div className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                                {method.accountNumber} ({method.accountHolder})
                              </div>
                            </div>
                          </div>

                          <div className="text-[10px] text-emerald-600 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            ⚡ Instant
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className={`${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950 border-neutral-800'} p-4 rounded-xl border text-center flex flex-col items-center gap-2`}>
                      <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>No payout method added yet.</p>
                      <button
                        type="button"
                        onClick={() => setShowAddInDrawer(true)}
                        className="px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors"
                      >
                        + Add MoMo or Bank Account
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Preset Amounts (Minimum 50 Cedis) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={`text-[11px] font-bold ${theme === 'light' ? 'text-slate-700' : 'text-neutral-300'} uppercase tracking-wider block`}>
                  Cash-Out Amount (GHS)
                </label>
                <span className="text-[10px] text-amber-500 font-semibold font-mono">
                  Min. 50 Cedis
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashoutAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      cashoutAmount === amt
                        ? (theme === 'light' ? 'bg-amber-500 text-white shadow-md font-black' : 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20 font-black')
                        : (theme === 'light' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800 border border-neutral-800')
                    }`}
                  >
                    GHS {amt}
                  </button>
                ))}
              </div>

              <div className={`flex items-center ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950 border-neutral-800'} border rounded-xl px-3 py-2`}>
                <span className="text-xs text-amber-500 font-bold mr-2">GHS</span>
                <input
                  type="number"
                  min="50"
                  step="1"
                  value={cashoutAmount || ''}
                  onChange={(e) => setCashoutAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Min. 50 Cedis"
                  className={`w-full bg-transparent text-xs font-bold ${theme === 'light' ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-neutral-500'} focus:outline-none`}
                />
              </div>
            </div>

            {/* Payout Security Note */}
            <div className={`flex items-center gap-2 text-[10px] ${
              theme === 'light' ? 'text-slate-600 bg-slate-50 border-slate-200' : 'text-neutral-400 bg-neutral-950/60 border-neutral-800/80'
            } p-2.5 rounded-xl border`}>
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Zero withdrawal fees. Direct Paystack transfers to MTN MoMo, Telecel, or Ghanaian banks.
              </span>
            </div>

            {/* Submit Payout Button */}
            <button
              onClick={handleCashout}
              disabled={
                wallet.balanceGHS < 50 || 
                cashoutAmount < 50 || 
                cashoutAmount > wallet.balanceGHS || 
                !selectedMethod || 
                cashoutLimitInfo.remainingThisWeek <= 0
              }
              className={`w-full py-3.5 rounded-xl font-bold text-xs shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer ${
                wallet.balanceGHS >= 50 && 
                cashoutAmount >= 50 && 
                cashoutAmount <= wallet.balanceGHS && 
                selectedMethod && 
                cashoutLimitInfo.remainingThisWeek > 0
                  ? (theme === 'light' ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20' : 'bg-white hover:bg-neutral-100 text-black shadow-white/20 hover:scale-[1.01]')
                  : (theme === 'light' ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60' : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-60')
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>
                {wallet.balanceGHS < 50
                  ? `Min. GHS 50.00 Required (Have GHS ${wallet.balanceGHS.toFixed(2)})`
                  : cashoutLimitInfo.remainingThisWeek <= 0
                  ? `Weekly Limit Reached (${cashoutLimitInfo.maxPerWeek}x / 7 days)`
                  : cashoutAmount < 50
                  ? 'Minimum Withdrawal is GHS 50.00'
                  : cashoutAmount > wallet.balanceGHS
                  ? 'Amount Exceeds Balance'
                  : !selectedMethod
                  ? 'Select or Add Payout Channel'
                  : `Confirm Cashout of GHS ${cashoutAmount.toFixed(2)}`}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
