import React from 'react';
import { 
  Home, 
  Compass, 
  Plus, 
  Wallet, 
  User, 
  Settings, 
  Sun, 
  Moon, 
  Sparkles, 
  Coins, 
  LogIn, 
  CheckCircle2, 
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ActiveTab } from '../../types';

export const DesktopSidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab,
    isLoggedIn,
    authUser,
    currentUser,
    setAuthModalOpen,
    setAuthMode,
    setShareToast,
    theme,
    toggleTheme,
    setShowSettings,
    wallet,
    openCashoutDrawer
  } = useApp();

  const isLight = theme === 'light';

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'feed', label: 'For You Feed', icon: Home },
    { id: 'discover', label: 'Discover & Pools', icon: Compass },
    { id: 'create', label: 'Creator Studio', icon: Plus },
    { id: 'wallet', label: 'ValuWallet', icon: Wallet, badge: `GHS ${wallet.balanceGHS.toFixed(2)}` },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const handleTabClick = (tabId: ActiveTab) => {
    if (tabId === 'create') {
      if (!authUser && !isLoggedIn) {
        setAuthMode('signup');
        setAuthModalOpen(true);
        setShareToast('Sign in or register to record and publish videos!');
        return;
      }
    }
    setActiveTab(tabId);
  };

  return (
    <aside className={`hidden lg:flex flex-col w-64 lg:w-72 h-full shrink-0 select-none z-30 transition-colors duration-200 border-r ${
      isLight 
        ? 'bg-white border-slate-200 text-slate-800' 
        : 'bg-[#060D19] border-white/10 text-white'
    }`}>
      {/* Brand Header */}
      <div className="p-5 lg:p-6 pb-4 flex items-center justify-between border-b border-inherit">
        <button 
          onClick={() => setActiveTab('feed')}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          {/* Logo Symbol */}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00B2FE] via-[#0284C7] to-[#FF9F0A] p-[2px] shadow-lg shadow-[#00B2FE]/25 group-hover:scale-105 transition-transform">
            <div className={`w-full h-full rounded-[14px] flex items-center justify-center ${
              isLight ? 'bg-white' : 'bg-[#060D19]'
            }`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 3L19 12L5 21V3Z"
                  fill="url(#sidebarLogoGrad)"
                />
                <defs>
                  <linearGradient id="sidebarLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00B2FE" />
                    <stop offset="100%" stopColor="#FF9F0A" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-xl font-black tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                ValuVid
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 shadow-sm">
                Beta
              </span>
            </div>
            <p className={`text-[11px] font-medium leading-none mt-0.5 ${
              isLight ? 'text-slate-500' : 'text-neutral-400'
            }`}>
              Creator Economy 🇬🇭
            </p>
          </div>
        </button>
      </div>

      {/* Main Navigation Tabs */}
      <nav className="flex-1 p-3 lg:p-4 space-y-1.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isCreate = item.id === 'create';

          if (isCreate) {
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full my-2.5 py-3 px-4 rounded-2xl flex items-center gap-3.5 font-bold text-sm shadow-lg transition-all duration-200 active:scale-98 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#00B2FE] via-[#0284C7] to-[#FF9F0A] text-white shadow-[#00B2FE]/30 scale-[1.02]'
                    : isLight
                    ? 'bg-gradient-to-r from-sky-500 to-amber-500 hover:from-sky-600 hover:to-amber-600 text-white shadow-sky-500/20'
                    : 'bg-gradient-to-r from-[#00B2FE] to-[#FF9F0A] hover:brightness-110 text-neutral-950 font-black shadow-[#00B2FE]/20'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <span className="flex-1 text-left">Create / Upload</span>
                <Sparkles className="w-4 h-4 opacity-80" />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full py-3 px-3.5 rounded-2xl flex items-center gap-3.5 font-semibold text-sm transition-all duration-150 text-left ${
                isActive
                  ? isLight
                    ? 'bg-slate-100 text-slate-900 font-bold shadow-sm'
                    : 'bg-white/10 text-white font-bold border border-white/10 shadow-md'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  : 'text-neutral-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                isActive 
                  ? isLight ? 'bg-sky-500 text-white shadow-sm' : 'bg-gradient-to-tr from-[#00B2FE] to-[#FF9F0A] text-neutral-950 shadow-md'
                  : isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-neutral-400'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  isLight 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Live MoMo Wallet Quick Widget */}
        <div className={`mt-6 p-4 rounded-2xl border transition-colors ${
          isLight 
            ? 'bg-gradient-to-br from-amber-50 to-sky-50 border-amber-200/80 shadow-sm' 
            : 'bg-gradient-to-br from-amber-950/20 via-[#0B1528] to-cyan-950/20 border-white/10 shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
              isLight ? 'text-amber-800' : 'text-amber-300'
            }`}>
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              ValuWallet MoMo
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
              Live
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className={`text-xl font-mono font-black ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                GHS {wallet.balanceGHS.toFixed(2)}
              </span>
              <p className={`text-[10px] ${
                isLight ? 'text-slate-500' : 'text-neutral-400'
              }`}>
                Watch rewards & tips
              </p>
            </div>
            <button
              onClick={() => openCashoutDrawer()}
              className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 underline decoration-cyan-400/40"
            >
              Cashout
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
              isLight 
                ? 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-sm' 
                : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            }`}
          >
            Manage Wallet & MoMo
          </button>
        </div>
      </nav>

      {/* Footer Controls & User Card */}
      <div className="p-3 lg:p-4 border-t border-inherit space-y-2.5">
        {/* Day / Dark Theme & Settings Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-colors ${
              isLight 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
            title={`Switch to ${isLight ? 'Dark' : 'Day'} Mode`}
          >
            {isLight ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Day Mode</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className={`p-2 rounded-xl transition-colors ${
              isLight 
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                : 'bg-white/5 hover:bg-white/10 text-neutral-300'
            }`}
            title="App Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* User Status / Login Banner */}
        {isLoggedIn || authUser ? (
          <div 
            onClick={() => setActiveTab('profile')}
            className={`p-2.5 rounded-2xl flex items-center gap-3 cursor-pointer transition-colors ${
              isLight ? 'hover:bg-slate-100 border border-slate-200/60' : 'hover:bg-white/5 border border-white/5'
            }`}
          >
            <img
              src={currentUser.avatar || '/default-avatar.jpg'}
              alt={currentUser.name}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/default-avatar.jpg';
              }}
              className="w-9 h-9 rounded-full object-cover border border-amber-400/50 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className={`text-xs font-bold truncate ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {currentUser.name}
                </span>
                <CheckCircle2 className="w-3 h-3 text-amber-400 shrink-0" />
              </div>
              <p className={`text-[11px] truncate ${
                isLight ? 'text-slate-500' : 'text-neutral-400'
              }`}>
                @{currentUser.username}
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setAuthMode('signup');
              setAuthModalOpen(true);
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:brightness-105 active:scale-95 transition-all"
          >
            <LogIn className="w-3.5 h-3.5 text-neutral-950 stroke-[2.5]" />
            <span>Sign In / Register</span>
          </button>
        )}
      </div>
    </aside>
  );
};
