import React from 'react';
import { Share2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DesktopSidebar } from './DesktopSidebar';

export const DeviceShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { shareToast, clearShareToast, theme, activeTab } = useApp();
  const isLight = theme === 'light';

  return (
    <div className={`w-full h-screen h-[100dvh] ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#030712] text-white'
    } flex flex-row overflow-hidden select-none transition-colors duration-200`}>
      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed top-8 sm:top-5 left-1/2 -translate-x-1/2 z-50 animate-bounce max-w-sm px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400/50">
          <Share2 className="w-4 h-4 shrink-0 text-white" />
          <span className="flex-1">{shareToast}</span>
          <button onClick={clearShareToast} className="text-white/80 hover:text-white font-bold ml-1">
            ✕
          </button>
        </div>
      )}

      {/* Desktop Left Tab Navigation Sidebar (visible on md screens and up) */}
      <DesktopSidebar />

      {/* Main Content Area: Centered and Responsive for Mobile, Tablets, and Desktop */}
      <main className="flex-1 h-full flex justify-center items-center overflow-hidden relative">
        <div className={`relative w-full h-full flex flex-col overflow-hidden transition-all duration-200 ${
          activeTab === 'feed'
            ? 'w-full max-w-md md:max-w-[480px] lg:max-w-[500px] xl:max-w-[520px] h-full xl:h-[96vh] xl:my-auto xl:rounded-3xl xl:shadow-2xl xl:border xl:border-white/10'
            : 'w-full max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl h-full'
        } ${isLight && activeTab !== 'feed' ? 'bg-slate-50 text-slate-900' : 'bg-black text-white'}`}>
          {children}
        </div>
      </main>
    </div>
  );
};
