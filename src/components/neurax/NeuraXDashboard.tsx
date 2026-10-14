import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  Route,
  Network,
  TrendingUp,
  Layers,
  GitFork,
  HeartPulse,
  Building2,
  ShieldAlert,
  Calendar,
  Video,
  Radar,
  Globe,
  FileText,
  LogOut,
  Radio,
  Sparkles,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  Search,
  Bell,
  Cpu,
  Award,
  Clock,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Box
} from 'lucide-react';
import { neuraxEngine } from '../../services/neuraxService';
import type { RoadSegment, TrafficRegime } from '../../types/neurax';

import { KPIRibbon } from './KPIRibbon';
import { AIBriefingCard } from './AIBriefingCard';
import { CriticalAlertsCard } from './CriticalAlertsCard';
import { RoadsIntelligenceView } from './RoadsIntelligenceView';
import { NetworkTopologyMap } from './NetworkTopologyMap';
import { ForecastView } from './ForecastView';
import { SpillbackView } from './SpillbackView';
import { DiversionView } from './DiversionView';
import { EmergencyView } from './EmergencyView';
import { InfrastructureView } from './InfrastructureView';
import { ResilienceView } from './ResilienceView';
import { WeeklyView } from './WeeklyView';
import { TrainedModelView } from './TrainedModelView';
import { RoadDetailModal } from './RoadDetailModal';

export type NeuraXTab =
  | 'overview'
  | 'roads'
  | 'topology'
  | 'forecast'
  | 'trained-models'
  | 'spillback'
  | 'diversion'
  | 'emergency'
  | 'infrastructure'
  | 'resilience'
  | 'weekly';

interface NeuraXDashboardProps {
  onSwitchToCCTV?: () => void;
  onSwitchToRadar?: () => void;
  onSwitchToGlobe?: () => void;
  onSwitchToReports?: () => void;
  onLogout?: () => void;
}

