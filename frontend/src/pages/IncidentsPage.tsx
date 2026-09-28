import React, { useState } from 'react';
import { 
  Shield, Clock, MapPin, Users, FileText, CheckCircle, AlertTriangle, 
  Paperclip, Activity, Search, Filter, Plus, ChevronDown, Share2, 
  MoreVertical, Play, Maximize2, Radio, Crosshair, ArrowRight, Video,
  Compass, Eye, ShieldCheck, RefreshCw, Send, Check
} from 'lucide-react';
import { RiskScoreDisplay } from '../components/alerts/RiskScoreDisplay';

interface IncidentEvent {
  id: number;
  time: string;
  action: string;
  details: string;
  badge?: string;
}

interface IncidentNote {
  id: number;
  user: string;
  text: string;
  time: string;
}

interface Incident {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'Investigating' | 'Assigned' | 'Resolved' | 'Open';
  location: string;
  sector: string;
  cameras: string[];
  riskScore: number;
  assignedTo: string;
  createdAt: string;
  thumb: string;
  targetType: string;
  trackId: string;
  firstDetected: string;
  lastSeen: string;
  aiConf: number;
  timeline: IncidentEvent[];
  alerts: string[];
  evidence: string[];
  notes: IncidentNote[];
}

const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'INC-0042',
    title: 'Zone Intrusion',
    severity: 'CRITICAL',
    status: 'Investigating',
    location: 'Sector 4, North Fence Alpha',
    sector: 'Sector 4',
    cameras: ['CAM-N-01', 'CAM-N-02'],
    riskScore: 87,
    assignedTo: 'operator_alpha',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    thumb: '/feed-bop01.jpg',
    targetType: 'Person',
    trackId: '#TRK-9921',
    firstDetected: '12:52:41',
    lastSeen: '12:53:04',
    aiConf: 94,
    timeline: [
      { id: 1, time: '12:52:41', action: 'Zone Tripwire Triggered', details: 'Automated AI classification detected human target crossing Alpha perimeter line.', badge: 'CRITICAL' },
      { id: 2, time: '12:52:50', action: 'System Alert Correlated', details: 'System correlated 3 high-risk alerts from CAM-N-01 and CAM-N-02.', badge: 'HIGH' },
      { id: 3, time: '12:53:00', action: 'Operator Acknowledged', details: 'Verified and assigned to operator_alpha.', badge: 'INFO' },
      { id: 4, time: '12:53:15', action: 'Patrol Unit Alerted', details: 'Patrol Charlie notified for physical interception.', badge: 'DISPATCH' },
    ],
    alerts: ['ALT-0042', 'ALT-0043', 'ALT-0044'],
    evidence: ['EVD-992 (High-Res Snapshot)', 'EVD-993 (Thermal Stream MP4)'],
    notes: [
      { id: 1, user: 'operator_alpha', text: 'Subject visually confirmed near fence breach, dispatching patrol charlie.', time: '12:53:10' }
    ]
  },
  {
    id: 'INC-0041',
    title: 'High Speed Vehicle Approach',
    severity: 'HIGH',
    status: 'Assigned',
    location: 'Sector 2, West Gate',
    sector: 'Sector 2',
    cameras: ['CAM-W-03'],
    riskScore: 72,
    assignedTo: 'operator_beta',
    createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
    thumb: '/feed-road01.jpg',
    targetType: 'Vehicle',
    trackId: '#TRK-8814',
    firstDetected: '10:45:10',
    lastSeen: '10:46:02',
    aiConf: 91,
    timeline: [
      { id: 1, time: '10:45:10', action: 'Speed Limit Breach', details: 'Radar sensor clocking 92 km/h in 30 km/h perimeter buffer.', badge: 'HIGH' },
      { id: 2, time: '10:45:30', action: 'Assigned to Beta', details: 'Operator Beta reviewing ANPR hit match.', badge: 'INFO' },
    ],
    alerts: ['ALT-0041'],
    evidence: ['EVD-842 (ANPR Capture)'],
    notes: [
      { id: 1, user: 'operator_beta', text: 'Flagged vehicle verified as logistics contractor with delayed badge.', time: '10:48:22' }
    ]
  },
  {
    id: 'INC-0040',
    title: 'Multiple Loitering In Buffer',
    severity: 'MEDIUM',
    status: 'Resolved',
    location: 'Sector 7, East Buffer',
    sector: 'Sector 7',
    cameras: ['CAM-E-01', 'CAM-E-05'],
    riskScore: 45,
    assignedTo: 'operator_gamma',
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    thumb: '/feed-watch01.jpg',
    targetType: 'Group (3)',
    trackId: '#TRK-7719',
    firstDetected: '08:14:22',
    lastSeen: '08:29:45',
    aiConf: 89,
    timeline: [
      { id: 1, time: '08:14:22', action: 'Loitering Threshold > 15m', details: 'AI detected 3 subjects standing in unpaved restricted zone.', badge: 'MEDIUM' },
      { id: 2, time: '08:29:45', action: 'Resolved', details: 'Confirmed authorized maintenance crew with work permit.', badge: 'SUCCESS' },
    ],
    alerts: ['ALT-0038', 'ALT-0039'],
    evidence: ['EVD-771 (Permit Document)'],
    notes: [
      { id: 1, user: 'operator_gamma', text: 'Confirmed authorized telecom repair team.', time: '08:30:00' }
    ]
  }
];

