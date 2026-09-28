import React, { useState } from 'react';
import { 
  Search, Filter, Users, Car, Crosshair, ArrowRight, ArrowUpRight, 
  ArrowDownRight, ArrowDown, ArrowDownLeft, ArrowLeft, ArrowUpLeft, 
  ArrowUp, Shield, Activity, Target
} from 'lucide-react';

interface DetectionItem {
  id: string;
  type: 'person' | 'vehicle' | 'animal';
  camera: string;
  direction: string;
  speed: number;
  zone: string;
  confidence: number;
  certainty: 'confirmed' | 'probable' | 'uncertain' | 'unknown';
  time: string;
}

const MOCK_DETECTIONS: DetectionItem[] = [
  { id: 'P-097', type: 'person', camera: 'CAM-01', direction: 'N', speed: 1.2, zone: 'Entry Lobby', confidence: 95, certainty: 'confirmed', time: '10:42:15' },
  { id: 'P-098', type: 'person', camera: 'CAM-02', direction: 'NE', speed: 1.4, zone: 'Corridor A', confidence: 92, certainty: 'confirmed', time: '10:42:10' },
  { id: 'P-099', type: 'person', camera: 'CAM-01', direction: 'S', speed: 0.8, zone: 'Entry Lobby', confidence: 85, certainty: 'probable', time: '10:41:55' },
  { id: 'V-018', type: 'vehicle', camera: 'CAM-05', direction: 'E', speed: 15.5, zone: 'Main Gate', confidence: 98, certainty: 'confirmed', time: '10:41:30' },
  { id: 'P-100', type: 'person', camera: 'CAM-03', direction: 'W', speed: 1.1, zone: 'Cafeteria', confidence: 75, certainty: 'uncertain', time: '10:41:22' },
  { id: 'V-019', type: 'vehicle', camera: 'CAM-06', direction: 'W', speed: 12.0, zone: 'Parking A', confidence: 96, certainty: 'confirmed', time: '10:40:45' },
  { id: 'P-101', type: 'person', camera: 'CAM-02', direction: 'NW', speed: 1.3, zone: 'Corridor A', confidence: 90, certainty: 'confirmed', time: '10:40:15' },
  { id: 'V-020', type: 'vehicle', camera: 'CAM-05', direction: 'E', speed: 14.2, zone: 'Main Gate', confidence: 94, certainty: 'confirmed', time: '10:39:50' },
  { id: 'P-102', type: 'person', camera: 'CAM-04', direction: 'S', speed: 0.0, zone: 'Server Room', confidence: 60, certainty: 'uncertain', time: '10:39:10' },
  { id: 'P-103', type: 'person', camera: 'CAM-01', direction: 'N', speed: 1.5, zone: 'Entry Lobby', confidence: 91, certainty: 'confirmed', time: '10:38:44' },
];

const getDirectionIcon = (dir: string) => {
  switch (dir) {
    case 'N': return <ArrowUp className="w-3.5 h-3.5 text-slate-300" />;
    case 'NE': return <ArrowUpRight className="w-3.5 h-3.5 text-slate-300" />;
    case 'E': return <ArrowRight className="w-3.5 h-3.5 text-slate-300" />;
    case 'SE': return <ArrowDownRight className="w-3.5 h-3.5 text-slate-300" />;
    case 'S': return <ArrowDown className="w-3.5 h-3.5 text-slate-300" />;
    case 'SW': return <ArrowDownLeft className="w-3.5 h-3.5 text-slate-300" />;
    case 'W': return <ArrowLeft className="w-3.5 h-3.5 text-slate-300" />;
    case 'NW': return <ArrowUpLeft className="w-3.5 h-3.5 text-slate-300" />;
    default: return <ArrowUp className="w-3.5 h-3.5 text-slate-300" />;
  }
};

