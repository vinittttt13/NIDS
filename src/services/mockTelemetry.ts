import type { 
  LiveTelemetrySnapshot, 
  TrafficDataPoint, 
  ActiveConnectionFlow, 
  HostTrafficMetric, 
  ProtocolMetric 
} from '../types/telemetry';
import type { ThreatAlert } from '../types/threat';
import type { 
  ModelMetricStats, 
  NetworkFeatureItem, 
  InferenceInspection 
} from '../types/ai';
import type { LabHostNode } from '../types/network';
import type { AttackTypeId, AttackIntensity } from '../types/attack';
import { LAB_ATTACKER_IP, LAB_TARGET_IP, LAB_SENSOR_IP } from './attackService';

export class MockTelemetryEngine {
  private activeAttack: AttackTypeId | null = null;
  private attackIntensity: AttackIntensity = 'MEDIUM';
  private subscribers: ((snapshot: LiveTelemetrySnapshot) => void)[] = [];
  private timer: any = null;

  // Baseline telemetry
  private basePacketsPerSec = 12480;
  private baseFlowsPerSec = 1284;
  private baseBytesPerSec = 8920400; // ~8.9 MB/s
  private threatsDetected = 17;
  private criticalThreats = 3;
  private detectionRate = 97.8;
  private avgLatencyMs = 184;

  // In-memory threat feed
  private threatList: ThreatAlert[] = [
    {
      id: 'ALT-9481',
      attackType: 'DoS SYN Flood',
      category: 'Network Availability',
      severity: 'CRITICAL',
      sourceIp: LAB_ATTACKER_IP,
      sourcePort: 54112,
      targetIp: LAB_TARGET_IP,
      targetPort: 80,
      protocol: 'TCP',
      confidence: 0.972,
      anomalyScore: 0.96,
      riskScore: 96,
      timestamp: '16:42:31',
      isoTime: new Date(Date.now() - 360000).toISOString(),
      detectionLatencyMs: 312,
      status: 'ACTIVE',
      packetCount: 142050,
      byteCount: 8523000,
      rawPcapSample: `IP ${LAB_ATTACKER_IP}.54112 > ${LAB_TARGET_IP}.80: Flags [S], seq 38920194, win 64240, length 0`,
      mitigationAction: 'Target rate-limiting suggested; sensor verification confirmed.',
      modelRecommendation: 'Isolate attacker socket stream and apply SYN cookies on victim gateway.',
      xaiFactors: [
        { factor: 'SYN Packet Ratio', weight: 38, baselineValue: '4.2%', observedValue: '99.1%', direction: 'EXCESSIVE' },
        { factor: 'Packets / Second', weight: 28, baselineValue: '12,480', observedValue: '88,400', direction: 'ELEVATED' },
        { factor: 'Flow Duration Mean', weight: 18, baselineValue: '4.2s', observedValue: '12ms', direction: 'ABNORMAL' },
        { factor: 'ACK Flag Absence', weight: 16, baselineValue: '94% ACK', observedValue: '0.2% ACK', direction: 'DEVIATION' },
      ]
    },
    {
      id: 'ALT-9480',
      attackType: 'Port Scan',
      category: 'Reconnaissance',
      severity: 'HIGH',
      sourceIp: LAB_ATTACKER_IP,
      sourcePort: 49820,
      targetIp: LAB_TARGET_IP,
      targetPort: 443,
      protocol: 'TCP',
      confidence: 0.948,
      anomalyScore: 0.91,
      riskScore: 88,
      timestamp: '16:41:12',
      isoTime: new Date(Date.now() - 440000).toISOString(),
      detectionLatencyMs: 438,
      status: 'INVESTIGATING',
      packetCount: 2480,
      byteCount: 148800,
      rawPcapSample: `IP ${LAB_ATTACKER_IP}.49820 > ${LAB_TARGET_IP}.443: Flags [S], seq 1029381, win 1024, length 0`,
      mitigationAction: 'Temporary drop rules on ports 1-1024; attacker host flagged.',
      modelRecommendation: 'Correlate with previous reconnaissance telemetry across subnet.',
      xaiFactors: [
        { factor: 'Dst Port Entropy', weight: 34, baselineValue: '1.2', observedValue: '4.9', direction: 'EXCESSIVE' },
        { factor: 'Flow Inter-Arrival Time', weight: 26, baselineValue: '450ms', observedValue: '8ms', direction: 'ABNORMAL' },
        { factor: 'Unanswered SYN Requests', weight: 22, baselineValue: '< 1%', observedValue: '86%', direction: 'ELEVATED' },
      ]
    },
    {
      id: 'ALT-9479',
      attackType: 'DNS Tunneling Anomaly',
      category: 'Protocol / Behavior Anomalies',
      severity: 'MEDIUM',
      sourceIp: `${LAB_ATTACKER_IP.substring(0, LAB_ATTACKER_IP.lastIndexOf('.'))}.15`,
      sourcePort: 58210,
      targetIp: LAB_TARGET_IP,
      targetPort: 53,
      protocol: 'UDP',
      confidence: 0.893,
      anomalyScore: 0.87,
      riskScore: 67,
      timestamp: '16:39:44',
      isoTime: new Date(Date.now() - 530000).toISOString(),
      detectionLatencyMs: 275,
      status: 'RESOLVED',
      packetCount: 1850,
      byteCount: 382000,
      rawPcapSample: `IP ${LAB_ATTACKER_IP.substring(0, LAB_ATTACKER_IP.lastIndexOf('.'))}.15.58210 > ${LAB_TARGET_IP}.53: 4120+ TXT? a8f9c7e01b.tunnel.lab.internal. (78)`,
      mitigationAction: 'DNS sinkhole verified. DNS traffic within baseline.',
      modelRecommendation: 'Inspect TXT record payload for hex-encoded staging binaries.',
      xaiFactors: [
        { factor: 'Subdomain String Entropy', weight: 42, baselineValue: '2.1', observedValue: '4.85', direction: 'EXCESSIVE' },
        { factor: 'DNS Query Length (Bytes)', weight: 30, baselineValue: '28B', observedValue: '142B', direction: 'ELEVATED' },
      ]
    }
  ];

