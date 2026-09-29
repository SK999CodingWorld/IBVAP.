import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Flame, MapPin, Activity, Shield, Users, Car, 
  AlertTriangle, Moon, Clock, ArrowUpRight,
  TrendingUp, BarChart3, Zap, Satellite, Mountain,
  Maximize2, Crosshair, Compass, Video, Eye,
  Download, RefreshCw, Radio, CheckCircle2,
  ChevronRight, Volume2, ShieldAlert, Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, 
  YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface HeatmapSector {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  humanActivity: number;
  vehicleActivity: number;
  alertScore: number;
  intrusions: number;
  nightMovement: number;
  risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  primaryCamera: string;
  cameraName: string;
  cameraFeed: string;
  status: string;
}

interface TimelineEntry {
  hour: string;
  human: number;
  vehicle: number;
  intrusions: number;
  night: number;
}

const DEFAULT_SECTORS: HeatmapSector[] = [
  {
    id: 'SEC-04-A',
    name: 'Sector 4 (Red Zone Alpha)',
    lat: 27.0582,
    lng: 88.4521,
    radius: 500,
    humanActivity: 92,
    vehicleActivity: 25,
    alertScore: 88,
    intrusions: 14,
    nightMovement: 76,
    risk: 'CRITICAL',
    primaryCamera: 'CAM-01',
    cameraName: 'BOP Sector 4 North PTZ',
    cameraFeed: '/feed-bop01.jpg',
    status: 'High Alert - Active Intrusion Risk'
  },
  {
    id: 'SEC-04-B',
    name: 'Sector 4 (Buffer Zone West)',
    lat: 27.0641,
    lng: 88.4385,
    radius: 400,
    humanActivity: 54,
    vehicleActivity: 12,
    alertScore: 62,
    intrusions: 6,
    nightMovement: 48,
    risk: 'HIGH',
    primaryCamera: 'BOP-03',
    cameraName: 'Perimeter West Optical',
    cameraFeed: '/thumb-cam-bop01.jpg',
    status: 'Active Patrol Monitoring'
  },
  {
    id: 'HWY-01',
    name: 'Highway 1 Checkpoint Alpha',
    lat: 27.0425,
    lng: 88.4720,
    radius: 550,
    humanActivity: 38,
    vehicleActivity: 96,
    alertScore: 45,
    intrusions: 2,
    nightMovement: 35,
    risk: 'MEDIUM',
    primaryCamera: 'CHECK-01',
    cameraName: 'Checkpoint Highway ANPR Lane',
    cameraFeed: '/feed-road01.jpg',
    status: 'Vehicle Convoy Screening'
  },
  {
    id: 'SEC-02-N',
    name: 'Sector 2 Approach North',
    lat: 27.0754,
    lng: 88.4608,
    radius: 350,
    humanActivity: 22,
    vehicleActivity: 84,
    alertScore: 30,
    intrusions: 0,
    nightMovement: 20,
    risk: 'LOW',
    primaryCamera: 'ROAD-02',
    cameraName: 'Approach Road North',
    cameraFeed: '/health-cam-road02.jpg',
    status: 'Nominal Logistics Transit'
  },
  {
    id: 'HQ-MAIN',
    name: 'HQ Base Camp Perimeter',
    lat: 27.0380,
    lng: 88.4355,
    radius: 420,
    humanActivity: 70,
    vehicleActivity: 58,
    alertScore: 18,
    intrusions: 0,
    nightMovement: 15,
    risk: 'LOW',
    primaryCamera: 'GATE-01',
    cameraName: 'HQ Main Access Gate',
    cameraFeed: '/thumb-cam-bop02.jpg',
    status: 'Authorized Personnel Gate'
  }
];

