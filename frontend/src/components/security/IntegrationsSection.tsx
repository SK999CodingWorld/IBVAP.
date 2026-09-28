import React, { useState, useEffect } from 'react';
import { 
  Network, Plus, RefreshCw, Check, Trash2, Globe, Shield, Activity, 
  ExternalLink, Zap, Lock, Radio, Server, CheckCircle2, AlertTriangle, 
  Copy, Play, Pause, ChevronRight, X, ArrowUpRight, Terminal, Wifi
} from 'lucide-react';

export interface IntegrationItem {
  id: string;
  name: string;
  category: string;
  protocol: string;
  endpoint_url: string;
  auth_type: string;
  events: string[];
  status: 'active' | 'paused';
  ping_ms: number;
  health_pct: number;
  last_sync: string;
  success_rate: string;
  description: string;
}

const defaultIntegrations: IntegrationItem[] = [
  {
    id: "int-01",
    name: "NATGRID Defense Intelligence Hub",
    category: "Defense & Law Enforcement",
    protocol: "mTLS / REST Gateway",
    endpoint_url: "https://gateway.natgrid.gov.in/v2/ingest/border-alerts",
    auth_type: "Mutual X.509 Certificate",
    events: ["CRITICAL_ALERTS", "ANPR_HOTLIST_MATCH", "FENCE_BREACH"],
    status: "active",
    ping_ms: 18,
    health_pct: 99.98,
    last_sync: "12 secs ago",
    success_rate: "100%",
    description: "Direct automated encrypted telemetry pipeline with National Intelligence Grid for instant terrorist & watchlist correlation."
  },
  {
    id: "int-02",
    name: "MAVLink Drone Fleet Telemetry (Sector 04 UAVs)",
    category: "Autonomous Surveillance",
    protocol: "UDP / MAVLink v2.0 Stream",
    endpoint_url: "udp://10.200.30.45:14550",
    auth_type: "HMAC-SHA256 Token",
    events: ["DRONE_GPS_TELEMETRY", "GIMBAL_TARGETING", "FLIGHT_PATH"],
    status: "active",
    ping_ms: 4,
    health_pct: 100.0,
    last_sync: "1 sec ago",
    success_rate: "99.9%",
    description: "Bidirectional mission routing and gimbal telemetry sync with 4 autonomous quadcopter border patrol drones."
  },
  {
    id: "int-03",
    name: "MoRTH Vahan & Sarathi National Registry",
    category: "ANPR & Vehicle Verification",
    protocol: "SOAP / REST Bridge",
    endpoint_url: "https://vahan.parivahan.gov.in/vahan-service/api/vehicle/lookup",
    auth_type: "Bearer HMAC Token",
    events: ["ANPR_PLATE_READ", "STOLEN_VEHICLE_CHECK"],
    status: "active",
    ping_ms: 42,
    health_pct: 98.9,
    last_sync: "3 mins ago",
    success_rate: "99.4%",
    description: "National vehicle database sync for instantaneous stolen vehicle, blacklisted chassis, and fake plate alerts at checkpoints."
  },
  {
    id: "int-04",
    name: "Border PA Acoustic Warning & Siren Grid",
    category: "Tactical Deterrence",
    protocol: "Modbus TCP / IP Gateway",
    endpoint_url: "tcp://10.200.10.120:502",
    auth_type: "Air-Gapped VLAN 10",
    events: ["SIREN_TRIGGER", "AUDIO_WARN_BROADCAST", "STROBE_ALARM"],
    status: "active",
    ping_ms: 8,
    health_pct: 99.9,
    last_sync: "10 mins ago",
    success_rate: "100%",
    description: "Hardware relay control triggering high-decibel directional acoustic deterrents and strobe lights on perimeter fences."
  },
  {
    id: "int-05",
    name: "SSB QRT Rapid Response Tactical Webhook",
    category: "Patrol Dispatch",
    protocol: "HTTPS Webhook (JSON)",
    endpoint_url: "https://alerts.bordersecurity.internal/webhook/qrt-dispatch",
    auth_type: "HMAC-SHA256 Signature",
    events: ["QRT_DISPATCH_DIRECTIVE", "BREACH_ALERT_ESCALATION"],
    status: "active",
    ping_ms: 24,
    health_pct: 99.5,
    last_sync: "25 mins ago",
    success_rate: "99.8%",
    description: "Pushes instant encrypted tactical response directives to handheld terminal devices carried by Quick Reaction Teams in the field."
  },
  {
    id: "int-06",
    name: "Enterprise SIEM / Syslog Forwarder (CEF)",
    category: "Audit & Compliance",
    protocol: "Syslog RFC 5424 over TLS",
    endpoint_url: "tls://siem.hq.internal:6514",
    auth_type: "mTLS Client Cert",
    events: ["AUDIT_LOGS", "AUTH_EVENTS", "SYSTEM_TAMPERING"],
    status: "active",
    ping_ms: 11,
    health_pct: 100.0,
    last_sync: "Real-Time Streaming",
    success_rate: "100%",
    description: "Standardized Common Event Format (CEF) log forwarding to military Security Operations Center (SOC) Splunk/Sentinel clusters."
  }
];

