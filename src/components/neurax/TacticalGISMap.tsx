import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  MapPin,
  Layers,
  Compass,
  Zap,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  GitFork,
  Navigation,
  Crosshair,
  Maximize2,
  Minimize2,
  Building2,
  ShieldCheck,
  Radio,
  Gauge,
  Activity
} from 'lucide-react';
import type { RoadSegment, JunctionNode } from '../../types/neurax';

interface TacticalGISMapProps {
  nodes: JunctionNode[];
  segments: RoadSegment[];
  onSelectRoad?: (segment: RoadSegment) => void;
  onTraceSpillback?: (segmentId: string) => void;
  onForecast?: (segmentId: string) => void;
  onPlanDiversion?: (segmentId: string) => void;
}

// Major Hyderabad Architectural & Transportation Landmarks
const HYDERABAD_ZONES = [
  { id: 'Z1', name: 'HITEC City & Cyber Towers', lat: 17.450, lon: 78.381, type: 'tech', color: '#38bdf8' },
  { id: 'Z2', name: 'Gachibowli Financial District', lat: 17.420, lon: 78.348, type: 'financial', color: '#818cf8' },
  { id: 'Z3', name: 'Outer Ring Road (ORR) North Arc', lat: 17.462, lon: 78.520, type: 'expressway', color: '#f59e0b' },
  { id: 'Z4', name: 'Durgam Cheruvu Inflow Corridor', lat: 17.433, lon: 78.390, type: 'bridge', color: '#a855f7' },
  { id: 'Z5', name: 'Madhapur Metro Corridor', lat: 17.442, lon: 78.398, type: 'transit', color: '#10b981' },
  { id: 'Z6', name: 'Jubilee Hills Road No. 36 Ingress', lat: 17.430, lon: 78.408, type: 'arterial', color: '#fb7185' }
];

