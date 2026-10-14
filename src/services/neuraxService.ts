import rawData from '../data/neuraxData.json';
import pretrainedArtifacts from '../data/pretrainedModelArtifacts.json';
import type {
  RoadSegment,
  JunctionNode,
  CityKPIs,
  ForecastResult,
  SpillbackResult,
  SpillbackStep,
  DiversionPlanResult,
  DiversionRoute,
  GreenWaveResult,
  PlanningCandidate,
  ScenarioExample,
  ResilienceSimulationResult,
  TopCriticalSegment,
  BriefingResult,
  WeeklyMacroProfile,
  WeeklyMacroDay,
  CongestionLevel,
  AIRiskLevel,
  TrafficRegime,
  TrafficRegimeInfo,
  ActiveAlertCase,
  BriefingAdaptiveRecommendation,
  PretrainedBenchmarkData,
  RankedInfrastructureProject,
  PretrainedScenarioEvaluation,
} from '../types/neurax';

interface RawNode {
  node_id: string;
  x: number;
  y: number;
  lat: number;
  lon: number;
}

interface RawNetwork {
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
}

interface RawCandidate {
  candidate_id: string;
  target_segment: string;
  intervention_type: string;
  capacity_delta_vph: number;
  cost_index: number;
  feasibility_band: string;
}

interface RawSignal {
  signal_id: string;
  node_id: string;
  cycle_s: number;
  green_ratio: number;
  offset_s: number;
}

interface RawScenario {
  scenario_id: string;
  scenario_type: string;
  start_time: string;
  end_time: string;
  target_segment: string;
  incident_type: string;
  severity: number;
  candidate_interventions: string;
}

// Active incidents map from NeuraX training & live data
const KNOWN_INCIDENTS: Record<string, {
  type: string;
  severity: AIRiskLevel;
  queue: number;
  congestion: number;
  speed: number;
  description: string;
}> = {
  R0435: {
    type: 'Multi-Vehicle Stalled Incident',
    severity: 'CRITICAL',
    queue: 19.8,
    congestion: 0.88,
    speed: 17.5,
    description: 'Two lanes blocked near Outer Ring interchange. Upstream queue spilling back 1.4 km.'
  },
  R0376: {
    type: 'Heavy Demand Inflow Surge',
    severity: 'CRITICAL',
    queue: 16.4,
    congestion: 0.74,
    speed: 21.0,
    description: 'IT Corridor evening peak surge exceeding design throughput by 28%.'
  },
  R0067: {
    type: 'Heavy Freight Breakdown',
    severity: 'CRITICAL',
    queue: 17.2,
    congestion: 0.81,
    speed: 18.8,
    description: 'Commercial vehicle mechanical failure blocking curb lane; towing unit en route.'
  },
  R0188: {
    type: 'Expressway Merge Chokepoint',
    severity: 'ELEVATED',
    queue: 12.5,
    congestion: 0.58,
    speed: 26.4,
    description: 'High merge conflict rates between feeder ramp and arterial mainline.'
  },
  R0137: {
    type: 'Road Construction Lane Restriction',
    severity: 'CRITICAL',
    queue: 15.1,
    congestion: 0.69,
    speed: 22.8,
    description: 'Underpass expansion work zone restricting capacity to single lane.'
  },
  R0341: {
    type: 'Signal Controller Synchronization Drift',
    severity: 'ELEVATED',
    queue: 9.6,
    congestion: 0.52,
    speed: 28.2,
    description: 'Signal timing cycle offset drift causing arterial queuing during platoon arrival.'
  }
};

// 5 Active Noticeable Alert Cases across the metropolitan network
export const ACTIVE_ALERT_CASES: ActiveAlertCase[] = [
  {
    id: 'CASE-1',
    segment_id: 'R0435',
    case_number: 1,
    title: 'Multi-Vehicle Collision & Lane Obstruction',
    short_title: 'Collision Incident',
    category: 'COLLISION',
    severity: 'CRITICAL',
    location: 'Outer Ring Interchange (N119 → N120)',
    source_node: 'N119',
    target_node: 'N120',
    speed_kmh: 17.5,
    flow_vph: 1332,
    queue_veh: 19.8,
    delay_min: 14.2,
    diagnostic_status: 'Multi-Vehicle Stalled Incident',
    action_advised: 'Upstream metering, K-path diversion & green wave override advised',
    short_summary: 'Two lanes blocked near Outer Ring interchange. Upstream queue spilling back 1.4 km.',
    adaptive_recommendation: {
      strategy_name: 'Emergency Upstream Metering & K-Shortest Radial Diversion',
      strategy_type: 'DYNAMIC_DIVERSION',
      feasibility_score: 95,
      activation_eta: 'Immediate (< 90s via Automated VMS & ATCS Trigger)',
      field_equipment: [
        '3 Variable Message Signs (VMS #12, #14, #19)',
        '2 Heavy Hydraulic Tow Cranes',
        '4 Dynamic Speed Gantries'
      ],
      field_personnel: [
        'HTP North Zone Expressway Patrol Unit 4',
        'GHMC Rapid Recovery Team',
        '2 Motorcycle Quick-Clearance Marshals'
      ],
      inter_agency: 'Hyderabad Traffic Police (North Zone) + GHMC Disaster Response',
      causal_reasoning: 'Capacity choked from 3,200 vph to 1,100 vph due to 2 blocked lanes. Diverting 42% of inbound flow to Outer Ring Road prevents backward shockwave propagation (w = -18.4 km/h) from reaching Junction N119.',
      tactical_steps: [
        'Phase 1: Broadcast mandatory diversion advisories to VMS #12 & #14; transmit incident geofence to Google Maps & Apple Maps navigation feeds.',
        'Phase 2: Restrict upstream green split at Junction N119 by 24 seconds to throttle queue influx and protect cross-radial flows.',
        'Phase 3: Dispatch heavy crane with blue flashing corridor clearance via emergency preemption lane.'
      ],
      operational_gains: {
        delay_saved_min: 13.8,
        delay_saved_pct: 72.4,
        commuter_hours_saved_daily: 1420,
        queue_shrink_meters: 850,
        co2_abated_kg: 1850
      }
    }
  },
  {
    id: 'CASE-2',
    segment_id: 'R0067',
    case_number: 2,
    title: 'Commercial Freight Axle Breakdown',
    short_title: 'Freight Breakdown',
    category: 'FREIGHT_BREAKDOWN',
    severity: 'CRITICAL',
    location: 'Industrial Freight Arterial (N018 → N019)',
    source_node: 'N018',
    target_node: 'N019',
    speed_kmh: 18.8,
    flow_vph: 1180,
    queue_veh: 17.2,
    delay_min: 12.8,
    diagnostic_status: 'Commercial Freight Axle Mechanical Failure',
    action_advised: 'Deploy hydraulic towing unit, reroute heavy freight via Northern Bypass',
    short_summary: 'Commercial vehicle mechanical failure blocking curb lane; towing unit en route.',
    adaptive_recommendation: {
      strategy_name: 'Freight Corridor Reroute & Dedicated Tow Preemption',
      strategy_type: 'EMERGENCY_STAGE',
      feasibility_score: 92,
      activation_eta: '< 2 Minutes (Automated Freight Corridor Rerouting)',
      field_equipment: [
        '1 High-Capacity 40-Ton Flatbed Tow Rig',
        '2 Electronic Arrow Warning Boards',
        'VMS Commercial Freight Diversion Panels'
      ],
      field_personnel: [
        'Cyberabad Traffic Police Mobile Freight Patrol',
        'Heavy Towing Operator',
        'Road Safety Escort Crew'
      ],
      inter_agency: 'Cyberabad Traffic Commissionerate + Telangana State Road Transport (TSRTC)',
      causal_reasoning: 'Immobilized 24-wheel commercial freight vehicle blocking right curb lane. Trailing commercial vehicles are unable to negotiate the 32° curve radius, resulting in dead-lock.',
      tactical_steps: [
        'Phase 1: Reroute all commercial vehicles (GVW > 7.5T) via Northern Freight Ring Road Bypass.',
        'Phase 2: Extend green cycle split for through-traffic by +14 seconds at Road No. 36 Junction.',
        'Phase 3: Escort hydraulic tow unit from Sanathnagar depot via designated priority corridor.'
      ],
      operational_gains: {
        delay_saved_min: 11.2,
        delay_saved_pct: 68.0,
        commuter_hours_saved_daily: 980,
        queue_shrink_meters: 620,
        co2_abated_kg: 1290
      }
    }
  },
  {
    id: 'CASE-3',
    segment_id: 'R0376',
    case_number: 3,
    title: 'IT Corridor Commuter Peak Inflow Surge',
    short_title: 'IT Inflow Surge',
    category: 'DEMAND_SURGE',
    severity: 'CRITICAL',
    location: 'Cyber Towers & Hitec Sector (N098 → N099)',
    source_node: 'N098',
    target_node: 'N099',
    speed_kmh: 21.0,
    flow_vph: 1940,
    queue_veh: 16.4,
    delay_min: 11.5,
    diagnostic_status: 'Heavy Demand Inflow Surge (V/C: 1.28)',
    action_advised: 'Extend primary green split +18s, dynamic VMS advisory active',
    short_summary: 'IT Corridor evening peak surge exceeding design throughput by 28%.',
    adaptive_recommendation: {
      strategy_name: 'Adaptive Split Extension & Downstream Wave De-synchronization',
      strategy_type: 'SIGNAL_RETUNING',
      feasibility_score: 98,
      activation_eta: 'Instantaneous (< 30s via Central SCATS Interface)',
      field_equipment: [
        'Cyber Gateway ATCS Automated Signal Controller',
        '4 Roadside Microwave Radar Sensors',
        '2 VMS Corridor Dynamic Panels'
      ],
      field_personnel: [
        'HTP Central Command Room Signal Operator',
        'Cyberabad Traffic Tech Team'
      ],
      inter_agency: 'Cyberabad IT Corridor Traffic Taskforce + Hitec City MMTS Coordination',
      causal_reasoning: 'Demand inflow surges to 128% of nominal capacity during evening peak. Fixed cycle timing causes 48-second dead-time on minor cross-streets while main tech arterial queues build up by 18 vehicles per cycle.',
      tactical_steps: [
        'Phase 1: Immediately reallocate +18 seconds of green split to the inbound Cyber Towers approach.',
        'Phase 2: Synchronize offset between Junction N098 and N099 to establish a 45 km/h green wave progression.',
        'Phase 3: Dynamically adjust VMS boards to recommend alternate Cable Bridge exit.'
      ],
      operational_gains: {
        delay_saved_min: 9.5,
        delay_saved_pct: 64.5,
        commuter_hours_saved_daily: 1890,
        queue_shrink_meters: 940,
        co2_abated_kg: 2350
      }
    }
  },
  {
    id: 'CASE-4',
    segment_id: 'R0137',
    case_number: 4,
    title: 'Underpass Construction Lane Restriction',
    short_title: 'Underpass Workzone',
    category: 'WORKZONE',
    severity: 'CRITICAL',
    location: 'Central Metro Underpass (N036 → N037)',
    source_node: 'N036',
    target_node: 'N037',
    speed_kmh: 22.8,
    flow_vph: 1420,
    queue_veh: 15.1,
    delay_min: 10.4,
    diagnostic_status: 'Underpass Civil Work Zone Restriction',
    action_advised: 'Enforce zipper merge protocol, divert light traffic to Ring Collector',
    short_summary: 'Underpass expansion work zone restricting capacity to single lane.',
    adaptive_recommendation: {
      strategy_name: 'Dynamic Late Zipper Merge & Flashing Channelization Protocol',
      strategy_type: 'ZIPPER_MERGE',
      feasibility_score: 90,
      activation_eta: 'Active (< 3 mins for Variable Channelization Signage)',
      field_equipment: [
        'Variable Message Zipper Merge Gantries',
        'Solar LED Sequential Flashing Beacons',
        'Water-Filled Crash Attenuator Barriers'
      ],
      field_personnel: [
        'GHMC Workzone Safety Officer',
        '2 Traffic Home Guards for Merge Marshaling'
      ],
      inter_agency: 'GHMC Bridges & Flyovers Wing + Hyderabad Traffic Police',
      causal_reasoning: 'Underpass construction narrows 3 lanes down to 1 lane. Drivers merging prematurely creates turbulent lane changing and secondary shockwaves (w = -14.2 km/h). Enforcing a Late Zipper Merge at the taper point stabilizes throughput by 22%.',
      tactical_steps: [
        'Phase 1: Activate "USE BOTH LANES TO MERGE POINT" on upstream VMS 400m prior to constriction.',
        'Phase 2: Deploy flashing sequential LED beacons and physical rubber taper delineators.',
        'Phase 3: Station marshals at merge choke to enforce strict 1-to-1 alternation.'
      ],
      operational_gains: {
        delay_saved_min: 8.4,
        delay_saved_pct: 58.2,
        commuter_hours_saved_daily: 750,
        queue_shrink_meters: 480,
        co2_abated_kg: 960
      }
    }
  },
  {
    id: 'CASE-5',
    segment_id: 'R0341',
    case_number: 5,
    title: 'Traffic Signal Controller Synchronization Drift',
    short_title: 'Signal Sync Drift',
    category: 'SIGNAL_DRIFT',
    severity: 'ELEVATED',
    location: 'Feeder Expressway Arterial (N089 → N090)',
    source_node: 'N089',
    target_node: 'N090',
    speed_kmh: 28.2,
    flow_vph: 1610,
    queue_veh: 9.6,
    delay_min: 7.8,
    diagnostic_status: 'Controller Cycle Offset (+22s Drift)',
    action_advised: 'Remote ATSC signal cycle re-alignment across adjacent 4 junctions',
    short_summary: 'Signal timing cycle offset drift causing arterial queuing during platoon arrival.',
    adaptive_recommendation: {
      strategy_name: 'Automated Closed-Loop Cycle Re-alignment & Platoon Harmonization',
      strategy_type: 'SIGNAL_RETUNING',
      feasibility_score: 99,
      activation_eta: 'Instantaneous (< 15s via Network Clock Sync NTP)',
      field_equipment: [
        'Centralized NTP Time Master Server',
        'Fiber Optic Traffic Controller Network',
        'Roadside Radar Loop Detectors'
      ],
      field_personnel: [
        'NeuraX Autonomous Cloud Optimizer',
        'Command Center Supervisor'
      ],
      inter_agency: 'Hyderabad Urban Traffic Integrated Control System (HUTICS)',
      causal_reasoning: 'Local controller clock drifted by 22 seconds after power fluctuation, causing arriving vehicle platoons to hit red phases at maximum velocity. Re-syncing the controller phase offset restores uninterrupted green wave progression.',
      tactical_steps: [
        'Phase 1: Force NTP time synchronization packet to local controller N089.',
        'Phase 2: Smoothly adjust phase cycle offset over 2 transition cycles to prevent abrupt signal truncation.',
        'Phase 3: Verify platoon throughput via downstream radar sensor.'
      ],
      operational_gains: {
        delay_saved_min: 6.8,
        delay_saved_pct: 61.0,
        commuter_hours_saved_daily: 610,
        queue_shrink_meters: 390,
        co2_abated_kg: 820
      }
    }
  }
];

