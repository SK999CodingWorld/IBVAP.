import React, { useRef, useState, useEffect } from 'react';
import { useVideoStore } from '@/stores/videoStore';
import { 
  Maximize2, Camera, Video, AlertCircle, Play, Pause, 
  Volume2, VolumeX, Shield, AlertTriangle, Upload, Eye, CheckCircle
} from 'lucide-react';

interface CameraData {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'degraded';
  fps: number;
  aiStatus: boolean;
  detections: number;
  alertLevel?: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

interface CameraCardProps {
  camera: CameraData;
  size?: 'sm' | 'md' | 'lg';
  showOverlays?: boolean;
  onClick?: () => void;
  onFullscreen?: () => void;
}

const FEED_IMAGES: Record<string, string> = {
  'BOP-01': '/feed-bop01.jpg',
  'BOP-02': '/feed-bop02.jpg',
  'BOP-03': '/feed-bop03.jpg',
  'CHECK-01': '/feed-check01.jpg',
  'ROAD-01': '/feed-road01.jpg',
  'ROAD-02': '/feed-road02.jpg',
  'GATE-01': '/feed-gate01.jpg',
  'WATCH-01': '/feed-watch01.jpg',
};

// Utility to generate SHA256 string for evidence
async function computeSha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str + Date.now().toString());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const CameraCard: React.FC<CameraCardProps> = ({ 
  camera, 
  showOverlays = true, 
  onClick
}) => {
  const { 
    cameraConfigs, 
    openVideoModal, 
    openInspection, 
    togglePlay, 
    toggleMute, 
    addEvidence 
  } = useVideoStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [snapshotSuccess, setSnapshotSuccess] = useState(false);
  const [alertTriggered, setAlertTriggered] = useState(false);
  const [activeBoxes, setActiveBoxes] = useState<any[]>([]);

  const config = cameraConfigs[camera.id];

  useEffect(() => {
    if (config?.detections) {
      setActiveBoxes(config.detections);
    }
  }, [config?.detections]);

  // Subtle target movement simulation over time
  useEffect(() => {
    if (!config?.isPlaying || camera.status === 'offline') return;
    const interval = setInterval(() => {
      setActiveBoxes(prev => prev.map(box => ({
        ...box,
        x: Math.max(10, Math.min(80, box.x + (Math.random() * 2 - 1))),
        y: Math.max(15, Math.min(75, box.y + (Math.random() * 1.5 - 0.75))),
      })));
    }, 1000);
    return () => clearInterval(interval);
  }, [config?.isPlaying, camera.status]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'online': return 'bg-emerald-500';
      case 'offline': return 'bg-red-500';
      case 'degraded': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  const getAlertRing = (level?: string) => {
    if (alertTriggered) return 'ring-2 ring-red-500 ring-offset-2 ring-offset-slate-950 animate-pulse';
    switch(level) {
      case 'critical': return 'border-red-500/60';
      case 'high': return 'border-orange-500/60';
      case 'medium': return 'border-yellow-500/60';
      default: return 'border-[#1B2536] hover:border-cyan-500/50';
    }
  };

  const handleCaptureSnapshot = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    let dataUrl = '';
    
    if (video) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        }
      } catch {
        dataUrl = 'placeholder';
      }
    }

    const evdId = `EVD-${Math.floor(1000 + Math.random() * 9000)}`;
    const hash = await computeSha256(evdId + camera.id);

    addEvidence({
      id: evdId,
      type: 'Snapshot',
      camera: camera.id,
      incident: alertTriggered ? 'INC-089' : null,
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      hash,
      status: 'VERIFIED',
      imageUrl: dataUrl || FEED_IMAGES[camera.id] || '/feed-bop01.jpg'
    });

    setSnapshotSuccess(true);
    setTimeout(() => setSnapshotSuccess(false), 2500);
  };

  const handleTriggerAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAlertTriggered(true);
    setTimeout(() => setAlertTriggered(false), 4000);
  };

  const isMjpegStream = 
    config?.sourceType === 'webcam' || 
    Boolean(config?.sourceUrl?.includes('/video_feed')) || 
    Boolean(config?.sourceUrl?.includes('/stream')) || 
    Boolean(config?.sourceUrl?.endsWith('.mjpg')) || 
    Boolean(config?.sourceUrl?.endsWith('.mjpeg'));

  return (
    <div 
      className={`relative bg-[#0A0F18] border rounded-xl overflow-hidden flex flex-col group transition-all shadow-xl cursor-pointer ${getAlertRing(camera.alertLevel)}`}
      onClick={onClick}
    >
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 p-2.5 bg-gradient-to-b from-black/90 via-black/60 to-transparent z-20 flex justify-between items-center text-xs">
        <div className="flex items-center space-x-2">
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(camera.status)} animate-pulse shadow-sm`} />
          <span className="text-white font-mono font-bold text-xs">{camera.id}</span>
          <span className="text-slate-400 text-[11px] truncate max-w-[120px]">{camera.name}</span>
          {camera.status === 'online' && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-red-500 bg-black/60 px-1.5 py-0.5 rounded border border-red-500/30">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
              <span>REC</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1.5 font-mono">
          {camera.aiStatus && (
            <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-[10px] font-bold border border-cyan-500/30 flex items-center gap-1">
              <Eye size={10} /> AI ON
            </span>
          )}
          <span className="px-1.5 py-0.5 bg-black/70 text-slate-200 rounded text-[10px] border border-slate-700/50">
            {camera.status === 'online' ? `${camera.fps} FPS` : '0 FPS'}
          </span>
        </div>
      </div>

      {/* Video Display Area */}
      <div className="flex-grow bg-[#060A10] relative min-h-[190px] aspect-video flex items-center justify-center overflow-hidden">
        
        {/* Support MJPEG live streams, MP4 video elements, and CCTV feeds */}
        {camera.status === 'offline' ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#070B12] text-slate-500 font-mono text-xs space-y-2 select-none">
            <span className="w-3 h-3 rounded-full bg-red-500/50 animate-ping" />
            <span className="text-red-400 font-bold uppercase tracking-wider">CAMERA OFFLINE</span>
            <span className="text-[10px] text-slate-500">STANDBY RECOVERY MODE</span>
          </div>
        ) : config?.sourceUrl && isMjpegStream ? (
          <img
            src={config.sourceUrl}
            alt={camera.name}
            className="w-full h-full object-cover select-none"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FEED_IMAGES[camera.id] || '/feed-bop01.jpg';
            }}
          />
        ) : config?.sourceUrl ? (
          <video
            ref={videoRef}
            src={config.sourceUrl}
            autoPlay={config.isPlaying}
            loop
            muted={config.isMuted}
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={FEED_IMAGES[camera.id] || '/feed-bop01.jpg'}
            alt={camera.name}
            className="w-full h-full object-cover select-none group-hover:scale-105 transition-transform duration-500"
          />
        )}

        {/* Scanline Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.015] to-transparent pointer-events-none" />

        {/* Timestamp */}
        <div className="absolute bottom-2.5 right-2.5 text-slate-300 font-mono text-[10px] bg-black/80 px-2 py-0.5 rounded border border-slate-800 z-10 shadow">
          {camera.timestamp || '07:12:17 UTC'}
        </div>

        {/* Military Corner Reticles */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-500/50 pointer-events-none z-10" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-500/50 pointer-events-none z-10" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-500/50 pointer-events-none z-10" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-500/50 pointer-events-none z-10" />

        {/* Dynamic Virtual Fence Polygon Overlay (when custom video stream is playing) */}
        {config?.sourceUrl && config?.showZoneOverlays && camera.status === 'online' && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-70">
            <polygon 
              points="10,120 180,40 320,110 320,180 10,180" 
              className="fill-red-500/15 stroke-red-500 stroke-1 stroke-dasharray-2"
            />
          </svg>
        )}

        {/* Dynamic AI Detection Bounding Boxes (when custom video stream is playing) */}
        {config?.sourceUrl && showOverlays && config?.showAiOverlays && camera.status === 'online' && activeBoxes.map((bbox, i) => (
          <div 
            key={bbox.id || i}
            className="absolute border-2 border-cyan-400 bg-cyan-400/15 shadow-sm transition-all duration-700 pointer-events-none z-10"
            style={{
              left: `${bbox.x}%`,
              top: `${bbox.y}%`,
              width: `${bbox.width}%`,
              height: `${bbox.height}%`
            }}
          >
            <span className="absolute -top-4 left-[-2px] bg-cyan-500 text-black text-[9px] px-1 font-mono font-bold whitespace-nowrap rounded-t">
              {bbox.trackingId || bbox.label || 'TARGET'} ({bbox.confidence || 95}%)
            </span>
          </div>
        ))}

        {/* Snapshot Success Notification Banner */}
        {snapshotSuccess && (
          <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-sm z-30 flex items-center justify-center flex-col text-emerald-400 gap-1.5 animate-in fade-in duration-200">
            <CheckCircle size={28} />
            <span className="text-xs font-bold font-mono">SNAPSHOT SAVED (SHA-256)</span>
            <span className="text-[10px] text-emerald-300">Added to Evidence Vault</span>
          </div>
        )}

        {/* Hover Action Bar */}
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 z-20">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-300 font-mono bg-black/80 px-2 py-1 rounded border border-slate-700/60">
              Source: {config?.sourceType?.toUpperCase() || 'LIVE CCTV'}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); openVideoModal(camera.id); }}
              className="p-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-xs font-semibold flex items-center gap-1 shadow transition-colors"
              title="Upload custom video or select preset"
            >
              <Upload size={13} /> Change Feed
            </button>
          </div>

          {/* Center Play / Pause and Tools */}
          <div className="flex items-center justify-center gap-2">
            <button 
              className="p-2.5 bg-slate-800/90 hover:bg-slate-700 rounded-full text-white transition-all shadow hover:scale-105"
              onClick={(e) => { e.stopPropagation(); togglePlay(camera.id); }}
              title={config?.isPlaying ? "Pause Stream" : "Play Stream"}
            >
              {config?.isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            <button 
              className="p-2.5 bg-emerald-700/90 hover:bg-emerald-600 rounded-full text-white transition-all shadow hover:scale-105"
              onClick={handleCaptureSnapshot}
              title="Capture Evidence Snapshot"
            >
              <Camera size={16} />
            </button>

            <button 
              className="p-2.5 bg-red-700/90 hover:bg-red-600 rounded-full text-white transition-all shadow hover:scale-105"
              onClick={handleTriggerAlert}
              title="Trigger Simulated Threat Alert"
            >
              <AlertTriangle size={16} />
            </button>

            <button 
              className="p-2.5 bg-cyan-700/90 hover:bg-cyan-600 rounded-full text-white transition-all shadow hover:scale-105"
              onClick={(e) => { e.stopPropagation(); openInspection(camera.id); }}
              title="Tactical Fullscreen Inspection"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {/* Bottom Mute & Info */}
          <div className="flex justify-between items-center text-[10px] text-slate-300">
            <button 
              onClick={(e) => { e.stopPropagation(); toggleMute(camera.id); }}
              className="flex items-center gap-1 hover:text-white bg-black/60 px-2 py-1 rounded"
            >
              {config?.isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
              <span>{config?.isMuted ? "MUTED" : "AUDIO"}</span>
            </button>
            <span className="font-mono text-cyan-400 font-bold">CLICK TO INSPECT</span>
          </div>
        </div>

      </div>

      {/* Bottom Footer Bar */}
      <div className="p-3 bg-[#0A0F18] border-t border-[#1B2536] flex justify-between items-center text-xs">
        <div>
          <div className="text-white font-semibold truncate max-w-[140px] tracking-tight">{camera.name}</div>
          <div className="text-slate-400 text-[10px] font-mono truncate max-w-[140px]">{camera.location}</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-1.5 text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 text-[10px] font-mono font-bold">
            <AlertCircle size={11} className="text-cyan-400" />
            <span>{camera.id === 'BOP-01' ? '2 TRACKS' : '1 TRACKS'}</span>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); openVideoModal(camera.id); }}
            className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-800 transition-colors"
            title="Change Video Feed"
          >
            <Upload size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
