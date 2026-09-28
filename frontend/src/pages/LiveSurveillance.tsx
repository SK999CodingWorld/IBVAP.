import React, { useState, useEffect } from 'react';
import { 
  Grid, LayoutGrid, Monitor, Maximize, Filter, Plus, 
  Video, Eye, Shield, Camera, RefreshCw, Layers
} from 'lucide-react';
import { CameraCard } from '@/components/surveillance/CameraCard';
import { VideoSourceModal } from '@/components/surveillance/VideoSourceModal';
import { VideoInspectionModal } from '@/components/surveillance/VideoInspectionModal';
import { useVideoStore } from '@/stores/videoStore';
import { Button } from '@/components/ui/Button';

const DEMO_CAMERAS = [
  { id: 'BOP-01', name: 'Border Outpost 1 PTZ', location: 'Sector 4 Red Zone', status: 'online', fps: 30, aiStatus: true, detections: 2, alertLevel: 'critical', zone: 'red' },
  { id: 'BOP-02', name: 'Border Outpost 2 Thermal', location: 'Sector 4 Buffer Zone', status: 'online', fps: 30, aiStatus: true, detections: 1, alertLevel: 'high', zone: 'red' },
  { id: 'BOP-03', name: 'Border Outpost 3 Fixed', location: 'Perimeter West', status: 'online', fps: 28, aiStatus: true, detections: 1, alertLevel: 'low', zone: 'red' },
  { id: 'CHECK-01', name: 'Highway Check Alpha', location: 'Highway 1 Access', status: 'online', fps: 30, aiStatus: true, detections: 1, alertLevel: 'medium', zone: 'yellow' },
  { id: 'ROAD-01', name: 'Approach Road Aerial', location: 'Sector 2 Corridor', status: 'online', fps: 30, aiStatus: true, detections: 1, zone: 'yellow' },
  { id: 'ROAD-02', name: 'Approach Road South', location: 'Sector 2 Perimeter', status: 'degraded', fps: 25, aiStatus: true, detections: 1, zone: 'yellow' },
  { id: 'GATE-01', name: 'HQ Base Camp Entry', location: 'Main Headquarters', status: 'online', fps: 30, aiStatus: true, detections: 0, zone: 'green' },
  { id: 'WATCH-01', name: 'Watchtower East FOV', location: 'Sector 5 Outpost', status: 'online', fps: 25, aiStatus: true, detections: 0, zone: 'red' },
] as any[];

