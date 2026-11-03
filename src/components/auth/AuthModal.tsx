import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  AtSign, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  ArrowRight, 
  X,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { sounds } from '../../utils/soundEffects';

export const AuthModal: React.FC = () => {
  const { 
    theme,
    authModalOpen, 
    setAuthModalOpen, 
    authMode, 
    setAuthMode, 
    loginUser, 
    signupUser, 
    isSupabaseConnected
  } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+233');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [activeTabPhoneNotice, setActiveTabPhoneNotice] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (authMode === 'signup') {
        if (!name.trim()) {
          setErrorMsg('Please enter your full creator name.');
          setLoading(false);
          return;
        }

        const cleanPhoneDigits = phone.replace(/[^\d]/g, '');
        if (!cleanPhoneDigits || cleanPhoneDigits.length < 9) {
          setErrorMsg('Please enter a valid mobile phone number (MTN MoMo, Telecel Cash, or AirtelTigo).');
          setLoading(false);
          return;
        }

        const normalizedPhone = `${countryCode}${phone.replace(/^0/, '').trim()}`;

        const res = await signupUser(email, password, name, username, normalizedPhone);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create account.');
        } else if (res.requiresEmailConfirmation) {
          setInfoMsg('Account registered! If email confirmation is required, please check your inbox (or sign in).');
        }
      } else {
        const res = await loginUser(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Invalid email or password.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchMode = (mode: 'signin' | 'signup') => {
    sounds.playLikePop();
    setAuthMode(mode);
    setErrorMsg(null);
    setInfoMsg(null);
  };

  const handleClose = () => {
    sounds.playLikePop();
    setAuthModalOpen(false);
    setErrorMsg(null);
    setInfoMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className={`w-full max-w-sm max-h-[92dvh] ${
        theme === 'light'
          ? 'bg-white text-slate-900 border-slate-200 shadow-2xl'
          : 'bg-[#070E1B] text-white border-cyan-500/30 shadow-2xl'
      } border rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col gap-2.5 sm:gap-3 relative my-auto overflow-hidden transition-colors`}>
        
        {/* Glow ambient background accents */}
        <div className={`absolute -top-16 -right-16 w-36 h-36 ${theme === 'light' ? 'bg-cyan-500/10' : 'bg-cyan-500/15'} rounded-full blur-3xl pointer-events-none`} />
        <div className={`absolute -bottom-16 -left-16 w-36 h-36 ${theme === 'light' ? 'bg-amber-500/10' : 'bg-amber-500/15'} rounded-full blur-3xl pointer-events-none`} />

        {/* Top Header - Fixed at top */}
        <div className={`flex items-center justify-between pb-2 border-b ${theme === 'light' ? 'border-slate-200' : 'border-neutral-800/80'} shrink-0`}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-amber-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-950 fill-neutral-950" />
            </div>
            <div>
              <h2 className={`text-xs sm:text-sm font-black tracking-wide ${
                theme === 'light' ? 'text-slate-900' : 'bg-gradient-to-r from-white via-cyan-200 to-amber-200 bg-clip-text text-transparent'
              }`}>
                ValuVid ID
              </h2>
              <p className={`text-[9px] sm:text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'} flex items-center gap-1`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-cyan-500'}`} />
                {isSupabaseConnected ? 'Secure Cloud Sync' : 'ValuVid Authentication'}
              </p>
            </div>
          </div>

          <button 
            onClick={handleClose}
            aria-label="Close"
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                : 'bg-neutral-800/60 hover:bg-neutral-800 text-neutral-400 hover:text-white'
            } flex items-center justify-center transition-colors`}
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Segmented Auth Mode Switcher */}
        <div className={`grid grid-cols-2 p-1 ${theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-[#0A1628] border-neutral-800'} rounded-xl sm:rounded-2xl border shrink-0`}>
          <button
            type="button"
            onClick={() => handleSwitchMode('signin')}
            className={`py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all ${
              authMode === 'signin'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                : theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('signup')}
            className={`py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition-all ${
              authMode === 'signup'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-md'
                : theme === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Scrollable Form Body for Small Screens (iPhone SE 320/375px) */}
        <div className="overflow-y-auto flex-1 pr-0.5 space-y-2.5 sm:space-y-3" style={{ scrollbarWidth: 'thin' }}>
          
          {/* Anti-Duplicate 1-User 1-Account Shield Banner */}
          <div className={`${
            theme === 'light'
              ? 'bg-cyan-50/80 border-cyan-200 text-slate-700 shadow-xs'
              : 'bg-gradient-to-r from-blue-950/60 via-[#071325] to-amber-950/30 border-cyan-500/30'
          } border rounded-xl p-2 sm:p-2.5 flex items-start justify-between gap-2 text-left shadow-sm`}>
            <div className="flex items-start gap-1.5 sm:gap-2">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-[10px] sm:text-[11px] leading-tight">
                <span className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} flex items-center gap-1`}>
                  Strict 1 User = 1 Account Policy
                </span>
                <p className={`${theme === 'light' ? 'text-slate-600' : 'text-neutral-400'} mt-0.5 text-[9px] sm:text-[10px] leading-snug`}>
                  Bound to your Mobile Money number and device token to eliminate duplicate accounts & protect reward liquidity.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTabPhoneNotice(!activeTabPhoneNotice)}
              className={`text-[9px] sm:text-[10px] ${theme === 'light' ? 'text-cyan-700 hover:text-cyan-900' : 'text-cyan-400 hover:text-cyan-300'} underline font-semibold shrink-0`}
            >
              {activeTabPhoneNotice ? 'Hide' : 'Policy'}
            </button>
          </div>

          {activeTabPhoneNotice && (
            <div className={`${
              theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-[#050B14] border-neutral-800 text-neutral-300'
            } p-2.5 rounded-xl border text-[9px] sm:text-[10px] flex flex-col gap-1 leading-relaxed text-left animate-fade-in`}>
              <p className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'} flex items-center gap-1`}>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Multi-Layer Duplicate Prevention:
              </p>
              <p>• <strong>1 Phone = 1 Account:</strong> Mobile Money numbers cannot be registered twice across ValuVid.</p>
              <p>• <strong>Device Hardware Lock:</strong> Each phone/browser is bound to exactly one active account to prevent watch-reward farming.</p>
              <p>• <strong>Exclusive Payouts:</strong> Withdrawals to MTN MoMo, Telecel Cash, or Bank accounts are strictly locked to the owner's identity.</p>
            </div>
          )}

          {/* Error Alert */}
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-2 sm:p-2.5 flex items-center gap-2 text-[11px] sm:text-xs text-red-500">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 shrink-0" />
              <span className="leading-tight">{errorMsg}</span>
            </div>
          )}

          {/* Info Alert */}
          {infoMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2 sm:p-2.5 flex items-center gap-2 text-[11px] sm:text-xs text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
              <span className="leading-tight">{infoMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:gap-3">
            {authMode === 'signup' && (
              <>
                <div>
                  <label className={`text-[10px] sm:text-[11px] font-bold ${theme === 'light' ? 'text-slate-700' : 'text-neutral-400'} block mb-1 flex items-center gap-1`}>
                    <User className="w-3 h-3 text-cyan-500" /> Full Name / Brand
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kwame Mensah"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full ${
                      theme === 'light'
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:bg-white'
                        : 'bg-[#0A1628] border-neutral-800 text-white placeholder-neutral-500 focus:border-cyan-400'
                    } border rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs focus:outline-none transition-colors`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] sm:text-[11px] font-bold ${theme === 'light' ? 'text-slate-700' : 'text-neutral-400'} block mb-1 flex items-center gap-1`}>
                    <AtSign className="w-3 h-3 text-amber-500" /> Username
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. kwame_tunes"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full ${
                      theme === 'light'
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white'
                        : 'bg-[#0A1628] border-neutral-800 text-white placeholder-neutral-500 focus:border-amber-400'
                    } border rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs focus:outline-none transition-colors`}
                  />
                </div>

                <div>
                  <label className={`text-[10px] sm:text-[11px] font-bold ${theme === 'light' ? 'text-slate-700' : 'text-neutral-400'} block mb-1 flex items-center gap-1`}>
                    <Smartphone className="w-3 h-3 text-emerald-500" /> Mobile Money (1-User Identity Anchor)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className={`${
                        theme === 'light'
                          ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-500 focus:bg-white'
                          : 'bg-[#0A1628] border-neutral-800 text-white focus:border-cyan-400'
                      } border rounded-lg sm:rounded-xl px-2 py-2 sm:py-2.5 text-xs focus:outline-none shrink-0 cursor-pointer`}
                    >
                      <option value="+233">🇬🇭 +233</option>
                      <option value="+234">🇳🇬 +234</option>
                      <option value="+254">🇰🇪 +254</option>
                      <option value="+27">🇿🇦 +27</option>
                      <option value="+225">🇨🇮 +225</option>
                    </select>
                    <input
                      type="tel"
                      required
                      placeholder="024 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`flex-1 min-w-0 ${
                        theme === 'light'
                          ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white'
                          : 'bg-[#0A1628] border-neutral-800 text-white placeholder-neutral-500 focus:border-emerald-400'
                      } border rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs focus:outline-none transition-colors`}
                    />
                  </div>
                  <span className={`text-[9px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-500'} mt-1 block`}>
                    Enforces 1 account per person. Used for MTN MoMo / Telecel cashouts.
                  </span>
                </div>

                {/* Default Profile Picture notice */}
                <div className={`flex items-center gap-2.5 p-2 ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#0A1628]/80 border-[#00B2FE]/20'
                } rounded-xl border`}>
                  <img
                    src="/default-avatar.jpg"
                    alt="Default ValuVid Avatar"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[#00B2FE]/40 shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[10px] sm:text-[11px] font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'} truncate`}>Official ValuVid Avatar Assigned</span>
                    <span className={`text-[8px] sm:text-[9px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'} leading-tight`}>Can be customized anytime in Profile</span>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className={`text-[10px] sm:text-[11px] font-bold ${theme === 'light' ? 'text-slate-700' : 'text-neutral-400'} block mb-1 flex items-center gap-1`}>
                <Mail className="w-3 h-3 text-cyan-500" /> Email Address
              </label>
              <input
                type="email"
                required
                placeholder="creator@valuvid.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:bg-white'
                    : 'bg-[#0A1628] border-neutral-800 text-white placeholder-neutral-500 focus:border-cyan-400'
                } border rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs focus:outline-none transition-colors`}
              />
            </div>

            <div>
              <label className={`text-[10px] sm:text-[11px] font-bold ${theme === 'light' ? 'text-slate-700' : 'text-neutral-400'} block mb-1 flex items-center gap-1`}>
                <Lock className="w-3 h-3 text-cyan-500" /> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full ${
                    theme === 'light'
                      ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:bg-white'
                      : 'bg-[#0A1628] border-neutral-800 text-white placeholder-neutral-500 focus:border-cyan-400'
                  } border rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 pr-9 text-xs focus:outline-none transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-neutral-500 hover:text-neutral-300'}`}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 sm:py-3 mt-1 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-transform active:scale-98 shadow-lg shrink-0 ${
                theme === 'light'
                  ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                  : 'bg-white hover:bg-neutral-100 text-black shadow-white/20'
              } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  {authMode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  {authMode === 'signin' ? 'Sign In to ValuVid' : 'Create Account'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              )}
            </button>
          </form>

          {/* Quick Switch Text Footer */}
          <div className={`pt-2 text-center text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-neutral-400'}`}>
            {authMode === 'signin' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('signup')}
                  className="text-amber-500 hover:underline font-bold"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('signin')}
                  className="text-cyan-500 hover:underline font-bold"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
