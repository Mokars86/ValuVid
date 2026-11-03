import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { sounds } from '../../utils/soundEffects';

export const SplashScreen: React.FC = () => {
  const { showSplash, setShowSplash } = useApp();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!showSplash) return;

    setProgress(25);

    const t1 = setTimeout(() => {
      setProgress(70);
    }, 500);

    const t2 = setTimeout(() => {
      setProgress(100);
    }, 1100);

    const t3 = setTimeout(() => {
      setShowSplash(false);
    }, 1600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [showSplash, setShowSplash]);

  if (!showSplash) return null;

  const handleSkipOrEnter = () => {
    sounds.playLikePop();
    setShowSplash(false);
  };

  return (
    <div 
      className="absolute inset-0 z-50 bg-[#050B14] flex flex-col items-center justify-between p-6 select-none overflow-hidden animate-fade-in text-white"
      onClick={handleSkipOrEnter}
    >
      {/* Subtle Cyan & Amber Brand Ambience */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-[#00B2FE]/15 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-72 h-72 bg-[#FF9F0A]/15 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#0066FF]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Bar with Minimal Skip Action */}
      <div className="relative z-10 w-full flex items-center justify-end pt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSkipOrEnter();
          }}
          className="text-xs text-neutral-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10"
        >
          Skip
        </button>
      </div>

      {/* Center Brand Logo */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto">
        <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95">
          <img
            src="/logo.png"
            alt="ValuVid"
            className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
          />
        </div>
      </div>

      {/* Bottom Minimal Loading Bar & Powered By Branding */}
      <div className="relative z-10 w-full max-w-[260px] flex flex-col items-center gap-3 pb-6">
        <div className="w-44 h-1 bg-[#0A1628] rounded-full overflow-hidden p-[0.5px] border border-white/10 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#00B2FE] via-[#38BDF8] to-[#FF9F0A] rounded-full transition-all duration-400 ease-out shadow-[0_0_10px_rgba(0,178,254,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Powered By: Mokarstech with Brand Logo */}
        <div className="flex items-center gap-2 pt-1">
          <img
            src="/mokarstech-logo.png"
            alt="Mokarstech"
            className="w-5 h-5 object-contain drop-shadow-[0_0_8px_rgba(0,178,254,0.4)]"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-medium">
              Powered By:
            </span>
            <span className="text-xs font-black tracking-wide bg-gradient-to-r from-amber-400 via-amber-200 to-cyan-400 bg-clip-text text-transparent">
              Mokarstech
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