export const PeopleObjects: React.FC = () => {
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = MOCK_DETECTIONS.filter(d => {
    if (filterType !== 'all' && d.type !== filterType) return false;
    if (searchTerm && !d.id.toLowerCase().includes(searchTerm.toLowerCase()) && !d.camera.toLowerCase().includes(searchTerm.toLowerCase()) && !d.zone.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-[#070B12] text-slate-200 overflow-y-auto p-4 md:p-5 space-y-4 custom-scrollbar">
      
      {/* ── TOP OPERATIONAL HEADER BAR WITH HELICOPTER & SCOPE ART ── */}
      <div 
        className="p-4 bg-[#0A0F18] border border-[#1B2536] rounded-xl flex flex-wrap gap-4 justify-between items-center relative overflow-hidden shadow-xl"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(10, 15, 24, 0.98) 45%, rgba(10, 15, 24, 0.45) 80%, rgba(10, 15, 24, 0.2) 100%), url('/track-header-bg.jpg')`,
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain'
        }}
      >
        <div className="flex items-center space-x-3 z-10">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-950/40">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-mono">
              Subject Tracking
            </h1>
            <p className="text-[11px] text-slate-400 font-mono">
              Real-time object detection and classification
            </p>
          </div>
        </div>

        <div className="z-10 font-mono text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-950/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE ACTIVE
          </span>
        </div>
      </div>

      {/* ── 4 KPI STATS CARDS MATCHING SCREENSHOT ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total People */}
        <div 
          className="relative bg-[#0A0F18] border border-cyan-500/30 hover:border-cyan-500/60 rounded-xl p-3.5 shadow-xl overflow-hidden group transition-all"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(10, 15, 24, 0.92) 50%, rgba(10, 15, 24, 0.3) 100%), url('/track-kpi-people.jpg')`,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-inner">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-mono">Total People</div>
                <div className="text-2xl font-bold text-white font-mono mt-0.5 leading-none">245</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">Active today</div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Vehicles */}
        <div 
          className="relative bg-[#0A0F18] border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl p-3.5 shadow-xl overflow-hidden group transition-all"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(10, 15, 24, 0.92) 50%, rgba(10, 15, 24, 0.3) 100%), url('/track-kpi-vehicles.jpg')`,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-inner">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-mono">Total Vehicles</div>
                <div className="text-2xl font-bold text-white font-mono mt-0.5 leading-none">82</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">Active today</div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Tracks */}
        <div 
          className="relative bg-[#0A0F18] border border-amber-500/30 hover:border-amber-500/60 rounded-xl p-3.5 shadow-xl overflow-hidden group transition-all"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(10, 15, 24, 0.92) 50%, rgba(10, 15, 24, 0.3) 100%), url('/track-kpi-active.jpg')`,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-inner">
                <Crosshair className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-mono">Active Tracks</div>
                <div className="text-2xl font-bold text-white font-mono mt-0.5 leading-none">15</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">Currently in frame</div>
              </div>
            </div>
          </div>
        </div>

        {/* Avg Confidence */}
        <div 
          className="relative bg-[#0A0F18] border border-purple-500/30 hover:border-purple-500/60 rounded-xl p-3.5 shadow-xl overflow-hidden group transition-all"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(10, 15, 24, 0.92) 50%, rgba(10, 15, 24, 0.3) 100%), url('/track-kpi-confidence.jpg')`,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          }}
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30 shadow-inner">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-mono">Avg Confidence</div>
                <div className="text-2xl font-bold text-white font-mono mt-0.5 leading-none">92.4%</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">System accuracy</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── DETECTION FEED CARD & TABLE ── */}
      <div className="bg-[#0A0F18] border border-[#1B2536] rounded-xl overflow-hidden shadow-xl">
        
        {/* Table Toolbar */}
        <div className="p-3.5 border-b border-[#1B2536] flex flex-wrap gap-3 justify-between items-center bg-[#070B12]/80">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Detection Feed
            </h2>
          </div>

          <div className="flex items-center gap-2.5 font-mono text-xs">
            {/* Search Input */}
            <div className="relative w-60 sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search ID or Camera..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0A0F18] border border-[#1E293B] rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-cyan-500 text-slate-200"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center space-x-1.5 bg-[#0A0F18] rounded-lg px-2.5 py-1.5 border border-[#1E293B] text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select 
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all" className="bg-[#0A0F18]">all</option>
                <option value="person" className="bg-[#0A0F18]">People</option>
                <option value="vehicle" className="bg-[#0A0F18]">Vehicles</option>
              </select>
            </div>
          </div>
        </div>

        {/* Detection Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#070B12] text-slate-400 uppercase text-[11px] border-b border-[#1B2536]">
              <tr>
                <th className="px-5 py-3 font-semibold">TRACKING ID</th>
                <th className="px-4 py-3 font-semibold">TYPE</th>
                <th className="px-4 py-3 font-semibold">CAMERA</th>
                <th className="px-4 py-3 font-semibold">LOCATION</th>
                <th className="px-4 py-3 font-semibold">DIRECTION</th>
                <th className="px-4 py-3 font-semibold">CERTAINTY</th>
                <th className="px-4 py-3 font-semibold">CONFIDENCE</th>
                <th className="px-5 py-3 text-right font-semibold">TIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B2536]">
              {filtered.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#0E1624]/60 transition-colors group">
                  
                  {/* Tracking ID */}
                  <td className="px-5 py-3">
                    <span className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {item.id}
                    </span>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-1.5">
                      {item.type === 'person' ? (
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <Car className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      <span className="capitalize text-slate-200">{item.type}</span>
                    </div>
                  </td>

                  {/* Camera */}
                  <td className="px-4 py-3 text-slate-300">
                    {item.camera}
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3 text-slate-400">
                    {item.zone}
                  </td>

                  {/* Direction */}
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-1">
                      {getDirectionIcon(item.direction)}
                      <span className="text-slate-200">{item.direction}</span>
                    </div>
                  </td>

                  {/* Certainty Badge */}
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                      item.certainty === 'confirmed' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40' :
                      item.certainty === 'probable' ? 'bg-cyan-950/60 text-cyan-400 border-cyan-500/40' :
                      'bg-amber-950/60 text-amber-400 border-amber-500/40'
                    }`}>
                      {item.certainty}
                    </span>
                  </td>

                  {/* Confidence Bar */}
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-[#070B12] rounded-full h-1.5 overflow-hidden border border-[#1E293B]">
                        <div 
                          className={`h-full rounded-full ${
                            item.confidence >= 90 ? 'bg-emerald-500' :
                            item.confidence >= 80 ? 'bg-cyan-500' :
                            'bg-amber-500'
                          }`}
                          style={{ width: `${item.confidence}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-300 font-semibold">{item.confidence}%</span>
                    </div>
                  </td>

                  {/* Time */}
                  <td className="px-5 py-3 text-right text-slate-400">
                    {item.time}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default PeopleObjects;
