import React from 'react';
import type { LocationTrafficAnalysis } from '../services/trafficService';
import {
  Car,
  Gauge,
  Clock,
  Video,
  AlertTriangle,
  Route,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  MapPin,
  Compass,
  Radio,
  Globe2,
  Activity,
  Layers
} from 'lucide-react';

interface TrafficLocationReportProps {
  result: LocationTrafficAnalysis;
  coords: { lat: number; lng: number };
  onHighlightBypass?: () => void;
}

export const TrafficLocationReport: React.FC<TrafficLocationReportProps> = ({
  result,
  coords,
  onHighlightBypass
}) => {
  const getBadgeStyle = (condition: string) => {
    switch (condition) {
      case 'gridlock':
        return 'bg-red-500/10 text-red-600 border-red-200';
      case 'heavy':
        return 'bg-amber-500/10 text-amber-600 border-amber-200';
      case 'moderate':
        return 'bg-blue-500/10 text-blue-600 border-blue-200';
      default:
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
    }
  };

  const geo = result.pinpointGeo;

  return (
    <div className="p-6 space-y-6 text-slate-800">
      {/* Pinpoint Geolocation Intelligence Card */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-xl space-y-4 border border-indigo-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400">
              Pinpoint Geolocation Mapped
            </span>
          </div>
          {geo?.countryCode && (
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-mono font-bold text-white tracking-wider border border-white/10">
              {geo.countryCode} • {geo.country}
            </span>
          )}
        </div>

        {/* Location Name & Hierarchy */}
        <div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-black text-white leading-tight">
                {geo?.pinpointTitle || result.locationName}
              </h3>
              <p className="text-xs text-indigo-200/80 font-medium mt-1 leading-relaxed">
                {geo?.formattedAddress || result.locationName}
              </p>
            </div>
          </div>
        </div>

        {/* Pinpoint Geographic Meta Chips */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-[11px]">
          <div className="bg-white/5 p-2 rounded-xl border border-white/5 space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400" />
              Pinpoint Coordinates
            </span>
            <p className="font-mono font-bold text-white text-[11px] truncate">
              {coords.lat >= 0 ? `${coords.lat.toFixed(4)}°N` : `${Math.abs(coords.lat).toFixed(4)}°S`},{' '}
              {coords.lng >= 0 ? `${coords.lng.toFixed(4)}°E` : `${Math.abs(coords.lng).toFixed(4)}°W`}
            </p>
          </div>

          <div className="bg-white/5 p-2 rounded-xl border border-white/5 space-y-0.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-400" />
              Terrain & Corridor Class
            </span>
            <p className="font-bold text-amber-200 text-[11px] truncate">
              {geo?.terrainType || 'Regional Corridor'}
            </p>
          </div>

          {geo?.roadOrCorridor && (
            <div className="bg-white/5 p-2 rounded-xl border border-white/5 space-y-0.5 col-span-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 text-indigo-400" />
                Target Corridor Route
              </span>
              <p className="font-bold text-white text-[11px] truncate">
                {geo.roadOrCorridor}
              </p>
            </div>
          )}
        </div>

        {/* Plus Code & Timezone */}
        {(geo?.plusCode || geo?.timeZone) && (
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
            {geo.plusCode && <span>PlusCode: {geo.plusCode}</span>}
            {geo.timeZone && <span>TZ: {geo.timeZone}</span>}
          </div>
        )}
      </div>

      {/* Traffic Status & Metrics Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">
            Real-Time Corridor Telemetry
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getBadgeStyle(
              result.condition
            )}`}
          >
            {result.condition} Flow
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <Gauge className="w-4 h-4 text-blue-600 mx-auto mb-1.5" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Speed
            </span>
            <span className="text-base font-black text-slate-900">{result.speedKmh} km/h</span>
            <span className="text-[9px] font-semibold text-slate-400 block mt-0.5">
              Limit {result.speedLimitKmh || 80} km/h
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <Car className="w-4 h-4 text-amber-600 mx-auto mb-1.5" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Congestion
            </span>
            <span className="text-base font-black text-slate-900">
              {result.congestionPercentage}%
            </span>
            <span className="text-[9px] font-semibold text-slate-400 block mt-0.5">
              Flow Index
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
            <Clock className="w-4 h-4 text-rose-600 mx-auto mb-1.5" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Est. Delay
            </span>
            <span className="text-base font-black text-slate-900">+{result.delayMinutes}m</span>
            <span className="text-[9px] font-semibold text-slate-400 block mt-0.5">
              Corridor Delay
            </span>
          </div>
        </div>
      </div>

      {/* Sensor & Telemetry Health */}
      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-bold text-slate-700">
            {result.cctvCount} Live CCTV Feeds
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-slate-500">
          <span className="text-emerald-600">Health: {result.opticalSensorHealth || 98}%</span>
          <span>Latency: {result.telemetryLatencyMs || 34}ms</span>
        </div>
      </div>

      {/* Optical & Telemetry Summary */}
      <div className="space-y-2">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-600" />
          Pinpoint Situational Briefing
        </h4>
        <p className="text-xs text-slate-600 font-medium leading-relaxed bg-blue-50/50 p-4 rounded-2xl border border-blue-100/60">
          {result.summary}
        </p>
      </div>

      {/* Active Incidents on Corridor */}
      {result.incidents && result.incidents.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            Localized Incidents ({result.incidents.length})
          </h4>
          <div className="space-y-2.5">
            {result.incidents.map((inc) => (
              <div
                key={inc.id}
                className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="text-xs font-black text-slate-900">{inc.type}</h5>
                    <p className="text-[11px] text-slate-500 font-semibold">{inc.locationName}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      inc.severity === 'Critical'
                        ? 'bg-red-100 text-red-700'
                        : inc.severity === 'Major'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {inc.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-normal">{inc.description}</p>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  {inc.laneBlocked ? (
                    <div className="flex items-center gap-1.5 font-bold text-amber-600">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Impact: {inc.laneBlocked}</span>
                    </div>
                  ) : <span />}
                  <span className="font-mono text-[10px] text-slate-400">
                    {inc.lat.toFixed(4)}°, {inc.lon.toFixed(4)}°
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Bypass Route */}
      {result.bypassRoute && (
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
              <Route className="w-4 h-4 text-emerald-600" />
              <span>Localized Smart Bypass</span>
            </div>
            {onHighlightBypass && (
              <button
                type="button"
                onClick={onHighlightBypass}
                className="text-[11px] font-black text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
              >
                Inspect <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <p className="text-xs font-medium text-emerald-900">{result.bypassRoute}</p>
        </div>
      )}

      {/* Corridor Protocols */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Local Dispatch Protocols
          </h4>
          <div className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex items-start gap-2 text-xs font-semibold text-slate-700 p-2.5 bg-slate-50 rounded-xl"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

