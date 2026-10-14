import React from 'react';
import {
  X,
  Gauge,
  Car,
  Activity,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Sparkles,
  Layers,
  GitFork,
  ShieldAlert,
  Zap,
  ArrowRight,
  TrendingDown,
  Clock,
  Compass,
  Radio,
  Sliders
} from 'lucide-react';
import type { RoadSegment } from '../../types/neurax';

interface RoadDetailModalProps {
  segment: RoadSegment | null;
  onClose: () => void;
  onForecast: (segmentId: string) => void;
  onTraceSpillback: (segmentId: string) => void;
  onPlanDiversion: (segmentId: string) => void;
}

export const RoadDetailModal: React.FC<RoadDetailModalProps> = ({
  segment,
  onClose,
  onForecast,
  onTraceSpillback,
  onPlanDiversion
}) => {
  if (!segment) return null;

  const isCritical = segment.ai_risk_level === 'CRITICAL';
  const isElevated = segment.ai_risk_level === 'ELEVATED';

  // Kinematic calculations
  const travelTimeMin = Math.round((segment.length_km / Math.max(1, segment.speed_kmh)) * 60 * 10) / 10;
  const freeFlowTimeMin = Math.round((segment.length_km / (segment.free_flow_speed_kmh || 50)) * 60 * 10) / 10;
  const delayMinutes = Math.max(0, Math.round((travelTimeMin - freeFlowTimeMin) * 10) / 10);
  const queueLengthMeters = Math.round(segment.queue_length_veh * 7.5);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-fadeIn text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-sm font-black text-cyan-400 shadow-inner">
              {segment.segment_id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Corridor Diagnostic Spatial Inspector
                </h3>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    isCritical
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : isElevated
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {segment.ai_risk_level}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>Junction {segment.source_node}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span>Junction {segment.target_node}</span>
                <span>•</span>
                <span className="capitalize font-semibold text-slate-300">{segment.road_class} Highway</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Telemetry Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/70">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Current Velocity</span>
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-black text-white mt-1">
              {segment.speed_kmh}{' '}
              <span className="text-xs font-normal text-slate-400">/ {segment.free_flow_speed_kmh} km/h</span>
            </div>
            <div className="text-[11px] font-mono text-cyan-400 mt-1 flex items-center gap-1">
              <span>Ratio:</span>
              <span className="font-bold">{Math.round(segment.speed_ratio * 100)}%</span>
              <span className="text-slate-500">({segment.speed_ratio < 0.4 ? 'Degraded' : 'Nominal'})</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/70">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Flow Throughput</span>
              <Car className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-xl font-black text-white mt-1">
              {segment.flow_vph}{' '}
              <span className="text-xs font-normal text-slate-400">vph</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Cap: <span className="text-slate-200 font-bold">{segment.capacity_vph}</span> vph (V/C {Math.round((segment.flow_vph / (segment.capacity_vph || 1)) * 100)}%)
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/70">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Physical Queue</span>
              <Activity className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-black text-rose-400 mt-1">
              {segment.queue_length_veh}{' '}
              <span className="text-xs font-normal text-slate-400">veh</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Tailback: <span className="text-rose-300 font-bold">{queueLengthMeters}m</span> ({delayMinutes}m delay)
            </div>
          </div>
        </div>

        {/* Physical & Spatial Characteristics */}
        <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-2.5 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-300">
            <span>Geometric & Kinematic Model:</span>
            <span className="text-[11px] font-mono text-cyan-400">BPR Alpha=0.15 Beta=4.0</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Lanes</div>
              <div className="font-extrabold text-white text-sm mt-0.5">{segment.lanes} Active</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Length</div>
              <div className="font-extrabold text-white text-sm mt-0.5">{segment.length_km} km</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Free Travel</div>
              <div className="font-extrabold text-white text-sm mt-0.5">{freeFlowTimeMin} min</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Current Travel</div>
              <div className="font-extrabold text-amber-400 text-sm mt-0.5">{travelTimeMin} min</div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {segment.structural_bottleneck === 1 && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Structural Bottleneck (Capacity Deficit)
              </span>
            )}
            {segment.is_anomaly && (
              <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-bold flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Detector Anomaly Calibrated
              </span>
            )}
          </div>
        </div>

        {/* AI Action Advisory & Neural Policy */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-800/50 space-y-1.5 text-xs">
          <div className="font-bold text-cyan-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Neura-X Autonomous Policy Recommendation:</span>
          </div>
          <p className="text-slate-200 font-semibold leading-relaxed">{segment.ai_action}</p>
          <p className="text-cyan-400/80 text-[11px] font-mono">{segment.ai_trend}</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              onForecast(segment.segment_id);
            }}
            className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate Forecast</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onTraceSpillback(segment.segment_id);
            }}
            className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Spillback Wave</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onPlanDiversion(segment.segment_id);
            }}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Deploy Reroute</span>
          </button>
        </div>
      </div>
    </div>
  );
};
