import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { 
  LayoutDashboard, Monitor, Camera, Bell, AlertTriangle, 
  Footprints, CarFront, Fence, Map, Archive, HeartPulse, 
  BarChart3, Activity, Shield, FileText, Users, Settings,
  Cpu, Video, Flame, Sparkles, Radio, ChevronDown, Maximize2,
  Lock, RefreshCw, Eye, Compass, Key
} from 'lucide-react';

interface NavSection {
  title: string;
  items: {
    path: string;
    icon: any;
    label: string;
    badge?: string;
  }[];
}

const navSections: NavSection[] = [
  {
    title: 'COMMAND & TACTICAL',
    items: [
      { path: '/command-center', icon: LayoutDashboard, label: 'Command Center' },
      { path: '/surveillance', icon: Monitor, label: 'Live Surveillance', badge: 'LIVE' },
      { path: '/map', icon: Map, label: 'Map Intelligence' },
      { path: '/heatmap', icon: Flame, label: 'Surveillance Heatmap', badge: 'NEW' },
    ]
  },
  {
    title: 'INTELLIGENCE & AI',
    items: [
      { path: '/tracking', icon: Footprints, label: 'Objects & Tracking' },
      { path: '/tracking/cross-camera', icon: Compass, label: 'Cross-Camera Re-ID', badge: 'AI' },
      { path: '/anpr', icon: CarFront, label: 'ANPR Vehicle Intel' },
      { path: '/virtual-fences', icon: Fence, label: 'Virtual Fences' },
      { path: '/video-analyzer', icon: Video, label: 'Video Forensics', badge: 'NEW' },
      { path: '/analytics', icon: BarChart3, label: 'Analytics Hub' },
    ]
  },
  {
    title: 'SECURITY & OPERATIONS',
    items: [
      { path: '/security', icon: Shield, label: 'Security Center' },
      { path: '/api-keys', icon: Key, label: 'API Keys & Integrations', badge: 'NEW' },
      { path: '/alerts', icon: Bell, label: 'Threat Alerts' },
      { path: '/incidents', icon: AlertTriangle, label: 'Incidents' },
      { path: '/evidence', icon: Archive, label: 'Evidence Vault' },
      { path: '/audit-log', icon: FileText, label: 'System Audit Log' },
    ]
  },
  {
    title: 'INFRASTRUCTURE & SYSTEM',
    items: [
      { path: '/cameras', icon: Camera, label: 'Camera Registry' },
      { path: '/camera-health', icon: HeartPulse, label: 'Camera Diagnostics' },
      { path: '/ai-models', icon: Cpu, label: 'AI Model Center', badge: 'NEW' },
      { path: '/system-health', icon: Activity, label: 'System Health' },
      { path: '/users', icon: Users, label: 'Users & Roles (RBAC)' },
      { path: '/settings', icon: Settings, label: 'Settings & Tuning' },
    ]
  }
];

const allNavItems = navSections.flatMap(s => s.items);

