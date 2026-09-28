import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cpu, CheckCircle2, Shield, Eye, Activity, Layers, 
  Play, Info, Video, Check, Radio, X, Gauge, Zap, 
  BarChart2, Server, Terminal, ExternalLink, RefreshCw, 
  Volume2, Flame, Sliders, AlertTriangle, User, Car,
  Sparkles, ShieldAlert, Award, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ModelPipeline {
  id: string;
  name: string;
  role: string;
  version: string;
  status: string;
  previewImg: string;
  latency: string;
  fps: string;
  classesCount: string;
  description: string;
  actionLabel: string;
  actionType: 'test' | 'navigate';
  navRoute?: string;
  actionColor: 'emerald' | 'cyan' | 'purple' | 'amber';
  device?: string;
  vram?: string;
  inputShape?: string;
  p50?: string;
  p95?: string;
  p99?: string;
  supportedClasses?: string[];
}

interface CapabilityItem {
  model: string;
  capability: string;
  status: string;
  hardware: string;
  accuracy: string;
}

const AI_PIPELINES: ModelPipeline[] = [
  {
    id: 'model-yolo-detector',
    name: 'YOLOv8x-Border / RT-DETR',
    role: 'Primary Object Detection & Taxonomy',
    version: 'v2.4.1-edge',
    status: 'ACTIVE',
    previewImg: '/card-preview-1.png',
    latency: '18.4 ms',
    fps: '48.2 FPS',
    classesCount: '24 Active',
    description: 'Detects people, vehicles, animals, and general surveillance objects with bounding box confidence.',
    actionLabel: 'Test Inference',
    actionType: 'test',
    actionColor: 'emerald',
    device: 'CUDA 12.4 / TensorRT 10.2 (FP16)',
    vram: '2,140 MB VRAM',
    inputShape: '1 × 3 × 640 × 640 (FP16)',
    p50: '17.2 ms',
    p95: '19.8 ms',
    p99: '22.4 ms',
    supportedClasses: ['Person', 'Soldier', 'Civilian', 'Vehicle', 'Military Truck', 'SUV', 'Motorcycle', 'ATV', 'Animal', 'Canine', 'Backpack', 'Weapon Case', 'Drone']
  },
  {
    id: 'model-bytetrack',
    name: 'ByteTrack-Border Multi-Target Re-ID',
    role: 'Multi-Object Tracking & Motion Vectors',
    version: 'v3.1.0',
    status: 'ACTIVE',
    previewImg: '/card-preview-2.png',
    latency: '3.8 ms',
    fps: '120.0 FPS',
    classesCount: '18 Active',
    description: 'Maintains consistent tracking IDs (P-104, V-021), trajectory smoothing, and velocity estimation.',
    actionLabel: 'View Tracking',
    actionType: 'navigate',
    navRoute: '/tracking/cross-camera',
    actionColor: 'cyan',
    device: 'Vectorized AVX-512 + OSNet GPU',
    vram: '780 MB VRAM',
    inputShape: '1 × 3 × 128 × 256 (OSNet Deep Re-ID)',
    p50: '3.2 ms',
    p95: '4.1 ms',
    p99: '4.9 ms',
    supportedClasses: ['Person Track (P-104)', 'Vehicle Track (V-021)', 'Convoy Flow', 'Kalman Velocity', 'Trajectory Vectors']
  },
  {
    id: 'model-paddle-anpr',
    name: 'PaddleOCR-v4 + STN Rectification',
    role: '8-Stage ANPR License Plate Engine',
    version: 'v4.2',
    status: 'ACTIVE',
    previewImg: '/card-preview-3.png',
    latency: '12.6 ms',
    fps: '32.0 FPS',
    classesCount: '1 Active',
    description: 'High-angle perspective correction, contrast enhancement, and temporal consensus voting.',
    actionLabel: 'Test Plate OCR',
    actionType: 'test',
    actionColor: 'emerald',
    device: 'CUDA / TensorRT (FP16)',
    vram: '1,120 MB VRAM',
    inputShape: '1 × 3 × 48 × 320 (Dynamic STN)',
    p50: '11.8 ms',
    p95: '13.9 ms',
    p99: '15.2 ms',
    supportedClasses: ['Indian Standard High Security Registration Plate (HSRP)', 'State District Series', 'Embossed Alphanumeric']
  },
  {
    id: 'model-retinaface',
    name: 'RetinaFace Quality & Occlusion Engine',
    role: 'Face Detection (Audited Authorization)',
    version: 'v1.2',
    status: 'ACTIVE (Audited)',
    previewImg: '/card-preview-4.png',
    latency: '7.1 ms',
    fps: '85.0 FPS',
    classesCount: '6 Active',
    description: 'Detects facial presence and assesses image quality/occlusion without automatic identification.',
    actionLabel: 'Run Test',
    actionType: 'test',
    actionColor: 'purple',
    device: 'CUDA / Encrypted Biometric Sandbox',
    vram: '890 MB VRAM',
    inputShape: '1 × 3 × 640 × 640 (Feature Pyramid)',
    p50: '6.8 ms',
    p95: '7.9 ms',
    p99: '8.8 ms',
    supportedClasses: ['Frontal Face', 'Profile Angle', 'Occluded (Mask)', 'Occluded (Scarf)', 'Low Quality', 'Pitch/Yaw/Roll']
  },
  {
    id: 'model-spatiotemporal',
    name: 'Explainable Spatio-Temporal Risk Engine',
    role: 'Behavior, Loitering & Virtual Tripwires',
    version: 'v2.0',
    status: 'ACTIVE',
    previewImg: '/card-preview-5.png',
    latency: '22.3 ms',
    fps: '65.4 FPS',
    classesCount: '12 Active',
    description: 'Evaluates virtual fence breaches, 120s loitering thresholds, animal filters, and crowd density.',
    actionLabel: 'View Explainability',
    actionType: 'navigate',
    navRoute: '/virtual-fences',
    actionColor: 'amber',
    device: 'Real-time Symbolic Graph / Multiprocess',
    vram: '420 MB VRAM',
    inputShape: 'Dynamic Geospatial Graph Topology',
    p50: '20.5 ms',
    p95: '24.1 ms',
    p99: '26.5 ms',
    supportedClasses: ['Virtual Fence Breach', 'Tripwire Cross', 'Loitering Alert (>120s)', 'Direction Violation', 'Speed Anomaly']
  },
  {
    id: 'model-multimodal',
    name: 'Multimodal Threat Classification',
    role: 'Vision + Audio + Sensor Fusion',
    version: 'v1.8',
    status: 'ACTIVE',
    previewImg: '/card-preview-6.png',
    latency: '28.6 ms',
    fps: '40.0 FPS',
    classesCount: '8 Active',
    description: 'Combines visual, audio, and IoT sensor data for high-confidence threat classification.',
    actionLabel: 'Live Test',
    actionType: 'test',
    actionColor: 'cyan',
    device: 'CUDA / Cross-Attention Transformer Fusion',
    vram: '1,850 MB VRAM',
    inputShape: 'Cross-Modal Vector [Vis, Aud, Therm, IoT]',
    p50: '26.9 ms',
    p95: '31.0 ms',
    p99: '34.2 ms',
    supportedClasses: ['Visual Intrusion', 'Gunshot Acoustic', 'Vehicle Engine Acoustic', 'Thermal Body Signature', 'Seismic Geophone']
  }
];

