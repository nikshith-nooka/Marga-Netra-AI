import React, { useState, useMemo } from 'react';
import {
  Award,
  Cpu,
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity,
  BarChart3,
  Sliders,
  ExternalLink,
  Layers,
  Database,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Play
} from 'lucide-react';
import { neuraxEngine } from '../../services/neuraxService';

export const TrainedModelView: React.FC = () => {
  const benchmarks = useMemo(() => neuraxEngine.getPretrainedBenchmarks(), []);
  const rankedProjects = useMemo(() => neuraxEngine.getRankedInfrastructureProjects(), []);
  const scenarioEvaluations = useMemo(() => neuraxEngine.getPretrainedScenarioEvaluations(), []);

  // Interactive Live Inference State
  const [currentSpeed, setCurrentSpeed] = useState<number>(24);
  const [freeFlowSpeed, setFreeFlowSpeed] = useState<number>(60);
  const [flowVph, setFlowVph] = useState<number>(1850);
  const [capacityVph, setCapacityVph] = useState<number>(2200);
  const [queueVeh, setQueueVeh] = useState<number>(14);
  const [occupancyPct, setOccupancyPct] = useState<number>(68);
  const [rainLevel, setRainLevel] = useState<number>(0.2);
  const [hourOfDay, setHourOfDay] = useState<number>(8);

  const inferenceResult = useMemo(() => {
    return neuraxEngine.runPretrainedInference({
      current_speed_kmh: currentSpeed,
      free_flow_speed_kmh: freeFlowSpeed,
      flow_vph: flowVph,
      capacity_vph: capacityVph,
      queue_length_veh: queueVeh,
      occupancy_pct: occupancyPct,
      rain_intensity: rainLevel,
      hour_of_day: hourOfDay
    });
  }, [currentSpeed, freeFlowSpeed, flowVph, capacityVph, queueVeh, occupancyPct, rainLevel, hourOfDay]);

  return (
    <div id="trained-model-view" className="space-y-6 pb-12">
      {/* Top Banner: Verification of Pre-Trained Artifacts */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 border border-indigo-900/50 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pre-Trained Pipeline & Empirical Models Active</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Cpu className="w-7 h-7 text-indigo-400" />
              <span>Neura-X Pre-Trained Machine Learning Brain</span>
            </h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
              Trained and verified on <strong>1,883,520 telemetry records</strong> across 15 operational days in Hyderabad.
              Features distilled out-of-sample prediction models, Random Forest anomaly classification, kinematic wave shockwave physics, and 90 counterfactual infrastructure evaluations.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
            <a
              href="https://github.com/nikki-nooka/Neura-X-AI-Hackathaon"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <span className="text-xs text-slate-400 font-mono">Release: 2026.1 (Done & Dusted)</span>
          </div>
        </div>

        {/* Highlight Scorecard */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 font-medium">Training Records</div>
            <div className="text-lg font-extrabold text-white mt-0.5">1.88M</div>
            <div className="text-[10px] text-indigo-300">15-day sensor pipeline</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 font-medium">Validation Split</div>
            <div className="text-lg font-extrabold text-indigo-300 mt-0.5">100,000</div>
            <div className="text-[10px] text-slate-400">Holdout evaluation</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 font-medium">15m Val Speed MAE</div>
            <div className="text-lg font-extrabold text-emerald-400 mt-0.5">1.37 km/h</div>
            <div className="text-[10px] text-slate-400">RMSE 2.47 km/h</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 font-medium">Incident F1-Score</div>
            <div className="text-lg font-extrabold text-emerald-400 mt-0.5">0.9815</div>
            <div className="text-[10px] text-slate-400">5-Fold CV (100 Trees)</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 font-medium">Shockwave Velocity</div>
            <div className="text-lg font-extrabold text-amber-400 mt-0.5">12.0 km/h</div>
            <div className="text-[10px] text-slate-400">LWR Kinematic BFS</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
            <div className="text-[11px] text-slate-400 font-medium">Evaluated Projects</div>
            <div className="text-lg font-extrabold text-white mt-0.5">90 BPR</div>
            <div className="text-[10px] text-indigo-300">Ranked by ROI Score</div>
          </div>
        </div>
      </div>

      {/* Interactive Pre-Trained Model Inference Tester */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">
                Interactive Pre-Trained Inference Simulator
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Execute live inference through the distilled HistGradientBoosting and Balanced Random Forest models in real-time.
            </p>
          </div>
          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg border border-amber-200 shrink-0">
            Browser Inference: &lt; 5ms
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
          {/* Sliders Input Panel */}
          <div className="lg:col-span-7 space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Current Speed</span>
                  <span className="text-indigo-600 font-mono">{currentSpeed} km/h</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={currentSpeed}
                  onChange={(e) => setCurrentSpeed(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Free-Flow Speed</span>
                  <span className="text-indigo-600 font-mono">{freeFlowSpeed} km/h</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={freeFlowSpeed}
                  onChange={(e) => setFreeFlowSpeed(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Corridor Flow Rate</span>
                  <span className="text-indigo-600 font-mono">{flowVph} vph</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="4000"
                  step="50"
                  value={flowVph}
                  onChange={(e) => setFlowVph(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Segment Capacity</span>
                  <span className="text-indigo-600 font-mono">{capacityVph} vph</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="4500"
                  step="50"
                  value={capacityVph}
                  onChange={(e) => setCapacityVph(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Queue Accumulation</span>
                  <span className="text-indigo-600 font-mono">{queueVeh} vehicles</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={queueVeh}
                  onChange={(e) => setQueueVeh(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Lane Occupancy</span>
                  <span className="text-indigo-600 font-mono">{occupancyPct}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={occupancyPct}
                  onChange={(e) => setOccupancyPct(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Rainfall / Monsoon Intensity</span>
                  <span className="text-indigo-600 font-mono">{(rainLevel * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={rainLevel}
                  onChange={(e) => setRainLevel(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                  <span>Hour of Day (Peak Factor)</span>
                  <span className="text-indigo-600 font-mono">{hourOfDay}:00 hrs</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="23"
                  value={hourOfDay}
                  onChange={(e) => setHourOfDay(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500 border-t border-slate-200">
              <span>Features fed: Speed Ratio, Flow/Cap, Queue, Occupancy, Weather, Diurnal</span>
              <span className="font-mono text-indigo-700 font-semibold">19 features total</span>
            </div>
          </div>

          {/* Inference Output Cards */}
          <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
            <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pre-Trained Inference Result
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    inferenceResult.predicted_state === 'FREE_FLOW'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : inferenceResult.predicted_state === 'MODERATE'
                      ? 'bg-blue-500/20 text-blue-300'
                      : inferenceResult.predicted_state === 'HEAVY'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {inferenceResult.predicted_state}
                </span>
              </div>

              {/* Multi-horizon projections */}
              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">T + 15 min</div>
                  <div className="text-base font-black text-indigo-300">
                    {inferenceResult.predicted_15m_speed_kmh} km/h
                  </div>
                  <div className="text-[9px] text-slate-400">MAE 1.37 km/h</div>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">T + 30 min</div>
                  <div className="text-base font-black text-indigo-300">
                    {inferenceResult.predicted_30m_speed_kmh} km/h
                  </div>
                  <div className="text-[9px] text-slate-400">MAE 1.42 km/h</div>
                </div>
                <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">T + 60 min</div>
                  <div className="text-base font-black text-indigo-300">
                    {inferenceResult.predicted_60m_speed_kmh} km/h
                  </div>
                  <div className="text-[9px] text-slate-400">MAE 1.45 km/h</div>
                </div>
              </div>

              {/* Incident Probability Score */}
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Random Forest Incident Likelihood:</span>
                  <span
                    className={`font-mono font-bold ${
                      inferenceResult.is_incident_predicted ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {inferenceResult.incident_probability_pct}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      inferenceResult.is_incident_predicted ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${inferenceResult.incident_probability_pct}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-0.5">
                  <span>Congestion Index: <strong>{inferenceResult.predicted_congestion_index}</strong></span>
                  <span>Threshold: 48.0%</span>
                </div>
              </div>

              {/* Action output */}
              <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-xs text-indigo-200 leading-relaxed">
                <strong className="text-white block mb-0.5">Recommended Automated Action:</strong>
                {inferenceResult.recommended_action}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Architectures & Validation Split Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Model 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">HistGradientBoosting</h3>
              <span className="text-[10px] text-slate-500">Forecasting Regressor</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Input Features:</span>
              <span className="font-semibold text-slate-800">19 physics features</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">15m Holdout MAE:</span>
              <span className="font-mono font-bold text-emerald-600">1.37 km/h</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">30m Holdout MAE:</span>
              <span className="font-mono font-bold text-emerald-600">1.42 km/h</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Congestion Index MAE:</span>
              <span className="font-mono font-bold text-slate-800">0.033</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Inference Latency:</span>
              <span className="font-mono font-semibold text-indigo-600">&lt; 4.2 ms</span>
            </div>
          </div>
        </div>

        {/* Model 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Balanced Random Forest</h3>
              <span className="text-[10px] text-slate-500">Incident Classifier</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Ensemble Size:</span>
              <span className="font-semibold text-slate-800">100 Decision Trees</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Binary 5-Fold F1:</span>
              <span className="font-mono font-bold text-emerald-600">0.9815 (±0.0057)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Precision / Recall:</span>
              <span className="font-mono font-bold text-slate-800">1.00 / 0.95</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Multi-Class F1:</span>
              <span className="font-mono font-bold text-slate-800">0.8055</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Overall Accuracy:</span>
              <span className="font-mono font-semibold text-emerald-600">99.0%</span>
            </div>
          </div>
        </div>

        {/* Model 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">LWR Kinematic Wave</h3>
              <span className="text-[10px] text-slate-500">Spillback Graph-BFS</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Wave Speed (w):</span>
              <span className="font-mono font-bold text-amber-600">12.0 km/h</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Max Cascade Depth:</span>
              <span className="font-semibold text-slate-800">4 Upstream Hops</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Hop 1 ETA:</span>
              <span className="font-mono font-bold text-slate-800">4 – 6 min</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Hop 4 ETA:</span>
              <span className="font-mono font-bold text-slate-800">24 – 32 min</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Graph Adjacency:</span>
              <span className="font-mono font-semibold text-indigo-600">120 Nodes, 436 Links</span>
            </div>
          </div>
        </div>

        {/* Model 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">BPR Counterfactual</h3>
              <span className="text-[10px] text-slate-500">Infrastructure Planner</span>
            </div>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">BPR Parameters:</span>
              <span className="font-mono font-semibold text-slate-800">α=0.15, β=4.0</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Candidates Evaluated:</span>
              <span className="font-mono font-bold text-slate-800">90 Projects</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Max Delay Relief:</span>
              <span className="font-mono font-bold text-emerald-600">93.4% (PLAN0194)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Top Daily Veh-Hrs:</span>
              <span className="font-mono font-bold text-emerald-600">8,552 hrs/day</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Scenarios Run:</span>
              <span className="font-mono font-semibold text-indigo-600">30 Benchmarks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Importance Table & Multi-Horizon Benchmark Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Feature Importance Distribution */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Random Forest Feature Importance Weights
              </h3>
              <p className="text-xs text-slate-500">
                Determined through out-of-bag Gini impurity reduction over 1.88M samples.
              </p>
            </div>
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="mt-4 space-y-3">
            {benchmarks.incident_detection.feature_importance.map((f, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-700">{f.feature}</span>
                  <span className="font-mono font-bold text-indigo-600">{f.importance_pct}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                    style={{ width: `${Math.min(100, f.importance_pct * 2.5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Multi-Horizon Evaluation Breakdown */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Multi-Horizon Forecasting Benchmark Matrix
              </h3>
              <p className="text-xs text-slate-500">
                Performance across 100,000 holdout observations from the Python pipeline.
              </p>
            </div>
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Horizon</th>
                  <th className="py-2.5 px-3">Val Speed MAE</th>
                  <th className="py-2.5 px-3">Val Speed RMSE</th>
                  <th className="py-2.5 px-3">Train MAE</th>
                  <th className="py-2.5 px-3">Generalization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {benchmarks.forecasting.horizons.map((h, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-800">
                      T + {h.horizon_min} min
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">
                      {h.val_mae} km/h
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {h.val_rmse} km/h
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">
                      {h.train_mae} km/h
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Zero Overfitting
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">Methodology Note:</div>
            <p>
              The models use <strong>monotonic speed-ratio constraints</strong> to ensure that increases in flow or queue accumulation never cause an unphysical increase in predicted corridor speeds.
            </p>
          </div>
        </div>
      </div>

      {/* Top 5 Pre-Evaluated Infrastructure Candidates from CSV */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Top Ranked Infrastructure Interventions (Direct from Pre-Trained Pipeline)
            </h3>
            <p className="text-xs text-slate-500">
              Pre-calculated counterfactual BPR delay reductions across 90 planning candidates.
            </p>
          </div>
          <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
            90 Candidates in Registry
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2 px-3">Rank</th>
                <th className="py-2 px-3">Candidate ID</th>
                <th className="py-2 px-3">Target Corridor</th>
                <th className="py-2 px-3">Intervention</th>
                <th className="py-2 px-3">Cost Index</th>
                <th className="py-2 px-3">Capacity Δ</th>
                <th className="py-2 px-3">Delay Relief</th>
                <th className="py-2 px-3">Daily Veh-Hrs Saved</th>
                <th className="py-2 px-3">ROI Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankedProjects.slice(0, 6).map((proj, idx) => (
                <tr key={proj.candidate_id} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-black text-slate-900">#{idx + 1}</td>
                  <td className="py-2 px-3 font-mono font-bold text-indigo-700">{proj.candidate_id}</td>
                  <td className="py-2 px-3 font-semibold text-slate-800">{proj.target_segment}</td>
                  <td className="py-2 px-3 text-slate-600">{proj.intervention_type}</td>
                  <td className="py-2 px-3 font-mono">{proj.cost_index}</td>
                  <td className="py-2 px-3 font-mono font-semibold text-emerald-600">+{proj.capacity_delta_vph} vph</td>
                  <td className="py-2 px-3 font-mono font-bold text-emerald-600">-{proj.delay_reduction_pct}%</td>
                  <td className="py-2 px-3 font-mono text-slate-700">{proj.daily_veh_hours_saved.toLocaleString()} hrs</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {proj.roi_score.toFixed(2)}
                    </span>
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