export const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [timeStr, setTimeStr] = useState('');
  const [activeSector, setActiveSector] = useState('Sector 04 - North Border');
  const [sectorOpen, setSectorOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const y = now.getFullYear();
      const m = pad(now.getMonth() + 1);
      const d = pad(now.getDate());
      const hh = pad(now.getHours());
      const mm = pad(now.getMinutes());
      const ss = pad(now.getSeconds());
      setTimeStr(`${y}-${m}-${d} ${hh}:${mm}:${ss} IST`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentNav = allNavItems.find(item => 
    location.pathname === item.path || (item.path !== '/command-center' && location.pathname.startsWith(item.path))
  );

  return (
    <div className="flex h-screen bg-[#070B12] text-slate-100 overflow-hidden font-sans">
      {/* ── TACTICAL MILITARY SIDEBAR ── */}
      <div className="w-64 bg-[#0A0F18] border-r border-[#1B2536] flex flex-col flex-shrink-0 z-20 shadow-2xl">
        {/* Brand Header */}
        <div className="p-4 border-b border-[#1B2536] bg-[#070B12]/80 backdrop-blur-md flex items-center justify-between">
          <Link to="/command-center" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:border-emerald-400 transition-colors">
              <Shield className="w-5 h-5 text-emerald-400" />
              <div className="absolute inset-0 rounded-lg border border-cyan-500/20 animate-pulse pointer-events-none" />
            </div>
            <div>
              <div className="flex items-center tracking-wider text-base font-black">
                <span className="text-white">IB</span>
                <span className="text-emerald-400 ml-0.5">VAP</span>
                <span className="ml-2 text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">v2.4</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">Border Video Intelligence</p>
            </div>
          </Link>
        </div>

        {/* Categorized Navigation Items */}
        <div className="flex-1 overflow-y-auto py-2 px-2.5 space-y-3.5 custom-scrollbar">
          {navSections.map((sec, sIdx) => (
            <div key={sec.title} className="space-y-1">
              <div className="px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold flex items-center justify-between">
                <span>{sec.title}</span>
                {sIdx === 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />}
              </div>

              <nav className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (item.path !== '/command-center' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all duration-150 ${
                        isActive 
                          ? 'bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-transparent text-emerald-400 border-l-2 border-emerald-400 font-semibold shadow-sm' 
                          : 'text-slate-400 hover:text-slate-100 hover:bg-[#121926]/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={15} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                        <span className="text-xs tracking-tight">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                          item.badge === 'LIVE' ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' :
                          item.badge === 'AI' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                          'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User / Clearance Footer */}
        <div className="p-3 border-t border-[#1B2536] bg-[#070B12]/90 space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-[#0F1726] border border-[#1E293B]">
            <div className="relative w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400 text-xs shadow">
              {user?.username?.charAt(0).toUpperCase() || 'C'}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#0F1726]" />
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.fullName || user?.username || 'Commander 1'}</p>
              <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                <span className="text-emerald-400 font-bold">LVL-4 CLEARANCE</span>
              </div>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="w-full flex items-center justify-center gap-1.5 py-1 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded border border-transparent hover:border-red-500/20 font-mono transition-colors"
          >
            <Lock size={12} /> Sign Out Session
          </button>
          
          {/* Indian Border Security Intelligence Graphic */}
          <div className="rounded-lg overflow-hidden border border-[#1B2536]/80 relative h-14 bg-black/40">
            <img src="/sidebar-soldier.jpg" alt="Border Security" className="w-full h-full object-cover opacity-75" />
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA WITH UNIFIED TOP HEADER ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#070B12]">
        
        {/* Unified Military Top Bar with Skyline Background */}
        <header className="h-14 relative px-5 flex items-center justify-between flex-shrink-0 z-10 overflow-hidden border-b border-[#1B2536]">
          {/* Panoramic Skyline Backdrop */}
          <img 
            src="/top-skyline.jpg" 
            alt="Border Defense Skyline" 
            className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none opacity-40 z-0" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F18]/95 via-[#0A0F18]/85 to-[#0A0F18]/90 backdrop-blur-sm pointer-events-none z-[1]" />

          <div className="relative z-10 flex items-center justify-between w-full">
            {/* Left: Sector Selector & Breadcrumb */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setSectorOpen(!sectorOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0F1726]/90 border border-[#1E293B] hover:border-emerald-500/40 text-xs font-mono text-slate-200 transition-colors shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-white tracking-wide">{activeSector}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>

                {sectorOpen && (
                  <div className="absolute left-0 mt-1.5 w-60 bg-[#0E1624] border border-[#1E293B] rounded-lg shadow-2xl py-1 z-50 text-xs font-mono">
                    {['Sector 04 - North Border', 'Sector 02 - Western Corridor', 'Sector 01 - Riverine Outpost', 'Sector 07 - High Altitude Pass'].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => { setActiveSector(sec); setSectorOpen(false); }}
                        className={`w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between ${activeSector === sec ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-300'}`}
                      >
                        <span>{sec}</span>
                        {activeSector === sec && <span className="text-[10px] text-emerald-400">ACTIVE</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-mono font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                DEFCON 3 // ELEVATED THREAT
              </div>

              <div className="hidden xl:flex items-center text-xs font-mono text-slate-400 pl-2 border-l border-slate-800">
                <span className="text-slate-500">MODULE :</span>
                <span className="ml-1.5 text-cyan-400 font-bold uppercase tracking-wider">{currentNav?.label || 'COMMAND CENTER'}</span>
              </div>
            </div>

            {/* Right: Realtime Clocks, Operational Status, Quick Actions */}
            <div className="flex items-center gap-3 font-mono text-xs">
              {/* Live Clock */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0F1726]/90 border border-[#1E293B] text-slate-300 shadow-sm">
                <Radio size={14} className="text-cyan-400 animate-pulse" />
                <span className="font-semibold text-slate-200">{timeStr || '2026-09-27 12:15:18 IST'}</span>
              </div>

              {/* Operational Beacon */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>OPERATIONAL</span>
              </div>

              {/* Quick Alerts Link */}
              <Link 
                to="/alerts" 
                className="relative p-2 rounded-lg bg-[#0F1726]/90 border border-[#1E293B] text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors shadow-sm"
                title="Threat Alerts"
              >
                <Bell size={15} />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center border border-[#0A0F18]">
                  3
                </span>
              </Link>

              {/* Quick Multi-Wall Link */}
              <Link 
                to="/surveillance" 
                className="hidden md:flex p-2 rounded-lg bg-[#0F1726]/90 border border-[#1E293B] text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors shadow-sm"
                title="Surveillance Wall"
              >
                <Monitor size={15} />
              </Link>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
