import React from 'react';
import { Share2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DeviceShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { shareToast, clearShareToast, theme, activeTab } = useApp();

  return (
    <div className={`w-full h-screen h-[100dvh] ${theme === 'light' ? 'bg-[#F1F5F9]' : 'bg-[#050608]'} flex justify-center overflow-hidden select-none transition-colors duration-200`}>
      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed top-8 sm:top-5 z-50 animate-bounce max-w-sm mx-auto px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400/50">
          <Share2 className="w-4 h-4 shrink-0 text-white" />
          <span className="flex-1">{shareToast}</span>
          <button onClick={clearShareToast} className="text-white/80 hover:text-white font-bold ml-1">
            ✕
          </button>
        </div>
      )}

      {/* Clean Full-Screen App Container */}
      <div className={`relative w-full max-w-md h-full flex flex-col ${theme === 'light' && activeTab !== 'feed' ? 'bg-slate-50 text-slate-900' : 'bg-black text-white'} overflow-hidden shadow-2xl transition-colors duration-200`}>
        {children}
      </div>
    </div>
  );
};
