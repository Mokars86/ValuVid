import React from 'react';
import { Home, Compass, Plus, Wallet, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ActiveTab } from '../../types';

export const BottomNav: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab,
    isLoggedIn,
    authUser,
    setAuthModalOpen,
    setAuthMode,
    setShareToast,
    theme
  } = useApp();

  const isLightNav = theme === 'light' && activeTab !== 'feed';

  const navItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'feed', label: 'Home', icon: Home },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'create', label: 'Studio', icon: Plus },
    { id: 'wallet', label: 'ValuWallet', icon: Wallet },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className={`lg:hidden relative z-40 w-full transition-colors duration-200 ${
      isLightNav 
        ? 'bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]' 
        : 'bg-black border-t border-neutral-900 shadow-[0_-8px_25px_rgba(0,0,0,0.8)]'
    } px-1 sm:px-4 py-2 sm:py-2.5 pb-[max(0.6rem,env(safe-area-inset-bottom,0px))] flex items-center justify-around select-none`}>
      <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl mx-auto flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const isCreate = item.id === 'create';
        const isWallet = item.id === 'wallet';

        // Studio (+) button with yellow & blue logo gradient stroke
        if (isCreate) {
          return (
            <button
              key={item.id}
              onClick={() => {
                if (!authUser && !isLoggedIn) {
                  setAuthMode('signup');
                  setAuthModalOpen(true);
                  setShareToast('Sign in or register to record and publish videos!');
                  return;
                }
                setActiveTab(item.id);
              }}
              className="flex flex-col items-center justify-center -mt-5 transition-transform active:scale-95 group focus:outline-none"
              aria-label="Create Studio"
            >
              {/* Studio Icon Container with Yellow and Blue Logo Gradient Stroke */}
              <div className="relative w-13 h-13 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                {/* Subtle ambient glow behind the stroke */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#00B2FE]/30 to-[#FF9F0A]/30 blur-md group-hover:blur-lg transition-all" />

                {/* SVG Gradient Stroke Ring */}
                <svg className="w-[50px] h-[50px]" viewBox="0 0 48 48">
                  <defs>
                    <linearGradient id="studioRingGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00B2FE" />
                      <stop offset="45%" stopColor="#0ea5e9" />
                      <stop offset="100%" stopColor="#FF9F0A" />
                    </linearGradient>
                    <linearGradient id="studioIconGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00B2FE" />
                      <stop offset="100%" stopColor="#FF9F0A" />
                    </linearGradient>
                  </defs>

                  {/* Dark Obsidian Inner Fill */}
                  <circle cx="24" cy="24" r="21" fill="#060C18" />

                  {/* Yellow and Blue Logo Gradient Stroke */}
                  <circle
                    cx="24"
                    cy="24"
                    r="21"
                    fill="none"
                    stroke="url(#studioRingGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="origin-center transition-transform duration-500"
                  />
                </svg>

                {/* Center Plus Icon with Yellow and Blue Gradient Stroke */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(0,178,254,0.7)]" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 5V19M5 12H19"
                      stroke="url(#studioIconGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              <span className={`text-[11px] mt-1 font-bold tracking-tight ${
                isLightNav ? 'text-slate-900' : 'text-white'
              }`}>
                Studio
              </span>
            </button>
          );
        }

        // Regular navigation items
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2 sm:px-3 rounded-xl transition-all relative ${
              isLightNav
                ? (isActive ? 'text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-700')
                : (isActive ? 'text-white font-bold' : 'text-white/60 hover:text-white')
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Icon
                className={`w-[26px] h-[26px] transition-all duration-200 ${
                  isActive
                    ? isLightNav
                      ? 'scale-110 text-slate-950 stroke-[2.4] drop-shadow-[0_0_8px_rgba(0,178,254,0.35)]'
                      : 'scale-110 text-white stroke-[2.4] drop-shadow-[0_0_10px_rgba(255,255,255,0.45)]'
                    : isLightNav
                      ? 'text-slate-400 hover:text-slate-700 stroke-[2]'
                      : 'text-white/70 hover:text-white stroke-[2]'
                }`}
              />
            </div>

            <span
              className={`text-[11px] mt-1 tracking-tight transition-colors ${
                isActive 
                  ? (isLightNav ? 'text-slate-950 font-bold' : 'text-white font-bold')
                  : (isLightNav ? 'text-slate-500 font-medium' : 'text-white/60 hover:text-white font-medium')
              }`}
            >
              {item.label}
            </span>

            {/* Active Indicator Underline */}
            {isActive && (
              <span className={`absolute bottom-0 w-5 h-0.5 rounded-full ${
                isLightNav 
                  ? 'bg-slate-900 shadow-[0_0_6px_rgba(15,23,42,0.4)]' 
                  : 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]'
              }`} />
            )}
          </button>
        );
      })}
      </div>
    </nav>
  );
};
