import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { 
  Camera, AlertTriangle, Users, CarFront, Shield, 
  Activity, BarChart3, AlertCircle, Bell, HeartPulse,
  Monitor, Wifi, Cpu, TrendingUp, TrendingDown, Minus,
  MapPin, Clock, Eye, Video, CheckCircle2, Flame, RefreshCw, Upload,
  Maximize2, Radio, Layers, Check, Send, Volume2, VolumeX, X, Zap,
  Crosshair, ShieldAlert, Sparkles
} from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { VideoSourceModal } from '@/components/surveillance/VideoSourceModal';
import { VideoInspectionModal } from '@/components/surveillance/VideoInspectionModal';
import { ObjectInspectorModal } from '@/components/surveillance/ObjectInspectorModal';
import { ZoneSetupModal } from '@/components/surveillance/ZoneSetupModal';
import { useVideoStore, BoundingBox } from '@/stores/videoStore';
import { Button } from '@/components/ui/Button';

interface AlertItem {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  camera: string;
  location: string;
  time: string;
  confidence: number | string;
  riskScore: number;
  object: string;
  trackingId: string | number;
  acknowledged?: boolean;
  dispatched?: boolean;
}

interface DashboardKpiData {
  cameras_online: number;
  cameras_offline: number;
  active_alerts: number;
  critical_incidents: number;
  people_detected: number;
  vehicles_detected: number;
  anpr_reads: number;
  restricted_zone_events: number;
  system_health_score: number;
  ai_processing_fps: number;
}

const INITIAL_ALERTS: AlertItem[] = [
  { 
    id: 'ALT-8000', 
    severity: 'high', 
    type: 'Car Perimeter Intrusion (ID #815)', 
    camera: 'BOP-01', 
    location: 'Sector 4 Red Perimeter', 
    time: '12:14:57', 
    confidence: '43.2', 
    riskScore: 72, 
    object: 'VEHICLE', 
    trackingId: '815',
    acknowledged: false,
    dispatched: false
  },
  { 
    id: 'ALT-8001', 
    severity: 'medium', 
    type: 'Loitering Detected: Person #835 stationary for 4.6s', 
    camera: 'BOP-01', 
    location: 'Perimeter Surveillance', 
    time: '12:15:12', 
    confidence: '92', 
    riskScore: 72, 
    object: 'PERSON', 
    trackingId: '835',
    acknowledged: false,
    dispatched: false
  },
  { 
    id: 'ALT-8002', 
    severity: 'critical', 
    type: 'Restricted Boundary Cross (ID #104)', 
    camera: 'BOP-01', 
    location: 'Sector 4 Red Zone Alpha', 
    time: '12:10:45', 
    confidence: '96.4%', 
    riskScore: 88, 
    object: 'PERSON', 
    trackingId: '104',
    acknowledged: false,
    dispatched: false
  },
  { 
    id: 'ALT-8003', 
    severity: 'high', 
    type: 'Unregistered Convoy Velocity Spike', 
    camera: 'CHECK-01', 
    location: 'Highway 1 Access Lane', 
    time: '12:08:12', 
    confidence: '98.2%', 
    riskScore: 65, 
    object: 'VEHICLE', 
    trackingId: '21',
    acknowledged: false,
    dispatched: false
  },
];