export const NeuraXDashboard: React.FC<NeuraXDashboardProps> = ({
  onSwitchToCCTV,
  onSwitchToRadar,
  onSwitchToGlobe,
  onSwitchToReports,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<NeuraXTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedRoadForModal, setSelectedRoadForModal] = useState<RoadSegment | null>(null);

  // Cross-view context target
  const [contextSegmentId, setContextSegmentId] = useState<string>('R0435');

  // Traffic operational regime state
  const [activeRegime, setActiveRegime] = useState<TrafficRegime>(() => neuraxEngine.getRegime());
  const regimes = useMemo(() => neuraxEngine.getAvailableRegimes(), []);

  useEffect(() => {
    const unsub = neuraxEngine.onRegimeChange((newRegime) => {
      setActiveRegime(newRegime);
    });
    return unsub;
  }, []);

  // Engine data reactive to regime changes
  const kpis = useMemo(() => neuraxEngine.getCityKPIs(), [activeRegime]);
  const criticalSegments = useMemo(() => neuraxEngine.getCriticalSegments(), [activeRegime]);

  const activeRegimeInfo = useMemo(() => {
    return regimes.find((r) => r.id === activeRegime) || regimes[0];
  }, [regimes, activeRegime]);

  // Action switches
  const handleTraceSpillback = (segId: string) => {
    setContextSegmentId(segId);
    setActiveTab('spillback');
  };

  const handlePlanDiversion = (segId: string) => {
    setContextSegmentId(segId);
    setActiveTab('diversion');
  };

  const handleForecast = (segId: string) => {
    setContextSegmentId(segId);
    setActiveTab('forecast');
  };

  const handleSelectRoad = (seg: RoadSegment) => {
    setSelectedRoadForModal(seg);
  };

  const navItems = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
    { id: 'trained-models', label: 'Trained Models & Benchmarks', icon: Cpu, badge: 'Pre-Trained' },
    { id: 'roads', label: '436 Roads Directory', icon: Route, badge: '436' },
    { id: 'topology', label: '3D Spatial Topology', icon: Box, badge: '3D Scope' },
    { id: 'forecast', label: 'Traffic Predictor', icon: TrendingUp },
    { id: 'spillback', label: 'Spillback Engine', icon: Layers, alert: criticalSegments.length },
    { id: 'diversion', label: 'Diversion Planning', icon: GitFork },
    { id: 'emergency', label: 'Green Wave Corridor', icon: HeartPulse, priority: true },
    { id: 'infrastructure', label: 'Infra Planner (BPR)', icon: Building2, badge: '90' },
    { id: 'resilience', label: 'Resilience Simulator', icon: ShieldAlert },
    { id: 'weekly', label: 'Weekly Patterns', icon: Calendar }
  ];

  return (
    <div id="neurax-dashboard" className="h-full w-full max-h-screen bg-slate-100 flex flex-col overflow-hidden font-sans text-slate-800">
      {/* Top Universal App Navigation Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 shrink-0 z-40 px-4 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('overview')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-base shadow-sm">
              NX
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-tight flex items-center gap-2">
                <span>Neura-X Traffic Intelligence</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v2.4 Active
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Connected to MargaNetra Integrated Traffic OS
              </div>
            </div>
          </div>
        </div>

        {/* Center Operational Regime Selector & Live Badge - Visible ONLY on relevant live operational pages */}
        {['overview', 'roads', 'topology', 'forecast', 'spillback', 'diversion', 'emergency'].includes(activeTab) ? (
          <div className="hidden md:flex items-center gap-2 text-xs animate-fadeIn">
            <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-xl p-1 gap-1">
              {regimes.map((reg) => {
                const isSelected = reg.id === activeRegime;
                return (
                  <button
                    key={reg.id}
                    onClick={() => neuraxEngine.setRegime(reg.id)}
                    title={reg.description}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                    }`}
                  >
                    {reg.id === 'PEAK_AM' && <Sunrise className="w-3 h-3" />}
                    {reg.id === 'MIDDAY' && <Sun className="w-3 h-3" />}
                    {reg.id === 'PEAK_PM' && <Sunset className="w-3 h-3" />}
                    {reg.id === 'LATE_NIGHT' && <Moon className="w-3 h-3" />}
                    <span>{reg.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold">{kpis.network_health_score}% Health</span>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs animate-fadeIn">
            <div className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-300 font-medium text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>
                {activeTab === 'infrastructure' && 'Strategic Capital Project Horizon (2026–2030) • BPR Model'}
                {activeTab === 'trained-models' && 'Offline Neural Benchmark Evaluation • 2.6M Sensor Records'}
                {activeTab === 'weekly' && 'City-Wide 7-Day Macro Profile & Peak Demand Analysis'}
                {activeTab === 'resilience' && 'Critical Corridor Stress-Testing & Network Resilience Engine'}
              </span>
            </div>
          </div>
        )}

        {/* Right View Switchers */}
        <div className="flex items-center gap-2">
          {onSwitchToCCTV && (
            <button
              id="btn-switch-cctv"
              onClick={onSwitchToCCTV}
              title="Switch to live optical highway video stream with AI detection"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Video className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Highway CCTV</span>
            </button>
          )}

          {onSwitchToRadar && (
            <button
              id="btn-switch-radar"
              onClick={onSwitchToRadar}
              title="Switch to Google Maps radar view"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Radar className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Live Radar</span>
            </button>
          )}

          {onSwitchToGlobe && (
            <button
              id="btn-switch-globe"
              onClick={onSwitchToGlobe}
              title="Switch to 3D Earth Globe view"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">3D Globe</span>
            </button>
          )}

          {onSwitchToReports && (
            <button
              id="btn-switch-reports"
              onClick={onSwitchToReports}
              title="City Traffic Analytics Report"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">City Health</span>
            </button>
          )}

          {onLogout && (
            <button
              id="btn-logout"
              onClick={onLogout}
              title="Sign out of Officer Portal"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace: Sidebar + Dynamic Panel */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={`w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-all z-30 h-full overflow-hidden ${
            mobileMenuOpen
              ? 'fixed inset-y-12 left-0 z-50 shadow-2xl block'
              : 'hidden md:flex'
          }`}
        >
          <div className="p-3 space-y-1 overflow-y-auto flex-1 min-h-0">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Intelligence Modules
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id as NeuraXTab);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.priority ? 'text-rose-600' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? 'bg-blue-700 text-blue-100'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.alert !== undefined && item.alert > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* User Badge Footer */}
          <div className="p-3 border-t border-slate-200 bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                OP
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  Traffic Control Center
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  Metropolitan Command Unit
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Central Content Canvas */}
        <main className="flex-1 min-h-0 p-4 md:p-6 pb-28 overflow-y-auto space-y-5">
          {/* 1. Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Executive KPI Ribbon */}
              <KPIRibbon
                kpis={kpis}
                onSelectBottlenecks={() => setActiveTab('roads')}
                onSelectIncidents={() => setActiveTab('spillback')}
              />

              {/* Grid: AI Briefing & Critical Incidents */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AIBriefingCard
                  activeSegmentId={contextSegmentId}
                  onSelectSegment={(id) => setContextSegmentId(id)}
                />
                <CriticalAlertsCard
                  criticalSegments={criticalSegments}
                  onSelectSegment={(id) => setContextSegmentId(id)}
                  onTraceSpillback={handleTraceSpillback}
                  onPlanDiversion={handlePlanDiversion}
                  onForecast={handleForecast}
                />
              </div>

              {/* Topology Map Preview */}
              <NetworkTopologyMap
                onSelectRoad={handleSelectRoad}
                onTraceSpillback={handleTraceSpillback}
                onForecast={handleForecast}
                onPlanDiversion={handlePlanDiversion}
              />
            </div>
          )}

          {/* 2. Roads Intelligence Directory */}
          {activeTab === 'roads' && (
            <div className="animate-fadeIn">
              <RoadsIntelligenceView
                onSelectRoad={handleSelectRoad}
                onTraceSpillback={handleTraceSpillback}
                onPlanDiversion={handlePlanDiversion}
                onForecast={handleForecast}
              />
            </div>
          )}

          {/* 3. Topology Map Full */}
          {activeTab === 'topology' && (
            <div className="animate-fadeIn">
              <NetworkTopologyMap
                onSelectRoad={handleSelectRoad}
                onTraceSpillback={handleTraceSpillback}
                onForecast={handleForecast}
                onPlanDiversion={handlePlanDiversion}
              />
            </div>
          )}

          {/* 4. Forecast View */}
          {activeTab === 'forecast' && (
            <div className="animate-fadeIn">
              <ForecastView
                initialSegmentId={contextSegmentId}
                onTraceSpillback={handleTraceSpillback}
                onPlanDiversion={handlePlanDiversion}
              />
            </div>
          )}

          {/* Pre-Trained Models & Empirical Benchmarks View */}
          {activeTab === 'trained-models' && (
            <div className="animate-fadeIn">
              <TrainedModelView />
            </div>
          )}

          {/* 5. Spillback View */}
          {activeTab === 'spillback' && (
            <div className="animate-fadeIn">
              <SpillbackView
                initialSegmentId={contextSegmentId}
                onPlanDiversion={handlePlanDiversion}
                onForecast={handleForecast}
              />
            </div>
          )}

          {/* 6. Diversion View */}
          {activeTab === 'diversion' && (
            <div className="animate-fadeIn">
              <DiversionView
                initialSegmentId={contextSegmentId}
                onTraceSpillback={handleTraceSpillback}
              />
            </div>
          )}

          {/* 7. Emergency Green Wave View */}
          {activeTab === 'emergency' && (
            <div className="animate-fadeIn">
              <EmergencyView />
            </div>
          )}

          {/* 8. Infrastructure Planner View */}
          {activeTab === 'infrastructure' && (
            <div className="animate-fadeIn">
              <InfrastructureView />
            </div>
          )}

          {/* 9. Resilience Simulator View */}
          {activeTab === 'resilience' && (
            <div className="animate-fadeIn">
              <ResilienceView />
            </div>
          )}

          {/* 10. Weekly Patterns View */}
          {activeTab === 'weekly' && (
            <div className="animate-fadeIn">
              <WeeklyView />
            </div>
          )}
        </main>
      </div>

      {/* Road Inspection Modal */}
      {selectedRoadForModal && (
        <RoadDetailModal
          segment={selectedRoadForModal}
          onClose={() => setSelectedRoadForModal(null)}
          onForecast={handleForecast}
          onTraceSpillback={handleTraceSpillback}
          onPlanDiversion={handlePlanDiversion}
        />
      )}
    </div>
  );
};
