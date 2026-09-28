import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Monitor, Compass, Radio } from 'lucide-react';

export const NotFoundPage = () => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center bg-[#070B12] text-slate-200 relative overflow-hidden">
    
    {/* Subtle Background Radial Radar Rings */}
    <div className="absolute w-[500px] h-[500px] rounded-full border border-cyan-500/10 pointer-events-none animate-pulse" />
    <div className="absolute w-[350px] h-[350px] rounded-full border border-cyan-500/15 pointer-events-none" />
    <div className="absolute w-[200px] h-[200px] rounded-full border border-cyan-500/20 pointer-events-none" />

    {/* Center Tactical Warning Box */}
    <div className="relative z-10 max-w-md w-full bg-[#0A0F18]/90 border border-slate-800/90 rounded-2xl p-8 shadow-2xl backdrop-blur-md space-y-5">
      
      {/* Icon Badge */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
          <ShieldAlert size={36} />
        </div>
      </div>

      <div>
        <div className="text-4xl font-extrabold text-white font-mono tracking-wider">
          404 <span className="text-amber-400 text-2xl font-bold">// NO SIGNAL</span>
        </div>
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mt-1">
          Classified Sector Unreachable
        </h2>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        The requested tactical coordinate or operational module is either restricted, de-allocated, or does not exist in the active border intelligence grid.
      </p>

      {/* Grid Coordinates Mock */}
      <div className="p-3 bg-[#070B12] rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1 text-left">
        <div className="flex justify-between">
          <span>GRID COORD:</span>
          <span className="text-cyan-400">34.1256° N, 77.5824° E</span>
        </div>
        <div className="flex justify-between">
          <span>DEFENSE STATUS:</span>
          <span className="text-amber-400 font-bold">SECTOR 04 BLIND SPOT</span>
        </div>
        <div className="flex justify-between">
          <span>SIGNAL TELEMETRY:</span>
          <span className="text-red-400 font-bold">CARRIER DROPPED</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <Link 
          to="/command-center" 
          className="flex-1 py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5"
        >
          <ArrowLeft size={14} /> Command Center
        </Link>
        <Link 
          to="/surveillance" 
          className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-1.5"
        >
          <Monitor size={14} /> Live Wall
        </Link>
      </div>

    </div>

  </div>
);

export default NotFoundPage;
