import React, { useState, useEffect, useRef } from 'react';
import { 
  Layers, AlertTriangle, ShieldAlert, Activity, CheckCircle2, 
  Navigation, Crosshair, Compass, Video, Eye, Radio, Maximize2, 
  Minimize2, Shield, ArrowUpRight, Zap, Target, Sliders,
  Satellite, Mountain, Moon, Wifi, Search, ChevronRight,
  ChevronLeft, Car, Users, X
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface IncidentItem {
  id: string;
  type: string;
  lat: number;
  lon: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  location: string;
  camera: string;
  time: string;
}

interface CameraMarkerItem {
  id: string;
  name: string;
  lat: number;
  lon: number;
  status: 'ONLINE' | 'OFFLINE';
  feed: string;
  fps: number;
}

const ACTIVE_INCIDENTS: IncidentItem[] = [
  {
    id: 'INC-001',
    type: 'Unauthorized Crossing',
    lat: 27.055,
    lon: 88.455,
    severity: 'CRITICAL',
    location: 'Sector 4, North Fence',
    camera: 'CAM-01',
    time: '13:18:56'
  },
  {
    id: 'INC-002',
    type: 'Vehicle in Restricted Zone',
    lat: 26.712,
    lon: 92.134,
    severity: 'HIGH',
    location: 'Sector 2 West Gate',
    camera: 'CAM-04',
    time: '13:16:42'
  },
  {
    id: 'INC-003',
    type: 'Loitering Detected',
    lat: 25.884,
    lon: 93.227,
    severity: 'MEDIUM',
    location: 'Sector 7 East Buffer',
    camera: 'CAM-05',
    time: '12:58:33'
  }
];

const CAMERAS_LIST: CameraMarkerItem[] = [
  { id: 'CAM-01', name: 'North Fence Alpha', lat: 27.055, lon: 88.455, status: 'ONLINE', feed: '/feed-bop01.jpg', fps: 30 },
  { id: 'CAM-02', name: 'BOP Wagah Sector', lat: 31.604, lon: 74.572, status: 'ONLINE', feed: '/feed-bop02.jpg', fps: 28 },
  { id: 'CAM-03', name: 'BOP Jaisalmer Desert', lat: 26.912, lon: 70.902, status: 'ONLINE', feed: '/feed-bop03.jpg', fps: 25 },
  { id: 'CAM-04', name: 'Perimeter East Gate', lat: 26.712, lon: 92.134, status: 'ONLINE', feed: '/feed-road01.jpg', fps: 30 },
  { id: 'CAM-05', name: 'Checkpoint Bravo', lat: 25.884, lon: 93.227, status: 'ONLINE', feed: '/feed-check01.jpg', fps: 30 },
  { id: 'CAM-06', name: 'Valley Pass Sentry', lat: 32.500, lon: 74.800, status: 'ONLINE', feed: '/feed-watch01.jpg', fps: 24 },
  { id: 'CAM-07', name: 'Hill Track Overwatch', lat: 34.152, lon: 77.577, status: 'OFFLINE', feed: '/feed-bop03.jpg', fps: 0 },
  { id: 'CAM-08', name: 'Bridge Outpost 08', lat: 27.580, lon: 91.850, status: 'ONLINE', feed: '/fence-feed-alpha.jpg', fps: 30 },
];

const CAMERAS_BOTTOM = [
  { id: 'CAM-01', name: 'North Fence Alpha', feed: '/feed-bop01.jpg', lat: 27.055, lon: 88.455 },
  { id: 'CAM-04', name: 'Perimeter East', feed: '/feed-road01.jpg', lat: 26.712, lon: 92.134 },
  { id: 'CAM-05', name: 'Checkpoint', feed: '/feed-check01.jpg', lat: 25.884, lon: 93.227 },
  { id: 'CAM-07', name: 'Hill Track', feed: '/feed-bop03.jpg', lat: 34.152, lon: 77.577 }
];

const TILE_PROVIDERS: Record<string, { url: string; attribution: string; maxZoom: number }> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri World Imagery',
    maxZoom: 18,
  },
  terrain: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri World Topo',
    maxZoom: 18,
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO dark',
    maxZoom: 19,
  },
  traffic: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
    maxZoom: 19,
  },
};