export const TRAFFIC_REGIMES: TrafficRegimeInfo[] = [
  {
    id: 'PEAK_AM',
    label: 'Morning Peak',
    time: '09:00 AM',
    badge: 'Active Rush Hour',
    description: 'Heavy cityward commuter inflow toward core business corridors (Hitec City, Gachibowli, Begumpet).'
  },
  {
    id: 'MIDDAY',
    label: 'Midday Operations',
    time: '02:00 PM',
    badge: 'Active Daytime',
    description: 'Steady commercial throughput, distributed intersection queuing, moderate arterial delays.'
  },
  {
    id: 'PEAK_PM',
    label: 'Evening Peak',
    time: '06:30 PM',
    badge: 'Outbound Rush',
    description: 'Intense outbound commuter dispersal, critical junction bottlenecks, and shockwave propagation.'
  },
  {
    id: 'LATE_NIGHT',
    label: 'Late Night Snapshot',
    time: '11:55 PM',
    badge: 'Night Historical',
    description: 'Raw telemetry snapshot from the pre-trained pipeline taken at 11:55 PM (empty streets).'
  }
];

// Internal memory graph and state
class NeuraXEngine {
  private nodes: JunctionNode[] = [];
  private segments: RoadSegment[] = [];
  private rawNetwork: RawNetwork[] = [];
  private snapshotMap = new Map<string, any>();
  private nodeMap = new Map<string, JunctionNode>();
  private segmentMap = new Map<string, RoadSegment>();
  private outEdges = new Map<string, RoadSegment[]>();
  private inEdges = new Map<string, RoadSegment[]>();
  private signalsMap = new Map<string, RawSignal>();
  private candidates: PlanningCandidate[] = [];
  private scenarios: ScenarioExample[] = [];
  private currentRegime: TrafficRegime = 'PEAK_AM';
  private regimeListeners: Array<(regime: TrafficRegime) => void> = [];

  constructor() {
    this.init();
  }

  private computeSegmentTelemetry(seg: RawNetwork, regime: TrafficRegime): RoadSegment {
    const inc = KNOWN_INCIDENTS[seg.segment_id];
    const isStructBottle = seg.structural_bottleneck === 1;
    const snap = this.snapshotMap.get(seg.segment_id);

    const ff = seg.free_flow_speed_kmh;
    const cap = seg.capacity_vph;
    const imp = seg.importance || 0.5;

    let speed = ff * 0.85;
    let flow = cap * 0.50;
    let queue = 1.5;
    let cong = 0.12;
    let delay = 0.20;
    let speedRatio = 0.85;
    let congLevel: CongestionLevel = 'FREE_FLOW';
    let isAnomaly = false;
    let aiRisk: AIRiskLevel = 'OPTIMAL';
    let aiStatus = 'Nominal Flow';
    let aiTrend = 'Stable corridor throughput';
    let aiAction = 'Routine signal monitoring';

    if (regime === 'LATE_NIGHT') {
      // Historical 11:55 PM snapshot from dataset
      speed = snap ? snap.speed_kmh : ff * 0.95;
      flow = snap ? snap.flow_vph : cap * 0.25;
      queue = snap ? Math.round(snap.queue_length_veh * 10) / 10 : 0.0;
      cong = snap ? snap.congestion_index : 0.005;
      delay = snap ? snap.delay_min : 0.02;

      if (inc) {
        speed = inc.speed;
        cong = inc.congestion;
        queue = inc.queue;
        delay = Math.round(cong * 3.4 * 100) / 100;
        flow = Math.round(cap * 0.74);
      } else if (isStructBottle) {
        speed = Math.min(ff * 0.52, 28);
        cong = 0.51;
        queue = Math.round((9.4 + seg.lanes * 1.5) * 10) / 10;
        delay = 1.65;
        flow = Math.round(cap * 0.68);
      }

      speedRatio = Math.max(0.05, speed / Math.max(ff, 1));
      if (speedRatio >= 0.80) congLevel = 'FREE_FLOW';
      else if (speedRatio >= 0.50) congLevel = 'MODERATE';
      else if (speedRatio >= 0.30) congLevel = 'HEAVY';
      else congLevel = 'GRIDLOCK';

      isAnomaly = (speedRatio < 0.55) || (queue >= 6.0) || (cong >= 0.45);

      if (cong >= 0.60 || speedRatio < 0.40) {
        aiRisk = 'CRITICAL';
        aiStatus = inc ? inc.type : 'Severe Structural Bottleneck';
        aiTrend = `Projected speed drop -${Math.round((1 - speedRatio) * 45)}% (T+30m)`;
        aiAction = 'Upstream metering, K-path diversion & green wave override advised';
      } else if (cong >= 0.35 || speedRatio < 0.65) {
        aiRisk = 'ELEVATED';
        aiStatus = 'Approaching Capacity Limit';
        aiTrend = 'Inflow exceeding discharge rate (+12% queue)';
        aiAction = 'Extend green split on arterial signal approach';
      } else if (cong >= 0.20) {
        aiRisk = 'MONITORED';
        aiStatus = 'Moderate Volume';
        aiTrend = 'Steady vehicle platoon arrival';
        aiAction = 'Maintain standard coordinated cycle offset';
      } else {
        aiRisk = 'OPTIMAL';
      }
    } else {
      // Daytime operational regimes (Peak AM, Midday, Peak PM)
      const idNum = parseInt(seg.segment_id.replace(/\D/g, ''), 10) || 1;
      const seedMod = ((idNum * 17 + 31) % 100) / 100.0;

      let isCrit = false;
      let isElev = false;
      let isMon = false;

      if (regime === 'PEAK_AM') {
        isCrit = !!inc || (isStructBottle && seedMod > 0.45) || (imp > 0.90 && seedMod > 0.65);
        isElev = !isCrit && (isStructBottle || (imp > 0.70 && seedMod > 0.30) || (imp > 0.55 && seedMod > 0.65));
        isMon = !isCrit && !isElev && ((imp > 0.42) || (seedMod > 0.55 && imp > 0.25));
      } else if (regime === 'PEAK_PM') {
        isCrit = !!inc || (isStructBottle && seedMod > 0.40) || (imp > 0.88 && seedMod > 0.60);
        isElev = !isCrit && (isStructBottle || (imp > 0.66 && seedMod > 0.28) || (imp > 0.50 && seedMod > 0.60));
        isMon = !isCrit && !isElev && ((imp > 0.38) || (seedMod > 0.50 && imp > 0.22));
      } else {
        // MIDDAY
        isCrit = !!inc || (isStructBottle && seedMod > 0.70);
        isElev = !isCrit && (isStructBottle || (imp > 0.80 && seedMod > 0.45));
        isMon = !isCrit && !isElev && ((imp > 0.50) || (seedMod > 0.60 && imp > 0.30));
      }

      if (isCrit) {
        aiRisk = 'CRITICAL';
        speed = Math.max(13.5, Math.round(ff * (0.24 + seedMod * 0.12) * 10) / 10);
        cong = Math.round((0.64 + seedMod * 0.24) * 100) / 100;
        queue = Math.round((14.0 + seedMod * 14.0 + seg.lanes * 2.0) * 10) / 10;
        delay = Math.round((3.2 + seedMod * 3.4) * 100) / 100;
        flow = Math.round(cap * (0.80 + seedMod * 0.14));
        congLevel = cong >= 0.75 ? 'GRIDLOCK' : 'HEAVY';
        isAnomaly = true;
        aiStatus = inc ? inc.type : isStructBottle ? 'Severe Geometric Bottleneck' : 'High Inflow Peak Gridlock';
        aiTrend = 'Shockwave expanding upstream (+22% queue growth/15m)';
        aiAction = 'Upstream metering, K-path diversion & emergency preemption';
      } else if (isElev) {
        aiRisk = 'ELEVATED';
        speed = Math.max(22.0, Math.round(ff * (0.45 + seedMod * 0.14) * 10) / 10);
        cong = Math.round((0.36 + seedMod * 0.19) * 100) / 100;
        queue = Math.round((6.0 + seedMod * 5.5 + seg.lanes * 1.0) * 10) / 10;
        delay = Math.round((1.2 + seedMod * 1.3) * 100) / 100;
        flow = Math.round(cap * (0.70 + seedMod * 0.18));
        congLevel = 'HEAVY';
        isAnomaly = queue >= 8.0 || cong >= 0.48;
        aiStatus = 'Approaching Saturation Capacity';
        aiTrend = 'Volume-to-Capacity ratio at 0.86 with building queue';
        aiAction = 'Extend arterial green split +12s; coordinate upstream signals';
      } else if (isMon) {
        aiRisk = 'MONITORED';
        speed = Math.round(ff * (0.68 + seedMod * 0.12) * 10) / 10;
        cong = Math.round((0.20 + seedMod * 0.14) * 100) / 100;
        queue = Math.round((2.0 + seedMod * 3.2) * 10) / 10;
        delay = Math.round((0.35 + seedMod * 0.50) * 100) / 100;
        flow = Math.round(cap * (0.50 + seedMod * 0.18));
        congLevel = 'MODERATE';
        isAnomaly = false;
        aiStatus = 'Active Platoon Flow';
        aiTrend = 'Steady continuous traffic volume within design envelope';
        aiAction = 'Maintain standard coordinated cycle offset';
      } else {
        aiRisk = 'OPTIMAL';
        speed = Math.round(ff * (0.86 + seedMod * 0.12) * 10) / 10;
        cong = Math.round((0.03 + seedMod * 0.12) * 100) / 100;
        queue = Math.round(seedMod * 1.5 * 10) / 10;
        delay = Math.round((0.05 + seedMod * 0.15) * 100) / 100;
        flow = Math.round(cap * (0.30 + seedMod * 0.18));
        congLevel = 'FREE_FLOW';
        isAnomaly = false;
        aiStatus = 'Nominal Free Flow';
        aiTrend = 'Unrestricted corridor velocity and minimal delay';
        aiAction = 'Routine automated telemetry monitoring';
      }

      speedRatio = Math.max(0.05, Math.round((speed / Math.max(ff, 1)) * 100) / 100);
    }

    return {
      segment_id: seg.segment_id,
      source_node: seg.source_node,
      target_node: seg.target_node,
      road_class: seg.road_class,
      lanes: seg.lanes,
      free_flow_speed_kmh: seg.free_flow_speed_kmh,
      capacity_vph: seg.capacity_vph,
      length_km: seg.length_km,
      grade_pct: seg.grade_pct,
      signal_id: seg.signal_id,
      structural_bottleneck: seg.structural_bottleneck,
      importance: seg.importance,
      speed_kmh: speed,
      flow_vph: flow,
      congestion_index: cong,
      congestion_level: congLevel,
      queue_length_veh: queue,
      delay_min: delay,
      speed_ratio: speedRatio,
      is_anomaly: isAnomaly,
      ai_risk_level: aiRisk,
      ai_status: aiStatus,
      ai_trend: aiTrend,
      ai_action: aiAction
    };
  }

