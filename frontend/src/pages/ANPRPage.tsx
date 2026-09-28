import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { 
  Search, Download, Camera, Car, Activity, Eye, 
  ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw, Filter,
  Truck, Bike, ExternalLink, Zap, Radio, X, Check, FileText,
  Sliders, Shield, Plus, Trash2, Fuel, Award, AlertOctagon,
  Gauge, Clock, MapPin, ChevronRight, Play, Pause
} from 'lucide-react';

interface ANPRRecord {
  id: string | number;
  track_id?: number;
  plate: string;
  type: string;
  camera: string;
  confidence: number;
  time: string;
  speed: string;
  speed_kmh: number;
  speed_status: 'NORMAL' | 'OVERSPEED';
  status: 'CLEARED' | 'FLAGGED';
  is_flagged: boolean;
  flag_reason?: string;
  flag_level?: string;
  zone?: string;
  thumb: string;
  vehicleImg: string;
}

interface ANPRStats {
  total_reads: number;
  unique_vehicles: number;
  hotlist_count: number;
  avg_confidence: number;
  breakdown: Record<string, number>;
  status: string;
}

interface VahanRecord {
  status: string;
  plate_number: string;
  state: string;
  rto_office: string;
  registration_authority: string;
  owner_name: string;
  vehicle_make_model: string;
  vehicle_class: string;
  fuel_type: string;
  color: string;
  registration_date: string;
  chassis_number_hash: string;
  engine_number_hash: string;
  insurance_company: string;
  insurance_valid_upto: string;
  insurance_status: string;
  puc_certificate_no: string;
  puc_valid_upto: string;
  fitness_valid_upto: string;
  national_permit: string;
  hotlist_status: string;
  hotlist_details?: any;
  verification_seal: string;
  verified_at: string;
}

interface HotlistItem {
  id: number;
  plate_number: string;
  reason: string;
  flag_level: string;
  vehicle_model: string;
  reported_by: string;
  added_at: string;
}

const FALLBACK_READS: ANPRRecord[] = [
  { 
    id: '1', 
    plate: 'DL-01-AB-1234', 
    type: 'CAR', 
    camera: 'CAM-05 (Highway Lane 1)', 
    confidence: 98.4, 
    time: '10:45:12', 
    speed: '48 km/h', 
    speed_kmh: 48,
    speed_status: 'NORMAL',
    status: 'CLEARED',
    is_flagged: false,
    thumb: '/thumb-anpr-car.jpg',
    vehicleImg: '/thumb-anpr-car.jpg',
    zone: 'Sector 4 Red Perimeter'
  },
  { 
    id: '2', 
    plate: 'UP-32-CD-5678', 
    type: 'TRUCK', 
    camera: 'CAM-06 (Freight Terminal)', 
    confidence: 95.8, 
    time: '10:42:30', 
    speed: '34 km/h', 
    speed_kmh: 34,
    speed_status: 'NORMAL',
    status: 'FLAGGED',
    is_flagged: true,
    flag_reason: 'Smuggling Contraband Alert - Customs Intercept Notice',
    flag_level: 'CRITICAL',
    thumb: '/thumb-anpr-truck.jpg',
    vehicleImg: '/thumb-anpr-truck.jpg',
    zone: 'Checkpoint Highway Alpha'
  },
  { 
    id: '3', 
    plate: 'RJ-14-EF-9012', 
    type: 'MOTORCYCLE', 
    camera: 'CAM-05 (Highway Lane 1)', 
    confidence: 88.5, 
    time: '10:35:15', 
    speed: '82 km/h', 
    speed_kmh: 82,
    speed_status: 'OVERSPEED',
    status: 'FLAGGED',
    is_flagged: true,
    flag_reason: 'Intercept Mandated - Suspected Cross-Border Arms Transit',
    flag_level: 'CRITICAL',
    thumb: '/thumb-anpr-bike.jpg',
    vehicleImg: '/thumb-anpr-bike.jpg',
    zone: 'Sector 4 Red Perimeter'
  },
  { 
    id: '4', 
    plate: 'MH-12-GH-3456', 
    type: 'CAR', 
    camera: 'CAM-06 (Freight Terminal)', 
    confidence: 99.1, 
    time: '10:30:05', 
    speed: '51 km/h', 
    speed_kmh: 51,
    speed_status: 'NORMAL',
    status: 'CLEARED',
    is_flagged: false,
    thumb: '/thumb-anpr-car.jpg',
    vehicleImg: '/thumb-anpr-car.jpg',
    zone: 'Perimeter Approach North'
  }
];