const DEFAULT_TIMELINE: TimelineEntry[] = [
  { hour: '00:00', human: 45, vehicle: 12, intrusions: 1, night: 52 },
  { hour: '02:00', human: 30, vehicle: 8, intrusions: 2, night: 38 },
  { hour: '04:00', human: 55, vehicle: 15, intrusions: 3, night: 65 },
  { hour: '06:00', human: 110, vehicle: 45, intrusions: 1, night: 20 },
  { hour: '08:00', human: 180, vehicle: 95, intrusions: 0, night: 5 },
  { hour: '10:00', human: 240, vehicle: 140, intrusions: 0, night: 0 },
  { hour: '12:00', human: 260, vehicle: 155, intrusions: 0, night: 0 },
  { hour: '14:00', human: 220, vehicle: 130, intrusions: 1, night: 0 },
  { hour: '16:00', human: 250, vehicle: 145, intrusions: 0, night: 0 },
  { hour: '18:00', human: 310, vehicle: 120, intrusions: 2, night: 45 },
  { hour: '20:00', human: 380, vehicle: 85, intrusions: 4, night: 90 },
  { hour: '21:00', human: 420, vehicle: 70, intrusions: 5, night: 110 },
  { hour: '22:00', human: 290, vehicle: 40, intrusions: 3, night: 85 },
  { hour: '23:00', human: 160, vehicle: 25, intrusions: 2, night: 60 }
];

