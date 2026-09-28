import React, { useState, useEffect } from 'react';
import { 
  Key, Plus, Copy, Check, Trash2, RefreshCw, Shield, AlertTriangle, 
  Terminal, Code2, Globe, Clock, CheckCircle2, Lock, Zap, ExternalLink,
  ChevronDown, X, ShieldAlert, Sparkles, AlertCircle, Play
} from 'lucide-react';

export interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  masked_key: string;
  scopes: string[];
  created_at: string;
  last_used: string;
  status: 'active' | 'revoked';
  rate_limit: number;
  expires_at: string;
}

const defaultApiKeys: ApiKeyItem[] = [
  {
    id: 'key_01',
    name: 'Border-Drone-Telemetry-Relay',
    prefix: 'ibvap_live_9f82',
    masked_key: 'ibvap_live_9f82••••••••••••4e1a',
    scopes: ['streams:read', 'telemetry:write', 'zones:read'],
    created_at: '2026-09-01T08:30:00Z',
    last_used: '2 mins ago',
    status: 'active',
    rate_limit: 120,
    expires_at: '2026-12-01T08:30:00Z'
  },
  {
    id: 'key_02',
    name: 'ANPR-Checkpoint-Sync-Service',
    prefix: 'ibvap_live_4b71',
    masked_key: 'ibvap_live_4b71••••••••••••8c3d',
    scopes: ['anpr:read', 'anpr:write', 'alerts:read'],
    created_at: '2026-09-10T11:15:00Z',
    last_used: '15 secs ago',
    status: 'active',
    rate_limit: 60,
    expires_at: '2027-09-10T11:15:00Z'
  },
  {
    id: 'key_03',
    name: 'Central-Command-HQ-Mirror',
    prefix: 'ibvap_live_7c99',
    masked_key: 'ibvap_live_7c99••••••••••••2f0b',
    scopes: ['admin:all', 'evidence:export', 'audit:read'],
    created_at: '2026-08-20T14:00:00Z',
    last_used: '1 hour ago',
    status: 'active',
    rate_limit: 300,
    expires_at: '2027-08-20T14:00:00Z'
  },
  {
    id: 'key_04',
    name: 'Deprecated-Legacy-Edge-Node',
    prefix: 'ibvap_live_1a2b',
    masked_key: 'ibvap_live_1a2b••••••••••••99ff',
    scopes: ['streams:read'],
    created_at: '2026-06-01T00:00:00Z',
    last_used: '45 days ago',
    status: 'revoked',
    rate_limit: 30,
    expires_at: '2026-09-01T00:00:00Z'
  }
];

const availableScopes = [
  { id: 'streams:read', label: 'streams:read', desc: 'Stream live RTSP/MJPEG video feeds from border outpost cameras' },
  { id: 'telemetry:write', label: 'telemetry:write', desc: 'Push drone GPS, aircraft positions, and radar coordinates' },
  { id: 'alerts:manage', label: 'alerts:manage', desc: 'Acknowledge, escalate, and resolve threat warnings' },
  { id: 'anpr:ingest', label: 'anpr:ingest', desc: 'Write license plate readings from checkpoint OCR scanners' },
  { id: 'evidence:export', label: 'evidence:export', desc: 'Download cryptographically signed video evidence archives' },
  { id: 'zones:read', label: 'zones:read', desc: 'Query calibrated virtual tripwire polygons and coordinates' },
];

