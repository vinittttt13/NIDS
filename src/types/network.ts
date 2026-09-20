import type { NetworkTransportMode, ActiveTransportType, NetworkInterfaceInfo } from './telemetry';

export interface LabHostNode {
  id: string;
  ip: string;
  hostname: string;
  mac: string;
  os: string;
  role: 'ATTACKER_PC' | 'VICTIM_SERVER' | 'SENSOR_NIDS' | 'ROUTER_GW' | 'LAB_WORKSTATION' | 'BOT_NODE';
  physicalPc: 'PC 1 (Attack Lab)' | 'PC 2 (AI-NIDS)' | 'Isolated Switch' | 'Lab VM' | 'Wi-Fi/Ethernet Host';
  status: 'ONLINE' | 'ACTIVE_ATTACKING' | 'UNDER_ATTACK' | 'MONITORING' | 'DDOS_SOURCE';
  packetsIn: number;
  packetsOut: number;
  threatCount: number;
  switchPort: string;
  transportType?: 'ETHERNET' | 'WI-FI';
  isMirrored?: boolean;
}

export interface SwitchPortConfig {
  portNumber: number;
  name: string;
  connectedDevice: string;
  status: 'UP' | 'DOWN';
  speed: string;
  isMirrorSource?: boolean;
  isMirrorDestination?: boolean;
}

export interface LabNetworkConfig {
  subnet: string;
  gateway: string;
  netmask: string;
  isolatedLab: boolean;
  transportMode: NetworkTransportMode;
  activeTransport: ActiveTransportType;
  portMirroringActive: boolean;
  mirrorSourcePort: string;
  mirrorDestPort: string;
  sensorInterface: string;
  detectedInterfaces: NetworkInterfaceInfo[];
}
