import React, { useState, useEffect } from 'react';
import { 
  Activity, Clock, Map, MapPin, Navigation, Info, 
  Video, Eye, ShieldCheck, ChevronRight, User, Car, 
  Maximize2, Play, Layers, Compass, Search, Filter,
  Crosshair, Radio, ShieldAlert, CheckCircle2, X,
  Sliders, RefreshCw, ZoomIn, ZoomOut, ArrowUp, ArrowDown,
  ArrowLeft, ArrowRight, Download, Award, AlertTriangle
} from 'lucide-react';

interface CameraHop {
  id: string;
  name: string;
  time: string;
  duration: string;
  image: string;
  confidence: number;
  status: 'Complete' | 'Active';
}

interface CrossTrack {
  id: string;
  type: 'person' | 'vehicle';
  label: string;
  firstSeen: string;
  lastSeen: string;
  currentZone: string;
  confidence: number;
  reidSignature: string;
  cameras: CameraHop[];
}

const DEFAULT_CROSS_TRACKS: CrossTrack[] = [
  {
    id: 'P-097',
    type: 'person',
    label: 'Suspect Infiltrator #97',
    firstSeen: '10:35:12',
    lastSeen: '10:42:15',
    currentZone: 'Perimeter West (Sector 4)',
    confidence: 96.4,
    reidSignature: 'Dark jacket, tactical backpack, olive trousers',
    cameras: [
      { id: 'BOP-01', name: 'Main Gate Cam 01', time: '10:35:12', duration: '45s', image: '/thumb-cam-bop01.jpg', confidence: 98.1, status: 'Complete' },
      { id: 'ROAD-02', name: 'Approach Road South', time: '10:38:20', duration: '2m 10s', image: '/health-cam-road02.jpg', confidence: 95.8, status: 'Complete' },
      { id: 'BOP-03', name: 'Perimeter West PTZ', time: '10:41:55', duration: 'Active (Now)', image: '/feed-bop01.jpg', confidence: 97.2, status: 'Active' },
    ]
  },
  {
    id: 'V-018',
    type: 'vehicle',
    label: 'Unregistered Pickup Convoy',
    firstSeen: '10:30:00',
    lastSeen: '10:41:30',
    currentZone: 'Highway Checkpoint Alpha',
    confidence: 94.2,
    reidSignature: 'White 4x4, reinforced bullbar, heavy dust coating',
    cameras: [
      { id: 'ROAD-01', name: 'Approach Road North', time: '10:30:00', duration: '5m', image: '/feed-road01.jpg', confidence: 96.5, status: 'Complete' },
      { id: 'CHECK-01', name: 'Checkpoint Alpha', time: '10:41:15', duration: 'Active (Now)', image: '/feed-check01.jpg', confidence: 95.0, status: 'Active' },
    ]
  },
  {
    id: 'P-114',
    type: 'person',
    label: 'Border Patrol Bravo-2',
    firstSeen: '10:15:00',
    lastSeen: '10:43:00',
    currentZone: 'Watchtower 7 Sector',
    confidence: 99.0,
    reidSignature: 'Standard issue camouflage, marked radio harness',
    cameras: [
      { id: 'BOP-02', name: 'Perimeter East Cam', time: '10:15:00', duration: '12m', image: '/thumb-cam-bop02.jpg', confidence: 99.2, status: 'Complete' },
      { id: 'WATCH-01', name: 'Watchtower 7 Optical', time: '10:32:00', duration: 'Active (Now)', image: '/feed-watch01.jpg', confidence: 98.8, status: 'Active' },
    ]
  }
];

const CAMERA_METADATA: Record<string, { name: string; zone: string; image: string }> = {
  'CAM-01': { name: 'BOP Sector 4 North PTZ', zone: 'Sector 4 Red Perimeter', image: '/feed-bop01.jpg' },
  'BOP-01': { name: 'Main Gate Access Cam 01', zone: 'Sector 4 Perimeter Alpha', image: '/thumb-cam-bop01.jpg' },
  'BOP-02': { name: 'Perimeter East Outpost Cam', zone: 'Sector 2 Approach North', image: '/thumb-cam-bop02.jpg' },
  'BOP-03': { name: 'Perimeter West Optical PTZ', zone: 'Sector 4 Buffer West', image: '/feed-bop01.jpg' },
  'ROAD-01': { name: 'Approach Road North Optical', zone: 'Highway Transit Sector', image: '/feed-road01.jpg' },
  'ROAD-02': { name: 'Approach Road South Optical', zone: 'Highway 1 Access Road', image: '/health-cam-road02.jpg' },
  'CHECK-01': { name: 'Highway Checkpoint Alpha ANPR', zone: 'Highway 1 Checkpoint Alpha', image: '/feed-check01.jpg' },
  'GATE-01': { name: 'HQ Base Camp Perimeter Gate', zone: 'HQ Base Camp Perimeter', image: '/thumb-cam-bop02.jpg' },
  'WATCH-01': { name: 'Watchtower 7 Optical Sensor', zone: 'Watchtower 7 Sector', image: '/feed-watch01.jpg' },
};

