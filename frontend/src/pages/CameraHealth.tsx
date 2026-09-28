import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, ShieldAlert, Cpu, Wifi, Camera, Download, 
  Wrench, CheckCircle2, AlertTriangle, AlertCircle, 
  TrendingUp, RefreshCw, BarChart2, Eye, Server, Layers,
  ChevronDown
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { Button } from '../components/ui/Button';

const mockHealthData = [
  { time: '00:00', health: 88, bop: 92, perim: 85, ai: 95 },
  { time: '02:00', health: 91, bop: 94, perim: 89, ai: 96 },
  { time: '04:00', health: 93, bop: 95, perim: 91, ai: 96 },
  { time: '06:00', health: 97, bop: 98, perim: 96, ai: 98 },
  { time: '08:00', health: 90, bop: 92, perim: 88, ai: 94 },
  { time: '10:00', health: 89, bop: 91, perim: 87, ai: 93 },
  { time: '12:00', health: 87, bop: 89, perim: 85, ai: 92 },
  { time: '14:00', health: 89, bop: 90, perim: 88, ai: 94 },
  { time: '16:00', health: 93, bop: 94, perim: 92, ai: 96 },
  { time: '18:00', health: 94, bop: 96, perim: 93, ai: 97 },
  { time: '20:00', health: 95, bop: 97, perim: 94, ai: 98 },
  { time: '22:00', health: 96, bop: 98, perim: 95, ai: 98 },
];

const CRITICAL_CAMERAS = [
  {
    id: 'BOP-01',
    name: 'Sector 4 North Gate',
    score: 98,
    status: 'Online',
    statusType: 'online',
    note: 'No issues detected',
    issues: [],
    feed: '/feed-bop01.jpg'
  },
  {
    id: 'ROAD-02',
    name: 'Approach Road South',
    score: 65,
    status: 'Warning',
    statusType: 'warning',
    note: '! High Latency · ! Low FPS',
    issues: ['High Latency (240ms)', 'Low Frame Rate (14 FPS)'],
    feed: '/feed-road01.jpg'
  },
  {
    id: 'WATCH-01',
    name: 'Watchtower Delta',
    score: 0,
    status: 'Offline',
    statusType: 'offline',
    note: '! Camera Offline · ! No Signal',
    issues: ['Network Unreachable', 'RTSP Stream Dropped'],
    feed: '/feed-watch01.jpg'
  },
  {
    id: 'GATE-03',
    name: 'Freight Gate East',
    score: 87,
    status: 'Online',
    statusType: 'online',
    note: 'Stable',
    issues: [],
    feed: '/feed-gate01.jpg'
  }
];

const HEALTH_DISTRIBUTION = [
  { name: 'Healthy', value: 34, color: '#10B981' },
  { name: 'Warning', value: 8, color: '#F59E0B' },
  { name: 'Degraded', value: 4, color: '#F97316' },
  { name: 'Critical', value: 2, color: '#EF4444' },
];

const COMMON_ISSUES = [
  { name: 'High Latency', count: 12, max: 20, color: '#EF4444' },
  { name: 'Low FPS', count: 8, max: 20, color: '#F97316' },
  { name: 'Connection Loss', count: 5, max: 20, color: '#F59E0B' },
  { name: 'Lens Obstruction', count: 3, max: 20, color: '#3B82F6' },
  { name: 'Overheating', count: 2, max: 20, color: '#06B6D4' },
];

const AI_DIAGNOSTICS_LIST = [
  { name: 'Object Detection Model', status: 'Running' },
  { name: 'Re-ID Model', status: 'Running' },
  { name: 'Plate Recognition', status: 'Running' },
  { name: 'Behavior Analysis', status: 'Running' },
  { name: 'Anomaly Detection', status: 'Running' },
];

