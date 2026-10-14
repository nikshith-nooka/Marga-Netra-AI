export type CongestionLevel = 'FREE_FLOW' | 'MODERATE' | 'HEAVY' | 'GRIDLOCK';
export type AIRiskLevel = 'CRITICAL' | 'ELEVATED' | 'MONITORED' | 'OPTIMAL';
export type TrafficRegime = 'PEAK_AM' | 'MIDDAY' | 'PEAK_PM' | 'LATE_NIGHT';

export interface TrafficRegimeInfo {
  id: TrafficRegime;
  label: string;
  time: string;
  badge: string;
  description: string;
}

export interface ActiveAlertCase {
  id: string; // 'CASE-1', 'CASE-2', etc.
  segment_id: string; // 'R0435', 'R0067', etc.
  case_number: number; // 1 to 5
  title: string;
  short_title: string;
  category: 'COLLISION' | 'FREIGHT_BREAKDOWN' | 'DEMAND_SURGE' | 'WORKZONE' | 'SIGNAL_DRIFT';
  severity: AIRiskLevel;
  location: string;
  source_node: string;
  target_node: string;
  speed_kmh: number;
  flow_vph: number;
  queue_veh: number;
  delay_min: number;
  diagnostic_status: string;
  action_advised: string;
  short_summary: string;
  adaptive_recommendation?: BriefingAdaptiveRecommendation;
}

export interface RoadSegment {
  segment_id: string;
  source_node: string;
  target_node: string;
  road_class: string;
  lanes: number;
  free_flow_speed_kmh: number;
  capacity_vph: number;
  length_km: number;
  grade_pct: number;
  signal_id: string;
  structural_bottleneck: number;
  importance: number;
  // Live Telemetry
  speed_kmh: number;
  flow_vph: number;
  congestion_index: number;
  congestion_level: CongestionLevel;
  queue_length_veh: number;
  delay_min: number;
  speed_ratio: number;
  is_anomaly: boolean;
  ai_risk_level: AIRiskLevel;
  ai_status: string;
  ai_trend: string;
  ai_action: string;
}

export interface JunctionNode {
  node_id: string;
  x: number;
  y: number;
  lat: number;
  lon: number;
  is_signalized: boolean;
  signal_id?: string;
  label?: string;
}

export interface CityKPIs {
  timestamp: string;
  total_segments: number;
  avg_speed_kmh: number;
  total_flow_vph: number;
  free_flow_pct: number;
  moderate_pct: number;
  heavy_pct: number;
  gridlock_pct: number;
  active_incidents_count: number;
  active_bottlenecks_count: number;
  network_health_score: number;
  co2_saved_kg: number;
}

export interface HorizonForecast {
  horizon_min: 15 | 30 | 45 | 60;
  label: string;
  predicted_speed_kmh: number;
  predicted_flow_vph: number;
  predicted_congestion_index: number;
  speed_lower_kmh: number;
  speed_upper_kmh: number;
  confidence_pct: number;
  trend: 'improving' | 'stable' | 'deteriorating';
}

export interface ForecastResult {
  segment_id: string;
  road_class: string;
  source_node: string;
  target_node: string;
  current_observation: {
    speed_kmh: number;
    flow_vph: number;
    congestion_index: number;
    queue_length_veh: number;
    delay_min: number;
    timestamp: string;
  };
  horizons: HorizonForecast[];
  model_info: {
    architecture: string;
    speed_mae: number;
    flow_mae: number;
    congestion_mae: number;
    feature_count: number;
  };
}

export interface SpillbackStep {
  segment_id: string;
  hop: number;
  eta_minutes: number;
  source_node: string;
  target_node: string;
  road_class: string;
  speed_kmh: number;
  flow_vph: number;
  capacity_vph: number;
  queue_length_veh: number;
  congestion_index: number;
  speed_drop_pct: number;
  risk_label: string;
}

export interface SpillbackResult {
  incident_segment: string;
  total_impacted_segments: number;
  max_reach_minutes: number;
  cascade_steps: SpillbackStep[];
  affected_od_pairs: Array<{
    origin: string;
    destination: string;
    volume_vph: number;
    purpose: string;
    delay_added_min: number;
  }>;
  shockwave_velocity_kmh: number;
  total_delayed_vehicles: number;
}

export interface DiversionRoute {
  path_id: string;
  route_name: string;
  via_segments: string[];
  via_nodes: string[];
  total_distance_km: number;
  estimated_travel_time_min: number;
  spare_capacity_vph: number;
  capacity_utilization_pct: number;
  delay_saved_min: number;
  turn_restriction_clean: boolean;
  recommendation_level: 'PRIMARY_RECOMMENDED' | 'SECONDARY_ALTERNATE' | 'CONTINGENCY';
}

export interface DiversionPlanResult {
  incident_segment: string;
  source_node: string;
  target_node: string;
  blocked_capacity_vph: number;
  spillback_segments: string[];
  diversion_routes: DiversionRoute[];
  recommended_signal_tunes: Array<{
    node_id: string;
    signal_id: string;
    current_green_ratio: number;
    recommended_green_ratio: number;
    action: string;
    reason: string;
  }>;
}

export interface GreenWaveResult {
  status: string;
  priority_level: string;
  origin_node: string;
  destination_node: string;
  path_nodes: string[];
  corridor_segments: string[];
  total_distance_km: number;
  normal_travel_time_min: number;
  green_wave_eta_min: number;
  time_saved_min: number;
  signals_preempted_count: number;
  preempted_signals: Array<{
    node_id: string;
    signal_id: string;
    action: string;
    green_split: number;
    clearing_window_s: number;
    status: string;
  }>;
}

