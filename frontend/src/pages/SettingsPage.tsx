import { useState } from 'react';
import { 
  Settings, Cpu, Bell, Sliders, Globe, Save, AlertCircle, Eye, Moon, 
  MonitorPlay, ShieldCheck, CheckCircle2, SlidersHorizontal, HardDrive,
  Radio, Volume2, Key, Database, RefreshCw, Sparkles, Check
} from 'lucide-react';
import { ApiKeySection } from '../components/security/ApiKeySection';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'ai' | 'thresholds' | 'notifications' | 'environment' | 'apikeys'>('general');
  const [hasChanges, setHasChanges] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State
  const [confidence, setConfidence] = useState(70);
  const [loiteringSec, setLoiteringSec] = useState(30);
  const [crowdLimit, setCrowdLimit] = useState(6);
  const [frameSkip, setFrameSkip] = useState(2);
  const [selectedCodec, setSelectedCodec] = useState('h264');
  const [activeModel, setActiveModel] = useState('yolo8');

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings className="w-4 h-4 mr-2" /> },
    { id: 'ai', label: 'AI Configuration', icon: <Cpu className="w-4 h-4 mr-2" /> },
    { id: 'thresholds', label: 'Thresholds', icon: <SlidersHorizontal className="w-4 h-4 mr-2" /> },
    { id: 'apikeys', label: 'API Keys & Integrations', icon: <Key className="w-4 h-4 mr-2 text-cyan-400" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4 mr-2" /> },
    { id: 'environment', label: 'Environment', icon: <Globe className="w-4 h-4 mr-2" /> },
  ];

  const handleSave = () => {
    setHasChanges(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const markDirty = () => {
    setHasChanges(true);
    setSavedSuccess(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 h-full overflow-y-auto bg-[#070B12] text-slate-200">
      
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0A0F18]/90 border border-slate-800/80 p-4 rounded-xl shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Settings className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              System Settings & Architecture Tuning
            </h1>
            <p className="text-slate-400 text-xs">Configure platform behavior, AI inference pipeline, and operational thresholds</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-mono">
              <Check size={14} /> CONFIG APPLIED
            </div>
          )}

          <button 
            disabled={!hasChanges}
            onClick={handleSave}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md ${
              hasChanges 
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25 cursor-pointer' 
                : 'bg-slate-800/60 text-slate-500 border border-slate-700/50 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 border-b border-slate-800/80 pb-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-t-lg transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5' 
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Settings Card */}
      <div className="max-w-5xl">
        
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-6">
            <div className="border-b border-slate-800/70 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" /> Platform Identity & Preferences
              </h2>
              <span className="text-[11px] font-mono text-slate-400">Deployment ID: IBVAP-BORDER-SEC04</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">System Name</label>
                <input 
                  type="text" 
                  defaultValue="IBVAP - Intelligent Border Video Analytics Platform" 
                  onChange={markDirty}
                  className="w-full bg-[#080E18] border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Display Theme</label>
                <select 
                  defaultValue="dark"
                  onChange={markDirty}
                  className="w-full bg-[#080E18] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
                >
                  <option value="dark">Military Command Center Dark (Default)</option>
                  <option value="contrast">High Contrast Tactical Night Mode</option>
                  <option value="infra">Infrared Thermal Palette</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Language</label>
                <select 
                  defaultValue="en"
                  onChange={markDirty}
                  className="w-full bg-[#080E18] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="en">English (Official Military)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Timezone Synchronization</label>
                <select 
                  defaultValue="ist"
                  onChange={markDirty}
                  className="w-full bg-[#080E18] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ist">Asia/Kolkata (IST - UTC+05:30)</option>
                  <option value="utc">UTC (Universal Military Time)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Video Hardware Decoder</label>
                <select 
                  value={selectedCodec}
                  onChange={(e) => { setSelectedCodec(e.target.value); markDirty(); }}
                  className="w-full bg-[#080E18] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="h264">NVIDIA NVDEC H.264 / AVC (Low Latency)</option>
                  <option value="hevc">NVIDIA NVDEC H.265 / HEVC (Ultra HD)</option>
                  <option value="cpu">Software FFmpeg Fallback</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Stream Buffer Depth</label>
                <select 
                  defaultValue="low"
                  onChange={markDirty}
                  className="w-full bg-[#080E18] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="zero">Zero Latency (Immediate Frame Drop)</option>
                  <option value="low">Low Latency (300ms jitter buffer)</option>
                  <option value="standard">Standard (1.0s smoothing)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* AI Configuration */}
        {activeTab === 'ai' && (
          <div className="space-y-5">
            <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-slate-800/70 pb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" /> Active AI Perception Modules
                </h2>
                <span className="text-[11px] font-mono text-emerald-400">TensorRT 8.6 // FP16 Accelerated</span>
              </div>

              <div className="space-y-3">
                {[
                  { name: 'RetinaFace Quality & Occlusion Engine', desc: 'Detect, align, and grade face quality from border checkpoints', defaultChecked: true },
                  { name: 'PaddleOCR-v4 + STN Rectification', desc: 'High-speed automated license plate number extraction and character rectification', defaultChecked: true },
                  { name: 'Low-Light Adaptive CLAHE Enhancer', desc: 'Real-time nighttime contrast normalization for dark mountain terrain feeds', defaultChecked: true },
                  { name: 'ByteTrack Multi-Camera Re-ID Filter', desc: 'Persist target IDs across non-overlapping sectors using visual appearance embeddings', defaultChecked: true },
                ].map((mod, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 bg-[#080E18] rounded-xl border border-slate-800">
                    <div>
                      <h4 className="font-bold text-xs text-white">{mod.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{mod.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={mod.defaultChecked} onChange={markDirty} />
                      <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" /> Model Engine Abstraction
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Active Object Detection Backbone</label>
                  <select 
                    value={activeModel}
                    onChange={(e) => { setActiveModel(e.target.value); markDirty(); }}
                    className="w-full bg-[#080E18] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="yolo8">YOLOv8x-Border (TensorRT INT8 / 48.2 FPS)</option>
                    <option value="rtdetr">RT-DETR-X Transformer (High Occlusion Accuracy)</option>
                    <option value="thermal">Flir-Thermal Specialist v2 (Long-Wave Infrared)</option>
                    <option value="mock">Synthetic Engine (Local Simulation Mode)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Edge Downsampling Frame Skip (N)</label>
                  <select 
                    value={frameSkip}
                    onChange={(e) => { setFrameSkip(Number(e.target.value)); markDirty(); }}
                    className="w-full bg-[#080E18] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="1">Skip 0 (Process Every Frame - 30 FPS)</option>
                    <option value="2">Skip 1 (Process Every 2nd Frame - 15 FPS)</option>
                    <option value="3">Skip 2 (Process Every 3rd Frame - 10 FPS)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Thresholds */}
        {activeTab === 'thresholds' && (
          <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-6">
            <div className="border-b border-slate-800/70 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" /> Detection & Incident Sensitivity
              </h2>
              <span className="text-[11px] font-mono text-slate-400">Strict Defense Rules Applied</span>
            </div>

            <div className="space-y-5 text-xs">
              <div className="space-y-2 p-3.5 bg-[#080E18] rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Global AI Confidence Discard Threshold</span>
                  <span className="font-mono text-cyan-400 font-bold text-sm">{confidence}%</span>
                </div>
                <input 
                  type="range" 
                  min="30" max="95" 
                  value={confidence}
                  onChange={(e) => { setConfidence(Number(e.target.value)); markDirty(); }}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <p className="text-[11px] text-slate-500">Detections scoring below this threshold are purged automatically before alert emission.</p>
              </div>

              <div className="space-y-2 p-3.5 bg-[#080E18] rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Loitering Dwell Trigger Duration</span>
                  <span className="font-mono text-amber-400 font-bold text-sm">{loiteringSec} seconds</span>
                </div>
                <input 
                  type="range" 
                  min="5" max="120" step="5"
                  value={loiteringSec}
                  onChange={(e) => { setLoiteringSec(Number(e.target.value)); markDirty(); }}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <p className="text-[11px] text-slate-500">Triggers an orange warning if a human remains stationary in a yellow zone past this duration.</p>
              </div>

              <div className="space-y-2 p-3.5 bg-[#080E18] rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Restricted Zone Crowd Overcrowding Limit</span>
                  <span className="font-mono text-red-400 font-bold text-sm">{crowdLimit} persons</span>
                </div>
                <input 
                  type="range" 
                  min="2" max="25" 
                  value={crowdLimit}
                  onChange={(e) => { setCrowdLimit(Number(e.target.value)); markDirty(); }}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-400"
                />
                <p className="text-[11px] text-slate-500">Flags crowd density alerts if aggregate head count exceeds this limit inside fence polygons.</p>
              </div>
            </div>
          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifications' && (
          <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-cyan-400" /> Alert Dispatch & Audio Channels
            </h2>
            <div className="space-y-3">
              {[
                { title: 'Auditory Siren on DEFCON Critical Threat', desc: 'Plays acoustic tactical alert on control room terminal speakers', defaultChecked: true },
                { title: 'Command Center Push Notifications', desc: 'Browser desktop banner alerts for zone breaches and ANPR matches', defaultChecked: true },
                { title: 'Automatic Incident Escalation to Quick Reaction Team', desc: 'Dispatches automated dispatch SMS/Radio packet to field patrol units', defaultChecked: true },
                { title: 'Night Shift Reduced Chime Mode', desc: 'Mutes low-severity alerts between 22:00 and 06:00 IST', defaultChecked: false },
              ].map((n, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-[#080E18] rounded-xl border border-slate-800">
                  <div>
                    <h4 className="font-bold text-xs text-white">{n.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{n.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked={n.defaultChecked} onChange={markDirty} />
                    <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Environment */}
        {activeTab === 'environment' && (
          <div className="bg-[#0B111B] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" /> Edge Gateway & Local Storage Limits
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#080E18] border border-slate-800 rounded-xl space-y-2">
                <div className="text-slate-400">Current Node Role</div>
                <div className="text-base font-bold text-white font-mono">STANDALONE EDGE SURVEILLANCE GATEWAY</div>
                <div className="text-[11px] text-emerald-400">● Local Cache Sync Active</div>
              </div>

              <div className="p-4 bg-[#080E18] border border-slate-800 rounded-xl space-y-2">
                <div className="text-slate-400">Evidence Disk Quota</div>
                <div className="text-base font-bold text-cyan-400 font-mono">1.2 TB / 4.0 TB (30% Used)</div>
                <div className="text-[11px] text-slate-500">Auto-purges oldest non-critical events at 90%</div>
              </div>
            </div>
          </div>
        )}

        {/* API Keys & External Integrations */}
        {activeTab === 'apikeys' && (
          <ApiKeySection />
        )}

      </div>

    </div>
  );
};
export default SettingsPage;
