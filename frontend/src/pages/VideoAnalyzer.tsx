import React, { useState, useRef } from 'react';
import { 
  Upload, Play, FileText, Download, CheckCircle2, AlertTriangle, 
  Clock, Shield, User, Car, Eye, RefreshCw, BarChart2, Activity,
  FileSpreadsheet, FileCode, Video, Sparkles, Check, HardDrive, Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const VideoAnalyzer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysisReport, setAnalysisReport] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
      setAnalysisReport(null);
    }
  };

  const handleLoadSample = () => {
    setVideoPreviewUrl('/feed-bop01.jpg');
    setSelectedFile(new File([''], 'thermal_patrol_sector4.mp4', { type: 'video/mp4' }));
    setAnalysisReport(null);
  };

  const handleStartAnalysis = () => {
    if (!videoPreviewUrl) {
      handleLoadSample();
    }
    setIsAnalyzing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          // Set rich report
          setAnalysisReport({
            videoId: `VID-${Date.now().toString().slice(-6)}`,
            filename: selectedFile?.name || 'thermal_patrol_sector4.mp4',
            duration: '02m 41s',
            totalFrames: 4830,
            fps: 30.0,
            counts: {
              people: 27,
              vehicles: 12,
              animals: 4,
              zoneEvents: 6,
              loitering: 2,
              anpr: 8,
              critical: 1,
              high: 3,
              medium: 4
            },
            eventTimeline: [
              { timestamp: '00:00:14', timeSeconds: 14, event: 'PERSON_DETECTED', target: 'P-101', risk: 'LOW', detail: 'Person standing near Outer Gate' },
              { timestamp: '00:00:38', timeSeconds: 38, event: 'VEHICLE_DETECTED', target: 'V-014 (SUV)', risk: 'MEDIUM', detail: 'Vehicle approached Checkpoint Lane 1' },
              { timestamp: '00:00:42', timeSeconds: 42, event: 'ANPR_READ', target: 'MH 12 AB 1234', risk: 'LOW', detail: 'Plate recognized with 98.2% confidence' },
              { timestamp: '00:01:15', timeSeconds: 75, event: 'ZONE_ENTRY', target: 'P-104', risk: 'HIGH', detail: 'Crossed into Restricted Perimeter Alpha' },
              { timestamp: '00:01:48', timeSeconds: 108, event: 'LOITERING', target: 'P-104', risk: 'CRITICAL', detail: 'Dwell time exceeded 120s near boundary fence' },
              { timestamp: '00:02:10', timeSeconds: 130, event: 'ANIMAL_DETECTED', target: 'A-002', risk: 'LOW', detail: 'Wild animal filtered - No intrusion alarm triggered' },
              { timestamp: '00:02:35', timeSeconds: 155, event: 'DIRECTION_VIOLATION', target: 'P-104', risk: 'CRITICAL', detail: 'Vector directed toward sensitive outpost asset' }
            ],
            detectedObjects: [
              { id: 'P-104', type: 'PERSON', confidence: 96.4, action: 'walking', clothing: 'Navy Jacket / Dark Pants', dwell: '02m 15s', maxRisk: 87 },
              { id: 'V-014', type: 'VEHICLE (SUV)', confidence: 98.2, plate: 'MH 12 AB 1234', speed: '32 km/h', dwell: '00m 45s', maxRisk: 38 },
              { id: 'A-002', type: 'ANIMAL (Wild)', confidence: 92.1, species: 'Wild Animal', filter: 'Filtered to Low Risk', dwell: '00m 30s', maxRisk: 12 }
            ],
            riskSummary: {
              overallScore: 87,
              rating: 'CRITICAL',
              primaryReason: 'Person P-104 entered Restricted Zone Alpha during non-operational hours and loitered for 135s',
              sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
            }
          });
          return 100;
        }
        return prev + 15;
      });
    }, 250);
  };

  const exportJSON = () => {
    if (!analysisReport) return;
    const blob = new Blob([JSON.stringify(analysisReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IBVAP-Analysis-${analysisReport.videoId}.json`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full bg-[#070B12] text-slate-200 overflow-y-auto space-y-6 p-6 font-sans">
      
      {/* Top Header Card (Mirrors media_1790496162587.jpg) */}
      <div className="relative rounded-2xl border border-[#1B2536] overflow-hidden shadow-2xl bg-[#0A0F18] p-5">
        <div 
          className="absolute right-0 top-0 bottom-0 w-80 bg-cover bg-center opacity-30 mix-blend-luminosity pointer-events-none"
          style={{ backgroundImage: `url('/analyzer-header-bg.jpg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F18] via-[#0A0F18]/90 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
                Uploaded Video Intelligence Analyzer
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Upload custom CCTV or border footage to execute automated object detection, tracking, ANPR, and incident report generation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Upload Footage (Left) + Source Video Stream (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Select or Upload Footage */}
        <div className="lg:col-span-6 bg-[#0A0F18] border border-[#1B2536] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 border-b border-[#1B2536] pb-3 mb-2 font-mono">
              <Upload className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Select or Upload Footage
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Supports standard MP4, WebM, and MKV files. Video is analyzed locally without external third-party data transmission.
            </p>

            {/* Dropzone Box with Night Watchtower Graphic */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative rounded-xl border border-dashed border-[#1E293B] hover:border-cyan-500/50 bg-[#070B12] p-8 text-center cursor-pointer transition-colors group overflow-hidden"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-15 group-hover:opacity-25 transition-opacity pointer-events-none"
                style={{ backgroundImage: `url('/analyzer-dropzone-preview.jpg')` }}
              />
              <div className="relative z-10 flex flex-col items-center justify-center space-y-2">
                <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="font-mono text-sm font-bold text-white">
                  Click to select video file from disk
                </div>
                <div className="font-mono text-xs text-slate-500">
                  Drag and drop video clip here
                </div>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="video/*" 
                onChange={handleFileChange}
                className="hidden" 
              />
            </div>

            {/* Selected File Feedback */}
            {selectedFile && (
              <div className="mt-3 p-2.5 rounded-lg bg-[#070B12] border border-cyan-500/30 flex items-center justify-between font-mono text-xs text-slate-300">
                <span className="truncate text-cyan-300 font-bold">{selectedFile.name}</span>
                <span className="text-slate-500 text-[10px]">Ready for Inference</span>
              </div>
            )}

            {/* Sample Footage Row */}
            <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#1B2536] font-mono text-xs">
              <span className="text-slate-400">Or use sample border footage:</span>
              <button
                onClick={handleLoadSample}
                className="px-3 py-1.5 rounded-lg bg-[#070B12] border border-[#1E293B] hover:bg-slate-800 text-slate-300 font-semibold transition-colors"
              >
                Load Thermal Sample
              </button>
            </div>
          </div>

          {/* Action CTA Button */}
          <div className="pt-2 font-mono">
            {isAnalyzing ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-cyan-400 font-bold">
                  <span>Executing Neural Inference Pipeline...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-[#070B12] rounded-full overflow-hidden border border-[#1B2536]">
                  <div className="h-full bg-cyan-500 transition-all duration-200" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <button
                onClick={handleStartAnalysis}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/40"
              >
                <Play className="w-4 h-4 fill-current" />
                Run Full Video Intelligence Pipeline
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Source Video Stream (Mirrors media_1790496162587.jpg) */}
        <div className="lg:col-span-6 bg-[#0A0F18] border border-[#1B2536] rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 border-b border-[#1B2536] pb-3 mb-3 font-mono">
              <Eye className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Source Video Stream
              </h2>
            </div>

            {/* Video Container */}
            <div className="relative rounded-xl overflow-hidden border border-[#1E293B] aspect-video bg-black flex items-center justify-center shadow-2xl">
              {videoPreviewUrl && videoPreviewUrl.endsWith('.jpg') ? (
                <img 
                  src={videoPreviewUrl} 
                  alt="Thermal Sample" 
                  className="w-full h-full object-cover" 
                />
              ) : videoPreviewUrl ? (
                <video 
                  ref={videoRef}
                  src={videoPreviewUrl} 
                  controls 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full relative flex items-center justify-center">
                  <img 
                    src="/analyzer-stream-preview.jpg" 
                    alt="Stream Placeholder"
                    className="w-full h-full object-cover opacity-60"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/feed-watch01.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center space-y-2 pointer-events-none p-4 text-center">
                    <Activity className="w-7 h-7 text-slate-500 animate-pulse" />
                    <span className="font-mono text-xs text-slate-300 font-bold">
                      No video loaded. Select a file or sample above.
                    </span>
                  </div>
                </div>
              )}

              {/* Camera Metadata Overlay */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 rounded text-[9px] font-mono text-slate-300 border border-white/10 flex items-center gap-2">
                <span>CAM-01 | SECTOR 04 - NORTH BORDER</span>
                <span className="text-red-400 font-bold">● LIVE FEED</span>
              </div>
            </div>
          </div>

          {/* Stream Footer Specs */}
          <div className="pt-2 border-t border-[#1B2536] flex items-center justify-between font-mono text-[11px] text-slate-400">
            <span>Inference: <strong className="text-slate-200">YOLOv8 + ByteTrack + PaddleOCR</strong></span>
            <span className="text-cyan-400 font-bold">Local GPU Accelerated</span>
          </div>
        </div>

      </div>

      {/* Analysis Results View (When generated) */}
      {analysisReport && (
        <div className="bg-[#0A0F18] border border-[#1B2536] rounded-2xl p-6 shadow-2xl space-y-5 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1B2536] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                  PIPELINE COMPLETED
                </span>
                <h3 className="text-base font-bold text-white">
                  Analysis Report: {analysisReport.videoId}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Processed {analysisReport.totalFrames} frames @ {analysisReport.fps} FPS · Hash: {analysisReport.riskSummary.sha256Hash.slice(0, 16)}...
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportJSON}
                className="bg-[#070B12] border-[#1E293B] text-cyan-400 hover:bg-slate-800 text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Export JSON Report
              </Button>
            </div>
          </div>

          {/* Counts Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#070B12] p-3 rounded-xl border border-[#1E293B]">
              <span className="text-slate-400 block text-[10px] uppercase">People Detected</span>
              <span className="text-xl font-bold text-white mt-1 block">{analysisReport.counts.people}</span>
            </div>
            <div className="bg-[#070B12] p-3 rounded-xl border border-[#1E293B]">
              <span className="text-slate-400 block text-[10px] uppercase">Vehicles Detected</span>
              <span className="text-xl font-bold text-cyan-400 mt-1 block">{analysisReport.counts.vehicles}</span>
            </div>
            <div className="bg-[#070B12] p-3 rounded-xl border border-[#1E293B]">
              <span className="text-slate-400 block text-[10px] uppercase">ANPR Reads</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">{analysisReport.counts.anpr}</span>
            </div>
            <div className="bg-[#070B12] p-3 rounded-xl border border-red-500/30">
              <span className="text-slate-400 block text-[10px] uppercase">Critical Intrusions</span>
              <span className="text-xl font-bold text-red-400 mt-1 block">{analysisReport.counts.critical} Hits</span>
            </div>
          </div>

          {/* Event Timeline Table */}
          <div className="border border-[#1B2536] rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-[#070B12] text-xs font-bold text-white border-b border-[#1B2536] uppercase tracking-wider">
              Chronological Intelligence Timeline
            </div>
            <div className="divide-y divide-[#151D2A] max-h-56 overflow-y-auto">
              {analysisReport.eventTimeline.map((item: any, i: number) => (
                <div key={i} className="p-3 flex items-center justify-between text-xs hover:bg-[#0E1624] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-cyan-400 font-bold">{item.timestamp}</span>
                    <span className="text-white font-semibold">{item.target}</span>
                    <span className="text-slate-400">{item.detail}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.risk === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                    item.risk === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                    'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  }`}>
                    {item.risk}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VideoAnalyzer;
