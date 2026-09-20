export type NetworkTransportMode = 'AUTO' | 'ETHERNET' | 'WI-FI';
export type ActiveTransportType = 'ETHERNET' | 'WI-FI' | 'STANDALONE' | 'OFFLINE';

export type SensorStatusMode = 'LIVE' | 'SIMULATED' | 'NOT_CONFIGURED' | 'OFFLINE';
export type AiEngineStatusMode = 'LIVE' | 'DEMO' | 'OFFLINE';
export type OperationMode = 'DEMO' | 'HYBRID' | 'LIVE';

export interface NetworkInterfaceInfo {
  name: string;
  displayName?: string;
  ip: string;
  type?: string;
  status?: string;
  netmask?: string;
  mac?: string;
  isWifi?: boolean;
  isEthernet?: boolean;
  isLoopback?: boolean;
  isConnected?: boolean;
  isUp?: boolean;
  isPrimary?: boolean;
  speedMbps?: number;
  bytesSent?: number;
  bytesRecv?: number;
  sensorAttachable?: boolean;
}

export interface NetworkDiagnosticResult {
  apiReachable: boolean;
  fastApiReachable?: boolean;
  wsConnected: boolean;
  latencyMs: number;
  sensorStatus: SensorStatusMode;
  aiEngineStatus: AiEngineStatusMode;
  transportType: ActiveTransportType;
  activeTransport?: ActiveTransportType;
  transportPreference?: NetworkTransportMode;
  ethernetAvailable?: boolean;
  wifiAvailable?: boolean;
  pc1Ip?: string;
  pc2Ip?: string;
  localIp?: string;
  hostname?: string;
  activeInterface?: string;
  fastApiLatencyMs?: number;
  operationMode?: OperationMode;
  interfaces?: NetworkInterfaceInfo[];
  timestamp?: string;
  details?: any;
}

export interface LabAttackRecord {
  attack_id: string;
  scenario: string;
  intensity: string;
  source_ip: string;
  target_ip: string;
  started_at: string;
  stopped_at: string | null;
  duration_seconds: number;
  status: 'ACTIVE' | 'COMPLETED' | 'STOPPED';
  iso_time?: string;
}

export interface AppNotification {
  notification_id: string;
  event_id: string;
  attack_id?: string;
  type: 'LAB_ATTACK_STARTED' | 'LAB_ATTACK_STOPPED' | 'THREAT_DETECTED' | 'THREAT_RESOLVED' | 'SYSTEM_STATUS';
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  timestamp: string;
  iso_time?: string;
  read: boolean;
  data?: any;
}

export interface SystemDiagnosticsInfo {
  pcRole: string;
  clientIp: string;
  nidsServerIp: string;
  apiStatus: string;
  websocketStatus: string;
  networkInterface: string;
  sensorStatus: string;
  aiStatus: string;
  lastEventId: string;
  lastEventType: string;
  lastEventTimestamp: string;
  eventsReceivedCount: number;
  eventsDroppedCount: number;
  eventsStoredCount?: number;
  activeThreatsCount: number;
  criticalThreatsCount: number;
  operationMode: string;
  timestamp?: string;
}

export interface LiveTelemetrySnapshot {
  timestamp: string;
  packetsPerSec: number;
  flowsPerSec: number;
  bytesPerSec: number;
  activeFlowsCount: number;
  threatsDetectedCount: number;
  criticalThreatsCount: number;
  aiDetectionRate: number; // e.g. 97.8%
  avgDetectionLatencyMs: number;
  suspiciousTrafficRatio: number; // e.g. 0.04 (4%)
}

export interface NetworkTelemetry {
  packetsPerSecond: number;
  activeFlows: number;
  bandwidth: number;
  suspiciousFlows: number;
  threatsCount?: number;
  criticalCount?: number;
  detectionRate?: number;
  avgLatencyMs?: number;
  activeTransport?: string;
  timestamp: string;
}

export interface TrafficDataPoint {
  time: string;
  timestamp: number;
  packetsPerSec: number;
  flowsPerSec: number;
  bytesPerSec: number;
  suspiciousPackets: number;
  alertsCount: number;
}

export interface ActiveConnectionFlow {
  id: string;
  sourceIp: string;
  sourcePort: number;
  destinationIp: string;
  destinationPort: number;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'DNS' | 'HTTP' | 'HTTPS';
  durationSec: number;
  packets: number;
  bytes: number;
  state: 'ESTABLISHED' | 'SYN_SENT' | 'FIN_WAIT' | 'CLOSED' | 'FLOODING' | 'SCANNING' | 'DDOS_BURST';
  aiClassification: string;
  riskScore: number;
  isSuspicious: boolean;
}

export interface ProtocolMetric {
  name: string;
  percentage: number;
  packetsPerSec: number;
  color: string;
}

export interface HostTrafficMetric {
  ip: string;
  hostname: string;
  role: 'ATTACKER' | 'VICTIM' | 'SENSOR' | 'GATEWAY' | 'WORKSTATION' | 'BOT_NODE';
  packetsSent: number;
  packetsReceived: number;
  bytesTotal: string;
  flowCount: number;
  threatsOriginated: number;
  threatsTargeted: number;
  status: 'ONLINE' | 'ACTIVE_ATTACK' | 'UNDER_ATTACK' | 'NORMAL' | 'DDOS_CLUSTER';
}

export interface LabStatus {
  connected: boolean;
  mode: OperationMode;
  sensorMode: SensorStatusMode;
  aiEngineMode: AiEngineStatusMode;
  activeTransport: ActiveTransportType;
  transportPreference: NetworkTransportMode;
  attackerIp: string;
  targetIp: string;
  sensorIp: string;
  subnet: string;
  activeScenario: string | null;
  status: 'idle' | 'running' | 'stopping' | 'completed';
  packetsSent: number;
  elapsedSec: number;
}

export type WebSocketMessageType = 
  | 'TELEMETRY'
  | 'THREAT_DETECTED'
  | 'ATTACK_STARTED'
  | 'ATTACK_STOPPED'
  | 'FEATURE_EXTRACTION'
  | 'AI_INFERENCE'
  | 'THREAT_RESOLVED'
  | 'SYSTEM_STATUS'
  | 'NETWORK_STATUS'
  | 'SENSOR_STATUS'
  | 'AI_STATUS';

export interface WebSocketMessage {
  event_id?: string;
  event_type?: WebSocketMessageType;
  type: WebSocketMessageType;
  timestamp?: string;
  iso_time?: string;
  source?: string;
  mode?: string;
  data: any;
}

export interface ITelemetryProvider {
  subscribe(callback: (data: LiveTelemetrySnapshot) => void): () => void;
  getSnapshot(): LiveTelemetrySnapshot;
  testConnection(): Promise<NetworkDiagnosticResult>;
}

export interface INetworkSensorProvider {
  getSensorMode(): SensorStatusMode;
  isMirroredTrafficActive(): boolean;
}

export interface IAiInferenceProvider {
  getAiEngineMode(): AiEngineStatusMode;
  isAiEngineOnline(): boolean;
}