export const LiveSurveillance: React.FC = () => {
  const [gridSize, setGridSize] = useState<1 | 4 | 9 | 16>(4);
  const [filterZone, setFilterZone] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(new Date().toISOString());
  const [globalAi, setGlobalAi] = useState(true);
  const [globalZones, setGlobalZones] = useState(true);

  const { openVideoModal, openInspection, toggleAiOverlays, toggleZoneOverlays, cameraConfigs } = useVideoStore();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toISOString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGridClass = () => {
    switch(gridSize) {
      case 1: return 'grid-cols-1 max-w-5xl mx-auto';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
      case 9: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 16: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      default: return 'grid-cols-2';
    }
  };

  const filteredCameras = DEMO_CAMERAS.filter(c => {
    if (filterZone === 'all') return true;
    return c.zone === filterZone;
  });

  const handleToggleGlobalAi = () => {
    const next = !globalAi;
    setGlobalAi(next);
    DEMO_CAMERAS.forEach(c => {
      if (cameraConfigs[c.id]?.showAiOverlays !== next) {
        toggleAiOverlays(c.id);
      }
    });
  };

  const handleToggleGlobalZones = () => {
    const next = !globalZones;
    setGlobalZones(next);
    DEMO_CAMERAS.forEach(c => {
      if (cameraConfigs[c.id]?.showZoneOverlays !== next) {
        toggleZoneOverlays(c.id);
      }
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#070B12] text-slate-300 overflow-y-auto p-4 md:p-5 space-y-4 custom-scrollbar">
      
      {/* ── TOP ACTION TOOLBAR (WITH SOLDIER / WATCHTOWER SILHOUETTE) ── */}
      <div 
        className="p-4 bg-[#0A0F18] border border-[#1B2536] rounded-xl flex flex-wrap gap-4 justify-between items-center relative overflow-hidden shadow-xl"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(10, 15, 24, 0.98) 50%, rgba(10, 15, 24, 0.45) 80%, rgba(10, 15, 24, 0.2) 100%), url('/surveillance-header-bg.jpg')`,
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain'
        }}
      >
        <div className="flex items-center space-x-3 z-10">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-950/40">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-mono">
              Live Surveillance Wall
              <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold rounded border border-emerald-500/30">
                8 CHANNELS LIVE
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              Interactive multi-stream CCTV grid with active AI bounding boxes, ANPR, and custom video inputs.
            </p>
          </div>
        </div>
        
        {/* Controls & Toolbar Actions */}
        <div className="flex items-center flex-wrap gap-3 z-10 font-mono text-xs">
          
          {/* Add / Upload Video Feed */}
          <Button
            size="sm"
            onClick={() => openVideoModal('BOP-01')}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-950/40 border border-cyan-400/30 transition-colors h-8 px-3 rounded-lg"
          >
            <Video size={14} /> Add / Upload Video Feed
          </Button>

          {/* AI HUD Toggle */}
          <button
            onClick={handleToggleGlobalAi}
            className={`h-8 px-3 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all border ${
              globalAi 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold shadow-sm' 
                : 'bg-[#070B12] text-slate-400 border-[#1E293B] hover:text-white'
            }`}
            title="Toggle AI Bounding Box Overlays"
          >
            <Eye size={13} /> AI HUD
          </button>

          {/* Fences Toggle (Solid Red Button Match) */}
          <button
            onClick={handleToggleGlobalZones}
            className={`h-8 px-3 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-lg ${
              globalZones 
                ? 'bg-red-600 hover:bg-red-500 text-white border border-red-400/40 shadow-red-950/50' 
                : 'bg-[#070B12] text-slate-400 border-[#1E293B] hover:text-white'
            }`}
            title="Toggle Virtual Perimeter Fences"
          >
            <Shield size={13} /> Fences
          </button>

          {/* Grid Layout Switcher */}
          <div className="flex items-center space-x-1 bg-[#070B12] rounded-lg p-1 border border-[#1E293B] h-8">
            <button 
              onClick={() => setGridSize(1)} 
              className={`p-1 rounded transition-colors ${gridSize === 1 ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="1-Camera Focus"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setGridSize(4)} 
              className={`p-1 rounded transition-colors ${gridSize === 4 ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="2x2 Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setGridSize(9)} 
              className={`p-1 rounded transition-colors ${gridSize === 9 ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="3x3 Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Sector Zone Filter */}
          <div className="flex items-center space-x-2 bg-[#070B12] rounded-lg px-2.5 h-8 border border-[#1E293B] text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select 
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer font-mono"
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
            >
              <option value="all" className="bg-[#0A0F18]">All Sectors</option>
              <option value="red" className="bg-[#0A0F18]">Red Zone (Restricted)</option>
              <option value="yellow" className="bg-[#0A0F18]">Yellow Zone (Highway)</option>
              <option value="green" className="bg-[#0A0F18]">Green Zone (Base HQ)</option>
            </select>
          </div>

        </div>
      </div>

      {/* ── CAMERA VIDEO GRID ── */}
      <div className="flex-grow">
        <div className={`grid gap-4 ${getGridClass()}`}>
          {filteredCameras.slice(0, gridSize).map((cam) => (
            <CameraCard 
              key={cam.id}
              camera={{
                ...cam, 
                timestamp: currentTime.split('T')[1].split('.')[0] + ' UTC'
              }}
              onClick={() => openInspection(cam.id)}
            />
          ))}
        </div>
      </div>

      {/* Global Modals */}
      <VideoSourceModal />
      <VideoInspectionModal />

    </div>
  );
};

export default LiveSurveillance;