  constructor() {
    this.startLoop();
  }

  public setActiveAttack(attackType: AttackTypeId | null, intensity: AttackIntensity = 'MEDIUM') {
    this.activeAttack = attackType;
    this.attackIntensity = intensity;
    if (attackType) {
      this.generateThreatForAttack(attackType, intensity);
    }
  }

  public getActiveAttack(): AttackTypeId | null {
    return this.activeAttack;
  }

  private generateThreatForAttack(type: AttackTypeId, intensity: AttackIntensity) {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
    const id = `ALT-${Math.floor(1000 + Math.random() * 9000)}`;

    let newAlert: ThreatAlert;

    if (type === 'DDOS_DISTRIBUTED_FLOOD') {
      newAlert = {
        id,
        attackType: 'Distributed Denial of Service (DDoS)',
        category: 'Network Availability',
        severity: 'CRITICAL',
        sourceIp: '192.168.100.10-.13 (4 Bot Nodes)',
        sourcePort: 48201,
        targetIp: LAB_TARGET_IP,
        targetPort: 80,
        protocol: 'Mixed (TCP/UDP)',
        confidence: 0.976,
        anomalyScore: 0.98,
        riskScore: 99,
        timestamp: timeStr,
        isoTime: new Date().toISOString(),
        detectionLatencyMs: 385,
        status: 'ACTIVE',
        packetCount: 248000,
        byteCount: 16840000,
        rawPcapSample: `IP 192.168.100.11.48201 > ${LAB_TARGET_IP}.80: Flags [S], seq 481920, win 64240, length 0\nIP 192.168.100.12.51920 > ${LAB_TARGET_IP}.53: UDP, length 1400`,
        mitigationAction: 'Multi-source rate limiting engaged; sensor traffic diversion active.',
        modelRecommendation: 'Multi-origin bot cluster converging on victim detected by XGBoost & Entropy Engine.',
        xaiFactors: [
          { factor: 'Source IP Entropy', weight: 42, baselineValue: '1.0 (Single)', observedValue: '4.82 (High Dispersion)', direction: 'EXCESSIVE' },
          { factor: 'Aggregated Packet Volume', weight: 32, baselineValue: '12,480 pkts/s', observedValue: '92,400 pkts/s', direction: 'EXCESSIVE' },
          { factor: 'Target Convergence (Port 80/53)', weight: 16, baselineValue: 'Dynamic', observedValue: '99.4% Targeted', direction: 'ELEVATED' },
          { factor: 'Packet Inter-Arrival Spacing', weight: 10, baselineValue: '42ms', observedValue: '0.01ms', direction: 'ABNORMAL' },
        ]
      };
    } else if (type === 'DOS_SYN_FLOOD') {
      const ppsDisplay = intensity === 'HIGH' ? '86,400 pkts/s' : intensity === 'LOW' ? '32,000 pkts/s' : '58,000 pkts/s';
      newAlert = {
        id,
        attackType: 'Single-Source DoS SYN Flood',
        category: 'Network Availability',
        severity: 'CRITICAL',
        sourceIp: LAB_ATTACKER_IP,
        sourcePort: 54112,
        targetIp: LAB_TARGET_IP,
        targetPort: 80,
        protocol: 'TCP',
        confidence: 0.989,
        anomalyScore: 0.96,
        riskScore: 98,
        timestamp: timeStr,
        isoTime: new Date().toISOString(),
        detectionLatencyMs: 242,
        status: 'ACTIVE',
        packetCount: 182400,
        byteCount: 10944000,
        rawPcapSample: `IP ${LAB_ATTACKER_IP}.58102 > ${LAB_TARGET_IP}.80: Flags [S], seq 9201948, win 64240, length 0`,
        mitigationAction: 'Target TCP backlog near threshold; isolated lab protection active.',
        modelRecommendation: 'Single-source saturating SYN flood detected. Sensor triggering emergency flow diversion.',
        xaiFactors: [
          { factor: 'Packets / Second', weight: 38, baselineValue: '12,480', observedValue: ppsDisplay, direction: 'EXCESSIVE' },
          { factor: 'SYN Flag Percentage', weight: 29, baselineValue: '4.1%', observedValue: '99.4%', direction: 'EXCESSIVE' },
          { factor: 'Forward vs Backward Packet Ratio', weight: 21, baselineValue: '1.08 : 1', observedValue: '940 : 1', direction: 'ABNORMAL' },
          { factor: 'Bandwidth Surge', weight: 12, baselineValue: '8.9 MB/s', observedValue: '54.8 MB/s', direction: 'ELEVATED' },
        ]
      };
    } else if (type === 'VOLUMETRIC_TRAFFIC_FLOOD') {
      newAlert = {
        id,
        attackType: 'UDP / ICMP Volumetric Flood',
        category: 'Network Availability',
        severity: 'HIGH',
        sourceIp: LAB_ATTACKER_IP,
        sourcePort: 5001,
        targetIp: LAB_TARGET_IP,
        targetPort: 5001,
        protocol: 'UDP',
        confidence: 0.942,
        anomalyScore: 0.93,
        riskScore: 89,
        timestamp: timeStr,
        isoTime: new Date().toISOString(),
        detectionLatencyMs: 280,
        status: 'ACTIVE',
        packetCount: 94000,
        byteCount: 13160000,
        rawPcapSample: `IP ${LAB_ATTACKER_IP}.5001 > ${LAB_TARGET_IP}.5001: UDP, length 1400`,
        mitigationAction: 'Stateless datagram threshold exceeded on port 5001.',
        modelRecommendation: 'Volumetric bandwidth saturation signature classified via XGBoost.',
        xaiFactors: [
          { factor: 'UDP Datagram Throughput', weight: 44, baselineValue: '2.4 MB/s', observedValue: '42.0 MB/s', direction: 'EXCESSIVE' },
          { factor: 'Uniform Payload Size (1400B)', weight: 32, baselineValue: 'Variable', observedValue: 'Static Fixed', direction: 'ABNORMAL' },
          { factor: 'ICMP Unreachable Rate', weight: 24, baselineValue: '0.1/s', observedValue: '180/s', direction: 'ELEVATED' },
        ]
      };
    } else if (type === 'PORT_SCAN') {
      newAlert = {
        id,
        attackType: 'SYN Port Scan',
        category: 'Reconnaissance',
        severity: 'HIGH',
        sourceIp: LAB_ATTACKER_IP,
        sourcePort: Math.floor(40000 + Math.random() * 20000),
        targetIp: LAB_TARGET_IP,
        targetPort: 80,
        protocol: 'TCP',
        confidence: 0.968,
        anomalyScore: 0.91,
        riskScore: 94,
        timestamp: timeStr,
        isoTime: new Date().toISOString(),
        detectionLatencyMs: 438,
        status: 'ACTIVE',
        packetCount: 3120,
        byteCount: 187200,
        rawPcapSample: `IP ${LAB_ATTACKER_IP}.49281 > ${LAB_TARGET_IP}.80: Flags [S], seq 4819204, win 1024, length 0`,
        mitigationAction: 'Sensor alert broadcasted; Port-scan signature logged to SOC.',
        modelRecommendation: 'High confidence TCP reconnaissance signature detected via XGBoost v1.4.',
        xaiFactors: [
          { factor: 'Destination Port Entropy', weight: 31, baselineValue: '1.2', observedValue: '5.2', direction: 'EXCESSIVE' },
          { factor: 'Packet Transmission Rate', weight: 24, baselineValue: '12.4k/s', observedValue: '28.6k/s', direction: 'ELEVATED' },
          { factor: 'Flow Duration (< 20ms)', weight: 20, baselineValue: '3.8s avg', observedValue: '9.2ms', direction: 'ABNORMAL' },
          { factor: 'SYN / RST Ratio', weight: 14, baselineValue: '0.04', observedValue: '0.94', direction: 'DEVIATION' },
        ]
      };
    } else if (type === 'BRUTE_FORCE') {
      newAlert = {
        id,
        attackType: 'SSH / HTTP Auth Brute Force',
        category: 'Credential Attacks',
        severity: 'HIGH',
        sourceIp: LAB_ATTACKER_IP,
        sourcePort: 52194,
        targetIp: LAB_TARGET_IP,
        targetPort: 22,
        protocol: 'TCP',
        confidence: 0.954,
        anomalyScore: 0.88,
        riskScore: 86,
        timestamp: timeStr,
        isoTime: new Date().toISOString(),
        detectionLatencyMs: 380,
        status: 'ACTIVE',
        packetCount: 1940,
        byteCount: 164000,
        rawPcapSample: `IP ${LAB_ATTACKER_IP}.52194 > ${LAB_TARGET_IP}.22: Flags [P.], seq 1:94, ack 1, win 502`,
        mitigationAction: 'Automated authentication failure bursts intercepted.',
        modelRecommendation: 'Inspect credential brute force stream on port 22.',
        xaiFactors: [
          { factor: 'RST Handshake Flag Rate', weight: 36, baselineValue: '0.1/s', observedValue: '32/s', direction: 'EXCESSIVE' },
          { factor: 'Fixed Flow Inter-Arrival Variance', weight: 28, baselineValue: 'σ=420ms', observedValue: 'σ=1.4ms', direction: 'ABNORMAL' },
          { factor: 'Uniform Payload Size (84-128B)', weight: 22, baselineValue: 'Dynamic', observedValue: 'Static Fixed', direction: 'DEVIATION' },
        ]
      };
    } else if (type === 'DNS_ANOMALY') {
      newAlert = {
        id,
        attackType: 'DNS Tunneling Anomaly',
        category: 'Protocol / Behavior Anomalies',
        severity: 'MEDIUM',
        sourceIp: LAB_ATTACKER_IP,
        sourcePort: 54100,
        targetIp: LAB_TARGET_IP,
        targetPort: 53,
        protocol: 'DNS',
        confidence: 0.912,
        anomalyScore: 0.87,
        riskScore: 79,
        timestamp: timeStr,
        isoTime: new Date().toISOString(),
        detectionLatencyMs: 295,
        status: 'ACTIVE',
        packetCount: 2200,
        byteCount: 310000,
        rawPcapSample: `IP ${LAB_ATTACKER_IP}.54100 > ${LAB_TARGET_IP}.53: 4912+ TXT? f98b2c4e109d.exfil.lab.test.`,
        mitigationAction: 'DNS sensor captured entropy anomaly; records logged for SOC audit.',
        modelRecommendation: 'Inspect high-entropy TXT requests for covert data channel.',
        xaiFactors: [
          { factor: 'Shannon Entropy of Subdomain', weight: 40, baselineValue: '2.14', observedValue: '4.85', direction: 'EXCESSIVE' },
          { factor: 'DNS Query Byte Length', weight: 28, baselineValue: '32 Bytes', observedValue: '168 Bytes', direction: 'ELEVATED' },
          { factor: 'Request Frequency on UDP 53', weight: 20, baselineValue: '2/sec', observedValue: '45/sec', direction: 'ABNORMAL' },
        ]
      };
    } else {
      // SUSPICIOUS_FLOW
      newAlert = {
        id,
        attackType: 'Evasive Asymmetric Flow',
        category: 'Protocol / Behavior Anomalies',
        severity: 'MEDIUM',
        sourceIp: LAB_ATTACKER_IP,
        sourcePort: 53920,
        targetIp: LAB_TARGET_IP,
        targetPort: 8443,
        protocol: 'TCP',
        confidence: 0.885,
        anomalyScore: 0.84,
        riskScore: 72,
        timestamp: timeStr,
        isoTime: new Date().toISOString(),
        detectionLatencyMs: 340,
        status: 'ACTIVE',
        packetCount: 950,
        byteCount: 88000,
        rawPcapSample: `IP ${LAB_ATTACKER_IP}.53920 > ${LAB_TARGET_IP}.8443: Flags [P.], seq 1040:1280, ack 1`,
        mitigationAction: 'Session isolated for deep packet flow behavioral tracing.',
        modelRecommendation: 'Low-and-slow beaconing pattern detected by Isolation Forest engine.',
        xaiFactors: [
          { factor: 'Periodic Beacon Cadence (2.5s)', weight: 36, baselineValue: 'Random', observedValue: '2.5s ±4%', direction: 'ABNORMAL' },
          { factor: 'TLS Record Structure Anomaly', weight: 30, baselineValue: 'Standard RFC', observedValue: 'Obfuscated', direction: 'DEVIATION' },
        ]
      };
    }

    this.threatList.unshift(newAlert);
    this.threatsDetected += 1;
    if (newAlert.severity === 'CRITICAL') {
      this.criticalThreats += 1;
    }
  }

