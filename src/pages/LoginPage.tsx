// LoginPage - Pure Normal Login & Register Page for NutriTrack
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Flame,
  Droplets,
  TrendingUp,
  Shield,
  Loader2,
  AlertCircle,
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  UserPlus,
  LogIn,
  Server,
  CheckCircle2,
} from 'lucide-react';
import { apiService, getEffectiveApiBase, setCustomApiUrl } from '../services/apiService';

export const LoginPage: React.FC = () => {
  const { login, register, error, clearError, loading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Server Connection Configuration
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(() => {
    const eff = getEffectiveApiBase();
    return eff === '/api' ? 'http://10.156.51.88:8001' : eff.replace(/\/api$/, '');
  });
  const [isTestingServer, setIsTestingServer] = useState(false);
  const [serverStatusMsg, setServerStatusMsg] = useState<string | null>(null);
  const [serverConnected, setServerConnected] = useState<boolean | null>(null);

  const handleConnectServer = async () => {
    if (!serverUrl.trim()) return;
    setIsTestingServer(true);
    setServerStatusMsg(null);
    setCustomApiUrl(serverUrl.trim());
    try {
      const status = await apiService.checkHealth();
      if (status.connected) {
        setServerConnected(true);
        setServerStatusMsg(`Connected: ${status.database}`);
      } else {
        setServerConnected(false);
        setServerStatusMsg('Server offline or unreachable.');
      }
    } catch {
      setServerConnected(false);
      setServerStatusMsg('Connection failed.');
    } finally {
      setIsTestingServer(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsSubmitting(true);
    clearError();
    try {
      if (isRegistering) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
    } catch {
      // Error handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSignIn = async () => {
    setIsSubmitting(true);
    clearError();
    try {
      await register('demo@gmail.com', 'demo1234', 'Demo User');
    } catch {
      // If already registered, try normal login
      try {
        await login('demo@gmail.com', 'demo1234');
      } catch {
        // Fallback
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    { icon: Flame, label: 'Calorie Tracking', desc: 'Precision macro calculations', color: 'text-orange-400' },
    { icon: Droplets, label: 'Water Tracker', desc: 'Hydration goals & alerts', color: 'text-cyan-400' },
    { icon: TrendingUp, label: 'Progress Charts', desc: 'Track streaks & weight', color: 'text-emerald-400' },
    { icon: Shield, label: 'Database Saved', desc: 'Stored securely per user', color: 'text-violet-400' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#0a1628] to-slate-950 py-10 px-4">
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />

          {/* Logo & Brand Header */}
          <div className="relative text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-xl shadow-emerald-500/30 mb-3 relative">
              <Sparkles className="w-8 h-8 text-white" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/20" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              NutriTrack
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">
              India's Smart Calorie & Nutrition Tracker
            </p>
          </div>

          {/* Tab Selector: Sign In vs Sign Up */}
          <div className="relative flex p-1 bg-slate-900/80 rounded-2xl border border-white/10 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                clearError();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
                !isRegistering
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(true);
                clearError();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
                isRegistering
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Account
            </button>
          </div>

          {/* Feature Badges */}
          <div className="relative grid grid-cols-2 gap-2 mb-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.label}
                  className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                >
                  <Icon className={`w-3.5 h-3.5 ${feature.color} flex-shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-white/90 truncate">{feature.label}</p>
                    <p className="text-[9px] text-slate-500 truncate">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="relative mb-5 flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-relaxed">{error}</p>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-[10px] text-red-400 hover:text-red-300 underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="relative space-y-3.5">
            {isRegistering && (
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Siva Kumar"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. siva@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Password
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500
                text-white font-semibold text-sm shadow-lg shadow-emerald-600/30
                active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-200 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isRegistering ? 'Creating Account...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <span>{isRegistering ? 'Create Account & Start' : 'Sign In to Tracker'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Button */}
          <div className="relative text-center mt-4 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={isSubmitting || loading}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              ⚡ Instant 1-Click Demo Login
            </button>
          </div>

          {/* Local Backend Server Connection (for Mobile APK) */}
          <div className="relative text-center mt-3 pt-2">
            <button
              type="button"
              onClick={() => setShowServerConfig(!showServerConfig)}
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <Server className="w-3 h-3 text-emerald-400" />
              <span>{showServerConfig ? 'Hide Server Settings' : '⚙️ Connect to Local Backend Server'}</span>
            </button>

            {showServerConfig && (
              <div className="mt-3 p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-left space-y-2">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Backend Server IP / URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="http://10.156.51.88:8001"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleConnectServer}
                    disabled={isTestingServer}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all"
                  >
                    {isTestingServer ? '...' : 'Connect'}
                  </button>
                </div>
                {serverStatusMsg && (
                  <p className={`text-[11px] font-semibold flex items-center gap-1 ${serverConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{serverStatusMsg}</span>
                  </p>
                )}
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Enter your computer's Wi-Fi IP (e.g. <code>http://10.156.51.88:8001</code>) to sync with your local SQLite database.
                </p>
              </div>
            )}
          </div>

          <p className="relative text-center text-[10px] text-slate-500 mt-3">
            All your daily food, water, calories, and habits are stored in your database.
          </p>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-4">
          NutriTrack India • Multi-User SQLite Edition v1.4.0
        </p>
      </div>
    </div>
  );
};
