import React, { useState } from 'react';
import { 
  AlertTriangle, Clock, Filter, Eye, CheckCircle, ShieldAlert, 
  AlertOctagon, Info, ArrowUpRight, Search, Shield, Bell, Check, 
  Share2, Camera, User, Crosshair, ChevronRight, Activity, Radio
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AlertItem {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  type: string;
  camera: string;
  cameraName: string;
  objectType: string;
  trackingId: string;
  confidence: number;
  score: number;
  status: 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISPATCHED';
  timestamp: string;
  timeStr: string;
  thumb: string;
}

const MOCK_ALERTS: AlertItem[] = [
  {
    id: 'ALT-0042',
    severity: 'CRITICAL',
    type: 'Zone Intrusion',
    camera: 'CAM-N-01',
    cameraName: 'North Fence Alpha (CAM-N-01)',
    objectType: 'Person',
    trackingId: '#TRK-9921',
    confidence: 94,
    score: 87,
    status: 'NEW',
    timestamp: '2026-09-27 12:53:04',
    timeStr: '2026-09-27 12:53:04 IST',
    thumb: '/thumb-alt1.jpg'
  },
  {
    id: 'ALT-0043',
    severity: 'HIGH',
    type: 'Suspicious Loitering',
    camera: 'BOP-02',
    cameraName: 'Perimeter Road (BOP-02)',
    objectType: 'Person',
    trackingId: '#TRK-8893',
    confidence: 91,
    score: 72,
    status: 'NEW',
    timestamp: '2026-09-27 12:48:22',
    timeStr: '2026-09-27 12:48:22 IST',
    thumb: '/thumb-alt2.jpg'
  },
  {
    id: 'ALT-0044',
    severity: 'MEDIUM',
    type: 'Unauthorized Vehicle',
    camera: 'CAM-05',
    cameraName: 'Service Road (CAM-05)',
    objectType: 'Vehicle',
    trackingId: '#TRK-7710',
    confidence: 88,
    score: 55,
    status: 'NEW',
    timestamp: '2026-09-27 12:40:11',
    timeStr: '2026-09-27 12:40:11 IST',
    thumb: '/thumb-alt3.jpg'
  },
  {
    id: 'ALT-0045',
    severity: 'LOW',
    type: 'Perimeter Movement',
    camera: 'CAM-S-03',
    cameraName: 'South Fence (CAM-S-03)',
    objectType: 'Person',
    trackingId: '#TRK-6621',
    confidence: 76,
    score: 28,
    status: 'NEW',
    timestamp: '2026-09-27 12:35:18',
    timeStr: '2026-09-27 12:35:18 IST',
    thumb: '/thumb-alt4.jpg'
  },
  {
    id: 'ALT-0046',
    severity: 'LOW',
    type: 'Animal Detected',
    camera: 'CAM-H-01',
    cameraName: 'Hill Track (CAM-H-01)',
    objectType: 'Animal',
    trackingId: '#TRK-6589',
    confidence: 72,
    score: 18,
    status: 'RESOLVED',
    timestamp: '2026-09-27 12:30:41',
    timeStr: '2026-09-27 12:30:41 IST',
    thumb: '/thumb-alt5.jpg'
  },
];

export function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>(MOCK_ALERTS);
  const [selectedAlertId, setSelectedAlertId] = useState<string>('ALT-0042');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'timeline' | 'snapshots' | 'tracks' | 'related'>('timeline');

  const selectedAlert = alerts.find(a => a.id === selectedAlertId) || alerts[0];

  const handleAction = (id: string, newStatus: AlertItem['status']) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    if (searchQuery && !a.id.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !a.type.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !a.cameraName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-[#070B12] text-slate-200 overflow-y-auto p-4 md:p-5 space-y-4 custom-scrollbar">
      
      {/* ── TOP OPERATIONAL HEADER BAR ── */}
      <div 
        className="p-4 bg-[#0A0F18] border border-[#1B2536] rounded-xl flex flex-wrap gap-4 justify-between items-center relative overflow-hidden shadow-xl"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(10, 15, 24, 0.98) 45%, rgba(10, 15, 24, 0.45) 80%, rgba(10, 15, 24, 0.2) 100%), url('/alerts-header-bg.jpg')`,
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain'
        }}
      >
        <div className="flex items-center space-x-3 z-10">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-950/40">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-mono">
              THREAT ALERT MANAGEMENT & INCIDENT CONSOLE
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              Autonomous multi-sensor risk assessment and automated tactical incident escalation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 z-10 font-mono text-xs">
          <span className="px-3 py-1 bg-red-950/80 text-red-400 border border-red-500/40 rounded-lg font-bold flex items-center gap-1.5 shadow-lg shadow-red-950/40">
            <Bell size={13} className="animate-bounce" /> 2 CRITICAL INCIDENTS
          </span>
          <span className="px-3 py-1 bg-[#070B12] text-slate-300 border border-[#1E293B] rounded-lg font-bold">
            AUTO-DISPATCH: ON
          </span>
        </div>
      </div>

      {/* ── STATS ROW (6 KPI BLOCKS) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
        
        {/* Total Active */}
        <div className="p-3 bg-[#0A0F18] border border-red-500/40 rounded-xl flex flex-col justify-between shadow-lg">
          <div className="text-[11px] text-slate-400">Total Active</div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-red-400">12</span>
            <span className="text-[10px] text-red-500/80">▲ Elevated</span>
          </div>
        </div>

        {/* Critical */}
        <div className="p-3 bg-[#0A0F18] border border-red-500/30 rounded-xl flex flex-col justify-between shadow-lg">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <AlertOctagon size={12} className="text-red-400" /> Critical
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-red-400">2</span>
            <span className="text-[9px] text-red-400 bg-red-950 px-1 rounded border border-red-500/30">Immediate</span>
          </div>
        </div>

        {/* High */}
        <div className="p-3 bg-[#0A0F18] border border-amber-500/30 rounded-xl flex flex-col justify-between shadow-lg">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <AlertTriangle size={12} className="text-amber-400" /> High
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-amber-400">4</span>
            <span className="text-[9px] text-amber-400 bg-amber-950 px-1 rounded border border-amber-500/30">Action</span>
          </div>
        </div>

        {/* Medium */}
        <div className="p-3 bg-[#0A0F18] border border-yellow-500/30 rounded-xl flex flex-col justify-between shadow-lg">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info size={12} className="text-yellow-400" /> Medium
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-yellow-400">5</span>
            <span className="text-[9px] text-yellow-400 bg-yellow-950 px-1 rounded border border-yellow-500/30">Watch</span>
          </div>
        </div>

        {/* Low */}
        <div className="p-3 bg-[#0A0F18] border border-blue-500/30 rounded-xl flex flex-col justify-between shadow-lg">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info size={12} className="text-blue-400" /> Low
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-blue-400">1</span>
            <span className="text-[9px] text-blue-400 bg-blue-950 px-1 rounded border border-blue-500/30">Filtered</span>
          </div>
        </div>

        {/* Resolved Today */}
        <div className="p-3 bg-[#0A0F18] border border-emerald-500/30 rounded-xl flex flex-col justify-between shadow-lg">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle size={12} className="text-emerald-400" /> Resolved Today
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-bold text-emerald-400">45</span>
            <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1 rounded border border-emerald-500/30">100% Cleared</span>
          </div>
        </div>

      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-1.5 bg-[#0A0F18] p-1 rounded-lg border border-[#1B2536]">
          {[
            { id: 'ALL', label: 'All Alerts (12)' },
            { id: 'CRITICAL', label: 'Critical (2)' },
            { id: 'HIGH', label: 'High (4)' },
            { id: 'MEDIUM', label: 'Medium (5)' },
            { id: 'LOW', label: 'Low (1)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterSeverity(tab.id)}
              className={`px-3 py-1.5 rounded transition-all font-semibold ${
                filterSeverity === tab.id 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search incident, target, camera..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0A0F18] border border-[#1B2536] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center space-x-1.5 bg-[#0A0F18] rounded-lg px-2.5 py-1.5 border border-[#1B2536] text-xs text-slate-300">
            <Filter size={13} className="text-slate-400" />
            <select className="bg-transparent focus:outline-none cursor-pointer">
              <option value="all" className="bg-[#0A0F18]">All Sectors</option>
              <option value="s4" className="bg-[#0A0F18]">Sector 4</option>
              <option value="s2" className="bg-[#0A0F18]">Sector 2</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-[#0A0F18] rounded-lg px-2.5 py-1.5 border border-[#1B2536] text-xs text-slate-300">
            <select className="bg-transparent focus:outline-none cursor-pointer">
              <option value="all" className="bg-[#0A0F18]">All Status</option>
              <option value="new" className="bg-[#0A0F18]">New</option>
              <option value="ack" className="bg-[#0A0F18]">Acknowledged</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── MAIN 2-COLUMN WORKSPACE: ALERT LIST (LEFT) & DETAIL INSPECTION (RIGHT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT COLUMN: ALERTS LIST (~48%) */}
        <div className="lg:col-span-6 space-y-2.5">
          {filteredAlerts.map((alt) => {
            const isSelected = alt.id === selectedAlertId;
            return (
              <div 
                key={alt.id}
                onClick={() => setSelectedAlertId(alt.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 group shadow-lg ${
                  isSelected 
                    ? 'bg-[#0E1624] border-red-500/70 shadow-red-950/30' 
                    : 'bg-[#0A0F18] border-[#1B2536] hover:border-cyan-500/40 hover:bg-[#0D1420]'
                }`}
              >
                {/* Thumbnail Image */}
                <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-black/60 border border-[#1E293B] flex-shrink-0">
                  <img src={alt.thumb} alt={alt.type} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-cyan-400">{alt.id}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        alt.severity === 'CRITICAL' ? 'bg-red-950 text-red-400 border border-red-500/30' :
                        alt.severity === 'HIGH' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
                        alt.severity === 'MEDIUM' ? 'bg-yellow-950 text-yellow-400 border border-yellow-500/30' :
                        'bg-blue-950 text-blue-400 border border-blue-500/30'
                      }`}>
                        {alt.severity}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-950 text-blue-400 border border-blue-500/30">
                        NEW
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">{alt.timestamp}</span>
                  </div>

                  <div className="text-white font-bold text-xs mt-1 truncate">
                    {alt.type}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span className="truncate max-w-[180px]">{alt.cameraName}</span>
                    <span>Target: <strong className="text-slate-200">{alt.objectType}</strong> ({alt.confidence}%)</span>
                  </div>
                </div>

                <ChevronRight size={16} className={`flex-shrink-0 ${isSelected ? 'text-red-400' : 'text-slate-600 group-hover:text-cyan-400'}`} />
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: DETAIL INSPECTION CONSOLE (~52%) */}
        <div className="lg:col-span-6 bg-[#0A0F18] border border-[#1B2536] rounded-xl p-4 space-y-4 shadow-xl font-mono text-xs">
          
          {/* Header Bar */}
          <div className="flex justify-between items-start border-b border-[#1B2536] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold">{selectedAlert.id}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-500/30">
                  {selectedAlert.severity}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-500/30">
                  NEW
                </span>
                <span className="text-slate-500 text-[10px]">{selectedAlert.timeStr}</span>
              </div>
              <h2 className="text-base font-bold text-white mt-1">{selectedAlert.type}</h2>
              <p className="text-[11px] text-slate-400">{selectedAlert.cameraName}</p>
            </div>

            {/* Circular Risk Score Indicator */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border-2 border-red-500 flex items-center justify-center font-black text-base text-red-400 bg-red-950/40 shadow-inner">
                {selectedAlert.score}
              </div>
              <span className="text-[9px] text-red-400 font-bold mt-1">Risk Score</span>
            </div>
          </div>

          {/* Video Preview & Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            
            {/* Real Snapshot Video Frame */}
            <div className="sm:col-span-7 relative rounded-lg overflow-hidden border border-[#1E293B] bg-black">
              <img 
                src="/alert-detail-feed.jpg" 
                alt="Alert Detail Feed" 
                className="w-full h-auto aspect-video object-cover"
              />
              <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/80 rounded text-[9px] font-bold text-slate-200 border border-slate-700">
                {selectedAlert.camera}
              </div>
              <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-950 text-red-400 rounded text-[9px] font-bold border border-red-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
              </div>
              <div className="absolute bottom-2 left-2 right-2 px-2 py-0.5 bg-black/80 rounded text-[9px] text-slate-300 flex justify-between border border-slate-800">
                <span>{selectedAlert.trackingId} | {selectedAlert.confidence}%</span>
                <span>{selectedAlert.timestamp}</span>
              </div>
            </div>

            {/* Target Metadata Table */}
            <div className="sm:col-span-5 space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between border-b border-[#1E293B] pb-1">
                <span className="text-slate-500">Target</span>
                <span className="text-white font-bold">{selectedAlert.objectType}</span>
              </div>
              <div className="flex justify-between border-b border-[#1E293B] pb-1">
                <span className="text-slate-500">Track ID</span>
                <span className="text-cyan-400 font-bold">{selectedAlert.trackingId}</span>
              </div>
              <div className="flex justify-between border-b border-[#1E293B] pb-1">
                <span className="text-slate-500">Camera</span>
                <span className="text-slate-200">{selectedAlert.camera}</span>
              </div>
              <div className="flex justify-between border-b border-[#1E293B] pb-1">
                <span className="text-slate-500">Location</span>
                <span className="text-slate-200 truncate max-w-[100px]">North Fence Alpha</span>
              </div>
              <div className="flex justify-between border-b border-[#1E293B] pb-1">
                <span className="text-slate-500">Confidence</span>
                <span className="text-emerald-400 font-bold">{selectedAlert.confidence}%</span>
              </div>
              <div className="flex justify-between border-b border-[#1E293B] pb-1">
                <span className="text-slate-500">Risk Score</span>
                <span className="text-red-400 font-bold">{selectedAlert.score} / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className="text-cyan-400 font-bold">{selectedAlert.status}</span>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button 
              size="sm" 
              onClick={() => handleAction(selectedAlert.id, 'ACKNOWLEDGED')}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
            >
              <Check size={14} className="mr-1" /> Acknowledge Alert
            </Button>
            <Button 
              size="sm" 
              onClick={() => handleAction(selectedAlert.id, 'DISPATCHED')}
              className="bg-transparent hover:bg-red-950/40 text-red-400 border border-red-500/50 font-bold text-xs"
            >
              <Radio size={14} className="mr-1" /> Dispatch Patrol Unit
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="border-[#1E293B] text-slate-300 hover:text-white text-xs"
            >
              <Share2 size={13} className="mr-1" /> Create Evidence Dossier
            </Button>
          </div>

          {/* Tabs for Timeline / Snapshots */}
          <div className="border-t border-[#1B2536] pt-3">
            <div className="flex items-center gap-2 border-b border-[#1B2536] pb-2 text-xs">
              {[
                { id: 'timeline', label: 'Timeline' },
                { id: 'snapshots', label: 'Snapshots' },
                { id: 'tracks', label: 'Track History' },
                { id: 'related', label: 'Related Incidents' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeTab === t.id 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Timeline Content */}
            <div className="pt-3 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-ping" />
                <span className="text-slate-500 w-16">12:53:04</span>
                <span className="text-slate-200">Person detected in restricted zone (94%)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                <span className="text-slate-500 w-16">12:53:05</span>
                <span className="text-slate-200">Alert generated (ALT-0042)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                <span className="text-slate-500 w-16">12:53:07</span>
                <span className="text-slate-200">Notified control room</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-slate-600 flex-shrink-0" />
                <span className="text-slate-500 w-16">12:53:10</span>
                <span className="text-slate-400">Awaiting operator acknowledgement</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default AlertsPage;