export const CommandCenter: React.FC = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date().toISOString());
  const [liveAlerts, setLiveAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [streamHealthy, setStreamHealthy] = useState(true);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  
  // Stream Mode: 'tactical' (high-res synthetic HUD), 'mjpeg' (real-time live worker stream), 'heatmap' (density stream)
  const [streamMode, setStreamMode] = useState<'tactical' | 'mjpeg' | 'heatmap'>('tactical');
  const [activeCameraId, setActiveCameraId] = useState<string>('BOP-01');
  const [isSirenArmed, setIsSirenArmed] = useState(true);
  const [activeToast, setActiveToast] = useState<{ message: string; type: 'success' | 'info' | 'warn' } | null>(null);

  // Live Backend KPIs
  const [kpis, setKpis] = useState<DashboardKpiData>({
    cameras_online: 8,
    cameras_offline: 0,
    active_alerts: 3,
    critical_incidents: 1,
    people_detected: 1245,
    vehicles_detected: 389,
    anpr_reads: 150,
    restricted_zone_events: 42,
    system_health_score: 98.4,
    ai_processing_fps: 30.0
  });

  const { openVideoModal, openInspection, inspectObject } = useVideoStore();
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'warn' = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setActiveToast({ message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setActiveToast(null);
    }, 4000);
  };

  // Clock interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toISOString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live KPIs from backend
  const fetchKpis = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/kpis');
      if (res.ok) {
        const data = await res.json();
        setKpis(prev => ({
          ...prev,
          ...data,
          system_health_score: data.system_health_score || 98.4,
          ai_processing_fps: data.ai_processing_fps || 30.0
        }));
      }
    } catch {
      // Keep healthy fallback
    }
  }, []);

  useEffect(() => {
    fetchKpis();
    const kpiInterval = setInterval(fetchKpis, 5000);
    return () => clearInterval(kpiInterval);
  }, [fetchKpis]);

  // Poll / listen to backend alerts stream and prepend new entries at top
  useEffect(() => {
    let isMounted = true;

    // 1. Try WebSocket connection for real-time alerts
    let ws: WebSocket | null = null;
    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/alerts`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const newAlert: AlertItem = {
            id: `ALT-${Math.floor(8000 + Math.random() * 1000)}`,
            severity: data.severity?.toLowerCase() || 'high',
            type: data.type || data.message || 'Intrusion Alert',
            camera: data.camera_id || 'BOP-01',
            location: data.zone || 'Sector 4 Restricted Alpha',
            time: data.time || new Date().toLocaleTimeString(),
            confidence: `${data.confidence || 92}%`,
            riskScore: data.severity === 'CRITICAL' ? 88 : 72,
            object: data.object_type?.toUpperCase() || 'TARGET',
            trackingId: data.track_id || '815',
            acknowledged: false,
            dispatched: false
          };
          if (isMounted) {
            setLiveAlerts(prev => [newAlert, ...prev.slice(0, 39)]);
          }
        } catch (e) {
          console.error(e);
        }
      };
    } catch (e) {
      console.warn('WebSocket fallback to HTTP polling:', e);
    }

    // 2. Periodic HTTP fetch fallback from /api/stream/alerts
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/stream/alerts');
        if (res.ok) {
          const alertsData = await res.json();
          if (Array.isArray(alertsData) && alertsData.length > 0 && isMounted) {
            const formatted: AlertItem[] = alertsData.slice(0, 15).map((a, i) => ({
              id: `ALT-${8000 + i}`,
              severity: a.severity?.toLowerCase() || (a.type?.includes('Person') ? 'critical' : 'high'),
              type: a.type || 'Zone Intrusion',
              camera: a.camera_id || 'BOP-01',
              location: a.zone || 'Sector 4 Restricted Alpha',
              time: a.time || new Date().toLocaleTimeString(),
              confidence: `${a.confidence || 92}%`,
              riskScore: a.severity === 'CRITICAL' ? 88 : 72,
              object: a.object_type?.toUpperCase() || (a.type?.includes('Person') ? 'PERSON' : 'VEHICLE'),
              trackingId: a.track_id || a.type?.match(/ID #(\d+)/)?.[1] || '815',
              acknowledged: false,
              dispatched: false
            }));

            // Merge with state preserving acknowledged ones
            setLiveAlerts(prev => {
              const ackMap = new Map(prev.map(p => [p.id, p.acknowledged]));
              const dispMap = new Map(prev.map(p => [p.id, p.dispatched]));
              return formatted.map(item => ({
                ...item,
                acknowledged: ackMap.get(item.id) || false,
                dispatched: dispMap.get(item.id) || false
              }));
            });
          }
        }
      } catch (err) {
        // stream polling fallback
      }
    }, 3000);

    return () => {
      isMounted = false;
      if (ws) ws.close();
      clearInterval(pollInterval);
    };
  }, []);

  // Threat Acknowledge handler
  const handleAcknowledgeAlert = (e: React.MouseEvent, alertId: string) => {
    e.stopPropagation();
    setLiveAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true, riskScore: 35 } : a));
    showToast(`Threat Alert ${alertId} marked as ACKNOWLEDGED by Operator`, 'success');
  };

  // Threat Patrol Dispatch handler
  const handleDispatchPatrol = (e: React.MouseEvent, alert: AlertItem) => {
    e.stopPropagation();
    setLiveAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, dispatched: true } : a));
    showToast(`Quick Reaction Team (QRT Unit Bravo-2) dispatched to ${alert.location}`, 'warn');
  };

  // Click on recent target detection -> Opens Object Inspector Modal
  const handleInspectRecentDetection = (targetId: string, type: 'PERSON' | 'VEHICLE' | 'ANIMAL', camera: string, confStr: string, zone: string) => {
    const numericConf = parseFloat(confStr) || 95.0;
    const targetBox: BoundingBox = {
      id: `box-${targetId}`,
      trackingId: targetId,
      type: type,
      x: 35,
      y: 40,
      width: 25,
      height: 45,
      confidence: numericConf,
      direction: 'NE (42°)',
      speed: '1.4 m/s',
      zone: zone,
      alertLevel: type === 'PERSON' ? 'critical' : 'high',
      dwellTimeSeconds: 14.2,
      distanceTravelledMeters: 28.4,
      trajectories: [
        { x: 30, y: 35, timestamp: '10:45:00', speed: '1.2 m/s' },
        { x: 32, y: 38, timestamp: '10:45:06', speed: '1.4 m/s' },
        { x: 35, y: 40, timestamp: '10:45:12', speed: '1.5 m/s' }
      ]
    };
    inspectObject(targetBox);
  };

  return (
    <div className="h-full flex flex-col bg-[#060b13] text-slate-200 overflow-y-auto p-3.5 md:p-4 space-y-3.5 font-sans custom-scrollbar relative">
      
      {/* Floating Tactical Toast */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0a121e] border border-cyan-500/60 text-white shadow-2xl shadow-cyan-950/70 font-mono text-xs animate-in slide-in-from-bottom-5">
          <div className="p-1 rounded bg-cyan-500/20 text-cyan-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-cyan-300">COMMAND OPS: </span>
            <span>{activeToast.message}</span>
          </div>
          <button onClick={() => setActiveToast(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── ROW 1: TOP SECTION (BANNER + VIDEO STREAM ON LEFT, LIVE THREAT FEED ON RIGHT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        
        {/* LEFT COLUMN: 8 cols (Operations Banner + Live Surveillance Video) */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          
          {/* 1. TOP OPERATIONAL BANNER WITH SOLDIER GRAPHIC */}
          <div 
            className="relative flex flex-wrap justify-between items-center gap-3 bg-[#0a121e] border border-[#1b2b40] p-3 sm:p-3.5 rounded-xl shadow-xl overflow-hidden"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(10, 18, 30, 0.98) 55%, rgba(10, 18, 30, 0.5) 85%, rgba(10, 18, 30, 0.25) 100%), url('/header-soldier.jpg')`,
              backgroundPosition: 'right center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain'
            }}
          >
            <div className="flex items-center space-x-3 z-10">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-white tracking-wider flex items-center gap-2 font-mono">
                  IBVAP // JOINT COMMAND OPERATIONS CENTER
                </h1>
                <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono mt-0.5">
                  Ministry of Home Affairs - SSB Police II Division - Sector 4 Surveillance Sector
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs z-10">
              <div className="bg-[#070d18] px-2.5 py-1.5 rounded-lg border border-[#1b2b40] text-cyan-400 flex items-center gap-1.5 shadow-inner text-[11px]">
                <Clock size={12} />
                <span>{currentTime.split('T')[0]} {currentTime.split('T')[1].split('.')[0]} UTC</span>
              </div>
              <Button
                size="sm"
                onClick={() => setIsZoneModalOpen(true)}
                className="bg-[#2a1b08] hover:bg-[#3b270c] border border-amber-500/60 text-amber-400 font-bold text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-md transition-colors"
              >
                <Shield size={13} /> Setup Restricted Zone (4-Point)
              </Button>
              <Button
                size="sm"
                onClick={() => openVideoModal(activeCameraId)}
                className="bg-[#072538] hover:bg-[#0b3650] border border-cyan-500/60 text-cyan-400 font-semibold text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-md transition-colors"
              >
                <Upload size={13} /> Change Source Feed
              </Button>
            </div>
          </div>

          {/* 2. PRIMARY LIVE SURVEILLANCE FEED CONTAINER */}
          <div className="relative bg-[#040810] rounded-xl overflow-hidden border border-[#1b2b40] shadow-2xl group flex flex-col justify-between">
            
            {/* Top HUD Overlay with Stream Mode Segmented Switcher */}
            <div className="absolute top-2.5 left-3 right-3 z-20 flex justify-between items-center pointer-events-none">
              <div className="flex items-center gap-2 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#1b283c] pointer-events-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono text-xs text-white font-bold tracking-wider">
                  CAM-01 // BOP MAIN GATE
                </span>
                
                {/* Mode Segmented Controls */}
                <div className="flex items-center gap-1 bg-[#060b13] p-0.5 rounded border border-[#1b2b40] ml-2 text-[10px] font-mono">
                  <button
                    onClick={() => {
                      setStreamMode('tactical');
                      showToast('Switched to Tactical Reference AI Overlay Mode', 'info');
                    }}
                    className={`px-2 py-0.5 rounded font-bold transition-colors ${
                      streamMode === 'tactical'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    AI HUD
                  </button>
                  <button
                    onClick={() => {
                      setStreamMode('mjpeg');
                      showToast('Connected to Real-Time Live MJPEG Edge Stream (/video_feed)', 'success');
                    }}
                    className={`px-2 py-0.5 rounded font-bold transition-colors flex items-center gap-1 ${
                      streamMode === 'mjpeg'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-red-400'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    LIVE MJPEG
                  </button>
                  <button
                    onClick={() => {
                      setStreamMode('heatmap');
                      showToast('Switched to Motion Density Heatmap Stream', 'info');
                    }}
                    className={`px-2 py-0.5 rounded font-bold transition-colors flex items-center gap-1 ${
                      streamMode === 'heatmap'
                        ? 'bg-amber-500 text-black shadow-sm'
                        : 'text-slate-400 hover:text-amber-400'
                    }`}
                  >
                    <Flame size={10} />
                    HEATMAP
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#1b283c] text-[11px] font-mono text-slate-300 pointer-events-auto">
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> REC
                </span>
                <span>1080p@{kpis.ai_processing_fps.toFixed(0)}</span>
                <button 
                  onClick={() => openInspection(activeCameraId)}
                  className="p-1 hover:text-cyan-400 transition-colors text-slate-400"
                  title="Fullscreen Inspection"
                >
                  <Maximize2 size={13} />
                </button>
              </div>
            </div>

            {/* Corner Reticles */}
            <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-cyan-500/60 pointer-events-none z-10" />
            <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-cyan-500/60 pointer-events-none z-10" />
            <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-cyan-500/60 pointer-events-none z-10" />
            <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-cyan-500/60 pointer-events-none z-10" />

            {/* Video Stream Container */}
            <div 
              className="relative w-full aspect-[1024/409] cursor-pointer bg-black overflow-hidden flex items-center justify-center select-none"
              onClick={() => openInspection(activeCameraId)}
              title="Click for Fullscreen Camera Inspection"
            >
              <img 
                src={
                  streamMode === 'mjpeg' ? '/video_feed' :
                  streamMode === 'heatmap' ? '/api/stream/heatmap' :
                  '/command-center-feed.jpg'
                } 
                alt="IBVAP Live Tactical Video Stream"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/command-center-feed.jpg';
                }}
              />

              {/* Image displays as it is with its native pre-rendered AI detections */}
            </div>


            {/* Bottom Telemetry Overlay */}
            <div className="absolute bottom-2.5 left-3 right-3 z-20 flex justify-between items-center bg-black/85 backdrop-blur-md px-3 py-1 rounded-lg border border-[#1b283c] text-[10.5px] font-mono text-slate-300">
              <div className="flex items-center gap-3">
                <span>SECTOR: <strong className="text-amber-400 font-bold">SECTOR 4 PERIMETER ALPHA</strong></span>
                <span className="hidden sm:inline">TRACKING: <strong className="text-cyan-400 font-bold">BYTETRACK RE-ID</strong></span>
                <span className="hidden md:inline">GRID: <strong className="text-emerald-400 font-bold">28°36'48"N 77°12'32"E</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">FPS: <strong>{kpis.ai_processing_fps.toFixed(1)}</strong></span>
                <span className="text-slate-500">|</span>
                <span>{currentTime.split('T')[1].split('.')[0]} UTC</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: 4 cols (Live Threat Feed - Height Matches Left Stack) */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="bg-[#0a121e] border border-[#1b2b40] rounded-xl p-3.5 sm:p-4 flex flex-col justify-between shadow-2xl h-full space-y-3">
            
            <div className="space-y-3">
              {/* Threat Feed Header with Siren Toggle */}
              <div className="flex justify-between items-center border-b border-[#1b283c] pb-2.5">
                <div className="flex items-center gap-2">
                  <Bell size={15} className="text-amber-400" />
                  <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    Live Threat Feed
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setIsSirenArmed(!isSirenArmed);
                      showToast(isSirenArmed ? 'Threat Audio Siren Disarmed' : 'Threat Audio Siren Armed (DEFCON 3)', 'info');
                    }}
                    className={`p-1 rounded border text-[10px] font-mono flex items-center gap-1 transition-colors ${
                      isSirenArmed
                        ? 'bg-red-500/10 border-red-500/40 text-red-400'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                    }`}
                    title={isSirenArmed ? 'Audio Siren Active' : 'Siren Muted'}
                  >
                    {isSirenArmed ? <Volume2 size={11} /> : <VolumeX size={11} />}
                  </button>
                  <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-400 text-[10px] font-mono font-bold border border-red-500/40 animate-pulse">
                    {liveAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').length} CRITICAL
                  </span>
                </div>
              </div>

              {/* Threat Items List */}
              <div className="space-y-2.5">
                {liveAlerts.slice(0, 2).map((alt, idx) => (
                  <div
                    key={`${alt.id}-${idx}`}
                    onClick={() => openInspection(alt.camera)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all space-y-2 group shadow-sm ${
                      alt.acknowledged
                        ? 'bg-[#051515] border-emerald-500/40 hover:bg-[#071f1f]'
                        : 'bg-[#070d18] border-[#1b283c] hover:border-cyan-500/50 hover:bg-[#0c1524]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        {/* Circular Risk Score */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-black text-xs border-2 shadow-inner flex-shrink-0 ${
                          alt.acknowledged
                            ? 'border-emerald-500 text-emerald-400 bg-emerald-950/40'
                            : alt.severity === 'critical'
                            ? 'border-red-500 text-red-400 bg-red-950/40'
                            : 'border-amber-500 text-amber-400 bg-amber-950/40'
                        }`}>
                          {alt.riskScore}
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-mono text-xs text-cyan-400 font-bold">{alt.id}</span>
                          <span className="font-mono text-xs text-slate-400">{alt.camera}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded ${
                          alt.acknowledged
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                            : alt.severity === 'critical'
                            ? 'bg-red-950/80 text-red-400 border border-red-500/40'
                            : 'bg-amber-950/80 text-amber-400 border border-amber-500/40'
                        }`}>
                          {alt.acknowledged ? 'ACKED' : alt.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                      <span className="truncate pr-2">{alt.type}</span>
                      <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{alt.time}</span>
                    </div>

                    <div className="flex justify-between items-center text-[10.5px] text-slate-400 font-mono pt-1.5 border-t border-[#1b283c]">
                      <span>Target: <strong className="text-white">#{alt.trackingId}</strong> ({alt.confidence})</span>
                      <span className="text-slate-400 truncate max-w-[140px] text-right">{alt.location}</span>
                    </div>

                    {/* Operational Quick Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#1b283c]/50">
                      {!alt.acknowledged && (
                        <button
                          onClick={(e) => handleAcknowledgeAlert(e, alt.id)}
                          className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30 flex items-center gap-1"
                        >
                          <Check size={11} /> Ack
                        </button>
                      )}
                      {!alt.dispatched && (
                        <button
                          onClick={(e) => handleDispatchPatrol(e, alt)}
                          className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold border border-amber-500/30 flex items-center gap-1"
                        >
                          <Zap size={11} /> QRT Dispatch
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Button */}
            <div className="pt-2 border-t border-[#1b283c]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/alerts')}
                className="w-full text-xs font-mono text-slate-300 border-[#1b283c] bg-[#070d18] hover:bg-slate-800 hover:text-white py-2"
              >
                View Full Alert Console & Risk Engine →
              </Button>
            </div>
          </div>
        </div>

      </div>

      {/* ── ROW 2: 4 FULL-WIDTH KPI METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Cameras Online */}
        <div 
          onClick={() => navigate('/cameras')}
          className="relative bg-[#0a121e] border border-emerald-500/30 rounded-xl p-3.5 flex flex-col justify-between hover:border-emerald-500/70 transition-all shadow-xl overflow-hidden group cursor-pointer"
          title="Click to view Camera Registry"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-15 group-hover:opacity-25 transition-opacity pointer-events-none" 
            style={{ backgroundImage: `url('/kpi-cameras-bg.jpg')` }} 
          />
          <div className="relative z-10 flex flex-col justify-between h-full space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[11px] text-slate-400 font-semibold uppercase font-mono tracking-wider">CAMERAS ONLINE</span>
              <div className="p-1.5 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-500/40">
                <Camera size={15} />
              </div>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <div className="text-2xl font-black text-white font-mono">
                {kpis.cameras_online} / {kpis.cameras_online + kpis.cameras_offline}
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40">100% OPERATIONAL</span>
            </div>
          </div>
        </div>

        {/* Active Targets */}
        <div 
          onClick={() => navigate('/tracking')}
          className="relative bg-[#0a121e] border border-cyan-500/30 rounded-xl p-3.5 flex flex-col justify-between hover:border-cyan-500/70 transition-all shadow-xl overflow-hidden group cursor-pointer"
          title="Click to view Subject Tracking"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-15 group-hover:opacity-25 transition-opacity pointer-events-none" 
            style={{ backgroundImage: `url('/kpi-targets-bg.jpg')` }} 
          />
          <div className="relative z-10 flex flex-col justify-between h-full space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[11px] text-slate-400 font-semibold uppercase font-mono tracking-wider">ACTIVE TARGETS</span>
              <div className="p-1.5 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-500/40">
                <Users size={15} />
              </div>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <div className="text-2xl font-black text-white font-mono flex items-baseline">
                14 <span className="text-sm font-normal text-slate-200 ml-1.5">Active</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">BYTETRACK RE-ID</span>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        <div 
          onClick={() => navigate('/alerts')}
          className="relative bg-[#0a121e] border border-red-500/30 rounded-xl p-3.5 flex flex-col justify-between hover:border-red-500/70 transition-all shadow-xl overflow-hidden group cursor-pointer"
          title="Click to view Alert Console"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-15 group-hover:opacity-25 transition-opacity pointer-events-none" 
            style={{ backgroundImage: `url('/kpi-alerts-bg.jpg')` }} 
          />
          <div className="relative z-10 flex flex-col justify-between h-full space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[11px] text-slate-400 font-semibold uppercase font-mono tracking-wider">CRITICAL ALERTS</span>
              <div className="p-1.5 rounded-lg bg-red-950/60 text-red-500 border border-red-500/40">
                <AlertTriangle size={15} />
              </div>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <div className="text-2xl font-black text-white font-mono flex items-baseline">
                {kpis.critical_incidents + kpis.active_alerts} <span className="text-sm font-normal text-slate-200 ml-1.5">Active</span>
              </div>
              <span className="text-[10px] text-red-400 font-mono font-bold px-2 py-0.5 rounded bg-red-950/80 border border-red-500/40">HIGH PRIORITY</span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div 
          onClick={() => navigate('/system-health')}
          className="relative bg-[#0a121e] border border-purple-500/30 rounded-xl p-3.5 flex flex-col justify-between hover:border-purple-500/70 transition-all shadow-xl overflow-hidden group cursor-pointer"
          title="Click to view Infrastructure Health"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-15 group-hover:opacity-25 transition-opacity pointer-events-none" 
            style={{ backgroundImage: `url('/kpi-health-bg.jpg')` }} 
          />
          <div className="relative z-10 flex flex-col justify-between h-full space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[11px] text-slate-400 font-semibold uppercase font-mono tracking-wider">SYSTEM HEALTH</span>
              <div className="p-1.5 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-500/40">
                <HeartPulse size={15} />
              </div>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <div className="text-2xl font-black text-white font-mono">{kpis.system_health_score}%</div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40">ALL NODES SYNCED</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── ROW 3: RECENT DETECTIONS & AI TARGET CAPTURES (FULL WIDTH WITH HORIZONTAL SPLIT CARDS) ── */}
      <div className="bg-[#0a121e] border border-[#1b2b40] rounded-xl p-3.5 sm:p-4 space-y-3 shadow-xl">
        <div className="flex justify-between items-center border-b border-[#1b283c] pb-2">
          <div className="flex items-center gap-2">
            <Eye size={15} className="text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Recent Detections & AI Target Captures (Sector 04)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">ByteTrack Multi-Object Telemetry · Click card to inspect</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { id: 'TRK-104', type: 'Person', objType: 'PERSON' as const, conf: '96.4%', cam: 'BOP-01', time: '10:45:12', badge: 'RED ZONE', badgeColor: 'red', thumb: '/cc-thumb-1.png' },
            { id: 'TRK-21', type: 'Vehicle', objType: 'VEHICLE' as const, conf: '98.2%', cam: 'CHECK-01', time: '10:42:30', badge: 'HIGHWAY', badgeColor: 'cyan', thumb: '/cc-thumb-2.png' },
            { id: 'ANPR-89', type: 'DL 01 AB 1234', objType: 'VEHICLE' as const, conf: '98.0%', cam: 'CAM-05', time: '10:35:15', badge: 'CLEARED', badgeColor: 'emerald', thumb: '/cc-thumb-3.png' },
            { id: 'TRK-02', type: 'Animal', objType: 'ANIMAL' as const, conf: '92.1%', cam: 'BOP-01', time: '10:30:05', badge: 'BUFFER', badgeColor: 'teal', thumb: '/cc-thumb-4.png' },
            { id: 'TRK-112', type: 'Person', objType: 'PERSON' as const, conf: '94.8%', cam: 'BOP-02', time: '10:15:40', badge: 'PERIMETER', badgeColor: 'amber', thumb: '/cc-thumb-5.png' },
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleInspectRecentDetection(item.id, item.objType, item.cam, item.conf, item.badge)}
              className="bg-[#070d18] border border-[#1b283c] rounded-xl p-2.5 hover:border-cyan-500/60 cursor-pointer transition-all flex items-center justify-between gap-2.5 group hover:bg-[#0c1524] shadow-md"
              title={`Click to inspect target ${item.id} deep telemetry`}
            >
              {/* Left Column: Metadata */}
              <div className="flex-1 min-w-0 space-y-1.5 font-mono">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {item.id}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    item.badgeColor === 'red' ? 'bg-red-950/80 text-red-400 border border-red-500/40' :
                    item.badgeColor === 'cyan' ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/40' :
                    item.badgeColor === 'emerald' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40' :
                    item.badgeColor === 'teal' ? 'bg-teal-950/80 text-teal-400 border border-teal-500/40' :
                    'bg-amber-950/80 text-amber-400 border border-amber-500/40'
                  }`}>
                    {item.badge}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold truncate text-[11px] font-sans">
                    {item.type}
                  </span>
                  <span className="text-emerald-400 font-bold text-[11px]">
                    {item.conf}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-[#1b283c]">
                  <span>{item.cam}</span>
                  <span>{item.time}</span>
                </div>
              </div>

              {/* Right Column: Thumbnail */}
              <div className="w-12 h-14 rounded-lg overflow-hidden border border-[#1b283c] bg-black/60 flex-shrink-0 flex items-center justify-center group-hover:border-cyan-500/60 transition-colors">
                <img 
                  src={item.thumb} 
                  alt={item.type}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Global Interactive Modals */}
      <VideoSourceModal />
      <VideoInspectionModal />
      <ObjectInspectorModal />
      <ZoneSetupModal isOpen={isZoneModalOpen} onClose={() => setIsZoneModalOpen(false)} />

    </div>
  );
};

export default CommandCenter;