export const AIModelCenter: React.FC = () => {
  const navigate = useNavigate();
  const [pipelines] = useState<ModelPipeline[]>(AI_PIPELINES);
  
  // Model Info Modal
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelPipeline>(AI_PIPELINES[0]);

  // Test Inference Modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Run Test Inference
  const handleRunTest = async (model: ModelPipeline) => {
    setSelectedModel(model);
    setTestModalOpen(true);
    setTestLoading(true);
    try {
      const res = await fetch(`/api/ai-models/test/${model.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold: 0.5 })
      });
      if (res.ok) {
        const data = await res.json();
        setTestResult(data);
      }
    } catch (e) {
      console.error('Error running test inference:', e);
    } finally {
      setTestLoading(false);
    }
  };

  const handleAction = (pipe: ModelPipeline) => {
    if (pipe.actionType === 'navigate' && pipe.navRoute) {
      navigate(pipe.navRoute);
    } else {
      handleRunTest(pipe);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#060b13] text-slate-200 overflow-y-auto p-4 md:p-6 space-y-5 font-sans">
      
      {/* Top Header Row with 4 Stats (Exact Match for media_1790534752572.jpg) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#09182a] border border-[#143354] flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              AI Model Center & Capability Matrix
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time status, hardware allocation, inference latency, and verified capability taxonomies.
            </p>
          </div>
        </div>

        {/* 4 Header Quick Stats (Exact Match) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* 5 AI Engines */}
          <div className="bg-[#09101d] border border-[#182638] rounded-xl px-3.5 py-2 flex items-center gap-3 shadow-md min-w-[105px]">
            <div className="p-1.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-500">
              <Settings className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-base font-bold text-white leading-none font-mono">5</div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono whitespace-nowrap">AI Engines</div>
            </div>
          </div>

          {/* 24 Active Classes */}
          <div className="bg-[#09101d] border border-[#182638] rounded-xl px-3.5 py-2 flex items-center gap-3 shadow-md min-w-[105px]">
            <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-base font-bold text-white leading-none font-mono">24</div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono whitespace-nowrap">Active Classes</div>
            </div>
          </div>

          {/* GPU Optimized */}
          <div className="bg-[#09101d] border border-[#182638] rounded-xl px-3.5 py-2 flex items-center gap-3 shadow-md min-w-[105px]">
            <div className="p-1.5 rounded-lg bg-blue-950/60 border border-blue-500/40 text-blue-400">
              <Server className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-base font-bold text-white leading-none font-mono">GPU</div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono whitespace-nowrap">Optimized</div>
            </div>
          </div>

          {/* 100% Operational */}
          <div className="bg-[#09101d] border border-[#182638] rounded-xl px-3.5 py-2 flex items-center gap-3 shadow-md min-w-[105px]">
            <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-base font-bold text-white leading-none font-mono">100%</div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono whitespace-nowrap">Operational</div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 AI Model Cards in 3x2 Grid (Exact Match for media_1790534752572.jpg) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pipelines.map((pipe) => {
          return (
            <div 
              key={pipe.id}
              className="bg-[#07101e] border border-[#16253b] rounded-2xl p-4 shadow-xl hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                {/* Header: Version Tag + Status */}
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] font-mono text-[#38bdf8] bg-[#0b223d]/80 border border-[#1d426d] px-2 py-0.5 rounded">
                    {pipe.version}
                  </span>
                  <span className="text-[10px] font-bold text-[#10b981] bg-[#05291d] border border-[#065f46] px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                    {pipe.status}
                  </span>
                </div>

                {/* Title & Role */}
                <h3 className="text-[15px] font-bold text-white tracking-tight">{pipe.name}</h3>
                <div className="text-xs font-semibold text-[#38bdf8] mt-0.5">{pipe.role}</div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-snug line-clamp-2">{pipe.description}</p>
              </div>

              {/* Neural Image Preview (Exact Match from Reference Screenshot) */}
              <div className="relative rounded-xl overflow-hidden border border-[#16253b] bg-[#030712] h-[120px] md:h-[128px] flex items-center justify-center">
                <img 
                  src={pipe.previewImg} 
                  alt={pipe.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/feed-bop01.jpg';
                  }}
                />
              </div>

              {/* Latency, Throughput & Classes Stats (Exact Match for media_1790534752572.jpg) */}
              <div className="bg-[#050b14] border border-[#131f31] rounded-xl px-3 py-2 grid grid-cols-3 divide-x divide-[#131f31] text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Latency</span>
                  <span className="text-xs font-bold text-emerald-400 block mt-0.5">{pipe.latency}</span>
                </div>
                <div className="pl-1">
                  <span className="text-[10px] text-slate-400 block uppercase">Throughput</span>
                  <span className="text-xs font-bold text-slate-100 block mt-0.5">{pipe.fps}</span>
                </div>
                <div className="pl-1">
                  <span className="text-[10px] text-slate-400 block uppercase">Classes</span>
                  <span className="text-xs font-bold text-purple-400 block mt-0.5">{pipe.classesCount}</span>
                </div>
              </div>

              {/* Action Buttons: Model Info + Specific Action CTA (Exact Match) */}
              <div className="grid grid-cols-2 gap-2.5">
                <button 
                  onClick={() => { setSelectedModel(pipe); setInfoModalOpen(true); }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#091220] hover:bg-[#0e1b2f] border border-[#1c2c43] text-slate-300 hover:text-white text-xs font-semibold transition-all"
                >
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  Model Info
                </button>

                {pipe.id === 'model-yolo-detector' && (
                  <button 
                    onClick={() => handleAction(pipe)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#05271c] hover:bg-[#073626] border border-[#059669]/70 text-emerald-400 text-xs font-semibold transition-all"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Test Inference
                  </button>
                )}

                {pipe.id === 'model-bytetrack' && (
                  <button 
                    onClick={() => handleAction(pipe)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#082838] hover:bg-[#0c374d] border border-[#0891b2]/70 text-cyan-400 text-xs font-semibold transition-all"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    View Tracking
                  </button>
                )}

                {pipe.id === 'model-paddle-anpr' && (
                  <button 
                    onClick={() => handleAction(pipe)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#05271c] hover:bg-[#073626] border border-[#059669]/70 text-emerald-400 text-xs font-semibold transition-all"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Test Plate OCR
                  </button>
                )}

                {pipe.id === 'model-retinaface' && (
                  <button 
                    onClick={() => handleAction(pipe)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#240e34] hover:bg-[#34144b] border border-[#9333ea]/70 text-purple-300 text-xs font-semibold transition-all"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Run Test
                  </button>
                )}

                {pipe.id === 'model-spatiotemporal' && (
                  <button 
                    onClick={() => handleAction(pipe)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#311e08] hover:bg-[#442a0b] border border-[#d97706]/70 text-amber-400 text-xs font-semibold transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View Explainability
                  </button>
                )}

                {pipe.id === 'model-multimodal' && (
                  <button 
                    onClick={() => handleAction(pipe)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#082838] hover:bg-[#0c374d] border border-[#0891b2]/70 text-cyan-400 text-xs font-semibold transition-all"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Live Test
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODEL ARCHITECTURE INFO MODAL */}
      {infoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0F18] border border-cyan-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-4 font-mono max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1B2536] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedModel.name}</h3>
                  <p className="text-[11px] text-cyan-300">{selectedModel.role}</p>
                </div>
              </div>
              <button 
                onClick={() => setInfoModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed font-sans">{selectedModel.description}</p>

              {/* Hardware & Execution Specs */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-[#070B12] border border-[#1E293B] space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Compute Runtime</span>
                  <p className="text-white font-bold">{selectedModel.device}</p>
                </div>

                <div className="p-3 rounded-xl bg-[#070B12] border border-[#1E293B] space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">VRAM Allocation</span>
                  <p className="text-emerald-400 font-bold">{selectedModel.vram}</p>
                </div>

                <div className="p-3 rounded-xl bg-[#070B12] border border-[#1E293B] space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Input Tensor Shape</span>
                  <p className="text-cyan-400 font-bold">{selectedModel.inputShape}</p>
                </div>

                <div className="p-3 rounded-xl bg-[#070B12] border border-[#1E293B] space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase">Benchmark FPS</span>
                  <p className="text-white font-bold">{selectedModel.fps}</p>
                </div>
              </div>

              {/* Latency Quantiles */}
              <div className="p-3 rounded-xl bg-[#070B12] border border-[#1E293B] space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Latency Benchmark Quantiles</span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded bg-[#0A0F18] border border-slate-800">
                    <span className="text-[10px] text-slate-400">P50 (Median)</span>
                    <p className="text-emerald-400 font-bold text-sm mt-0.5">{selectedModel.p50}</p>
                  </div>
                  <div className="p-2 rounded bg-[#0A0F18] border border-slate-800">
                    <span className="text-[10px] text-slate-400">P95</span>
                    <p className="text-cyan-400 font-bold text-sm mt-0.5">{selectedModel.p95}</p>
                  </div>
                  <div className="p-2 rounded bg-[#0A0F18] border border-slate-800">
                    <span className="text-[10px] text-slate-400">P99</span>
                    <p className="text-amber-400 font-bold text-sm mt-0.5">{selectedModel.p99}</p>
                  </div>
                </div>
              </div>

              {/* Supported Classes */}
              <div>
                <span className="text-[10px] text-slate-500 uppercase block mb-1.5 font-bold">Supported Taxonomy Classes ({selectedModel.supportedClasses?.length || 0})</span>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {selectedModel.supportedClasses?.map((cls, cIdx) => (
                    <span key={cIdx} className="px-2 py-0.5 rounded bg-[#070B12] border border-[#1E293B] text-[10px] text-slate-300">
                      {cls}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <Button 
                variant="outline"
                onClick={() => setInfoModalOpen(false)}
                className="w-full bg-[#1B2536] hover:bg-[#25334A] text-white text-xs"
              >
                Close Architecture Viewer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE INFERENCE TEST MODAL */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A0F18] border border-cyan-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-[#1B2536] pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-cyan-400 fill-current" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Live Neural Inference: {selectedModel.name}
                </h3>
              </div>
              <button 
                onClick={() => setTestModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {testLoading ? (
              <div className="py-12 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <p className="text-sm text-cyan-300">Passing frame through TensorRT Inference Graph...</p>
                <p className="text-xs text-slate-500">Measuring CUDA latency & GPU kernel execution</p>
              </div>
            ) : testResult ? (
              <div className="space-y-3 text-xs">
                {/* Result metrics */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-[#070B12] border border-[#1E293B]">
                    <span className="text-[10px] text-slate-500 uppercase">Measured Latency</span>
                    <p className="text-emerald-400 font-bold text-base mt-0.5">{testResult.measured_latency_ms} ms</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#070B12] border border-[#1E293B]">
                    <span className="text-[10px] text-slate-500 uppercase">Model Confidence</span>
                    <p className="text-cyan-400 font-bold text-base mt-0.5">{(testResult.confidence * 100).toFixed(1)}%</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#070B12] border border-[#1E293B] space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Hardware Device:</span>
                    <span className="text-white font-bold">{testResult.device}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>GPU Utilization:</span>
                    <span className="text-cyan-300 font-bold">{testResult.hardware_load.gpu_utilization_pct}%</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>VRAM Allocated:</span>
                    <span className="text-slate-200">{testResult.hardware_load.vram_allocated_mb} MB</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Core Temperature:</span>
                    <span className="text-amber-400 font-bold">{testResult.hardware_load.temperature_celsius} °C</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 uppercase block mb-1">Detected Classes in Test Pass:</span>
                  <div className="flex gap-2">
                    {testResult.classes_detected.map((cls: string, i: number) => (
                      <span key={i} className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                        ✓ {cls}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => handleRunTest(selectedModel)}
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                  >
                    Run Another Inference Iteration
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
};

export default AIModelCenter;

