import type { AttackScenario, AttackTypeId, AttackIntensity, TimelineEvent } from '../types/attack';
import type { IAttackController } from './contracts';

export const getLabTargetIp = (): string => {
  return import.meta.env.VITE_LAB_TARGET_HOST || import.meta.env.VITE_NIDS_HOST || '10.64.157.145';
};

export const getLabAttackerIp = (): string => {
  return import.meta.env.VITE_ATTACKER_HOST || '10.64.157.140';
};

export const getLabSensorIp = (): string => {
  return import.meta.env.VITE_NIDS_HOST || '10.64.157.145';
};

export const LAB_TARGET_IP = getLabTargetIp();
export const LAB_TARGET_HOSTNAME = `LAB-VICTIM (${LAB_TARGET_IP})`;
export const LAB_ATTACKER_IP = getLabAttackerIp();
export const LAB_SENSOR_IP = getLabSensorIp();

// Controlled private lab cluster sources for DDoS demonstration
export const LAB_DDOS_SOURCES = [
  `${LAB_ATTACKER_IP} (PC1 Attacker)`,
  `${LAB_ATTACKER_IP}.1 (Lab Bot 01)`,
  `${LAB_ATTACKER_IP}.2 (Lab Bot 02)`,
  `${LAB_ATTACKER_IP}.3 (Lab Bot 03)`
];

