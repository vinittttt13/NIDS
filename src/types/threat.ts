export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ThreatStatus = 'ACTIVE' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED';

export interface ExplainableAiFactor {
  factor: string;
  weight: number; // percentage or impact score 0-100
  baselineValue: string | number;
  observedValue: string | number;
  direction: 'ELEVATED' | 'ABNORMAL' | 'DEVIATION' | 'EXCESSIVE';
}

export interface ThreatEvent {
  id: string;
  timestamp: string;
  attackType: string;
  source: string;
  target: string;
  protocol: string;
  confidence: number;
  anomalyScore: number;
  riskScore: number;
  severity: string;
  category?: string;
  detectionLatencyMs?: number;
  xaiFactors?: ExplainableAiFactor[];
}

export interface ThreatAlert {
  id: string;
  attackType: string;
  category: string;
  severity: SeverityLevel;
  sourceIp: string;
  sourcePort: number;
  targetIp: string;
  targetPort: number;
  protocol: string;
  confidence: number; // 0.00 - 1.00
  anomalyScore: number; // 0.00 - 1.00
  riskScore: number; // 0 - 100
  timestamp: string;
  isoTime: string;
  detectionLatencyMs: number;
  status: ThreatStatus;
  packetCount: number;
  byteCount: number;
  xaiFactors: ExplainableAiFactor[];
  modelRecommendation: string;
  rawPcapSample?: string;
  mitigationAction?: string;
}
