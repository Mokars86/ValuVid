import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Wallet, 
  Sliders, 
  Bell, 
  Wifi, 
  Video, 
  HelpCircle, 
  Smartphone, 
  Lock, 
  Check, 
  ChevronRight, 
  Trash2, 
  Download, 
  Coins, 
  FileText, 
  Globe, 
  Sparkles, 
  AlertCircle,
  Eye,
  RefreshCw,
  X,
  Bot,
  UserCheck,
  Scale,
  LogIn,
  LogOut,
  Key,
  Camera,
  Sun,
  Moon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { sounds } from '../../utils/soundEffects';

interface AppSettings {
  twoFactorEnabled: boolean;
  defaultPayout: string;
  autoCashout: boolean;
  autoThreshold: number;
  default1TapTip: number;
  freshCreatorsFirst: boolean;
  localRadiusRatio: number;
  mutedWords: string[];
  restrictedMode: boolean;
  walletAlerts: boolean;
  engagementAlerts: boolean;
  bountyAlerts: boolean;
  dataSaver: boolean;
  autoplayCellular: boolean;
  allowDirectTips: boolean;
  defaultUnlockGHS: number;
}

const SETTINGS_KEY = 'valuvid_app_settings';

const defaultSettings: AppSettings = {
  twoFactorEnabled: true,
  defaultPayout: 'pm-1',
  autoCashout: true,
  autoThreshold: 100,
  default1TapTip: 5,
  freshCreatorsFirst: true,
  localRadiusRatio: 70,
  mutedWords: ['crypto-scam', 'politics', 'airdrop'],
  restrictedMode: false,
  walletAlerts: true,
  engagementAlerts: true,
  bountyAlerts: true,
  dataSaver: false,
  autoplayCellular: true,
  allowDirectTips: true,
  defaultUnlockGHS: 5.0,
};

const getStoredSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...defaultSettings, ...JSON.parse(raw) };
    }
  } catch {}
  return defaultSettings;
};