export const PREDEFINED_SCENARIOS: AttackScenario[] = [
  // 1. RECONNAISSANCE
  {
    id: 'PORT_SCAN',
    name: 'SYN Stealth & Multi-Port Recon Scan',
    category: 'Reconnaissance',
    description: 'Simulate reconnaissance traffic against the isolated lab target by cycling through common service ports with abnormal SYN flags.',
    commandSimulated: `nmap -sS -p 21,22,23,25,80,443,3306,8080 -T4 ${LAB_TARGET_IP}`,
    protocol: 'TCP',
    sourceIp: LAB_ATTACKER_IP,
    sourceType: 'Single Node',
    targetIp: LAB_TARGET_IP,
    targetHostname: LAB_TARGET_HOSTNAME,
    targetPort: '21-8080 (Multi)',
    expectedClass: 'Port Scan',
    expectedSeverity: 'HIGH',
    estimatedDurationSec: 15,
    availableIntensities: ['LOW', 'MEDIUM', 'HIGH'],
    currentIntensity: 'MEDIUM',
    rateLimit: 'Max 1,000 pkts/s (Lab bounded)',
    safetySafeguards: [
      `Restricted to private lab target ${LAB_TARGET_IP} only`,
      'Automatic test timeout after 15s',
      'Zero payload SYN packets only'
    ],
    parameters: [
      { label: 'Scan Type', value: 'TCP SYN Half-Open' },
      { label: 'Port Range', value: '1-1024 + Top 100' },
      { label: 'Timing Template', value: 'T4 (Aggressive)' },
      { label: 'Target Scope', value: `Authorized Lab Target (${LAB_TARGET_IP})` },
    ],
    indicators: [
      'Rapid SYN packet bursts with zero payload',
      'High unique destination port ratio (>50 ports/sec)',
      'Extremely low flow duration per connection (<15ms)',
      'Unanswered SYN requests triggering TCP reset (RST)',
    ]
  },

  // 2. CREDENTIAL ATTACKS
  {
    id: 'BRUTE_FORCE',
    name: 'SSH / HTTP Auth Credential Brute Force',
    category: 'Credential Attacks',
    description: 'Simulate repeated automated authentication attempts against designated lab services (SSH port 22 / Web Admin 8080).',
    commandSimulated: `hydra -l admin -P lab_passwords.txt ssh://${LAB_TARGET_IP} -t 4`,
    protocol: 'TCP',
    sourceIp: LAB_ATTACKER_IP,
    sourceType: 'Single Node',
    targetIp: LAB_TARGET_IP,
    targetHostname: LAB_TARGET_HOSTNAME,
    targetPort: 22,
    expectedClass: 'Brute Force',
    expectedSeverity: 'HIGH',
    estimatedDurationSec: 18,
    availableIntensities: ['LOW', 'MEDIUM', 'HIGH'],
    currentIntensity: 'MEDIUM',
    rateLimit: '4 concurrent threads max',
    safetySafeguards: [
      'Bounded wordlist attempts (64 attempts max)',
      'Simulated non-destructive authentication stream',
      'Auto-abort on socket churn'
    ],
    parameters: [
      { label: 'Target Service', value: 'OpenSSH 8.9p1' },
      { label: 'Concurrent Threads', value: '4 parallel streams' },
      { label: 'Payload Size', value: 'Consistent 84-128 bytes' },
      { label: 'Inter-Arrival Time', value: 'Fixed 120ms periodicity' },
    ],
    indicators: [
      'High failed handshake & connection reset frequency',
      'Constant packet length variance near zero',
      'Persistent TCP connection churn on port 22',
      'Deviation from human interactive SSH keystroke cadence',
    ]
  },

  // 3. NETWORK AVAILABILITY - DoS
  {
    id: 'DOS_SYN_FLOOD',
    name: 'Single-Source TCP SYN Availability Flood (DoS)',
    category: 'Network Availability',
    description: 'Generate controlled single-source high-volume SYN traffic against the lab target to demonstrate Denial of Service detection metrics.',
    commandSimulated: `hping3 -S --flood -V -p 80 ${LAB_TARGET_IP}`,
    protocol: 'TCP',
    sourceIp: LAB_ATTACKER_IP,
    sourceType: 'Single Node',
    targetIp: LAB_TARGET_IP,
    targetHostname: LAB_TARGET_HOSTNAME,
    targetPort: 80,
    expectedClass: 'DoS',
    expectedSeverity: 'CRITICAL',
    estimatedDurationSec: 20,
    availableIntensities: ['LOW', 'MEDIUM', 'HIGH'],
    currentIntensity: 'MEDIUM',
    rateLimit: 'Preset: Low (25k pps), Med (55k pps), High (85k pps)',
    safetySafeguards: [
      `Restricted to private lab destination ${LAB_TARGET_IP}`,
      'Internally bounded duration (20s hard cutoff)',
      'Strictly non-amplified single socket stream'
    ],
    parameters: [
      { label: 'Flood Mechanism', value: 'TCP SYN Flooding (Port 80)' },
      { label: 'Packet Rate Preset', value: 'Controlled ~55,000 pkts/s' },
      { label: 'Window Size', value: 'Fixed 64240 bytes' },
      { label: 'Source Socket', value: `Single Host (${LAB_ATTACKER_IP})` },
    ],
    indicators: [
      'Overwhelming packet rate surge (10x baseline)',
      'Near 100% SYN flag ratio with 0% ACK completion',
      'Extreme flow bytes/sec asymmetry (Fwd >> Bwd)',
      'Single source address concentration',
    ]
  },

  // 3. NETWORK AVAILABILITY - DDoS (Controlled multi-source demonstration)
  {
    id: 'DDOS_DISTRIBUTED_FLOOD',
    name: 'Distributed Multi-Source Volumetric Flood (DDoS)',
    category: 'Network Availability',
    description: 'Demonstrate distributed multi-source availability attack behavior using controlled private lab bot agents targeting the common victim server.',
    commandSimulated: `python3 lab_ddos_controller.py --nodes 4 --target ${LAB_TARGET_IP} --rate 60000`,
    protocol: 'Mixed',
    sourceIp: `${LAB_ATTACKER_IP} - .13 (Multi-Source Cluster)`,
    sourceType: 'Multi-Source Lab Botnet (Simulated)',
    sourceNodes: LAB_DDOS_SOURCES,
    targetIp: LAB_TARGET_IP,
    targetHostname: LAB_TARGET_HOSTNAME,
    targetPort: '80 / 443 / 53',
    expectedClass: 'DDoS',
    expectedSeverity: 'CRITICAL',
    estimatedDurationSec: 22,
    availableIntensities: ['LOW', 'MEDIUM', 'HIGH'],
    currentIntensity: 'MEDIUM',
    rateLimit: 'Preset: Low (30k pps), Med (65k pps), High (95k pps)',
    safetySafeguards: [
      'Bounded to 4 preconfigured private lab source nodes',
      `Strictly private lab target (${LAB_TARGET_IP})`,
      'Automatic 22s maximum runtime timer',
      'Safe demonstration parameters with rate ceiling'
    ],
    parameters: [
      { label: 'Bot Cluster Scope', value: `4 Private Lab Nodes (${LAB_ATTACKER_IP}, .1, .2, .3)` },
      { label: 'Attack Vector', value: 'SYN + UDP Mixed Flood Stream' },
      { label: 'Source Entropy', value: 'High Distributed Entropy' },
      { label: 'Aggregated Throughput', value: 'Controlled 45-65 MB/s' },
    ],
    indicators: [
      `Multi-source concurrent transmission converging on ${LAB_TARGET_IP}`,
      'High source IP entropy combined with low destination entropy',
      'Severe packet inter-arrival time compression across subnets',
      'Simultaneous TCP connection backlog and UDP socket pressure',
    ]
  },

  // 3. NETWORK AVAILABILITY - Volumetric Traffic Flood
  {
    id: 'VOLUMETRIC_TRAFFIC_FLOOD',
    name: 'UDP / ICMP Volumetric Bandwidth Flood',
    category: 'Network Availability',
    description: 'Generate high-volume stateless UDP/ICMP datagram traffic to evaluate AI volumetric anomaly detection capabilities.',
    commandSimulated: `nping --udp --rate 40000 --data-length 1400 -p 5001 ${LAB_TARGET_IP}`,
    protocol: 'UDP',
    sourceIp: LAB_ATTACKER_IP,
    sourceType: 'Single Node',
    targetIp: LAB_TARGET_IP,
    targetHostname: LAB_TARGET_HOSTNAME,
    targetPort: 5001,
    expectedClass: 'Traffic Flood',
    expectedSeverity: 'HIGH',
    estimatedDurationSec: 16,
    availableIntensities: ['LOW', 'MEDIUM', 'HIGH'],
    currentIntensity: 'MEDIUM',
    rateLimit: 'Max 40,000 pkts/s (Lab bounded)',
    safetySafeguards: [
      `Private target ${LAB_TARGET_IP} only`,
      'Fixed datagram buffer size (1400 bytes)',
      'Strict 16s timeout cutoff'
    ],
    parameters: [
      { label: 'Transport', value: 'UDP Datagram Stream' },
      { label: 'Payload Size', value: '1400 Bytes / Packet' },
      { label: 'Target Port', value: 'UDP 5001' },
      { label: 'Bandwidth Rate', value: 'Controlled ~40 MB/s' },
    ],
    indicators: [
      'Extreme flow bytes/sec surge with 0% bidirectional handshake',
      'High packet length mean (1400 bytes) with zero variance',
      'ICMP Port Unreachable error rate escalation',
      'Bandwidth saturation signature',
    ]
  },

  // 4. PROTOCOL / BEHAVIOR ANOMALIES - DNS
  {
    id: 'DNS_ANOMALY',
    name: 'DNS Tunneling & High-Entropy Query Surge',
    category: 'Protocol / Behavior Anomalies',
    description: 'Generate abnormal DNS request behavior with high-entropy subdomains and unusual TXT record query frequencies.',
    commandSimulated: `python3 lab_dns_tunnel.py --target ${LAB_TARGET_IP} --queries 500`,
    protocol: 'DNS',
    sourceIp: LAB_ATTACKER_IP,
    sourceType: 'Single Node',
    targetIp: LAB_TARGET_IP,
    targetHostname: LAB_TARGET_HOSTNAME,
    targetPort: 53,
    expectedClass: 'DNS Anomaly',
    expectedSeverity: 'MEDIUM',
    estimatedDurationSec: 16,
    availableIntensities: ['LOW', 'MEDIUM', 'HIGH'],
    currentIntensity: 'MEDIUM',
    rateLimit: 'Max 45 queries/sec',
    safetySafeguards: [
      `Restricted to internal lab DNS stub (${LAB_TARGET_IP}:53)`,
      'Synthetic high-entropy labels (no real data exfiltration)',
      'Automatic completion after 500 queries'
    ],
    parameters: [
      { label: 'Query Type', value: 'High-Entropy Subdomain TXT' },
      { label: 'Request Frequency', value: '45 queries/sec' },
      { label: 'Entropy Score', value: '4.85 / 5.0 Shannon Entropy' },
      { label: 'Transport', value: 'UDP Port 53' },
    ],
    indicators: [
      'Unusually long domain labels (>45 characters)',
      'High Shannon entropy in DNS query strings',
      'Elevated NXDOMAIN response rates',
      'Persistent bidirectional UDP flow size anomaly',
    ]
  },

  // 4. PROTOCOL / BEHAVIOR ANOMALIES - Suspicious Flow
  {
    id: 'SUSPICIOUS_FLOW',
    name: 'Evasive Asymmetric Flow / Low-and-Slow Beacon',
    category: 'Protocol / Behavior Anomalies',
    description: 'Generate anomalous network-flow behavior featuring periodic low-and-slow beaconing and non-standard packet sizes.',
    commandSimulated: `python3 c2_beacon_sim.py --dest ${LAB_TARGET_IP} --jitter 5%`,
    protocol: 'TCP',
    sourceIp: LAB_ATTACKER_IP,
    sourceType: 'Single Node',
    targetIp: LAB_TARGET_IP,
    targetHostname: LAB_TARGET_HOSTNAME,
    targetPort: 8443,
    expectedClass: 'Suspicious Flow',
    expectedSeverity: 'MEDIUM',
    estimatedDurationSec: 15,
    availableIntensities: ['LOW', 'MEDIUM', 'HIGH'],
    currentIntensity: 'LOW',
    rateLimit: 'Low-throughput periodic (1 pkt / 2.5s)',
    safetySafeguards: [
      'Strict lab target restriction',
      'Non-malicious simulated heartbeat telemetry',
      'Auto-terminate after 15s session'
    ],
    parameters: [
      { label: 'Beacon Interval', value: '2500ms ± 5% jitter' },
      { label: 'Payload Header', value: 'Custom obfuscated header' },
      { label: 'Protocol Anomaly', value: 'Non-standard TLS record format' },
      { label: 'Port', value: 'TCP 8443 (Alt HTTPS)' },
    ],
    indicators: [
      'Extremely regular flow inter-arrival time (low std dev)',
      'TLS handshake anomalies without standard SNI',
      'Long-lived low-throughput session',
      'Isolation Forest anomaly score exceeds threshold',
    ]
  }
];