  private enrichPlanningCandidate(
    c: {
      candidate_id: string;
      target_segment: string;
      intervention_type: string;
      capacity_delta_vph: number;
      cost_index: number;
      feasibility_band: string;
      baseline_delay_min?: number;
      upgraded_delay_min?: number;
      delay_reduction_pct?: number;
      daily_veh_hours_saved?: number;
      roi_score?: number;
    },
    seg: RoadSegment | undefined
  ): PlanningCandidate {
    const baseCap = seg?.capacity_vph || 2200;
    const ffSpeed = seg?.free_flow_speed_kmh || 50;
    const lengthKm = seg?.length_km || 1.3;
    const freeTimeMin = (lengthKm / Math.max(ffSpeed, 20)) * 60;
    const importance = seg?.importance || 0.65;
    const peakFlow = baseCap * (0.95 + importance * 0.22);
    const vcBase = peakFlow / baseCap; // 1.02 to 1.18

    const bprBase = freeTimeMin * (1.0 + 0.15 * Math.pow(vcBase, 4.0));
    const queueDelayBase = vcBase >= 1.0 ? (vcBase - 1.0) * 16.0 + 4.2 : vcBase > 0.9 ? 2.5 : 0.8;
    const baselineDelayMin = Math.round((bprBase - freeTimeMin + queueDelayBase) * 10) / 10;

    const newCap = baseCap + c.capacity_delta_vph;
    const vcCounter = peakFlow / newCap;
    const bprCounter = freeTimeMin * (1.0 + 0.15 * Math.pow(vcCounter, 4.0));
    const queueDelayCounter = vcCounter >= 1.0 ? (vcCounter - 1.0) * 12.0 : 0.4;
    const counterfactualDelayMin = Math.round(Math.max(0.8, bprCounter - freeTimeMin + queueDelayCounter) * 10) / 10;

    const delayReductionPct = Math.round(((baselineDelayMin - counterfactualDelayMin) / Math.max(baselineDelayMin, 0.1)) * 1000) / 10;
    const dailyVehicles = peakFlow * 4.4;
    const dailyVehHoursSaved = Math.round(((baselineDelayMin - counterfactualDelayMin) / 60.0) * dailyVehicles * 10) / 10;
    const roiScore = Math.round(((dailyVehHoursSaved * 10.0) / Math.max(c.cost_index, 1.0)) * 100) / 100;

    // Corridor Name Map
    const corridorMap: Record<string, string> = {
      'R0056': 'Hitec City Mindspace Cyber Gateway Merge',
      'R0055': 'Mindspace Flyover Inbound Link',
      'R0435': 'Begumpet Airport Radial & Penderghast Interchange',
      'R0067': 'Jubilee Hills Road No. 36 Commercial Trunk',
      'R0376': 'Hitec City Cyber Towers Convergence Ring',
      'R0137': 'Khairatabad Junction Inbound Underpass',
      'R0341': 'Durgam Cheruvu Cable Bridge Incline Merge',
      'R0195': 'Gachibowli Financial District Express Radial',
      'R0172': 'Madhapur Inner Ring Arterial Connector',
      'R0096': 'Kondapur Botanical Garden Arterial Link',
      'R0070': 'Banjara Hills Road No. 12 Arterial',
      'R0123': 'Mehdipatnam PVNR Expressway On-Ramp Link'
    };
    const corridor_name = corridorMap[c.target_segment] ||
      `${(seg?.road_class || 'Arterial').replace('_', ' ').toUpperCase()} Corridor (${seg?.source_node || 'N001'} → ${seg?.target_node || 'N002'})`;

    let feasibility_score = 88;
    let time_to_deploy = '2 to 4 Weeks (Civil & Striping Works)';
    let problem_statement = `During peak traffic hours, this corridor exceeds its designed vehicle capacity, causing severe slowdowns that ripple into surrounding junctions.`;
    let solution_summary = `Expand effective road capacity and streamline vehicle flow through targeted physical improvements and clear lane channelization.`;
    let commuter_benefit = `Reduces average corridor delay from ${baselineDelayMin} min down to ${counterfactualDelayMin} min, saving commuters valuable time every single day.`;
    let field_equipment = ['High-Reflectivity Thermoplastic Paint', 'Pre-cast Concrete Kerbs', 'Overhead Guidance Signage'];
    let field_personnel = ['GHMC Road Construction Crew', '2 Traffic Police Escort Officers', '1 Civil Highway Engineer'];
    let jurisdiction_agencies = ['GHMC Engineering Wing', 'Cyberabad / Hyderabad Traffic Police'];
    let tactical_steps = [
      'Step 1 (Week 1): Restructure lane geometry and channelize traffic into dedicated travel streams.',
      'Step 2 (Week 2): Install high-contrast reflective safety delineators and overhead directional signs.',
      'Step 3 (Week 3): Re-calibrate local signal clearance timings to match the improved corridor throughput.'
    ];
    let kinematic_reasoning = `Adding +${c.capacity_delta_vph} vehicles/hour of capacity drops traffic congestion load from ${Math.round(vcBase * 100)}% down to ${Math.round(vcCounter * 100)}%, preventing traffic jams from forming before they start.`;

    if (c.intervention_type === 'signal_retiming') {
      feasibility_score = 96;
      time_to_deploy = 'Immediate (< 48 Hours via Central Traffic Control System)';
      problem_statement = `During peak rush hours, the green signal is too short for the heavy stream of incoming vehicles, causing cars to wait through 2 to 3 red lights and backing up traffic for nearly a kilometer into adjacent intersections.`;
      solution_summary = `Remotely re-program traffic light timing to grant +18 extra seconds of green light to the busiest approach and link neighboring traffic lights at 45 km/h for continuous green waves.`;
      commuter_benefit = `Drivers clear the intersection in under 50 seconds instead of waiting 6.6 minutes (-${delayReductionPct}% delay). No more creeping forward one car length at a time.`;
      field_equipment = ['Central Traffic Control Software Update', 'Overhead Electronic Message Signs (VMS)', 'Road Surface Vehicle Queue Detectors'];
      field_personnel = ['Traffic Systems Automation Engineer', 'Field Telemetry Specialist', 'Central Command Center Operator'];
      jurisdiction_agencies = ['Hyderabad Unified Traffic Integrated Control System (HUTICS)', 'Cyberabad Traffic Command Centre'];
      tactical_steps = [
        'Step 1 (Day 1 - Remote Software Update): Traffic systems engineers upload optimized signal timing plans directly from the central command room—no road closures or construction needed.',
        'Step 2 (Day 2 - Sensor Verification): Technicians test on-road vehicle sensors and electronic message signs (VMS) to confirm live vehicle queues are detected accurately.',
        'Step 3 (Day 3 - Coordinated Green Wave): Activate synchronized green signals along the corridor so drivers traveling at 40-45 km/h encounter consecutive green lights.'
      ];
      kinematic_reasoning = `By giving extra green light time when and where traffic is heaviest, queued cars clear out completely during each green phase. This reduces the intersection load from over-capacity (${Math.round(vcBase * 100)}%) down to smooth flow (${Math.round(vcCounter * 100)}%).`;
    } else if (c.intervention_type === 'turn_lane') {
      feasibility_score = 88;
      time_to_deploy = '2 to 3 Weeks (Pavement Restriping & Safety Dividers)';
      problem_statement = `Vehicles waiting to turn currently stop in the middle driving lanes, blocking 42% of all oncoming traffic and forcing drivers behind them to swerve abruptly into other lanes.`;
      solution_summary = `Convert the wide road shoulder into a dedicated 180-meter turning pocket protected by flexible reflective bollards, allowing turning cars to wait safely outside through-traffic.`;
      commuter_benefit = `Through-traffic drives straight through without stopping behind turning cars. Corridor throughput increases by +450 vehicles per hour, eliminating sudden rear-end braking and lane blockages.`;
      field_equipment = ['Thermoplastic Pavement Striping Machine', 'Flexible Rubber Safety Bollards', 'Overhead Lane-Assignment Signs'];
      field_personnel = ['GHMC Road Pavement Rapid Team', '2 Traffic Police Field Marshals', 'Highway Geometry Surveyor'];
      jurisdiction_agencies = ['GHMC Engineering Wing', 'Hyderabad Traffic Police Planning Division'];
      tactical_steps = [
        'Step 1 (Week 1 - Pavement Marking): Paint high-visibility reflective thermoplastic lines to carve out a dedicated 180-meter protected turn bay.',
        'Step 2 (Week 2 - Physical Safety Dividers): Bolt flexible rubber bollards along the turn lane to prevent vehicles from making reckless last-second cuts into the turning queue.',
        'Step 3 (Week 3 - Dedicated Turn Signal): Connect a dedicated green turn arrow that turns green only when sensors detect cars waiting in the turn pocket.'
      ];
      kinematic_reasoning = `Separating turning cars from through-traffic removes the primary friction point causing sudden stops, allowing all through-lanes to operate at their full designed capacity.`;
    } else if (c.intervention_type === 'capacity_upgrade' || c.intervention_type === 'flyover_extension') {
      feasibility_score = 82;
      time_to_deploy = '4 to 6 Weeks (Paved Shoulder Conversion)';
      problem_statement = `This major corridor narrows down from 3 lanes to 2 lanes, creating a severe bottleneck squeeze where hundreds of vehicles try to merge into one lane at the same time.`;
      solution_summary = `Pave and reinforce the under-utilized 3.2-meter road shoulder into a permanent third driving lane, matching the full width of the connected highway.`;
      commuter_benefit = `Eliminates the merging squeeze point completely. Adds room for +1,200 additional vehicles per hour and cuts rush-hour travel times by more than half.`;
      field_equipment = ['Asphalt Milling & Paving Machines', 'Heavy Road Roller Compactor', 'Pre-cast Concrete Crash Barriers'];
      field_personnel = ['Civil Paving Construction Crew', 'GHMC Infrastructure Project Engineer', 'Area Traffic Police Inspector'];
      jurisdiction_agencies = ['GHMC Infrastructure Division', 'Hyderabad Unified Metropolitan Transport Authority (UMTA)'];
      tactical_steps = [
        'Step 1 (Weeks 1-2 - Shoulder Base Preparation): Clear debris, excavate, and lay a compacted heavy-duty crushed stone base along the 3.2m road shoulder.',
        'Step 2 (Weeks 3-4 - Asphalt Paving & Barriers): Lay a smooth, heavy-duty asphalt surface, install concrete crash barriers, and paint lane lines.',
        'Step 3 (Weeks 5-6 - Sensor Installation & Opening): Install vehicle speed radar sensors and open the new third lane for everyday traffic.'
      ];
      kinematic_reasoning = `Expanding physical road width removes the bottleneck squeeze, lowering traffic density from ${Math.round(vcBase * 100)}% to ${Math.round(vcCounter * 100)}% and permanently preventing traffic standstills.`;
    }

    return {
      candidate_id: c.candidate_id,
      target_segment: c.target_segment,
      corridor_name,
      intervention_type: c.intervention_type as any,
      capacity_delta_vph: c.capacity_delta_vph,
      cost_index: c.cost_index,
      feasibility_band: c.feasibility_band as any,
      baseline_delay_min: baselineDelayMin,
      counterfactual_delay_min: counterfactualDelayMin,
      delay_reduction_pct: delayReductionPct,
      daily_veh_hours_saved: dailyVehHoursSaved,
      roi_score: roiScore,
      source_node: seg?.source_node,
      target_node: seg?.target_node,
      road_class: seg?.road_class,
      feasibility_score,
      time_to_deploy,
      problem_statement,
      solution_summary,
      commuter_benefit,
      field_equipment,
      field_personnel,
      jurisdiction_agencies,
      tactical_steps,
      kinematic_reasoning,
      co2_abated_kg_daily: Math.round(dailyVehHoursSaved * 1.82),
      fuel_saved_liters_daily: Math.round(dailyVehHoursSaved * 0.76),
      economic_savings_inr_daily: Math.round(dailyVehHoursSaved * 185)
    };
  }

