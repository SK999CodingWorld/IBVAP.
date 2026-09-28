import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  Server, Cpu, Database, Network, HardDrive, 
  Activity, ArrowDownToLine, Signal, SignalZero, WifiOff, RefreshCw,
  AlertTriangle, ShieldCheck, Zap, CheckCircle2, AlertCircle, ArrowUpRight
} from 'lucide-react';

const CircularProgress = ({ value, colorClass, size = 68, strokeWidth = 7 }: { value: number, colorClass: string, size?: number, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle 
          cx={size / 2} cy={size / 2} r={radius} 
          stroke="currentColor" strokeWidth={strokeWidth} 
          fill="transparent" className="text-slate-800/80" 
        />
        <circle 
          cx={size / 2} cy={size / 2} r={radius} 
          stroke="currentColor" strokeWidth={strokeWidth} 
          fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} 
          className={`transition-all duration-1000 ease-in-out ${colorClass}`} 
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-base font-extrabold text-white tracking-tight">{value}%</span>
      </div>
    </div>
  );
};

export const SystemHealth = () => {
  const [edgeNodes, setEdgeNodes] = useState([
    { id: 'EDG-N-01', status: 'online', latency: '12ms', pending: 0 },
    { id: 'EDG-N-02', status: 'online', latency: '18ms', pending: 0 },
    { id: 'EDG-E-01', status: 'online', latency: '24ms', pending: 0 },
    { id: 'EDG-E-02', status: 'degraded', latency: '142ms', pending: 15 },
    { id: 'EDG-S-01', status: 'offline', latency: '---', pending: 245 },
    { id: 'EDG-W-02', status: 'online', latency: '28ms', pending: 0 },
  ]);

  const updateNodeStatus = (id: string, status: string) => {
    setEdgeNodes(nodes => nodes.map(n => {
      if (n.id === id) {
        return { 
          ...n, 
          status, 
          latency: status === 'online' ? '18ms' : status === 'degraded' ? '145ms' : '---',
          pending: status === 'online' ? 0 : status === 'offline' ? n.pending + 50 : n.pending + 10 
        };
      }
      return n;
    }));
  };

  const syncNode = (id: string) => {
    setEdgeNodes(nodes => nodes.map(n => n.id === id ? { ...n, pending: 0, status: 'online', latency: '15ms' } : n));
  };

  const onlineCount = edgeNodes.filter(n => n.status === 'online').length;
  const offlineCount = edgeNodes.filter(n => n.status === 'offline').length;
  const degradedCount = edgeNodes.filter(n => n.status === 'degraded').length;
  const isDegraded = offlineCount > 0 || degradedCount > 0;

  return (
    <div className="p-4 md:p-6 space-y-5 h-full overflow-y-auto bg-[#070B12] text-slate-200">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0A0F18]/90 border border-slate-800/80 p-4 rounded-xl shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Infrastructure Health</h1>
            <p className="text-slate-400 text-xs">System performance, edge node status, and real-time infrastructure monitoring</p>
          </div>
        </div>
        
        {/* System Health Degraded Alert Box */}
        <div className="px-4 py-2.5 rounded-lg border border-red-500/40 bg-red-950/30 flex items-center gap-3 shadow-inner">
          <div className="w-7 h-7 rounded-md bg-red-500/20 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>SYSTEM HEALTH: DEGRADED</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            </div>
            <div className="text-[11px] text-red-300/80">Some edge nodes are offline or under high load</div>
          </div>
        </div>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* CPU */}
        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-3 flex flex-col items-center justify-between text-center relative hover:border-cyan-500/30 transition-all">
          <CircularProgress value={42} colorClass="text-cyan-400" />
          <div className="mt-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> CPU
            </div>
            <div className="text-[10px] text-cyan-400 font-medium">Moderate Load</div>
          </div>
        </div>

        {/* GPU */}
        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-3 flex flex-col items-center justify-between text-center relative hover:border-amber-500/30 transition-all">
          <CircularProgress value={67} colorClass="text-amber-500" />
          <div className="mt-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> GPU
            </div>
            <div className="text-[10px] text-amber-400 font-medium">High Utilization</div>
          </div>
        </div>

        {/* RAM */}
        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-3 flex flex-col items-center justify-between text-center relative hover:border-emerald-500/30 transition-all">
          <CircularProgress value={58} colorClass="text-emerald-400" />
          <div className="mt-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-300">
              <Database className="w-3.5 h-3.5 text-emerald-400" /> RAM
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">Normal</div>
          </div>
        </div>

        {/* Disk */}
        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-3 flex flex-col items-center justify-between text-center relative hover:border-emerald-500/30 transition-all">
          <CircularProgress value={34} colorClass="text-emerald-400" />
          <div className="mt-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-300">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Disk
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">Healthy</div>
          </div>
        </div>

        {/* Network */}
        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-3 flex flex-col items-center justify-between text-center relative hover:border-cyan-500/30 transition-all">
          <div className="h-[68px] flex flex-col items-center justify-center">
            <div className="text-2xl font-extrabold text-cyan-400">38</div>
            <span className="text-[10px] text-slate-400 uppercase font-mono">Mbps</span>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-300">
              <Network className="w-3.5 h-3.5 text-cyan-400" /> Network
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">Stable</div>
          </div>
        </div>

        {/* AI Engine */}
        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-3 flex flex-col items-center justify-between text-center relative hover:border-emerald-500/30 transition-all">
          <div className="h-[68px] flex flex-col items-center justify-center">
            <div className="text-2xl font-extrabold text-emerald-400">28</div>
            <span className="text-[10px] text-slate-400 uppercase font-mono">FPS / 35ms</span>
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> AI Engine
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">Normal</div>
          </div>
        </div>
      </div>

      {/* Middle Row: Services Status (Left) & AI Models (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Services Status Table */}
        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" /> Services Status
            </h2>
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 6 Operational
            </span>
          </div>
          
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800/60">
                <tr>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Uptime</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {[
                  { name: 'API Gateway', status: 'Healthy', uptime: '99.9%', latency: '12ms', health: 98 },
                  { name: 'PostgreSQL', status: 'Healthy', uptime: '99.9%', latency: '8ms', health: 99 },
                  { name: 'Redis Cache', status: 'Healthy', uptime: '99.8%', latency: '2ms', health: 100 },
                  { name: 'AI Engine', status: 'Healthy', uptime: '99.7%', latency: '35ms', health: 95 },
                  { name: 'Camera Gateway', status: 'Healthy', uptime: '99.5%', latency: '142ms', health: 86 },
                  { name: 'WebSocket', status: 'Healthy', uptime: '99.9%', latency: '5ms', health: 99 }
                ].map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{s.name}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">{s.uptime}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{s.latency}</td>
                    <td className="py-2.5 px-3">
                      <div className="w-20 bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${s.health > 90 ? 'bg-emerald-400' : 'bg-amber-400'}`} 
                          style={{ width: `${s.health}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Models Table */}
        <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> AI Models
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">
              Inference Mode: <span className="text-cyan-400">TensorRT FP16</span>
            </span>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-slate-400 uppercase tracking-wider border-b border-slate-800/60">
                <tr>
                  <th className="py-2.5 px-3">Model</th>
                  <th className="py-2.5 px-3">FPS</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3">Conf.</th>
                  <th className="py-2.5 px-3">GPU</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {[
                  { name: 'MockDetector', fps: 28, latency: '35ms', conf: '91%', gpu: '42%', status: 'Active' },
                  { name: 'MockTracker', fps: 28, latency: '12ms', conf: '89%', gpu: '15%', status: 'Active' },
                  { name: 'MockOCR', fps: 15, latency: '85ms', conf: '94%', gpu: '10%', status: 'Active' },
                  { name: 'MockFace', fps: 20, latency: '45ms', conf: '88%', gpu: '8%', status: 'Active' }
                ].map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{m.name}</td>
                    <td className="py-2.5 px-3 text-cyan-400 font-mono font-bold">{m.fps}</td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">{m.latency}</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-mono">{m.conf}</td>
                    <td className="py-2.5 px-3 text-amber-400 font-mono">{m.gpu}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Row: 3 Columns (Edge Nodes, Bandwidth Chart, System Alerts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Edge Node Management (Col 4) */}
        <div className="lg:col-span-4 bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" /> Edge Node Management
              </h2>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Total: 6 | Online: <span className="text-emerald-400">{onlineCount}</span> | Offline: <span className="text-red-400">{offlineCount}</span> | Degraded: <span className="text-amber-400">{degradedCount}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-3">
            {edgeNodes.map(node => (
              <div 
                key={node.id} 
                className={`p-2.5 rounded-lg border transition-all ${
                  node.status === 'online' ? 'bg-[#080E18] border-slate-800 hover:border-emerald-500/40' :
                  node.status === 'degraded' ? 'bg-amber-950/20 border-amber-500/40' :
                  'bg-red-950/20 border-red-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono">{node.id}</span>
                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                    node.status === 'online' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    node.status === 'degraded' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {node.status}
                  </span>
                </div>
                
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Latency: <span className="text-slate-200 font-mono">{node.latency}</span></span>
                  {node.pending > 0 && (
                    <span className="text-[10px] text-amber-400 font-semibold">{node.pending} pend</span>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between gap-1 pt-1.5 border-t border-slate-800/60">
                  <div className="flex gap-1">
                    <button 
                      onClick={() => updateNodeStatus(node.id, 'online')}
                      title="Set Online"
                      className={`text-[9px] px-1.5 py-0.5 rounded ${node.status === 'online' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      ON
                    </button>
                    <button 
                      onClick={() => updateNodeStatus(node.id, 'degraded')}
                      title="Set Degraded"
                      className={`text-[9px] px-1.5 py-0.5 rounded ${node.status === 'degraded' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      DEG
                    </button>
                    <button 
                      onClick={() => updateNodeStatus(node.id, 'offline')}
                      title="Set Offline"
                      className={`text-[9px] px-1.5 py-0.5 rounded ${node.status === 'offline' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      OFF
                    </button>
                  </div>
                  {node.pending > 0 && (
                    <button 
                      onClick={() => syncNode(node.id)}
                      className="text-[9px] bg-cyan-600/30 hover:bg-cyan-600 text-cyan-300 hover:text-white px-1.5 py-0.5 rounded flex items-center gap-0.5"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Sync
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bandwidth & Resource Usage (Col 5) */}
        <div className="lg:col-span-5 bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" /> Bandwidth & Resource Usage
            </h2>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Download
              </span>
              <span className="flex items-center gap-1 text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-400" /> Upload
              </span>
            </div>
          </div>

          {/* Chart View with Crop Background or Graphic */}
          <div className="relative mt-3 rounded-lg overflow-hidden border border-slate-800/60 bg-[#070B12] h-40 flex items-center justify-center">
            <img 
              src="/health-bandwidth-crop.jpg" 
              alt="Bandwidth Chart" 
              className="w-full h-full object-cover opacity-85 hover:opacity-100 transition-opacity" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B111B]/80 via-transparent to-transparent pointer-events-none" />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-center">
            <div className="bg-[#080E18] p-2 rounded-lg border border-slate-800/60">
              <div className="text-[10px] text-slate-400">Bandwidth Savings</div>
              <div className="text-xs font-bold text-emerald-400 mt-0.5">91% (Trad: 420M)</div>
            </div>
            <div className="bg-[#080E18] p-2 rounded-lg border border-slate-800/60">
              <div className="text-[10px] text-slate-400">Current Usage</div>
              <div className="text-xs font-bold text-cyan-400 mt-0.5">38 Mbps</div>
            </div>
            <div className="bg-[#080E18] p-2 rounded-lg border border-slate-800/60">
              <div className="text-[10px] text-slate-400">Edge Latency</div>
              <div className="text-xs font-bold text-purple-400 mt-0.5">12ms Avg</div>
            </div>
          </div>
        </div>

        {/* System Alerts (Col 3) */}
        <div className="lg:col-span-3 bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> System Alerts
            </h2>
            <button className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold">View All</button>
          </div>

          <div className="space-y-2.5 mt-3">
            {[
              { title: 'EDG-S-01 Offline', desc: 'Node lost connection', sev: 'CRITICAL', color: 'red', time: '13:41' },
              { title: 'EDG-E-02 High Latency', desc: 'Latency > 120ms', sev: 'HIGH', color: 'amber', time: '13:38' },
              { title: 'Camera BOP-01 FPS Drop', desc: 'FPS dropped < 15', sev: 'MEDIUM', color: 'yellow', time: '13:35' },
              { title: 'AI Model Restarted', desc: 'MockDetector reloaded', sev: 'INFO', color: 'blue', time: '13:20' },
            ].map((al, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-[#080E18] border border-slate-800/70 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{al.title}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                    al.color === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    al.color === 'amber' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    al.color === 'yellow' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {al.sev}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>{al.desc}</span>
                  <span className="font-mono text-slate-500">{al.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
