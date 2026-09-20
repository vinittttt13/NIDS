export type AttackCategory = 
  | 'Reconnaissance' 
  | 'Credential Attacks' 
  | 'Network Availability' 
  | 'Protocol / Behavior Anomalies';

export type AttackTypeId = 
  | 'PORT_SCAN' 
  | 'BRUTE_FORCE' 
  | 'DOS_SYN_FLOOD' 
  | 'DDOS_DISTRIBUTED_FLOOD'
  | 'VOLUMETRIC_TRAFFIC_FLOOD'
  | 'DNS_ANOMALY' 
  | 'SUSPICIOUS_FLOW';

export type AttackIntensity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AttackScenario {
  id: AttackTypeId;
  name: string;
  category: AttackCategory;
  description: string;
  commandSimulated: string;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'DNS' | 'Mixed';
  sourceIp: string;
  sourceType: 'Single Node' | 'Multi-Source Lab Botnet (Simulated)' | 'Distributed Test Nodes';
  sourceNodes?: string[];
  targetIp: string;
  targetHostname: string;
  targetPort: number | string;
  expectedClass: string;
  expectedSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedDurationSec: number;
  availableIntensities?: AttackIntensity[];
  currentIntensity?: AttackIntensity;
  rateLimit?: string;
  safetyLimit?: {
    rateCeiling: string;
    maxDurationSec: number;
    isolatedSubnetOnly: boolean;
  };
  safetySafeguards?: string[];
  parameters: {
    label: string;
    value: string;
  }[];
  indicators?: string[];
}

export type AttackStatus = 
  | 'IDLE' 
  | 'INITIALIZING' 
  | 'ARMED' 
  | 'RUNNING' 
  | 'TRANSMITTING' 
  | 'TRAFFIC_OBSERVED' 
  | 'DETECTING' 
  | 'COMPLETED' 
  | 'STOPPING' 
  | 'STOPPED' 
  | 'RESOLVED';

export type AttackLifecycleStage = 
  | 'ATTACK_INITIALIZED'
  | 'ARMED'
  | 'RUNNING'
  | 'TRAFFIC_GENERATED'
  | 'TRAFFIC_OBSERVED'
  | 'NETWORK_SENSOR_CAPTURED'
  | 'FEATURE_EXTRACTION'
  | 'AI_ANALYSIS'
  | 'CLASSIFICATION'
  | 'THREAT_DETECTED'
  | 'RISK_ASSESSMENT'
  | 'ALERT_GENERATED'
  | 'SOC_ALERT'
  | 'RESOLVED';

export type AttackTimelineStage = AttackLifecycleStage;

export interface ActiveAttackState {
  scenarioId: AttackTypeId;
  status: AttackStatus;
  startedAt: number;
  durationSec: number;
  elapsedSec: number;
  packetsSent: number;
  currentStage: AttackTimelineStage;
  intensity: AttackIntensity;
  sourceNodes?: string[];
  logs: string[];
}

export interface TimelineEvent {
  id: string;
  stage: AttackTimelineStage;
  title: string;
  description: string;
  timestamp: string;
  elapsedMs: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  meta?: Record<string, any>;
}

export interface IAttackController {
  startAttack(
    id: AttackTypeId, 
    intensity?: AttackIntensity, 
    onTimelineEvent?: (event: TimelineEvent) => void
  ): Promise<{ success: boolean; message: string }>;
  stopAttack(): Promise<{ success: boolean; message?: string }>;
}