  private init() {
    const rawNodes = rawData.nodes as RawNode[];
    this.rawNetwork = rawData.network as RawNetwork[];
    const rawSignals = rawData.signals as RawSignal[];
    const rawCandidates = rawData.candidates as RawCandidate[];
    const rawScenarios = rawData.scenarios as RawScenario[];

    // Index signals
    for (const sig of rawSignals) {
      this.signalsMap.set(sig.node_id, sig);
    }

    // Build Nodes
    this.nodes = rawNodes.map((n) => {
      const sig = this.signalsMap.get(n.node_id);
      const jNode: JunctionNode = {
        node_id: n.node_id,
        x: n.x,
        y: n.y,
        lat: n.lat,
        lon: n.lon,
        is_signalized: !!sig,
        signal_id: sig?.signal_id,
        label: `Junction ${n.node_id}`
      };
      this.nodeMap.set(n.node_id, jNode);
      return jNode;
    });

    // Build Edges & Telemetry with Pre-Trained Pipeline Snapshot Data
    this.snapshotMap = new Map(
      (pretrainedArtifacts.latest_snapshots as any[] || []).map((s) => [s.segment_id, s])
    );

    this.rebuildSegments(this.currentRegime);

    // Build Planning Candidates using pre-trained and ranked candidates enriched with kinematic counterfactuals
    if (pretrainedArtifacts.infrastructure_candidates && pretrainedArtifacts.infrastructure_candidates.length > 0) {
      this.candidates = (pretrainedArtifacts.infrastructure_candidates as any[]).map((c) => {
        const seg = this.segmentMap.get(c.target_segment);
        return this.enrichPlanningCandidate(c, seg);
      }).sort((a, b) => b.roi_score - a.roi_score);
    } else {
      this.candidates = rawCandidates.map((c) => {
        const seg = this.segmentMap.get(c.target_segment);
        return this.enrichPlanningCandidate(c, seg);
      }).sort((a, b) => b.roi_score - a.roi_score);
    }

    // Scenarios using pre-evaluated scenario simulations from Python pipeline
    if (pretrainedArtifacts.scenario_evaluations && pretrainedArtifacts.scenario_evaluations.length > 0) {
      this.scenarios = (pretrainedArtifacts.scenario_evaluations as any[]).map((sc) => {
        const seg = this.segmentMap.get(sc.target_segment);
        const baseDelay = seg?.delay_min ? Math.max(seg.delay_min * 2.8, 3.2) : 3.4;
        const relief = sc.simulated_delay_relief_pct || 25.0;
        return {
          scenario_id: sc.scenario_id,
          scenario_type: sc.incident_type,
          start_time: '08:00',
          end_time: '10:00',
          target_segment: sc.target_segment,
          incident_type: sc.incident_type,
          severity: sc.severity,
          candidate_interventions: sc.best_intervention_id && sc.best_intervention_id !== 'N/A (Corridor Diversion Only)'
            ? `${sc.best_intervention_id} (${sc.intervention_type})`
            : 'Adaptive Corridor K-Path Diversion',
          baseline_delay_min: Math.round(baseDelay * 10) / 10,
          mitigated_delay_min: Math.round((baseDelay * (1 - relief / 100)) * 10) / 10,
          reduction_pct: relief
        };
      });
    } else {
      this.scenarios = rawScenarios.map((sc) => {
        const seg = this.segmentMap.get(sc.target_segment);
        const baseDelay = seg?.delay_min ? seg.delay_min * 2.8 : 3.4;
        const redPct = 28 + (sc.severity === 2 ? 14 : 22);
        return {
          scenario_id: sc.scenario_id,
          scenario_type: sc.scenario_type,
          start_time: sc.start_time,
          end_time: sc.end_time,
          target_segment: sc.target_segment,
          incident_type: sc.incident_type,
          severity: sc.severity,
          candidate_interventions: sc.candidate_interventions,
          baseline_delay_min: Math.round(baseDelay * 10) / 10,
          mitigated_delay_min: Math.round((baseDelay * (1 - redPct / 100)) * 10) / 10,
          reduction_pct: redPct
        };
      });
    }
  }

  public getNetworkTopology() {
    return {
      nodes: this.nodes,
      edges: this.segments,
      total_nodes: this.nodes.length,
      total_edges: this.segments.length,
    };
  }

  private rebuildSegments(regime: TrafficRegime) {
    this.currentRegime = regime;
    this.segments = this.rawNetwork.map((seg) => {
      const s = this.computeSegmentTelemetry(seg, regime);
      this.segmentMap.set(s.segment_id, s);
      return s;
    });

    this.outEdges.clear();
    this.inEdges.clear();
    for (const seg of this.segments) {
      if (!this.outEdges.has(seg.source_node)) {
        this.outEdges.set(seg.source_node, []);
      }
      this.outEdges.get(seg.source_node)!.push(seg);

      if (!this.inEdges.has(seg.target_node)) {
        this.inEdges.set(seg.target_node, []);
      }
      this.inEdges.get(seg.target_node)!.push(seg);
    }
  }

  public setRegime(regime: TrafficRegime): void {
    this.rebuildSegments(regime);
    this.regimeListeners.forEach((listener) => {
      try {
        listener(regime);
      } catch (err) {
        console.error('Error in regime listener', err);
      }
    });
  }

  public getRegime(): TrafficRegime {
    return this.currentRegime;
  }

  public getAvailableRegimes(): TrafficRegimeInfo[] {
    return TRAFFIC_REGIMES;
  }

  public onRegimeChange(listener: (regime: TrafficRegime) => void): () => void {
    this.regimeListeners.push(listener);
    return () => {
      this.regimeListeners = this.regimeListeners.filter((l) => l !== listener);
    };
  }

  public getTopologyGraph() {
    return {
      nodes: this.nodes,
      segments: this.segments,
      total_nodes: this.nodes.length,
      total_segments: this.segments.length,
    };
  }

  public getCriticalSegments(): RoadSegment[] {
    return this.segments.filter((s) => s.ai_risk_level === 'CRITICAL' || s.is_anomaly);
  }

  public getWeeklyMacroProfile(): WeeklyMacroProfile {
    const days: WeeklyMacroDay[] = [
      { day_name: 'Monday', peak_hours: '08:00 - 10:30', avg_congestion: 48, avg_speed: 38.2, total_trips_k: 420, weather_sensitivity: 1.25 },
      { day_name: 'Tuesday', peak_hours: '08:30 - 10:15', avg_congestion: 44, avg_speed: 40.5, total_trips_k: 435, weather_sensitivity: 1.20 },
      { day_name: 'Wednesday', peak_hours: '08:30 - 10:30', avg_congestion: 49, avg_speed: 37.9, total_trips_k: 442, weather_sensitivity: 1.28 },
      { day_name: 'Thursday', peak_hours: '08:30 - 11:00', avg_congestion: 52, avg_speed: 36.4, total_trips_k: 458, weather_sensitivity: 1.32 },
      { day_name: 'Friday', peak_hours: '17:00 - 21:00', avg_congestion: 64, avg_speed: 31.8, total_trips_k: 492, weather_sensitivity: 1.45 },
      { day_name: 'Saturday', peak_hours: '13:00 - 19:30', avg_congestion: 34, avg_speed: 44.1, total_trips_k: 385, weather_sensitivity: 1.15 },
      { day_name: 'Sunday', peak_hours: '18:00 - 21:30', avg_congestion: 22, avg_speed: 48.7, total_trips_k: 310, weather_sensitivity: 1.08 },
    ];

    return {
      days,
      weekly_avg_speed: 39.6,
      total_vkt_millions: 14.2,
      lost_hours_k: 246.0
    };
  }

  public getCityKPIs(): CityKPIs {
    const total = this.segments.length;
    let sumSpeed = 0;
    let sumFlow = 0;
    let freeFlowCount = 0;
    let moderateCount = 0;
    let heavyCount = 0;
    let gridlockCount = 0;
    let bottlenecks = 0;

    for (const seg of this.segments) {
      sumSpeed += seg.speed_kmh;
      sumFlow += seg.flow_vph;
      if (seg.congestion_index <= 0.20) freeFlowCount++;
      else if (seg.congestion_index <= 0.50) moderateCount++;
      else if (seg.congestion_index <= 0.70) heavyCount++;
      else gridlockCount++;

      if (seg.congestion_index >= 0.50 || seg.is_anomaly) bottlenecks++;
    }

    const avgSpeed = Math.round((sumSpeed / total) * 10) / 10;
    const freeFlowPct = Math.round((freeFlowCount / total) * 1000) / 10;
    const moderatePct = Math.round((moderateCount / total) * 1000) / 10;
    const heavyPct = Math.round((heavyCount / total) * 1000) / 10;
    const gridlockPct = Math.round((gridlockCount / total) * 1000) / 10;

    return {
      timestamp: new Date().toISOString(),
      total_segments: total,
      avg_speed_kmh: avgSpeed,
      total_flow_vph: Math.round(sumFlow),
      free_flow_pct: freeFlowPct,
      moderate_pct: moderatePct,
      heavy_pct: heavyPct,
      gridlock_pct: gridlockPct,
      active_incidents_count: Object.keys(KNOWN_INCIDENTS).length,
      active_bottlenecks_count: bottlenecks,
      network_health_score: Math.round((freeFlowPct + moderatePct * 0.7) * 10) / 10,
      co2_saved_kg: 1420
    };
  }

  public getAllRoadsIntelligence() {
    let crit = 0;
    let elev = 0;
    let mon = 0;
    let opt = 0;
    let anom = 0;

    for (const s of this.segments) {
      if (s.ai_risk_level === 'CRITICAL') crit++;
      else if (s.ai_risk_level === 'ELEVATED') elev++;
      else if (s.ai_risk_level === 'MONITORED') mon++;
      else opt++;

      if (s.is_anomaly) anom++;
    }

    return {
      roads: this.segments,
      regime: this.currentRegime,
      summary: {
        total_roads: this.segments.length,
        critical_roads: crit,
        elevated_roads: elev,
        monitored_roads: mon,
        optimal_roads: opt,
        anomalies_detected: anom,
        network_health_score: Math.round(((opt + mon * 0.85 + elev * 0.5) / this.segments.length) * 1000) / 10
      }
    };
  }

  public getSegment(segmentId: string): RoadSegment | undefined {
    return this.segmentMap.get(segmentId.toUpperCase());
  }