export const ApiKeySection: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(defaultApiKeys);
  const [loading, setLoading] = useState(false);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [codeTab, setCodeTab] = useState<'curl' | 'python' | 'node'>('curl');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyExpires, setNewKeyExpires] = useState(90);
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(60);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['streams:read', 'telemetry:write']);
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Interactive Test Console State
  const [testKey, setTestKey] = useState<string>('ibvap_live_9f824e1a_sample_key');
  const [testEndpoint, setTestEndpoint] = useState<string>('/api/cameras');
  const [testMethod, setTestMethod] = useState<'GET' | 'POST'>('GET');
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestResponse, setApiTestResponse] = useState<any | null>(null);

  const handleRunApiTest = async () => {
    setIsTestingApi(true);
    setApiTestResponse(null);
    try {
      const res = await fetch('/api/security/api-keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key_token: testKey,
          endpoint: testEndpoint,
          method: testMethod
        })
      });
      const data = await res.json();
      setApiTestResponse(data);
    } catch (e) {
      setApiTestResponse({
        status: 'error',
        http_code: 500,
        message: String(e)
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  // Fetch keys from backend API
  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/security/api-keys');
      if (res.ok) {
        const data = await res.json();
        if (data.keys && data.keys.length > 0) {
          setApiKeys(data.keys);
          if (data.keys[0]?.prefix) {
            setTestKey(`${data.keys[0].prefix}_sample_key`);
          }
        }
      }
    } catch (e) {
      console.warn('Using local API keys fallback:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleToggleScope = (scopeId: string) => {
    setSelectedScopes(prev => 
      prev.includes(scopeId) ? prev.filter(s => s !== scopeId) : [...prev, scopeId]
    );
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const res = await fetch('/api/security/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim(),
          scopes: selectedScopes,
          expires_in_days: Number(newKeyExpires),
          rate_limit: Number(newKeyRateLimit)
        })
      });

      if (res.ok) {
        const data = await res.json();
        setNewlyCreatedSecret(data.raw_token);
        if (data.key) {
          setApiKeys(prev => [data.key, ...prev]);
        }
      } else {
        // Fallback local creation
        const hex = Math.random().toString(16).substring(2, 10);
        const secret = `ibvap_live_${hex}_${Math.random().toString(16).substring(2, 14)}`;
        const localKey: ApiKeyItem = {
          id: `key_${hex.substring(0, 4)}`,
          name: newKeyName.trim(),
          prefix: `ibvap_live_${hex.substring(0, 4)}`,
          masked_key: `ibvap_live_${hex.substring(0, 4)}••••••••••••${hex.substring(4, 8)}`,
          scopes: selectedScopes,
          created_at: new Date().toISOString(),
          last_used: 'Never',
          status: 'active',
          rate_limit: newKeyRateLimit,
          expires_at: new Date(Date.now() + newKeyExpires * 86400000).toISOString()
        };
        setNewlyCreatedSecret(secret);
        setApiKeys(prev => [localKey, ...prev]);
      }
    } catch (e) {
      console.error('Error generating key:', e);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Connected drones or services using it will be immediately disconnected.')) return;
    try {
      await fetch(`/api/security/api-keys/${keyId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn(e);
    }
    setApiKeys(prev => prev.map(k => k.id === keyId ? { ...k, status: 'revoked' } : k));
  };

  const handleRegenerateKey = async (keyId: string) => {
    if (!confirm('Regenerate this API key? The existing secret token will become invalid immediately.')) return;
    try {
      const res = await fetch(`/api/security/api-keys/${keyId}/regenerate`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setNewlyCreatedSecret(data.raw_token);
        setShowCreateModal(true);
        if (data.key) {
          setApiKeys(prev => prev.map(k => k.id === keyId ? data.key : k));
        }
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const activeKeysCount = apiKeys.filter(k => k.status === 'active').length;
  const revokedKeysCount = apiKeys.filter(k => k.status === 'revoked').length;

  return (
    <div className="space-y-6">
      
      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-cyan-500/30 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <Key size={22} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white font-mono">{activeKeysCount}</div>
              <div className="text-xs text-slate-400">Active API Keys</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{revokedKeysCount} Revoked Tokens</div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-8 opacity-75">
            {[40, 50, 60, 70, 75, 85, 95].map((h, i) => (
              <div key={i} className="w-1.5 bg-cyan-500/40 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-blue-500/30 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Globe size={22} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-blue-400 font-mono">14,892</div>
              <div className="text-xs text-slate-400">Daily Requests (24h)</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">14.8% of daily quota</div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-8 opacity-75">
            {[30, 45, 60, 80, 55, 90, 75].map((h, i) => (
              <div key={i} className="w-1.5 bg-blue-500/40 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Zap size={22} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-emerald-400 font-mono">120</div>
              <div className="text-xs text-slate-400">Default Rate Limit</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Peak load: 38 req/min</div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-8 opacity-75">
            {[60, 60, 60, 60, 60, 60, 60].map((h, i) => (
              <div key={i} className="w-1.5 bg-emerald-500/40 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-purple-500/30 transition-all">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <Lock size={22} />
            </div>
            <div>
              <div className="text-xl font-extrabold text-purple-300">HMAC-SHA256</div>
              <div className="text-xs text-slate-400">Auth Signature</div>
              <div className="text-[10px] text-purple-400 mt-0.5">Hardware TPM Attested</div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-8 opacity-75">
            {[100, 100, 100, 100, 100, 100, 100].map((h, i) => (
              <div key={i} className="w-1.5 bg-purple-500/40 rounded-t" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Main Keys List Card */}
      <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" /> Active API Keys & Integrations
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Secure authentication tokens for autonomous surveillance drones, checkpoints, and external C4ISR systems
            </p>
          </div>

          <button
            onClick={() => {
              setNewlyCreatedSecret(null);
              setNewKeyName('');
              setShowCreateModal(true);
            }}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus size={15} /> Generate New Key
          </button>
        </div>

        {/* Keys Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] text-slate-400 uppercase tracking-wider bg-[#080E18] border-b border-slate-800/80">
              <tr>
                <th className="py-3 px-4">Integration Name</th>
                <th className="py-3 px-4">Key Token</th>
                <th className="py-3 px-4">Permissions / Scopes</th>
                <th className="py-3 px-4">Last Used</th>
                <th className="py-3 px-4">Rate Limit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {apiKeys.map((key) => {
                const isActive = key.status === 'active';
                return (
                  <tr key={key.id} className="hover:bg-slate-800/25 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-xs">{key.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {key.id}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-300 text-xs bg-[#070B12] px-2.5 py-1 rounded border border-slate-800 select-all">
                          {key.masked_key}
                        </span>
                        <button
                          onClick={() => handleCopy(key.masked_key, key.id)}
                          title="Copy Key Token"
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                          {copiedKeyId === key.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {key.scopes.map((s) => (
                          <span 
                            key={s} 
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${
                              s.includes('admin') ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                              s.includes('streams') ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' :
                              s.includes('anpr') ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                              'bg-purple-500/15 text-purple-400 border-purple-500/30'
                            }`}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400 text-xs">
                      {key.last_used}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300 text-xs">
                      {key.rate_limit} req/min
                    </td>

                    <td className="py-3 px-4">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-red-400 font-semibold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> REVOKED
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleRegenerateKey(key.id)}
                          title="Regenerate Token"
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                          <RefreshCw size={14} />
                        </button>
                        {isActive && (
                          <button
                            onClick={() => handleRevokeKey(key.id)}
                            title="Revoke Token"
                            className="p-1.5 hover:bg-red-500/10 rounded text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Code Integration Quickstart */}
      <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" /> API Integration & Code Snippets
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Authenticate automated camera nodes, drones, or telemetry agents with the IBVAP REST API
            </p>
          </div>

          <div className="flex gap-1 bg-[#080E18] p-1 rounded-lg border border-slate-800">
            {(['curl', 'python', 'node'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setCodeTab(tab)}
                className={`px-3 py-1 rounded text-xs font-mono font-semibold uppercase transition-all ${
                  codeTab === tab
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Code Block Container */}
        <div className="relative rounded-xl overflow-hidden bg-[#060910] border border-slate-800/90 p-4 font-mono text-xs">
          <button
            onClick={() => {
              const code = codeTab === 'curl' ? `curl -X GET "http://localhost:8001/api/cameras" \\\n  -H "Authorization: Bearer ibvap_live_9f82..." \\\n  -H "Content-Type: application/json"` :
                           codeTab === 'python' ? `import requests\n\nheaders = {"Authorization": "Bearer ibvap_live_9f82..."}\nresponse = requests.get("http://localhost:8001/api/dashboard/kpis", headers=headers)\nprint(response.json())` :
                           `const response = await fetch("http://localhost:8001/api/stream/alerts", {\n  headers: { "Authorization": "Bearer ibvap_live_9f82..." }\n});\nconst data = await response.json();`;
              handleCopy(code, 'snippet');
            }}
            className="absolute top-3 right-3 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] flex items-center gap-1 border border-slate-700 transition-colors"
          >
            {copiedKeyId === 'snippet' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>Copy Snippet</span>
          </button>

          {codeTab === 'curl' && (
            <pre className="text-slate-300 overflow-x-auto">
              <span className="text-cyan-400">curl</span> -X GET <span className="text-emerald-300">"http://localhost:8001/api/cameras"</span> \<br />
              &nbsp;&nbsp;-H <span className="text-amber-300">"Authorization: Bearer ibvap_live_9f824e1a_sample_key"</span> \<br />
              &nbsp;&nbsp;-H <span className="text-amber-300">"Content-Type: application/json"</span>
            </pre>
          )}

          {codeTab === 'python' && (
            <pre className="text-slate-300 overflow-x-auto">
              <span className="text-purple-400">import</span> requests<br /><br />
              headers = &#123;<br />
              &nbsp;&nbsp;<span className="text-emerald-300">"Authorization"</span>: <span className="text-amber-300">"Bearer ibvap_live_9f824e1a_sample_key"</span>,<br />
              &nbsp;&nbsp;<span className="text-emerald-300">"Content-Type"</span>: <span className="text-amber-300">"application/json"</span><br />
              &#125;<br /><br />
              response = requests.get(<span className="text-emerald-300">"http://localhost:8001/api/dashboard/kpis"</span>, headers=headers)<br />
              <span className="text-cyan-400">print</span>(response.json())
            </pre>
          )}

          {codeTab === 'node' && (
            <pre className="text-slate-300 overflow-x-auto">
              <span className="text-purple-400">const</span> response = <span className="text-purple-400">await</span> <span className="text-cyan-400">fetch</span>(<span className="text-emerald-300">"http://localhost:8001/api/stream/alerts"</span>, &#123;<br />
              &nbsp;&nbsp;headers: &#123; <span className="text-emerald-300">"Authorization"</span>: <span className="text-amber-300">"Bearer ibvap_live_9f824e1a_sample_key"</span> &#125;<br />
              &#125;);<br />
              <span className="text-purple-400">const</span> data = <span className="text-purple-400">await</span> response.json();<br />
              console.log(data);
            </pre>
          )}
        </div>
      </div>

      {/* Interactive API Key Sandbox & Endpoint Tester */}
      <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800/80">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" /> Interactive API Key Sandbox & Token Validator
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live simulation tool to test authentication, permission scopes, and response latencies
            </p>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded">
            Live Test Console
          </span>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          {/* Key Selection */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">Target Bearer Token</label>
            <div className="relative">
              <input
                type="text"
                value={testKey}
                onChange={(e) => setTestKey(e.target.value)}
                placeholder="ibvap_live_..."
                className="w-full bg-[#070B12] border border-slate-800 rounded-lg p-2 font-mono text-[11px] text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
            {apiKeys.length > 0 && (
              <div className="flex gap-1.5 flex-wrap pt-0.5">
                {apiKeys.slice(0, 3).map((k) => (
                  <button
                    key={k.id}
                    onClick={() => setTestKey(`${k.prefix}_sample_key`)}
                    className="text-[9px] font-mono text-slate-400 hover:text-cyan-400 underline cursor-pointer"
                  >
                    Use {k.name.split('-')[0]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Endpoint Selection */}
          <div className="md:col-span-5 space-y-1">
            <label className="text-[11px] font-semibold text-slate-300">API Endpoint</label>
            <select
              value={testEndpoint}
              onChange={(e) => setTestEndpoint(e.target.value)}
              className="w-full bg-[#070B12] border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="/api/cameras">GET /api/cameras (Camera Registry)</option>
              <option value="/api/dashboard/kpis">GET /api/dashboard/kpis (Operational KPIs)</option>
              <option value="/api/stream/alerts">GET /api/stream/alerts (Threat Alerts Stream)</option>
              <option value="/api/anpr">GET /api/anpr (ANPR Intelligence)</option>
              <option value="/api/security/overview">GET /api/security/overview (Security Posture)</option>
              <option value="/api/health">GET /api/health (System Diagnostics)</option>
            </select>
          </div>

          {/* Action Button */}
          <div className="md:col-span-3 flex items-end">
            <button
              onClick={handleRunApiTest}
              disabled={isTestingApi}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold p-2 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play size={13} className={isTestingApi ? 'animate-spin' : ''} />
              <span>{isTestingApi ? 'Executing...' : 'Send Request'}</span>
            </button>
          </div>
        </div>

        {/* Live Test Response Panel */}
        {apiTestResponse && (
          <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#060910] text-xs font-mono animate-in fade-in-50">
            <div className="flex justify-between items-center px-4 py-2 bg-[#090E17] border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  apiTestResponse.http_code === 200 
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' 
                    : 'bg-red-950 text-red-400 border border-red-500/40'
                }`}>
                  HTTP {apiTestResponse.http_code}
                </span>
                <span className="text-slate-300 font-semibold">{apiTestResponse.message}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                {apiTestResponse.latency_ms && (
                  <span className="text-emerald-400">
                    Latency: <strong>{apiTestResponse.latency_ms} ms</strong>
                  </span>
                )}
                <button
                  onClick={() => setApiTestResponse(null)}
                  className="text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2">
              <div className="text-[10.5px] text-slate-500">
                RESPONSE BODY:
              </div>
              <pre className="text-emerald-300 text-[11px] overflow-x-auto max-h-48 custom-scrollbar">
                {JSON.stringify(apiTestResponse.response || apiTestResponse, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Generate API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A0F18] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Generate Military API Token</h3>
                  <p className="text-[11px] text-slate-400">Create an authenticated HMAC-SHA256 integration key</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* If Key Secret Newly Created */}
            {newlyCreatedSecret ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <CheckCircle2 size={16} /> API Key Generated Successfully
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Copy this key immediately. For defense security, this secret token is never shown again in plain text.
                  </p>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      readOnly
                      value={newlyCreatedSecret}
                      className="w-full bg-[#070B12] border border-emerald-500/50 rounded-lg p-2.5 font-mono text-xs text-emerald-300 select-all"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newlyCreatedSecret);
                        setCopiedSecret(true);
                        setTimeout(() => setCopiedSecret(false), 2000);
                      }}
                      className="px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      {copiedSecret ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedSecret ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewlyCreatedSecret(null);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Done & Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Integration / Service Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Patrol-Unit-4-Mobile-Feed"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full bg-[#070B12] border border-slate-800 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Token Expiration</label>
                    <select
                      value={newKeyExpires}
                      onChange={(e) => setNewKeyExpires(Number(e.target.value))}
                      className="w-full bg-[#070B12] border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value={30}>30 Days (Temporary)</option>
                      <option value={90}>90 Days (Standard)</option>
                      <option value={365}>1 Year (Long-Term)</option>
                      <option value={3650}>Never (Permanent Infrastructure)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Rate Limit Quota</label>
                    <select
                      value={newKeyRateLimit}
                      onChange={(e) => setNewKeyRateLimit(Number(e.target.value))}
                      className="w-full bg-[#070B12] border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value={30}>30 requests / minute</option>
                      <option value={60}>60 requests / minute</option>
                      <option value={120}>120 requests / minute (High)</option>
                      <option value={300}>300 requests / minute (Burst)</option>
                    </select>
                  </div>
                </div>

                {/* Scopes Selection */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-300 block">Granted Scopes & Capabilities</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {availableScopes.map((scope) => {
                      const isChecked = selectedScopes.includes(scope.id);
                      return (
                        <div
                          key={scope.id}
                          onClick={() => handleToggleScope(scope.id)}
                          className={`p-2.5 rounded-lg border cursor-pointer transition-colors flex items-start gap-2.5 ${
                            isChecked
                              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                              : 'bg-[#070B12] border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-0.5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                          />
                          <div>
                            <div className="font-mono font-bold text-xs">{scope.label}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{scope.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                  >
                    Generate Token
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ApiKeySection;