/**
 * Remote Attack Controller
 * Communicates with FastAPI on PC 2 (or PC 1 agent) to safely launch authorized lab scenarios.
 */
export class RemoteAttackController implements IAttackController {
  private activeScenario: AttackTypeId | null = null;

  public get baseUrl(): string {
    const host = import.meta.env.VITE_NIDS_HOST || '10.64.157.145';
    const port = import.meta.env.VITE_NIDS_PORT || '8000';
    return `http://${host}:${port}/api/lab`;
  }

  public getAvailableScenarios(): AttackScenario[] {
    return PREDEFINED_SCENARIOS;
  }

  public getScenario(id: AttackTypeId): AttackScenario | undefined {
    return PREDEFINED_SCENARIOS.find(s => s.id === id);
  }

  public async startAttack(id: AttackTypeId, intensity: AttackIntensity = 'MEDIUM', onTimelineEvent?: (event: TimelineEvent) => void): Promise<{ success: boolean; message: string }> {
    try {
      const targetIp = getLabTargetIp();
      const sourceIp = getLabAttackerIp();
      const res = await fetch(`${this.baseUrl}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: id,
          intensity,
          source_ip: sourceIp,
          sourceIp: sourceIp,
          controller_ip: sourceIp,
          target_ip: targetIp,
          targetIp // strictly locked private lab target
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      this.activeScenario = id;
      return { success: true, message: data.message || `Scenario ${id} (${intensity}) started from ${sourceIp} against ${targetIp}` };
    } catch (e: any) {
      console.error('[RemoteAttackController] Failed to dispatch start attack:', e);
      return { success: false, message: e.message || 'Failed to communicate with NIDS backend' };
    }
  }

  public async stopAttack(): Promise<{ success: boolean; message?: string }> {
    try {
      const targetIp = getLabTargetIp();
      const sourceIp = getLabAttackerIp();
      const res = await fetch(`${this.baseUrl}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          scenario: this.activeScenario,
          source_ip: sourceIp,
          sourceIp: sourceIp,
          controller_ip: sourceIp,
          target_ip: targetIp,
          targetIp: targetIp
        })
      });
      this.activeScenario = null;
      return { success: res.ok };
    } catch (e: any) {
      this.activeScenario = null;
      return { success: false, message: e.message };
    }
  }

  public isAttackActive(): boolean {
    return this.activeScenario !== null;
  }

  public getActiveScenarioId(): AttackTypeId | null {
    return this.activeScenario;
  }
}

/**
 * Mock Attack Controller for standalone demo mode
 */
export class MockAttackController implements IAttackController {
  private activeScenario: AttackTypeId | null = null;

  public getAvailableScenarios(): AttackScenario[] {
    return PREDEFINED_SCENARIOS;
  }

  public getScenario(id: AttackTypeId): AttackScenario | undefined {
    return PREDEFINED_SCENARIOS.find(s => s.id === id);
  }

  public async startAttack(id: AttackTypeId, intensity: AttackIntensity = 'MEDIUM', onTimelineEvent?: (event: TimelineEvent) => void): Promise<{ success: boolean; message: string }> {
    this.activeScenario = id;
    return { success: true, message: `Mock test ${id} (${intensity}) initialized` };
  }

  public async stopAttack(): Promise<{ success: boolean }> {
    this.activeScenario = null;
    return { success: true };
  }

  public isAttackActive(): boolean {
    return this.activeScenario !== null;
  }

  public getActiveScenarioId(): AttackTypeId | null {
    return this.activeScenario;
  }
}

export const remoteAttackController = new RemoteAttackController();
export const mockAttackController = new MockAttackController();
