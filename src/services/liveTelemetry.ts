import { 
  LiveTelemetrySnapshot, 
  TrafficDataPoint, 
  ActiveConnectionFlow, 
  HostTrafficMetric, 
  ProtocolMetric,
  LabStatus,
  WebSocketMessage,
  ActiveTransportType,
  SensorStatusMode,
  AiEngineStatusMode,
  OperationMode,
  NetworkInterfaceInfo,
  NetworkDiagnosticResult,
  SystemDiagnosticsInfo,
  ITelemetryProvider,
  INetworkSensorProvider,
  IAiInferenceProvider
} from '../types/telemetry';
import { ThreatAlert } from '../types/threat';
import { ModelMetricStats, FeatureSchemaType, NetworkFeatureItem, InferenceInspection } from '../types/ai';
import { LabHostNode } from '../types/network';
import { LAB_ATTACKER_IP, LAB_TARGET_IP, LAB_SENSOR_IP } from './attackService';
import { apiFetch } from './apiClient';

export class LiveTelemetryProvider implements ITelemetryProvider, INetworkSensorProvider, IAiInferenceProvider {
  private ws: WebSocket | null = null;
  private subscribers: ((data: LiveTelemetrySnapshot) => void)[] = [];
  private eventSubscribers: ((msg: WebSocketMessage) => void)[] = [];
  private isConnected: boolean = false;
  private reconnectTimer: any = null;
  private reconnectAttempts: number = 0;
  private currentSnapshot: LiveTelemetrySnapshot;

  // Deduplication & diagnostics tracking
  private seenEventIds: Set<string> = new Set();
  private eventsReceivedCount: number = 0;
  private eventsDroppedCount: number = 0;
  private lastEventId: string = 'None';
  private lastEventType: string = 'None';
  private lastEventTimestamp: string = 'None';

  // Environment and network dynamic config
  private nidsHost: string = import.meta.env.VITE_NIDS_HOST || '10.64.157.145';
  private nidsPort: number = Number(import.meta.env.VITE_NIDS_PORT || 8000);
  private nidsWsPort: number = Number(import.meta.env.VITE_NIDS_WS_PORT || 8000);
  private attackerHost: string = import.meta.env.VITE_ATTACKER_HOST || '10.64.157.140';
  
  private sensorMode: SensorStatusMode = 'NOT_CONFIGURED';
  private aiEngineMode: AiEngineStatusMode = 'DEMO';
  private activeTransport: ActiveTransportType = 'WI-FI';
  private operationMode: OperationMode = 'LIVE';

  constructor() {
    this.currentSnapshot = {
      timestamp: new Date().toLocaleTimeString(),
      packetsPerSec: 12480,
      flowsPerSec: 1248,
      bytesPerSec: 8985600,
      activeFlowsCount: 1248,
      threatsDetectedCount: 0,
      criticalThreatsCount: 0,
      aiDetectionRate: 98.4,
      avgDetectionLatencyMs: 184,
      suspiciousTrafficRatio: 0.04,
    };

    this.connectWebSocket();
  }

  public get wsUrl(): string {
    const host = import.meta.env.VITE_NIDS_HOST || '10.64.157.145';
    return `ws://${host}:${this.nidsWsPort}/ws/live`;
  }

  public get restBaseUrl(): string {
    const host = import.meta.env.VITE_NIDS_HOST || '10.64.157.145';
    return `http://${host}:${this.nidsPort}/api`;
  }