export const TacticalGISMap: React.FC<TacticalGISMapProps> = ({
  nodes,
  segments,
  onSelectRoad,
  onTraceSpillback,
  onForecast,
  onPlanDiversion
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // States
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredSegment, setHoveredSegment] = useState<RoadSegment | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<RoadSegment | null>(null);
  const [mapStyle, setMapStyle] = useState<'cyber-dark' | 'satellite-neon' | 'heat-density'>('cyber-dark');
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showSignals, setShowSignals] = useState(true);
  const [showFlowVectors, setShowFlowVectors] = useState(true);
  const [crosshairPos, setCrosshairPos] = useState({ lat: 17.44, lon: 78.42 });

  // Compute geographical bounds (Hyderabad Metropolitan Region)
  const bounds = useMemo(() => {
    let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
    nodes.forEach((n) => {
      const lat = n.lat || (17.30 + (n.y * 0.016));
      const lon = n.lon || (78.35 + (n.x * 0.018));
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lon < minLon) minLon = lon;
      if (lon > maxLon) maxLon = lon;
    });
    return { minLat, maxLat, minLon, maxLon };
  }, [nodes]);

  const nodeGeoMap = useMemo(() => {
    const map = new Map<string, { lat: number; lon: number; is_signalized: boolean; id: string }>();
    nodes.forEach((n) => {
      map.set(n.node_id, {
        lat: n.lat || (17.30 + (n.y * 0.016)),
        lon: n.lon || (78.35 + (n.x * 0.018)),
        is_signalized: n.is_signalized,
        id: n.node_id
      });
    });
    return map;
  }, [nodes]);

  // Coordinate Projection to Canvas
  const projectToScreen = useCallback((lat: number, lon: number, width: number, height: number): [number, number] => {
    const pad = 60;
    const drawW = width - pad * 2;
    const drawH = height - pad * 2;

    const lonRatio = (lon - bounds.minLon) / (bounds.maxLon - bounds.minLon || 1);
    // Latitude inverted for screen Y
    const latRatio = (bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat || 1);

    const sx = pad + lonRatio * drawW;
    const sy = pad + latRatio * drawH;

    // Apply pan and zoom centered
    const cx = width / 2;
    const cy = height / 2;

    const finalX = (sx - cx) * zoom + cx + pan.x;
    const finalY = (sy - cy) * zoom + cy + pan.y;

    return [finalX, finalY];
  }, [bounds, pan, zoom]);

  // Screen to Lat/Lon inverse projection
  const screenToGeo = useCallback((screenX: number, screenY: number, width: number, height: number): [number, number] => {
    const pad = 60;
    const drawW = width - pad * 2;
    const drawH = height - pad * 2;
    const cx = width / 2;
    const cy = height / 2;

    const sx = (screenX - cx - pan.x) / zoom + cx;
    const sy = (screenY - cy - pan.y) / zoom + cy;

    const lonRatio = (sx - pad) / drawW;
    const latRatio = (sy - pad) / drawH;

    const lon = bounds.minLon + lonRatio * (bounds.maxLon - bounds.minLon);
    const lat = bounds.maxLat - latRatio * (bounds.maxLat - bounds.minLat);

    return [lat, lon];
  }, [bounds, pan, zoom]);

  // Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const render = () => {
      frame++;
      const w = canvas.width;
      const h = canvas.height;

      // 1. Clear background
      if (mapStyle === 'cyber-dark') {
        ctx.fillStyle = '#060b17';
      } else if (mapStyle === 'satellite-neon') {
        ctx.fillStyle = '#030712';
      } else {
        ctx.fillStyle = '#080c14';
      }
      ctx.fillRect(0, 0, w, h);

      // 2. Draw Architectural Grid & Sector Lines
      ctx.strokeStyle = mapStyle === 'cyber-dark' ? 'rgba(30, 41, 59, 0.45)' : 'rgba(15, 23, 42, 0.7)';
      ctx.lineWidth = 1;
      const gridSize = 40 * zoom;
      const offsetX = (pan.x + w / 2) % gridSize;
      const offsetY = (pan.y + h / 2) % gridSize;

      for (let x = offsetX; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = offsetY; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // 3. Draw Outer Ring Arc Contour (Metropolitan Beltway Highway)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
      ctx.lineWidth = 2.5 * zoom;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      const [orrX, orrY] = projectToScreen(17.38, 78.45, w, h);
      ctx.arc(orrX, orrY, 180 * zoom, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4. Draw Road Segments
      segments.forEach((seg) => {
        const u = nodeGeoMap.get(seg.source_node);
        const v = nodeGeoMap.get(seg.target_node);
        if (!u || !v) return;

        const [x1, y1] = projectToScreen(u.lat, u.lon, w, h);
        const [x2, y2] = projectToScreen(v.lat, v.lon, w, h);

        const isHover = hoveredSegment?.segment_id === seg.segment_id;
        const isSelected = selectedSegment?.segment_id === seg.segment_id;

        // Base color
        let stroke = '#1e293b';
        let lineWidth = seg.road_class === 'arterial' ? 2.8 : 1.8;

        if (mapStyle === 'heat-density') {
          // Heatmap mode
          const cong = Math.min(1, seg.queue_length_veh / 25);
          if (cong > 0.6) {
            stroke = `rgba(244, 63, 94, ${0.4 + cong * 0.5})`;
            lineWidth = 4.2;
          } else if (cong > 0.3) {
            stroke = `rgba(245, 158, 11, ${0.4 + cong * 0.5})`;
            lineWidth = 3.0;
          } else {
            stroke = 'rgba(16, 185, 129, 0.45)';
            lineWidth = 1.8;
          }
        } else {
          if (seg.ai_risk_level === 'CRITICAL') {
            stroke = '#f43f5e';
            lineWidth = 3.8;
          } else if (seg.ai_risk_level === 'ELEVATED') {
            stroke = '#f59e0b';
            lineWidth = 2.6;
          } else if (seg.speed_ratio > 0.75) {
            stroke = '#10b981';
            lineWidth = 2.0;
          } else {
            stroke = '#334155';
          }
        }

        if (isHover || isSelected) {
          stroke = '#38bdf8';
          lineWidth = 5.0;
        }

        ctx.strokeStyle = stroke;
        ctx.lineWidth = lineWidth * Math.max(0.7, zoom);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // 5. Animated Flow Vectors (moving pulse dots)
        if (showFlowVectors && seg.speed_kmh > 0) {
          const speedFactor = seg.ai_risk_level === 'CRITICAL' ? 0.004 : 0.015;
          const t = ((frame * speedFactor) + (parseInt(seg.segment_id.replace(/\D/g, ''), 10) * 0.1)) % 1;
          const px = x1 + (x2 - x1) * t;
          const py = y1 + (y2 - y1) * t;

          ctx.fillStyle = seg.ai_risk_level === 'CRITICAL' ? '#f43f5e' : '#38bdf8';
          ctx.beginPath();
          ctx.arc(px, py, 2.2 * Math.max(0.8, zoom), 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 6. Draw Signalized Junctions
      if (showSignals) {
        nodes.forEach((n) => {
          const u = nodeGeoMap.get(n.node_id);
          if (!u) return;
          const [sx, sy] = projectToScreen(u.lat, u.lon, w, h);

          if (u.is_signalized) {
            ctx.fillStyle = '#0284c7';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(sx, sy, 3.5 * Math.max(0.8, zoom), 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Pulsing ring
            const pulse = (frame % 60) / 60;
            ctx.strokeStyle = `rgba(56, 189, 248, ${1 - pulse})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(sx, sy, (3.5 + pulse * 6) * Math.max(0.8, zoom), 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(sx, sy, 1.8 * Math.max(0.8, zoom), 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // 7. Draw Architectural Landmarks
      if (showLandmarks) {
        HYDERABAD_ZONES.forEach((lm) => {
          const [lx, ly] = projectToScreen(lm.lat, lm.lon, w, h);

          // Landmark Beacon Icon / Ring
          ctx.fillStyle = lm.color;
          ctx.beginPath();
          ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = lm.color;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(lx, ly, 8, 0, Math.PI * 2);
          ctx.stroke();

          // Label
          ctx.fillStyle = '#f8fafc';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(lm.name, lx + 12, ly + 3);
        });
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [segments, nodes, mapStyle, showLandmarks, showSignals, showFlowVectors, projectToScreen, nodeGeoMap, hoveredSegment, selectedSegment, pan, zoom]);

  // Handle Resize of canvas
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse pan & zoom handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const [geoLat, geoLon] = screenToGeo(mx, my, canvas.width, canvas.height);
    setCrosshairPos({ lat: Math.round(geoLat * 1000) / 1000, lon: Math.round(geoLon * 1000) / 1000 });

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
      return;
    }

    // Hover hit-test
    let closestSeg: RoadSegment | null = null;
    let minDist = 12;

    segments.forEach((seg) => {
      const u = nodeGeoMap.get(seg.source_node);
      const v = nodeGeoMap.get(seg.target_node);
      if (!u || !v) return;

      const [x1, y1] = projectToScreen(u.lat, u.lon, canvas.width, canvas.height);
      const [x2, y2] = projectToScreen(v.lat, v.lon, canvas.width, canvas.height);

      // Distance from point (mx, my) to line segment
      const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
      if (l2 === 0) return;
      const t = Math.max(0, Math.min(1, ((mx - x1) * (x2 - x1) + (my - y1) * (y2 - y1)) / l2));
      const projX = x1 + t * (x2 - x1);
      const projY = y1 + t * (y2 - y1);
      const dist = Math.sqrt((mx - projX) ** 2 + (my - projY) ** 2);

      if (dist < minDist) {
        minDist = dist;
        closestSeg = seg;
      }
    });

    setHoveredSegment(closestSeg);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((z) => Math.max(0.7, Math.min(4.5, z + delta)));
  };

  const handleCanvasClick = () => {
    if (hoveredSegment) {
      setSelectedSegment(hoveredSegment);
      onSelectRoad?.(hoveredSegment);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl select-none">
      {/* 2D Vector Architectural Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Top Floating Glassmorphic Control Bar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-3 pointer-events-none flex-wrap">
        {/* Left Title & Status */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-2xl shadow-xl pointer-events-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">Tactical GIS Corridor Scope</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Hyderabad Metropolitan Arc
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
              <span>{crosshairPos.lat}° N</span>
              <span>{crosshairPos.lon}° E</span>
              <span>•</span>
              <span className="text-slate-300">Scale: {Math.round(zoom * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Center GIS Mode Toggles */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 p-1 rounded-2xl shadow-xl pointer-events-auto flex items-center gap-1 text-xs">
          <button
            onClick={() => setMapStyle('cyber-dark')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${mapStyle === 'cyber-dark' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
          >
            Cyber Dark
          </button>
          <button
            onClick={() => setMapStyle('heat-density')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${mapStyle === 'heat-density' ? 'bg-rose-500 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
          >
            Density Heatmap
          </button>
          <button
            onClick={() => setMapStyle('satellite-neon')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${mapStyle === 'satellite-neon' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
          >
            Tactical Vector
          </button>
        </div>

        {/* Right Zoom Controls */}
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-2xl shadow-xl pointer-events-auto flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(4.5, z + 0.25))}
            title="Zoom In"
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.25))}
            title="Zoom Out"
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            title="Reset Scope"
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Floating Legend & Layer Filter Toggles */}
      <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 p-2.5 rounded-2xl flex items-center gap-4 shadow-xl pointer-events-auto">
        <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
          <input
            type="checkbox"
            checked={showLandmarks}
            onChange={(e) => setShowLandmarks(e.target.checked)}
            className="rounded text-emerald-500 bg-slate-800 border-slate-700"
          />
          <span>Metro Landmarks</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
          <input
            type="checkbox"
            checked={showSignals}
            onChange={(e) => setShowSignals(e.target.checked)}
            className="rounded text-cyan-500 bg-slate-800 border-slate-700"
          />
          <span>Junction Signals</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer hover:text-white">
          <input
            type="checkbox"
            checked={showFlowVectors}
            onChange={(e) => setShowFlowVectors(e.target.checked)}
            className="rounded text-indigo-500 bg-slate-800 border-slate-700"
          />
          <span>Flow Vectors</span>
        </label>
      </div>

      {/* Hovered or Selected Inspector Card */}
      {(hoveredSegment || selectedSegment) && (
        <div className="absolute bottom-3 right-3 bg-slate-900/95 backdrop-blur-xl border border-slate-700 text-white p-4 rounded-3xl shadow-2xl w-80 pointer-events-auto space-y-3 z-30 animate-fadeIn">
          {(() => {
            const seg = hoveredSegment || selectedSegment!;
            return (
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700">
                    {seg.segment_id}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      seg.ai_risk_level === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : seg.ai_risk_level === 'ELEVATED'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {seg.ai_risk_level}
                  </span>
                </div>

                <div className="text-xs text-slate-300 mt-2">
                  Corridor {seg.source_node} → {seg.target_node} ({seg.road_class})
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Speed</span>
                    <div className="font-bold text-white text-sm">
                      {seg.speed_kmh} / {seg.free_flow_speed_kmh} km/h
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold">Queue Length</span>
                    <div className="font-bold text-rose-400 text-sm">
                      {seg.queue_length_veh} veh
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-slate-800">
                  <button
                    onClick={() => onForecast?.(seg.segment_id)}
                    className="py-1.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Forecast</span>
                  </button>
                  <button
                    onClick={() => onTraceSpillback?.(seg.segment_id)}
                    className="py-1.5 px-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                  >
                    <Layers className="w-3 h-3" />
                    <span>Spillback</span>
                  </button>
                  <button
                    onClick={() => onPlanDiversion?.(seg.segment_id)}
                    className="py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm transition-all"
                  >
                    <GitFork className="w-3 h-3" />
                    <span>Reroute</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