export const SettingsPage: React.FC = () => {
  const { 
    showSettings, 
    setShowSettings, 
    currentUser, 
    payoutMethods, 
    wallet,
    humanTouchRatio,
    setHumanTouchRatio,
    setAuthModalOpen,
    setAuthMode,
    authUser,
    logoutUser,
    updateUserProfile,
    setShareToast,
    theme,
    setTheme,
    toggleTheme
  } = useApp();

  const initialSettings = useRef(getStoredSettings()).current;

  // 1. Account & Security
  const [displayName, setDisplayName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(initialSettings.twoFactorEnabled);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync profile details when currentUser changes or settings open
  useEffect(() => {
    setDisplayName(currentUser.name);
    setUsername(currentUser.username);
    setBio(currentUser.bio);
    setAvatar(currentUser.avatar);
  }, [currentUser.name, currentUser.username, currentUser.bio, currentUser.avatar, showSettings, editProfileOpen]);

  const handleSettingsAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const minDim = Math.min(img.width, img.height);
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 300, 300);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          setAvatar(dataUrl);
          updateUserProfile({ avatar: dataUrl });
          sounds.playSuccessPayout();
          setShareToast('Profile picture updated!');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // 2. ValuWallet & Payouts
  const [defaultPayout, setDefaultPayout] = useState(initialSettings.defaultPayout || payoutMethods[0]?.id || 'pm-1');
  const [autoCashout, setAutoCashout] = useState(initialSettings.autoCashout);
  const [autoThreshold, setAutoThreshold] = useState(initialSettings.autoThreshold);
  const [default1TapTip, setDefault1TapTip] = useState(initialSettings.default1TapTip);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // 3. Content Preferences & Algorithmic Controls
  const [freshCreatorsFirst, setFreshCreatorsFirst] = useState(initialSettings.freshCreatorsFirst);
  const [localRadiusRatio, setLocalRadiusRatio] = useState(initialSettings.localRadiusRatio);
  const [mutedWords, setMutedWords] = useState<string[]>(initialSettings.mutedWords);
  const [newMutedWord, setNewMutedWord] = useState('');
  const [restrictedMode, setRestrictedMode] = useState(initialSettings.restrictedMode);

  // 4. Notifications
  const [walletAlerts, setWalletAlerts] = useState(initialSettings.walletAlerts);
  const [engagementAlerts, setEngagementAlerts] = useState(initialSettings.engagementAlerts);
  const [bountyAlerts, setBountyAlerts] = useState(initialSettings.bountyAlerts);

  // 5. Video Playback & Data Usage
  const [dataSaver, setDataSaver] = useState(initialSettings.dataSaver);
  const [autoplayCellular, setAutoplayCellular] = useState(initialSettings.autoplayCellular);
  const [cacheSizeMB, setCacheSizeMB] = useState(148.5);
  const [cacheCleared, setCacheCleared] = useState(false);

  // 6. Creator Tools & Permissions
  const [allowDirectTips, setAllowDirectTips] = useState(initialSettings.allowDirectTips);
  const [defaultUnlockGHS, setDefaultUnlockGHS] = useState(initialSettings.defaultUnlockGHS);
  const [kycVerified] = useState(true);

  // Automatically save all settings to persistent localStorage whenever any setting is changed
  useEffect(() => {
    const settingsData: AppSettings = {
      twoFactorEnabled,
      defaultPayout,
      autoCashout,
      autoThreshold,
      default1TapTip,
      freshCreatorsFirst,
      localRadiusRatio,
      mutedWords,
      restrictedMode,
      walletAlerts,
      engagementAlerts,
      bountyAlerts,
      dataSaver,
      autoplayCellular,
      allowDirectTips,
      defaultUnlockGHS,
    };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsData));
    } catch {}
  }, [
    twoFactorEnabled,
    defaultPayout,
    autoCashout,
    autoThreshold,
    default1TapTip,
    freshCreatorsFirst,
    localRadiusRatio,
    mutedWords,
    restrictedMode,
    walletAlerts,
    engagementAlerts,
    bountyAlerts,
    dataSaver,
    autoplayCellular,
    allowDirectTips,
    defaultUnlockGHS,
  ]);

  // 7. Support & Modals
  const [activeSupportModal, setActiveSupportModal] = useState<'faq' | 'report' | 'legal' | null>(null);

  if (!showSettings) return null;

  const handleClearCache = () => {
    sounds.playLikePop();
    setCacheSizeMB(0.0);
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  };

  const handleDownloadStatement = () => {
    sounds.playCoinTip();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handleAddMutedWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMutedWord.trim()) return;
    if (!mutedWords.includes(newMutedWord.trim().toLowerCase())) {
      setMutedWords([...mutedWords, newMutedWord.trim().toLowerCase()]);
    }
    setNewMutedWord('');
  };

  const handleRemoveMutedWord = (word: string) => {
    setMutedWords(mutedWords.filter((w) => w !== word));
  };

  return (
    <div className={`fixed inset-0 z-50 ${theme === 'light' ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#050B14] text-white'} flex flex-col overflow-y-auto select-none animate-fade-in pb-16 transition-colors duration-200`}>
      {/* STICKY TOP NAV */}
      <div className={`sticky top-0 z-30 ${theme === 'light' ? 'bg-white/95 border-slate-200' : 'bg-[#070E1B]/95 border-neutral-800'} backdrop-blur-md px-4 pt-8 sm:pt-4 pb-3 border-b flex items-center justify-between transition-colors`}>
        <button
          onClick={() => setShowSettings(false)}
          className={`flex items-center gap-2 text-xs font-bold ${theme === 'light' ? 'text-slate-700 hover:text-slate-900' : 'text-neutral-300 hover:text-white'} transition-colors`}
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>Settings & Privacy</span>
        </button>

        <span className="text-[10px] bg-[#00B2FE]/15 text-cyan-500 border border-[#00B2FE]/30 px-2 py-0.5 rounded-full font-bold">
          Android v2.4
        </span>
      </div>

      <div className="px-4 py-4 flex flex-col gap-6 max-w-md mx-auto w-full">
        {/* 1. THEME & APPEARANCE (DAY MODE DEFAULT) */}
        <section className={`${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#070E1B] border-neutral-800 shadow-lg'} border rounded-3xl p-4 flex flex-col gap-3 transition-colors`}>
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800/40">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider">
                1. Theme & Appearance
              </h2>
            </div>
            <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              {theme === 'light' ? 'Day Mode Active ☀️' : 'Dark Mode Active 🌙'}
            </span>
          </div>

          <p className="text-[11px] text-neutral-400">
            Choose your preferred display aesthetic. Day Mode is active by default.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Day Mode Card */}
            <button
              type="button"
              onClick={() => {
                sounds.playLikePop();
                setTheme('light');
                setShareToast('Switched to Day Mode ☀️');
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                theme === 'light'
                  ? 'bg-amber-500/15 border-amber-400 text-slate-900 shadow-md ring-2 ring-amber-400/30'
                  : 'bg-black/30 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Sun className="w-4 h-4 text-amber-500 fill-amber-500/30" />
                </div>
                {theme === 'light' && <Check className="w-4 h-4 text-amber-600 stroke-[3]" />}
              </div>
              <div>
                <span className={`text-xs font-bold block ${theme === 'light' ? 'text-slate-900 font-black' : 'text-neutral-200'}`}>
                  Day Mode ☀️
                </span>
                <span className="text-[10px] text-neutral-500 leading-tight block mt-0.5">
                  Clean crisp light mode (Default)
                </span>
              </div>
            </button>

            {/* Dark Mode Card */}
            <button
              type="button"
              onClick={() => {
                sounds.playLikePop();
                setTheme('dark');
                setShareToast('Switched to Dark Mode 🌙');
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-2 ${
                theme === 'dark'
                  ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-md ring-2 ring-cyan-400/30'
                  : 'bg-black/30 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Moon className="w-4 h-4 text-cyan-400 fill-cyan-400/30" />
                </div>
                {theme === 'dark' && <Check className="w-4 h-4 text-cyan-400 stroke-[3]" />}
              </div>
              <div>
                <span className={`text-xs font-bold block ${theme === 'dark' ? 'text-white font-black' : 'text-neutral-200'}`}>
                  Dark Mode 🌙
                </span>
                <span className="text-[10px] text-neutral-500 leading-tight block mt-0.5">
                  Cinematic obsidian dark mode
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* 2. ACCOUNT & SECURITY */}
        <section className={`${theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#070E1B] border-neutral-800 shadow-lg'} border rounded-3xl p-4 flex flex-col gap-3 transition-colors`}>
          <div className={`flex items-center gap-2 pb-2 border-b ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
            <Lock className="w-4 h-4 text-cyan-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              2. Account & Security
            </h2>
          </div>

          {/* User Preview & Edit */}
          <div className={`flex items-center justify-between ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-neutral-800'} p-3 rounded-2xl border`}>
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-[#00B2FE]/40"
              />
              <div>
                <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} flex items-center gap-1`}>
                  <span>{displayName}</span>
                  <span className="text-[9px] bg-amber-500 text-black font-black px-1 rounded-full">✓</span>
                </div>
                <div className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>@{username}</div>
                <div className="text-[9px] text-emerald-500 font-medium mt-0.5">
                  MoMo KYC ID Verified
                </div>
              </div>
            </div>

            <button
              onClick={() => setEditProfileOpen(true)}
              className={`text-xs font-bold ${
                theme === 'light'
                  ? 'text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border-cyan-200'
                  : 'text-cyan-400 bg-[#00B2FE]/10 hover:bg-[#00B2FE]/20 border-[#00B2FE]/30'
              } px-2.5 py-1 rounded-xl border transition-colors`}
            >
              Edit
            </button>
          </div>

          {/* Phone & Email */}
          <div className="flex flex-col gap-2 pt-1 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className={theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}>Verified Phone (MoMo):</span>
              <span className={`font-mono font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>+233 24 981 7261</span>
            </div>
            <div className={`flex items-center justify-between py-1 border-t ${theme === 'light' ? 'border-slate-100' : 'border-neutral-900'}`}>
              <span className={theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}>Active Account Email:</span>
              <span className={`font-medium ${theme === 'light' ? 'text-cyan-700' : 'text-cyan-300'} font-mono`}>
                {currentUser.email || authUser?.email || 'emmanuel@valuvid.app (Demo Mode)'}
              </span>
            </div>
          </div>

          {/* Auth Action Buttons */}
          <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
            <button
              type="button"
              onClick={() => {
                sounds.playLikePop();
                setAuthMode('signin');
                setAuthModalOpen(true);
              }}
              className={`py-2 px-3 rounded-xl ${
                theme === 'light'
                  ? 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200 text-cyan-800'
                  : 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/40 text-cyan-300'
              } border font-bold text-xs flex items-center justify-center gap-1.5 transition-colors`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{authUser ? 'Switch Account' : 'Sign In / Register'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                logoutUser();
              }}
              className={`py-2 px-3 rounded-xl ${
                theme === 'light'
                  ? 'bg-slate-100 hover:bg-rose-50 border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-700'
                  : 'bg-neutral-800/80 hover:bg-red-500/20 border-neutral-700/80 hover:border-red-500/40 text-neutral-300 hover:text-red-300'
              } border font-bold text-xs flex items-center justify-center gap-1.5 transition-colors`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>

          {/* Two-Factor Authentication */}
          <div className={`flex items-center justify-between pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
            <div>
              <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} flex items-center gap-1.5`}>
                <span>Two-Factor Authentication (2FA)</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-500 px-1.5 py-0.2 rounded font-bold">
                  Active
                </span>
              </div>
              <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                SMS OTP verification required for withdrawals over GHS 50.
              </p>
            </div>
            <input
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={(e) => setTwoFactorEnabled(e.target.checked)}
              className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
            />
          </div>

          {/* Active Devices & Sessions */}
          <div className={`flex items-center justify-between pt-2 border-t ${theme === 'light' ? 'border-slate-200 text-slate-500' : 'border-neutral-800 text-neutral-400'} text-[11px]`}>
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-cyan-500" />
              <span>Samsung Galaxy S24 Ultra (Accra, GH)</span>
            </div>
            <span className="text-emerald-500 font-bold text-[10px]">Active Now</span>
          </div>
        </section>

        {/* 3. VALUWALLET & PAYOUT SETTINGS */}
        <section className={`${theme === 'light' ? 'bg-white border-slate-200 shadow-sm text-slate-900' : 'bg-[#070E1B] border-neutral-800 shadow-lg text-white'} border rounded-3xl p-4 flex flex-col gap-3 transition-colors`}>
          <div className={`flex items-center gap-2 pb-2 border-b ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
            <Wallet className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              3. ValuWallet & Payout Settings
            </h2>
          </div>

          {/* Default Payout Channel */}
          <div>
            <label className={`text-[11px] font-bold ${theme === 'light' ? 'text-slate-700' : 'text-neutral-300'} uppercase tracking-wider block mb-1.5`}>
              Default Off-Ramp / Payout Channel
            </label>
            <div className="flex flex-col gap-2">
              {payoutMethods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setDefaultPayout(m.id)}
                  className={`p-2.5 rounded-2xl flex items-center justify-between text-left transition-all text-xs ${
                    defaultPayout === m.id
                      ? (theme === 'light' ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold border' : 'bg-amber-500/20 border border-amber-400 text-white font-bold')
                      : (theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700 border' : 'bg-black/40 border border-neutral-800 text-neutral-300')
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="text-xs font-bold">{m.name}</div>
                      <div className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'} font-mono`}>{m.accountNumber}</div>
                    </div>
                  </div>
                  {defaultPayout === m.id && <Check className="w-4 h-4 text-amber-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-Cashout Threshold */}
          <div className={`flex flex-col gap-2 pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Auto-Cashout to MoMo</div>
                <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Automatically withdraws to MTN MoMo when wallet reaches threshold.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoCashout}
                onChange={(e) => setAutoCashout(e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            {autoCashout && (
              <div className={`flex items-center justify-between ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-neutral-800'} p-2.5 rounded-xl border text-xs`}>
                <span className={theme === 'light' ? 'text-slate-600' : 'text-neutral-400'}>Trigger Threshold:</span>
                <div className="flex items-center gap-1 font-bold text-amber-500">
                  <span>GHS</span>
                  <input
                    type="number"
                    min="20"
                    step="10"
                    value={autoThreshold}
                    onChange={(e) => setAutoThreshold(parseInt(e.target.value) || 100)}
                    className={`w-16 ${
                      theme === 'light' ? 'bg-white border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-700 text-white'
                    } border text-right px-2 py-0.5 rounded text-xs font-bold focus:outline-none focus:border-amber-500`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Default 1-Tap Tipping Amount */}
          <div className={`pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
            <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} mb-1.5`}>
              Default 1-Tap Tipping Preference
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[2, 5, 10, 20].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDefault1TapTip(amt)}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                    default1TapTip === amt
                      ? (theme === 'light' ? 'bg-amber-500 text-white font-black shadow-sm' : 'bg-amber-500 text-black shadow-md shadow-amber-500/20')
                      : (theme === 'light' ? 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100' : 'bg-black/40 text-neutral-300 border border-neutral-800')
                  }`}
                >
                  GHS {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction Invoices / Statement */}
          <button
            onClick={handleDownloadStatement}
            className={`mt-1 py-2.5 px-3 rounded-xl ${
              theme === 'light'
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
                : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300 hover:text-white'
            } border text-xs font-bold flex items-center justify-between transition-colors`}
          >
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-500" />
              <span>Download Monthly Earnings Statement</span>
            </div>
            {downloadSuccess ? (
              <span className="text-emerald-500 text-[10px]">Downloaded!</span>
            ) : (
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            )}
          </button>
        </section>

        {/* 4. CONTENT PREFERENCES & ALGORITHMIC CONTROLS */}
        <section className={`${theme === 'light' ? 'bg-white border-slate-200 shadow-sm text-slate-900' : 'bg-[#070E1B] border-neutral-800 shadow-lg text-white'} border rounded-3xl p-4 flex flex-col gap-3 transition-colors`}>
          <div className={`flex items-center gap-2 pb-2 border-b ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
            <Sliders className="w-4 h-4 text-cyan-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              4. Content & Algorithm Controls
            </h2>
          </div>

          {/* Fresh Creators First */}
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Fresh Creators First</div>
              <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                Boosts discoverability for emerging Ghanaian creators under 1,000 followers.
              </p>
            </div>
            <input
              type="checkbox"
              checked={freshCreatorsFirst}
              onChange={(e) => setFreshCreatorsFirst(e.target.checked)}
              className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          {/* PILLAR 3: THE "HUMAN TOUCH" AUTHENTICITY SLIDER */}
          <div className={`pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} flex items-center gap-1.5`}>
                <UserCheck className="w-4 h-4 text-emerald-500" />
                "Show Me Real People" Authenticity Slider
              </span>
              <span className="font-bold text-emerald-500 text-[11px]">
                {humanTouchRatio >= 95 
                  ? '100% Real People Only' 
                  : humanTouchRatio >= 70 
                  ? '85% Real Storytellers' 
                  : humanTouchRatio >= 40 
                  ? 'Balanced Human + AI' 
                  : 'All Content (Include AI)'}
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={humanTouchRatio}
              onChange={(e) => setHumanTouchRatio(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className={`flex justify-between text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-500'} mt-0.5`}>
              <span>Include AI Experiments</span>
              <span className="text-emerald-500 font-semibold">100% Real Humans Only</span>
            </div>
            <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'} mt-1 leading-normal`}>
              Filters or reduces AI-generated and synthetic deepfake videos from your feed, protecting your watch-reward payouts for authentic human creators.
            </p>
          </div>

          {/* Local Radius vs Global Slider */}
          <div className={`pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Regional vs. Global Content Ratio</span>
              <span className="font-bold text-cyan-500">{localRadiusRatio}% Regional</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={localRadiusRatio}
              onChange={(e) => setLocalRadiusRatio(parseInt(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className={`flex justify-between text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-500'} mt-0.5`}>
              <span>More Global</span>
              <span>100% Local (Ghana)</span>
            </div>
          </div>

          {/* Muted Words & Hashtags */}
          <div className={`pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
            <label className={`text-[11px] font-bold ${theme === 'light' ? 'text-slate-700' : 'text-neutral-300'} block mb-1`}>
              Muted Words & Hashtags
            </label>
            <form onSubmit={handleAddMutedWord} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="e.g. spoilers, spam..."
                value={newMutedWord}
                onChange={(e) => setNewMutedWord(e.target.value)}
                className={`flex-1 ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-500' : 'bg-black/40 border-neutral-800 text-white focus:border-cyan-400'
                } border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none`}
              />
              <button
                type="submit"
                className={`px-3 py-1.5 ${
                  theme === 'light' ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                } text-xs font-bold rounded-xl transition-colors`}
              >
                Add
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5">
              {mutedWords.map((word) => (
                <span
                  key={word}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 ${
                    theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-black/60 border-neutral-800 text-neutral-300'
                  } border text-[10px] rounded-full`}
                >
                  <span>#{word}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMutedWord(word)}
                    className="text-neutral-400 hover:text-rose-500 font-bold ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Restricted Mode */}
          <div className={`flex items-center justify-between pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
            <div>
              <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Restricted Mode</div>
              <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                Filters out mature content and age-restricted video tutorials.
              </p>
            </div>
            <input
              type="checkbox"
              checked={restrictedMode}
              onChange={(e) => setRestrictedMode(e.target.checked)}
              className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
            />
          </div>
        </section>

        {/* 5. NOTIFICATIONS */}
        <section className={`${theme === 'light' ? 'bg-white border-slate-200 shadow-sm text-slate-900' : 'bg-[#070E1B] border-neutral-800 shadow-lg text-white'} border rounded-3xl p-4 flex flex-col gap-3 transition-colors`}>
          <div className={`flex items-center gap-2 pb-2 border-b ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
            <Bell className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              5. Notification Preferences
            </h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Wallet & Revenue Push Alerts</div>
              <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                Instant pings on creator tips received, watch rewards, and completed cashouts.
              </p>
            </div>
            <input
              type="checkbox"
              checked={walletAlerts}
              onChange={(e) => setWalletAlerts(e.target.checked)}
              className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          <div className={`flex items-center justify-between pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
            <div>
              <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Engagement Alerts</div>
              <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Likes, comments, shares, and new followers.</p>
            </div>
            <input
              type="checkbox"
              checked={engagementAlerts}
              onChange={(e) => setEngagementAlerts(e.target.checked)}
              className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          <div className={`flex items-center justify-between pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
            <div>
              <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Micro-Bounty Alerts</div>
              <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                Immediate notification when local brands launch new sponsored challenges.
              </p>
            </div>
            <input
              type="checkbox"
              checked={bountyAlerts}
              onChange={(e) => setBountyAlerts(e.target.checked)}
              className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
            />
          </div>
        </section>

        {/* 6. VIDEO PLAYBACK & DATA SAVER */}
        <section className={`${theme === 'light' ? 'bg-white border-slate-200 shadow-sm text-slate-900' : 'bg-[#070E1B] border-neutral-800 shadow-lg text-white'} border rounded-3xl p-4 flex flex-col gap-3 transition-colors`}>
          <div className={`flex items-center gap-2 pb-2 border-b ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
            <Wifi className="w-4 h-4 text-cyan-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              6. Video Playback & Data Usage
            </h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Data Saver Mode</div>
              <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                Reduces streaming bitrate and stops video pre-fetching on mobile networks.
              </p>
            </div>
            <input
              type="checkbox"
              checked={dataSaver}
              onChange={(e) => setDataSaver(e.target.checked)}
              className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
            />
          </div>

          <div className={`flex items-center justify-between pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
            <div>
              <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Autoplay on Cellular</div>
              <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Load vertical videos automatically over mobile data.</p>
            </div>
            <input
              type="checkbox"
              checked={autoplayCellular}
              onChange={(e) => setAutoplayCellular(e.target.checked)}
              className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
            />
          </div>

          {/* Cache Manager */}
          <div className={`flex items-center justify-between pt-2 border-t ${theme === 'light' ? 'border-slate-200 bg-slate-50' : 'border-neutral-800 bg-black/40'} p-3 rounded-2xl border`}>
            <div>
              <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Local Video Cache Storage</div>
              <div className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'} font-mono`}>
                {cacheSizeMB > 0 ? `${cacheSizeMB.toFixed(1)} MB stored` : 'Storage Clean!'}
              </div>
            </div>

            <button
              onClick={handleClearCache}
              disabled={cacheSizeMB === 0}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                cacheCleared
                  ? 'bg-emerald-500 text-white'
                  : theme === 'light'
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
              }`}
            >
              {cacheCleared ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Cleared!</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Clear Cache</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* 7. CREATOR TOOLS & PERMISSIONS */}
        <section className={`${theme === 'light' ? 'bg-white border-slate-200 shadow-sm text-slate-900' : 'bg-[#070E1B] border-neutral-800 shadow-lg text-white'} border rounded-3xl p-4 flex flex-col gap-3 transition-colors`}>
          <div className={`flex items-center gap-2 pb-2 border-b ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
            <Video className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              7. Creator Tools & Monetization
            </h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Direct Micro-Tipping</div>
              <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
                Allow viewers to tip Cedis directly from the feed action sidebar.
              </p>
            </div>
            <input
              type="checkbox"
              checked={allowDirectTips}
              onChange={(e) => setAllowDirectTips(e.target.checked)}
              className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
            />
          </div>

          {/* Pay-Per-Unlock Default Tier */}
          <div className={`flex items-center justify-between pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
            <div>
              <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Default Pay-Per-Unlock Fee</div>
              <p className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>Suggested price for premium gated masterclasses.</p>
            </div>
            <div className="flex items-center gap-1 font-bold text-amber-500">
              <span className="text-xs">GHS</span>
              <input
                type="number"
                min="1"
                step="0.5"
                value={defaultUnlockGHS}
                onChange={(e) => setDefaultUnlockGHS(parseFloat(e.target.value) || 5)}
                className={`w-14 ${
                  theme === 'light' ? 'bg-white border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-700 text-white'
                } border text-right px-2 py-0.5 rounded text-xs font-bold focus:outline-none focus:border-amber-500`}
              />
            </div>
          </div>

          {/* KYC ID Status Card & Human Verification Bonus */}
          <div className={`flex flex-col gap-2 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-neutral-800'} p-3 rounded-2xl border mt-1`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <div>
                  <div className={`text-xs font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} flex items-center gap-1.5`}>
                    <span>Ghana Card Verified</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-600 font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                      Level 2
                    </span>
                  </div>
                  <div className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'} font-mono`}>ID: GHA-729104821-4</div>
                </div>
              </div>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-600 font-bold px-2 py-0.5 rounded-full border border-emerald-500/40">
                GHS 10,000/day Limit
              </span>
            </div>

            {/* Pillar 2 Human Verification Bonus */}
            <div className={`pt-2 border-t ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800/80'} flex items-center justify-between text-[10px]`}>
              <div className={`flex items-center gap-1.5 ${theme === 'light' ? 'text-slate-600' : 'text-neutral-300'}`}>
                <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Verified Authenticity Badge (100% Payout Bonus)</span>
              </div>
              <span className="text-emerald-500 font-mono font-bold">100% Human</span>
            </div>
          </div>
        </section>

        {/* 8. SUPPORT, LEGAL & ABOUT */}
        <section className={`${theme === 'light' ? 'bg-white border-slate-200 shadow-sm text-slate-900' : 'bg-[#070E1B] border-neutral-800 shadow-lg text-white'} border rounded-3xl p-4 flex flex-col gap-2 transition-colors`}>
          <div className={`flex items-center gap-2 pb-2 border-b ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
            <HelpCircle className="w-4 h-4 text-cyan-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider">
              8. Support, Legal & About
            </h2>
          </div>

          <button
            onClick={() => setActiveSupportModal('faq')}
            className={`flex items-center justify-between py-2 text-xs ${theme === 'light' ? 'text-slate-700 hover:text-slate-900' : 'text-neutral-300 hover:text-white'} transition-colors`}
          >
            <span>Help Center & Monetization FAQs</span>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </button>

          <button
            onClick={() => setActiveSupportModal('report')}
            className={`flex items-center justify-between py-2 text-xs ${
              theme === 'light' ? 'text-slate-700 hover:text-slate-900 border-slate-100' : 'text-neutral-300 hover:text-white border-neutral-900'
            } transition-colors border-t`}
          >
            <span>Report a Technical Problem or Disputed Tip</span>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </button>

          <button
            onClick={() => setActiveSupportModal('legal')}
            className={`flex items-center justify-between py-2 text-xs ${
              theme === 'light' ? 'text-slate-700 hover:text-slate-900 border-slate-100' : 'text-neutral-300 hover:text-white border-neutral-900'
            } transition-colors border-t`}
          >
            <span>Terms of Service & MoMo Escrow Policy</span>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </button>

          <div className={`pt-3 border-t ${theme === 'light' ? 'border-slate-200 text-slate-500' : 'border-neutral-800 text-neutral-500'} flex items-center justify-between text-[11px]`}>
            <span>ValuVid Android Architecture</span>
            <span className="font-mono font-semibold text-cyan-500">v2.4.0 (Build 2026.10)</span>
          </div>
        </section>

        {/* Close Button */}
        <button
          onClick={() => setShowSettings(false)}
          className={`w-full py-3.5 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all ${
            theme === 'light' ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20' : 'bg-white hover:bg-neutral-100 text-black shadow-white/20'
          }`}
        >
          Save & Return to Profile
        </button>
      </div>

      {/* EDIT PROFILE MODAL */}
      {editProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
          <div className={`w-full max-w-sm ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#070E1B] border-neutral-800 text-white'
          } border rounded-3xl p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto shadow-2xl`}>
            <div className={`flex items-center justify-between pb-2 border-b ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
              <h3 className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Edit Profile Details</h3>
              <button onClick={() => setEditProfileOpen(false)} className={`${theme === 'light' ? 'text-slate-400 hover:text-slate-700' : 'text-neutral-400 hover:text-white'}`}>✕</button>
            </div>
            {/* Avatar upload in settings */}
            <div className={`flex flex-col items-center gap-2 py-1 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-neutral-800'} p-3 rounded-2xl border`}>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-[#00B2FE] to-[#FF9F0A] cursor-pointer group shadow-sm"
                title="Change profile picture"
              >
                <img
                  src={avatar || currentUser.avatar}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSettingsAvatarChange}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`text-[11px] font-bold ${
                    theme === 'light' ? 'text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border-cyan-200' : 'text-cyan-400 bg-[#00B2FE]/10 hover:bg-[#00B2FE]/20 border-[#00B2FE]/30'
                  } px-3 py-1 rounded-full border transition-colors`}
                >
                  Upload Photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvatar('/default-avatar.jpg');
                    updateUserProfile({ avatar: '/default-avatar.jpg' });
                    setShareToast('Reset to default ValuVid logo');
                  }}
                  className={`text-[11px] font-medium ${
                    theme === 'light' ? 'text-slate-600 hover:text-slate-900 bg-slate-100 border-slate-200' : 'text-neutral-400 hover:text-white bg-neutral-900 border-neutral-800'
                  } px-2.5 py-1 rounded-full border transition-colors`}
                >
                  Use Logo
                </button>
              </div>
            </div>

            <div>
              <label className={`text-[11px] font-bold ${theme === 'light' ? 'text-slate-700' : 'text-neutral-400'} block mb-1`}>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={`w-full ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500' : 'bg-[#0A1628] border-neutral-800 text-white focus:border-cyan-400'
                } border rounded-xl px-3 py-2 text-xs focus:outline-none`}
              />
            </div>
            <div>
              <label className={`text-[11px] font-bold ${theme === 'light' ? 'text-slate-700' : 'text-neutral-400'} block mb-1`}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500' : 'bg-[#0A1628] border-neutral-800 text-white focus:border-cyan-400'
                } border rounded-xl px-3 py-2 text-xs focus:outline-none`}
              />
            </div>
            <div>
              <label className={`text-[11px] font-bold ${theme === 'light' ? 'text-slate-700' : 'text-neutral-400'} block mb-1`}>Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={`w-full ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500' : 'bg-[#0A1628] border-neutral-800 text-white focus:border-cyan-400'
                } border rounded-xl px-3 py-2 text-xs focus:outline-none resize-none`}
              />
            </div>
            <button
              onClick={() => {
                sounds.playLikePop();
                updateUserProfile({
                  name: displayName.trim(),
                  username: username.trim().replace(/^@/, '').toLowerCase(),
                  bio: bio.trim(),
                  avatar: avatar || currentUser.avatar,
                });
                setShareToast('Profile updated! ✨');
                setEditProfileOpen(false);
              }}
              className={`w-full py-3 rounded-xl font-bold text-xs shadow-md active:scale-95 transition-all ${
                theme === 'light' ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-white hover:bg-neutral-100 text-black'
              }`}
            >
              Save Profile Changes
            </button>
          </div>
        </div>
      )}

      {/* SUPPORT & LEGAL MODALS */}
      {activeSupportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none">
          <div className={`w-full max-w-sm ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#070E1B] border-neutral-800 text-white'
          } border rounded-3xl p-5 flex flex-col gap-3 max-h-[85vh] overflow-y-auto shadow-2xl`}>
            <div className={`flex items-center justify-between pb-2 border-b ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800'}`}>
              <h3 className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {activeSupportModal === 'faq' ? 'Help Center & FAQs' : activeSupportModal === 'report' ? 'Report a Problem' : 'Terms & Escrow Policy'}
              </h3>
              <button onClick={() => setActiveSupportModal(null)} className={`${theme === 'light' ? 'text-slate-400 hover:text-slate-700' : 'text-neutral-400 hover:text-white'}`}>✕</button>
            </div>

            {activeSupportModal === 'faq' && (
              <div className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-neutral-300'} flex flex-col gap-3 leading-relaxed`}>
                <div>
                  <h4 className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} mb-0.5`}>How does MoMo cashout work?</h4>
                  <p>When you initiate a withdrawal, funds transfer directly to your registered MTN MoMo or Telecel Cash number via automated banking rails in under 5 seconds.</p>
                </div>
                <div>
                  <h4 className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} mb-0.5`}>Who pays for watch-time rewards?</h4>
                  <p>Watch rewards are supported by the community attention pool and verified brand bounty listings.</p>
                </div>
                <div>
                  <h4 className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} mb-0.5`}>What is the creator platform fee?</h4>
                  <p>Creators take home 92% of all tips and content unlocks, while 8% covers network processing and escrow maintenance.</p>
                </div>
              </div>
            )}

            {activeSupportModal === 'report' && (
              <div className="flex flex-col gap-3 text-xs">
                <p className={theme === 'light' ? 'text-slate-600' : 'text-neutral-300'}>Submit a bug report or flag a transaction:</p>
                <input
                  type="text"
                  placeholder="Transaction Reference or Issue Topic"
                  className={`w-full ${
                    theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-[#0A1628] border-neutral-800 text-white'
                  } border rounded-xl p-2.5 text-xs focus:outline-none`}
                />
                <textarea
                  rows={4}
                  placeholder="Describe what happened..."
                  className={`w-full ${
                    theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-[#0A1628] border-neutral-800 text-white'
                  } border rounded-xl p-2.5 text-xs resize-none focus:outline-none`}
                />
                <button
                  onClick={() => {
                    sounds.playSuccessPayout();
                    alert('Report received. ValuVid security will review within 2 hours.');
                    setActiveSupportModal(null);
                  }}
                  className={`py-2.5 ${
                    theme === 'light' ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'bg-cyan-500 text-black font-bold'
                  } font-bold rounded-xl text-xs transition-colors`}
                >
                  Submit Report
                </button>
              </div>
            )}

            {activeSupportModal === 'legal' && (
              <div className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-neutral-300'} leading-relaxed flex flex-col gap-2`}>
                <p>ValuVid operates as a creator economy platform compliant with Ghanaian FinTech and National Payment Systems regulations.</p>
                <p>User wallet balances are stored in segregated escrow accounts backed 1:1 by Ghanaian Cedi reserves with licensed Mobile Money operators.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
