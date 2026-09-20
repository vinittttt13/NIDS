import type { AttackScenario, AttackTypeId, AttackIntensity, TimelineEvent } from '../types/attack';
import type { ThreatAlert } from '../types/threat';
import type { 
  LiveTelemetrySnapshot, 
  TrafficDataPoint, 
  ActiveConnectionFlow, 
  HostTrafficMetric, 
  ProtocolMetric,
  LabStatus,
  WebSocketMessage,
  SensorStatusMode,
  AiEngineStatusMode,
  NetworkDiagnosticResult
} from '../types/telemetry';
import type { ModelMetricStats, NetworkFeatureItem, InferenceInspection } from '../types/ai';
import type { LabHostNode } from '../types/network';

export interface ITelemetryProvider {
  subscribe(callback: (snapshot: LiveTelemetrySnapshot) => void): () => void;
  subscribeEvents?(callback: (msg: WebSocketMessage) => void): () => void;
  getHistory(duration: '1M' | '5M' | '15M' | '1H'): TrafficDataPoint[] | Promise<TrafficDataPoint[]>;
  getActiveConnections(): ActiveConnectionFlow[] | Promise<ActiveConnectionFlow[]>;
  getThreatFeed(): ThreatAlert[] | Promise<ThreatAlert[]>;
  getHosts(): HostTrafficMetric[] | Promise<HostTrafficMetric[]>;
  getProtocolDistribution(): ProtocolMetric[] | Promise<ProtocolMetric[]>;
  getAiInference(): InferenceInspection | Promise<InferenceInspection>;
  getFeatures(schema: '41_FEATURES' | '78_FEATURES'): NetworkFeatureItem[] | Promise<NetworkFeatureItem[]>;
  getModelStats(): ModelMetricStats | Promise<ModelMetricStats>;
  getLabNodes(): LabHostNode[] | Promise<LabHostNode[]>;
  getLabStatus?(): Promise<LabStatus>;
  testConnection?(): Promise<NetworkDiagnosticResult | { apiReachable: boolean; wsConnected: boolean; latencyMs: number; details?: any }>;
}

export interface IAttackController {
  getAvailableScenarios(): AttackScenario[];
  getScenario(id: AttackTypeId): AttackScenario | undefined;
  startAttack(id: AttackTypeId, intensity?: AttackIntensity, onTimelineEvent?: (event: TimelineEvent) => void): Promise<{ success: boolean; message: string }>;
  stopAttack(): Promise<{ success: boolean; message?: string }>;
  isAttackActive(): boolean;
  getActiveScenarioId(): AttackTypeId | null;
}

export interface INetworkSensorProvider {
  getSensorMode(): SensorStatusMode;
  isSensorOnline(): boolean;
}

export interface IAiInferenceProvider {
  getAiEngineMode(): AiEngineStatusMode;
  isAiEngineReady(): boolean;
}