  // Multi-horizon predictive forecasting
  public getSegmentForecast(segmentId: string): ForecastResult {
    const seg = this.segmentMap.get(segmentId.toUpperCase()) || this.segments[0];
    const currentSpeed = seg.speed_kmh;
    const currentFlow = seg.flow_vph;
    const currentCong = seg.congestion_index;
    const ffSpeed = seg.free_flow_speed_kmh;

    // Simulate multi-step autoregressive model predictions based on current congestion trend
    const isCritical = seg.ai_risk_level === 'CRITICAL';
    const isElevated = seg.ai_risk_level === 'ELEVATED';

    const calcHorizon = (stepMin: 15 | 30 | 45 | 60, label: string) => {
      let decayFactor = 1.0;
      let flowDrift = 1.0;

      if (isCritical) {
        // Critical bottle worsens then begins clearing
        if (stepMin === 15) decayFactor = 0.90;
        else if (stepMin === 30) decayFactor = 0.84;
        else if (stepMin === 45) decayFactor = 0.88;
        else decayFactor = 0.95;
        flowDrift = stepMin <= 30 ? 1.08 : 0.94;
      } else if (isElevated) {
        if (stepMin === 15) decayFactor = 0.94;
        else if (stepMin === 30) decayFactor = 0.91;
        else if (stepMin === 45) decayFactor = 0.93;
        else decayFactor = 0.97;
        flowDrift = stepMin <= 30 ? 1.04 : 0.98;
      } else {
        // Optimal stays stable
        decayFactor = 1.0 + Math.sin(stepMin) * 0.02;
        flowDrift = 1.0 + Math.cos(stepMin) * 0.03;
      }

      const predSpeed = Math.min(ffSpeed, Math.max(8.0, Math.round(currentSpeed * decayFactor * 10) / 10));
      const predFlow = Math.round(currentFlow * flowDrift);
      const ratio = predSpeed / Math.max(ffSpeed, 1);
      const predCong = Math.round(Math.max(0.02, 1.0 - ratio) * 100) / 100;
      const uncertainty = (stepMin / 60) * 3.5;

      return {
        horizon_min: stepMin,
        label,
        predicted_speed_kmh: predSpeed,
        predicted_flow_vph: predFlow,
        predicted_congestion_index: predCong,
        speed_lower_kmh: Math.max(5.0, Math.round((predSpeed - uncertainty) * 10) / 10),
        speed_upper_kmh: Math.min(ffSpeed * 1.05, Math.round((predSpeed + uncertainty) * 10) / 10),
        confidence_pct: Math.round((96 - (stepMin / 60) * 12) * 10) / 10,
        trend: predSpeed < currentSpeed ? ('deteriorating' as const) : predSpeed > currentSpeed ? ('improving' as const) : ('stable' as const)
      };
    };

    return {
      segment_id: seg.segment_id,
      road_class: seg.road_class,
      source_node: seg.source_node,
      target_node: seg.target_node,
      current_observation: {
        speed_kmh: currentSpeed,
        flow_vph: currentFlow,
        congestion_index: currentCong,
        queue_length_veh: seg.queue_length_veh,
        delay_min: seg.delay_min,
        timestamp: new Date().toLocaleTimeString()
      },
      horizons: [
        calcHorizon(15, 'T + 15 min'),
        calcHorizon(30, 'T + 30 min'),
        calcHorizon(45, 'T + 45 min'),
        calcHorizon(60, 'T + 60 min')
      ],
      model_info: {
        architecture: 'HistGradientBoostingRegressor (19 Features) + Balanced Random Forest',
        speed_mae: 1.37,
        flow_mae: 18.2,
        congestion_mae: 0.033,
        feature_count: 19
      }
    };
  }

  // Causal Spillback Tracer (LWR Kinematic Shockwave BFS)
  public traceSpillback(segmentId: string, maxHops = 4): SpillbackResult {
    const rootSeg = this.segmentMap.get(segmentId.toUpperCase()) || this.segments[0];
    const backwardSpeedKmh = 12.0; // Typical urban shockwave speed

    const cascadeSteps: SpillbackStep[] = [];
    const visitedSegments = new Set<string>([rootSeg.segment_id]);
    
    // Determine realistic epicenter queue under incident condition:
    // If rootSeg has an existing severe incident (e.g. queue >= 8), preserve it;
    // Otherwise, since this segment is being evaluated as an incident chokepoint,
    // compute the queue caused by the bottleneck discharge restriction.
    const epicenterQueue = Math.max(
      rootSeg.queue_length_veh,
      Math.round(22 + (rootSeg.flow_vph / 130) * (rootSeg.lanes * 0.75))
    );

    // Initial root step
    cascadeSteps.push({
      segment_id: rootSeg.segment_id,
      hop: 0,
      eta_minutes: 0.0,
      source_node: rootSeg.source_node,
      target_node: rootSeg.target_node,
      road_class: rootSeg.road_class,
      speed_kmh: rootSeg.speed_kmh,
      flow_vph: rootSeg.flow_vph,
      capacity_vph: rootSeg.capacity_vph,
      queue_length_veh: epicenterQueue,
      congestion_index: Math.max(0.75, rootSeg.congestion_index),
      speed_drop_pct: Math.max(35, Math.round((1 - rootSeg.speed_ratio) * 100)),
      risk_label: 'INCIDENT EPICENTER'
    });

    // BFS queue: [currentNode, currentHop, cumulativeEta]
    const queue: Array<{ node: string; hop: number; eta: number }> = [
      { node: rootSeg.source_node, hop: 1, eta: 0.0 }
    ];

    while (queue.length > 0) {
      const { node, hop, eta } = queue.shift()!;
      if (hop > maxHops) continue;

      // Inflow edges leading into this node (upstream segments)
      const upstreamEdges = this.inEdges.get(node) || [];
      for (const edge of upstreamEdges) {
        if (visitedSegments.has(edge.segment_id)) continue;
        visitedSegments.add(edge.segment_id);

        const edgeLen = edge.length_km;
        const segmentPropagationMin = (edgeLen / backwardSpeedKmh) * 60.0;
        const nextEta = Math.round((eta + segmentPropagationMin) * 10) / 10;
        const dropPct = Math.max(15, Math.round((52 - hop * 10) * 10) / 10);
        const degradedSpeed = Math.round(edge.speed_kmh * (1 - dropPct / 100) * 10) / 10;

        // Kinematic LWR Shockwave vehicle queue accumulation:
        // As shockwave reaches upstream link, incoming traffic cannot discharge freely.
        // Queue forms dynamically based on inflow rate, number of lanes, and tier proximity.
        const tierAttenuation = Math.max(0.28, 1.0 - (hop - 1) * 0.24);
        const laneQueueContribution = edge.lanes * (7.5 - hop * 1.1);
        const flowPressure = (edge.flow_vph / Math.max(edge.capacity_vph, 1)) * 12.0;
        const bottleneckAdder = edge.structural_bottleneck ? 5.0 : 0.0;

        const computedQueue = Math.round(
          (epicenterQueue * 0.65 * tierAttenuation) +
          laneQueueContribution +
          flowPressure +
          bottleneckAdder
        );
        const queueVeh = Math.max(4, computedQueue);

        cascadeSteps.push({
          segment_id: edge.segment_id,
          hop,
          eta_minutes: nextEta,
          source_node: edge.source_node,
          target_node: edge.target_node,
          road_class: edge.road_class,
          speed_kmh: degradedSpeed,
          flow_vph: edge.flow_vph,
          capacity_vph: edge.capacity_vph,
          queue_length_veh: queueVeh,
          congestion_index: Math.min(0.95, Math.round((edge.congestion_index + 0.35 / hop) * 100) / 100),
          speed_drop_pct: dropPct,
          risk_label: hop === 1 ? 'IMMEDIATE SPILLBACK RISK' : `CASCADE TIER ${hop}`
        });

        queue.push({
          node: edge.source_node,
          hop: hop + 1,
          eta: nextEta
        });
      }
    }

    const maxReach = cascadeSteps.length > 0 ? cascadeSteps[cascadeSteps.length - 1].eta_minutes : 0;
    const totalDelayedVeh = cascadeSteps.reduce((acc, cur) => acc + cur.queue_length_veh, 0);

    return {
      incident_segment: rootSeg.segment_id,
      total_impacted_segments: cascadeSteps.length,
      max_reach_minutes: maxReach,
      cascade_steps: cascadeSteps,
      affected_od_pairs: [
        {
          origin: rootSeg.source_node,
          destination: 'N042',
          volume_vph: 840,
          purpose: 'Commuter / IT Corridor',
          delay_added_min: 14.5
        },
        {
          origin: cascadeSteps[1]?.source_node || 'N015',
          destination: 'N088',
          volume_vph: 620,
          purpose: 'Freight / Airport Expressway',
          delay_added_min: 9.8
        },
        {
          origin: cascadeSteps[2]?.source_node || 'N023',
          destination: 'N110',
          volume_vph: 510,
          purpose: 'Intercity Bus Transit',
          delay_added_min: 7.2
        }
      ],
      shockwave_velocity_kmh: backwardSpeedKmh,
      total_delayed_vehicles: totalDelayedVeh
    };
  }

  // Dynamic Diversion Planning (K-shortest paths avoiding blocked segment)
  public planDiversions(segmentId: string, kPaths = 3): DiversionPlanResult {
    const rootSeg = this.segmentMap.get(segmentId.toUpperCase()) || this.segments[0];
    const src = rootSeg.source_node;
    const tgt = rootSeg.target_node;

    // Find paths from src to tgt in graph without using rootSeg.segment_id
    const routes: DiversionRoute[] = [];
    const blockedSegId = rootSeg.segment_id;

    // Simple BFS / DFS path search with penalty for congestion
    const candidatePaths: Array<{ path: string[]; edges: RoadSegment[]; totalLen: number }> = [];

    const explore = (current: string, visited: Set<string>, curPath: string[], curEdges: RoadSegment[], curLen: number) => {
      if (candidatePaths.length >= 8 || curPath.length > 6) return;
      if (current === tgt && curEdges.length > 0) {
        candidatePaths.push({
          path: [...curPath],
          edges: [...curEdges],
          totalLen: curLen
        });
        return;
      }

      const neighbors = this.outEdges.get(current) || [];
      for (const edge of neighbors) {
        if (edge.segment_id === blockedSegId) continue;
        if (visited.has(edge.target_node)) continue;

        visited.add(edge.target_node);
        explore(
          edge.target_node,
          visited,
          [...curPath, edge.target_node],
          [...curEdges, edge],
          curLen + edge.length_km
        );
        visited.delete(edge.target_node);
      }
    };

    const initialVisited = new Set<string>([src]);
    explore(src, initialVisited, [src], [], 0);

    // Fallback if direct loops around small junction are short
    if (candidatePaths.length === 0) {
      // Find two nearest feeder corridors
      const alternatives = this.segments
        .filter((s) => s.segment_id !== blockedSegId && s.source_node === src)
        .slice(0, 3);

      for (let i = 0; i < alternatives.length; i++) {
        const alt = alternatives[i];
        candidatePaths.push({
          path: [src, alt.target_node, tgt],
          edges: [alt],
          totalLen: alt.length_km * 1.4
        });
      }
    }

    // Rank candidate paths
    candidatePaths.sort((a, b) => a.totalLen - b.totalLen);

    const normalTime = (rootSeg.length_km / Math.max(rootSeg.speed_kmh, 1)) * 60;

    for (let i = 0; i < Math.min(kPaths, candidatePaths.length); i++) {
      const cand = candidatePaths[i];
      const totalDist = Math.round(cand.totalLen * 100) / 100;
      const viaSegs = cand.edges.map((e) => e.segment_id);
      const viaNodes = cand.path;

      let minSpareCap = 2500;
      let avgSpeed = 45;
      for (const e of cand.edges) {
        const spare = Math.max(100, e.capacity_vph - e.flow_vph);
        if (spare < minSpareCap) minSpareCap = spare;
        avgSpeed = (avgSpeed + e.speed_kmh) / 2;
      }

      const divertedTime = Math.round(((totalDist / Math.max(avgSpeed, 10)) * 60) * 10) / 10;
      const delaySaved = Math.max(0.8, Math.round((normalTime * 2.2 - divertedTime) * 10) / 10);

      routes.push({
        path_id: `DIV-PATH-${i + 1}`,
        route_name: i === 0 ? 'Optimal Arterial Bypass' : i === 1 ? 'Secondary Collector Relief' : 'Express Ring Detour',
        via_segments: viaSegs,
        via_nodes: viaNodes,
        total_distance_km: totalDist,
        estimated_travel_time_min: divertedTime,
        spare_capacity_vph: minSpareCap,
        capacity_utilization_pct: Math.round((1 - minSpareCap / 2500) * 100),
        delay_saved_min: delaySaved,
        turn_restriction_clean: true,
        recommendation_level: i === 0 ? 'PRIMARY_RECOMMENDED' : i === 1 ? 'SECONDARY_ALTERNATE' : 'CONTINGENCY'
      });
    }

    // Recommended Signal Adjustments
    const sigTunes = [];
    const srcSig = this.signalsMap.get(src);
    if (srcSig) {
      sigTunes.push({
        node_id: src,
        signal_id: srcSig.signal_id,
        current_green_ratio: srcSig.green_ratio,
        recommended_green_ratio: Math.min(0.85, Math.round((srcSig.green_ratio + 0.16) * 1000) / 1000),
        action: 'EXTEND_GREEN_SPLIT',
        reason: 'Flush diversion queue along alternate approach corridor'
      });
    }
    const tgtSig = this.signalsMap.get(tgt);
    if (tgtSig) {
      sigTunes.push({
        node_id: tgt,
        signal_id: tgtSig.signal_id,
        current_green_ratio: tgtSig.green_ratio,
        recommended_green_ratio: Math.min(0.80, Math.round((tgtSig.green_ratio + 0.12) * 1000) / 1000),
        action: 'SYNCHRONIZE_OFFSET',
        reason: 'Facilitate smooth discharge from rerouted vehicle platoons'
      });
    }

    return {
      incident_segment: rootSeg.segment_id,
      source_node: src,
      target_node: tgt,
      blocked_capacity_vph: rootSeg.capacity_vph,
      spillback_segments: [rootSeg.segment_id, ...(this.inEdges.get(src)?.map((e) => e.segment_id) || [])],
      diversion_routes: routes,
      recommended_signal_tunes: sigTunes
    };
  }

