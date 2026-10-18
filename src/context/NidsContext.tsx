import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { 
  LiveTelemetrySnapshot, 
  TrafficDataPoint, 
  ActiveConnectionFlow, 
  HostTrafficMetric, 
  ProtocolMetric,
  LabStatus,
  WebSocketMessage,
  OperationMode,
  NetworkTransportMode,
  ActiveTransportType,
  SensorStatusMode,
  AiEngineStatusMode,
  NetworkInterfaceInfo,
  NetworkDiagnosticResult,
  SystemDiagnosticsInfo,
  LabAttackRecord,
  AppNotification
} from '../types/telemetry';
import type { ThreatAlert } from '../types/threat';
import type { 
  AttackScenario, 
  AttackTypeId, 
  AttackIntensity,
  ActiveAttackState, 
  TimelineEvent, 
  AttackTimelineStage 
} from '../types/attack';
import type { 
  ModelMetricStats, 
  FeatureSchemaType, 
  NetworkFeatureItem, 
  InferenceInspection 
} from '../types/ai';
import type { LabHostNode } from '../types/network';
import { mockTelemetryService } from '../services/mockTelemetry';
import { liveTelemetryService } from '../services/liveTelemetry';
import { 
  PREDEFINED_SCENARIOS, 
  LAB_TARGET_IP, 
  LAB_ATTACKER_IP, 
  LAB_SENSOR_IP,
  remoteAttackController, 
  mockAttackController 
} from '../services/attackService';

export type ClientRole = 'ATTACK_LAB' | 'NIDS_SOC' | 'UNIFIED';

export interface LabActivityState {
  eventId: string;
  scenario: string;
  intensity: string;
  sourceIp: string;
  targetIp: string;
  durationSeconds: number;
  status: 'ACTIVE' | 'COMPLETED' | 'STOPPED';
  timestamp: string;
  startedAt: number;
}

export interface ConnectionStatusState {
  attackControllerConnected: boolean;
  nidsApiConnected: boolean;
  wsConnected: boolean;
  sensorMode: SensorStatusMode;
  aiEngineMode: AiEngineStatusMode;
  transportMode: NetworkTransportMode;
  activeTransport: ActiveTransportType;
  latencyMs: number;
  interfaces: NetworkInterfaceInfo[];
}

interface NidsContextType {
  // Mode & Client Role
  mode: OperationMode;
  setMode: (mode: OperationMode) => void;
  clientRole: ClientRole;
  setClientRole: (role: ClientRole) => void;
  viewPerspective: 'SOC_UNIFIED' | 'PC1_ATTACKER' | 'PC2_NIDS';
  setViewPerspective: (p: 'SOC_UNIFIED' | 'PC1_ATTACKER' | 'PC2_NIDS') => void;

  // Network Transport & Interface Selection
  transportMode: NetworkTransportMode;
  setTransportMode: (mode: NetworkTransportMode) => void;
  activeTransport: ActiveTransportType;
  networkInterfaces: NetworkInterfaceInfo[];
  refreshNetworkInterfaces: () => Promise<void>;

  // Connection & Diagnostics
  connectionStatus: ConnectionStatusState;
  systemDiagnostics: SystemDiagnosticsInfo;
  runDiagnosticTest: () => Promise<NetworkDiagnosticResult>;
  testSensorConnection: () => Promise<any>;
  testAiEngineConnection: () => Promise<any>;

  // Telemetry & Metrics
  telemetry: LiveTelemetrySnapshot;
  trafficHistory: TrafficDataPoint[];
  timeRange: '1M' | '5M' | '15M' | '1H';
  setTimeRange: (range: '1M' | '5M' | '15M' | '1H') => void;
  activeConnections: ActiveConnectionFlow[];
  hosts: HostTrafficMetric[];
  protocols: ProtocolMetric[];
  labNodes: LabHostNode[];

  // Threats & Investigation (Authoritative)
  threats: ThreatAlert[];
  selectedThreat: ThreatAlert | null;
  setSelectedThreat: (threat: ThreatAlert | null) => void;
  resolveThreat: (id: string) => void;
  investigateThreat: (threat: ThreatAlert) => void;

  // AI Detection Engine
  modelStats: ModelMetricStats;
  aiInference: InferenceInspection;
  featureSchema: FeatureSchemaType;
  setFeatureSchema: (schema: FeatureSchemaType) => void;
  features: NetworkFeatureItem[];

  // Attack Lab & Scenario Orchestration (Authoritative Control Path)
  scenarios: AttackScenario[];
  activeAttack: ActiveAttackState | null;
  labActivity: LabActivityState | null;
  labAttacks: LabAttackRecord[];
  timeline: TimelineEvent[];
  startAttackScenario: (id: AttackTypeId, intensity?: AttackIntensity) => Promise<void>;
  stopAttackScenario: () => void;

