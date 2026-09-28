import React, { useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Button } from '../components/ui/Button';
import { 
  Activity, Users, Car, AlertTriangle, Clock, 
  Target, Shield, Camera, Cpu, Eye, Video, Download,
  Layers, ChevronDown, CheckCircle2, Zap, ArrowUpRight
} from 'lucide-react';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#334155'];

const mockHourlyData = [
  { time: '02:00', people: 14, vehicles: 8 },
  { time: '05:00', people: 22, vehicles: 12 },
  { time: '08:00', people: 48, vehicles: 35 },
  { time: '11:00', people: 55, vehicles: 42 },
  { time: '14:00', people: 62, vehicles: 50 },
  { time: '17:00', people: 58, vehicles: 46 },
  { time: '20:00', people: 40, vehicles: 30 },
  { time: '23:00', people: 18, vehicles: 10 },
];

const mockAlertsBySeverity = [
  { name: 'Critical', value: 18, color: '#ef4444' },
  { name: 'High', value: 32, color: '#f59e0b' },
  { name: 'Medium', value: 75, color: '#3b82f6' },
  { name: 'Low', value: 156, color: '#475569' },
];

const mockEventsByCamera = [
  { name: 'CAM-N-01', events: 120 },
  { name: 'CAM-N-02', events: 95 },
  { name: 'CAM-E-01', events: 150 },
  { name: 'CAM-W-01', events: 80 },
  { name: 'CAM-S-01', events: 60 },
];

const mockIntrusions = Array.from({ length: 14 }).map((_, i) => ({
  day: `Day ${i + 1}`,
  intrusions: Math.floor(Math.random() * 20),
  loitering: Math.floor(Math.random() * 40),
  crossings: Math.floor(Math.random() * 15),
}));

const mockVehiclesByType = [
  { name: 'Car', value: 450 },
  { name: 'Truck', value: 120 },
  { name: 'Motorcycle', value: 85 },
  { name: 'Bus', value: 30 },
];

const mockAnprConfidence = [
  { range: '95-100%', count: 320 },
  { range: '90-94%', count: 150 },
  { range: '85-89%', count: 80 },
  { range: '80-84%', count: 30 },
  { range: '<80%', count: 15 },
];

const mockCameraHealth = [
  { name: 'CAM-N-01', uptime: 99.9, fps: 30 },
  { name: 'CAM-N-02', uptime: 98.5, fps: 28 },
  { name: 'CAM-E-01', uptime: 99.2, fps: 30 },
  { name: 'CAM-W-01', uptime: 100, fps: 30 },
  { name: 'CAM-S-01', uptime: 95.0, fps: 24 },
];

const mockAiPerformance = Array.from({ length: 20 }).map((_, i) => ({
  time: `T-${20-i}m`,
  fps: 28 + Math.random() * 4,
  latency: 35 + Math.random() * 15,
}));