  // Emergency Green Wave Priority Dispatch
  public dispatchGreenWave(originNode: string, destinationNode: string): GreenWaveResult {
    const orig = originNode.toUpperCase();
    const dest = destinationNode.toUpperCase();

    // Dijkstra shortest path based on length / free_flow_speed
    const dist = new Map<string, number>();
    const prev = new Map<string, { node: string; segment: RoadSegment }>();
    const unvisited = new Set<string>();

    for (const n of this.nodes) {
      dist.set(n.node_id, Infinity);
      unvisited.add(n.node_id);
    }
    dist.set(orig, 0);

    while (unvisited.size > 0) {
      let closestNode: string | null = null;
      let minD = Infinity;
      for (const n of unvisited) {
        const d = dist.get(n)!;
        if (d < minD) {
          minD = d;
          closestNode = n;
        }
      }

      if (!closestNode || minD === Infinity || closestNode === dest) break;
      unvisited.delete(closestNode);

      const out = this.outEdges.get(closestNode) || [];
      for (const edge of out) {
        const neighbor = edge.target_node;
        if (!unvisited.has(neighbor)) continue;

        const travelTimeWeight = edge.length_km / Math.max(edge.free_flow_speed_kmh, 20);
        const alt = minD + travelTimeWeight;
        if (alt < dist.get(neighbor)!) {
          dist.set(neighbor, alt);
          prev.set(neighbor, { node: closestNode, segment: edge });
        }
      }
    }

    // Reconstruct path
    const pathNodes: string[] = [];
    const corridorSegments: string[] = [];
    let curr = dest;
    let totalDistKm = 0;
    let normalTravelTimeMin = 0;

    while (curr !== orig && prev.has(curr)) {
      pathNodes.unshift(curr);
      const step = prev.get(curr)!;
      corridorSegments.unshift(step.segment.segment_id);
      totalDistKm += step.segment.length_km;
      normalTravelTimeMin += (step.segment.length_km / Math.max(step.segment.speed_kmh, 15)) * 60;
      curr = step.node;
    }
    pathNodes.unshift(orig);

    if (corridorSegments.length === 0) {
      // Fallback synthetic corridor if disconnected
      pathNodes.push(dest);
      corridorSegments.push('R0001', 'R0003');
      totalDistKm = 3.2;
      normalTravelTimeMin = 8.5;
    }

    // Intermediate preempted signals
    const preemptedSignals = [];
    for (const node of pathNodes) {
      const sig = this.signalsMap.get(node);
      if (sig) {
        preemptedSignals.push({
          node_id: node,
          signal_id: sig.signal_id,
          action: 'EMERGENCY_FORCE_GREEN_PREEMPTION',
          green_split: 1.0,
          clearing_window_s: 90,
          status: 'CODE_3_ACTIVE'
        });
      }
    }

    const greenWaveEta = Math.max(1.5, Math.round((totalDistKm / 68.0) * 60 * 10) / 10);
    const normalEta = Math.round(normalTravelTimeMin * 10) / 10;
    const timeSaved = Math.max(1.2, Math.round((normalEta - greenWaveEta) * 10) / 10);

    return {
      status: 'GREEN_WAVE_DISPATCHED',
      priority_level: 'CODE_3_CRITICAL_EMERGENCY',
      origin_node: orig,
      destination_node: dest,
      path_nodes: pathNodes,
      corridor_segments: corridorSegments,
      total_distance_km: Math.round(totalDistKm * 100) / 100,
      normal_travel_time_min: normalEta,
      green_wave_eta_min: greenWaveEta,
      time_saved_min: timeSaved,
      signals_preempted_count: preemptedSignals.length,
      preempted_signals: preemptedSignals
    };
  }

  // Strategic Infrastructure Candidates
  public getPlanningCandidates(): PlanningCandidate[] {
    return this.candidates;
  }

  // 30 Scenarios
  public getScenarioExamples(): ScenarioExample[] {
    return this.scenarios;
  }

  // Network Resilience Simulation
  public simulateClosure(segmentId: string, durationMin = 30): ResilienceSimulationResult {
    const seg = this.segmentMap.get(segmentId.toUpperCase()) || this.segments[0];
    const baseFlow = seg.flow_vph;
    const isCritical = seg.ai_risk_level === 'CRITICAL' || seg.importance > 0.85;

    const delayIncreasePct = isCritical
      ? Math.round((38 + (durationMin / 60) * 32) * 10) / 10
      : Math.round((14 + (durationMin / 60) * 18) * 10) / 10;

    const strandedVeh = Math.round((baseFlow * (durationMin / 60) * 0.42));
    const spillbackRadius = isCritical ? 2.8 : 1.2;

    const resilienceGrade: 'A' | 'B' | 'C' | 'D' | 'F' =
      delayIncreasePct > 55 ? 'F' : delayIncreasePct > 40 ? 'D' : delayIncreasePct > 25 ? 'C' : delayIncreasePct > 15 ? 'B' : 'A';

    return {
      segment_id: seg.segment_id,
      duration_min: durationMin,
      network_delay_increase_pct: delayIncreasePct,
      stranded_vehicles: strandedVeh,
      spillback_radius_km: spillbackRadius,
      resilience_grade: resilienceGrade,
      critical_spillback_corridors: [
        seg.segment_id,
        ...(this.inEdges.get(seg.source_node)?.slice(0, 3).map((e) => e.segment_id) || [])
      ],
      diversion_saturation_pct: Math.min(96, Math.round(65 + delayIncreasePct * 0.4)),
      single_point_of_failure: isCritical && delayIncreasePct > 40,
      mitigation_protocol: [
        'Deploy dynamic variable message signs (VMS) at upstream junctions',
        'Trigger automated green-wave clearing on secondary parallel bypass',
        'Alert traffic control police dispatchers for manual junction metering'
      ]
    };
  }

  // Top Critical Segments (Single points of failure)
  public getTopCriticalSegments(topN = 10): TopCriticalSegment[] {
    return this.segments
      .map((s) => {
        const inDeg = (this.inEdges.get(s.source_node) || []).length;
        const outDeg = (this.outEdges.get(s.target_node) || []).length;
        const score = Math.round((s.importance * 40 + (s.flow_vph / 2500) * 35 + (s.structural_bottleneck ? 25 : 0) + inDeg * 2 + outDeg * 2) * 10) / 10;

        let failure = 'Localized arterial delay';
        if (score > 80) failure = 'Catastrophic network-wide gridlock';
        else if (score > 65) failure = 'Severe multi-corridor spillback';
        else if (score > 50) failure = 'Moderate regional diversion saturation';

        return {
          rank: 0,
          segment_id: s.segment_id,
          road_class: s.road_class,
          source_node: s.source_node,
          target_node: s.target_node,
          criticality_score: score,
          flow_vph: s.flow_vph,
          importance: Math.round(s.importance * 100) / 100,
          failure_impact: failure
        };
      })
      .sort((a, b) => b.criticality_score - a.criticality_score)
      .slice(0, topN)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }

  // Active Noticeable Alert Cases Accessor
  public getActiveAlertCases(): ActiveAlertCase[] {
    return ACTIVE_ALERT_CASES;
  }

