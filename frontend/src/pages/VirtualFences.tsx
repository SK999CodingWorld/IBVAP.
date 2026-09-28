import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { 
  Map, AlertTriangle, Clock, Plus, Trash2, Edit2, ShieldAlert, 
  Eye, CheckCircle2, Sliders, Layers, Compass, Crosshair, 
  Activity, Shield, ArrowUpRight, Zap, X, Check, Undo, RotateCcw,
  Camera, Sparkles, AlertCircle
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface FenceZone {
  id: string;
  name: string;
  camera: string;
  type: 'Polygon' | 'Line Crossing' | 'Rectangle';
  status: 'active' | 'inactive';
  severity: 'critical' | 'high' | 'medium' | 'low';
  schedule: string;
  violations: number;
  threatLevel: number;
  previewImg: string;
  color: string;
  coordinates?: [number, number][];
}

const MOCK_ZONES: FenceZone[] = [
  { 
    id: '1', 
    name: 'Restricted Zone Alpha', 
    camera: 'CAM-01 (Sector 4 North)', 
    type: 'Polygon', 
    status: 'active', 
    severity: 'critical', 
    schedule: '24/7 Monitored', 
    violations: 12,
    threatLevel: 88,
    previewImg: '/fence-feed-alpha.jpg',
    color: '#EF4444',
    coordinates: [[60, 40], [280, 40], [280, 180], [60, 180]]
  },
  { 
    id: '2', 
    name: 'Perimeter Fence East', 
    camera: 'CAM-04 (Sector 2 East)', 
    type: 'Line Crossing', 
    status: 'active', 
    severity: 'high', 
    schedule: '22:00 - 05:00 Night Guard', 
    violations: 3,
    threatLevel: 45,
    previewImg: '/fence-feed-east.jpg',
    color: '#F59E0B',
    coordinates: [[20, 110], [320, 110]]
  },
  { 
    id: '3', 
    name: 'Checkpoint Entry Line', 
    camera: 'CAM-05 (Highway Gate)', 
    type: 'Line Crossing', 
    status: 'inactive', 
    severity: 'medium', 
    schedule: '24/7 Monitored', 
    violations: 0,
    threatLevel: 15,
    previewImg: '/fence-feed-check.jpg',
    color: '#3B82F6',
    coordinates: [[40, 120], [300, 120]]
  }
];

const AVAILABLE_CAMERAS = [
  { id: 'cam1', name: 'CAM-01 (Sector 4 North)', preview: '/fence-feed-alpha.jpg' },
  { id: 'cam2', name: 'CAM-02 (BOP Wagah Sector)', preview: '/feed-bop02.jpg' },
  { id: 'cam4', name: 'CAM-04 (Sector 2 East)', preview: '/fence-feed-east.jpg' },
  { id: 'cam5', name: 'CAM-05 (Highway Gate)', preview: '/fence-feed-check.jpg' },
];

export const VirtualFences = () => {
  const [zones, setZones] = useState<FenceZone[]>(MOCK_ZONES);
  const [selectedZone, setSelectedZone] = useState<FenceZone>(MOCK_ZONES[0]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [eventsZone, setEventsZone] = useState<FenceZone | null>(null);

  // New Zone Form State
  const [formName, setFormName] = useState('');
  const [formCamera, setFormCamera] = useState('CAM-01 (Sector 4 North)');
  const [formType, setFormType] = useState<'Polygon' | 'Line Crossing' | 'Rectangle'>('Polygon');
  const [formSeverity, setFormSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('critical');
  const [formSchedule, setFormSchedule] = useState('24/7 Monitored');
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [fenceNotification, setFenceNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFenceNotification(msg);
    setTimeout(() => setFenceNotification(null), 3500);
  };

  // Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<L.Map | null>(null);

  // Fetch Zones from Backend API on Mount
  useEffect(() => {
    const fetchBackendZones = async () => {
      try {
        const res = await fetch('/api/zones');
        if (res.ok) {
          const json = await res.json();
          if (json.data && Array.isArray(json.data) && json.data.length > 0) {
            const mapped: FenceZone[] = json.data.map((item: any, idx: number) => {
              const cfg = item.config || {};
              const isPoly = cfg.type === 'polygon';
              return {
                id: item.id || `zone_${idx + 1}`,
                name: cfg.name || `Zone ${idx + 1}`,
                camera: cfg.camera_id === 'cam1' ? 'CAM-01 (Sector 4 North)' : 
                        cfg.camera_id === 'cam2' ? 'CAM-02 (BOP Wagah)' : 
                        cfg.camera_id === 'cam4' ? 'CAM-04 (Sector 2 East)' : 'CAM-05 (Highway Gate)',
                type: isPoly ? 'Polygon' : 'Line Crossing',
                status: cfg.enabled ? 'active' : 'inactive',
                severity: idx === 0 ? 'critical' : idx === 1 ? 'high' : 'medium',
                schedule: '24/7 Monitored',
                violations: idx === 0 ? 12 : idx === 1 ? 3 : 0,
                threatLevel: idx === 0 ? 88 : idx === 1 ? 45 : 15,
                previewImg: idx === 0 ? '/fence-feed-alpha.jpg' : idx === 1 ? '/fence-feed-east.jpg' : '/fence-feed-check.jpg',
                color: idx === 0 ? '#EF4444' : idx === 1 ? '#F59E0B' : '#3B82F6',
                coordinates: cfg.coordinates
              };
            });
            // Merge with mock presets if needed
            setZones(mapped);
            if (mapped.length > 0) setSelectedZone(mapped[0]);
          }
        }
      } catch (err) {
        console.warn('Using local tactical zone presets:', err);
      }
    };
    fetchBackendZones();
  }, []);

  // Redraw Canvas Overlay
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (drawingPoints.length === 0) return;

    // Draw lines between points
    ctx.beginPath();
    ctx.moveTo(drawingPoints[0][0], drawingPoints[0][1]);
    for (let i = 1; i < drawingPoints.length; i++) {
      ctx.lineTo(drawingPoints[i][0], drawingPoints[i][1]);
    }

    if (formType === 'Polygon' && drawingPoints.length > 2) {
      ctx.closePath();
      ctx.fillStyle = formSeverity === 'critical' ? 'rgba(239, 68, 68, 0.22)' : 'rgba(245, 158, 11, 0.22)';
      ctx.fill();
    }

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = formSeverity === 'critical' ? '#EF4444' : '#F59E0B';
    ctx.shadowColor = formSeverity === 'critical' ? '#EF4444' : '#F59E0B';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw vertex handles
    drawingPoints.forEach(([x, y], idx) => {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#EF4444';
      ctx.stroke();

      // Coordinate Tag
      ctx.fillStyle = '#E2E8F0';
      ctx.font = '10px monospace';
      ctx.fillText(`P${idx + 1}`, x + 8, y - 5);
    });
  }, [drawingPoints, formType, formSeverity]);

  // Canvas Click Handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    if (formType === 'Line Crossing' && drawingPoints.length >= 2) {
      setDrawingPoints([[x, y]]);
      return;
    }

    setDrawingPoints(prev => [...prev, [x, y]]);
  };

  // Toggle Zone Armed Status
  const toggleZone = async (id: string) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, status: z.status === 'active' ? 'inactive' : 'active' } : z));
    try {
      await fetch(`/api/zones/${id}/toggle`, { method: 'POST' });
    } catch (e) {
      console.warn('Backend toggle offline, updated local state');
    }
  };

  // Delete Zone
  const handleDeleteZone = async (id: string, name: string) => {
    if (confirm(`Revoke and delete virtual fence "${name}"?`)) {
      setZones(prev => prev.filter(z => z.id !== id));
      try {
        await fetch(`/api/zones/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('Backend delete offline, removed locally');
      }
    }
  };

  // Save New Zone
  const handleCreateZoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newId = `zone_${Date.now().toString().slice(-4)}`;
    const camImg = AVAILABLE_CAMERAS.find(c => c.name === formCamera)?.preview || '/fence-feed-alpha.jpg';
    const newEntry: FenceZone = {
      id: newId,
      name: formName,
      camera: formCamera,
      type: formType,
      status: 'active',
      severity: formSeverity,
      schedule: formSchedule,
      violations: 0,
      threatLevel: formSeverity === 'critical' ? 85 : formSeverity === 'high' ? 50 : 25,
      previewImg: camImg,
      color: formSeverity === 'critical' ? '#EF4444' : formSeverity === 'high' ? '#F59E0B' : '#3B82F6',
      coordinates: drawingPoints.length > 0 ? drawingPoints : [[50, 50], [250, 50], [250, 150], [50, 150]]
    };

    setZones(prev => [newEntry, ...prev]);
    setSelectedZone(newEntry);
    setSavedSuccess(true);

    try {
      const camKey = formCamera.includes('CAM-01') ? 'cam1' : formCamera.includes('CAM-02') ? 'cam2' : 'cam4';
      await fetch('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId,
          config: {
            name: formName,
            type: formType.toLowerCase(),
            camera_id: camKey,
            coordinates: newEntry.coordinates,
            enabled: true,
            dwell_time: 2.0,
            classes: ['person', 'vehicle']
          }
        })
      });
    } catch (err) {
      console.warn('Backend zone saved locally:', err);
    }

    setTimeout(() => {
      setSavedSuccess(false);
      setShowCreateModal(false);
      setDrawingPoints([]);
      setFormName('');
    }, 1000);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <span className="px-2 py-0.5 text-[10px] font-bold font-mono tracking-wider bg-red-500/15 text-red-400 rounded border border-red-500/30">CRITICAL</span>;
      case 'high':
        return <span className="px-2 py-0.5 text-[10px] font-bold font-mono tracking-wider bg-orange-500/15 text-orange-400 rounded border border-orange-500/30">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 text-[10px] font-bold font-mono tracking-wider bg-amber-500/15 text-amber-400 rounded border border-amber-500/30">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold font-mono tracking-wider bg-blue-500/15 text-blue-400 rounded border border-blue-500/30">LOW</span>;
    }
  };

  const activeZonesCount = zones.filter(z => z.status === 'active').length;
  const totalViolations = zones.reduce((acc, z) => acc + z.violations, 0);

  return (
    <div className="p-6 h-full flex flex-col bg-[#070B12] text-slate-200 overflow-y-auto space-y-6 font-sans relative">
      
      {/* Toast Notification */}
      {fenceNotification && (
        <div className="fixed top-5 right-5 z-50 bg-[#0E1726] border border-cyan-500/50 shadow-2xl shadow-cyan-500/20 text-white px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-xs font-mono">
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Perimeter Control Update</div>
            <div className="text-slate-200 mt-0.5">{fenceNotification}</div>
          </div>
        </div>
      )}

      {/* Top Header with Backdrop */}
      <div className="relative rounded-2xl border border-[#1B2536] overflow-hidden shadow-2xl bg-[#0A0F18]">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity pointer-events-none"
          style={{ backgroundImage: `url('/fences-header-bg.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F18] via-[#0A0F18]/90 to-transparent pointer-events-none" />

        <div className="relative z-10 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <h1 className="text-xl md:text-2xl font-bold tracking-wider text-white font-mono flex items-center gap-2">
                Virtual Fences & Intrusion Tripwires
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Active perimeter defense boundaries, spatial tripwires, and restricted zone polygons
            </p>
          </div>

          <div className="flex items-center space-x-3 font-mono">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-3 py-1 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
              {activeZonesCount} / {zones.length} ARMED
            </Badge>
            <Button 
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition-all shadow-lg shadow-cyan-500/20 cursor-pointer" 
              onClick={() => {
                setFormName(`Perimeter-Zone-${zones.length + 1}`);
                setDrawingPoints([[80, 50], [280, 50], [280, 160], [80, 160]]);
                setShowCreateModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5 stroke-[3]" />
              Create Virtual Fence
            </Button>
          </div>
        </div>
      </div>

      {/* Top 3 Virtual Fence Cards (Mirrors media_1790495107442.jpg 3-col grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map((zone) => {
          const isActive = zone.status === 'active';
          return (
            <Card 
              key={zone.id} 
              onClick={() => setSelectedZone(zone)}
              className={`bg-[#0A0F18] border rounded-xl overflow-hidden flex flex-col transition-all cursor-pointer shadow-xl ${
                selectedZone.id === zone.id 
                  ? 'border-cyan-500/60 ring-1 ring-cyan-500/30' 
                  : 'border-[#1B2536] hover:border-slate-700'
              }`}
            >
              <CardHeader className="p-4 pb-3 border-b border-[#1B2536] bg-[#070B12]">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                      {zone.name}
                    </CardTitle>
                    <p className="text-xs text-slate-400 flex items-center mt-1 font-mono">
                      <Map className="w-3 h-3 mr-1 text-cyan-400" />
                      {zone.camera}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {isActive ? 'ARMED' : 'STANDBY'}
                    </span>
                    <Switch 
                      checked={isActive}
                      onCheckedChange={() => toggleZone(zone.id)}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 flex-1 space-y-4">
                {/* Camera Feed Preview with Realistic Tripwire Graphic */}
                <div className="aspect-video bg-black rounded-lg border border-[#1E293B] relative overflow-hidden flex items-center justify-center group">
                  <img 
                    src={zone.previewImg} 
                    alt={zone.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/feed-bop01.jpg';
                    }}
                  />

                  {/* Tripwire Graphics Overlay */}
                  {zone.type === 'Polygon' && (
                    <div className="absolute inset-4 border-2 border-red-500/70 bg-red-500/10 rounded-sm pointer-events-none flex items-start justify-end p-1.5">
                      <span className="px-1.5 py-0.5 bg-red-600/90 text-slate-950 font-black font-mono text-[9px] rounded">
                        RESTRICTED AREA
                      </span>
                    </div>
                  )}

                  {zone.type === 'Line Crossing' && zone.id === '2' && (
                    <div className="absolute top-1/2 left-3 right-3 h-1 bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.9)] pointer-events-none flex items-center justify-center">
                      <span className="px-1.5 py-0.2 bg-yellow-400 text-slate-950 font-black font-mono text-[8px] rounded uppercase">
                        PERIMETER TRIPWIRE
                      </span>
                    </div>
                  )}

                  {zone.type === 'Line Crossing' && zone.id === '3' && (
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)] pointer-events-none flex items-center justify-center">
                      <span className="px-1.5 py-0.2 bg-cyan-400 text-slate-950 font-bold font-mono text-[8px] rounded uppercase">
                        ENTRY BOUNDARY
                      </span>
                    </div>
                  )}

                  {/* Camera overlay watermark */}
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/75 rounded text-[9px] font-mono text-slate-300 border border-white/10">
                    {zone.camera.split(' ')[0]} · LIVE
                  </div>

                  <div className="absolute top-2 left-2">
                    {getSeverityBadge(zone.severity)}
                  </div>
                </div>
                
                {/* Telemetry Stats: Type & Violations */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-[#070B12] p-2.5 rounded-lg border border-[#1B2536]">
                    <p className="text-slate-500 text-[10px] mb-0.5 uppercase">Boundary Type</p>
                    <p className="text-white font-bold">{zone.type}</p>
                  </div>
                  <div className="bg-[#070B12] p-2.5 rounded-lg border border-[#1B2536]">
                    <p className="text-slate-500 text-[10px] mb-0.5 uppercase">Violations (24h)</p>
                    <p className="text-white font-bold flex items-center">
                      <AlertTriangle className={`w-3.5 h-3.5 mr-1 ${zone.violations > 0 ? 'text-red-400' : 'text-slate-500'}`} />
                      <span className={zone.violations > 0 ? 'text-red-400 font-bold' : 'text-slate-400'}>
                        {zone.violations}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Threat Index Progress Bar */}
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Intrusion Threat Score</span>
                    <span className="text-white font-bold">{zone.threatLevel}/100</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        zone.threatLevel > 70 ? 'bg-red-500' : zone.threatLevel > 30 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${zone.threatLevel}%` }}
                    />
                  </div>
                </div>
                
                {/* Active Schedule */}
                <div className="flex items-center justify-between pt-1 border-t border-[#151D2A] text-xs font-mono text-slate-400">
                  <span className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    {zone.schedule}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="p-3 border-t border-[#1B2536] bg-[#070B12] flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 px-2.5 cursor-pointer"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setEventsZone(zone);
                    setShowEventsModal(true);
                  }}
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  View Events ({zone.violations})
                </Button>

                <div className="flex items-center space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setFormName(zone.name);
                      setFormCamera(zone.camera);
                      setFormType(zone.type);
                      setFormSeverity(zone.severity);
                      setDrawingPoints(zone.coordinates || [[80, 50], [280, 50], [280, 160], [80, 160]]);
                      setShowCreateModal(true);
                    }}
                    title="Edit Zone Geometry"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleDeleteZone(zone.id, zone.name);
                    }}
                    title="Delete Zone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Bottom Section: Zone Summary (Left) + Interactive Geopolitical Leaflet Boundary (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Zone Summary & Tripwire Health (4 cols) */}
        <div className="lg:col-span-4 bg-[#0A0F18] border border-[#1B2536] rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="border-b border-[#1B2536] pb-3 mb-4 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                Zone Summary & Metrics
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                SYSTEM ARMED
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-[#070B12] border border-[#1E293B] flex items-center justify-between">
                <span className="text-slate-400">Total Configured Zones:</span>
                <span className="text-white font-bold text-sm">{zones.length} Zones</span>
              </div>
              <div className="p-3 rounded-lg bg-[#070B12] border border-[#1E293B] flex items-center justify-between">
                <span className="text-slate-400">Active Armed Tripwires:</span>
                <span className="text-emerald-400 font-bold text-sm">{activeZonesCount} Armed</span>
              </div>
              <div className="p-3 rounded-lg bg-[#070B12] border border-[#1E293B] flex items-center justify-between">
                <span className="text-slate-400">Inactive / Standby:</span>
                <span className="text-slate-400 font-bold text-sm">{zones.length - activeZonesCount} Standby</span>
              </div>
              <div className="p-3 rounded-lg bg-[#070B12] border border-[#1E293B] flex items-center justify-between">
                <span className="text-slate-400">Cumulative Violations (24h):</span>
                <span className="text-red-400 font-bold text-sm">{totalViolations} Hits</span>
              </div>
            </div>

            {/* Sensitivity Calibration Controls */}
            <div className="mt-5 p-3.5 bg-[#070B12] rounded-xl border border-[#1E293B] space-y-2.5 font-mono text-xs">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
                Tripwire AI Detection Profiles
              </span>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button 
                  onClick={() => showToast('AI Tripwire Filter calibrated to High Precision (0.15s window, 99.4% false alarm suppression).')}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded text-[11px] border border-[#1E293B] text-center cursor-pointer transition-colors"
                >
                  High Precision
                </button>
                <button 
                  onClick={() => showToast('Thermal Auto-Gain Mode calibrated across all perimeter optical cameras.')}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded text-[11px] border border-[#1E293B] text-center cursor-pointer transition-colors"
                >
                  Thermal Auto-Gain
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1B2536] mt-4 font-mono">
            <Button 
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-cyan-950/40"
              onClick={() => {
                setFormName(`Perimeter-Zone-${zones.length + 1}`);
                setDrawingPoints([[80, 50], [280, 50], [280, 160], [80, 160]]);
                setShowCreateModal(true);
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add New Security Polygon
            </Button>
          </div>
        </div>

        {/* Right: Intrusion Map & Geopolitical Boundary (8 cols) */}
        <div className="lg:col-span-8 bg-[#0A0F18] border border-[#1B2536] rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="border-b border-[#1B2536] pb-3 mb-4 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                Intrusion Map & Geopolitical Boundary
              </h3>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-slate-400">LAT: <strong className="text-white">32.7266° N</strong></span>
                <span className="text-slate-400">LON: <strong className="text-white">74.8570° E</strong></span>
              </div>
            </div>

            {/* Tactical Intrusion Map Container with Realistic Satellite Preview */}
            <div className="relative rounded-xl overflow-hidden border border-[#1B2536] aspect-[21/9] bg-slate-950 group">
              <img 
                src="/fences-intrusion-map.jpg" 
                alt="Intrusion Map"
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 select-none"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/command-center-ref.jpg';
                }}
              />

              {/* Map Reticle & Visual Indicators */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

              {/* Zone Pins on Map */}
              <div 
                onClick={() => setSelectedZone(zones[0] || MOCK_ZONES[0])}
                className="absolute top-[35%] left-[28%] -translate-x-1/2 -translate-y-1/2 cursor-pointer group/pin z-10"
              >
                <div className="w-4 h-4 rounded-full bg-red-500 animate-ping absolute" />
                <div className="w-4 h-4 rounded-full bg-red-600 border-2 border-white flex items-center justify-center relative shadow-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
                <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/85 border border-red-500/50 px-2 py-1 rounded text-[10px] font-mono font-bold text-red-300 whitespace-nowrap shadow-xl">
                  Restricted Zone Alpha [{zones[0]?.violations || 12} Hits]
                </div>
              </div>

              <div 
                onClick={() => setSelectedZone(zones[1] || MOCK_ZONES[1])}
                className="absolute top-[52%] left-[64%] -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center shadow-lg">
                  <div className="w-1 h-1 rounded-full bg-white" />
                </div>
                <div className="absolute left-5 top-1/2 -translate-y-1/2 bg-black/85 border border-amber-500/50 px-2 py-1 rounded text-[10px] font-mono font-bold text-amber-300 whitespace-nowrap shadow-xl">
                  Perimeter East [{zones[1]?.violations || 3} Hits]
                </div>
              </div>

              <div 
                onClick={() => setSelectedZone(zones[2] || MOCK_ZONES[2])}
                className="absolute top-[70%] left-[45%] -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-white flex items-center justify-center shadow-lg">
                  <div className="w-1 h-1 rounded-full bg-white" />
                </div>
                <div className="absolute left-5 top-1/2 -translate-y-1/2 bg-black/85 border border-cyan-500/50 px-2 py-1 rounded text-[10px] font-mono font-bold text-cyan-300 whitespace-nowrap shadow-xl">
                  Checkpoint Gate [{zones[2]?.violations || 0} Hits]
                </div>
              </div>

              {/* Map Controls Overlay */}
              <div className="absolute bottom-3 left-3 bg-[#0A0F18]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-slate-300 flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Polygon Zone
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Line Tripwire
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" /> Checkpoint Gate
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1B2536] flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
            <span>GIS Synchronization: <strong className="text-emerald-400">Active (RTK Accuracy ±2cm)</strong></span>
            <button 
              onClick={() => showToast('Spatial GIS boundaries recalibrated and synchronized with Indian Satellite Positioning Grid (RTK ±2cm).')}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              Recalibrate GIS Boundaries <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* ── CREATE / EDIT ZONE MODAL DRAWER ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-[#0A0F18] border border-cyan-500/40 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl shadow-cyan-950/50 flex flex-col font-mono text-xs">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-[#1B2536] flex items-center justify-between bg-[#070B12]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Interactive Fence & Tripwire Canvas
                  </h2>
                  <p className="text-[11px] text-slate-400">Click on camera frame to plot polygon boundary vertices</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateZoneSubmit} className="p-5 space-y-4">
              
              {/* Form Controls Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Zone Name */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Zone Name</label>
                  <input 
                    type="text" 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Sector-4-Restricted-Alpha"
                    className="w-full bg-[#070B12] border border-[#1B2536] rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>

                {/* Camera Selector */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Camera Feed</label>
                  <select 
                    value={formCamera}
                    onChange={(e) => setFormCamera(e.target.value)}
                    className="w-full bg-[#070B12] border border-[#1B2536] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    {AVAILABLE_CAMERAS.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Fence Type */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Boundary Type</label>
                  <select 
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-[#070B12] border border-[#1B2536] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="Polygon">Polygon (Restricted Area)</option>
                    <option value="Line Crossing">Line Crossing (Tripwire)</option>
                    <option value="Rectangle">Rectangle (Buffer Box)</option>
                  </select>
                </div>

                {/* Severity */}
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Threat Level</label>
                  <select 
                    value={formSeverity}
                    onChange={(e) => setFormSeverity(e.target.value as any)}
                    className="w-full bg-[#070B12] border border-[#1B2536] rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="critical">CRITICAL (Immediate Siren)</option>
                    <option value="high">HIGH (Patrol Dispatch)</option>
                    <option value="medium">MEDIUM (Operator Log)</option>
                    <option value="low">LOW (Audit Only)</option>
                  </select>
                </div>
              </div>

              {/* Interactive Canvas Drawing Area */}
              <div className="relative rounded-xl overflow-hidden border border-[#1B2536] bg-black aspect-[16/9] max-h-[380px] flex items-center justify-center select-none shadow-inner">
                {/* Background Camera Snapshot */}
                <img 
                  src={AVAILABLE_CAMERAS.find(c => c.name === formCamera)?.preview || '/fence-feed-alpha.jpg'} 
                  alt="Camera Frame"
                  className="w-full h-full object-cover"
                />

                {/* Drawing HTML Canvas */}
                <canvas 
                  ref={canvasRef}
                  width={640}
                  height={360}
                  onClick={handleCanvasClick}
                  className="absolute inset-0 w-full h-full cursor-crosshair z-10"
                />

                {/* Top Canvas Instruction Overlay */}
                <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] z-20 flex items-center gap-2 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-white font-bold">CLICK TO ADD POINTS:</span>
                  <span className="text-cyan-400">{drawingPoints.length} Points Plotted</span>
                </div>

                {/* Canvas Floating Toolbar */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2 z-20">
                  <button 
                    type="button"
                    onClick={() => setDrawingPoints([[60, 40], [280, 40], [280, 180], [60, 180]])}
                    className="px-2.5 py-1.5 bg-[#0A0F18]/90 hover:bg-[#121B2B] text-cyan-300 rounded border border-cyan-500/40 text-[10px] font-bold cursor-pointer"
                  >
                    Preset Box
                  </button>
                  <button 
                    type="button"
                    onClick={() => setDrawingPoints([[30, 120], [330, 120]])}
                    className="px-2.5 py-1.5 bg-[#0A0F18]/90 hover:bg-[#121B2B] text-amber-300 rounded border border-amber-500/40 text-[10px] font-bold cursor-pointer"
                  >
                    Preset Tripwire
                  </button>
                  <button 
                    type="button"
                    onClick={() => setDrawingPoints(prev => prev.slice(0, -1))}
                    disabled={drawingPoints.length === 0}
                    className="p-1.5 bg-[#0A0F18]/90 hover:bg-[#121B2B] text-slate-300 rounded border border-[#1B2536] text-[10px] disabled:opacity-40 cursor-pointer"
                    title="Undo Last Point"
                  >
                    <Undo className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => setDrawingPoints([])}
                    disabled={drawingPoints.length === 0}
                    className="p-1.5 bg-[#0A0F18]/90 hover:bg-red-950/60 text-red-400 rounded border border-red-500/30 text-[10px] disabled:opacity-40 cursor-pointer"
                    title="Clear Canvas"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Coordinates Readout */}
              <div className="p-2.5 bg-[#070B12] rounded-lg border border-[#1B2536] text-[10px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-slate-500 font-bold uppercase mr-1">Points:</span>
                  {drawingPoints.length > 0 ? (
                    drawingPoints.map(([x, y], idx) => (
                      <span key={idx} className="mr-2 text-cyan-400 font-mono">
                        P{idx + 1}[{x},{y}]
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-600 italic">Click on video frame above to place boundary coordinates</span>
                  )}
                </div>
                <div className="text-emerald-400 font-bold">
                  ● Dwell Detection Active (2.0s)
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1B2536]">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button 
                  type="submit" 
                  disabled={savedSuccess}
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/25"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-950" />
                      Saved & Armed!
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4" />
                      Save & Arm Virtual Fence
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── ZONE EVENTS DOSSIER MODAL ── */}
      {showEventsModal && eventsZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-[#0A0F18] border border-cyan-500/40 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col font-mono text-xs">
            
            {/* Header */}
            <div className="p-4 border-b border-[#1B2536] flex items-center justify-between bg-[#070B12]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase">{eventsZone.name} — Intrusion Dossier</h3>
                  <p className="text-[11px] text-slate-400">Audit log for {eventsZone.camera}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEventsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="p-5 space-y-3">
              {[
                { time: '13:18:56 IST', target: 'Human Intruder (P-104)', confidence: '96.4%', img: '/thumb-ev-17598.jpg', status: 'PATROL DISPATCHED' },
                { time: '12:44:10 IST', target: 'Unidentified Biological (A-002)', confidence: '92.1%', img: '/thumb-ev-17602.jpg', status: 'VERIFIED WILDLIFE' },
                { time: '11:15:22 IST', target: 'Vehicle Sentry (V-018)', confidence: '98.2%', img: '/thumb-ev-17609.jpg', status: 'RESOLVED' },
              ].map((ev, idx) => (
                <div key={idx} className="p-3 bg-[#070B12] rounded-xl border border-[#1E293B] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-10 rounded overflow-hidden border border-slate-700 bg-black flex-shrink-0">
                      <img src={ev.img} alt="Snapshot" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/feed-bop01.jpg'; }} />
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">{ev.target}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{ev.time} • AI Conf: {ev.confidence}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-red-500/15 text-red-400 border border-red-500/30 rounded text-[9px] font-bold">
                    {ev.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#1B2536] bg-[#070B12] flex justify-end">
              <button 
                onClick={() => setShowEventsModal(false)}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold cursor-pointer"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default VirtualFences;

