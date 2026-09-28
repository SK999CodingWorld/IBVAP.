import React, { useState, useEffect } from 'react';
import { 
  Shield, Lock, Activity, Users, AlertTriangle, CheckCircle, Network, Server, 
  Key, Radio, Eye, FileText, CheckCircle2, ShieldAlert, Cpu, ArrowRight,
  RefreshCw, Smartphone, Globe, HardDrive, KeyRound, Terminal, Zap, X,
  UserX, ShieldCheck, Clock, Fingerprint, Layers, Check
} from 'lucide-react';
import { ApiKeySection } from '../components/security/ApiKeySection';
import { IntegrationsSection } from '../components/security/IntegrationsSection';

interface SecurityCenterProps {
  initialTab?: 'overview' | 'api-keys' | 'integrations' | 'authentication' | 'encryption' | 'network';
}

export function SecurityCenter({ initialTab = 'overview' }: SecurityCenterProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'api-keys' | 'integrations' | 'authentication' | 'encryption' | 'network'>(initialTab);
  
  // Live Telemetry States
  const [overview, setOverview] = useState({
    authEvents24h: 142,
    failedLogins24h: 5,
    activeSessions: 3,
    encryptionStatus: 'healthy',
    activeApiKeys: 3,
    activeIntegrations: 6,
    kmsKeyId: 'kms-root-sec4-20260901',
    kmsLastRotated: '2026-09-01T00:00:00Z'
  });

  const [authEvents, setAuthEvents] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [encryptionData, setEncryptionData] = useState<any>(null);
  const [isRotatingKms, setIsRotatingKms] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/security/overview');
      if (res.ok) {
        const data = await res.json();
        setOverview(prev => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.warn('Overview fallback:', e);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/security/active-sessions');
      if (res.ok) {
        const data = await res.json();
        setActiveSessions(data);
      }
    } catch (e) {
      console.warn('Sessions fallback:', e);
    }
  };

  const fetchAuthEvents = async () => {
    try {
      const res = await fetch('/api/security/auth-events');
      if (res.ok) {
        const data = await res.json();
        setAuthEvents(data);
      }
    } catch (e) {
      console.warn('Auth events fallback:', e);
    }
  };

  const fetchEncryption = async () => {
    try {
      const res = await fetch('/api/security/encryption-status');
      if (res.ok) {
        const data = await res.json();
        setEncryptionData(data);
      }
    } catch (e) {
      console.warn('Encryption fallback:', e);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchSessions();
    fetchAuthEvents();
    fetchEncryption();
  }, []);

  const handleTerminateSession = async (sessionId: string, userName: string) => {
    if (!confirm(`Are you sure you want to terminate the active session for ${userName}?`)) return;
    try {
      const res = await fetch(`/api/security/active-sessions/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
        showToast(`Session for ${userName} terminated successfully`, 'success');
      } else {
        const err = await res.json();
        showToast(err.detail || 'Could not terminate session', 'error');
      }
    } catch (e) {
      showToast('Session termination failed', 'error');
    }
  };

  const handleRotateKms = async () => {
    setIsRotatingKms(true);
    try {
      const res = await fetch('/api/security/kms/rotate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setOverview(prev => ({
          ...prev,
          kmsKeyId: data.key_id,
          kmsLastRotated: data.timestamp
        }));
        showToast(`KMS Master Key Rotated: ${data.key_id}`, 'success');
      } else {
        showToast('KMS Key rotation failed', 'error');
      }
    } catch (e) {
      showToast('Error rotating KMS key', 'error');
    } finally {
      setIsRotatingKms(false);
    }
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col bg-[#070B12] text-slate-200 overflow-y-auto space-y-5 custom-scrollbar relative">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-white shadow-2xl font-mono text-xs animate-in slide-in-from-bottom-5 ${
          toast.type === 'success' ? 'bg-[#061A14] border-emerald-500/60 shadow-emerald-950/70 text-emerald-200' :
          toast.type === 'error' ? 'bg-[#220B0B] border-red-500/60 shadow-red-950/70 text-red-200' :
          'bg-[#0A121E] border-cyan-500/60 shadow-cyan-950/70 text-cyan-200'
        }`}>
          <div className="p-1 rounded bg-white/10">
            {toast.type === 'success' ? <CheckCircle2 size={15} className="text-emerald-400" /> : <AlertTriangle size={15} className="text-red-400" />}
          </div>
          <div>
            <span className="font-bold">SECURITY OPS: </span>
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-white cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="relative overflow-hidden bg-[#0A0F18]/90 border border-slate-800/80 rounded-xl p-4 shadow-lg backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              Security Center & Zero-Trust Defense Hub
            </h1>
            <p className="text-slate-400 text-xs">Border platform posture, HMAC token credentials, C4ISR integrations, and hardware KMS</p>
          </div>
        </div>

        {/* Right Radar / Satellite Visual Banner */}
        <div className="relative h-14 w-full md:w-80 rounded-lg overflow-hidden border border-slate-800/70 bg-[#060A10] flex items-center">
          <img 
            src="/security-header-bg.jpg" 
            alt="Security Banner" 
            className="w-full h-full object-cover opacity-70"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F18] via-transparent to-cyan-950/30 pointer-events-none" />
          <div className="absolute right-3 flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-bold tracking-wider">DEFCON 4 • ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex gap-2 border-b border-slate-800/80 pb-1 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: Shield },
          { id: 'api-keys', label: 'API Keys & Sandbox', icon: Key },
          { id: 'integrations', label: 'Integrations & Webhooks', icon: Network, badge: `${overview.activeIntegrations} Active` },
          { id: 'authentication', label: 'Authentication & Sessions', icon: Users },
          { id: 'encryption', label: 'Encryption & KMS', icon: Lock },
          { id: 'network', label: 'Network & VLANs', icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-semibold uppercase tracking-wider rounded-t-lg transition-all border-b-2 flex items-center gap-2 flex-shrink-0 cursor-pointer ${
                isSelected
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* 4 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Auth Events */}
            <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                  <Activity size={22} className="animate-pulse" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white font-mono">{overview.authEvents24h}</div>
                  <div className="text-xs text-slate-400">Auth Events (24h)</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">100% Verified Identities</div>
                </div>
              </div>
              <div className="flex items-end gap-1 h-8 opacity-75">
                {[40, 60, 35, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} className="w-1.5 bg-blue-500/40 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>

            {/* Failed Logins */}
            <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-red-500/30 transition-all">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-red-400 font-mono">{overview.failedLogins24h}</div>
                  <div className="text-xs text-slate-400">Failed Logins (24h)</div>
                  <div className="text-[10px] text-red-400 mt-0.5">IP Rate-Limits Applied</div>
                </div>
              </div>
              <div className="flex items-end gap-1 h-8 opacity-75">
                {[10, 0, 40, 10, 60, 20, 80].map((h, i) => (
                  <div key={i} className="w-1.5 bg-red-500/40 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>

            {/* Active Sessions */}
            <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-emerald-500/30 transition-all">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                  <Users size={22} />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-emerald-400 font-mono">{activeSessions.length || overview.activeSessions}</div>
                  <div className="text-xs text-slate-400">Active Operator Sessions</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Sliding 15m Expiry</div>
                </div>
              </div>
              <div className="flex items-end gap-1 h-8 opacity-75">
                {[50, 65, 70, 60, 85, 90, 75].map((h, i) => (
                  <div key={i} className="w-1.5 bg-emerald-500/40 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>

            {/* Encryption & Integrations */}
            <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                  <Lock size={22} />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-emerald-400 font-mono">FIPS 140-2</div>
                  <div className="text-xs text-slate-400">Hardware HSM Status</div>
                  <div className="text-[10px] text-cyan-400 mt-0.5">{overview.activeIntegrations} Tactical Bridges</div>
                </div>
              </div>
              <div className="flex items-end gap-1 h-8 opacity-75">
                {[100, 100, 100, 100, 100, 100, 100].map((h, i) => (
                  <div key={i} className="w-1.5 bg-cyan-500/40 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>

          {/* Security Architecture Flow Diagram */}
          <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/70">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Network className="text-cyan-400" size={18} />
                End-to-End Zero-Trust Border Defense Pipeline
              </h2>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                AES-256-GCM Hardware Encrypted
              </span>
            </div>

            {/* Visual Flow Container */}
            <div className="relative rounded-xl p-6 md:p-8 bg-[#060910] border border-slate-800/90 overflow-hidden min-h-[220px] flex items-center justify-center">
              <img 
                src="/security-arch-bg.jpg" 
                alt="Architecture Grid" 
                className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#070B12]/90 via-[#070B12]/60 to-[#070B12]/90 pointer-events-none" />

              {/* 3 Pipeline Stages */}
              <div className="relative z-10 w-full max-w-4xl flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2">
                
                {/* Stage 1: Edge Cameras & Drones */}
                <div className="flex flex-col items-center text-center w-full md:w-56 p-4 rounded-xl bg-[#0C121D]/90 border border-cyan-500/30 shadow-lg">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
                    <Server size={28} />
                  </div>
                  <span className="text-sm font-bold text-white tracking-wide">Edge Cameras & Drones</span>
                  <span className="text-[10px] text-cyan-400 font-mono mt-1">16 Cameras + 4 UAVs</span>
                  <div className="mt-2 text-[9px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                    TPM 2.0 Attested
                  </div>
                </div>

                {/* Arrow 1: TLS 1.3 / SRTP */}
                <div className="flex-1 flex flex-col items-center justify-center px-2 py-2 md:py-0 w-full md:w-auto">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400 mb-1.5 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    <Lock size={11} /> TLS 1.3 / SRTP
                  </div>
                  <div className="w-full h-0.5 bg-slate-700/80 relative flex items-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-emerald-400 to-indigo-500 h-full animate-pulse" />
                    <div className="absolute right-0 w-2 h-2 border-t-2 border-r-2 border-emerald-400 rotate-45" />
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono mt-1">mTLS Mutual X.509</span>
                </div>

                {/* Stage 2: API Gateway & Defense Hub */}
                <div className="flex flex-col items-center text-center w-full md:w-56 p-4 rounded-xl bg-[#0C121D]/90 border border-indigo-500/30 shadow-lg">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
                    <Shield size={28} />
                  </div>
                  <span className="text-sm font-bold text-white tracking-wide">API Gateway & Hub</span>
                  <span className="text-[10px] text-indigo-400 font-mono mt-1">HMAC & Scopes Guard</span>
                  <div className="mt-2 text-[9px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                    RS256 JWT Signed
                  </div>
                </div>

                {/* Arrow 2: RBAC / Integrations */}
                <div className="flex-1 flex flex-col items-center justify-center px-2 py-2 md:py-0 w-full md:w-auto">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-cyan-400 mb-1.5 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                    <Key size={11} /> RBAC / WORM
                  </div>
                  <div className="w-full h-0.5 bg-slate-700/80 relative flex items-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-cyan-400 to-amber-500 h-full animate-pulse" />
                    <div className="absolute right-0 w-2 h-2 border-t-2 border-cyan-400 rotate-45" />
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono mt-1">SHA-256 Forensics</span>
                </div>

                {/* Stage 3: Encrypted Evidence Vault */}
                <div className="flex flex-col items-center text-center w-full md:w-56 p-4 rounded-xl bg-[#0C121D]/90 border border-amber-500/30 shadow-lg">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
                    <Lock size={28} />
                  </div>
                  <span className="text-sm font-bold text-white tracking-wide">Encrypted Evidence Vault</span>
                  <span className="text-[10px] text-amber-400 font-mono mt-1">LUKS2 + HSM Key-Wrap</span>
                  <div className="mt-2 text-[9px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                    Immutable Audit Trail
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Recent Security & Auth Events Feed */}
          <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/70">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity size={16} className="text-emerald-400" />
                Live Authentication & Access Audit Stream
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Zero-Trust Real-Time Telemetry</span>
            </div>

            <div className="space-y-2">
              {authEvents.map((ev, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[#070D18] border border-slate-800/80 text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <div>
                      <span className="font-bold text-white">{ev.user}</span>
                      <span className="text-slate-400 ml-2">({ev.ip})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 text-[10px]">
                      {ev.mfa || 'Verified'}
                    </span>
                    <span className="text-emerald-400 font-bold">{ev.result}</span>
                    <span className="text-slate-500">{ev.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: API KEYS & SANDBOX ── */}
      {activeTab === 'api-keys' && (
        <ApiKeySection />
      )}

      {/* ── TAB 3: INTEGRATIONS & WEBHOOKS ── */}
      {activeTab === 'integrations' && (
        <IntegrationsSection />
      )}

      {/* ── TAB 4: AUTHENTICATION & ACTIVE SESSIONS ── */}
      {activeTab === 'authentication' && (
        <div className="space-y-5">
          {/* Active Operator Sessions Table */}
          <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" /> Active Operator Sessions
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Real-time logged-in military personnel with terminal endpoints and clearance levels
                </p>
              </div>
              <button 
                onClick={fetchSessions}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 border border-slate-700 cursor-pointer"
              >
                <RefreshCw size={13} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-slate-400 uppercase tracking-wider bg-[#080E18] border-b border-slate-800/80 font-mono">
                  <tr>
                    <th className="py-3 px-4">Operator / Name</th>
                    <th className="py-3 px-4">Clearance Role</th>
                    <th className="py-3 px-4">Device & Terminal</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Login Time</th>
                    <th className="py-3 px-4">Activity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {activeSessions.map((sess) => (
                    <tr key={sess.id} className="hover:bg-slate-800/25 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{sess.name || sess.user}</span>
                          {sess.is_current && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{sess.user}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-200 font-semibold">{sess.role}</div>
                        <div className="text-[10px] text-amber-400 font-mono mt-0.5">{sess.clearance}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {sess.device}
                      </td>

                      <td className="py-3 px-4 font-mono text-cyan-300">
                        {sess.ip}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                        {sess.login_time}
                      </td>

                      <td className="py-3 px-4 text-emerald-400 font-mono text-[11px]">
                        {sess.last_activity}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {!sess.is_current ? (
                          <button
                            onClick={() => handleTerminateSession(sess.id, sess.name || sess.user)}
                            className="px-2.5 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-mono flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <UserX size={12} />
                            <span>Terminate</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">Current Session</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MFA and Policies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" /> Multi-Factor Authentication (MFA)
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#080E18] border border-slate-800">
                  <div>
                    <div className="font-semibold text-white">TOTP Authenticator</div>
                    <div className="text-slate-400 text-[11px]">Enforced for all Level 3+ clearance accounts</div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/30 text-[10px] font-bold">ENFORCED</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#080E18] border border-slate-800">
                  <div>
                    <div className="font-semibold text-white">FIDO2 / WebAuthn Hardware Keys</div>
                    <div className="text-slate-400 text-[11px]">YubiKey support for Level 5 Sector Commanders</div>
                  </div>
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded border border-cyan-500/30 text-[10px] font-bold">READY</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" /> Session Policies
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#080E18] border border-slate-800">
                  <span className="text-slate-300">JWT Token Lifetime</span>
                  <span className="font-mono text-cyan-400 font-bold">15 minutes (sliding)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#080E18] border border-slate-800">
                  <span className="text-slate-300">Idle Inactivity Lock</span>
                  <span className="font-mono text-cyan-400 font-bold">5 minutes</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#080E18] border border-slate-800">
                  <span className="text-slate-300">Max Failed Attempts</span>
                  <span className="font-mono text-red-400 font-bold">5 tries / 30m lock</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: ENCRYPTION & KMS ── */}
      {activeTab === 'encryption' && (
        <div className="space-y-5">
          {/* Master Hardware KMS Module Card */}
          <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800/80">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-purple-400" /> Hardware Security Module (HSM) Key Management
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  FIPS 140-2 Level 3 PCIe hardware module orchestrating AES-256 master key-wrap
                </p>
              </div>

              <button
                onClick={handleRotateKms}
                disabled={isRotatingKms}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={13} className={isRotatingKms ? 'animate-spin' : ''} />
                <span>{isRotatingKms ? 'Rotating Master Key...' : 'Rotate Master KMS Key Now'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 bg-[#080E18] border border-slate-800 rounded-lg">
                <span className="text-slate-400 text-[11px]">Active KMS Key ID</span>
                <div className="text-sm font-bold text-purple-300 mt-1 truncate">{overview.kmsKeyId}</div>
                <div className="text-emerald-400 text-[10px] mt-1">● AES-256-GCM / RSA-4096 Root</div>
              </div>
              <div className="p-3 bg-[#080E18] border border-slate-800 rounded-lg">
                <span className="text-slate-400 text-[11px]">Last Re-Keying Timestamp</span>
                <div className="text-sm font-bold text-white mt-1">{overview.kmsLastRotated}</div>
                <div className="text-cyan-400 text-[10px] mt-1">● 90-Day Auto Policy Enforced</div>
              </div>
              <div className="p-3 bg-[#080E18] border border-slate-800 rounded-lg">
                <span className="text-slate-400 text-[11px]">Hardware Enclave</span>
                <div className="text-sm font-bold text-white mt-1">Thales Luna PCIe HSM</div>
                <div className="text-emerald-400 text-[10px] mt-1">● Tamper-Evident Physical Chassis</div>
              </div>
            </div>
          </div>

          {/* In-Transit & At-Rest Encryption Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" /> Encryption In-Transit
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#080E18] border border-slate-800">
                  <span className="text-slate-300">Web Dashboard API</span>
                  <span className="text-emerald-400 font-mono font-bold">TLS 1.3 (ECDHE-RSA-AES256-GCM)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#080E18] border border-slate-800">
                  <span className="text-slate-300">Video Streaming (SRTP)</span>
                  <span className="text-emerald-400 font-mono font-bold">SRTP-AES-128-CM-HMAC-SHA1-80</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#080E18] border border-slate-800">
                  <span className="text-slate-300">Edge Gateway mTLS</span>
                  <span className="text-emerald-400 font-mono font-bold">Mutual X.509 Certificate</span>
                </div>
              </div>
            </div>

            <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400" /> Encryption At-Rest
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#080E18] border border-slate-800">
                  <span className="text-slate-300">PostgreSQL Database</span>
                  <span className="text-emerald-400 font-mono font-bold">LUKS2 AES-XTS 512-bit</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#080E18] border border-slate-800">
                  <span className="text-slate-300">Video Evidence Files</span>
                  <span className="text-emerald-400 font-mono font-bold">MinIO SSE-S3 AES-256</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#080E18] border border-slate-800">
                  <span className="text-slate-300">Evidence Integrity</span>
                  <span className="text-cyan-400 font-mono font-bold">SHA-256 Tamper Proof (WORM)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: NETWORK & VLANS ── */}
      {activeTab === 'network' && (
        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" /> Border Network Physical & Logical Isolation
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Multi-tier segmented network topology with strict stateful egress firewalls
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
              IPsec Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-4 bg-[#080E18] border border-slate-800 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">VLAN 10: Surveillance</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <div className="text-base font-bold text-white font-mono">10.200.10.0/24</div>
              <div className="text-emerald-400 text-[11px]">● Air-Gapped Physical Camera Network</div>
              <p className="text-[10.5px] text-slate-400 pt-1 border-t border-slate-800">
                16 RTSP border cameras and PTZ servos. Zero direct internet access.
              </p>
            </div>

            <div className="p-4 bg-[#080E18] border border-slate-800 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">VLAN 20: Command Nodes</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>
              <div className="text-base font-bold text-white font-mono">10.200.20.0/24</div>
              <div className="text-cyan-400 text-[11px]">● IPsec VPN Encrypted Tunnel</div>
              <p className="text-[10.5px] text-slate-400 pt-1 border-t border-slate-800">
                Joint Operations Room consoles, video wall decoders, and commander terminals.
              </p>
            </div>

            <div className="p-4 bg-[#080E18] border border-slate-800 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-bold">VLAN 30: Edge AI & Drones</span>
                <span className="w-2 h-2 rounded-full bg-purple-400" />
              </div>
              <div className="text-base font-bold text-white font-mono">10.200.30.0/24</div>
              <div className="text-purple-400 text-[11px]">● Strict Stateful Egress Inspection</div>
              <p className="text-[10.5px] text-slate-400 pt-1 border-t border-slate-800">
                NVIDIA Jetson edge nodes, MAVLink UAV transceivers, and ANPR inference servers.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SecurityCenter;