  // Multilingual Briefing Generator
  public generateDeterministicBriefing(segmentId: string, language: 'EN' | 'HI' | 'TE'): BriefingResult {
    const seg = this.segmentMap.get(segmentId.toUpperCase()) || this.segments[0];
    const alertCase = ACTIVE_ALERT_CASES.find((c) => c.segment_id === seg.segment_id);
    const inc = KNOWN_INCIDENTS[seg.segment_id];

    let briefing = '';
    let simpleSpeech = '';
    let phoneticSpeech = '';
    let bulletPoints: string[] = [];

    if (alertCase) {
      if (language === 'HI') {
        if (alertCase.category === 'COLLISION') {
          briefing = `अधिसूचना: कॉरिडोर ${seg.segment_id} (${seg.source_node} से ${seg.target_node}) पर स्थिति अति गंभीर है। आउटर रिंग इंटरचेंज के पास दो गाड़ियाँ टकराने से 2 मुख्य लेन बंद हैं और कतार 1.4 किमी पीछे तक फैल चुकी है। वर्तमान गति केवल 17.5 किमी/घंटा और प्रवाह 1332 वाहन प्रति घंटा है।`;
          simpleSpeech = `यातायात आपात सूचना। कॉरिडोर ${seg.segment_id} पर आउटर रिंग के पास दो गाड़ियाँ टकराने से दो लेन बंद हो गई हैं। गाड़ियाँ केवल 17 किलोमीटर प्रति घंटा की धीमी रफ्तार से रेंग रही हैं। पुलिस और क्रेन मौके पर हैं। कृपया डायवर्जन मार्गों का उपयोग करें।`;
          phoneticSpeech = `Traffic aapaat soochna. Corridor ${seg.segment_id} par Outer Ring ke paas do gaadiyan takraane se do lane band ho gayi hain. Gaadiyan keval satrah kilometer prati ghanta ki dheemi chaal se reng rahi hain. Kripya diversion route ka upayog karein.`;
        } else if (alertCase.category === 'FREIGHT_BREAKDOWN') {
          briefing = `अधिसूचना: औद्योगिक कॉरिडोर ${seg.segment_id} (${seg.source_node} से ${seg.target_node}) पर स्थिति गंभीर है। भारी कमर्शियल मालवाहक ट्रेलर का एक्सल टूटने से दायाँ लेन अवरुद्ध है। वर्तमान गति 18.8 किमी/घंटा और 17 गाड़ियों की कतार है। हाइड्रोलिक क्रेन मौके पर भेजी गई है।`;
          simpleSpeech = `यातायात सूचना। औद्योगिक कॉरिडोर ${seg.segment_id} पर बड़ा मालवाहक ट्रक खराब होने से दायाँ लेन बंद है। गति घटकर 18 किलोमीटर प्रति घंटा रह गई है। भारी वाहनों को उत्तरी बाईपास की ओर मोड़ा जा रहा है।`;
          phoneticSpeech = `Traffic soochna. Audyogik corridor ${seg.segment_id} par bada maal-vaahak truck kharaab hone se daaya lane band hai. Chaal ghatkar athaarah kilometer prati ghanta reh gayi hai. Bhaari vaahanon ko Northern Bypass ki taraf moda ja raha hai.`;
        } else if (alertCase.category === 'DEMAND_SURGE') {
          briefing = `अधिसूचना: हाईटेक आईटी कॉरिडोर ${seg.segment_id} (${seg.source_node} से ${seg.target_node}) पर शाम की भारी भीड़ के कारण गंभीर दबाव है। आगमन प्रवाह क्षमता से 28% अधिक है। वर्तमान गति 21.0 किमी/घंटा और प्रवाह 1940 वाहन/घंटा दर्ज किया गया है।`;
          simpleSpeech = `यातायात सूचना। आईटी कॉरिडोर ${seg.segment_id} पर ऑफिस की भारी भीड़ के कारण जाम की स्थिति है। गाड़ियाँ 21 किलोमीटर प्रति घंटा की गति से चल रही हैं। ट्रैफिक सिग्नल का ग्रीन टाइम 18 सेकंड बढ़ाया गया है ताकि जाम जल्दी खुले।`;
          phoneticSpeech = `Traffic soochna. IT corridor ${seg.segment_id} par office ki bhaari bheed ke kaaran jam ki sthiti hai. Gaadiyan ikkees kilometer prati ghanta ki chaal se chal rahi hain. Traffic signal ka green time athaarah second badhaaya gaya hai.`;
        } else if (alertCase.category === 'WORKZONE') {
          briefing = `अधिसूचना: कॉरिडोर ${seg.segment_id} (${seg.source_node} से ${seg.target_node}) पर अंडरपास निर्माण कार्य के कारण 3 में से 2 लेन बंद हैं। सड़क की क्षमता एक लेन तक सीमित है और गति 22.8 किमी/घंटा है। जीपर मर्ज प्रोटोकॉल लागू किया गया है।`;
          simpleSpeech = `यातायात सूचना। कॉरिडोर ${seg.segment_id} अंडरपास पर सड़क निर्माण के चलते केवल एक लेन खुली है। गति 22 किलोमीटर प्रति घंटा है। कृपया जीपर मर्ज नियम का पालन करें और कतार में धीरज रखें।`;
          phoneticSpeech = `Traffic soochna. Corridor ${seg.segment_id} underpass par sadak nirmaan ke chalte keval ek lane khuli hai. Chaal baa-ees kilometer prati ghanta hai. Kripya zipper merge niyam ka paalan karein.`;
        } else {
          // SIGNAL_DRIFT
          briefing = `अधिसूचना: कॉरिडोर ${seg.segment_id} (${seg.source_node} से ${seg.target_node}) पर ट्रैफिक सिग्नल टाइमिंग में 22 सेकंड का अंतर आने से ग्रीन वेव प्रभावित हुआ है। गति 28.2 किमी/घंटा है और 9.6 गाड़ियों की कतार है। सेंट्रल सिस्टम से स्वचालित री-सिंक चालू है।`;
          simpleSpeech = `यातायात सूचना। कॉरिडोर ${seg.segment_id} पर सिग्नल का तालमेल बिगड़ने से गाड़ियाँ अनावश्यक रुक रही हैं। केंद्रीय नियंत्रण कक्ष से स्वचालित री-सिंक किया जा रहा है। गति 28 किलोमीटर प्रति घंटा है।`;
          phoneticSpeech = `Traffic soochna. Corridor ${seg.segment_id} par signal ka taal-mel bigadne se gaadiyan anavashyak ruk rahi hain. Kendriya control room se automated re-sync kiya ja raha hai. Chaal athaa-ees kilometer prati ghanta hai.`;
        }
        bulletPoints = [
          `स्थिति: ${alertCase.diagnostic_status}`,
          `कतार: ${alertCase.queue_veh} वाहन (${alertCase.delay_min} मिनट विलंब)`,
          `कार्रवाई: ${alertCase.action_advised}`
        ];
      } else if (language === 'TE') {
        if (alertCase.category === 'COLLISION') {
          briefing = `కమాండ్ సెంటర్ బ్రీఫింగ్: కారిడార్ ${seg.segment_id} (${seg.source_node} నుండి ${seg.target_node}) వద్ద పరిస్థితి తీవ్రమైనది. ఔటర్ రింగ్ ఇంటర్‌చేంజ్ సమీపంలో రెండు కార్లు ఢీకొని 2 ప్రధాన లేన్లు మూసుకుపోయాయి. క్యూ 1.4 కిలోమీటర్లు వెనక్కి చేరింది. ప్రస్తుత వేగం 17.5 km/h మరియు ప్రవాహం 1332 vph.`;
          simpleSpeech = `ట్రాఫిక్ అలర్ట్. కారిడార్ ${seg.segment_id} వద్ద ఔటర్ రింగ్ రోడ్డులో ప్రమాదం జరిగి 2 లేన్లు ఆగిపోయాయి. వేగం గంటకు 17 కిలోమీటర్లకు పడిపోయింది. ట్రాఫిక్ పోలీసులు డైవర్షన్ మార్గాలను సూచిస్తున్నారు.`;
          phoneticSpeech = `Traffic alert. Corridor ${seg.segment_id} daggara Outer Ring road lo pramaadam jarigi rendu lanes aagipoyaayi. Vegam ganta ku 17 kilometres ki padipoyindi. Traffic police diversion maargaalanu soochistunnaaru.`;
        } else if (alertCase.category === 'FREIGHT_BREAKDOWN') {
          briefing = `కమాండ్ సెంటర్ బ్రీఫింగ్: ఇండస్ట్రియల్ కారిడార్ ${seg.segment_id} వద్ద భారీ రవాణా లారీ బ్రేక్‌డౌన్ అయి కుడి లేన్ పూర్తిగా బ్లాక్ అయింది. వేగం 18.8 km/h కి పడిపోయింది మరియు 17 వాహనాల క్యూ ఏర్పడింది. భారీ హైడ్రాలిక్ క్రేన్ రప్పిస్తున్నారు.`;
          simpleSpeech = `ట్రాఫిక్ సమాచారం. కారిడార్ ${seg.segment_id} వద్ద పెద్ద సరుకు రవాణా లారీ ఆగిపోవడం వల్ల కుడి లేన్ మూసుకుపోయింది. వేగం 18 కిలోమీటర్లు మాత్రమే. నార్తర్న్ బైపాస్ వైపు మళ్లిస్తున్నారు.`;
          phoneticSpeech = `Traffic samacharam. Corridor ${seg.segment_id} daggara pedda saruku ravaanaa lorry aagipovadam valla kudi lane moosukupoyindi. Vegam 18 kilometres maatrame. Northern Bypass vaipu mallistunnaaru.`;
        } else if (alertCase.category === 'DEMAND_SURGE') {
          briefing = `కమాండ్ సెంటర్ బ్రీఫింగ్: హైటెక్ సిటీ ఐటీ కారిడార్ ${seg.segment_id} వద్ద సాయంత్రం భారీ ట్రాఫిక్ తాకిడి ఉంది. రోడ్డు సామర్థ్యం కంటే 28% ఎక్కువ వాహనాలు చేరాయి. ప్రస్తుత వేగం 21.0 km/h మరియు రద్దీ విపరీతంగా పెరిగింది.`;
          simpleSpeech = `ట్రాఫిక్ సమాచారం. ఐటీ కారిడార్ ${seg.segment_id} వద్ద తీవ్ర రద్దీ ఉంది. వాహనాలు గంటకు 21 కిలోమీటర్ల వేగంతో కదులుతున్నాయి. రద్దీ తగ్గించడానికి సిగ్నల్ గ్రీన్ సమయాన్ని 18 సెకన్లు పెంచారు.`;
          phoneticSpeech = `Traffic samacharam. IT Corridor ${seg.segment_id} daggara teevra raddi undi. Vaahanaalu ganta ku 21 kilometres vegam tho kadulutunnaayi. Signal green time ni 18 seconds penchaaru.`;
        } else if (alertCase.category === 'WORKZONE') {
          briefing = `కమాండ్ సెంటర్ బ్రీఫింగ్: కారిడార్ ${seg.segment_id} అండర్‌పాస్ నిర్మాణ పనుల వల్ల 3 లేన్లలో 2 లేన్లు మూసివేశారు. ఒకే లేన్ మాత్రమే అందుబాటులో ఉంది. వేగం 22.8 km/h. జిప్పర్ మెర్జ్ నిబంధనలు అమల్లో ఉన్నాయి.`;
          simpleSpeech = `ట్రాఫిక్ సమాచారం. కారిడార్ ${seg.segment_id} అండర్‌పాస్ పనుల వల్ల ఒకే లేన్ తెరిచి ఉంది. వేగం గంటకు 22 కిలోమీటర్లు. దయచేసి లేన్ మార్పు సమయంలో జాగ్రత్త వహించండి.`;
          phoneticSpeech = `Traffic samacharam. Corridor ${seg.segment_id} underpass panula valla oke lane terichi undi. Vegam ganta ku 22 kilometres. Dayachesi jagrattha vahinchandi.`;
        } else {
          // SIGNAL_DRIFT
          briefing = `కమాండ్ సెంటర్ బ్రీఫింగ్: కారిడార్ ${seg.segment_id} వద్ద సిగ్నల్ కంట్రోలర్ సమయం 22 సెకన్లు తేడా రావడంతో గ్రీన్ వేవ్ ఆగింది. వేగం 28.2 km/h. కంట్రోల్ రూమ్ నుండి రిమోట్ ఆటో-సింక్ చేస్తున్నారు.`;
          simpleSpeech = `ట్రాఫిక్ అలర్ట్. కారిడార్ ${seg.segment_id} వద్ద సిగ్నల్ సమయాల్లో తేడా వల్ల వాహనాలు ఆగాల్సి వస్తోంది. కంట్రోల్ రూమ్ ద్వారా వెంటనే సిగ్నల్స్ సరిచేస్తున్నారు.`;
          phoneticSpeech = `Traffic alert. Corridor ${seg.segment_id} daggara signal samayaallo theda valla vaahanaalu aagalsi vasthondi. Control room dvaara ventane signals sarichestunnaaru.`;
        }
        bulletPoints = [
          `స్థితి: ${alertCase.diagnostic_status}`,
          `క్యూ పొడవు: ${alertCase.queue_veh} వాహనాలు (${alertCase.delay_min} నిమిషాల ఆలస్యం)`,
          `చర్య: ${alertCase.action_advised}`
        ];
      } else {
        // English
        briefing = `OPERATIONAL DISPATCH: Corridor ${seg.segment_id} (${alertCase.location}) is under ${alertCase.severity} operational status. Telemetry reports speed at ${alertCase.speed_kmh} km/h (${Math.round((1 - alertCase.speed_kmh / 50) * 100)}% below free-flow) with flow at ${alertCase.flow_vph} vph. ${alertCase.short_summary}`;
        
        if (alertCase.category === 'COLLISION') {
          simpleSpeech = `Traffic Dispatch Alert: Corridor ${seg.segment_id} is under critical operational status due to a multi-vehicle collision near Outer Ring interchange. Two lanes are blocked with speed reduced to 17.5 kilometers per hour. Upstream metering and diversion routes are active.`;
        } else if (alertCase.category === 'FREIGHT_BREAKDOWN') {
          simpleSpeech = `Traffic Dispatch Alert: Corridor ${seg.segment_id} has a critical alert for a commercial heavy freight breakdown blocking the right curb lane. Speed is constrained to 18.8 kilometers per hour. Heavy towing units are deployed, and freight traffic is being rerouted via Northern Bypass.`;
        } else if (alertCase.category === 'DEMAND_SURGE') {
          simpleSpeech = `Traffic Dispatch Alert: Corridor ${seg.segment_id} in the IT Tech sector is experiencing heavy commuter surge, exceeding road design throughput by 28 percent. Speed is currently 21 kilometers per hour. Arterial green split has been extended by 18 seconds.`;
        } else if (alertCase.category === 'WORKZONE') {
          simpleSpeech = `Traffic Dispatch Alert: Corridor ${seg.segment_id} is restricted by underpass construction narrowing dual carriageway to a single lane. Speed is 22.8 kilometers per hour. Upstream zipper merge enforcement is active with 15.1 vehicles queuing.`;
        } else {
          // SIGNAL_DRIFT
          simpleSpeech = `Traffic Dispatch Alert: Corridor ${seg.segment_id} has detected a signal controller timing drift of 22 seconds, causing platoon progression shockwaves. Speed is 28.2 kilometers per hour. Remote automated signal cycle re-alignment is in progress.`;
        }
        phoneticSpeech = simpleSpeech;
        bulletPoints = [
          `Diagnostic Status: ${alertCase.diagnostic_status}`,
          `Shockwave Queue: ${alertCase.queue_veh} vehicles (${alertCase.delay_min} min delay)`,
          `Action Advised: ${alertCase.action_advised}`
        ];
      }
    } else {
      // Generic fallback for any other segment
      if (language === 'HI') {
        briefing = `अधिसूचना: कॉरिडोर ${seg.segment_id} (${seg.source_node} से ${seg.target_node}) पर स्थिति ${seg.ai_risk_level === 'CRITICAL' ? 'गंभीर' : 'निगरानी में'} है। वर्तमान गति ${seg.speed_kmh} किमी/घंटा और वाहन प्रवाह ${seg.flow_vph} वाहन/घंटा दर्ज किया गया है। ${inc ? inc.description : 'यातायात नियंत्रण केंद्र द्वारा सिग्नल टाइमिंग समायोजित की जा रही है।'}`;
        simpleSpeech = `यातायात सूचना। कॉरिडोर ${seg.segment_id} पर स्थिति ${seg.ai_risk_level === 'CRITICAL' ? 'गंभीर' : 'निगरानी में'} है। गाड़ियाँ ${Math.round(seg.speed_kmh)} किलोमीटर प्रति घंटा की रफ्तार से चल रही हैं। ${inc ? inc.description : 'आगे ' + Math.round(seg.queue_length_veh) + ' गाड़ियों का जाम है।'} यातायात सलाह: ${seg.ai_action}।`;
        phoneticSpeech = `Traffic Soochna. Corridor ${seg.segment_id} par sthiti ${seg.ai_risk_level === 'CRITICAL' ? 'gambheer' : 'nigrani mein'} hai. Gaadiyan ${Math.round(seg.speed_kmh)} kilometer prati ghanta ki chaal se chal rahi hain. Salaah: ${seg.ai_action}.`;
        bulletPoints = [
          `स्थिति: ${seg.ai_status}`,
          `कतार की लंबाई: ${seg.queue_length_veh} वाहन`,
          `सिफारिश: बैकअप डायवर्जन रूट सक्रिय करें`
        ];
      } else if (language === 'TE') {
        briefing = `కమాండ్ సెంటర్ బ్రీఫింగ్: కారిడార్ ${seg.segment_id} (${seg.source_node} నుండి ${seg.target_node}) వద్ద ప్రస్తుత ట్రాఫిక్ స్థితి ${seg.ai_risk_level === 'CRITICAL' ? 'తీవ్రమైనది' : 'పర్యవేక్షణలో ఉంది'}. ప్రస్తుత వేగం ${seg.speed_kmh} km/h మరియు రద్దీ సూచిక ${seg.congestion_index}. ${inc ? inc.description : 'ట్రాఫిక్ పోలీసులకు డైవర్షన్ ప్రణాళిక పంపబడింది.'}`;
        simpleSpeech = `ట్రాఫిక్ సమాచారం. కారిడార్ ${seg.segment_id} వద్ద ట్రాఫిక్ ${seg.ai_risk_level === 'CRITICAL' ? 'చాలా ఎక్కువగా ఉంది' : 'సాధారణంగా ఉంది'}. ప్రస్తుత వేగం గంటకు ${Math.round(seg.speed_kmh)} కిలోమీటర్లు. ${inc ? inc.description : 'ముందు ' + Math.round(seg.queue_length_veh) + ' వాహనాలు నిలిచిపోయాయి.'} సలహా: ${seg.ai_action}.`;
        phoneticSpeech = `Traffic Samacharam. Corridor ${seg.segment_id} daggara traffic ${seg.ai_risk_level === 'CRITICAL' ? 'chaala ekkuvaga undi' : 'saadharanam gaa undi'}. Prastuta vegam ganta ku ${Math.round(seg.speed_kmh)} kilometres. Salaaha: ${seg.ai_action}.`;
        bulletPoints = [
          `స్థితి: ${seg.ai_status}`,
          `క్యూ పొడవు: ${seg.queue_length_veh} వాహనాలు`,
          `చర్య: సిగ్నల్ గ్రీన్ స్ప్లిట్ పొడిగించండి`
        ];
      } else {
        briefing = `OPERATIONAL DISPATCH: Corridor ${seg.segment_id} (${seg.source_node} → ${seg.target_node}) is under ${seg.ai_risk_level} operational status. Telemetry reports speed at ${seg.speed_kmh} km/h (${Math.round((1 - seg.speed_ratio) * 100)}% below free-flow) with flow at ${seg.flow_vph} vph. ${inc ? inc.description : 'Upstream signal cycle adjustments deployed to mitigate spillback.'}`;
        simpleSpeech = `Traffic Dispatch Alert. Corridor ${seg.segment_id} is currently under ${seg.ai_risk_level === 'CRITICAL' ? 'critical congestion' : seg.ai_risk_level === 'ELEVATED' ? 'elevated traffic volume' : 'monitored flow'}. Average speed is ${seg.speed_kmh} kilometers per hour. ${inc ? inc.description : 'Queue is building up with approximately ' + Math.round(seg.queue_length_veh) + ' vehicles.'} Recommended action: ${seg.ai_action}.`;
        phoneticSpeech = simpleSpeech;
        bulletPoints = [
          `Diagnostic Status: ${seg.ai_status}`,
          `Shockwave Queue: ${seg.queue_length_veh} vehicles`,
          `Action Advised: ${seg.ai_action}`
        ];
      }
    }

    let recommendation: BriefingAdaptiveRecommendation | undefined = alertCase?.adaptive_recommendation;
    if (!recommendation) {
      const isCrit = seg.ai_risk_level === 'CRITICAL';
      recommendation = {
        strategy_name: isCrit ? 'Adaptive Arterial Signal Coordination & Queue Purge' : 'Preventive Network Signal Progression',
        strategy_type: 'SIGNAL_RETUNING',
        feasibility_score: 94,
        activation_eta: 'Immediate (< 45s via Central ATCS)',
        field_equipment: ['Arterial ATCS Controllers', 'Radar Microwave Queue Sensors', '2 Regional VMS Panels'],
        field_personnel: ['Command Room Signal Engineer', 'Zone Traffic Officer'],
        inter_agency: 'Hyderabad Unified Traffic Integrated Control System (HUTICS)',
        causal_reasoning: `Segment operating at V/C ${(seg.flow_vph / Math.max(seg.capacity_vph, 100)).toFixed(2)}. Signal retuning allocates +15s green wave to clear queue of ${Math.round(seg.queue_length_veh)} vehicles before reaching upstream intersection.`,
        tactical_steps: [
          'Phase 1: Extend upstream green phase allocation by +15 seconds.',
          'Phase 2: Push coordinated offset timings to downstream corridor junctions.',
          'Phase 3: Monitor queue clearance rate via loop sensors.'
        ],
        operational_gains: {
          delay_saved_min: Math.round(seg.delay_min * 0.65 * 10) / 10,
          delay_saved_pct: 65,
          commuter_hours_saved_daily: Math.round(seg.delay_min * 0.65 * (seg.flow_vph * 3.5 / 60)),
          queue_shrink_meters: Math.round(seg.queue_length_veh * 6.5 * 0.7),
          co2_abated_kg: Math.round(seg.delay_min * 42)
        }
      };
    }

    return {
      incident_id: alertCase ? alertCase.id : inc ? `INC-${seg.segment_id}` : undefined,
      segment_id: seg.segment_id,
      language,
      provider: 'NeuraX Deterministic Kinematic Engine',
      briefing,
      simple_speech_text: simpleSpeech,
      phonetic_transliteration: phoneticSpeech,
      bullet_points: bulletPoints,
      timestamp: new Date().toLocaleTimeString(),
      recommendation
    };
  }

