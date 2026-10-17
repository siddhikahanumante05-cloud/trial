export type KilnClass = 'FCBK' | 'CFCBK' | 'Zigzag';

export type KilnPeriod = '2023-24' | '2025-26';

export interface Kiln {
  id: string;
  lat: number;
  lon: number;
  class: KilnClass;
  confidence: number;
  angle_deg: number;
  width_m: number;
  height_m: number;
  period: KilnPeriod;
  tile_id: string;
  in_register: boolean;
  claimed_conversion?: boolean;
  coordinate_precision?: string;
  source?: string;
  tehsil?: string;
  village?: string;
  road_access?: string;
  soil_type?: string;
  gee_scene_id?: string;
}

export type ConversionStatus = 'Converted' | 'Still FCBK' | 'Demolished' | 'Unclear';

export interface ConversionMatch {
  id_2023: string;
  kiln_2023: Kiln;
  status: ConversionStatus;
  match_2025?: Kiln;
  candidate_matches?: Kiln[];
  distance_m?: number;
  reason: string;
}

export interface ScoreFactor {
  label: string;
  points: number;
}

export interface ScoredKiln extends Kiln {
  priorityScore: number;
  factors: ScoreFactor[];
  oneLineReason: string;
  rank: number;
  neighbourCount1km: number;
  clusterId?: number;
  clusterOrder?: number;
}

export interface KilnCluster {
  id: number;
  name: string;
  centerLat: number;
  centerLon: number;
  kilns: ScoredKiln[];
  radiusMeters: number;
  semiMajorM: number;
  semiMinorM: number;
  angleDeg: number;
}

export interface ModelMetrics {
  mAP50: string;
  apFCBK: string;
  apCFCBK: string;
  apZigzag: string;
}