export const CameraHealth: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'status' | 'network' | 'ai' | 'maintenance'>('overview');
  const [timeRange, setTimeRange] = useState('Last 24 Hours');
  const [healthToast, setHealthToast] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const showToast = (msg: string) => {
    setHealthToast(msg);
    setTimeout(() => setHealthToast(null), 3500);
  };

  const handleGenerateReport = () => {
    const report = {
      reportId: `DIAG-REPORT-${Date.now().toString().slice(-6)}`,
      generatedAt: new Date().toISOString(),
      timeRange,
      totalNodes: 48,
      onlineNodes: 45,
      offlineNodes: 1,
      degradedNodes: 2,
      averageUptime: '99.4%',
      criticalCameras: CRITICAL_CAMERAS,
      aiDiagnostics: AI_DIAGNOSTICS_LIST,
      networkTelemetry: {
        avgBitrate: '6.4 Mbps',
        packetLoss: '0.02%',
        latency: '18ms'
      }
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IBVAP-CameraHealth-Dossier-${Date.now().toString().slice(-6)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Diagnostic Health Dossier exported as verified JSON.');
  };

  return (
    <div className="p-6 bg-[#070B12] min-h-full text-slate-200 overflow-y-auto space-y-6 font-sans relative">
      
      {/* Toast Notification */}
      {healthToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#0E1726] border border-cyan-500/50 shadow-2xl shadow-cyan-500/20 text-white px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-xs font-mono">
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Health Diagnostic Update</div>
            <div className="text-slate-200 mt-0.5">{healthToast}</div>
          </div>
        </div>
      )}

      {/* Top Header (Mirrors media_1790496583685.png) */}
      <div className="bg-[#0A0F18] border border-[#1B2536] p-4 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-mono tracking-wider flex items-center gap-2">
              Camera Health Diagnostics
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Real-time health monitoring, AI-based issue detection, and predictive maintenance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 font-mono text-xs">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-[#070B12] border border-[#1B2536] text-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>

          <Button 
            variant="outline" 
            size="sm"
            onClick={handleGenerateReport}
            className="bg-[#070B12] border-[#1E293B] text-cyan-400 hover:bg-slate-800 text-xs font-mono cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* 4 KPI Telemetry Cards (Mirrors media_1790496583685.png) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Average Health */}
        <div className="bg-[#0A0F18] border border-[#1B2536] rounded-xl p-4 flex flex-col justify-between hover:border-blue-500/40 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <div className="p-1.5 rounded-lg bg-blue-500/15 text-cyan-400 border border-blue-500/30">
              <Camera className="w-4 h-4" />
            </div>
            <div className="flex items-end gap-1 h-6">
              {[60, 70, 75, 80, 85, 90, 92].map((h, i) => (
                <div key={i} className="w-1 bg-cyan-400/80 rounded-xs" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="mt-2 font-mono">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Average Health</span>
            <div className="text-2xl font-black text-white mt-0.5">92%</div>
            <p className="text-[10px] text-emerald-400 mt-0.5 font-bold">↑ +2% vs last period</p>
          </div>
        </div>

        {/* Card 2: AI Inference Status */}
        <div className="bg-[#0A0F18] border border-[#1B2536] rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="flex items-end gap-1 h-6">
              {[80, 85, 90, 95, 98, 100, 100].map((h, i) => (
                <div key={i} className="w-1 bg-emerald-400/80 rounded-xs" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="mt-2 font-mono">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">AI Inference Status</span>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">Optimal</div>
            <p className="text-[10px] text-slate-400 mt-0.5">All models running</p>
          </div>
        </div>

        {/* Card 3: Network Status */}
        <div className="bg-[#0A0F18] border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between hover:border-amber-500/60 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Wifi className="w-4 h-4" />
            </div>
            <div className="flex items-end gap-1 h-6">
              {[40, 50, 60, 55, 70, 65, 50].map((h, i) => (
                <div key={i} className="w-1 bg-amber-400/80 rounded-xs" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="mt-2 font-mono">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Network Status</span>
            <div className="text-2xl font-black text-amber-400 mt-0.5">Degraded</div>
            <p className="text-[10px] text-amber-400/80 mt-0.5">Packet loss: 8.4%</p>
          </div>
        </div>

        {/* Card 4: Active Issues */}
        <div className="bg-[#0A0F18] border border-red-500/30 rounded-xl p-4 flex flex-col justify-between hover:border-red-500/60 transition-colors shadow-lg">
          <div className="flex items-center justify-between">
            <div className="p-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex items-end gap-1 h-6">
              {[20, 30, 45, 60, 75, 80, 70].map((h, i) => (
                <div key={i} className="w-1 bg-red-500/80 rounded-xs" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="mt-2 font-mono">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Active Issues</span>
            <div className="text-2xl font-black text-red-400 mt-0.5">3</div>
            <p className="text-[10px] text-slate-400 mt-0.5">1 Critical | 1 High | 1 Medium</p>
          </div>
        </div>
      </div>

      {/* Sub-Tabs (Mirrors media_1790496583685.png) */}
      <div className="flex items-center space-x-2 border-b border-[#1B2536] pb-2 font-mono text-xs overflow-x-auto">
        {[
          { id: 'overview', label: 'Health Overview', icon: <Activity className="w-3.5 h-3.5 mr-1.5" /> },
          { id: 'status', label: 'Camera Status', icon: <Camera className="w-3.5 h-3.5 mr-1.5" /> },
          { id: 'network', label: 'Network Analysis', icon: <Wifi className="w-3.5 h-3.5 mr-1.5" /> },
          { id: 'ai', label: 'AI Diagnostics', icon: <Cpu className="w-3.5 h-3.5 mr-1.5" /> },
          { id: 'maintenance', label: 'Maintenance', icon: <Wrench className="w-3.5 h-3.5 mr-1.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center px-4 py-2 rounded-xl transition-all whitespace-nowrap font-bold ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-950/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#0A0F18]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Middle Row: Trend Line Chart (Left ~65%) + Critical Cameras (Right ~35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* System Health Trend Line Chart */}
        <div className="lg:col-span-8 bg-[#0A0F18] border border-[#1B2536] rounded-2xl p-5 shadow-2xl font-mono flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#1B2536] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                System Health Trend (Last 24 Hours)
              </h3>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockHealthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#070B12', borderColor: '#1B2536', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="health" stroke="#06B6D4" strokeWidth={2} dot={{ r: 3, fill: '#06B6D4' }} name="Overall Health" />
                <Line type="monotone" dataKey="bop" stroke="#3B82F6" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="BOP Cameras" />
                <Line type="monotone" dataKey="perim" stroke="#A855F7" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="Perimeter Cameras" />
                <Line type="monotone" dataKey="ai" stroke="#10B981" strokeWidth={1.5} dot={false} name="AI Processing" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Line Chart Legend */}
          <div className="flex flex-wrap items-center justify-center gap-5 pt-3 border-t border-[#1B2536] text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Overall Health
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> BOP Cameras
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Perimeter Cameras
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> AI Processing
            </div>
          </div>
        </div>

        {/* Critical Cameras List (Mirrors media_1790496583685.png) */}
        <div className="lg:col-span-4 bg-[#0A0F18] border border-[#1B2536] rounded-2xl p-5 shadow-2xl font-mono flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#1B2536] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Critical Cameras
                </h3>
              </div>
              <button 
                onClick={() => navigate('/cameras')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
              >
                View All
              </button>
            </div>

            {/* List of 4 Cameras */}
            <div className="space-y-2.5">
              {CRITICAL_CAMERAS.map((cam) => (
                <div 
                  key={cam.id} 
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                    cam.statusType === 'offline' ? 'bg-red-950/20 border-red-500/40' :
                    cam.statusType === 'warning' ? 'bg-amber-950/20 border-amber-500/40' :
                    'bg-[#070B12] border-[#1E293B]'
                  }`}
                >
                  <div className="relative w-16 h-12 rounded-lg overflow-hidden border border-[#1E293B] bg-black flex-shrink-0">
                    <img 
                      src={cam.feed} 
                      alt={cam.id}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{cam.id}</span>
                      <span className={`text-xs font-bold ${
                        cam.score > 80 ? 'text-emerald-400' : cam.score > 50 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {cam.score}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-[#070B12] h-1.5 rounded-full overflow-hidden border border-[#1E293B] my-1">
                      <div 
                        className={`h-full rounded-full ${
                          cam.score > 80 ? 'bg-emerald-500' : cam.score > 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${cam.score}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`truncate ${
                        cam.statusType === 'offline' ? 'text-red-400 font-bold' :
                        cam.statusType === 'warning' ? 'text-amber-400 font-bold' :
                        'text-slate-400'
                      }`}>
                        {cam.note}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                        cam.statusType === 'online' ? 'bg-emerald-500/20 text-emerald-400' :
                        cam.statusType === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {cam.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom 3-Card Row (Mirrors media_1790496583685.png) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
        
        {/* Card 1: Camera Health Distribution */}
        <div className="bg-[#0A0F18] border border-[#1B2536] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="border-b border-[#1B2536] pb-2.5 mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Camera Health Distribution
            </h3>
          </div>

          <div className="flex items-center justify-between gap-4">
            {/* Donut Chart with Center Text */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={HEALTH_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={50}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {HEALTH_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] text-slate-400">Total</span>
                <span className="text-sm font-black text-white">48</span>
                <span className="text-[8px] text-slate-400">Cameras</span>
              </div>
            </div>

            {/* Distribution Legend */}
            <div className="space-y-1.5 text-[11px] flex-1">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Healthy</span>
                <span className="font-bold text-white">34 (71%)</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Warning</span>
                <span className="font-bold text-white">8 (17%)</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> Degraded</span>
                <span className="font-bold text-white">4 (8%)</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Critical</span>
                <span className="font-bold text-red-400">2 (4%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Common Issues */}
        <div className="bg-[#0A0F18] border border-[#1B2536] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="border-b border-[#1B2536] pb-2.5 mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Common Issues
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            {COMMON_ISSUES.map((issue) => (
              <div key={issue.name}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300">{issue.name}</span>
                  <span className="text-white font-bold">{issue.count}</span>
                </div>
                <div className="w-full bg-[#070B12] h-1.5 rounded-full overflow-hidden border border-[#1E293B]">
                  <div 
                    className="h-full rounded-full" 
                    style={{ width: `${(issue.count / issue.max) * 100}%`, backgroundColor: issue.color }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: AI Diagnostics */}
        <div className="bg-[#0A0F18] border border-[#1B2536] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="border-b border-[#1B2536] pb-2.5 mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              AI Diagnostics
            </h3>
            <button 
              onClick={() => {
                setIsDiagnosing(true);
                showToast('Initiating neural diagnostic pipeline across 48 edge camera nodes...');
                setTimeout(() => {
                  setIsDiagnosing(false);
                  showToast('AI Diagnostics verified: 48/48 nodes healthy, 0 packet loss, 30.0 avg FPS.');
                }, 1400);
              }}
              disabled={isDiagnosing}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[10px] font-bold border border-[#1E293B] cursor-pointer"
            >
              {isDiagnosing ? 'Diagnosing...' : 'Run Diagnostic'}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {AI_DIAGNOSTICS_LIST.map((diag) => (
              <div key={diag.name} className="flex items-center justify-between p-2 rounded-lg bg-[#070B12] border border-[#1E293B]">
                <span className="text-slate-300 text-[11px]">{diag.name}</span>
                <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {diag.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default CameraHealth;