  private startLoop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      const snapshot = this.getSnapshot();
      this.subscribers.forEach(cb => cb(snapshot));
    }, 1500);
  }

  public subscribe(callback: (snapshot: LiveTelemetrySnapshot) => void): () => void {
    this.subscribers.push(callback);
    callback(this.getSnapshot());
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  public getSnapshot(): LiveTelemetrySnapshot {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
    const jitter = (Math.random() - 0.5) * 400;

    let pps = this.basePacketsPerSec + jitter;
    let fps = this.baseFlowsPerSec + (Math.random() - 0.5) * 40;
    let bps = this.baseBytesPerSec + (Math.random() - 0.5) * 200000;
    let suspiciousRatio = 0.03 + Math.random() * 0.02;

    if (this.activeAttack === 'DDOS_DISTRIBUTED_FLOOD') {
      pps = 94200 + Math.random() * 6000;
      fps = 8400 + Math.random() * 500;
      bps = 64800000 + Math.random() * 4000000;
      suspiciousRatio = 0.94;
    } else if (this.activeAttack === 'DOS_SYN_FLOOD') {
      pps = 86400 + Math.random() * 5000;
      fps = 6200 + Math.random() * 400;
      bps = 54800000 + Math.random() * 3000000;
      suspiciousRatio = 0.88;
    } else if (this.activeAttack === 'VOLUMETRIC_TRAFFIC_FLOOD') {
      pps = 52000 + Math.random() * 3000;
      fps = 3100 + Math.random() * 200;
      bps = 42000000 + Math.random() * 2000000;
      suspiciousRatio = 0.76;
    } else if (this.activeAttack === 'PORT_SCAN') {
      pps = 28600 + Math.random() * 2000;
      fps = 4800 + Math.random() * 300;
      bps = 14200000 + Math.random() * 800000;
      suspiciousRatio = 0.62;
    } else if (this.activeAttack === 'BRUTE_FORCE') {
      pps = 18400 + Math.random() * 1200;
      fps = 2100 + Math.random() * 150;
      bps = 11200000 + Math.random() * 600000;
      suspiciousRatio = 0.45;
    } else if (this.activeAttack === 'DNS_ANOMALY') {
      pps = 16200 + Math.random() * 800;
      fps = 1950 + Math.random() * 100;
      bps = 9800000 + Math.random() * 400000;
      suspiciousRatio = 0.38;
    } else if (this.activeAttack === 'SUSPICIOUS_FLOW') {
      pps = 14800 + Math.random() * 600;
      fps = 1420 + Math.random() * 80;
      bps = 9200000 + Math.random() * 300000;
      suspiciousRatio = 0.28;
    }

    return {
      timestamp: timeStr,
      packetsPerSec: Math.round(pps),
      flowsPerSec: Math.round(fps),
      bytesPerSec: Math.round(bps),
      activeFlowsCount: Math.round(fps * 1.2),
      threatsDetectedCount: this.threatsDetected,
      criticalThreatsCount: this.criticalThreats,
      aiDetectionRate: this.detectionRate,
      avgDetectionLatencyMs: this.activeAttack ? 342 : this.avgLatencyMs,
      suspiciousTrafficRatio: Number(suspiciousRatio.toFixed(3)),
    };
  }

  public getHistory(duration: '1M' | '5M' | '15M' | '1H'): TrafficDataPoint[] {
    const points: TrafficDataPoint[] = [];
    const count = duration === '1M' ? 20 : duration === '5M' ? 30 : duration === '15M' ? 45 : 60;
    const now = Date.now();
    const intervalMs = duration === '1M' ? 3000 : duration === '5M' ? 10000 : duration === '15M' ? 20000 : 60000;

    for (let i = count - 1; i >= 0; i--) {
      const t = new Date(now - i * intervalMs);
      const timeStr = t.toLocaleTimeString('en-US', { hour12: false, minute: '2-digit', second: '2-digit' });
      
      let baseP = 12000 + Math.sin(i * 0.3) * 1200 + Math.random() * 800;
      let suspiciousP = 150 + Math.random() * 100;
      let alerts = 0;

      if (this.activeAttack && i < 6) {
        if (this.activeAttack === 'DDOS_DISTRIBUTED_FLOOD') {
          baseP = 88000 + (6 - i) * 2500 + Math.random() * 4000;
          suspiciousP = baseP * 0.92;
          alerts = 3;
        } else if (this.activeAttack === 'DOS_SYN_FLOOD') {
          baseP = 78000 + (6 - i) * 2000 + Math.random() * 4000;
          suspiciousP = baseP * 0.85;
          alerts = 2;
        } else if (this.activeAttack === 'VOLUMETRIC_TRAFFIC_FLOOD') {
          baseP = 48000 + (6 - i) * 1200 + Math.random() * 3000;
          suspiciousP = baseP * 0.75;
          alerts = 1;
        } else if (this.activeAttack === 'PORT_SCAN') {
          baseP = 26000 + (6 - i) * 600 + Math.random() * 1500;
          suspiciousP = baseP * 0.6;
          alerts = 1;
        } else {
          baseP = 18000 + (6 - i) * 400 + Math.random() * 1000;
          suspiciousP = baseP * 0.4;
          alerts = 1;
        }
      }

      points.push({
        time: timeStr,
        timestamp: t.getTime(),
        packetsPerSec: Math.round(baseP),
        flowsPerSec: Math.round(baseP / 10),
        bytesPerSec: Math.round(baseP * 720),
        suspiciousPackets: Math.round(suspiciousP),
        alertsCount: alerts,
      });
    }

    return points;
  }

  public getThreatFeed(): ThreatAlert[] {
    return this.threatList;
  }

  public resolveThreat(id: string) {
    this.threatList = this.threatList.map(t => t.id === id ? { ...t, status: 'RESOLVED' as const } : t);
  }

  public getActiveConnections(): ActiveConnectionFlow[] {
    const isDdos = this.activeAttack === 'DDOS_DISTRIBUTED_FLOOD';
    const isDos = this.activeAttack === 'DOS_SYN_FLOOD';
    const isScan = this.activeAttack === 'PORT_SCAN';
    const isBrute = this.activeAttack === 'BRUTE_FORCE';
    const isVolumetric = this.activeAttack === 'VOLUMETRIC_TRAFFIC_FLOOD';

    const flows: ActiveConnectionFlow[] = [
      {
        id: 'flow-001',
        sourceIp: isDdos ? '192.168.100.11' : isScan || isDos || isBrute || isVolumetric ? LAB_ATTACKER_IP : '192.168.100.10',
        sourcePort: isScan ? 49820 : 54112,
        destinationIp: LAB_TARGET_IP,
        destinationPort: isBrute ? 22 : isVolumetric ? 5001 : 80,
        protocol: isVolumetric ? 'UDP' : 'TCP',
        durationSec: isScan ? 0.015 : isDdos || isDos ? 14.2 : 4.8,
        packets: isDdos ? 92040 : isDos ? 86420 : isScan ? 120 : 48,
        bytes: isDdos ? 6240000 : isDos ? 5185200 : 7240,
        state: isDdos ? 'DDOS_BURST' : isDos ? 'FLOODING' : isScan ? 'SCANNING' : 'ESTABLISHED',
        aiClassification: this.activeAttack ? this.getAttackClassName(this.activeAttack) : 'Benign',
        riskScore: isDdos ? 99 : isDos ? 98 : isScan ? 94 : isBrute ? 86 : 12,
        isSuspicious: Boolean(this.activeAttack),
      },
      {
        id: 'flow-002',
        sourceIp: isDdos ? '192.168.100.12' : '192.168.100.15',
        sourcePort: isDdos ? 51920 : 51204,
        destinationIp: LAB_TARGET_IP,
        destinationPort: isDdos ? 443 : 443,
        protocol: 'HTTPS',
        durationSec: isDdos ? 8.2 : 18.4,
        packets: isDdos ? 48100 : 340,
        bytes: isDdos ? 3200000 : 428000,
        state: isDdos ? 'DDOS_BURST' : 'ESTABLISHED',
        aiClassification: isDdos ? 'DDoS Vector' : 'Benign Flow',
        riskScore: isDdos ? 98 : 6,
        isSuspicious: isDdos,
      },
      {
        id: 'flow-003',
        sourceIp: isDdos ? '192.168.100.13' : '192.168.100.10',
        sourcePort: isDdos ? 48312 : 58210,
        destinationIp: isDdos ? LAB_TARGET_IP : '192.168.100.1',
        destinationPort: 53,
        protocol: 'DNS',
        durationSec: isDdos ? 6.4 : 0.04,
        packets: isDdos ? 38200 : 2,
        bytes: isDdos ? 2480000 : 148,
        state: isDdos ? 'FLOODING' : 'CLOSED',
        aiClassification: isDdos ? 'DDoS DNS Flood' : 'Benign DNS',
        riskScore: isDdos ? 96 : 4,
        isSuspicious: isDdos,
      },
      {
        id: 'flow-004',
        sourceIp: '192.168.100.45',
        sourcePort: 44102,
        destinationIp: LAB_TARGET_IP,
        destinationPort: 80,
        protocol: 'HTTP',
        durationSec: 2.1,
        packets: 28,
        bytes: 14200,
        state: 'FIN_WAIT',
        aiClassification: 'Benign Web',
        riskScore: 8,
        isSuspicious: false,
      },
    ];

    return flows;
  }

  private getAttackClassName(type: AttackTypeId): string {
    switch(type) {
      case 'DDOS_DISTRIBUTED_FLOOD': return 'DDoS (Multi-Source)';
      case 'DOS_SYN_FLOOD': return 'DoS SYN Flood';
      case 'VOLUMETRIC_TRAFFIC_FLOOD': return 'Volumetric Flood';
      case 'PORT_SCAN': return 'Port Scan (Recon)';
      case 'BRUTE_FORCE': return 'SSH Auth Brute Force';
      case 'DNS_ANOMALY': return 'DNS Tunneling / Anomaly';
      case 'SUSPICIOUS_FLOW': return 'Evasive Flow';
      default: return 'Benign';
    }
  }

  public getHosts(): HostTrafficMetric[] {
    const isAttacking = Boolean(this.activeAttack);
    const isDdos = this.activeAttack === 'DDOS_DISTRIBUTED_FLOOD';

    return [
      {
        ip: LAB_ATTACKER_IP,
        hostname: 'PC1-ATTACKER (Kali/Controller)',
        role: 'ATTACKER',
        packetsSent: isAttacking ? 284900 : 34820,
        packetsReceived: 4200,
        bytesTotal: isAttacking ? '38.4 MB' : '4.2 MB',
        flowCount: isAttacking ? 1420 : 180,
        threatsOriginated: this.threatsDetected,
        threatsTargeted: 0,
        status: isAttacking ? 'ACTIVE_ATTACK' : 'ONLINE',
      },
      {
        ip: '192.168.100.11',
        hostname: 'LAB-BOT-01 (Simulated Node)',
        role: 'BOT_NODE',
        packetsSent: isDdos ? 94200 : 120,
        packetsReceived: 40,
        bytesTotal: isDdos ? '6.8 MB' : '14 KB',
        flowCount: isDdos ? 420 : 2,
        threatsOriginated: isDdos ? 1 : 0,
        threatsTargeted: 0,
        status: isDdos ? 'DDOS_CLUSTER' : 'NORMAL',
      },
      {
        ip: LAB_TARGET_IP,
        hostname: 'LAB-VICTIM (Ubuntu 22.04 LTS)',
        role: 'VICTIM',
        packetsSent: 18400,
        packetsReceived: isAttacking ? 289100 : 38900,
        bytesTotal: isAttacking ? '39.8 MB' : '5.1 MB',
        flowCount: isAttacking ? 1430 : 195,
        threatsOriginated: 0,
        threatsTargeted: this.threatsDetected,
        status: isAttacking ? 'UNDER_ATTACK' : 'ONLINE',
      },
      {
        ip: LAB_SENSOR_IP,
        hostname: 'PC2-AI-NIDS (Zeek/Suricata/XGB)',
        role: 'SENSOR',
        packetsSent: 8400,
        packetsReceived: isAttacking ? 307500 : 73720,
        bytesTotal: '44.5 MB',
        flowCount: 84,
        threatsOriginated: 0,
        threatsTargeted: 0,
        status: 'ONLINE',
      },
      {
        ip: '192.168.100.1',
        hostname: 'LAB-GATEWAY / Switch Router',
        role: 'GATEWAY',
        packetsSent: 94200,
        packetsReceived: 93800,
        bytesTotal: '12.4 MB',
        flowCount: 220,
        threatsOriginated: 0,
        threatsTargeted: 0,
        status: 'ONLINE',
      }
    ];
  }

  public getProtocolDistribution(): ProtocolMetric[] {
    // Protocol breakdown stays in phosphor tints — a rainbow categorical
    // palette would be decorative. The exception: the protocol actually
    // carrying an active flood is marked sev.critical, because that color
    // genuinely means something here (it names the attack vector).
    if (this.activeAttack === 'DDOS_DISTRIBUTED_FLOOD') {
      return [
        { name: 'TCP', percentage: 62.4, packetsPerSec: 58800, color: '#FF4D4D' },
        { name: 'UDP', percentage: 28.6, packetsPerSec: 26900, color: '#1FA862' },
        { name: 'DNS', percentage: 6.2, packetsPerSec: 5800, color: '#14704A' },
        { name: 'HTTP/S', percentage: 2.0, packetsPerSec: 1900, color: '#A8F0C6' },
        { name: 'ICMP', percentage: 0.8, packetsPerSec: 800, color: '#0D4530' },
      ];
    }
    if (this.activeAttack === 'DOS_SYN_FLOOD') {
      return [
        { name: 'TCP', percentage: 88.5, packetsPerSec: 76400, color: '#FF4D4D' },
        { name: 'UDP', percentage: 5.2, packetsPerSec: 4500, color: '#1FA862' },
        { name: 'DNS', percentage: 2.8, packetsPerSec: 2400, color: '#14704A' },
        { name: 'HTTP/S', percentage: 2.5, packetsPerSec: 2100, color: '#A8F0C6' },
        { name: 'ICMP', percentage: 1.0, packetsPerSec: 1000, color: '#0D4530' },
      ];
    }
    return [
      { name: 'TCP', percentage: 58.4, packetsPerSec: 7300, color: '#6EE7A8' },
      { name: 'UDP', percentage: 22.1, packetsPerSec: 2750, color: '#34D178' },
      { name: 'HTTP/S', percentage: 11.2, packetsPerSec: 1400, color: '#A8F0C6' },
      { name: 'DNS', percentage: 6.1, packetsPerSec: 760, color: '#1FA862' },
      { name: 'ICMP', percentage: 2.2, packetsPerSec: 270, color: '#14704A' },
    ];
  }

  public getAiInference(): InferenceInspection {
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    
    if (this.activeAttack === 'DDOS_DISTRIBUTED_FLOOD') {
      return {
        sourceIp: '192.168.100.10-.13 (Multi-Source Cluster)',
        destinationIp: LAB_TARGET_IP,
        protocol: 'TCP / UDP Mixed',
        predictedClass: 'DDoS',
        confidence: 0.976,
        anomalyScore: 0.98,
        riskScore: 99,
        timestamp: now,
        probabilities: [
          { label: 'DDoS', probability: 0.976, color: '#ef4444', isDominant: true },
          { label: 'DoS', probability: 0.016, color: '#f97316' },
          { label: 'Benign', probability: 0.005, color: '#10b981' },
          { label: 'Port Scan', probability: 0.002, color: '#f59e0b' },
          { label: 'Other', probability: 0.001, color: '#64748b' },
        ]
      };
    }

    if (this.activeAttack === 'DOS_SYN_FLOOD') {
      return {
        sourceIp: LAB_ATTACKER_IP,
        destinationIp: LAB_TARGET_IP,
        protocol: 'TCP (Port 80)',
        predictedClass: 'DoS',
        confidence: 0.989,
        anomalyScore: 0.96,
        riskScore: 98,
        timestamp: now,
        probabilities: [
          { label: 'DoS', probability: 0.989, color: '#ef4444', isDominant: true },
          { label: 'DDoS', probability: 0.006, color: '#f97316' },
          { label: 'Benign', probability: 0.003, color: '#10b981' },
          { label: 'Port Scan', probability: 0.002, color: '#f59e0b' },
          { label: 'Other', probability: 0.000, color: '#64748b' },
        ]
      };
    }

    if (this.activeAttack === 'VOLUMETRIC_TRAFFIC_FLOOD') {
      return {
        sourceIp: LAB_ATTACKER_IP,
        destinationIp: LAB_TARGET_IP,
        protocol: 'UDP (Port 5001)',
        predictedClass: 'Traffic Flood',
        confidence: 0.942,
        anomalyScore: 0.93,
        riskScore: 89,
        timestamp: now,
        probabilities: [
          { label: 'Traffic Flood', probability: 0.942, color: '#f97316', isDominant: true },
          { label: 'DoS', probability: 0.038, color: '#ef4444' },
          { label: 'Benign', probability: 0.012, color: '#10b981' },
          { label: 'Other', probability: 0.008, color: '#64748b' },
        ]
      };
    }

    if (this.activeAttack === 'PORT_SCAN') {
      return {
        sourceIp: LAB_ATTACKER_IP,
        destinationIp: LAB_TARGET_IP,
        protocol: 'TCP',
        predictedClass: 'PORT SCAN',
        confidence: 0.968,
        anomalyScore: 0.91,
        riskScore: 94,
        timestamp: now,
        probabilities: [
          { label: 'Port Scan', probability: 0.968, color: '#ef4444', isDominant: true },
          { label: 'Benign', probability: 0.021, color: '#10b981' },
          { label: 'DoS', probability: 0.007, color: '#f97316' },
          { label: 'Brute Force', probability: 0.004, color: '#f59e0b' },
          { label: 'Other', probability: 0.000, color: '#64748b' },
        ]
      };
    }

    if (this.activeAttack === 'BRUTE_FORCE') {
      return {
        sourceIp: LAB_ATTACKER_IP,
        destinationIp: LAB_TARGET_IP,
        protocol: 'TCP (Port 22)',
        predictedClass: 'BRUTE FORCE',
        confidence: 0.954,
        anomalyScore: 0.88,
        riskScore: 86,
        timestamp: now,
        probabilities: [
          { label: 'Brute Force', probability: 0.954, color: '#f97316', isDominant: true },
          { label: 'Benign', probability: 0.032, color: '#10b981' },
          { label: 'Port Scan', probability: 0.009, color: '#ef4444' },
          { label: 'DoS', probability: 0.005, color: '#f59e0b' },
          { label: 'Other', probability: 0.000, color: '#64748b' },
        ]
      };
    }

    if (this.activeAttack === 'DNS_ANOMALY') {
      return {
        sourceIp: LAB_ATTACKER_IP,
        destinationIp: LAB_TARGET_IP,
        protocol: 'UDP (Port 53)',
        predictedClass: 'DNS ANOMALY',
        confidence: 0.912,
        anomalyScore: 0.87,
        riskScore: 79,
        timestamp: now,
        probabilities: [
          { label: 'DNS Anomaly', probability: 0.912, color: '#06b6d4', isDominant: true },
          { label: 'Benign', probability: 0.071, color: '#10b981' },
          { label: 'Port Scan', probability: 0.010, color: '#f97316' },
          { label: 'DoS', probability: 0.007, color: '#ef4444' },
          { label: 'Other', probability: 0.000, color: '#64748b' },
        ]
      };
    }

    if (this.activeAttack === 'SUSPICIOUS_FLOW') {
      return {
        sourceIp: LAB_ATTACKER_IP,
        destinationIp: LAB_TARGET_IP,
        protocol: 'TCP (Port 8443)',
        predictedClass: 'SUSPICIOUS FLOW',
        confidence: 0.885,
        anomalyScore: 0.84,
        riskScore: 72,
        timestamp: now,
        probabilities: [
          { label: 'Suspicious Flow', probability: 0.885, color: '#f59e0b', isDominant: true },
          { label: 'Benign', probability: 0.092, color: '#10b981' },
          { label: 'Port Scan', probability: 0.015, color: '#ef4444' },
          { label: 'DoS', probability: 0.008, color: '#f97316' },
          { label: 'Other', probability: 0.000, color: '#64748b' },
        ]
      };
    }

    // Default Benign Baseline
    return {
      sourceIp: '192.168.100.15',
      destinationIp: '192.168.100.20',
      protocol: 'TCP (Port 443)',
      predictedClass: 'BENIGN',
      confidence: 0.982,
      anomalyScore: 0.04,
      riskScore: 8,
      timestamp: now,
      probabilities: [
        { label: 'Benign', probability: 0.982, color: '#10b981', isDominant: true },
        { label: 'Port Scan', probability: 0.011, color: '#f97316' },
        { label: 'DoS', probability: 0.004, color: '#ef4444' },
        { label: 'DDoS', probability: 0.002, color: '#dc2626' },
        { label: 'Brute Force', probability: 0.001, color: '#f59e0b' },
      ]
    };
  }

  public getFeatures(schema: '41_FEATURES' | '78_FEATURES'): NetworkFeatureItem[] {
    const isDdos = this.activeAttack === 'DDOS_DISTRIBUTED_FLOOD';
    const isDos = this.activeAttack === 'DOS_SYN_FLOOD';
    const isScan = this.activeAttack === 'PORT_SCAN';
    const isBrute = this.activeAttack === 'BRUTE_FORCE';
    const isVolumetric = this.activeAttack === 'VOLUMETRIC_TRAFFIC_FLOOD';

    const list: NetworkFeatureItem[] = [
      {
        id: 'f_dst_port',
        name: 'Destination Port',
        category: 'Flow Basic',
        value: isScan ? 'Multi (1-8080)' : isDos ? 80 : isBrute ? 22 : isVolumetric ? 5001 : 443,
        unit: 'port',
        baseline: '443 / 80 / 53',
        importance: 31,
        description: 'Destination service port being targeted by the flow stream.',
        schema: 'BOTH',
      },
      {
        id: 'f_pkt_rate',
        name: 'Flow Packets / sec',
        category: 'Packet Statistics',
        value: isDdos ? 94200 : isDos ? 86420 : isVolumetric ? 52000 : isScan ? 28600 : 12480,
        unit: 'pkts/s',
        baseline: '12,480 pkts/s',
        importance: 24,
        description: 'Calculated packet transmission frequency through sensor.',
        schema: 'BOTH',
      },
      {
        id: 'f_flow_dur',
        name: 'Flow Duration',
        category: 'Flow Basic',
        value: isScan ? '12 ms' : isDdos || isDos ? '14.2 s' : '3.8 s',
        unit: 'time',
        baseline: '3.8 seconds',
        importance: 20,
        description: 'Total elapsed time for current bi-directional flow session.',
        schema: 'BOTH',
      },
      {
        id: 'f_src_entropy',
        name: 'Source IP Entropy',
        category: 'Packet Statistics',
        value: isDdos ? '4.82 (High)' : '1.00 (Single)',
        unit: 'entropy',
        baseline: '1.20 Shannon',
        importance: 18,
        description: 'Measures source address dispersion across incoming flows (crucial for DDoS detection).',
        schema: 'BOTH',
      },
      {
        id: 'f_syn_cnt',
        name: 'SYN Flag Count',
        category: 'Flag Counts',
        value: isDdos ? 92000 : isDos ? 86200 : isScan ? 2840 : 42,
        unit: 'flags',
        baseline: '< 50 / interval',
        importance: 14,
        description: 'Total TCP connection synchronization requests observed.',
        schema: 'BOTH',
      },
      {
        id: 'f_flow_bytes',
        name: 'Flow Bytes / sec',
        category: 'Packet Statistics',
        value: isDdos ? '64.8 MB/s' : isDos ? '54.8 MB/s' : isVolumetric ? '42.0 MB/s' : isScan ? '3.4 MB/s' : '780 KB/s',
        unit: 'bytes/s',
        baseline: '780 KB/s',
        importance: 11,
        description: 'Aggregate byte throughput rate across the connection.',
        schema: 'BOTH',
      },
      {
        id: 'f_rst_cnt',
        name: 'RST Flag Count',
        category: 'Flag Counts',
        value: isBrute ? 48 : isScan ? 142 : 2,
        unit: 'flags',
        baseline: '< 5',
        importance: 7,
        description: 'TCP Connection Reset flags sent due to closed ports or rejected auth.',
        schema: 'BOTH',
      },
      {
        id: 'f_iat_mean',
        name: 'Flow IAT Mean',
        category: 'Inter-Arrival Time',
        value: isDdos || isDos ? '0.01 ms' : isScan ? '8.4 ms' : '42.1 ms',
        unit: 'ms',
        baseline: '42.0 ms',
        importance: 7,
        description: 'Mean inter-arrival time between consecutive packet transmissions.',
        schema: 'BOTH',
      }
    ];

    return list;
  }

  public getModelStats(): ModelMetricStats {
    return {
      accuracy: 97.8,
      precision: 96.9,
      recall: 97.2,
      f1Score: 97.0,
      falsePositiveRate: 0.8,
      averageInferenceTimeMs: 14,
      totalInferences: 1482900,
      modelType: 'XGBoost Gradient Boosting Classifier + Isolation Forest',
      modelVersion: '1.4.2-PROD',
      framework: 'XGBoost / scikit-learn 1.4',
      datasetTrainedOn: 'CICIDS2017 + UNSW-NB15 + Isolated Lab Synthetic Flows',
      lastUpdated: 'Demo Model Simulation',
      status: 'ONLINE',
    };
  }

  public getLabNodes(): LabHostNode[] {
    const isAttacking = Boolean(this.activeAttack);
    const isDdos = this.activeAttack === 'DDOS_DISTRIBUTED_FLOOD';

    return [
      {
        id: 'node-pc1',
        ip: LAB_ATTACKER_IP,
        hostname: 'PC1-ATTACK-LAB',
        mac: '00:1A:2B:3C:4D:10',
        os: 'Kali Linux 2024.1 / Python Controller',
        role: 'ATTACKER_PC',
        physicalPc: 'PC 1 (Attack Lab)',
        status: isAttacking ? 'ACTIVE_ATTACKING' : 'ONLINE',
        packetsIn: 4820,
        packetsOut: isAttacking ? 284000 : 34800,
        threatCount: this.threatsDetected,
        switchPort: 'Port 1 (Access / Wi-Fi)',
        transportType: 'ETHERNET',
      },
      {
        id: 'node-bot1',
        ip: '192.168.100.11',
        hostname: 'LAB-BOT-AGENT-01',
        mac: '00:1A:2B:3C:4D:11',
        os: 'Ubuntu Server (Lab Agent)',
        role: 'BOT_NODE',
        physicalPc: 'Lab VM',
        status: isDdos ? 'DDOS_SOURCE' : 'ONLINE',
        packetsIn: 120,
        packetsOut: isDdos ? 94200 : 80,
        threatCount: isDdos ? 1 : 0,
        switchPort: 'Port 4 (VLAN 100)',
        transportType: 'ETHERNET',
      },
      {
        id: 'node-pc2',
        ip: LAB_SENSOR_IP,
        hostname: 'PC2-AI-NIDS',
        mac: '00:1A:2B:3C:4D:30',
        os: 'Ubuntu 22.04 LTS (Zeek / Suricata / FastAPI)',
        role: 'SENSOR_NIDS',
        physicalPc: 'PC 2 (AI-NIDS)',
        status: 'MONITORING',
        packetsIn: isAttacking ? 307500 : 73720,
        packetsOut: 8400,
        threatCount: 0,
        switchPort: 'Port 8 (Mirror Dest SPAN)',
        transportType: 'ETHERNET',
        isMirrored: true,
      },
      {
        id: 'node-victim',
        ip: LAB_TARGET_IP,
        hostname: 'LAB-VICTIM',
        mac: '00:1A:2B:3C:4D:20',
        os: 'Ubuntu Server 22.04 (Target Services)',
        role: 'VICTIM_SERVER',
        physicalPc: 'Lab VM',
        status: isAttacking ? 'UNDER_ATTACK' : 'ONLINE',
        packetsIn: isAttacking ? 289100 : 38900,
        packetsOut: 18400,
        threatCount: this.threatsDetected,
        switchPort: 'Port 2 (Mirror Source SPAN)',
        transportType: 'ETHERNET',
        isMirrored: true,
      },
      {
        id: 'node-gateway',
        ip: '192.168.100.1',
        hostname: 'LAB-ROUTER-AP',
        mac: '00:1A:2B:3C:4D:01',
        os: 'Cisco / AP Gateway (Wi-Fi & Ethernet)',
        role: 'ROUTER_GW',
        physicalPc: 'Isolated Switch',
        status: 'ONLINE',
        packetsIn: 94200,
        packetsOut: 93800,
        threatCount: 0,
        switchPort: 'Trunk / Wireless AP',
        transportType: 'WI-FI',
      }
    ];
  }
}

export const mockTelemetryService = new MockTelemetryEngine();