export interface PlanningCandidate {
  candidate_id: string;
  target_segment: string;
  corridor_name?: string;
  intervention_type: 'capacity_upgrade' | 'turn_lane' | 'signal_retiming' | 'flyover_extension';
  capacity_delta_vph: number;
  cost_index: number;
  feasibility_band: 'low' | 'medium' | 'high';
  // Computed counterfactuals
  baseline_delay_min: number;
  counterfactual_delay_min: number;
  delay_reduction_pct: number;
  daily_veh_hours_saved: number;
  roi_score: number;
  source_node?: string;
  target_node?: string;
  road_class?: string;
  // Scopic Feasibility & Operational Attributes
  feasibility_score?: number; // 0-100
  time_to_deploy?: string;
  problem_statement?: string;
  solution_summary?: string;
  commuter_benefit?: string;
  field_equipment?: string[];
  field_personnel?: string[];
  jurisdiction_agencies?: string[];
  tactical_steps?: string[];
  kinematic_reasoning?: string;
  co2_abated_kg_daily?: number;
  fuel_saved_liters_daily?: number;
  economic_savings_inr_daily?: number;
}

export interface ScenarioExample {
  scenario_id: string;
  scenario_type: string;
  start_time: string;
  end_time: string;
  target_segment: string;
  incident_type: string;
  severity: number;
  candidate_interventions: string;
  baseline_delay_min?: number;
  mitigated_delay_min?: number;
  reduction_pct?: number;
}

export interface ResilienceSimulationResult {
  segment_id: string;
  duration_min: number;
  network_delay_increase_pct: number;
  stranded_vehicles: number;
  spillback_radius_km: number;
  resilience_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  critical_spillback_corridors: string[];
  diversion_saturation_pct: number;
  single_point_of_failure: boolean;
  mitigation_protocol: string[];
}

export interface TopCriticalSegment {
  rank: number;
  segment_id: string;
  road_class: string;
  source_node: string;
  target_node: string;
  criticality_score: number;
  flow_vph: number;
  importance: number;
  failure_impact: string;
}

export interface BriefingAdaptiveRecommendation {
  strategy_name: string;
  strategy_type: 'SIGNAL_RETUNING' | 'DYNAMIC_DIVERSION' | 'EMERGENCY_STAGE' | 'ZIPPER_MERGE' | 'VARIABLE_SPEED';
  feasibility_score: number; // e.g. 96
  activation_eta: string; // e.g. "Instantaneous (< 60s via ATCS)"
  field_equipment: string[];
  field_personnel: string[];
  inter_agency: string;
  causal_reasoning: string;
  tactical_steps: string[];
  operational_gains: {
    delay_saved_min: number;
    delay_saved_pct: number;
    commuter_hours_saved_daily: number;
    queue_shrink_meters: number;
    co2_abated_kg: number;
  };
}

export interface BriefingResult {
  incident_id?: string;
  segment_id: string;
  language: 'EN' | 'HI' | 'TE';
  provider: string;
  briefing: string;
  simple_speech_text: string;
  phonetic_transliteration?: string;
  bullet_points?: string[];
  timestamp: string;
  recommendation?: BriefingAdaptiveRecommendation;
}

export interface WeeklyMacroDay {
  day_name: string;
  peak_hours: string;
  avg_congestion: number;
  avg_speed: number;
  total_trips_k: number;
  weather_sensitivity: number;
}

export interface WeeklyMacroProfile {
  days: WeeklyMacroDay[];
  weekly_avg_speed: number;
  total_vkt_millions: number;
  lost_hours_k: number;
}

export interface PretrainedBenchmarkData {
  training_records: number;
  validation_records: number;
  training_days: number;
  time_step_sec: number;
  road_segments: number;
  junction_nodes: number;
  signal_controllers: number;
  forecasting: {
    model_name: string;
    horizons: Array<{
      horizon_min: number;
      val_mae: number;
      val_rmse: number;
      train_mae: number;
    }>;
    congestion_index_mae: number;
    features_count: number;
  };
  incident_detection: {
    model_name: string;
    binary_cv_f1: number;
    binary_cv_f1_std: number;
    precision: number;
    recall: number;
    accuracy: number;
    multiclass_f1: number;
    feature_importance: Array<{
      feature: string;
      importance_pct: number;
    }>;
  };
  spillback_wave: {
    shockwave_speed_kmh: number;
    max_hops: number;
    cascade_timeline: Array<{
      hop: number;
      eta_range: string;
      label: string;
    }>;
  };
}

export interface RankedInfrastructureProject {
  candidate_id: string;
  target_segment: string;
  intervention_type: string;
  feasibility_band: string;
  cost_index: number;
  base_capacity_vph: number;
  upgraded_capacity_vph: number;
  capacity_delta_vph: number;
  baseline_delay_min: number;
  upgraded_delay_min: number;
  delay_reduction_pct: number;
  daily_veh_hours_saved: number;
  roi_score: number;
  rank: number;
}

export interface PretrainedScenarioEvaluation {
  scenario_id: string;
  target_segment: string;
  incident_type: string;
  severity: number;
  best_intervention_id: string;
  intervention_type: string;
  simulated_delay_relief_pct: number;
  roi_score: number;
  status: string;
}