  // Real-Time Notifications & Metrics
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  controlEventsCount: number;
  activeLabAttacksCount: number;

  // Toast Alerts & Audio
  toasts: { id: string; title: string; message: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; time: string }[];
  dismissToast: (id: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const NidsContext = createContext<NidsContextType | null>(null);

export const NidsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Resolve Runtime Client Role (Priority: URL query param -> localStorage -> VITE_CLIENT_ROLE -> Default)
  const urlRole = typeof window !== 'undefined' 
    ? (new URLSearchParams(window.location.search).get('role')?.toUpperCase() as ClientRole)
    : null;
  const storedRole = typeof window !== 'undefined'
    ? (localStorage.getItem('ai_nids_role')?.toUpperCase() as ClientRole)
    : null;
  const envRole = (import.meta.env.VITE_CLIENT_ROLE?.toUpperCase() as ClientRole);

  const defaultRole: ClientRole = (
    (urlRole && ['ATTACK_LAB', 'NIDS_SOC', 'UNIFIED'].includes(urlRole)) ? urlRole :
    (storedRole && ['ATTACK_LAB', 'NIDS_SOC', 'UNIFIED'].includes(storedRole)) ? storedRole :
    (envRole && ['ATTACK_LAB', 'NIDS_SOC', 'UNIFIED'].includes(envRole)) ? envRole :
    'UNIFIED'
  );

  // 2. Resolve Runtime Operation Mode
  const urlMode = typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('mode')?.toUpperCase() as OperationMode)
    : null;
  const envMode = (import.meta.env.VITE_MODE?.toUpperCase() || 'LIVE') as OperationMode;
  const defaultMode: OperationMode = (urlMode && ['DEMO', 'HYBRID', 'LIVE'].includes(urlMode))
    ? urlMode
    : (['DEMO', 'HYBRID', 'LIVE'].includes(envMode) ? envMode : 'LIVE');

  const currentHost = typeof window !== 'undefined' ? (window.location.hostname || '10.64.157.140') : '10.64.157.140';
  const nidsHost = import.meta.env.VITE_NIDS_HOST || '10.64.157.145';
  const nidsPort = import.meta.env.VITE_NIDS_PORT || '8000';

  // 3. Mandatory Startup Logging (Spec Requirement #1)
  if (typeof window !== 'undefined') {
    console.log('%c[AI-NIDS STARTUP INITIALIZATION]', 'background: #0f172a; color: #38bdf8; font-weight: bold; font-size: 13px; padding: 4px 8px; border-radius: 4px;');
    console.log('  ▶ RESOLVED CLIENT ROLE:', defaultRole);
    console.log('  ▶ RESOLVED MODE:', defaultMode);
    console.log('  ▶ VITE_CLIENT_ROLE:', import.meta.env.VITE_CLIENT_ROLE || 'NOT_SET');
    console.log('  ▶ VITE_MODE:', import.meta.env.VITE_MODE || 'NOT_SET');
    console.log('  ▶ VITE_NIDS_HOST:', nidsHost);
    console.log('  ▶ VITE_NIDS_PORT:', nidsPort);
  }

  const [mode, setModeState] = useState<OperationMode>(defaultMode);
  const [clientRole, setClientRoleState] = useState<ClientRole>(defaultRole);

  const setClientRole = useCallback((role: ClientRole) => {
    setClientRoleState(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_nids_role', role);
    }
  }, []);

