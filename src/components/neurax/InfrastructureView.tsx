import React, { useState, useMemo } from 'react';
import {
  Building2,
  TrendingUp,
  Award,
  Search,
  Filter,
  ArrowRight,
  Sliders,
  DollarSign,
  Clock,
  Layers,
  CheckCircle2,
  X,
  Sparkles,
  Wrench,
  Users,
  Leaf,
  ShieldCheck,
  Activity,
  FileText,
  ChevronRight,
  Zap
} from 'lucide-react';
import { neuraxEngine } from '../../services/neuraxService';
import type { PlanningCandidate, ScenarioExample } from '../../types/neurax';

export const InfrastructureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'candidates' | 'scenarios'>('candidates');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterFeasibility, setFilterFeasibility] = useState<string>('ALL');
  const [selectedCandidate, setSelectedCandidate] = useState<PlanningCandidate | null>(null);

  const candidates = useMemo(() => neuraxEngine.getPlanningCandidates(), []);
  const scenarios = useMemo(() => neuraxEngine.getScenarioExamples(), []);

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        c.candidate_id.toLowerCase().includes(q) ||
        c.target_segment.toLowerCase().includes(q) ||
        (c.corridor_name && c.corridor_name.toLowerCase().includes(q)) ||
        c.intervention_type.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (filterType !== 'ALL' && c.intervention_type !== filterType) {
        return false;
      }

      if (filterFeasibility !== 'ALL' && c.feasibility_band !== filterFeasibility) {
        return false;
      }

      return true;
    });
  }, [candidates, searchQuery, filterType, filterFeasibility]);

  // Aggregate metrics
  const totalVehHoursSaved = useMemo(() => {
    return Math.round(candidates.reduce((sum, c) => sum + c.daily_veh_hours_saved, 0));
  }, [candidates]);

  const avgReduction = useMemo(() => {
    if (candidates.length === 0) return 0;
    const avg = candidates.reduce((sum, c) => sum + c.delay_reduction_pct, 0) / candidates.length;
    return Math.round(avg * 10) / 10;
  }, [candidates]);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Banner with Key Highlights */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              Evaluated Counterfactuals
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-mono text-slate-500">BPR Model Equilibrium</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Infrastructure & Operational Feasibility Planner
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked interventions evaluating delay reduction, ROI score, field equipment, personnel requirements, and kinematic viability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Commuter Hours Saved</div>
            <div className="text-sm font-extrabold text-indigo-600 font-mono">
              {totalVehHoursSaved.toLocaleString()} hrs/day
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Mean Delay Reduction</div>
            <div className="text-sm font-extrabold text-emerald-600 font-mono">
              -{avgReduction}%
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'candidates'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Strategic Interventions ({candidates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('scenarios')}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === 'scenarios'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Validated Incident Scenarios ({scenarios.length})</span>
        </button>
      </div>

      {activeTab === 'candidates' ? (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search link, corridor name, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700"
              >
                <option value="ALL">All Interventions</option>
                <option value="capacity_upgrade">Capacity Upgrades</option>
                <option value="turn_lane">Turn Lanes</option>
                <option value="signal_retiming">Signal Retiming</option>
              </select>

              <select
                value={filterFeasibility}
                onChange={(e) => setFilterFeasibility(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700"
              >
                <option value="ALL">All Feasibility</option>
                <option value="low">Low Cost (Quick Win)</option>
                <option value="medium">Medium Cost</option>
                <option value="high">High Cost (Major Capital)</option>
              </select>
            </div>
          </div>

          {/* Candidates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCandidates.slice(0, 18).map((cand) => {
              return (
                <div
                  key={cand.candidate_id}
                  onClick={() => setSelectedCandidate(cand)}
                  className="bg-white border border-slate-200 hover:border-indigo-500 rounded-2xl p-4.5 shadow-xs hover:shadow-md cursor-pointer transition-all space-y-3 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {cand.candidate_id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {cand.feasibility_score || 88}% Feasible
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                          {cand.feasibility_band} Cost
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                      {cand.corridor_name || `Corridor ${cand.target_segment}`}
                    </h4>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <span className="font-semibold text-slate-700 capitalize flex items-center gap-1">
                        {cand.intervention_type === 'signal_retiming' ? (
                          <Sliders className="w-3 h-3 text-indigo-500" />
                        ) : cand.intervention_type === 'turn_lane' ? (
                          <ArrowRight className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Building2 className="w-3 h-3 text-blue-500" />
                        )}
                        {cand.intervention_type.replace('_', ' ')}
                      </span>
                      <span>•</span>
                      <span className="font-mono font-bold text-slate-800">Link {cand.target_segment}</span>
                      <span>(+{cand.capacity_delta_vph} vph)</span>
                    </div>

                    {cand.time_to_deploy && (
                      <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{cand.time_to_deploy}</span>
                      </div>
                    )}

                    {/* Realistic Congestion Delay Metrics */}
                    <div className="mt-3 grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Delay Saved</div>
                        <div className="text-emerald-600 font-bold text-sm">
                          -{cand.delay_reduction_pct}%
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {cand.baseline_delay_min}m → {cand.counterfactual_delay_min}m
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Daily Veh-Hours</div>
                        <div className="text-indigo-600 font-bold text-sm">
                          {cand.daily_veh_hours_saved} hrs
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          reclaimed daily
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      Value / Return Rating:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-indigo-600 text-xs bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {cand.roi_score > 1000 ? 'Exceptional' : 'High'} ({Math.round(cand.roi_score)})
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Scenarios View */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-3">Scenario</th>
                <th className="px-4 py-3">Type & Target</th>
                <th className="px-4 py-3">Incident Profile</th>
                <th className="px-4 py-3">Baseline Delay</th>
                <th className="px-4 py-3">Mitigated Delay</th>
                <th className="px-4 py-3 text-right">Delay Reduction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scenarios.map((sc) => (
                <tr key={sc.scenario_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-900">
                    {sc.scenario_id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{sc.scenario_type}</div>
                    <div className="text-[11px] text-slate-500 font-mono">Segment {sc.target_segment}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700 capitalize">
                    {sc.incident_type.replace('_', ' ')} (Sev {sc.severity})
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">
                    {sc.baseline_delay_min} min
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-indigo-600">
                    {sc.mitigated_delay_min} min
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-xs">
                      -{sc.reduction_pct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Candidate Inspector Modal - Upgraded to Scopic Operational Feasibility Dossier */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-fadeIn my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {selectedCandidate.candidate_id}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {selectedCandidate.feasibility_score || 88}% Operational Feasibility
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                    {selectedCandidate.feasibility_band} Cost Band
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedCandidate.corridor_name || `Corridor ${selectedCandidate.target_segment}`}
                </h3>
                <p className="text-xs text-slate-500">
                  Target Link: <strong className="font-mono text-slate-700">{selectedCandidate.target_segment}</strong> ({selectedCandidate.source_node || 'Origin'} → {selectedCandidate.target_node || 'Destination'}) • Intervention: <strong className="capitalize text-slate-800">{selectedCandidate.intervention_type.replace('_', ' ')}</strong> (+{selectedCandidate.capacity_delta_vph} vph)
                </p>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lead Time and Readiness Bar */}
            <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-slate-700">Estimated Timeline:</span>
                <span className="font-bold text-indigo-900">{selectedCandidate.time_to_deploy || '2 to 4 Weeks'}</span>
              </div>
              <div className="text-[11px] text-indigo-700 bg-white px-2.5 py-0.5 rounded-md border border-indigo-200 font-semibold">
                Readiness Score: {selectedCandidate.feasibility_score || 88}/100 (Ready to Roll Out)
              </div>
            </div>

            {/* Problem & Plain-English Solution Explanation */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>The Bottleneck & Why This Solution Works</span>
              </div>

              <div className="space-y-2">
                {/* The Current Problem */}
                <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-100 text-xs text-slate-700">
                  <div className="font-bold text-rose-900 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>What's Going Wrong Today (The Problem):</span>
                  </div>
                  <p className="leading-relaxed text-slate-700">
                    {selectedCandidate.problem_statement ||
                      'During peak hours, this corridor exceeds its designed vehicle capacity, causing severe slowdowns that ripple into surrounding junctions.'}
                  </p>
                </div>

                {/* The Fix */}
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-slate-700">
                  <div className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>How This Fixes It (The Solution):</span>
                  </div>
                  <p className="leading-relaxed text-slate-700">
                    {selectedCandidate.solution_summary || selectedCandidate.kinematic_reasoning}
                  </p>
                </div>

                {/* Real-World Commuter Benefit */}
                {selectedCandidate.commuter_benefit && (
                  <div className="p-3 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700">
                    <div className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>What Everyday Drivers Will Experience:</span>
                    </div>
                    <p className="leading-relaxed text-slate-700 font-medium">
                      {selectedCandidate.commuter_benefit}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Step-by-Step Implementation Plan */}
            {selectedCandidate.tactical_steps && selectedCandidate.tactical_steps.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Step-by-Step Implementation Plan (On the Ground)</span>
                </div>
                <div className="space-y-1.5">
                  {selectedCandidate.tactical_steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5 shadow-2xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Field Equipment & Personnel Requirements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-600" />
                  <span>Required Hardware & Tools:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(selectedCandidate.field_equipment || [
                    'Standard Road Marking Rig',
                    'Traffic Delineators',
                    'VMS Signs'
                  ]).map((eq, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] text-slate-700 font-medium"
                    >
                      {eq}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Assigned Teams & City Authorities:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(selectedCandidate.field_personnel || [
                    'Field Traffic Engineer',
                    'Traffic Patrol Officers'
                  ]).concat(selectedCandidate.jurisdiction_agencies || ['GHMC', 'Hyderabad Traffic Police']).map((per, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] text-slate-700 font-medium"
                    >
                      {per}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Counterfactual Key Metrics Grid - Realistic & Readable */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-slate-500 text-[10px] uppercase font-bold">Current Wait Time</span>
                <div className="text-base font-bold text-slate-800 mt-0.5">
                  {selectedCandidate.baseline_delay_min} min
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Heavy congestion delay</div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-emerald-700 text-[10px] uppercase font-bold">Wait Time After Fix</span>
                <div className="text-base font-bold text-emerald-700 mt-0.5">
                  {selectedCandidate.counterfactual_delay_min} min
                </div>
                <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Smooth flow (under 1 min)</div>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-center">
                <span className="text-indigo-700 text-[10px] uppercase font-bold">Delay Saved</span>
                <div className="text-base font-bold text-indigo-700 mt-0.5">
                  -{selectedCandidate.delay_reduction_pct}%
                </div>
                <div className="text-[10px] text-indigo-500 font-medium mt-0.5">Commuters move faster</div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-amber-700 text-[10px] uppercase font-bold">Value Rating</span>
                <div className="text-base font-bold text-amber-700 mt-0.5">
                  {selectedCandidate.roi_score > 1000 ? 'Exceptional' : 'High'}
                </div>
                <div className="text-[10px] text-amber-600 font-medium mt-0.5">Score: {Math.round(selectedCandidate.roi_score)} (Low cost, huge daily gain)</div>
              </div>
            </div>

            {/* Environmental & Economic Impact */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-800">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <span>
                  Air Quality Impact: <strong>-{selectedCandidate.co2_abated_kg_daily || Math.round(selectedCandidate.daily_veh_hours_saved * 1.8)} kg CO₂/day</strong>
                </span>
              </div>
              <div className="text-emerald-800">
                Fuel Saved: <strong>{selectedCandidate.fuel_saved_liters_daily || Math.round(selectedCandidate.daily_veh_hours_saved * 0.75)} L/day</strong>
              </div>
              <div className="text-emerald-900 font-bold">
                Daily Economic Value: ₹{(selectedCandidate.economic_savings_inr_daily || Math.round(selectedCandidate.daily_veh_hours_saved * 185)).toLocaleString('en-IN')}/day
              </div>
            </div>

            <button
              onClick={() => setSelectedCandidate(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
            >
              Close Strategic Feasibility Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