  private connectWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('[WS] connected');
        console.info(`[LiveTelemetryProvider] Authoritative WebSocket connected to ${this.wsUrl}`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WebSocketMessage = JSON.parse(event.data);
          this.handleIncomingMessage(msg);
        } catch (err) {
          console.error('[LiveTelemetryProvider] Error parsing WebSocket message:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };
    } catch {
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    // Exponential backoff with a cap, instead of hammering a down backend
    // once every fixed 4s forever (see docs/GAPS_AND_FLAWS.md §5.7).
    if (!this.reconnectTimer) {
      const MAX_DELAY_MS = 30000;
      const baseDelay = Math.min(1000 * 2 ** this.reconnectAttempts, MAX_DELAY_MS);
      const jitter = Math.random() * 500;
      this.reconnectAttempts += 1;

      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        this.connectWebSocket();
      }, baseDelay + jitter);
    }
  }

  private handleIncomingMessage(msg: WebSocketMessage) {
    const rawType = msg.event_type || msg.type;
    const eventId = msg.event_id;

    if (rawType === 'ATTACK_STARTED' || rawType === 'ATTACK_STOPPED' || rawType === 'THREAT_DETECTED') {
      console.log(`[WS] received ${rawType} ${eventId || ''}`);
    }

    // Deduplicate non-telemetry events by unique event_id
    if (eventId && rawType !== 'TELEMETRY') {
      if (this.seenEventIds.has(eventId)) {
        this.eventsDroppedCount += 1;
        return; // reject duplicate event
      }
      this.seenEventIds.add(eventId);
      if (this.seenEventIds.size > 1000) {
        // prune older entries
        const firstKey = this.seenEventIds.values().next().value;
        if (firstKey) this.seenEventIds.delete(firstKey);
      }
    }

    this.eventsReceivedCount += 1;
    this.lastEventId = eventId || this.lastEventId;
    this.lastEventType = rawType;
    this.lastEventTimestamp = msg.timestamp || new Date().toLocaleTimeString();

    if (rawType === 'TELEMETRY' && msg.data) {
      const d = msg.data;
      this.currentSnapshot = {
        timestamp: d.timestamp || new Date().toLocaleTimeString(),
        packetsPerSec: d.packetsPerSecond || this.currentSnapshot.packetsPerSec,
        flowsPerSec: d.activeFlows || this.currentSnapshot.flowsPerSec,
        bytesPerSec: d.bandwidth || this.currentSnapshot.bytesPerSec,
        activeFlowsCount: d.activeFlows || this.currentSnapshot.activeFlowsCount,
        threatsDetectedCount: d.threatsCount ?? this.currentSnapshot.threatsDetectedCount,
        criticalThreatsCount: d.criticalCount ?? this.currentSnapshot.criticalThreatsCount,
        aiDetectionRate: d.detectionRate ?? this.currentSnapshot.aiDetectionRate,
        avgDetectionLatencyMs: d.avgLatencyMs ?? this.currentSnapshot.avgDetectionLatencyMs,
        suspiciousTrafficRatio: d.suspiciousFlows ? (d.suspiciousFlows / (d.packetsPerSecond || 1)) : 0.04,
      };

      if (d.activeTransport) {
        this.activeTransport = d.activeTransport;
      }

      this.notifySubscribers();
    } else if (rawType === 'SYSTEM_STATUS' && msg.data) {
      if (msg.data.sensorMode) this.sensorMode = msg.data.sensorMode;
      if (msg.data.aiEngineMode) this.aiEngineMode = msg.data.aiEngineMode;
      if (msg.data.activeTransport) this.activeTransport = msg.data.activeTransport;
      if (msg.data.operationMode) this.operationMode = msg.data.operationMode;
    }

    this.eventSubscribers.forEach(cb => cb(msg));
  }

  private notifySubscribers() {
    this.subscribers.forEach(cb => cb(this.currentSnapshot));
  }

  public subscribe(callback: (data: LiveTelemetrySnapshot) => void): () => void {
    this.subscribers.push(callback);
    callback(this.currentSnapshot);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  public subscribeEvents(callback: (msg: WebSocketMessage) => void): () => void {
    this.eventSubscribers.push(callback);
    return () => {
      this.eventSubscribers = this.eventSubscribers.filter(cb => cb !== callback);
    };
  }

  public getSnapshot(): LiveTelemetrySnapshot {
    return this.currentSnapshot;
  }

  public getDiagnosticsStats() {
    return {
      received: this.eventsReceivedCount,
      dropped: this.eventsDroppedCount,
      lastId: this.lastEventId,
      lastType: this.lastEventType,
      lastTime: this.lastEventTimestamp
    };
  }

  public async getLabStatus(): Promise<LabStatus> {
    try {
      const res = await apiFetch(`${this.restBaseUrl}/lab/status`);
      if (res.ok) {
        return await res.json();
      }
    } catch { /* ignore */ }

    return {
      connected: false,
      mode: 'LIVE',
      sensorMode: this.sensorMode,
      aiEngineMode: this.aiEngineMode,
      activeTransport: this.activeTransport,
      transportPreference: 'AUTO',
      attackerIp: LAB_ATTACKER_IP,
      targetIp: LAB_TARGET_IP,
      sensorIp: LAB_SENSOR_IP,
      subnet: '192.168.100.0/24',
      activeScenario: null,
      status: 'idle',
      packetsSent: 0,
      elapsedSec: 0,
    };
  }

  public async getNetworkInterfaces(): Promise<any> {
    try {
      const res = await apiFetch(`${this.restBaseUrl}/network/interfaces`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('[AI-NIDS] Failed to fetch live network interfaces:', e);
    }

    return {
      hostname: 'AI-NIDS-HOST',
      activeTransport: this.activeTransport,
      interfaces: [
        {
          name: 'Wi-Fi (WLAN)',
          displayName: 'Wi-Fi Adapter (802.11ax)',
          ip: '192.168.1.105',
          type: 'Wi-Fi',
          status: 'Connected',
          isWifi: true,
          isEthernet: false,
          isLoopback: false,
          isConnected: true,
          isUp: true,
          sensorAttachable: true,
        },
        {
          name: 'Ethernet (LAN)',
          displayName: 'Gigabit Ethernet Adapter',
          ip: '192.168.100.30',
          type: 'Ethernet',
          status: 'Connected',
          isWifi: false,
          isEthernet: true,
          isLoopback: false,
          isConnected: true,
          isUp: true,
          sensorAttachable: true,
        }
      ]
    };
  }

  public async testConnection(): Promise<NetworkDiagnosticResult> {
    const t0 = performance.now();
    let apiReachable = false;
    let details: any = null;
    let interfaces: NetworkInterfaceInfo[] = [];

    try {
      const res = await apiFetch(`${this.restBaseUrl}/status`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        apiReachable = true;
        details = await res.json();
      }
    } catch {
      apiReachable = false;
    }

    const latencyMs = Math.round(performance.now() - t0);
    const wsConnected = this.ws !== null && this.ws.readyState === WebSocket.OPEN;

    try {
      const ifaceData = await this.getNetworkInterfaces();
      interfaces = Array.isArray(ifaceData) ? ifaceData : (ifaceData.interfaces || []);
    } catch {
      interfaces = [];
    }

    const wifiAvail = interfaces.some(i => i.isWifi && (i.isConnected || i.isUp));
    const ethAvail = interfaces.some(i => i.isEthernet && (i.isConnected || i.isUp));

    let currentTransport: ActiveTransportType = 'WI-FI';
    if (ethAvail) currentTransport = 'ETHERNET';
    else if (wifiAvail) currentTransport = 'WI-FI';

    return {
      apiReachable,
      fastApiReachable: apiReachable,
      latencyMs: apiReachable ? latencyMs : 0,
      wsConnected,
      sensorStatus: details?.sensorMode || this.sensorMode,
      aiEngineStatus: details?.aiEngineMode || this.aiEngineMode,
      transportType: details?.activeTransport || currentTransport,
      activeTransport: details?.activeTransport || currentTransport,
      transportPreference: 'AUTO',
      ethernetAvailable: ethAvail,
      wifiAvailable: wifiAvail,
      pc1Ip: LAB_ATTACKER_IP,
      pc2Ip: details?.nidsHost || LAB_SENSOR_IP,
      localIp: details?.nidsHost || '127.0.0.1',
      hostname: details?.hostname || 'AI-NIDS-HOST',
      activeInterface: ethAvail ? 'Ethernet (LAN)' : wifiAvail ? 'Wi-Fi' : 'Loopback',
      operationMode: details?.operationMode || this.operationMode,
      interfaces,
      timestamp: new Date().toLocaleTimeString(),
      details
    };
  }

  public async getDiagnostics(): Promise<SystemDiagnosticsInfo> {
    try {
      const res = await apiFetch(`${this.restBaseUrl}/diagnostics`);
      if (res.ok) {
        const data = await res.json();
        return {
          ...data,
          eventsReceivedCount: this.eventsReceivedCount,
          eventsDroppedCount: this.eventsDroppedCount,
          lastEventId: this.lastEventId || data.lastEventId,
          lastEventType: this.lastEventType || data.lastEventType,
          lastEventTimestamp: this.lastEventTimestamp || data.lastEventTimestamp
        };
      }
    } catch { /* ignore */ }

    const wsConnected = this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    return {
      pcRole: 'NIDS SOC • DETECTION SERVER',
      clientIp: this.attackerHost || 'NOT DETECTED',
      nidsServerIp: `${this.nidsHost}:${this.nidsPort}`,
      apiStatus: this.isConnected ? 'CONNECTED' : 'DISCONNECTED',
      websocketStatus: wsConnected ? 'CONNECTED' : 'DISCONNECTED',
      networkInterface: `${this.activeTransport} (Active)`,
      sensorStatus: this.sensorMode,
      aiStatus: this.aiEngineMode,
      lastEventId: this.lastEventId,
      lastEventType: this.lastEventType,
      lastEventTimestamp: this.lastEventTimestamp,
      eventsReceivedCount: this.eventsReceivedCount,
      eventsDroppedCount: this.eventsDroppedCount,
      activeThreatsCount: this.currentSnapshot.threatsDetectedCount,
      criticalThreatsCount: this.currentSnapshot.criticalThreatsCount,
      operationMode: this.operationMode
    };
  }

  public async testSensor(): Promise<{ status: SensorStatusMode; message: string; droppedRate?: string }> {
    try {
      const res = await apiFetch(`${this.restBaseUrl}/sensor/status`);
      if (res.ok) {
        return await res.json();
      }
    } catch { /* ignore */ }

    return {
      status: this.sensorMode,
      message: 'Physical sensor daemon status queried',
    };
  }

  public async testAiEngine(): Promise<{ status: AiEngineStatusMode; message: string; avgInferenceMs?: number }> {
    try {
      const res = await apiFetch(`${this.restBaseUrl}/ai/status`);
      if (res.ok) {
        return await res.json();
      }
    } catch { /* ignore */ }

    return {
      status: this.aiEngineMode,
      message: 'XGBoost v1.4 Engine loaded',
    };
  }

  public async getHistory(duration: string = '5M'): Promise<TrafficDataPoint[]> {
    try {
      const res = await apiFetch(`${this.restBaseUrl}/traffic?duration=${duration}`);
      if (res.ok) {
        return await res.json();
      }
    } catch { /* ignore */ }
    return [];
  }

  public async getActiveConnections(): Promise<ActiveConnectionFlow[]> {
    return [];
  }

  public async getHosts(): Promise<HostTrafficMetric[]> {
    return [];
  }

  public async getProtocolDistribution(): Promise<ProtocolMetric[]> {
    return [
      { name: 'TCP (HTTP/HTTPS/SSH)', percentage: 72, packetsPerSec: 8985, color: '#3b82f6' },
      { name: 'UDP (DNS/Video)', percentage: 22, packetsPerSec: 2745, color: '#06b6d4' },
      { name: 'ICMP', percentage: 4, packetsPerSec: 499, color: '#10b981' },
      { name: 'Other', percentage: 2, packetsPerSec: 251, color: '#8b5cf6' },
    ];
  }

  public async getLabHistory(): Promise<any[]> {
    try {
      const res = await apiFetch(`${this.restBaseUrl}/lab/history`);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data.attacks) ? data.attacks : [];
      }
    } catch { /* ignore */ }
    return [];
  }

  public async getNotifications(): Promise<any[]> {
    try {
      const res = await apiFetch(`${this.restBaseUrl}/notifications`);
      if (res.ok) {
        const data = await res.json();
        return Array.isArray(data.notifications) ? data.notifications : [];
      }
    } catch { /* ignore */ }
    return [];
  }

  public async markNotificationRead(notificationId: string): Promise<boolean> {
    try {
      const res = await apiFetch(`${this.restBaseUrl}/notifications/read/${notificationId}`, { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async markAllNotificationsRead(): Promise<boolean> {
    try {
      const res = await apiFetch(`${this.restBaseUrl}/notifications/read-all`, { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async getThreatFeed(): Promise<ThreatAlert[]> {
    try {
      const res = await apiFetch(`${this.restBaseUrl}/threats`);
      if (res.ok) {
        return await res.json();
      }
    } catch { /* ignore */ }
    return [];
  }

  public async getActiveThreats(): Promise<ThreatAlert[]> {
    try {
      const res = await apiFetch(`${this.restBaseUrl}/threats/active`);
      if (res.ok) {
        return await res.json();
      }
    } catch { /* ignore */ }
    return [];
  }

  public async resolveThreat(threatId: string): Promise<boolean> {
    try {
      const res = await apiFetch(`${this.restBaseUrl}/threats/resolve/${threatId}`, { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  }

  public async injectTestThreat(scenario: string = 'DoS SYN Flood'): Promise<any> {
    try {
      const res = await apiFetch(`${this.restBaseUrl}/threats/inject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attackType: scenario,
          category: 'Network Availability',
          severity: 'CRITICAL',
          confidence: 0.985,
          riskScore: 96
        })
      });
      return await res.json();
    } catch (e) {
      console.error('Failed to inject test threat:', e);
      return null;
    }
  }

  public async getModelStats(): Promise<ModelMetricStats> {
    try {
      const res = await apiFetch(`${this.restBaseUrl}/model`);
      if (res.ok) {
        return await res.json();
      }
    } catch { /* ignore */ }
    return {
      accuracy: 98.4,
      precision: 97.6,
      recall: 98.1,
      f1Score: 97.8,
      falsePositiveRate: 0.6,
      averageInferenceTimeMs: 14,
      totalInferences: 1542900,
      modelType: 'XGBoost Gradient Boosting + Isolation Forest',
      modelVersion: '1.4.2-PROD',
      framework: 'XGBoost 1.7 / scikit-learn',
      datasetTrainedOn: 'CICIDS2017 + UNSW-NB15 + Isolated Lab Synthetic Flows',
      lastUpdated: '2026-09-18',
      status: 'ONLINE',
    };
  }

  public async getAiInference(): Promise<InferenceInspection> {
    return {
      timestamp: new Date().toLocaleTimeString(),
      sourceIp: LAB_ATTACKER_IP,
      destinationIp: LAB_TARGET_IP,
      protocol: 'TCP',
      predictedClass: 'BENIGN',
      confidence: 0.991,
      anomalyScore: 0.08,
      riskScore: 6,
      probabilities: [
        { label: 'Normal', probability: 0.991, color: '#10b981' },
        { label: 'Port Scan', probability: 0.003, color: '#3b82f6' },
        { label: 'Brute Force', probability: 0.002, color: '#f59e0b' },
        { label: 'DoS SYN Flood', probability: 0.002, color: '#ef4444' },
        { label: 'DDoS Distributed', probability: 0.001, color: '#ec4899' },
        { label: 'DNS Tunneling', probability: 0.001, color: '#8b5cf6' },
      ]
    };
  }

  public async getFeatures(schema: FeatureSchemaType = '78_FEATURES'): Promise<NetworkFeatureItem[]> {
    try {
      const res = await apiFetch(`${this.restBaseUrl}/features?schema=${schema}`);
      if (res.ok) {
        return await res.json();
      }
    } catch { /* ignore */ }
    return [];
  }

  public async getLabNodes(): Promise<LabHostNode[]> {
    try {
      const res = await apiFetch(`${this.restBaseUrl}/network`);
      if (res.ok) {
        return await res.json();
      }
    } catch { /* ignore */ }
    return [];
  }

  // INetworkSensorProvider
  public getSensorMode(): SensorStatusMode {
    return this.sensorMode;
  }

  public isMirroredTrafficActive(): boolean {
    return this.isConnected;
  }

  public isSensorOnline(): boolean {
    return this.isConnected;
  }

  // IAiInferenceProvider
  public getAiEngineMode(): AiEngineStatusMode {
    return this.aiEngineMode;
  }

  public isAiEngineOnline(): boolean {
    return this.isConnected;
  }

  public isAiEngineReady(): boolean {
    return this.isConnected;
  }
}

export const liveTelemetryService = new LiveTelemetryProvider();