export const IntegrationsSection: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationItem[]>(defaultIntegrations);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Defense & Law Enforcement');
  const [newProtocol, setNewProtocol] = useState('HTTPS Webhook (JSON)');
  const [newEndpoint, setNewEndpoint] = useState('');
  const [newAuthType, setNewAuthType] = useState('HMAC-SHA256 Signature');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['CRITICAL_ALERTS', 'FENCE_BREACH']);

  // Fetch from backend
  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/security/integrations');
      if (res.ok) {
        const data = await res.json();
        if (data.integrations && data.integrations.length > 0) {
          setIntegrations(data.integrations);
        }
      }
    } catch (e) {
      console.warn('Using local integrations fallback:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`/api/security/integrations/${id}/toggle`, { method: 'PUT' });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: data.new_status } : i));
      } else {
        setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: i.status === 'active' ? 'paused' : 'active' } : i));
      }
    } catch (e) {
      setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: i.status === 'active' ? 'paused' : 'active' } : i));
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await fetch(`/api/security/integrations/${id}/test`, { method: 'POST' });
      const data = await res.json();
      setTestResult(data);
      if (data.ping_ms) {
        setIntegrations(prev => prev.map(i => i.id === id ? { ...i, ping_ms: data.ping_ms, last_sync: 'Just now' } : i));
      }
    } catch (e) {
      setTestResult({
        status: 'error',
        message: 'Handshake failed or endpoint unreachable',
        handshake_result: String(e)
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this external integration?')) return;
    try {
      await fetch(`/api/security/integrations/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn(e);
    }
    setIntegrations(prev => prev.filter(i => i.id !== id));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEndpoint.trim()) return;

    try {
      const res = await fetch('/api/security/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          category: newCategory,
          protocol: newProtocol,
          endpoint_url: newEndpoint.trim(),
          auth_type: newAuthType,
          events: selectedEvents
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.integration) {
          setIntegrations(prev => [...prev, data.integration]);
        }
      } else {
        const localItem: IntegrationItem = {
          id: `int-${Date.now().toString(36)}`,
          name: newName.trim(),
          category: newCategory,
          protocol: newProtocol,
          endpoint_url: newEndpoint.trim(),
          auth_type: newAuthType,
          events: selectedEvents,
          status: 'active',
          ping_ms: 16,
          health_pct: 100.0,
          last_sync: 'Just now',
          success_rate: '100%',
          description: `Custom ${newCategory} connector.`
        };
        setIntegrations(prev => [...prev, localItem]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setShowAddModal(false);
      setNewName('');
      setNewEndpoint('');
    }
  };

  const allEventsList = [
    'CRITICAL_ALERTS', 'ANPR_HOTLIST_MATCH', 'FENCE_BREACH', 
    'DRONE_GPS_TELEMETRY', 'GIMBAL_TARGETING', 'ANPR_PLATE_READ', 
    'STOLEN_VEHICLE_CHECK', 'SIREN_TRIGGER', 'QRT_DISPATCH_DIRECTIVE', 
    'AUDIT_LOGS', 'SYSTEM_TAMPERING'
  ];

  return (
    <div className="space-y-6">
      
      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-cyan-500/30 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <Network size={22} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white font-mono">
                {integrations.filter(i => i.status === 'active').length} / {integrations.length}
              </div>
              <div className="text-xs text-slate-400">Active Connectors</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">All Bridges Operational</div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-8 opacity-75">
            {[70, 85, 90, 80, 95, 100, 100].map((h, i) => (
              <div key={i} className="w-1.5 bg-cyan-500/40 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Activity size={22} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-emerald-400 font-mono">99.8%</div>
              <div className="text-xs text-slate-400">Delivery Success Rate</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Zero dropped alerts</div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-8 opacity-75">
            {[100, 100, 100, 98, 100, 100, 100].map((h, i) => (
              <div key={i} className="w-1.5 bg-emerald-500/40 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Wifi size={22} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-blue-400 font-mono">16 ms</div>
              <div className="text-xs text-slate-400">Average Ping Latency</div>
              <div className="text-[10px] text-blue-400 mt-0.5">mTLS & UDP low-overhead</div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-8 opacity-75">
            {[22, 18, 14, 16, 12, 19, 16].map((h, i) => (
              <div key={i} className="w-1.5 bg-blue-500/40 rounded-t" style={{ height: `${h * 4}%` }} />
            ))}
          </div>
        </div>

        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-purple-500/30 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <Lock size={22} />
            </div>
            <div>
              <div className="text-xl font-extrabold text-purple-300">mTLS / HMAC</div>
              <div className="text-xs text-slate-400">Transport Security</div>
              <div className="text-[10px] text-purple-400 mt-0.5">Hardware Attested</div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-8 opacity-75">
            {[100, 100, 100, 100, 100, 100, 100].map((h, i) => (
              <div key={i} className="w-1.5 bg-purple-500/40 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Main Integrations Hub Card */}
      <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" /> Connected Tactical Integrations & Webhooks
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Automated data synchronization with Defense C4ISR, Drone Fleets, State RTO databases, and Acoustic PA Grids
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchIntegrations}
              disabled={loading}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 border border-slate-700 cursor-pointer"
              title="Refresh Integrations Status"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Plus size={15} /> Add Custom Integration
            </button>
          </div>
        </div>

        {/* Live Test Feedback Banner */}
        {testResult && (
          <div className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs font-mono animate-in fade-in-50 ${
            testResult.status === 'success' 
              ? 'bg-[#061B16] border-emerald-500/50 text-emerald-300' 
              : 'bg-[#1E0B0B] border-red-500/50 text-red-300'
          }`}>
            <div className="space-y-1">
              <div className="font-bold flex items-center gap-2">
                {testResult.status === 'success' ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : (
                  <AlertTriangle size={16} className="text-red-400" />
                )}
                <span>PING PROBE RESULT FOR: {testResult.name || testResult.id}</span>
              </div>
              <div className="text-[11px] opacity-90">{testResult.handshake_result}</div>
              {testResult.ping_ms && (
                <div className="text-[10px] text-cyan-300">
                  Round-Trip Latency: <strong>{testResult.ping_ms} ms</strong> · Echo Timestamp: {testResult.timestamp}
                </div>
              )}
            </div>
            <button onClick={() => setTestResult(null)} className="opacity-70 hover:opacity-100 p-1 cursor-pointer">
              <X size={15} />
            </button>
          </div>
        )}

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {integrations.map((item) => {
            const isActive = item.status === 'active';
            const isTesting = testingId === item.id;

            return (
              <div 
                key={item.id}
                className={`p-4 rounded-xl border transition-all space-y-3 relative group bg-[#070D18] ${
                  isActive 
                    ? 'border-slate-800/90 hover:border-cyan-500/40 shadow-sm' 
                    : 'border-slate-800/40 opacity-70 hover:opacity-90'
                }`}
              >
                {/* Header & Badges */}
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-xs sm:text-sm tracking-wide truncate">
                        {item.name}
                      </h3>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        isActive 
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40' 
                          : 'bg-amber-950/80 text-amber-400 border border-amber-500/40'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="text-cyan-400 font-semibold">{item.category}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">{item.protocol}</span>
                    </div>
                  </div>

                  {/* Latency & Health Indicator */}
                  <div className="flex flex-col items-end flex-shrink-0 text-right font-mono text-[11px]">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{item.ping_ms} ms</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{item.health_pct}% uptime</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {item.description}
                </p>

                {/* Endpoint URL Pill */}
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#040810] border border-slate-800/80 font-mono text-[11px]">
                  <span className="truncate text-slate-400 text-[10.5px]">
                    {item.endpoint_url}
                  </span>
                  <button
                    onClick={() => handleCopy(item.endpoint_url, item.id)}
                    title="Copy Endpoint URL"
                    className="p-1 hover:text-cyan-400 text-slate-500 transition-colors flex-shrink-0 cursor-pointer"
                  >
                    {copiedId === item.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>

                {/* Subscribed Events Tags */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Subscribed Pipeline Events:</span>
                  <div className="flex flex-wrap gap-1">
                    {item.events.map((ev) => (
                      <span
                        key={ev}
                        className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20 text-cyan-300"
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center gap-1 text-[10.5px] font-mono text-slate-400">
                    <span>Sync: </span>
                    <strong className="text-slate-200">{item.last_sync}</strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Live Ping Handshake Button */}
                    <button
                      onClick={() => handleTestConnection(item.id)}
                      disabled={isTesting}
                      className="px-2.5 py-1 rounded bg-[#0A1626] hover:bg-[#0D223D] border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Zap size={12} className={isTesting ? 'animate-bounce text-amber-400' : 'text-cyan-400'} />
                      <span>{isTesting ? 'Pinging...' : 'Test Ping'}</span>
                    </button>

                    {/* Toggle Active / Pause */}
                    <button
                      onClick={() => handleToggle(item.id)}
                      title={isActive ? 'Pause Integration' : 'Activate Integration'}
                      className={`p-1.5 rounded border transition-colors cursor-pointer ${
                        isActive 
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      {isActive ? <Pause size={13} /> : <Play size={13} />}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      title="Remove Integration"
                      className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Webhook HMAC Security Verification & Ingest Guide */}
      <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" /> Webhook Cryptographic Verification Spec
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Verify the authenticity of incoming border intelligence webhooks using HMAC-SHA256 signatures
            </p>
          </div>
          <span className="text-[10px] font-mono bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
            FIPS 198-1 Compliant
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
          <div className="space-y-2 bg-[#060910] border border-slate-800 rounded-xl p-4">
            <span className="text-cyan-400 font-bold block text-[11px]">// Standard Webhook Delivery Headers</span>
            <div className="text-slate-300 space-y-1 text-[11px]">
              <div><span className="text-amber-300">X-IBVAP-Signature:</span> sha256=4f9b2c...</div>
              <div><span className="text-amber-300">X-IBVAP-Timestamp:</span> 1789230491</div>
              <div><span className="text-amber-300">X-IBVAP-Event:</span> CRITICAL_ALERTS</div>
              <div><span className="text-amber-300">X-IBVAP-Delivery-ID:</span> del_7a9f82c401</div>
            </div>
          </div>

          <div className="space-y-2 bg-[#060910] border border-slate-800 rounded-xl p-4">
            <span className="text-emerald-400 font-bold block text-[11px]">// Python HMAC Verification Snippet</span>
            <pre className="text-slate-300 text-[10.5px] overflow-x-auto">
              <span className="text-purple-400">import</span> hmac, hashlib<br />
              sig = hmac.new(SECRET.encode(), payload, hashlib.sha256).hexdigest()<br />
              is_valid = hmac.compare_digest(<span className="text-emerald-300">f"sha256=&#123;sig&#125;"</span>, header_sig)
            </pre>
          </div>
        </div>
      </div>

      {/* Add Custom Integration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0F18] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Network size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Add Tactical Defense Integration</h3>
                  <p className="text-[11px] text-slate-400">Connect a C4ISR hub, UAV swarm, or external dispatch webhook</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">System / Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Army Aviation UAV Sector Relay"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#070B12] border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-[#070B12] border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Defense & Law Enforcement">Defense & Law Enforcement</option>
                    <option value="Autonomous Surveillance">Autonomous Surveillance</option>
                    <option value="Patrol Dispatch">Patrol Dispatch</option>
                    <option value="ANPR & Vehicle Verification">ANPR & Vehicle Verification</option>
                    <option value="Tactical Deterrence">Tactical Deterrence</option>
                    <option value="Audit & Compliance">Audit & Compliance</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Protocol</label>
                  <select
                    value={newProtocol}
                    onChange={(e) => setNewProtocol(e.target.value)}
                    className="w-full bg-[#070B12] border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="HTTPS Webhook (JSON)">HTTPS Webhook (JSON)</option>
                    <option value="mTLS / REST Gateway">mTLS / REST Gateway</option>
                    <option value="UDP / MAVLink v2.0 Stream">UDP / MAVLink v2.0</option>
                    <option value="Syslog RFC 5424 over TLS">Syslog RFC 5424 over TLS</option>
                    <option value="Modbus TCP / IP Gateway">Modbus TCP / IP</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Endpoint / Webhook Destination URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://your-domain.gov.in/api/v1/webhook"
                  value={newEndpoint}
                  onChange={(e) => setNewEndpoint(e.target.value)}
                  className="w-full bg-[#070B12] border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Authentication Mechanism</label>
                <select
                  value={newAuthType}
                  onChange={(e) => setNewAuthType(e.target.value)}
                  className="w-full bg-[#070B12] border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="HMAC-SHA256 Signature">HMAC-SHA256 Signature</option>
                  <option value="Mutual X.509 Certificate">Mutual X.509 Certificate (mTLS)</option>
                  <option value="Bearer HMAC Token">Bearer HMAC Token</option>
                  <option value="Air-Gapped VLAN 10">Air-Gapped VLAN Isolation</option>
                </select>
              </div>

              {/* Event Subscriptions */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">Subscribed Pipeline Events</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {allEventsList.map((ev) => {
                    const isChecked = selectedEvents.includes(ev);
                    return (
                      <div
                        key={ev}
                        onClick={() => {
                          setSelectedEvents(prev => 
                            prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]
                          );
                        }}
                        className={`p-2 rounded border cursor-pointer text-[10px] font-mono flex items-center gap-1.5 ${
                          isChecked 
                            ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' 
                            : 'bg-[#070B12] border-slate-800 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                        />
                        <span className="truncate">{ev}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  Register Integration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default IntegrationsSection;