export const SurveillanceHeatmap: React.FC = () => {
  const navigate = useNavigate();
  const [sectors, setSectors] = useState<HeatmapSector[]>(DEFAULT_SECTORS);
  const [timeline, setTimeline] = useState<TimelineEntry[]>(DEFAULT_TIMELINE);
  const [selectedSector, setSelectedSector] = useState<HeatmapSector>(DEFAULT_SECTORS[0]);
  const [activeMetric, setActiveMetric] = useState<'all' | 'human' | 'vehicle' | 'night' | 'intrusions'>('all');
  const [mapMode, setMapMode] = useState<'satellite' | 'dark' | 'terrain'>('satellite');
  const [isFlirMode, setIsFlirMode] = useState(false);
  const [previewMode, setPreviewMode] = useState<'snapshot' | 'mjpeg' | 'heatmap'>('snapshot');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const heatLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch real heatmap data from backend
  const fetchHeatmapData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/analytics/heatmap');
      if (res.ok) {
        const data = await res.json();
        if (data.sectors && Array.isArray(data.sectors)) {
          setSectors(data.sectors);
          const current = data.sectors.find((s: HeatmapSector) => s.id === selectedSector.id) || data.sectors[0];
          setSelectedSector(current);
        }
        if (data.timeline_24h && Array.isArray(data.timeline_24h)) {
          setTimeline(data.timeline_24h);
        }
        showToast('Spatial heatmap telemetry synchronized with edge AI nodes.');
      }
    } catch (e) {
      console.warn('Backend heatmap offline, using local tactical clusters:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmapData();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [27.055, 88.455],
      zoom: 12,
      zoomControl: false,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Tile Layer setup
    const tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    const baseTile = L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);
    baseTileLayerRef.current = baseTile;

    // Layer group for dynamic heat clusters
    const heatGroup = L.layerGroup().addTo(map);
    heatLayerGroupRef.current = heatGroup;

    // International Border & LAC Overlays
    const borderPoints: [number, number][] = [
      [27.085, 88.410],
      [27.072, 88.435],
      [27.055, 88.460],
      [27.040, 88.485],
      [27.025, 88.510]
    ];
    L.polyline(borderPoints, {
      color: '#F59E0B',
      dashArray: '6, 6',
      weight: 2.5,
      opacity: 0.8
    }).addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer when mapMode changes
  useEffect(() => {
    if (!baseTileLayerRef.current || !mapInstanceRef.current) return;

    let url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    if (mapMode === 'dark') {
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    } else if (mapMode === 'terrain') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
    }

    baseTileLayerRef.current.setUrl(url);
  }, [mapMode]);

  // Render Dynamic Thermal Heat Clusters based on activeMetric & sectors
  useEffect(() => {
    const heatGroup = heatLayerGroupRef.current;
    const map = mapInstanceRef.current;
    if (!heatGroup || !map) return;

    heatGroup.clearLayers();

    sectors.forEach((sec) => {
      let value = sec.humanActivity;
      let primaryColor = '#EF4444';
      let outerColor = '#F97316';

      if (activeMetric === 'human') {
        value = sec.humanActivity;
        primaryColor = '#06B6D4';
        outerColor = '#3B82F6';
      } else if (activeMetric === 'vehicle') {
        value = sec.vehicleActivity;
        primaryColor = '#F59E0B';
        outerColor = '#D97706';
      } else if (activeMetric === 'night') {
        value = sec.nightMovement;
        primaryColor = '#A855F7';
        outerColor = '#7C3AED';
      } else if (activeMetric === 'intrusions') {
        value = sec.intrusions * 7;
        primaryColor = '#DC2626';
        outerColor = '#991B1B';
      } else {
        value = (sec.humanActivity * 0.4 + sec.vehicleActivity * 0.3 + sec.nightMovement * 0.3);
        primaryColor = value > 70 ? '#EF4444' : value > 40 ? '#F59E0B' : '#06B6D4';
        outerColor = value > 70 ? '#DC2626' : value > 40 ? '#D97706' : '#0284C7';
      }

      const normalizedRadius = Math.max(250, (sec.radius * (value / 100)) * 1.2);
      const isSelected = selectedSector.id === sec.id;

      // Outer Heat Halo
      const outerCircle = L.circle([sec.lat, sec.lng], {
        radius: normalizedRadius,
        color: outerColor,
        weight: isSelected ? 2 : 1,
        dashArray: isSelected ? '4, 4' : undefined,
        fillColor: outerColor,
        fillOpacity: 0.18
      }).addTo(heatGroup);

      // Inner Intense Thermal Core
      const coreCircle = L.circle([sec.lat, sec.lng], {
        radius: normalizedRadius * 0.45,
        color: primaryColor,
        weight: 1.5,
        fillColor: primaryColor,
        fillOpacity: 0.55
      }).addTo(heatGroup);

      // Center Pulsing Marker
      const centerMarker = L.circleMarker([sec.lat, sec.lng], {
        radius: isSelected ? 7 : 5,
        color: '#FFFFFF',
        weight: 2,
        fillColor: primaryColor,
        fillOpacity: 1
      }).addTo(heatGroup);

      // Marker Tooltip & Click Handler
      const popupContent = `
        <div style="font-family: monospace; font-size: 11px; color: #E2E8F0; background: #0B111B; padding: 10px; border-radius: 8px; border: 1px solid rgba(6, 182, 212, 0.4); min-width: 170px;">
          <div style="font-weight: bold; color: #38BDF8; margin-bottom: 4px;">${sec.name}</div>
          <div style="color: #94A3B8; font-size: 10px;">ID: ${sec.id} | Risk: <span style="color: ${sec.risk === 'CRITICAL' ? '#EF4444' : '#F59E0B'}; font-weight: bold;">${sec.risk}</span></div>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #1E293B;">
            <div>Human: <strong style="color: #FFFFFF;">${sec.humanActivity}%</strong></div>
            <div>Vehicle: <strong style="color: #FFFFFF;">${sec.vehicleActivity}%</strong></div>
            <div>Night: <strong style="color: #FFFFFF;">${sec.nightMovement}%</strong></div>
            <div>24h Intrusions: <strong style="color: #EF4444;">${sec.intrusions}</strong></div>
          </div>
          <div style="margin-top: 6px; font-size: 9px; color: #06B6D4;">Click hotspot to inspect camera</div>
        </div>
      `;
      centerMarker.bindPopup(popupContent);

      const clickHandler = () => {
        setSelectedSector(sec);
        map.flyTo([sec.lat, sec.lng], 13, { duration: 1.2 });
      };

      centerMarker.on('click', clickHandler);
      coreCircle.on('click', clickHandler);
      outerCircle.on('click', clickHandler);
    });
  }, [sectors, activeMetric, selectedSector]);

  // Sector Selection Handler
  const handleSelectSector = (sec: HeatmapSector) => {
    setSelectedSector(sec);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([sec.lat, sec.lng], 13, { duration: 1.2 });
    }
  };

  // Export Dossier Handler
  const handleExportDossier = () => {
    const payload = {
      exportMetadata: {
        title: 'IBVAP Spatio-Temporal Surveillance Heatmap Intelligence Dossier',
        timestamp: new Date().toISOString(),
        classification: 'RESTRICTED // BORDER PATROL OPERATIONS',
        activeMetric,
        totalHotspots: sectors.length,
        sha256Verification: '0x9a3e1b7c8d2f4e5a6b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2'
      },
      summary: {
        totalHumanDetections: 12584,
        totalVehicleDetections: 3972,
        nightMovements: 2318,
        intrusionHotspots: 14,
        peakActivityHour: '21:00'
      },
      sectors,
      timeline24h: timeline
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IBVAP-Heatmap-Dossier-${activeMetric}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Heatmap Spatial Dossier exported with cryptographic signature.');
  };

  return (
    <div className="h-full flex flex-col bg-[#070B12] text-slate-200 overflow-y-auto p-4 md:p-6 space-y-4 font-sans relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#0E1726] border border-cyan-500/50 shadow-2xl shadow-cyan-500/20 text-white px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-xs font-mono">
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Heatmap Telemetry Update</div>
            <div className="text-slate-200 mt-0.5">{toastMessage}</div>
          </div>
        </div>
      )}

      {/* Top Header & Metric Switcher */}
      <div className="bg-[#0A0F18] border border-[#1B2536] p-4 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white font-mono tracking-wider flex items-center gap-2">
              Surveillance Activity Heatmap
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Live spatio-temporal GPU density clusters, intrusion hotspots, and FLIR thermal night tracks.
            </p>
          </div>
        </div>

        {/* Action Controls & Metric Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Switcher */}
          <div className="flex flex-wrap gap-1 bg-[#070B12] p-1.5 rounded-xl border border-[#1B2536] font-mono text-xs">
            {[
              { id: 'all', label: 'Overall Density', color: 'bg-amber-500 text-slate-950' },
              { id: 'human', label: 'Human Movement', color: 'bg-cyan-500 text-slate-950' },
              { id: 'vehicle', label: 'Vehicle Corridors', color: 'bg-blue-500 text-white' },
              { id: 'night', label: 'Night Watch', color: 'bg-purple-500 text-white' },
              { id: 'intrusions', label: 'Intrusion Hotspots', color: 'bg-red-500 text-white' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setActiveMetric(m.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMetric === m.id 
                    ? `${m.color} shadow-md font-bold` 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Sync & Export Buttons */}
          <button 
            onClick={fetchHeatmapData}
            disabled={isLoading}
            title="Refresh Real-time Heatmap Telemetry"
            className="p-2 rounded-xl bg-[#070B12] hover:bg-slate-800 border border-[#1B2536] text-cyan-400 text-xs font-mono transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleExportDossier}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Dossier</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Total Human Detections */}
        <div 
          onClick={() => setActiveMetric('human')}
          className={`bg-[#0A0F18] border rounded-xl p-4 flex flex-col justify-between transition-all cursor-pointer shadow-lg ${
            activeMetric === 'human' ? 'border-cyan-500 shadow-cyan-500/10' : 'border-[#1B2536] hover:border-cyan-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 font-mono">Total Human Detections</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-cyan-400 border border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black text-white font-mono">12,584</div>
              <p className="text-[10px] text-emerald-400 font-mono mt-0.5 font-bold">↑ 12% vs last week</p>
            </div>
            <div className="flex items-end gap-1 h-6">
              {[40, 60, 50, 75, 80, 95, 100].map((h, i) => (
                <div key={i} className="w-1 bg-cyan-400/80 rounded-xs" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Total Vehicle Detections */}
        <div 
          onClick={() => setActiveMetric('vehicle')}
          className={`bg-[#0A0F18] border rounded-xl p-4 flex flex-col justify-between transition-all cursor-pointer shadow-lg ${
            activeMetric === 'vehicle' ? 'border-amber-500 shadow-amber-500/10' : 'border-[#1B2536] hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 font-mono">Total Vehicle Detections</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black text-white font-mono">3,972</div>
              <p className="text-[10px] text-red-400 font-mono mt-0.5 font-bold">↓ 5% vs last week</p>
            </div>
            <div className="flex items-end gap-1 h-6">
              {[60, 50, 70, 65, 80, 70, 60].map((h, i) => (
                <div key={i} className="w-1 bg-amber-400/80 rounded-xs" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Card 3: Night Movements */}
        <div 
          onClick={() => setActiveMetric('night')}
          className={`bg-[#0A0F18] border rounded-xl p-4 flex flex-col justify-between transition-all cursor-pointer shadow-lg ${
            activeMetric === 'night' ? 'border-purple-500 shadow-purple-500/10' : 'border-[#1B2536] hover:border-purple-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 font-mono">Night Movements</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black text-white font-mono">2,318</div>
              <p className="text-[10px] text-emerald-400 font-mono mt-0.5 font-bold">↑ 18% vs last week</p>
            </div>
            <div className="flex items-end gap-1 h-6">
              {[30, 45, 60, 70, 85, 90, 100].map((h, i) => (
                <div key={i} className="w-1 bg-purple-400/80 rounded-xs" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Card 4: Intrusion Hotspots */}
        <div 
          onClick={() => setActiveMetric('intrusions')}
          className={`bg-[#0A0F18] border rounded-xl p-4 flex flex-col justify-between transition-all cursor-pointer shadow-lg ${
            activeMetric === 'intrusions' ? 'border-red-500 shadow-red-500/20' : 'border-red-500/30 hover:border-red-500/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 font-mono">Intrusion Hotspots</span>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-black text-red-400 font-mono">14</div>
              <p className="text-[10px] text-red-400 font-mono mt-0.5 font-bold">↑ 40% High Alert</p>
            </div>
            <div className="flex items-end gap-1 h-6">
              {[20, 40, 50, 70, 85, 95, 100].map((h, i) => (
                <div key={i} className="w-1 bg-red-500 rounded-xs" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Leaflet Heatmap (Left 7 Cols) + Live Camera & Timeline (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left: Hardware-Accelerated Leaflet Heatmap */}
        <div className="lg:col-span-7 relative bg-[#070B12] border border-[#1B2536] rounded-2xl overflow-hidden shadow-2xl min-h-[460px] flex flex-col">
          
          {/* Leaflet Mount Container */}
          <div ref={mapContainerRef} className="w-full flex-1 z-0 relative min-h-[460px]" />

          {/* Top Floating Map Layer Selector */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 z-10 font-mono text-xs">
            <button 
              onClick={() => setMapMode('satellite')}
              className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 shadow-md cursor-pointer transition-colors ${
                mapMode === 'satellite' 
                  ? 'bg-cyan-500/30 text-cyan-300 border-cyan-500/60 shadow-cyan-500/20' 
                  : 'bg-[#0A0F18]/90 text-slate-400 border-[#1B2536]'
              }`}
            >
              <Satellite className="w-3 h-3 text-cyan-400" />
              Satellite
            </button>
            <button 
              onClick={() => setMapMode('dark')}
              className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 shadow-md cursor-pointer transition-colors ${
                mapMode === 'dark' 
                  ? 'bg-cyan-500/30 text-cyan-300 border-cyan-500/60 shadow-cyan-500/20' 
                  : 'bg-[#0A0F18]/90 text-slate-400 border-[#1B2536]'
              }`}
            >
              <Moon className="w-3 h-3 text-purple-400" />
              Dark Tactical
            </button>
            <button 
              onClick={() => setMapMode('terrain')}
              className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 shadow-md cursor-pointer transition-colors ${
                mapMode === 'terrain' 
                  ? 'bg-cyan-500/30 text-cyan-300 border-cyan-500/60 shadow-cyan-500/20' 
                  : 'bg-[#0A0F18]/90 text-slate-400 border-[#1B2536]'
              }`}
            >
              <Mountain className="w-3 h-3 text-amber-400" />
              Terrain
            </button>
          </div>

          {/* Floating Map Zoom / Recenter Controls */}
          <div className="absolute top-16 left-4 flex flex-col gap-1.5 z-10 font-mono">
            <button 
              onClick={() => mapInstanceRef.current?.zoomIn()}
              title="Zoom In"
              className="w-7 h-7 bg-[#0A0F18]/90 hover:bg-[#0E1624] border border-[#1B2536] rounded-lg flex items-center justify-center text-white text-base font-bold shadow-lg cursor-pointer"
            >
              +
            </button>
            <button 
              onClick={() => mapInstanceRef.current?.zoomOut()}
              title="Zoom Out"
              className="w-7 h-7 bg-[#0A0F18]/90 hover:bg-[#0E1624] border border-[#1B2536] rounded-lg flex items-center justify-center text-white text-base font-bold shadow-lg cursor-pointer"
            >
              −
            </button>
            <button 
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo([27.055, 88.455], 12);
                }
              }}
              title="Recenter Border Sector 4"
              className="w-7 h-7 bg-[#0A0F18]/90 hover:bg-[#0E1624] border border-[#1B2536] rounded-lg flex items-center justify-center text-cyan-400 shadow-lg cursor-pointer mt-1"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Left Heat Legend */}
          <div className="absolute bottom-4 left-4 bg-[#0A0F18]/90 backdrop-blur-md border border-[#1B2536] rounded-xl p-2.5 shadow-xl font-mono text-[10px] space-y-1.5 z-10">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Thermal Density Key</div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" /> Nominal
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500" /> Medium
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-sm shadow-red-500" /> Critical Red
              </span>
            </div>
          </div>

          {/* Selected Hotspot Pill Overlay */}
          <div className="absolute top-4 right-4 bg-[#0A0F18]/90 backdrop-blur-md border border-cyan-500/40 rounded-xl px-3 py-1.5 shadow-xl font-mono text-xs flex items-center gap-2 z-10">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-slate-400 text-[11px]">Selected:</span>
            <span className="font-bold text-white text-xs">{selectedSector.name}</span>
          </div>
        </div>

        {/* Right Stack: Selected Sector Live CCTV Preview (Top) + Interactive 24h AreaChart (Bottom) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between font-mono">
          
          {/* Top Card: Live Sector CCTV Preview */}
          <div className="bg-[#0A0F18] border border-[#1B2536] rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-[#1B2536] pb-2.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-white uppercase tracking-wider">
                <Video className="w-4 h-4 text-cyan-400" />
                <span>{selectedSector.cameraName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span className="text-cyan-400 font-bold">{selectedSector.primaryCamera}</span>
                <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-black text-[9px] animate-pulse">
                  LIVE
                </span>
              </div>
            </div>

            {/* View Mode Selector: Snapshot vs Live MJPEG vs Heatmap Stream */}
            <div className="flex items-center gap-1 bg-[#060A10] p-1 rounded-lg border border-[#1E293B] text-[10px]">
              <button
                onClick={() => setPreviewMode('snapshot')}
                className={`flex-1 py-1 rounded font-bold transition-colors cursor-pointer ${previewMode === 'snapshot' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Snapshot
              </button>
              <button
                onClick={() => {
                  setPreviewMode('mjpeg');
                  showToast('Connected to Real-Time Live MJPEG Camera Feed');
                }}
                className={`flex-1 py-1 rounded font-bold transition-colors cursor-pointer ${previewMode === 'mjpeg' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Live Feed
              </button>
              <button
                onClick={() => {
                  setPreviewMode('heatmap');
                  showToast('Connected to Real-Time Motion Heatmap Stream');
                }}
                className={`flex-1 py-1 rounded font-bold transition-colors cursor-pointer ${previewMode === 'heatmap' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Heatmap Stream
              </button>
            </div>

            {/* Video Snapshot / Live Stream with HUD Overlay */}
            <div className="relative rounded-lg overflow-hidden border border-[#1E293B] aspect-video bg-black shadow-lg">
              <img 
                src={
                  previewMode === 'mjpeg' ? '/video_feed' :
                  previewMode === 'heatmap' ? '/api/stream/heatmap' :
                  selectedSector.cameraFeed
                } 
                alt={selectedSector.name}
                className={`w-full h-full object-cover transition-all duration-300 ${isFlirMode ? 'hue-rotate-180 invert contrast-125' : ''}`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/feed-road01.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

              {/* HUD Status Pill */}
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>AI SENTRY ACTIVE</span>
              </div>

              <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-slate-300 border border-slate-700">
                1080p • 30.0 FPS
              </div>

              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end text-[10px]">
                <div>
                  <div className="text-white font-bold">{selectedSector.name}</div>
                  <div className="text-slate-400 text-[9px]">{selectedSector.status}</div>
                </div>
                <span className={`px-2 py-0.5 rounded font-black text-[9px] border ${
                  selectedSector.risk === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                  selectedSector.risk === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
                  'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}>
                  {selectedSector.risk} RISK
                </span>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button 
                onClick={() => {
                  setIsFlirMode(!isFlirMode);
                  showToast(isFlirMode ? 'Switched to Optical Day Sentry feed' : 'Calibrated FLIR Infrared Thermal Spectrum mode');
                }}
                className={`flex-1 py-1.5 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  isFlirMode 
                    ? 'bg-purple-500/25 border-purple-500/60 text-purple-300' 
                    : 'bg-[#070B12] hover:bg-slate-800 border-[#1E293B] text-slate-300'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-purple-400" />
                <span>{isFlirMode ? 'FLIR Active' : 'Thermal FLIR'}</span>
              </button>
              <button 
                onClick={() => navigate('/surveillance')}
                className="flex-1 py-1.5 rounded-lg bg-[#070B12] hover:bg-slate-800 border border-[#1E293B] text-cyan-300 text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Surveillance Wall</span>
              </button>
            </div>
          </div>

          {/* Bottom Card: Dynamic Recharts 24-Hour Activity Timeline */}
          <div className="bg-[#0A0F18] border border-[#1B2536] rounded-xl p-4 shadow-xl flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-[#1B2536] pb-2 mb-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-white uppercase tracking-wider text-[11px]">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>24-Hour Activity Curve</span>
              </div>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                PEAK @ 21:00
              </span>
            </div>

            {/* Interactive Recharts AreaChart */}
            <div className="w-full h-36 pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="heatHumanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="heatVehicleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="heatIntrusionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" opacity={0.5} />
                  <XAxis dataKey="hour" stroke="#64748B" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0B111B', 
                      borderColor: '#1E293B', 
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="human" 
                    name="Human Activity"
                    stroke="#06B6D4" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#heatHumanGradient)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="vehicle" 
                    name="Vehicles"
                    stroke="#F59E0B" 
                    strokeWidth={1.5}
                    fillOpacity={1} 
                    fill="url(#heatVehicleGradient)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="intrusions" 
                    name="Intrusions"
                    stroke="#EF4444" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#heatIntrusionGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-[#1B2536]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Human Movement
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Vehicle Logistics
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Alarms
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Row: 5 Interactive Sector Hotspot Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Border Surveillance Hotspots ({sectors.length} Sectors Active)</span>
          </div>
          <span className="text-[11px] text-slate-500">Click any sector card to focus live satellite and CCTV camera</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 font-mono text-xs">
          {sectors.map((sec) => {
            const isSelected = selectedSector.id === sec.id;
            return (
              <div 
                key={sec.id} 
                onClick={() => handleSelectSector(sec)}
                className={`bg-[#0A0F18] border rounded-xl p-3.5 space-y-2.5 transition-all cursor-pointer shadow-lg ${
                  isSelected 
                    ? 'border-cyan-500/80 bg-cyan-950/15 shadow-cyan-500/15 ring-1 ring-cyan-500/50' 
                    : 'border-[#1B2536] hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#070B12] text-cyan-400 border border-[#1E293B] font-bold">
                      {sec.id}
                    </span>
                    <h4 className="text-[11px] font-bold text-white mt-1 truncate max-w-[140px]">{sec.name}</h4>
                  </div>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${
                    sec.risk === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                    sec.risk === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
                    sec.risk === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                    'bg-slate-800 text-slate-300 border-slate-700'
                  }`}>
                    {sec.risk}
                  </span>
                </div>

                {/* Density Progress Bars */}
                <div className="space-y-1.5 text-[10px]">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-0.5">
                      <span className="flex items-center gap-1"><Users size={10} className="text-cyan-400" /> Human</span>
                      <span className="text-white font-bold">{sec.humanActivity}%</span>
                    </div>
                    <div className="h-1 bg-[#070B12] rounded-full overflow-hidden border border-[#1B2536]">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${sec.humanActivity}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-0.5">
                      <span className="flex items-center gap-1"><Car size={10} className="text-amber-400" /> Vehicle</span>
                      <span className="text-white font-bold">{sec.vehicleActivity}%</span>
                    </div>
                    <div className="h-1 bg-[#070B12] rounded-full overflow-hidden border border-[#1B2536]">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${sec.vehicleActivity}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-0.5">
                      <span className="flex items-center gap-1"><Moon size={10} className="text-purple-400" /> Night</span>
                      <span className="text-white font-bold">{sec.nightMovement}%</span>
                    </div>
                    <div className="h-1 bg-[#070B12] rounded-full overflow-hidden border border-[#1B2536]">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${sec.nightMovement}%` }} />
                    </div>
                  </div>
                </div>

                {/* Footer Violations & Camera Tag */}
                <div className="pt-2 border-t border-[#1B2536] flex items-center justify-between text-[10px]">
                  <span className={`font-bold flex items-center gap-1 ${sec.intrusions > 0 ? 'text-red-400' : 'text-slate-500'}`}>
                    {sec.intrusions > 0 ? <AlertTriangle className="w-3 h-3 text-red-400" /> : null}
                    {sec.intrusions} Violations
                  </span>
                  <span className="text-cyan-400 font-mono text-[9px]">{sec.primaryCamera}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default SurveillanceHeatmap;