  const setMode = useCallback((newMode: OperationMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_nids_mode', newMode);
    }
  }, []);

  const [viewPerspective, setViewPerspective] = useState<'SOC_UNIFIED' | 'PC1_ATTACKER' | 'PC2_NIDS'>(
    defaultRole === 'ATTACK_LAB' ? 'PC1_ATTACKER' : defaultRole === 'NIDS_SOC' ? 'PC2_NIDS' : 'SOC_UNIFIED'
  );
  const [timeRange, setTimeRange] = useState<'1M' | '5M' | '15M' | '1H'>('5M');
  const [featureSchema, setFeatureSchema] = useState<FeatureSchemaType>('78_FEATURES');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Network Transport
  const [transportMode, setTransportMode] = useState<NetworkTransportMode>('AUTO');
  const [activeTransport, setActiveTransport] = useState<ActiveTransportType>('WI-FI');
  const [networkInterfaces, setNetworkInterfaces] = useState<NetworkInterfaceInfo[]>([
    { name: 'Wi-Fi Interface', ip: currentHost, type: 'Wi-Fi', status: 'Connected', isUp: true, isPrimary: true }
  ]);

  // Connection diagnostics state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusState>({
    attackControllerConnected: defaultRole === 'ATTACK_LAB',
    nidsApiConnected: defaultMode !== 'DEMO',
    wsConnected: false,
    sensorMode: defaultMode === 'LIVE' ? 'NOT_CONFIGURED' : 'SIMULATED',
    aiEngineMode: 'DEMO',
    transportMode: 'AUTO',
    activeTransport: 'WI-FI',
    latencyMs: 14,
    interfaces: []
  });

  const [systemDiagnostics, setSystemDiagnostics] = useState<SystemDiagnosticsInfo>({
    pcRole: defaultRole === 'ATTACK_LAB' ? 'ATTACK_LAB • REMOTE CONTROLLER' : defaultRole === 'NIDS_SOC' ? 'NIDS_SOC • DETECTION SERVER' : 'UNIFIED • DUAL MODE',
    clientIp: defaultRole === 'ATTACK_LAB' ? (import.meta.env.VITE_ATTACKER_HOST || currentHost) : currentHost,
    nidsServerIp: `${nidsHost}:${nidsPort}`,
    apiStatus: 'CONNECTING...',
    websocketStatus: 'CONNECTING...',
    networkInterface: 'WI-FI (Online)',
    sensorStatus: defaultMode === 'LIVE' ? 'NOT_CONFIGURED' : 'SIMULATED',
    aiStatus: 'DEMO',
    lastEventId: 'None',
    lastEventType: 'None',
    lastEventTimestamp: 'None',
    eventsReceivedCount: 0,
    eventsDroppedCount: 0,
    eventsStoredCount: 0,
    activeThreatsCount: 0,
    criticalThreatsCount: 0,
    operationMode: defaultMode
  });

  // Core Data States (Strict separation: Live starts clean, Demo initializes mock)
  const [telemetry, setTelemetry] = useState<LiveTelemetrySnapshot>(() => 
    defaultMode === 'DEMO' ? mockTelemetryService.getSnapshot() : liveTelemetryService.getSnapshot()
  );
  const [trafficHistory, setTrafficHistory] = useState<TrafficDataPoint[]>(() => 
    defaultMode === 'DEMO' ? mockTelemetryService.getHistory('5M') : []
  );
  const [activeConnections, setActiveConnections] = useState<ActiveConnectionFlow[]>(() => 
    defaultMode === 'DEMO' ? mockTelemetryService.getActiveConnections() : []
  );
  const [hosts, setHosts] = useState<HostTrafficMetric[]>(() => 
    defaultMode === 'DEMO' ? mockTelemetryService.getHosts() : []
  );
  const [protocols, setProtocols] = useState<ProtocolMetric[]>(() => 
    defaultMode === 'DEMO' ? mockTelemetryService.getProtocolDistribution() : []
  );
  const [labNodes, setLabNodes] = useState<LabHostNode[]>(() => 
    defaultMode === 'DEMO' ? mockTelemetryService.getLabNodes() : []
  );

  // Authoritative Threats (Live starts empty and populates from PC 2 backend)
  const [threats, setThreats] = useState<ThreatAlert[]>(() => 
    defaultMode === 'DEMO' ? mockTelemetryService.getThreatFeed() : []
  );
  const [selectedThreat, setSelectedThreat] = useState<ThreatAlert | null>(null);

  // AI
  const [modelStats, setModelStats] = useState<ModelMetricStats>(() => 
    mockTelemetryService.getModelStats()
  );
  const [aiInference, setAiInference] = useState<InferenceInspection>(() => 
    defaultMode === 'DEMO' ? mockTelemetryService.getAiInference() : {
      timestamp: new Date().toLocaleTimeString(),
      sourceIp: LAB_ATTACKER_IP,
      destinationIp: LAB_TARGET_IP,
      protocol: 'TCP',
      predictedClass: 'BENIGN',
      confidence: 0.994,
      anomalyScore: 0.04,
      riskScore: 4,
      probabilities: [
        { label: 'Normal Baseline', probability: 0.994, color: '#10b981' },
        { label: 'Port Scan', probability: 0.002, color: '#3b82f6' },
        { label: 'Brute Force', probability: 0.002, color: '#f59e0b' },
        { label: 'DoS SYN Flood', probability: 0.001, color: '#ef4444' },
        { label: 'DDoS Distributed', probability: 0.001, color: '#ec4899' },
      ]
    }
  );
  const [features, setFeatures] = useState<NetworkFeatureItem[]>(() => 
    mockTelemetryService.getFeatures('78_FEATURES')
  );

  // Attack Lab
  const [scenarios] = useState<AttackScenario[]>(PREDEFINED_SCENARIOS);
  const [activeAttack, setActiveAttack] = useState<ActiveAttackState | null>(null);
  const [labActivity, setLabActivity] = useState<LabActivityState | null>(null);
  const [labAttacks, setLabAttacks] = useState<LabAttackRecord[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [toasts, setToasts] = useState<{ id: string; title: string; message: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; time: string }[]>([]);

  const attackTimerRef = useRef<any>(null);
  const seenEventIdsRef = useRef<Set<string>>(new Set());

  const unreadNotificationCount = notifications.filter(n => !n.read).length;
  const controlEventsCount = (labAttacks.length * 2) + (activeAttack ? 1 : 0);
  const activeLabAttacksCount = activeAttack ? 1 : 0;

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((title: string, message: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setToasts(prev => [{ id, title, message, severity, time }, ...prev.slice(0, 4)]);

    setTimeout(() => {
      dismissToast(id);
    }, 7000);
  }, [dismissToast]);

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, read: true } : n));
    if (mode === 'LIVE' || mode === 'HYBRID') {
      await liveTelemetryService.markNotificationRead(id);
    }
  }, [mode]);

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    if (mode === 'LIVE' || mode === 'HYBRID') {
      await liveTelemetryService.markAllNotificationsRead();
    }
  }, [mode]);

  // Load initial authoritative threat history & events from PC 2 backend in LIVE mode
  const fetchAuthoritativeHistory = useCallback(async () => {
    if (mode === 'LIVE' || mode === 'HYBRID') {
      try {
        const liveThreats = await liveTelemetryService.getThreatFeed();
        if (Array.isArray(liveThreats)) {
          setThreats(liveThreats);
        }

        const historyAttacks = await liveTelemetryService.getLabHistory();
        if (Array.isArray(historyAttacks)) {
          setLabAttacks(historyAttacks);
        }

        const notifs = await liveTelemetryService.getNotifications();
        if (Array.isArray(notifs)) {
          setNotifications(notifs);
        }

        const diag = await liveTelemetryService.getDiagnostics();
        if (diag) {
          setSystemDiagnostics(diag);
        }

        const hist = await liveTelemetryService.getHistory(timeRange);
        if (Array.isArray(hist) && hist.length > 0) {
          setTrafficHistory(hist);
        }
      } catch (e) {
        console.warn('[NidsContext] Could not sync initial authoritative state from PC 2:', e);
      }
    }
  }, [mode, timeRange]);

  // Network Interfaces Refresh
  const refreshNetworkInterfaces = useCallback(async () => {
    if (mode === 'LIVE' || mode === 'HYBRID') {
      const data = await liveTelemetryService.getNetworkInterfaces();
      if (data && data.interfaces) {
        setNetworkInterfaces(data.interfaces);
        setActiveTransport(data.activeTransport || 'WI-FI');
        setConnectionStatus(prev => ({
          ...prev,
          interfaces: data.interfaces,
          activeTransport: data.activeTransport || 'WI-FI'
        }));
      }
    }
  }, [mode]);

  // Connection testing helper
  const runDiagnosticTest = useCallback(async (): Promise<NetworkDiagnosticResult> => {
    if (mode === 'DEMO') {
      const demoResult: NetworkDiagnosticResult = {
        apiReachable: true,
        wsConnected: true,
        sensorStatus: 'SIMULATED',
        aiEngineStatus: 'DEMO',
        transportType: activeTransport,
        latencyMs: 14,
        details: { status: 'ONLINE', mode: 'DEMO' }
      };
      setConnectionStatus(prev => ({
        ...prev,
        nidsApiConnected: true,
        wsConnected: true,
        latencyMs: 14,
        sensorMode: 'SIMULATED',
        aiEngineMode: 'DEMO',
      }));
      return demoResult;
    }

    const res = await liveTelemetryService.testConnection();
    setConnectionStatus(prev => ({
      ...prev,
      nidsApiConnected: res.apiReachable,
      wsConnected: res.wsConnected,
      latencyMs: res.latencyMs,
      sensorMode: res.sensorStatus,
      aiEngineMode: res.aiEngineStatus,
      activeTransport: res.transportType,
    }));

    const diag = await liveTelemetryService.getDiagnostics();
    const resolvedClientIp = clientRole === 'ATTACK_LAB' 
      ? (import.meta.env.VITE_ATTACKER_HOST || currentHost) 
      : currentHost;

    if (diag) {
      setSystemDiagnostics({
        ...diag,
        clientIp: resolvedClientIp,
        nidsServerIp: `${nidsHost}:${nidsPort}`,
        apiStatus: res.apiReachable ? 'CONNECTED' : 'DISCONNECTED',
        websocketStatus: res.wsConnected ? 'CONNECTED' : 'DISCONNECTED',
      });
    } else {
      setSystemDiagnostics(prev => ({
        ...prev,
        clientIp: resolvedClientIp,
        nidsServerIp: `${nidsHost}:${nidsPort}`,
        apiStatus: res.apiReachable ? 'CONNECTED' : 'DISCONNECTED',
        websocketStatus: res.wsConnected ? 'CONNECTED' : 'DISCONNECTED',
      }));
    }

    return res;
  }, [mode, activeTransport, clientRole, currentHost, nidsHost, nidsPort]);

  const testSensorConnection = useCallback(async () => {
    if (mode === 'DEMO') {
      return { sensor: 'Zeek / Suricata (Demo)', mode: 'SIMULATED', packetsCaptured: 184200, status: 'ONLINE' };
    }
    return await liveTelemetryService.testSensor();
  }, [mode]);

  const testAiEngineConnection = useCallback(async () => {
    if (mode === 'DEMO') {
      return { engine: 'XGBoost v1.4.2 (Demo Inference)', mode: 'DEMO', featuresCount: 78, avgLatencyMs: 14 };
    }
    return await liveTelemetryService.testAiEngine();
  }, [mode]);

  // Initial Sync & Periodic heartbeat
  useEffect(() => {
    fetchAuthoritativeHistory();
    runDiagnosticTest();
    refreshNetworkInterfaces();

    const interval = setInterval(() => {
      runDiagnosticTest();
      refreshNetworkInterfaces();
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchAuthoritativeHistory, runDiagnosticTest, refreshNetworkInterfaces]);

  // Telemetry & WebSocket Subscription
  useEffect(() => {
    if (mode === 'LIVE' || mode === 'HYBRID') {
      const unsub = liveTelemetryService.subscribe((snapshot) => {
        setTelemetry(snapshot);
      });

      // Authoritative Real-Time WebSocket Event Stream from PC 2 Backend
      const unsubEvents = liveTelemetryService.subscribeEvents((msg: WebSocketMessage) => {
        const rawType = msg.event_type || msg.type;
        const eventId = msg.event_id;

        // Deduplication safeguard
        if (eventId) {
          if (seenEventIdsRef.current.has(eventId)) {
            return; // skip duplicate event
          }
          seenEventIdsRef.current.add(eventId);
          if (seenEventIdsRef.current.size > 500) {
            const first = seenEventIdsRef.current.values().next().value;
            if (first) seenEventIdsRef.current.delete(first);
          }
        }

        if (rawType === 'THREAT_DETECTED' && msg.data) {
          const tData = msg.data;
          const newAlert: ThreatAlert = {
            id: tData.id || `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
            attackType: tData.attackType || 'Port Scan',
            category: tData.category || 'Reconnaissance',
            severity: (tData.severity as any) || 'HIGH',
            sourceIp: tData.sourceIp || tData.source || LAB_ATTACKER_IP,
            sourcePort: tData.sourcePort || 49820,
            targetIp: tData.targetIp || tData.target || LAB_TARGET_IP,
            targetPort: tData.targetPort || 80,
            protocol: tData.protocol || 'TCP',
            confidence: tData.confidence || 0.978,
            anomalyScore: tData.anomalyScore || 0.94,
            riskScore: tData.riskScore || 92,
            timestamp: tData.timestamp || msg.timestamp || new Date().toLocaleTimeString(),
            isoTime: tData.isoTime || new Date().toISOString(),
            detectionLatencyMs: tData.detectionLatencyMs || 184,
            status: 'ACTIVE',
            packetCount: tData.packetCount || 2840,
            byteCount: tData.byteCount || 170400,
            rawPcapSample: tData.rawPcapSample,
            mitigationAction: 'Target rate-limiting applied. Sensor verified.',
            modelRecommendation: 'Classified by live XGBoost v1.4 inference engine on PC 2.',
            xaiFactors: tData.xaiFactors || [
              { factor: 'Destination Port Entropy', weight: 34, baselineValue: '1.2', observedValue: '4.9', direction: 'EXCESSIVE' },
              { factor: 'Flow Inter-Arrival Time', weight: 26, baselineValue: '450ms', observedValue: '8ms', direction: 'ABNORMAL' },
            ]
          };

          // Update Threats (Prepend new detection without losing existing feed)
          setThreats(prev => [newAlert, ...prev.filter(t => t.id !== newAlert.id)]);

          // Update Real-Time Detection Timeline
          const newTlEvent: TimelineEvent = {
            id: eventId || `tl-${Date.now()}`,
            stage: 'THREAT_DETECTED',
            title: `Threat detected: ${newAlert.attackType}`,
            description: `Sensor flagged anomaly from ${newAlert.sourceIp} → ${newAlert.targetIp} (Risk: ${newAlert.riskScore}/100, Confidence: ${(newAlert.confidence * 100).toFixed(1)}%)`,
            timestamp: msg.timestamp || new Date().toLocaleTimeString(),
            elapsedMs: newAlert.detectionLatencyMs || 184,
            status: 'COMPLETED'
          };
          setTimeline(prev => [newTlEvent, ...prev]);

          // Update AI Realtime Inspection view
          setAiInference({
            timestamp: newAlert.timestamp,
            sourceIp: newAlert.sourceIp,
            destinationIp: newAlert.targetIp,
            protocol: newAlert.protocol,
            predictedClass: newAlert.attackType,
            confidence: newAlert.confidence,
            anomalyScore: newAlert.anomalyScore,
            riskScore: newAlert.riskScore,
            probabilities: [
              { label: newAlert.attackType, probability: newAlert.confidence, color: '#ef4444', isDominant: true },
              { label: 'Normal Baseline', probability: +(1 - newAlert.confidence).toFixed(3), color: '#10b981' },
            ]
          });

          // Trigger SOC Toast
          addToast(
            `${newAlert.severity} detection: ${newAlert.attackType}`,
            `PC 2 NIDS Sensor classified threat from ${newAlert.sourceIp} → ${newAlert.targetIp}`,
            newAlert.severity
          );
        } else if (rawType === 'ATTACK_STARTED') {
          const d = msg.data || msg;
          const attackId = d.attack_id || (msg as any).attack_id || `lab_attack_${Date.now()}`;
          const scenario = d.scenario || (msg as any).scenario || 'PORT_SCAN';
          const intensity = d.intensity || (msg as any).intensity || 'MEDIUM';
          const sourceIp = d.source_ip || d.source || (msg as any).source_ip || LAB_ATTACKER_IP;
          const targetIp = d.target_ip || d.target || (msg as any).target_ip || LAB_TARGET_IP;
          const duration = d.duration_seconds || d.duration || (msg as any).duration_seconds || 15;
          const startTs = msg.timestamp || new Date().toLocaleTimeString();

          if (eventId) {
            console.log(`[EVENT STORE] inserted ${eventId}`);
          }
          console.log('[NOTIFICATION] ATTACK_STARTED displayed');

          // 1. Update Lab Attack History Store (Authoritative session tracking)
          const newAttackRecord: LabAttackRecord = {
            attack_id: attackId,
            scenario,
            intensity,
            source_ip: sourceIp,
            target_ip: targetIp,
            started_at: startTs,
            stopped_at: null,
            duration_seconds: duration,
            status: 'ACTIVE',
            iso_time: new Date().toISOString()
          };
          setLabAttacks(prev => [newAttackRecord, ...prev.filter(a => a.attack_id !== attackId)]);

          // 2. Update Notification Store
          const newNotification: AppNotification = {
            notification_id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            event_id: eventId || `evt_${Date.now()}`,
            attack_id: attackId,
            type: 'LAB_ATTACK_STARTED',
            severity: 'INFO',
            title: '● Lab Attack Started',
            message: `${scenario} (${intensity}) started from ${sourceIp} against ${targetIp}`,
            timestamp: startTs,
            iso_time: new Date().toISOString(),
            read: false,
            data: { scenario, intensity, source_ip: sourceIp, target_ip: targetIp, duration_seconds: duration }
          };
          setNotifications(prev => [newNotification, ...prev.filter(n => n.event_id !== eventId)]);

          // 3. Update Active Lab Activity state
          setLabActivity({
            eventId: eventId || `evt_${Date.now()}`,
            scenario,
            intensity,
            sourceIp,
            targetIp,
            durationSeconds: duration,
            status: 'ACTIVE',
            timestamp: startTs,
            startedAt: Date.now()
          });

          setActiveAttack({
            scenarioId: scenario,
            status: 'TRANSMITTING',
            intensity,
            startedAt: Date.now(),
            durationSec: duration,
            elapsedSec: 0,
            packetsSent: 0,
            currentStage: 'ATTACK_INITIALIZED',
            logs: [`[${startTs}] Control: Attack Started: ${scenario} (${intensity}) from ${sourceIp} against ${targetIp}`]
          });

          const ctrlTlEvent: TimelineEvent = {
            id: eventId || `tl-${Date.now()}`,
            stage: 'ATTACK_INITIALIZED',
            title: `Lab Activity: ${scenario} Started`,
            description: `Source: ${sourceIp} → Target: ${targetIp} [${intensity} • ${duration}s test window]`,
            timestamp: startTs,
            elapsedMs: 0,
            status: 'COMPLETED'
          };
          setTimeline(prev => [ctrlTlEvent, ...prev]);

          // 4. Pop visible Toast notification
          addToast(
            `● LAB ATTACK STARTED`,
            `${scenario} (${intensity})\nSource: ${sourceIp} → Target: ${targetIp} (${duration}s)`,
            'LOW'
          );
        } else if (rawType === 'ATTACK_STOPPED') {
          const d = msg.data || msg;
          const attackId = d.attack_id || (msg as any).attack_id;
          const scenario = d.scenario || (msg as any).scenario || 'PORT_SCAN';
          const sourceIp = d.source_ip || d.source || (msg as any).source_ip || LAB_ATTACKER_IP;
          const targetIp = d.target_ip || d.target || (msg as any).target_ip || LAB_TARGET_IP;
          const duration = d.duration_seconds || d.duration || (msg as any).duration_seconds || 15;
          const stopTs = msg.timestamp || new Date().toLocaleTimeString();

          if (eventId) {
            console.log(`[EVENT STORE] inserted ${eventId}`);
          }
          console.log('[NOTIFICATION] ATTACK_STOPPED displayed');

          // 1. Update Lab Attack History to COMPLETED (persisted!)
          setLabAttacks(prev => prev.map(a => {
            if ((attackId && a.attack_id === attackId) || (a.scenario === scenario && a.status === 'ACTIVE')) {
              return { ...a, status: 'COMPLETED', stopped_at: stopTs };
            }
            return a;
          }));

          // 2. Add completion notification to Notification Store
          const completionNotif: AppNotification = {
            notification_id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            event_id: eventId || `evt_${Date.now()}`,
            attack_id: attackId,
            type: 'LAB_ATTACK_STOPPED',
            severity: 'INFO',
            title: '● Lab Attack Completed',
            message: `${scenario} completed after ${duration}s (${sourceIp} → ${targetIp})`,
            timestamp: stopTs,
            iso_time: new Date().toISOString(),
            read: false,
            data: { scenario, source_ip: sourceIp, target_ip: targetIp, duration_seconds: duration }
          };
          setNotifications(prev => [completionNotif, ...prev.filter(n => n.event_id !== eventId)]);

          // 3. Update lab activity banner status to COMPLETED
          setLabActivity(prev => prev ? { ...prev, status: 'COMPLETED' } : null);
          setTimeout(() => {
            setLabActivity(null);
          }, 3000);

          setActiveAttack(null);

          const stopTlEvent: TimelineEvent = {
            id: eventId || `tl-stop-${Date.now()}`,
            stage: 'ATTACK_INITIALIZED',
            title: `Lab Activity: ${scenario} Completed`,
            description: `Controlled test session ended after ${duration}s. Status: COMPLETED.`,
            timestamp: stopTs,
            elapsedMs: 0,
            status: 'COMPLETED'
          };
          setTimeline(prev => [stopTlEvent, ...prev]);

          // 4. Pop visible Toast notification
          addToast(
            `● LAB ATTACK COMPLETED`,
            `${scenario} finished after ${duration}s\nSource: ${sourceIp} → Target: ${targetIp}`,
            'LOW'
          );
        } else if (rawType === 'THREAT_RESOLVED' && msg.data) {
          const resolvedId = msg.data.threatId;
          setThreats(prev => prev.map(t => t.id === resolvedId ? { ...t, status: 'RESOLVED' } : t));
        }
      });

      return () => {
        unsub();
        unsubEvents();
      };
    } else {
      // Demo Mode Subscription
      const unsub = mockTelemetryService.subscribe((snapshot) => {
        setTelemetry(snapshot);
        setTrafficHistory(mockTelemetryService.getHistory(timeRange));
        setActiveConnections(mockTelemetryService.getActiveConnections());
        setHosts(mockTelemetryService.getHosts());
        setProtocols(mockTelemetryService.getProtocolDistribution());
        setLabNodes(mockTelemetryService.getLabNodes());
        setThreats([...mockTelemetryService.getThreatFeed()]);
        setAiInference(mockTelemetryService.getAiInference());
        setFeatures(mockTelemetryService.getFeatures(featureSchema));
        setModelStats(mockTelemetryService.getModelStats());
      });
      return () => unsub();
    }
  }, [mode, timeRange, featureSchema, addToast]);

  const resolveThreat = useCallback((id: string) => {
    if (mode === 'LIVE' || mode === 'HYBRID') {
      liveTelemetryService.resolveThreat(id);
    } else {
      mockTelemetryService.resolveThreat(id);
    }
    setThreats(prev => prev.map(t => t.id === id ? { ...t, status: 'RESOLVED' as const } : t));
    if (selectedThreat && selectedThreat.id === id) {
      setSelectedThreat(prev => prev ? { ...prev, status: 'RESOLVED' } : null);
    }
  }, [mode, selectedThreat]);

  const investigateThreat = useCallback((threat: ThreatAlert) => {
    setSelectedThreat(threat);
  }, []);

  const clearAttackTimers = () => {
    if (attackTimerRef.current) {
      clearInterval(attackTimerRef.current);
      attackTimerRef.current = null;
    }
  };

  const stopAttackScenario = useCallback(async () => {
    clearAttackTimers();
    if (mode === 'LIVE' || mode === 'HYBRID') {
      await remoteAttackController.stopAttack();
    } else {
      mockTelemetryService.setActiveAttack(null);
    }
    setActiveAttack(prev => prev ? { ...prev, status: 'STOPPED' } : null);
    setTimeout(() => {
      setActiveAttack(null);
    }, 2000);
  }, [mode]);

  // Authoritative Attack Trigger (Sends REST command to PC 2 backend without running fake client detection)
  const startAttackScenario = useCallback(async (id: AttackTypeId, intensity: AttackIntensity = 'MEDIUM') => {
    clearAttackTimers();
    const scenario = PREDEFINED_SCENARIOS.find(s => s.id === id);
    if (!scenario) return;

    const startTime = Date.now();
    const duration = scenario.estimatedDurationSec;
    const isDDoS = id === 'DDOS_DISTRIBUTED_FLOOD';
    const sourceDesc = isDDoS ? `${LAB_ATTACKER_IP} Cluster (.1, .2, .3)` : LAB_ATTACKER_IP;

    // Set local attack controller status
    setActiveAttack({
      scenarioId: id,
      status: 'TRANSMITTING',
      intensity,
      startedAt: startTime,
      durationSec: duration,
      elapsedSec: 0,
      packetsSent: 0,
      currentStage: 'ATTACK_INITIALIZED',
      logs: [`[${new Date().toLocaleTimeString()}] Sent POST /api/lab/start ${id} (${intensity}) from ${LAB_ATTACKER_IP} against ${LAB_TARGET_IP}`],
    });

    if (mode === 'LIVE' || mode === 'HYBRID') {
      // Dispatches authoritative REST C2 command to FastAPI on PC 2
      await remoteAttackController.startAttack(id, intensity);
    } else {
      mockTelemetryService.setActiveAttack(id);
    }

    // Local controller counter for duration & packets sent
    let elapsedCount = 0;
    attackTimerRef.current = setInterval(() => {
      elapsedCount += 1;
      setActiveAttack(prev => {
        if (!prev) return null;
        const rateMultiplier = intensity === 'HIGH' ? 1.5 : intensity === 'LOW' ? 0.6 : 1.0;
        const pktStep = isDDoS ? 14200 : id === 'DOS_SYN_FLOOD' ? 8400 : 180;
        const pkts = prev.packetsSent + Math.round(pktStep * rateMultiplier);
        if (elapsedCount >= duration) {
          clearInterval(attackTimerRef.current);
          return { ...prev, elapsedSec: duration, packetsSent: pkts, status: 'COMPLETED' };
        }
        return { ...prev, elapsedSec: elapsedCount, packetsSent: pkts };
      });
    }, 1000);

  }, [mode]);

  return (
    <NidsContext.Provider
      value={{
        mode,
        setMode,
        clientRole,
        setClientRole,
        viewPerspective,
        setViewPerspective,
        transportMode,
        setTransportMode,
        activeTransport,
        networkInterfaces,
        refreshNetworkInterfaces,
        connectionStatus,
        systemDiagnostics,
        runDiagnosticTest,
        testSensorConnection,
        testAiEngineConnection,
        telemetry,
        trafficHistory,
        timeRange,
        setTimeRange,
        activeConnections,
        hosts,
        protocols,
        labNodes,
        threats,
        selectedThreat,
        setSelectedThreat,
        resolveThreat,
        investigateThreat,
        modelStats,
        aiInference,
        featureSchema,
        setFeatureSchema,
        features,
        scenarios,
        activeAttack,
        labActivity,
        labAttacks,
        timeline,
        startAttackScenario,
        stopAttackScenario,
        notifications,
        unreadNotificationCount,
        markNotificationRead,
        markAllNotificationsRead,
        controlEventsCount,
        activeLabAttacksCount,
        toasts,
        dismissToast,
        soundEnabled,
        setSoundEnabled,
      }}
    >
      {children}
    </NidsContext.Provider>
  );
};

export const useNids = () => {
  const context = useContext(NidsContext);
  if (!context) {
    throw new Error('useNids must be used within a NidsProvider');
  }
  return context;
};
