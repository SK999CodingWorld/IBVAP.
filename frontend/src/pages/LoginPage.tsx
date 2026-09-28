import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Shield, Lock, User, Cpu, Video, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await login(username, password);
      navigate('/command-center');
    } catch (error: any) {
      setErrorMsg(error?.message || 'Authentication failed. Please verify credentials.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full bg-[#060A10] flex items-center justify-center p-4 relative overflow-hidden font-sans"
      style={{
        backgroundImage: "url('/login-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Explicit background image tag for maximum browser compatibility */}
      <img 
        src="/login-bg.jpg" 
        alt="IBVAP Border Security" 
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0 select-none" 
      />
      
      {/* Subtle Dark Radial Falloff to seamlessly frame the center card */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none z-[1]" />

      {/* ── CENTRAL GLASSMORPHIC LOGIN CARD (MATCHING REFERENCE IMAGE 1:1) ── */}
      <div className="w-full max-w-[440px] rounded-[28px] border border-cyan-400/40 bg-[#0B1528]/85 backdrop-blur-xl p-7 shadow-[0_0_50px_-8px_rgba(6,182,212,0.35)] relative overflow-hidden z-10 space-y-4">
        
        {/* Subtle Cyan Corner Flare Reflections */}
        <div className="absolute -top-12 -left-12 w-28 h-28 bg-cyan-400/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-cyan-400/15 rounded-full blur-2xl pointer-events-none" />

        {/* ── CARD HEADER: EMBLEM & WORDMARK ── */}
        <div className="text-center space-y-2">
          {/* Cyan Shield Badge with Dual Chevrons & Central Triangle Eye */}
          <div className="flex justify-center">
            <div className="relative inline-flex items-center justify-center p-1">
              <svg className="w-12 h-14 drop-shadow-[0_0_12px_rgba(6,182,212,0.65)]" viewBox="0 0 60 70" fill="none">
                {/* Shield Outer Outline */}
                <path 
                  d="M30 4 L54 14 V38 C54 52 30 66 30 66 C30 66 6 52 6 38 V14 Z" 
                  stroke="#22D3EE" 
                  strokeWidth="2.5" 
                  fill="rgba(6, 182, 212, 0.12)" 
                />
                {/* Inner Chevrons */}
                <path 
                  d="M22 46 L30 52 L38 46" 
                  stroke="#22D3EE" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                <path 
                  d="M24 38 L30 43 L36 38" 
                  stroke="#22D3EE" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
                {/* Central Triangle Eye with Glowing Beacon */}
                <polygon 
                  points="30,19 38,32 22,32" 
                  stroke="#22D3EE" 
                  strokeWidth="1.6" 
                  fill="rgba(6, 182, 212, 0.25)" 
                />
                <circle cx="30" cy="27" r="2.5" fill="#34D399" className="animate-pulse" />
              </svg>
            </div>
          </div>

          {/* IBVAP Bold Typography */}
          <h1 className="text-3xl font-extrabold tracking-[0.2em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            IBVAP
          </h1>

          {/* Subtitle */}
          <p className="text-xs text-slate-300 font-medium tracking-wide">
            Intelligent Border Video Analytics Platform
          </p>

          {/* Indian Tricolor Mini Divider Bar */}
          <div className="flex items-center justify-center gap-0.5 w-12 h-1 mx-auto pt-1 rounded-full overflow-hidden">
            <span className="w-4 h-full bg-[#FF9933] rounded-l-full shadow-sm" />
            <span className="w-4 h-full bg-white shadow-sm" />
            <span className="w-4 h-full bg-[#138808] rounded-r-full shadow-sm" />
          </div>
        </div>

        {/* ── INNER PANEL: SECURE COMMAND ACCESS ── */}
        <div className="bg-[#070D1A]/90 border border-[#1B293D] rounded-xl p-5 space-y-4 shadow-inner">
          <div className="flex items-start gap-2.5">
            <span className="w-1 h-8 bg-cyan-400 rounded-full flex-shrink-0 mt-0.5 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Secure Command Access
              </h2>
              <p className="text-[11px] text-slate-400">
                Enter your credentials to access the system.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-red-950/60 border border-red-500/40 rounded-lg flex items-center gap-2 text-xs text-red-300 font-mono">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            {/* Operator ID Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User size={16} />
              </div>
              <input
                type="text"
                placeholder="Operator ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#0A1324] border border-[#1E2D44] rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-all font-sans"
              />
            </div>

            {/* Access Code Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <input
                type="password"
                placeholder="Access Code"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#0A1324] border border-[#1E2D44] rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-all font-sans"
              />
            </div>

            {/* SIGN IN Gradient Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-[#00D2FF] to-[#0072FF] hover:from-[#00E5FF] hover:to-[#0085FF] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-75"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>AUTHENTICATING...</span>
                </>
              ) : (
                <>
                  <span>SIGN IN</span>
                  <span className="w-5 h-5 rounded-full border border-white/80 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight size={12} strokeWidth={2.5} />
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── SYSTEM STATUS ROWS (SCREEN 1 MATCH) ── */}
        <div className="pt-2 px-1 space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-2.5">
              <Shield size={15} className="text-cyan-400" />
              <span>Auth Service</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ONLINE</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-2.5">
              <Cpu size={15} className="text-cyan-400" />
              <span>AI Processing Node</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ONLINE</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-2.5">
              <Video size={15} className="text-cyan-400" />
              <span>Camera Gateway</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ONLINE</span>
            </div>
          </div>
        </div>

        {/* ── CARD BOTTOM CONTOUR WAVE GRAPHIC ── */}
        <div className="absolute -bottom-1 left-0 right-0 h-10 pointer-events-none opacity-20 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 400 40" fill="none" preserveAspectRatio="none">
            <path d="M0 30 Q100 10 200 25 T400 15" stroke="#22D3EE" strokeWidth="1" />
            <path d="M0 35 Q120 18 240 30 T400 22" stroke="#22D3EE" strokeWidth="1" />
            <path d="M0 38 Q150 25 300 35 T400 28" stroke="#22D3EE" strokeWidth="0.8" />
          </svg>
        </div>

      </div>

    </div>
  );
};

export default LoginPage;