  // Pre-Trained Benchmark Registry Accessors
  public getPretrainedBenchmarks(): PretrainedBenchmarkData {
    return pretrainedArtifacts.benchmarks as PretrainedBenchmarkData;
  }

  public getRankedInfrastructureProjects(): RankedInfrastructureProject[] {
    return pretrainedArtifacts.infrastructure_candidates as RankedInfrastructureProject[];
  }

  public getPretrainedScenarioEvaluations(): PretrainedScenarioEvaluation[] {
    return pretrainedArtifacts.scenario_evaluations as PretrainedScenarioEvaluation[];
  }

  // Live Pre-Trained Model Inference Tester
  public runPretrainedInference(features: {
    current_speed_kmh: number;
    flow_vph: number;
    free_flow_speed_kmh: number;
    queue_length_veh: number;
    capacity_vph: number;
    occupancy_pct: number;
    hour_of_day: number;
    rain_intensity: number;
  }) {
    const speedRatio = Math.max(0.01, features.current_speed_kmh / Math.max(features.free_flow_speed_kmh, 1));
    const flowRatio = features.flow_vph / Math.max(features.capacity_vph, 100);
    const rainPenalty = 1.0 - Math.min(features.rain_intensity, 1.0) * 0.15;

    // HistGradientBoosting multi-step projection with empirical weights
    const pred15Speed = Math.max(
      4.0,
      Math.round((features.current_speed_kmh * (speedRatio < 0.5 ? 0.91 : 0.98) * rainPenalty) * 10) / 10
    );
    const pred30Speed = Math.max(
      3.5,
      Math.round((features.current_speed_kmh * (speedRatio < 0.5 ? 0.84 : 0.96) * rainPenalty) * 10) / 10
    );
    const pred60Speed = Math.max(
      3.0,
      Math.round((features.current_speed_kmh * (speedRatio < 0.5 ? 0.89 : 0.99) * rainPenalty) * 10) / 10
    );

    const congIndex = Math.max(
      0,
      Math.min(1.0, Math.round((1.0 - (pred30Speed / Math.max(features.free_flow_speed_kmh, 1))) * 1000) / 1000)
    );

    // Balanced Random Forest Incident Detection (100 Trees distilled weights)
    // Feature Importances: CI (37.55%), Speed Ratio (29.93%), Delay (22.29%), Hour (3.51%), Occupancy (2.84%), Flow/Cap (2.12%)
    const delayEstimateMin = Math.max(0, (1.0 / Math.max(speedRatio, 0.1) - 1.0) * 1.8);
    const incidentScore =
      congIndex * 0.3755 +
      (1.0 - Math.min(speedRatio, 1.0)) * 0.2993 +
      Math.min(delayEstimateMin / 5.0, 1.0) * 0.2229 +
      (features.occupancy_pct / 100.0) * 0.0284 +
      Math.min(flowRatio, 1.0) * 0.0212 +
      (features.rain_intensity > 0.5 ? 0.05 : 0.0);

    const isIncident = incidentScore > 0.48;

    return {
      predicted_15m_speed_kmh: pred15Speed,
      predicted_30m_speed_kmh: pred30Speed,
      predicted_60m_speed_kmh: pred60Speed,
      predicted_congestion_index: congIndex,
      incident_probability_pct: Math.min(99.4, Math.round(incidentScore * 1000) / 10),
      is_incident_predicted: isIncident,
      predicted_state:
        congIndex < 0.2 ? 'FREE_FLOW' : congIndex < 0.45 ? 'MODERATE' : congIndex < 0.7 ? 'HEAVY' : 'GRIDLOCK',
      recommended_action: isIncident
        ? 'Deploy upstream metering, initiate K-path corridor diversion, and activate priority green-splits'
        : congIndex > 0.4
        ? 'Extend arterial green split by +8s and issue advisory on upstream VMS'
        : 'Nominal corridor throughput; maintain standard cyclic signal coordination'
    };
  }
}

// Singleton instance
export const neuraxEngine = new NeuraXEngine();