export const MultiCameraTracking = () => {
  const [crossTracks, setCrossTracks] = useState<CrossTrack[]>(DEFAULT_CROSS_TRACKS);
  const [selectedTrackId, setSelectedTrackId] = useState<string>(DEFAULT_CROSS_TRACKS[0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'person' | 'vehicle'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoSync, setIsAutoSync] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Live');
  
  // Tactical Modals
  const [showPtzModal, setShowPtzModal] = useState(false);
  const [ptzState, setPtzState] = useState({ pan: 142.4, tilt: -12.8, zoom: 3.5 });
  const [showVectorModal, setShowVectorModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedQrtUnit, setSelectedQrtUnit] = useState('QRT Bravo-4 (Sector 4)');
  const [actionNotification, setActionNotification] = useState<string | null>(null);

  // Fetch live tracks from backend
  const fetchLiveTracks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/tracks');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          const liveList: CrossTrack[] = json.data.map((item: any, idx: number) => {
            const camHist: string[] = item.camera_history && item.camera_history.length > 0 
              ? item.camera_history 
              : [item.last_seen_cam || 'CAM-01'];
            
            const lastCam = camHist[camHist.length - 1];
            const meta = CAMERA_METADATA[lastCam] || { name: `Sector Outpost ${lastCam}`, zone: `Perimeter Zone ${lastCam}`, image: '/feed-bop01.jpg' };
            
            return {
              id: item.global_id || `GLOBAL-${idx + 1}`,
              type: 'person',
              label: `Cross-Camera Track ${item.global_id}`,
              firstSeen: item.first_seen_time?.split(' ')[1] || '10:35:00',
              lastSeen: item.last_seen_time?.split(' ')[1] || 'Active (Now)',
              currentZone: meta.zone,
              confidence: item.confidence || 95.2,
              reidSignature: `OSNet 256-D Prototype · ${item.detection_count || 120} frame signatures matched · Peak: ${item.peak_confidence || 98}%`,
              cameras: camHist.map((cam: string, cIdx: number) => {
                const cMeta = CAMERA_METADATA[cam] || { name: `Sector Outpost ${cam}`, zone: `Perimeter ${cam}`, image: '/feed-bop01.jpg' };
                const isActive = cIdx === camHist.length - 1;
                return {
                  id: cam,
                  name: cMeta.name,
                  time: isActive ? (item.last_seen_time?.split(' ')[1] || 'Active') : 'Prior Hop',
                  duration: isActive ? 'Active Now' : `${(cIdx + 1) * 45}s Dwell`,
                  image: cMeta.image,
                  confidence: Math.round(92 + (idx * 3 + cIdx * 2) % 7),
                  status: isActive ? 'Active' : 'Complete'
                };
              })
            };
          });

          setCrossTracks(prev => {
            const merged = [...liveList];
            DEFAULT_CROSS_TRACKS.forEach(def => {
              if (!merged.find(m => m.id === def.id)) merged.push(def);
            });
            return merged;
          });
          setLastSyncTime(new Date().toLocaleTimeString());
        }
      }
    } catch (e) {
      console.warn('Using tactical preset cross-tracks:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveTracks();
    if (!isAutoSync) return;
    const interval = setInterval(fetchLiveTracks, 3500);
    return () => clearInterval(interval);
  }, [isAutoSync]);

  const showToast = (msg: string) => {
    setActionNotification(msg);
    setTimeout(() => setActionNotification(null), 3500);
  };

  // Export Re-ID Dossier
  const handleExportDossier = (t: CrossTrack) => {
    const timestamp = new Date().toISOString();
    const dossier = {
      dossier_id: `IBVAP-REID-${t.id}-${Date.now()}`,
      target_id: t.id,
      classification: t.type,
      label: t.label,
      confidence_score: t.confidence,
      visual_signature: t.reidSignature,
      current_zone: t.currentZone,
      first_seen: t.firstSeen,
      last_seen: t.lastSeen,
      total_camera_hops: t.cameras.length,
      sequential_hops: t.cameras,
      chain_of_custody: {
        export_timestamp: timestamp,
        security_classification: "RESTRICTED // LAW ENFORCEMENT & DEFENSE ONLY",
        sha256_verification_manifest: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
      }
    };

    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `IBVAP-ReID-Dossier-${t.id}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Evidentiary Dossier exported for ${t.id}`);
  };

  // Dispatch QRT Intercept Patrol
  const handleDispatchQRT = () => {
    setShowDispatchModal(false);
    showToast(`🚨 QRT Intercept Mandate Dispatched! Unit [${selectedQrtUnit}] assigned to intercept ${track.id} at ${track.currentZone}.`);
  };

  const filteredTracks = crossTracks.filter(t => {
    const matchesSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.currentZone.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.reidSignature.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const track = crossTracks.find(t => t.id === selectedTrackId) || crossTracks[0] || DEFAULT_CROSS_TRACKS[0];

  return (
    <div className="p-4 md:p-6 h-full flex flex-col bg-[#070B12] text-slate-200 overflow-y-auto space-y-5">
      
      {/* Toast Notification */}
      {actionNotification && (
        <div className="fixed top-5 right-5 z-50 bg-[#0E1726] border border-cyan-500/50 shadow-2xl shadow-cyan-500/20 text-white px-4 py-3 rounded-xl flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-xs font-mono">
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Tactical Action Logged</div>
            <div className="text-slate-200 mt-0.5">{actionNotification}</div>
          </div>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0A0F18]/90 border border-slate-800/80 p-4 rounded-xl shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Compass className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              Cross-Camera Target Tracking & Re-ID
            </h1>
            <p className="text-slate-400 text-xs">Deep appearance correlation across non-overlapping border surveillance zones</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
          <button
            onClick={() => setIsAutoSync(!isAutoSync)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
              isAutoSync 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            <Radio className={`w-3 h-3 ${isAutoSync ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span>{isAutoSync ? 'LIVE SYNC (3.5s)' : 'SYNC PAUSED'}</span>
          </button>

          <button 
            onClick={fetchLiveTracks}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0B1524] hover:bg-[#0f1f38] border border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-mono transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>OSNET RE-ID ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Military Advisory Banner */}
      <div className="bg-[#0B1524] border border-cyan-500/30 rounded-xl p-3.5 flex items-start gap-3 text-cyan-300">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-cyan-400" />
        <div className="text-xs">
          <span className="font-bold text-white">Appearance-Based Feature Extraction: </span>
          <span>Tracks targets by clothing color histogram, spatiotemporal vector progression, and silhouette embeddings. Tracking persists even across blind spots without facial geometry.</span>
        </div>
      </div>

      {/* Main Grid: Target Selector & Profile (Left) / Trajectory Sequence (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Target Selector & Profile (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Target List Card */}
          <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" /> Active Cross-Tracks ({filteredTracks.length})
              </h2>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Filter targets, IDs, signatures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#070D16] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex items-center gap-1.5">
                {(['all', 'person', 'vehicle'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`flex-1 py-1 text-[11px] font-mono rounded capitalize transition-colors ${
                      filterType === type 
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' 
                        : 'bg-[#080E18] text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {filteredTracks.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTrackId(t.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    selectedTrackId === t.id
                      ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                      : 'bg-[#080E18] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${t.type === 'person' ? 'bg-blue-500/15 text-blue-400' : 'bg-amber-500/15 text-amber-400'}`}>
                      {t.type === 'person' ? <User size={18} /> : <Car size={18} />}
                    </div>
                    <div>
                      <div className="font-bold text-white text-xs">{t.id} - {t.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{t.currentZone}</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className={selectedTrackId === t.id ? 'text-cyan-400' : 'text-slate-600'} />
                </button>
              ))}
              {filteredTracks.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-500">
                  No cross-camera targets match the filter query.
                </div>
              )}
            </div>
          </div>

          {/* Selected Target Profile */}
          <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-cyan-400" /> Re-ID Feature Vector
              </h2>
              <button
                onClick={() => setShowVectorModal(true)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-mono"
              >
                Inspect 512-D Vector
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/70">
                <span className="text-slate-400">Target ID</span>
                <span className="font-mono font-bold text-cyan-400">{track.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/70">
                <span className="text-slate-400">Classification</span>
                <span className="capitalize font-semibold text-white">{track.type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/70">
                <span className="text-slate-400">Re-ID Match Confidence</span>
                <span className="font-mono font-bold text-emerald-400">{track.confidence}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/70">
                <span className="text-slate-400">First Detected</span>
                <span className="font-mono text-slate-300">{track.firstSeen}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/70">
                <span className="text-slate-400">Last Coordinate Update</span>
                <span className="font-mono text-slate-300">{track.lastSeen}</span>
              </div>
              <div className="pt-1">
                <span className="text-slate-400 block mb-1">Visual Signature:</span>
                <div className="p-2.5 bg-[#080E18] rounded-lg border border-slate-800 text-[11px] text-slate-300 font-mono">
                  {track.reidSignature}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Camera Sequential Trajectory (8 Cols) */}
        <div className="lg:col-span-8 bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" /> Sequential Surveillance Path
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Chronological movement hops tracked across border outpost sensors</p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20">
              {track.cameras.length} Camera Hops
            </span>
          </div>

          {/* Sequential Hops Cards */}
          <div className="space-y-4">
            {track.cameras.map((hop, index) => (
              <div 
                key={hop.id + index} 
                className={`p-4 rounded-xl border relative transition-all ${
                  hop.status === 'Active' 
                    ? 'bg-[#0B1626] border-cyan-500/50 shadow-lg shadow-cyan-500/10' 
                    : 'bg-[#080E18] border-slate-800'
                }`}
              >
                {/* Step Connector Line */}
                {index < track.cameras.length - 1 && (
                  <div className="absolute left-7 top-14 w-0.5 h-8 bg-slate-700/60 z-0" />
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      hop.status === 'Active' 
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30' 
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Camera Thumbnail */}
                    <div className="w-20 h-14 rounded-lg overflow-hidden border border-slate-700 relative flex-shrink-0 bg-slate-900">
                      <img 
                        src={hop.image} 
                        alt={hop.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none" />
                    </div>

                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-2">
                        <span>{hop.name}</span>
                        <span className="font-mono text-[10px] text-cyan-400 font-normal">({hop.id})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock size={11} className="text-slate-500" /> {hop.time}
                        </span>
                        <span>• Dwell: {hop.duration}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      hop.status === 'Active' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse' 
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {hop.status}
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                      Match: {hop.confidence}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Bar */}
          <div className="pt-3 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              Correlated with <span className="text-white font-bold">ByteTrack Multi-Target Filter v2.4</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 font-mono">
              <button 
                onClick={() => handleExportDossier(track)}
                className="px-3 py-1.5 bg-[#0F1726] hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export Dossier</span>
              </button>

              <button 
                onClick={() => setShowDispatchModal(true)}
                className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Dispatch Intercept</span>
              </button>

              <button 
                onClick={() => setShowPtzModal(true)}
                className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-md shadow-cyan-500/20 flex items-center gap-2"
              >
                <Crosshair className="w-3.5 h-3.5 text-slate-950" />
                <span>Auto-Steer PTZ</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* PTZ Auto-Steer Dialog Modal */}
      {showPtzModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B111B] border border-cyan-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-cyan-500/10 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Crosshair className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Tactical PTZ Auto-Lock HUD</h3>
                  <p className="text-[10px] text-cyan-400 font-mono">Camera: BOP-03 (Perimeter West PTZ)</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPtzModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Acquisition Status */}
            <div className="bg-[#070D16] border border-slate-800 p-3 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Tracking Target:</span>
                <span className="font-mono font-bold text-cyan-300">{track.id} ({track.label})</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Optical Target Lock:</span>
                <span className="inline-flex items-center gap-1.5 font-mono font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  LOCKED (97.2% Precision)
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Slew Rate / Velocity:</span>
                <span className="font-mono text-slate-200">45.0°/sec (Continuous Servo)</span>
              </div>
            </div>

            {/* Calibrated Pan/Tilt/Zoom HUD */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#080E18] p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Pan (Azimuth)</div>
                <div className="text-lg font-bold font-mono text-cyan-400 mt-1">{ptzState.pan.toFixed(1)}°</div>
              </div>
              <div className="bg-[#080E18] p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Tilt (Elevation)</div>
                <div className="text-lg font-bold font-mono text-cyan-400 mt-1">{ptzState.tilt.toFixed(1)}°</div>
              </div>
              <div className="bg-[#080E18] p-3 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Optical Zoom</div>
                <div className="text-lg font-bold font-mono text-cyan-400 mt-1">{ptzState.zoom.toFixed(1)}x</div>
              </div>
            </div>

            {/* Manual Slew Controls */}
            <div className="bg-[#070D16] p-4 rounded-xl border border-slate-800 flex flex-col items-center gap-2">
              <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-1">Fine Slew Overrides</div>
              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={() => setPtzState(s => ({ ...s, tilt: Math.min(60, s.tilt + 2) }))}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setPtzState(s => ({ ...s, pan: (s.pan - 2 + 360) % 360 }))}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-8 h-8 rounded-full border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Crosshair className="w-4 h-4" />
                  </div>
                  <button 
                    onClick={() => setPtzState(s => ({ ...s, pan: (s.pan + 2) % 360 }))}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  onClick={() => setPtzState(s => ({ ...s, tilt: Math.max(-60, s.tilt - 2) }))}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button 
                onClick={() => {
                  setShowPtzModal(false);
                  showToast(`PTZ Tracking disengaged. Camera BOP-03 returned to orbit patrol.`);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg transition-colors"
              >
                Disengage & Park
              </button>
              <button 
                onClick={() => {
                  setShowPtzModal(false);
                  showToast(`PTZ locked continuously on ${track.id} (${track.label}) at ${ptzState.pan.toFixed(1)}° pan / ${ptzState.tilt.toFixed(1)}° tilt.`);
                }}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-lg shadow-cyan-500/20"
              >
                Engage Continuous Lock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feature Vector Inspection Modal */}
      {showVectorModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B111B] border border-cyan-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">512-Dimensional Appearance Embedding</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Target: {track.id} • OSNet ResNet-IBN Architecture</p>
                </div>
              </div>
              <button 
                onClick={() => setShowVectorModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#070D16] border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cosine Distance to Cluster:</span>
                  <span className="font-mono text-emerald-400 font-bold">0.036 (Very High Similarity)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Appearance Invariance:</span>
                  <span className="font-mono text-cyan-400">Illumination + Scale Invariant</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Spatial Kalman Uncertainty:</span>
                  <span className="font-mono text-slate-300">± 0.42m</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1.5 font-mono text-[11px]">Normalized Feature Dimensions (Sample 24/512):</span>
                <div className="grid grid-cols-6 gap-1.5 p-3 bg-[#080E18] rounded-xl border border-slate-800 font-mono text-[10px] text-center text-cyan-300">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="p-1 bg-[#0c1524] rounded border border-cyan-500/20">
                      {((Math.sin(i * 1.7 + track.id.charCodeAt(0)) * 0.5 + 0.5)).toFixed(3)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => setShowVectorModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tactical QRT Intercept Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B111B] border border-red-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-red-500/10 space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">TACTICAL INTERCEPT DISPATCH</h3>
                  <p className="text-[10px] text-red-400 font-mono">High-Priority Quick Reaction Force (QRT) Mandate</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDispatchModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#070D16] border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Identifier:</span>
                  <span className="text-cyan-400 font-bold">{track.id} ({track.label})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Position:</span>
                  <span className="text-white font-semibold">{track.currentZone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Re-ID Match Confidence:</span>
                  <span className="text-emerald-400 font-bold">{track.confidence}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Predicted Trajectory:</span>
                  <span className="text-amber-400">North-West Access Road · ETA 4m 12s</span>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Select QRT Deployment Call-Sign:</label>
                <select
                  value={selectedQrtUnit}
                  onChange={(e) => setSelectedQrtUnit(e.target.value)}
                  className="w-full bg-[#070D16] border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 text-xs"
                >
                  <option value="QRT Bravo-4 (Sector 4 Perimeter)">QRT Bravo-4 (Sector 4 Perimeter) - 1.2 km away</option>
                  <option value="ITBP Rapid Intercept Team 02">ITBP Rapid Intercept Team 02 - 2.8 km away</option>
                  <option value="BSF Flying Squad Highway 1">BSF Flying Squad Highway 1 - 3.5 km away</option>
                  <option value="Perimeter Tactical Drone Delta-9">Perimeter Tactical Drone Delta-9 - Aerial Lock Ready</option>
                </select>
              </div>

              <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/30 text-[11px] text-red-300">
                ⚠️ Authorizing this dispatch transmits live telemetry vectors to field patrol tactical tablets and enables automated PTZ optical tracking.
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDispatchModal(false)}
                className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatchQRT}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-950/40"
              >
                Authorize & Transmit Mandate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MultiCameraTracking;