export function MapIntelligence() {
  const [mapMode, setMapMode] = useState<'satellite' | 'terrain' | 'dark' | 'traffic'>('satellite');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<IncidentItem | null>(ACTIVE_INCIDENTS[0]);
  const [activeLayerInfo, setActiveLayerInfo] = useState<string>('Sector 4 • Live Satellite Mode');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    try {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, {
        center: [27.055, 88.455],
        zoom: 9,
        zoomControl: false,
        attributionControl: false,
        minZoom: 4,
        maxZoom: 18,
      });

      const provider = TILE_PROVIDERS.satellite;
      const initialLayer = L.tileLayer(provider.url, {
        attribution: provider.attribution,
        maxZoom: provider.maxZoom,
      }).addTo(map);
      tileLayerRef.current = initialLayer;

      // 1. International Border (IB - Pakistan)
      const ibPakistan: [number, number][] = [
        [32.5, 74.5], [31.8, 74.8], [30.9, 74.6], [29.5, 73.8], [28.2, 72.5], [27.0, 71.2],
        [26.2, 70.5], [25.3, 69.8], [24.5, 68.9], [23.8, 68.5]
      ];
      L.polyline(ibPakistan, { 
        color: '#ff6b1a', 
        weight: 3, 
        opacity: 0.9, 
        dashArray: '8,6' 
      }).addTo(map).bindPopup(`
        <div style="padding: 6px; font-family: monospace; color: #ff6b1a; font-weight: bold; background: #0A0F18;">
          INTERNATIONAL BORDER (PAKISTAN) // BSF JURISDICTION
        </div>
      `, { className: 'tactical-popup' });

      // 2. Line of Actual Control (LAC - China)
      const lacChina: [number, number][] = [
        [34.5, 76.5], [33.8, 78.2], [32.9, 79.5], [31.5, 80.8], [30.2, 82.5], [28.8, 85.5], [27.5, 88.5]
      ];
      L.polyline(lacChina, { 
        color: '#ef4444', 
        weight: 3, 
        opacity: 0.9, 
        dashArray: '10,6' 
      }).addTo(map).bindPopup(`
        <div style="padding: 6px; font-family: monospace; color: #ef4444; font-weight: bold; background: #0A0F18;">
          LINE OF ACTUAL CONTROL (LAC) // ITBP SECTOR OVERWATCH
        </div>
      `, { className: 'tactical-popup' });

      // 3. Sector 4 Restricted Perimeter Polygon Fence
      const restrictedPolygon: [number, number][] = [
        [27.085, 88.420],
        [27.095, 88.485],
        [27.035, 88.490],
        [27.025, 88.425],
      ];
      L.polygon(restrictedPolygon, {
        color: '#ef4444',
        weight: 2,
        fillColor: '#ef4444',
        fillOpacity: 0.16,
        dashArray: '4,4',
      }).addTo(map).bindPopup(`
        <div style="padding: 8px; font-family: monospace; color: #E2E8F0; background: #0A0F18;">
          <div style="color: #ef4444; font-weight: 800; font-size: 11px;">RESTRICTED PERIMETER ZONE 04</div>
          <div style="font-size: 10px; color: #94A3B8; margin-top: 4px;">Zero-Tolerance Intrusion Boundary (BSF Tactical Node 4)</div>
        </div>
      `, { className: 'tactical-popup' });

      // 4. Sector 4 Outer Buffer Patrol Polygon Fence
      const bufferPolygon: [number, number][] = [
        [27.110, 88.390],
        [27.125, 88.515],
        [27.005, 88.520],
        [26.995, 88.395],
      ];
      L.polygon(bufferPolygon, {
        color: '#f59e0b',
        weight: 1.5,
        fillColor: '#f59e0b',
        fillOpacity: 0.06,
        dashArray: '6,6',
      }).addTo(map).bindPopup(`
        <div style="padding: 8px; font-family: monospace; color: #E2E8F0; background: #0A0F18;">
          <div style="color: #f59e0b; font-weight: 800; font-size: 11px;">BUFFER PATROL CORRIDOR</div>
          <div style="font-size: 10px; color: #94A3B8; margin-top: 4px;">UAV Patrol Zone & Early Warning Radar Grid</div>
        </div>
      `, { className: 'tactical-popup' });

      // 5. UAV Patrol Route Track
      const droneFlightPath: [number, number][] = [
        [27.085, 88.420],
        [27.095, 88.485],
        [27.060, 88.470],
        [27.035, 88.490],
        [27.045, 88.445],
        [27.085, 88.420]
      ];
      L.polyline(droneFlightPath, {
        color: '#06b6d4',
        weight: 2,
        opacity: 0.85,
        dashArray: '5,5',
      }).addTo(map);

      // 6. UAV Delta-04 Live Marker
      const droneHtml = `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          <div style="width: 24px; height: 24px; border-radius: 6px; background: rgba(6,182,212,0.25); border: 2px solid #06B6D4; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px #06B6D4;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/><line x1="3" x2="9" y1="12" y2="12"/><line x1="15" x2="21" y1="12" y2="12"/><line x1="12" x2="12" y1="3" y2="9"/><line x1="12" x2="12" y1="15" y2="21"/>
            </svg>
          </div>
          <div style="position: absolute; bottom: -14px; white-space: nowrap; font-size: 8px; font-weight: 800; font-family: monospace; background: #0A0F18; color: #06B6D4; padding: 1px 4px; border-radius: 2px; border: 1px solid #06B6D480;">
            UAV-DELTA4
          </div>
        </div>
      `;
      L.marker([27.065, 88.460], {
        icon: L.divIcon({
          html: droneHtml,
          className: 'custom-tactical-drone-marker',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        })
      }).addTo(map).bindPopup(`
        <div style="padding: 10px; font-family: monospace; color: #E2E8F0; background: #0A0F18; width: 200px;">
          <div style="color: #06B6D4; font-weight: 800; font-size: 11px; margin-bottom: 4px;">UAV DELTA-04 // PATROL DRONE</div>
          <div style="font-size: 10px; color: #94A3B8;">Altitude: 1,450 ft MSL</div>
          <div style="font-size: 10px; color: #94A3B8;">Airspeed: 42 kts</div>
          <div style="font-size: 10px; color: #10B981; margin-top: 4px;">● Live Sensor Feed Active</div>
        </div>
      `, { className: 'tactical-popup' });

      // 7. Add Camera Markers
      CAMERAS_LIST.forEach((cam) => {
        const isOnline = cam.status === 'ONLINE';
        const color = isOnline ? '#10B981' : '#EF4444';
        const camHtml = `
          <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: ${color}; opacity: 0.28; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 24px; height: 24px; border-radius: 50%; background: #0A0F18; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px ${color}88;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/>
              </svg>
            </div>
            <div style="position: absolute; bottom: -16px; white-space: nowrap; font-size: 9px; font-weight: 700; font-family: monospace; background: rgba(10,15,24,0.92); color: ${color}; padding: 1px 4px; border-radius: 3px; border: 1px solid ${color}40;">
              ${cam.id}
            </div>
          </div>
        `;

        const camPopupHtml = `
          <div style="padding: 10px; width: 220px; font-family: monospace; color: #E2E8F0; background: #0A0F18; border-radius: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1E293B; padding-bottom: 6px; margin-bottom: 8px;">
              <span style="font-weight: 800; font-size: 12px; color: #FFFFFF;">${cam.id}</span>
              <span style="font-size: 10px; color: ${color}; font-weight: 700;">● ${cam.status}</span>
            </div>
            <div style="width: 100%; height: 95px; border-radius: 6px; overflow: hidden; margin-bottom: 8px; border: 1px solid #1E293B; background: #000;">
              <img src="${cam.feed}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/feed-bop01.jpg'" />
            </div>
            <div style="font-size: 11px; font-weight: 700; color: #F1F5F9; margin-bottom: 2px;">${cam.name}</div>
            <div style="font-size: 10px; color: #94A3B8; margin-bottom: 6px;">GPS: ${cam.lat.toFixed(3)}°N, ${cam.lon.toFixed(3)}°E</div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; color: #06B6D4; background: #070B12; padding: 4px 6px; border-radius: 4px; border: 1px solid #1E293B;">
              <span>Resolution: 1080p</span>
              <span>FPS: ${cam.fps}</span>
            </div>
          </div>
        `;

        const marker = L.marker([cam.lat, cam.lon], {
          icon: L.divIcon({
            html: camHtml,
            className: 'custom-tactical-cam-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -18],
          })
        }).addTo(map).bindPopup(camPopupHtml, { className: 'tactical-popup' });

        markersRef.current.set(cam.id, marker);
      });

      // 8. Add Active Threat Incident Markers
      ACTIVE_INCIDENTS.forEach((inc) => {
        const color = inc.severity === 'CRITICAL' ? '#EF4444' : inc.severity === 'HIGH' ? '#F59E0B' : '#06B6D4';
        const incHtml = `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: ${color}; opacity: 0.38; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 26px; height: 26px; border-radius: 50%; background: #0A0F18; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px ${color};">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>
              </svg>
            </div>
            <div style="position: absolute; bottom: -18px; white-space: nowrap; font-size: 9px; font-weight: 900; font-family: monospace; background: rgba(10,15,24,0.95); color: ${color}; padding: 1px 5px; border-radius: 3px; border: 1px solid ${color};">
              ${inc.id}
            </div>
          </div>
        `;

        const incPopupHtml = `
          <div style="padding: 10px; width: 240px; font-family: monospace; color: #E2E8F0; background: #0A0F18; border-radius: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1E293B; padding-bottom: 6px; margin-bottom: 8px;">
              <span style="font-weight: 800; font-size: 12px; color: #FFFFFF;">${inc.id}</span>
              <span style="font-size: 9px; background: ${inc.severity === 'CRITICAL' ? '#DC2626' : '#D97706'}; color: #FFF; font-weight: 900; padding: 2px 6px; border-radius: 3px;">${inc.severity}</span>
            </div>
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
              <div style="width: 70px; height: 60px; border-radius: 6px; overflow: hidden; border: 1px solid #1E293B; flex-shrink: 0; background: #000;">
                <img src="/map-popup-incident.jpg" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/feed-bop01.jpg'" />
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 11px; font-weight: 700; color: #FFFFFF; line-height: 1.2;">${inc.type}</div>
                <div style="font-size: 10px; color: #94A3B8; margin-top: 4px;">${inc.location}</div>
                <div style="font-size: 9px; color: #06B6D4; margin-top: 2px;">Time: ${inc.time}</div>
              </div>
            </div>
            <div style="font-size: 9px; color: #64748B; border-top: 1px solid #1E293B; padding-top: 4px;">
              Camera: ${inc.camera} • Sector 04
            </div>
          </div>
        `;

        const marker = L.marker([inc.lat, inc.lon], {
          icon: L.divIcon({
            html: incHtml,
            className: 'custom-tactical-inc-marker',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -20],
          })
        }).addTo(map).bindPopup(incPopupHtml, { className: 'tactical-popup' });

        markersRef.current.set(inc.id, marker);
      });

      mapInstance.current = map;

      // Auto open primary incident
      const firstInc = markersRef.current.get('INC-001');
      if (firstInc) {
        firstInc.openPopup();
      }

    } catch (err) {
      console.error('Failed to initialize live map:', err);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Switch Tile Provider
  useEffect(() => {
    if (!mapInstance.current || !tileLayerRef.current) return;

    try {
      mapInstance.current.removeLayer(tileLayerRef.current);
      const provider = TILE_PROVIDERS[mapMode] || TILE_PROVIDERS.satellite;
      const newLayer = L.tileLayer(provider.url, {
        attribution: provider.attribution,
        maxZoom: provider.maxZoom,
      }).addTo(mapInstance.current);
      tileLayerRef.current = newLayer;

      const titles: Record<string, string> = {
        satellite: 'Sector 4 • Live Satellite Mode (High-Res)',
        terrain: 'Sector 4 • Tactical Terrain & Elevation',
        dark: 'Sector 4 • Dark Tactical Recon Grid',
        traffic: 'Sector 4 • Road & Infrastructure Layer',
      };
      setActiveLayerInfo(titles[mapMode] || 'Live Tactical Map');
    } catch (e) {
      console.error('Error switching tile layer:', e);
    }
  }, [mapMode]);

  // Adjust on fullscreen change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Pan to an Incident
  const handleSelectIncident = (inc: IncidentItem) => {
    setSelectedIncident(inc);
    if (mapInstance.current) {
      mapInstance.current.flyTo([inc.lat, inc.lon], 12, { duration: 1.2 });
      const marker = markersRef.current.get(inc.id);
      if (marker) {
        marker.openPopup();
      }
    }
  };

  // Pan to a Camera
  const handleSelectCamera = (camId: string, lat: number, lon: number) => {
    if (mapInstance.current) {
      mapInstance.current.flyTo([lat, lon], 12, { duration: 1.2 });
      const marker = markersRef.current.get(camId);
      if (marker) {
        marker.openPopup();
      }
    }
  };

  // Recenter to Sector 4
  const handleRecenter = () => {
    if (mapInstance.current) {
      mapInstance.current.flyTo([27.055, 88.455], 9, { duration: 1.2 });
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (mapInstance.current) {
      mapInstance.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstance.current) {
      mapInstance.current.zoomOut();
    }
  };

  const filteredIncidents = ACTIVE_INCIDENTS.filter(inc => 
    inc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`flex flex-col h-full bg-[#070B12] text-slate-200 overflow-y-auto space-y-4 p-4 font-sans ${isFullscreen ? 'fixed inset-0 z-50 p-4' : ''}`}>
      
      {/* Top Map Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0A0F18] border border-[#1B2536] p-2.5 rounded-xl shadow-lg font-mono text-xs">
        
        {/* Layer Mode Selectors */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button 
            onClick={() => setMapMode('satellite')}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
              mapMode === 'satellite' 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-950/40' 
                : 'bg-[#070B12] text-slate-400 border-[#1B2536] hover:text-white'
            }`}
          >
            <Satellite className="w-3.5 h-3.5 text-cyan-400" />
            Satellite
          </button>

          <button 
            onClick={() => setMapMode('terrain')}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
              mapMode === 'terrain' 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-950/40' 
                : 'bg-[#070B12] text-slate-400 border-[#1B2536] hover:text-white'
            }`}
          >
            <Mountain className="w-3.5 h-3.5 text-amber-400" />
            Terrain
          </button>

          <button 
            onClick={() => setMapMode('dark')}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
              mapMode === 'dark' 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-950/40' 
                : 'bg-[#070B12] text-slate-400 border-[#1B2536] hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-purple-400" />
            Dark Tactical
          </button>

          <button 
            onClick={() => setMapMode('traffic')}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
              mapMode === 'traffic' 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-950/40' 
                : 'bg-[#070B12] text-slate-400 border-[#1B2536] hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            Live Infrastructure
          </button>

          <div className="hidden md:flex items-center gap-2 pl-2 text-slate-500 text-[11px] border-l border-slate-800 ml-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-cyan-400 font-semibold">{activeLayerInfo}</span>
          </div>
        </div>

        {/* Search & Fullscreen */}
        <div className="flex items-center gap-2 flex-1 max-w-md justify-end">
          <div className="relative w-full max-w-[280px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search incident, sector, camera..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#070B12] border border-[#1B2536] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-[#070B12] border border-[#1B2536] hover:bg-slate-800 rounded-lg text-slate-300 transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Tactical View'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Live Leaflet Map (Left ~75%) + Intelligence & Incidents (Right ~25%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        
        {/* Left Map View */}
        <div className="lg:col-span-9 relative bg-[#070B12] border border-[#1B2536] rounded-2xl overflow-hidden shadow-2xl min-h-[480px] flex flex-col">
          
          {/* Live Leaflet Map Container */}
          <div 
            ref={mapRef} 
            className="w-full h-full min-h-[480px] flex-1 z-0" 
            style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : '480px' }}
          />

          {/* Left Vertical Map Floating Controls */}
          <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-20 font-mono">
            <button 
              onClick={handleZoomIn}
              className="w-8 h-8 bg-[#0A0F18]/90 hover:bg-[#0E1624] border border-[#1B2536] rounded-lg flex items-center justify-center text-white text-base font-bold shadow-lg cursor-pointer transition-colors"
              title="Zoom In"
            >
              +
            </button>
            <button 
              onClick={handleZoomOut}
              className="w-8 h-8 bg-[#0A0F18]/90 hover:bg-[#0E1624] border border-[#1B2536] rounded-lg flex items-center justify-center text-white text-base font-bold shadow-lg cursor-pointer transition-colors"
              title="Zoom Out"
            >
              −
            </button>
            <button 
              onClick={handleRecenter}
              className="w-8 h-8 bg-[#0A0F18]/90 hover:bg-[#0E1624] border border-[#1B2536] rounded-lg flex items-center justify-center text-cyan-400 shadow-lg mt-1 cursor-pointer transition-colors"
              title="Recenter Sector 4 (27.055°N, 88.455°E)"
            >
              <Crosshair className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                const modes: ('satellite' | 'terrain' | 'dark' | 'traffic')[] = ['satellite', 'dark', 'terrain', 'traffic'];
                const nextMode = modes[(modes.indexOf(mapMode) + 1) % modes.length];
                setMapMode(nextMode);
              }}
              className="w-8 h-8 bg-[#0A0F18]/90 hover:bg-[#0E1624] border border-[#1B2536] rounded-lg flex items-center justify-center text-slate-300 shadow-lg cursor-pointer transition-colors"
              title="Cycle Layers"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

          {/* Live Overlay Badge at Bottom Left */}
          <div className="absolute bottom-3 left-4 z-20 bg-[#0A0F18]/90 border border-[#1B2536] px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-mono shadow-xl backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-bold">RADAR TELEMETRY: ACTIVE</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-400">8 BOP CAMS • 2 FENCE ZONES</span>
          </div>

          {/* GPS Coordinates Live Box at Bottom Right */}
          <div className="absolute bottom-3 right-4 z-20 bg-[#0A0F18]/90 border border-[#1B2536] px-3 py-1.5 rounded-lg text-[10px] font-mono shadow-xl backdrop-blur-md text-slate-400 hidden sm:block">
            LAT: <span className="text-white font-bold">27.0550° N</span> • LON: <span className="text-white font-bold">88.4550° E</span> • ALT: <span className="text-cyan-400 font-bold">1,820m</span>
          </div>
        </div>

        {/* Right Intelligence & Incident Panels */}
        <div className="lg:col-span-3 space-y-4 flex flex-col justify-between">
          
          {/* Top: Map Intelligence & Legend Box */}
          <div className="bg-[#0A0F18] border border-[#1B2536] rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#1B2536] pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Map Intelligence
                </h2>
              </div>
              <button 
                onClick={handleRecenter}
                className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                <Crosshair className="w-3 h-3" />
                Recenter
              </button>
            </div>

            {/* Tactical Legend List */}
            <div className="space-y-2 text-xs font-mono">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Legend & Signals</span>
              
              <div className="flex items-center gap-2.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
                <span className="text-[11px]">Active Camera (7 Online)</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                <span className="text-[11px]">Offline Sentry (1 Cam)</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-red-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                </div>
                <span className="text-[11px]">Critical Threat Breach</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <span className="w-5 h-0.5 border-t-2 border-dashed border-cyan-400" />
                <span className="text-[11px]">UAV Patrol Flight Track</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <div className="w-3.5 h-2 bg-red-500/25 border border-red-500" />
                <span className="text-[11px]">Perimeter Polygon Fence</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <span className="w-5 h-0.5 border-t-2 border-dashed border-orange-500" />
                <span className="text-[11px]">International Border (IB)</span>
              </div>
            </div>
          </div>

          {/* Middle: Active Incidents Box */}
          <div className="bg-[#0A0F18] border border-[#1B2536] rounded-xl p-4 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#1B2536] pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    Active Incidents ({filteredIncidents.length})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Click to Fly</span>
              </div>

              {/* Incidents List */}
              <div className="space-y-2 font-mono text-xs">
                {filteredIncidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  return (
                    <div 
                      key={inc.id}
                      onClick={() => handleSelectIncident(inc)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected 
                          ? 'bg-red-950/30 border-red-500/70 shadow-lg shadow-red-950/40 ring-1 ring-red-500/30' 
                          : 'bg-[#070B12] border-[#1B2536] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                          inc.severity === 'CRITICAL' ? 'bg-red-500/15 text-red-400' :
                          inc.severity === 'HIGH' ? 'bg-amber-500/15 text-amber-400' :
                          'bg-blue-500/15 text-cyan-400'
                        }`}>
                          {inc.severity === 'CRITICAL' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                           inc.severity === 'HIGH' ? <Car className="w-3.5 h-3.5" /> :
                           <Users className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-200 text-[11px] truncate">{inc.type}</div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {inc.id} · Lat: {inc.lat}, Lon: {inc.lon}
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between">
              <span>GPS SYNC: SAT-104</span>
              <span className="text-emerald-400 font-bold">100% LOCK</span>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Row: Live Feeds (Left ~55%) + Movement Tracks (Middle ~20%) + Status Summary (Right ~25%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left: Live Camera Feeds (Sector 04) */}
        <div className="lg:col-span-7 bg-[#0A0F18] border border-[#1B2536] rounded-xl p-4 shadow-xl font-mono">
          <div className="flex items-center justify-between border-b border-[#1B2536] pb-2.5 mb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-bold text-white uppercase tracking-wider">
                Live Camera Feeds (Click to Focus on Map)
              </h3>
            </div>
            <button 
              onClick={handleRecenter}
              className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
            >
              Reset View →
            </button>
          </div>

          {/* 4 Camera Feed Cards Slider */}
          <div className="relative">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {CAMERAS_BOTTOM.map((cam) => (
                <div 
                  key={cam.id} 
                  onClick={() => handleSelectCamera(cam.id, cam.lat, cam.lon)}
                  className="relative rounded-lg overflow-hidden border border-[#1E293B] bg-black group cursor-pointer hover:border-cyan-500/70 transition-all hover:scale-[1.02]"
                >
                  <div className="aspect-[4/3] w-full">
                    <img 
                      src={cam.feed} 
                      alt={cam.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/feed-bop01.jpg'; }}
                    />
                  </div>

                  {/* Red LIVE badge */}
                  <div className="absolute top-1.5 right-1.5 px-1 py-0.2 bg-red-600 text-white rounded text-[8px] font-bold">
                    LIVE
                  </div>

                  {/* Bottom Camera Label */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/85 backdrop-blur-xs p-1.5 text-[10px]">
                    <div className="font-bold text-white truncate">{cam.id}</div>
                    <div className="text-slate-400 text-[9px] truncate">{cam.name}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Slider Dots */}
            <div className="flex items-center justify-center gap-1.5 mt-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
            </div>
          </div>
        </div>

        {/* Middle: Movement Tracks (Last 1 Hour) */}
        <div className="lg:col-span-2 bg-[#0A0F18] border border-[#1B2536] rounded-xl p-4 shadow-xl font-mono flex flex-col justify-between">
          <div className="flex items-center gap-1.5 border-b border-[#1B2536] pb-2.5 mb-2 text-xs">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <h3 className="font-bold text-white uppercase text-[11px] tracking-wider truncate">
              Movement Tracks
            </h3>
          </div>

          <div className="relative rounded-lg overflow-hidden border border-[#1E293B] aspect-video bg-slate-950 flex-1 flex items-center justify-center">
            <img 
              src="/map-movement-tracks.jpg" 
              alt="Movement Tracks"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/fences-intrusion-map.jpg'; }}
            />
          </div>
        </div>

        {/* Right: Status Summary */}
        <div className="lg:col-span-3 bg-[#0A0F18] border border-[#1B2536] rounded-xl p-4 shadow-xl font-mono flex flex-col justify-between">
          <div className="border-b border-[#1B2536] pb-2.5 mb-2 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider">
              Status Summary
            </h3>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-[#070B12] border border-[#1E293B] p-2 rounded-lg">
              <div className="text-xl font-black text-emerald-400">7</div>
              <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">Cameras Online</div>
            </div>

            <div className="bg-[#070B12] border border-[#1E293B] p-2 rounded-lg">
              <div className="text-xl font-black text-red-400">1</div>
              <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">Cameras Offline</div>
            </div>

            <div className="bg-[#070B12] border border-[#1E293B] p-2 rounded-lg">
              <div className="text-xl font-black text-orange-400">3</div>
              <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">Active Incidents</div>
            </div>

            <div className="bg-[#070B12] border border-[#1E293B] p-2 rounded-lg">
              <div className="text-xl font-black text-yellow-400">12</div>
              <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">Active Alerts</div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default MapIntelligence;