export const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('surveillance');
  const [timeRange, setTimeRange] = useState('Last 24 Hours');

  const tabs = [
    { id: 'surveillance', label: 'Surveillance', icon: <Eye className="w-3.5 h-3.5 mr-1.5" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-3.5 h-3.5 mr-1.5" /> },
    { id: 'anpr', label: 'ANPR', icon: <Car className="w-3.5 h-3.5 mr-1.5" /> },
    { id: 'camera', label: 'Camera', icon: <Camera className="w-3.5 h-3.5 mr-1.5" /> },
    { id: 'ai', label: 'AI Performance', icon: <Cpu className="w-3.5 h-3.5 mr-1.5" /> },
  ];

  const handleExportReport = () => {
    const reportData = {
      title: 'IBVAP Tactical Analytics Report',
      generatedAt: new Date().toISOString(),
      timeRange,
      kpis: {
        totalDetections: 142850,
        intrusionIncidents: 14,
        vehiclesProcessed: 4890,
        avgAiLatency: '32ms'
      },
      eventsByCamera: mockEventsByCamera,
      intrusionsTrend: mockIntrusions,
      vehiclesDistribution: mockVehiclesByType,
      anprConfidence: mockAnprConfidence,
      cameraHealth: mockCameraHealth,
      aiPerformance: mockAiPerformance
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IBVAP-Analytics-Summary-${timeRange.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto bg-[#070B12] text-slate-200 font-sans">
      
      {/* Top Header Banner (Mirrors media_1790496467148.jpg) */}
      <div className="relative rounded-2xl border border-[#1B2536] overflow-hidden shadow-2xl bg-[#0A0F18] p-5">
        <div 
          className="absolute right-0 top-0 bottom-0 w-80 bg-cover bg-center opacity-30 mix-blend-luminosity pointer-events-none"
          style={{ backgroundImage: `url('/analytics-header-bg.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F18] via-[#0A0F18]/90 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
                System Analytics
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Comprehensive performance and detection metrics
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
              onClick={handleExportReport}
              className="bg-[#070B12] border-[#1E293B] text-cyan-400 hover:bg-slate-800 text-xs font-mono cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* 4 KPI Telemetry Cards (Mirrors media_1790496467148.jpg) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Detections */}
        <div className="bg-[#0A0F18] border border-[#1B2536] rounded-xl p-4 flex flex-col justify-between hover:border-blue-500/40 transition-colors shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-blue-500/15 text-cyan-400 border border-blue-500/30">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex items-end gap-1 h-6">
              {[40, 60, 50, 75, 80, 95, 100].map((h, i) => (
                <div key={i} className="w-1 bg-cyan-400/80 rounded-xs" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="mt-2 font-mono">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Detections</span>
            <div className="text-2xl font-black text-white mt-0.5">14,285</div>
            <p className="text-[10px] text-emerald-400 mt-0.5 font-bold">↑ 12% vs last period</p>
          </div>
        </div>

        {/* Card 2: Total Alerts */}
        <div className="bg-[#0A0F18] border border-red-500/30 rounded-xl p-4 flex flex-col justify-between hover:border-red-500/60 transition-colors shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex items-end gap-1 h-6">
              {[30, 50, 65, 80, 70, 90, 85].map((h, i) => (
                <div key={i} className="w-1 bg-red-500/80 rounded-xs" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="mt-2 font-mono">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Alerts</span>
            <div className="text-2xl font-black text-white mt-0.5">281</div>
            <p className="text-[10px] text-red-400 mt-0.5 font-bold">↑ 5% vs last period</p>
          </div>
        </div>

        {/* Card 3: Avg AI Confidence */}
        <div className="bg-[#0A0F18] border border-[#1B2536] rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-colors shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Target className="w-4 h-4" />
            </div>
            <div className="flex items-end gap-1 h-6">
              {[80, 85, 90, 88, 92, 95, 94].map((h, i) => (
                <div key={i} className="w-1 bg-emerald-400/80 rounded-xs" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="mt-2 font-mono">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Avg AI Confidence</span>
            <div className="text-2xl font-black text-white mt-0.5">94.2%</div>
            <p className="text-[10px] text-emerald-400 mt-0.5 font-bold">↑ 1.2% vs last period</p>
          </div>
        </div>

        {/* Card 4: Avg Alert Latency */}
        <div className="bg-[#0A0F18] border border-[#1B2536] rounded-xl p-4 flex flex-col justify-between hover:border-amber-500/40 transition-colors shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex items-end gap-1 h-6">
              {[50, 40, 45, 30, 35, 25, 20].map((h, i) => (
                <div key={i} className="w-1 bg-amber-400/80 rounded-xs" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
          <div className="mt-2 font-mono">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Avg Alert Latency</span>
            <div className="text-2xl font-black text-white mt-0.5">0.8s</div>
            <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Stable Edge Inference</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-[#1B2536] pb-2 overflow-x-auto font-mono text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

      {/* Tab: Surveillance (Default view in media_1790496467148.jpg) */}
      {activeTab === 'surveillance' && (
        <div className="space-y-6">
          {/* Middle 2-Column Grid: Detections Per Hour + Alerts by Severity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Detections Per Hour Chart */}
            <div className="lg:col-span-8 bg-[#0A0F18] border border-[#1B2536] rounded-2xl p-5 shadow-2xl relative overflow-hidden font-mono flex flex-col justify-between">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
                style={{ backgroundImage: `url('/analytics-detections-chart.jpg')` }}
              />
              <div className="relative z-10 flex items-center justify-between border-b border-[#1B2536] pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Detections Per Hour
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-xs bg-cyan-400" /> People
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-xs bg-blue-500" /> Vehicles
                  </span>
                </div>
              </div>

              <div className="relative z-10 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockHourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#070B12', borderColor: '#1B2536', borderRadius: '8px', color: '#e2e8f0' }} />
                    <Bar dataKey="people" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="vehicles" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Alerts by Severity Donut Chart */}
            <div className="lg:col-span-4 bg-[#0A0F18] border border-[#1B2536] rounded-2xl p-5 shadow-2xl relative overflow-hidden font-mono flex flex-col justify-between">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
                style={{ backgroundImage: `url('/analytics-donut-chart.jpg')` }}
              />
              <div className="relative z-10 flex items-center justify-between border-b border-[#1B2536] pb-3 mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Alerts by Severity
                  </h3>
                </div>
              </div>

              <div className="relative z-10 h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockAlertsBySeverity}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {mockAlertsBySeverity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#070B12', borderColor: '#1B2536', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Donut Legend */}
              <div className="relative z-10 grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#1B2536]">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critical ({mockAlertsBySeverity[0].value})
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> High ({mockAlertsBySeverity[1].value})
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Medium ({mockAlertsBySeverity[2].value})
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Low ({mockAlertsBySeverity[3].value})
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Full-Width: Events by Camera */}
          <div className="bg-[#0A0F18] border border-[#1B2536] rounded-2xl p-5 shadow-2xl relative overflow-hidden font-mono">
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
              style={{ backgroundImage: `url('/analytics-camera-events.jpg')` }}
            />
            <div className="relative z-10 flex items-center justify-between border-b border-[#1B2536] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Events by Camera
                </h3>
              </div>
            </div>

            <div className="relative z-10 h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockEventsByCamera} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis type="number" stroke="#64748B" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={11} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#070B12', borderColor: '#1B2536', borderRadius: '8px' }} />
                  <Bar dataKey="events" fill="#A855F7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-[#0A0F18] border border-[#1B2536] rounded-2xl p-5 font-mono space-y-4">
          <h3 className="text-sm font-bold text-white">Intrusions & Tripwire Events (14 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockIntrusions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#070B12', borderColor: '#1B2536' }} />
                <Area type="monotone" dataKey="intrusions" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                <Area type="monotone" dataKey="loitering" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ANPR Tab */}
      {activeTab === 'anpr' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
          <div className="bg-[#0A0F18] border border-[#1B2536] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">Vehicles by Classification</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockVehiclesByType}>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#070B12', borderColor: '#1B2536' }} />
                  <Bar dataKey="value" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#0A0F18] border border-[#1B2536] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">OCR Confidence Buckets</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockAnprConfidence}>
                  <XAxis dataKey="range" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#070B12', borderColor: '#1B2536' }} />
                  <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Camera Tab */}
      {activeTab === 'camera' && (
        <div className="bg-[#0A0F18] border border-[#1B2536] rounded-2xl p-5 font-mono">
          <h3 className="text-sm font-bold text-white mb-4">Camera Uptime & FPS Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockCameraHealth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#070B12', borderColor: '#1B2536' }} />
                <Bar dataKey="uptime" fill="#10B981" radius={[4, 4, 0, 0]} name="Uptime %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* AI Performance Tab */}
      {activeTab === 'ai' && (
        <div className="bg-[#0A0F18] border border-[#1B2536] rounded-2xl p-5 font-mono">
          <h3 className="text-sm font-bold text-white mb-4">Real-Time AI Inference Latency & FPS</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockAiPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#070B12', borderColor: '#1B2536' }} />
                <Line type="monotone" dataKey="latency" stroke="#f59e0b" name="Latency (ms)" strokeWidth={2} />
                <Line type="monotone" dataKey="fps" stroke="#06b6d4" name="Throughput (FPS)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
};

export default AnalyticsPage;