export function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>(MOCK_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<Incident>(MOCK_INCIDENTS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'Overview' | 'Evidence' | 'Timeline' | 'Actions' | 'Related Events' | 'Audit Log'>('Overview');
  const [newNote, setNewNote] = useState('');

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = inc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inc.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || inc.status === statusFilter;
    const matchesSector = sectorFilter === 'ALL' || inc.sector === sectorFilter;
    return matchesSearch && matchesStatus && matchesSector;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 text-[10px] font-black font-mono tracking-wider bg-red-500/20 text-red-400 rounded border border-red-500/40">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 text-[10px] font-black font-mono tracking-wider bg-orange-500/20 text-orange-400 rounded border border-orange-500/40">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 text-[10px] font-black font-mono tracking-wider bg-amber-500/20 text-amber-400 rounded border border-amber-500/40">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-black font-mono tracking-wider bg-blue-500/20 text-blue-400 rounded border border-blue-500/40">LOW</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-400 rounded border border-emerald-500/30">Resolved</span>;
      case 'Investigating':
        return <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-purple-500/15 text-purple-400 rounded border border-purple-500/30">Investigating</span>;
      case 'Assigned':
        return <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-cyan-500/15 text-cyan-400 rounded border border-cyan-500/30">Assigned</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-slate-500/15 text-slate-300 rounded border border-slate-500/30">Open</span>;
    }
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    const note: IncidentNote = {
      id: Date.now(),
      user: 'operator_alpha',
      text: newNote,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setSelectedIncident(prev => ({
      ...prev,
      notes: [note, ...prev.notes]
    }));
    setNewNote('');
  };

  const handleUpdateStatus = (newStatus: Incident['status']) => {
    setSelectedIncident(prev => ({ ...prev, status: newStatus }));
    setIncidents(prev => prev.map(inc => inc.id === selectedIncident.id ? { ...inc, status: newStatus } : inc));
  };

  return (
    <div className="flex flex-col h-full bg-[#070B12] text-slate-200 overflow-y-auto">
      {/* Top Header & Stat Banner (Mirrors media_1790494751038.jpg) */}
      <div className="bg-[#0A0F18] border-b border-[#1B2536] px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-mono">Incident Workspace</h1>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold border border-cyan-500/30">
                ACTIVE AUDIT
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Correlated events, evidence and investigation tools
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-[#070B12] border border-[#1B2536] rounded-lg px-3 py-1.5 font-mono text-xs">
              <span className="text-slate-400">Active Incidents:</span>
              <span className="font-bold text-white">14</span>
              <span className="text-slate-600">|</span>
              <span className="text-red-400 font-bold">2 Critical</span>
              <span className="text-slate-600">|</span>
              <span className="text-orange-400 font-bold">4 High</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400 font-bold">5 Med</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-bold">45 Resolved Today</span>
            </div>

            <button 
              onClick={() => alert('New Incident Creation Dialog')}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs font-mono transition-colors shadow-lg shadow-cyan-950/40"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              Create Incident
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#151D2A]">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search incidents by ID, zone, or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#070B12] border border-[#1B2536] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#070B12] border border-[#1B2536] text-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="Investigating">Investigating</option>
              <option value="Assigned">Assigned</option>
              <option value="Resolved">Resolved</option>
              <option value="Open">Open</option>
            </select>

            {/* Sector Filter */}
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-[#070B12] border border-[#1B2536] text-slate-300 rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="ALL">All Sectors</option>
              <option value="Sector 2">Sector 2</option>
              <option value="Sector 4">Sector 4</option>
              <option value="Sector 7">Sector 7</option>
            </select>

            <button 
              onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setSectorFilter('ALL'); }}
              className="p-1.5 bg-[#070B12] border border-[#1B2536] hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              title="Reset Filters"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace Body: 2 Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left List Pane (Mirrors media_1790494751038.jpg left panel) */}
        <div className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-r border-[#1B2536] bg-[#0A0F18]/60 flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 bg-[#070B12] border-b border-[#1B2536] flex items-center justify-between text-xs font-mono text-slate-400">
            <span>SHOWING {filteredIncidents.length} CORRELATED CASES</span>
            <span className="text-[11px] text-cyan-400 font-bold">AUTO-SYNC ON</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {filteredIncidents.map(inc => {
              const isSelected = selectedIncident.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#0E1624] border-cyan-500/60 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/30'
                      : 'bg-[#0A0F18] border-[#1B2536] hover:bg-[#0E1624]/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Camera Thumbnail */}
                    <div className="relative w-20 h-16 rounded-lg overflow-hidden bg-slate-900 border border-[#1E293B] flex-shrink-0">
                      <img 
                        src={inc.thumb} 
                        alt={inc.id} 
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                      <div className="absolute top-1 left-1 px-1 py-0.2 bg-black/70 rounded text-[9px] font-mono text-cyan-300 font-bold">
                        {inc.cameras[0]}
                      </div>
                      <div className="absolute bottom-1 right-1 px-1 py-0.2 bg-red-950/80 text-red-400 rounded text-[8px] font-mono font-bold">
                        {inc.riskScore}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-mono font-bold text-xs text-white tracking-wider">{inc.id}</span>
                        {getSeverityBadge(inc.severity)}
                      </div>

                      <div className="font-bold text-xs text-slate-200 truncate mt-0.5">{inc.title}</div>
                      
                      <div className="text-[11px] text-slate-400 font-mono truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                        <span className="truncate">{inc.location}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-[#1A2333] text-[10px] font-mono text-slate-500">
                        {getStatusBadge(inc.status)}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {inc.firstDetected}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredIncidents.length === 0 && (
              <div className="text-center py-12 text-slate-500 font-mono text-xs">
                No incidents match current filters.
              </div>
            )}
          </div>
        </div>

        {/* Right Detail Workspace (Mirrors media_1790494751038.jpg right side) */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-[#070B12]">
          {/* Selected Incident Banner */}
          <div className="p-4 bg-[#0A0F18] border-b border-[#1B2536] flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-lg text-white tracking-wider">{selectedIncident.id}</span>
                {getSeverityBadge(selectedIncident.severity)}
                {getStatusBadge(selectedIncident.status)}
                <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                  Assigned: <strong className="text-slate-200">{selectedIncident.assignedTo}</strong>
                </span>
              </div>
              <h2 className="text-sm font-bold text-white font-mono mt-1 flex items-center gap-2">
                <span>{selectedIncident.title}</span>
                <span className="text-slate-500">·</span>
                <span className="text-cyan-400 text-xs font-normal">{selectedIncident.location}</span>
              </h2>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <select
                value={selectedIncident.status}
                onChange={(e) => handleUpdateStatus(e.target.value as any)}
                className="bg-[#070B12] border border-cyan-500/40 text-cyan-300 font-bold rounded-lg px-3 py-1.5 outline-none cursor-pointer"
              >
                <option value="Investigating">Status: Investigating</option>
                <option value="Assigned">Status: Assigned</option>
                <option value="Resolved">Status: Resolved</option>
                <option value="Open">Status: Open</option>
              </select>

              <button 
                onClick={() => alert(`Shared dossier for ${selectedIncident.id}`)}
                className="p-1.5 bg-[#070B12] border border-[#1B2536] hover:bg-slate-800 rounded-lg text-slate-300"
                title="Share Dossier"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button 
                onClick={() => alert('Incident Options')}
                className="p-1.5 bg-[#070B12] border border-[#1B2536] hover:bg-slate-800 rounded-lg text-slate-300"
                title="More Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="px-4 border-b border-[#1B2536] bg-[#070B12] flex items-center space-x-1 overflow-x-auto text-xs font-mono">
            {(['Overview', 'Evidence', 'Timeline', 'Actions', 'Related Events', 'Audit Log'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2.5 font-bold transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab 
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content: Overview (Default) */}
          <div className="p-4 space-y-4">
            {/* Top Grid: Video Feed (Left) + Incident Metadata & Immediate Actions (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* CCTV Live Feed Player (Mirrors media_1790494751038.jpg central feed) */}
              <div className="lg:col-span-7 bg-[#0A0F18] border border-[#1B2536] rounded-xl overflow-hidden shadow-xl flex flex-col">
                <div className="px-3 py-2 bg-[#070B12] border-b border-[#1B2536] flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-bold text-white">{selectedIncident.cameras[0]} North Fence Alpha</span>
                    <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 border border-red-500/40 rounded text-[9px] font-bold animate-pulse">
                      ● LIVE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    1080p · 30 FPS · AI ENHANCED
                  </div>
                </div>

                {/* Video Image Container with HUD */}
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  <img 
                    src="/incident-feed-crop.jpg" 
                    alt="Incident Feed"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/feed-bop01.jpg';
                    }}
                  />

                  {/* Synthetic Bounding Box & Target HUD */}
                  <div className="absolute top-[28%] left-[42%] w-[26%] h-[55%] border-2 border-red-500/90 rounded bg-red-500/10 pointer-events-none">
                    <div className="absolute -top-5 left-0 px-1.5 py-0.5 bg-red-600 text-slate-950 font-black font-mono text-[9px] tracking-wider rounded">
                      PERSON // CONF {selectedIncident.aiConf}%
                    </div>
                    <div className="absolute bottom-1 right-1 text-[9px] font-mono text-red-300 font-bold bg-black/60 px-1 rounded">
                      {selectedIncident.trackId}
                    </div>
                  </div>

                  {/* Top-Right HUD Crosshair */}
                  <div className="absolute top-3 right-3 font-mono text-[10px] text-cyan-400 bg-black/70 px-2 py-1 rounded border border-cyan-500/30">
                    REC [2026-09-27 12:53:04 UTC]
                  </div>

                  {/* Bottom Playback Bar */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2.5 flex items-center justify-between text-xs font-mono text-slate-300">
                    <div className="flex items-center gap-3">
                      <button className="p-1 hover:text-cyan-400 transition-colors">
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                      <span className="text-[10px] text-slate-400">00:14 / 01:30</span>
                    </div>

                    {/* Progress track */}
                    <div className="flex-1 mx-4 h-1.5 bg-slate-800 rounded-full overflow-hidden relative cursor-pointer">
                      <div className="h-full bg-cyan-500 w-[45%]" />
                      <div className="absolute left-[45%] top-0 bottom-0 w-2 bg-white rounded-full -translate-x-1" />
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="p-1 hover:text-cyan-400">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-bar below video */}
                <div className="px-3 py-2 bg-[#0A0F18] border-t border-[#1B2536] flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Cross-Camera Handoff: <strong className="text-white">CAM-N-02 (Ready)</strong></span>
                  <button 
                    onClick={() => alert('Switched to secondary angle')}
                    className="text-cyan-400 hover:text-cyan-300 font-bold"
                  >
                    Switch to Angle 2 →
                  </button>
                </div>
              </div>

              {/* Incident Details Card & Tactical Actions (Mirrors media_1790494751038.jpg right panel) */}
              <div className="lg:col-span-5 bg-[#0A0F18] border border-[#1B2536] rounded-xl p-4 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[#1B2536] pb-3 mb-3">
                    <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      Incident Telemetry
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 text-[10px] font-mono font-black">
                      RISK SCORE {selectedIncident.riskScore}/100
                    </span>
                  </div>

                  {/* Key-Value Telemetry Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-[#070B12] p-2.5 rounded-lg border border-[#1B2536]">
                      <span className="text-[10px] text-slate-500 block uppercase">Target Type</span>
                      <span className="font-bold text-white">{selectedIncident.targetType}</span>
                    </div>

                    <div className="bg-[#070B12] p-2.5 rounded-lg border border-[#1B2536]">
                      <span className="text-[10px] text-slate-500 block uppercase">Track Identifier</span>
                      <span className="font-bold text-cyan-400">{selectedIncident.trackId}</span>
                    </div>

                    <div className="bg-[#070B12] p-2.5 rounded-lg border border-[#1B2536]">
                      <span className="text-[10px] text-slate-500 block uppercase">Primary Camera</span>
                      <span className="font-bold text-white">{selectedIncident.cameras[0]}</span>
                    </div>

                    <div className="bg-[#070B12] p-2.5 rounded-lg border border-[#1B2536]">
                      <span className="text-[10px] text-slate-500 block uppercase">AI Model Conf</span>
                      <span className="font-bold text-emerald-400">{selectedIncident.aiConf}% High</span>
                    </div>

                    <div className="bg-[#070B12] p-2.5 rounded-lg border border-[#1B2536]">
                      <span className="text-[10px] text-slate-500 block uppercase">First Detected</span>
                      <span className="font-bold text-slate-300">{selectedIncident.firstDetected}</span>
                    </div>

                    <div className="bg-[#070B12] p-2.5 rounded-lg border border-[#1B2536]">
                      <span className="text-[10px] text-slate-500 block uppercase">Last Seen</span>
                      <span className="font-bold text-amber-400">{selectedIncident.lastSeen}</span>
                    </div>
                  </div>

                  {/* Correlated Alerts Pills */}
                  <div className="mt-3 p-2.5 bg-[#070B12] rounded-lg border border-[#1B2536]">
                    <span className="text-[10px] text-slate-500 font-mono uppercase block mb-1.5">Correlated Threat Alerts</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedIncident.alerts.map(alt => (
                        <span key={alt} className="px-2 py-0.5 bg-[#0E1624] text-cyan-300 border border-cyan-500/30 rounded font-mono text-[11px] font-bold">
                          {alt}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons (Mirrors media_1790494751038.jpg) */}
                <div className="mt-4 pt-3 border-t border-[#1B2536] space-y-2 font-mono">
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => { handleUpdateStatus('Investigating'); alert(`Acknowledged ${selectedIncident.id}`); }}
                      className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      Acknowledge
                    </button>

                    <button 
                      onClick={() => alert(`Patrol Charlie dispatched to ${selectedIncident.location}`)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/40"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Dispatch Patrol
                    </button>
                  </div>

                  <button 
                    onClick={() => alert(`Evidence dossier generated for ${selectedIncident.id}`)}
                    className="w-full px-3 py-2 bg-[#070B12] hover:bg-slate-800 border border-[#1E293B] text-slate-200 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    Create Evidence Dossier
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom Row: Map Location (Left) + Recent Timeline & Notes (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* Related Map Location (Mirrors media_1790494751038.jpg bottom left) */}
              <div className="lg:col-span-5 bg-[#0A0F18] border border-[#1B2536] rounded-xl p-4 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[#1B2536] pb-3 mb-3">
                    <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                      <Compass className="w-4 h-4 text-cyan-400" />
                      Related Map Location
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">GRID 42-N</span>
                  </div>

                  {/* Satellite / Tactical Map Graphic */}
                  <div className="relative rounded-lg overflow-hidden border border-[#1B2536] aspect-[16/9] bg-slate-900 group">
                    <img 
                      src="/incident-map-thumb.jpg" 
                      alt="Map Location"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/fences-intrusion-map.jpg';
                      }}
                    />
                    
                    {/* Crosshair Overlay */}
                    <div className="absolute inset-0 bg-cyan-950/20 pointer-events-none flex items-center justify-center">
                      <Crosshair className="w-10 h-10 text-red-500 animate-pulse" />
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 p-2 bg-slate-950/85 backdrop-blur-sm rounded border border-white/10 text-xs font-mono">
                      <div className="font-bold text-white flex items-center justify-between">
                        <span>{selectedIncident.location}</span>
                        <span className="text-red-400 font-black">RESTRICTED ZONE</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">LAT: 32.7266° N · LON: 74.8570° E</div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#1B2536] flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-400">Tactical GIS Layer: <strong>Armed Perimeter</strong></span>
                  <button 
                    onClick={() => alert('Navigating to Live Tactical Map...')}
                    className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-bold"
                  >
                    Open in Map <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Recent Events & Case Notes (Mirrors media_1790494751038.jpg bottom right) */}
              <div className="lg:col-span-7 bg-[#0A0F18] border border-[#1B2536] rounded-xl p-4 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[#1B2536] pb-3 mb-3">
                    <span className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      Recent Events ({selectedIncident.timeline.length})
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">CHRONOLOGICAL AUDIT</span>
                  </div>

                  {/* Timeline list */}
                  <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                    {selectedIncident.timeline.map((evt) => (
                      <div key={evt.id} className="p-2 rounded-lg bg-[#070B12] border border-[#1B2536] flex items-start gap-2.5 text-xs font-mono">
                        <span className="text-cyan-400 font-bold text-[11px] mt-0.5 flex-shrink-0">{evt.time}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-200">{evt.action}</span>
                            {evt.badge && (
                              <span className="px-1.5 py-0.2 bg-slate-800 text-[9px] font-bold text-slate-300 rounded border border-slate-700">
                                {evt.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{evt.details}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Note Input Bar */}
                <form onSubmit={handleAddNote} className="mt-3 pt-3 border-t border-[#1B2536] flex items-center gap-2 font-mono">
                  <input
                    type="text"
                    placeholder="Append investigation log note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 bg-[#070B12] border border-[#1B2536] rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  <button 
                    type="submit"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-[#1E293B] text-cyan-400 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    Add Note
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