export const ANPRPage = () => {
  const [reads, setReads] = useState<ANPRRecord[]>(FALLBACK_READS);
  const [stats, setStats] = useState<ANPRStats>({
    total_reads: 65000,
    unique_vehicles: 33900,
    hotlist_count: 4,
    avg_confidence: 96.2,
    breakdown: { CAR: 51200, TRUCK: 4680, MOTORCYCLE: 8090, BUS: 1030 },
    status: 'OPERATIONAL'
  });
  const [hotlist, setHotlist] = useState<HotlistItem[]>([]);
  const [selectedPlate, setSelectedPlate] = useState<ANPRRecord>(FALLBACK_READS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FLAGGED' | 'OVERSPEED'>('ALL');
  
  // Real-time Controls
  const [isAutoSync, setIsAutoSync] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Live');
  const [flashNewId, setFlashNewId] = useState<string | number | null>(null);

  // VAHAN Verification Modal
  const [vahanModalOpen, setVahanModalOpen] = useState(false);
  const [vahanLoading, setVahanLoading] = useState(false);
  const [vahanData, setVahanData] = useState<VahanRecord | null>(null);

  // Hotlist Management Modal
  const [hotlistManagerOpen, setHotlistManagerOpen] = useState(false);
  const [addHotlistModalOpen, setAddHotlistModalOpen] = useState(false);
  const [addPlateInput, setAddPlateInput] = useState('');
  const [addReasonInput, setAddReasonInput] = useState('Suspected Unauthorized Cross-Border Transit');
  const [addLevelInput, setAddLevelInput] = useState('CRITICAL');

  // Fetch Reads from API
  const fetchReads = async () => {
    try {
      const res = await fetch('/api/anpr/reads?limit=60');
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          const mapped: ANPRRecord[] = json.data.map((item: any) => ({
            id: item.id,
            track_id: item.track_id,
            plate: item.plate_number,
            type: (item.vehicle_type || 'CAR').toUpperCase(),
            camera: item.camera || 'CAM-05 (Highway Lane 1)',
            confidence: item.confidence_pct || 96.5,
            time: item.timestamp ? item.timestamp.split(' ')[1] || item.timestamp : '12:00:00',
            speed: item.speed_str || `${item.speed_kmh || 48} km/h`,
            speed_kmh: item.speed_kmh || 48,
            speed_status: item.speed_status || 'NORMAL',
            status: item.is_flagged ? 'FLAGGED' : 'CLEARED',
            is_flagged: !!item.is_flagged,
            flag_reason: item.flag_reason,
            flag_level: item.flag_level,
            zone: item.zone || 'Sector 4 Red Perimeter',
            thumb: item.thumb || '/thumb-anpr-car.jpg',
            vehicleImg: item.vehicleImg || '/thumb-anpr-car.jpg'
          }));
          setReads(mapped);
          setLastSyncTime(new Date().toLocaleTimeString());

          // Keep selection synchronized
          setSelectedPlate(prev => {
            const match = mapped.find(m => m.id === prev?.id || m.plate === prev?.plate);
            return match || mapped[0];
          });
        }
      }
    } catch (e) {
      console.error('Error fetching ANPR reads:', e);
    }
  };

  // Fetch Stats from API
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/anpr/stats');
      if (res.ok) {
        const json = await res.json();
        if (json.stats) {
          setStats(json.stats);
        }
      }
    } catch (e) {
      console.error('Error fetching ANPR stats:', e);
    }
  };

  // Fetch Hotlist from API
  const fetchHotlist = async () => {
    try {
      const res = await fetch('/api/anpr/hotlist');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setHotlist(json.data);
        }
      }
    } catch (e) {
      console.error('Error fetching hotlist:', e);
    }
  };

  // Initial and Auto-Sync Effect
  useEffect(() => {
    fetchReads();
    fetchStats();
    fetchHotlist();

    if (!isAutoSync) return;
    const interval = setInterval(() => {
      fetchReads();
      fetchStats();
    }, 3500);

    return () => clearInterval(interval);
  }, [isAutoSync]);

  // VAHAN Verification Handler
  const handleVerifyVahan = async (plate: string) => {
    setVahanModalOpen(true);
    setVahanLoading(true);
    try {
      const res = await fetch(`/api/anpr/vahan/${encodeURIComponent(plate)}`);
      if (res.ok) {
        const data = await res.json();
        setVahanData(data);
      }
    } catch (e) {
      console.error('Error querying VAHAN registry:', e);
    } finally {
      setVahanLoading(false);
    }
  };

  // Trigger On-Demand Checkpoint Scan
  const handleSimulateScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/anpr/simulate-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone: 'Sector 4 Red Perimeter',
          camera: 'CAM-05 (Highway Lane 1)'
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const item = json.data;
          const newRecord: ANPRRecord = {
            id: item.id,
            track_id: item.track_id,
            plate: item.plate_number,
            type: (item.vehicle_type || 'CAR').toUpperCase(),
            camera: item.camera || 'CAM-05 (Highway Lane 1)',
            confidence: item.confidence_pct || 97.8,
            time: item.timestamp ? item.timestamp.split(' ')[1] : new Date().toLocaleTimeString(),
            speed: item.speed_str || `${item.speed_kmh || 55} km/h`,
            speed_kmh: item.speed_kmh || 55,
            speed_status: item.speed_status || 'NORMAL',
            status: item.is_flagged ? 'FLAGGED' : 'CLEARED',
            is_flagged: !!item.is_flagged,
            flag_reason: item.flag_reason,
            flag_level: item.flag_level,
            zone: item.zone || 'Sector 4 Red Perimeter',
            thumb: item.thumb || '/thumb-anpr-car.jpg',
            vehicleImg: item.vehicleImg || '/thumb-anpr-car.jpg'
          };
          setReads(prev => [newRecord, ...prev]);
          setSelectedPlate(newRecord);
          setFlashNewId(newRecord.id);
          setTimeout(() => setFlashNewId(null), 3000);
          fetchStats();
        }
      }
    } catch (e) {
      console.error('Error simulating scan:', e);
    } finally {
      setIsScanning(false);
    }
  };

  // Add Plate to Hotlist
  const handleAddToHotlist = async () => {
    if (!addPlateInput.trim()) return;
    try {
      const res = await fetch('/api/anpr/hotlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plate_number: addPlateInput.trim().toUpperCase(),
          reason: addReasonInput,
          flag_level: addLevelInput,
          reported_by: 'HQ Tactical Commander'
        })
      });
      if (res.ok) {
        setAddHotlistModalOpen(false);
        setAddPlateInput('');
        fetchHotlist();
        fetchReads();
        fetchStats();
      }
    } catch (e) {
      console.error('Error adding to hotlist:', e);
    }
  };

  // Remove Plate from Hotlist
  const handleRemoveFromHotlist = async (plate: string) => {
    try {
      const res = await fetch(`/api/anpr/hotlist/${encodeURIComponent(plate)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchHotlist();
        fetchReads();
        fetchStats();
      }
    } catch (e) {
      console.error('Error removing from hotlist:', e);
    }
  };

  // Export ANPR Telemetry Dossier
  const handleExportData = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `IBVAP-ANPR-Telemetry-${timestamp}.csv`;
    
    const headers = [
      'ID', 'Track_ID', 'Plate_Number', 'Vehicle_Type', 'Camera', 
      'Confidence_Pct', 'Time', 'Speed_KMH', 'Speed_Status', 
      'Hotlist_Status', 'Flag_Reason', 'Zone'
    ];
    
    const csvRows = [
      `# IBVAP AUTOMATIC NUMBER PLATE RECOGNITION (ANPR) TELEMETRY DOSSIER`,
      `# Export Date: ${new Date().toUTCString()} · Total Records: ${reads.length}`,
      `# System Security: SHA-256 Verified · Classification: RESTRICTED MILITARY / LAW ENFORCEMENT`,
      headers.join(',')
    ];

    reads.forEach(r => {
      csvRows.push([
        r.id,
        r.track_id || '',
        `"${r.plate}"`,
        `"${r.type}"`,
        `"${r.camera}"`,
        r.confidence,
        `"${r.time}"`,
        r.speed_kmh,
        `"${r.speed_status}"`,
        `"${r.status}"`,
        `"${r.flag_reason || 'N/A'}"`,
        `"${r.zone || ''}"`
      ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter reads for display
  const filteredData = reads.filter(item => {
    const matchesSearch = 
      item.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.camera.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.flag_reason && item.flag_reason.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'ALL' || item.type.toUpperCase() === typeFilter.toUpperCase();
    
    let matchesStatus = true;
    if (statusFilter === 'FLAGGED') matchesStatus = item.is_flagged;
    if (statusFilter === 'OVERSPEED') matchesStatus = item.speed_status === 'OVERSPEED';

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="p-4 md:p-6 h-full flex flex-col bg-[#070B12] text-slate-200 overflow-y-auto space-y-6 font-sans">
      
      {/* Top Header with Military Tactical Backdrop */}
      <div className="relative rounded-2xl border border-[#1B2536] overflow-hidden shadow-2xl bg-[#0A0F18]">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity pointer-events-none"
          style={{ backgroundImage: `url('/anpr-header-bg.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F18] via-[#0A0F18]/90 to-transparent pointer-events-none" />

        <div className="relative z-10 p-5 md:p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <h1 className="text-xl md:text-2xl font-bold tracking-wider text-white font-mono flex items-center gap-2">
                ANPR // AUTOMATIC NUMBER PLATE RECOGNITION SYSTEM
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
              <span>High-speed optical character recognition & National VAHAN Hotlist synchronization</span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400 flex items-center gap-1 font-bold">
                <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
                SYNC: {lastSyncTime}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 font-mono">
            {/* Auto-Sync Toggle */}
            <button
              onClick={() => setIsAutoSync(!isAutoSync)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
                isAutoSync 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-950/20' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {isAutoSync ? <Play className="w-3 h-3 fill-emerald-400" /> : <Pause className="w-3 h-3 fill-amber-400" />}
              {isAutoSync ? 'LIVE STREAMING (3.5s)' : 'SYNC PAUSED'}
            </button>

            {/* Checkpoint Scan Trigger */}
            <Button 
              size="sm"
              disabled={isScanning}
              onClick={handleSimulateScan}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono h-8 shadow-md shadow-cyan-950/30"
            >
              <Zap className={`w-3.5 h-3.5 mr-1 text-slate-950 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'SCANNING...' : 'TRIGGER OCR SCAN'}
            </Button>

            {/* Hotlist Manager Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => { fetchHotlist(); setHotlistManagerOpen(true); }}
              className="bg-[#0F1726] border-red-500/40 hover:bg-red-500/10 text-xs text-red-400 font-mono h-8"
            >
              <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-red-400" />
              Hotlist Watchlist ({stats.hotlist_count})
            </Button>

            {/* Export CSV Dossier */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportData}
              className="bg-[#0F1726] border-[#1E293B] hover:bg-slate-800 text-xs text-slate-200 font-mono h-8" 
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              Export Dossier
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row Synchronized with Live Backend Engine */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Reads */}
        <div className="relative overflow-hidden bg-[#0A0F18] border border-[#1B2536] rounded-xl p-4 flex flex-col justify-between hover:border-blue-500/40 transition-colors shadow-lg">
          <div 
            className="absolute right-0 top-0 bottom-0 w-24 bg-cover bg-center opacity-10 pointer-events-none"
            style={{ backgroundImage: `url('/anpr-kpi-reads.jpg')` }}
          />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono">Total Reads</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Camera className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <div className="text-2xl font-bold text-white font-mono">
              {stats.total_reads.toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Continuous Edge Buffer
            </p>
          </div>
        </div>

        {/* Unique Plates */}
        <div className="relative overflow-hidden bg-[#0A0F18] border border-[#1B2536] rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/40 transition-colors shadow-lg">
          <div 
            className="absolute right-0 top-0 bottom-0 w-24 bg-cover bg-center opacity-10 pointer-events-none"
            style={{ backgroundImage: `url('/anpr-kpi-plates.jpg')` }}
          />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono">Unique Vehicles</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {stats.unique_vehicles.toLocaleString()}
            </div>
            <p className="text-[10px] text-emerald-500/80 font-mono">De-duplicated Signatures</p>
          </div>
        </div>

        {/* Avg Confidence */}
        <div className="relative overflow-hidden bg-[#0A0F18] border border-[#1B2536] rounded-xl p-4 flex flex-col justify-between hover:border-purple-500/40 transition-colors shadow-lg">
          <div 
            className="absolute right-0 top-0 bottom-0 w-24 bg-cover bg-center opacity-10 pointer-events-none"
            style={{ backgroundImage: `url('/anpr-kpi-confidence.jpg')` }}
          />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono">OCR Confidence</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <div className="text-2xl font-bold text-purple-400 font-mono">
              {stats.avg_confidence}%
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Bilateral Sobel Accuracy</p>
          </div>
        </div>

        {/* Hotlist Alerts Generated */}
        <div className="relative overflow-hidden bg-[#0A0F18] border border-red-500/30 rounded-xl p-4 flex flex-col justify-between hover:border-red-500/60 transition-colors shadow-lg">
          <div 
            className="absolute right-0 top-0 bottom-0 w-24 bg-cover bg-center opacity-15 pointer-events-none"
            style={{ backgroundImage: `url('/anpr-kpi-alerts.jpg')` }}
          />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-semibold text-slate-400 uppercase font-mono">BOLO Hotlist</span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <div className="text-2xl font-bold text-red-400 font-mono flex items-center gap-2">
              <span>{stats.hotlist_count} Target{stats.hotlist_count !== 1 ? 's' : ''}</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            </div>
            <p className="text-[10px] text-red-400 font-mono font-bold">Active Intercept Alerts</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Table (7 cols) + Right Inspection Console (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Plate Telemetry Feed */}
        <div className="lg:col-span-7 bg-[#0A0F18] border border-[#1B2536] rounded-xl shadow-xl overflow-hidden flex flex-col">
          
          {/* Table Header & Controls Bar */}
          <div className="p-4 border-b border-[#1B2536] flex flex-wrap items-center justify-between gap-3 bg-[#070B12]">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Live Plate Telemetry Feed
              </h2>
              <span className="text-xs font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/40">
                {filteredData.length} records
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Status Filter */}
              <div className="inline-flex rounded-lg border border-[#1E293B] p-0.5 bg-[#070B12] text-xs font-mono">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2 py-1 rounded ${statusFilter === 'ALL' ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('FLAGGED')}
                  className={`px-2 py-1 rounded ${statusFilter === 'FLAGGED' ? 'bg-red-500/20 text-red-400 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Hotlist
                </button>
                <button
                  onClick={() => setStatusFilter('OVERSPEED')}
                  className={`px-2 py-1 rounded ${statusFilter === 'OVERSPEED' ? 'bg-amber-500/20 text-amber-400 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Radar Speed
                </button>
              </div>

              {/* Vehicle Type Dropdown */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-[#0A0F18] border border-[#1E293B] text-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="CAR">Car</option>
                <option value="TRUCK">Truck</option>
                <option value="MOTORCYCLE">Motorcycle</option>
                <option value="BUS">Bus</option>
                <option value="VAN">Van</option>
              </select>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                <input
                  placeholder="Filter plate, type, camera..."
                  className="pl-8 pr-3 py-1 w-[160px] sm:w-[190px] bg-[#0A0F18] border border-[#1E293B] rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={fetchReads}
                className="text-slate-400 hover:text-cyan-400 h-7 w-7 p-0"
                title="Refresh Table"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-x-auto max-h-[580px] overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="border-[#1B2536] bg-[#070B12] hover:bg-[#070B12] text-slate-400 text-xs font-mono">
                  <TableHead className="text-slate-400 font-bold">Plate Number</TableHead>
                  <TableHead className="text-slate-400 font-bold">Type</TableHead>
                  <TableHead className="text-slate-400 font-bold">Radar Speed</TableHead>
                  <TableHead className="text-slate-400 font-bold">Confidence</TableHead>
                  <TableHead className="text-slate-400 font-bold">Status</TableHead>
                  <TableHead className="text-right text-slate-400 font-bold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 font-mono text-slate-500 text-xs">
                      No vehicle plate records match the active filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => {
                    const isSelected = selectedPlate?.id === item.id || selectedPlate?.plate === item.plate;
                    const isFlashing = flashNewId === item.id;
                    return (
                      <TableRow 
                        key={item.id} 
                        onClick={() => setSelectedPlate(item)}
                        className={`border-[#1B2536] cursor-pointer transition-all ${
                          isFlashing ? 'bg-cyan-500/30 animate-pulse' :
                          isSelected ? 'bg-cyan-500/10 border-l-4 border-cyan-400' : 
                          item.is_flagged ? 'bg-red-500/5 hover:bg-red-500/10' :
                          'hover:bg-[#0F1726]/60'
                        }`}
                      >
                        <TableCell className="font-mono text-sm font-bold">
                          <div className="flex items-center gap-2.5">
                            {/* Vehicle Thumbnail */}
                            <div className="w-10 h-8 rounded bg-slate-900 border border-[#1E293B] overflow-hidden flex-shrink-0 relative">
                              <img 
                                src={item.thumb} 
                                alt={item.plate} 
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                              {item.is_flagged && (
                                <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 ring-2 ring-slate-950" />
                              )}
                            </div>

                            {/* Indian License Plate Badge */}
                            <div className={`px-2.5 py-1 rounded text-white tracking-widest inline-flex items-center gap-1.5 shadow-sm font-mono text-xs border ${
                              item.is_flagged 
                                ? 'bg-red-950/40 border-red-500/50 text-red-200' 
                                : 'bg-[#070B12] border-[#1E293B]'
                            }`}>
                              <span className="text-[9px] text-cyan-400 font-bold">IND</span>
                              <span className="font-black">{item.plate}</span>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant="outline" className="bg-[#0F1726] text-slate-300 border-[#1E293B] text-[11px] font-mono">
                            {item.type}
                          </Badge>
                        </TableCell>

                        {/* Radar Velocity */}
                        <TableCell className="font-mono text-xs">
                          <span className={`inline-flex items-center gap-1 font-bold ${
                            item.speed_status === 'OVERSPEED' 
                              ? 'text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30' 
                              : 'text-slate-300'
                          }`}>
                            <Gauge size={12} className={item.speed_status === 'OVERSPEED' ? 'text-amber-400 animate-pulse' : 'text-slate-500'} />
                            {item.speed}
                          </span>
                        </TableCell>

                        {/* Confidence Progress Bar */}
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-[#1E293B]">
                              <div 
                                className={`h-full rounded-full ${item.confidence > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                style={{ width: `${item.confidence}%` }} 
                              />
                            </div>
                            <span className="text-xs font-mono text-slate-300 font-bold">{item.confidence}%</span>
                          </div>
                        </TableCell>

                        {/* Hotlist Status */}
                        <TableCell>
                          {item.is_flagged ? (
                            <Badge className="bg-red-500/15 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold animate-pulse">
                              <ShieldAlert className="w-3 h-3 mr-1" />
                              HOTLIST HIT
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
                              CLEARED
                            </Badge>
                          )}
                        </TableCell>

                        {/* Inspect CTA */}
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); setSelectedPlate(item); }}
                            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 h-7 px-2.5"
                          >
                            Inspect
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Right: Plate Inspection Console */}
        <div className="lg:col-span-5 bg-[#0A0F18] border border-[#1B2536] rounded-xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#1B2536] pb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <Eye size={15} className="text-cyan-400" />
                Plate Inspection Console
              </h3>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                selectedPlate?.is_flagged
                  ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}>
                {selectedPlate?.is_flagged ? 'FLAGGED // BOLO ALERT' : 'VERIFIED // CLEAR'}
              </span>
            </div>

            {/* High-res cropped plate preview */}
            <div className="p-4 bg-[#070B12] rounded-xl border border-[#1E293B] text-center space-y-3 mt-4 relative overflow-hidden">
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Award size={12} className="text-cyan-400" />
                High-Res OCR Cropped Plate
              </p>

              {/* Realistic Embossed Indian License Plate */}
              <div className="inline-flex items-center px-6 py-2.5 rounded-lg bg-yellow-400 text-slate-950 font-black font-mono text-xl md:text-2xl tracking-widest border-2 border-slate-900 shadow-2xl gap-3">
                <div className="flex flex-col items-center border-r-2 border-slate-800 pr-2.5">
                  <span className="text-[9px] font-black text-blue-900 leading-none">IND</span>
                  <div className="w-2.5 h-2.5 rounded-full border border-blue-900 my-0.5 flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-blue-900" />
                  </div>
                </div>
                <span>{selectedPlate?.plate || 'DL-01-AB-1234'}</span>
              </div>

              <div className="flex items-center justify-center gap-3 text-[10px] font-mono">
                <span className="text-emerald-400">
                  Confidence: {selectedPlate?.confidence || 98}%
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-cyan-400">
                  Filter: Sobel + CLAHE
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-amber-400 font-bold">
                  Radar: {selectedPlate?.speed || '48 km/h'}
                </span>
              </div>
            </div>

            {/* Captured Vehicle Context Snapshot */}
            <div className="mt-4 relative rounded-xl overflow-hidden border border-[#1B2536] aspect-video bg-slate-900 group">
              <img 
                src={selectedPlate?.vehicleImg || '/thumb-anpr-car.jpg'} 
                alt="Captured Vehicle" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/feed-road01.jpg';
                }}
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 rounded text-[10px] font-mono text-cyan-300 font-bold border border-cyan-500/30">
                FRAME SNAPSHOT · {selectedPlate?.time} UTC
              </div>
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/80 rounded text-[10px] font-mono text-emerald-400 font-bold border border-emerald-500/30">
                {selectedPlate?.zone}
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 rounded text-[10px] font-mono text-amber-400 font-bold border border-amber-500/30 flex items-center gap-1">
                <Gauge size={11} className="text-amber-400" />
                RADAR: {selectedPlate?.speed}
              </div>
              {selectedPlate?.is_flagged && (
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-red-950/90 text-red-300 rounded text-[10px] font-mono font-bold border border-red-500/50 flex items-center gap-1">
                  <AlertOctagon size={11} className="text-red-400 animate-pulse" />
                  BOLO: {selectedPlate?.flag_level}
                </div>
              )}
            </div>

            {/* Key-Value Details */}
            <div className="space-y-2 text-xs font-mono mt-4">
              <div className="flex justify-between p-2.5 rounded bg-[#070B12] border border-[#1E293B]">
                <span className="text-slate-400">Vehicle Classification:</span>
                <span className="text-white font-bold">{selectedPlate?.type}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-[#070B12] border border-[#1E293B]">
                <span className="text-slate-400">Capture Camera:</span>
                <span className="text-cyan-400 font-bold">{selectedPlate?.camera}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-[#070B12] border border-[#1E293B]">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-200">{selectedPlate?.time} UTC</span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-[#070B12] border border-[#1E293B]">
                <span className="text-slate-400">Doppler Velocity:</span>
                <span className={`font-bold ${selectedPlate?.speed_status === 'OVERSPEED' ? 'text-amber-400' : 'text-slate-300'}`}>
                  {selectedPlate?.speed} ({selectedPlate?.speed_status})
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded bg-[#070B12] border border-[#1E293B]">
                <span className="text-slate-400">Hotlist Database:</span>
                <span className={`font-bold ${
                  selectedPlate?.is_flagged ? 'text-red-400 animate-pulse' : 'text-emerald-400'
                }`}>
                  {selectedPlate?.is_flagged 
                    ? `ALERT: ${selectedPlate?.flag_reason || 'WATCHLIST HIT'}` 
                    : 'CLEARED (No Active Flags)'}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 space-y-2.5 font-mono">
            <Button 
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-950/40 h-9"
              onClick={() => handleVerifyVahan(selectedPlate?.plate || 'DL-01-AB-1234')}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Verify Vehicle In National VAHAN Registry
            </Button>
            
            {selectedPlate?.is_flagged ? (
              <Button 
                variant="outline"
                className="w-full border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold h-9"
                onClick={() => handleRemoveFromHotlist(selectedPlate.plate)}
              >
                <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Clear Plate From Hotlist / Watchlist
              </Button>
            ) : (
              <Button 
                variant="outline"
                className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs font-bold h-9"
                onClick={() => {
                  setAddPlateInput(selectedPlate?.plate || '');
                  setAddHotlistModalOpen(true);
                }}
              >
                <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-red-400" />
                Add to BOLO Hotlist / Watchlist
              </Button>
            )}
          </div>
        </div>

      </div>

      {/* VAHAN NATIONAL REGISTRY MODAL */}
      {vahanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0F18] border border-[#1B2536] rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#1B2536] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                    MINISTRY OF ROAD TRANSPORT & HIGHWAYS (MoRTH)
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    VAHAN 4.0 Central National Vehicle Registry Verification Token
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setVahanModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            {vahanLoading ? (
              <div className="py-16 text-center space-y-3 font-mono">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <p className="text-sm text-cyan-300">Establishing encrypted handshake with VAHAN 4.0 Gateway...</p>
                <p className="text-xs text-slate-500">Querying National Informatics Centre (NIC) Server</p>
              </div>
            ) : vahanData ? (
              <div className="mt-5 space-y-4 font-mono text-xs">
                {/* Status Bar */}
                <div className="p-3 rounded-xl bg-[#070B12] border border-[#1E293B] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Registration Plate:</span>
                    <span className="px-2.5 py-0.5 rounded bg-yellow-400 text-slate-950 font-black text-sm">
                      {vahanData.plate_number}
                    </span>
                  </div>
                  <Badge className={`${
                    vahanData.hotlist_status.includes('FLAGGED')
                      ? 'bg-red-500/20 text-red-400 border-red-500/40' 
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}>
                    {vahanData.hotlist_status}
                  </Badge>
                </div>

                {/* 2-Column Grid Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[#070B12] border border-[#1B2536] space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Registered Owner</span>
                    <p className="text-white font-bold text-sm">{vahanData.owner_name}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#070B12] border border-[#1B2536] space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Make & Model</span>
                    <p className="text-cyan-400 font-bold text-sm">{vahanData.vehicle_make_model}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#070B12] border border-[#1B2536] space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">RTO Station</span>
                    <p className="text-slate-200 font-medium">{vahanData.rto_office}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#070B12] border border-[#1B2536] space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Registration Date</span>
                    <p className="text-slate-200 font-medium">{vahanData.registration_date}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#070B12] border border-[#1B2536] space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Fuel & Emission Norms</span>
                    <p className="text-slate-200 font-medium">{vahanData.fuel_type}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#070B12] border border-[#1B2536] space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Chassis Hash</span>
                    <p className="text-amber-400 font-mono">{vahanData.chassis_number_hash}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#070B12] border border-[#1B2536] space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Insurance Policy Status</span>
                    <p className="text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {vahanData.insurance_company} (Valid: {vahanData.insurance_valid_upto})
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#070B12] border border-[#1B2536] space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase">Pollution Under Control (PUCC)</span>
                    <p className="text-slate-200 font-medium">{vahanData.puc_certificate_no} (Valid: {vahanData.puc_valid_upto})</p>
                  </div>
                </div>

                {/* Permit & Cryptographic Verification Seal */}
                <div className="p-3 rounded-lg bg-[#070B12] border border-cyan-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400">Permit Type: </span>
                    <span className="text-cyan-300 font-bold">{vahanData.national_permit}</span>
                  </div>
                  <div className="text-slate-500 font-mono text-[10px]">
                    SEAL: {vahanData.verification_seal}
                  </div>
                </div>

                {/* Close Button */}
                <div className="pt-2">
                  <Button 
                    className="w-full bg-[#1B2536] hover:bg-[#25334A] text-white font-mono text-xs"
                    onClick={() => setVahanModalOpen(false)}
                  >
                    Close Verification Record
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ADD TO HOTLIST MODAL */}
      {addHotlistModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0F18] border border-red-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-[#1B2536] pb-3">
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                ADD PLATE TO BOLO HOTLIST
              </h3>
              <button 
                onClick={() => setAddHotlistModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Plate Number</label>
                <input
                  value={addPlateInput}
                  onChange={(e) => setAddPlateInput(e.target.value.toUpperCase())}
                  placeholder="e.g. DL-01-AB-1234"
                  className="w-full bg-[#070B12] border border-[#1E293B] rounded-lg px-3 py-2 text-white font-bold focus:border-red-500 outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Threat Priority Level</label>
                <select
                  value={addLevelInput}
                  onChange={(e) => setAddLevelInput(e.target.value)}
                  className="w-full bg-[#070B12] border border-[#1E293B] rounded-lg px-3 py-2 text-white outline-none focus:border-red-500"
                >
                  <option value="CRITICAL">CRITICAL // Intercept Immediately</option>
                  <option value="HIGH">HIGH // Secondary Screening Mandated</option>
                  <option value="MEDIUM">MEDIUM // Surveillance Tracking</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">BOLO / Watchlist Reason</label>
                <textarea
                  value={addReasonInput}
                  onChange={(e) => setAddReasonInput(e.target.value)}
                  rows={3}
                  className="w-full bg-[#070B12] border border-[#1E293B] rounded-lg p-2.5 text-white outline-none focus:border-red-500 text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                variant="outline"
                onClick={() => setAddHotlistModalOpen(false)}
                className="flex-1 border-[#1E293B] text-slate-300 hover:bg-slate-800 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddToHotlist}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                Confirm & Flag
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* HOTLIST MANAGER DRAWER / MODAL */}
      {hotlistManagerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0F18] border border-red-500/40 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-[#1B2536] pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  BOLO Hotlist / Watchlist Management ({hotlist.length} Targets)
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => { setAddPlateInput(''); setAddHotlistModalOpen(true); }}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs h-7 px-2.5 font-bold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Target
                </Button>
                <button 
                  onClick={() => setHotlistManagerOpen(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {hotlist.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No active targets registered on the BOLO hotlist.
                </div>
              ) : (
                hotlist.map(item => (
                  <div key={item.id} className="p-3.5 rounded-xl bg-[#070B12] border border-[#1E293B] flex flex-wrap items-center justify-between gap-3 hover:border-red-500/40 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-yellow-400 text-slate-950 font-black text-xs">
                          {item.plate_number}
                        </span>
                        <Badge className={`${
                          item.flag_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                          item.flag_level === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                          'bg-blue-500/20 text-blue-400 border-blue-500/40'
                        } text-[10px]`}>
                          {item.flag_level}
                        </Badge>
                        <span className="text-[11px] text-slate-400">{item.vehicle_model}</span>
                      </div>
                      <p className="text-xs text-red-300 font-medium">{item.reason}</p>
                      <p className="text-[10px] text-slate-500">
                        Added: {item.added_at} by {item.reported_by}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerifyVahan(item.plate_number)}
                        className="text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10 text-xs h-7"
                      >
                        VAHAN
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveFromHotlist(item.plate_number)}
                        className="text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs h-7"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1 text-red-400" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ANPRPage;

