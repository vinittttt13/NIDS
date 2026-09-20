# AI-NIDS: AI-Based Real-Time Network Intrusion Detection & Controlled Attack Simulation Platform

A cybersecurity platform and presentation-ready Security Operations Center (SOC) designed to operate either on **one PC (for development/demo)** or across **two separate physical PCs over Ethernet or Wi-Fi**.

---

## 1. System Architecture

```text
                     ISOLATED CYBER RANGE / PRIVATE LAB
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                                               │
              ▼                                               ▼
     ┌──────────────────┐                            ┌────────────────────┐
     │     PC 1         │                            │       PC 2         │
     │                  │                            │                    │
     │   ATTACK LAB     │                            │   AI-NIDS / SOC    │
     │                  │                            │                    │
     │ Attack Lab UI    │                            │ Network Sensor     │
     │ Attack Scenarios │                            │ Zeek / Suricata    │
     │ Preset Intensity │     Ethernet OR Wi-Fi      │ Feature Pipeline   │
     │ Lab Telemetry    ├───────────────────────────►│ XGBoost v1.4 Engine│
     │ Rate Ceilings    │                            │ Risk Engine        │
     │ Role: ATTACK_LAB │                            │ FastAPI & WSS Feed │
     │                  │                            │ React SOC Console  │
     │                  │                            │ Role: NIDS_SOC     │
     └──────────────────┘                            └────────────────────┘
```

> [!IMPORTANT]
> **Safety & Authorization**: All attack functionality is strictly restricted to private authorized lab targets (`LAB_TARGET_HOST=192.168.100.20`). The platform enforces rate ceilings, bounded time durations, and preset intensity levels (LOW / MEDIUM / HIGH). Arbitrary public IP targeting is strictly prevented.

---

## 2. Four Deployment Stages

The platform is engineered to support progression through four deployment stages without requiring code changes:

### STAGE 1 — One-PC Local Demonstration
- **Configuration**: `VITE_CLIENT_ROLE=UNIFIED`, `VITE_MODE=DEMO` (or `HYBRID`).
- **Description**: Single-machine development and presentation with real-time UI telemetry and demo ML inference.
- **Run**:
  ```bash
  npm run dev
  ```

### STAGE 2 — Two PCs over Wi-Fi
- **Configuration**: PC 1 and PC 2 connected to the same private Wi-Fi access point / router.
- **PC 2 (NIDS / SOC Host)**: Runs FastAPI (`0.0.0.0:8000`) and Vite (`0.0.0.0:5173`).
- **PC 1 (Attack Lab)**: Navigates to `http://<PC2_WIFI_IP>:5173` with `VITE_CLIENT_ROLE=ATTACK_LAB`.
- **Active Transport**: Auto-detected as **WI-FI**.

### STAGE 3 — Two PCs over Ethernet
- **Configuration**: PC 1 and PC 2 connected via direct Ethernet cable or Gigabit switch.
- **PC 2 (NIDS / SOC Host)**: `192.168.100.30:8000`.
- **PC 1 (Attack Lab)**: `192.168.100.10`.
- **Active Transport**: Auto-detected as **ETHERNET**.

### STAGE 4 — Full Physical Sensor Deployment (SPAN Mirroring)
- **Configuration**: Managed Switch with SPAN / Port Mirroring.
- **Physical Flow**: PC 1 traffic → Switch Port 1 → Mirrored to Switch SPAN Port 8 → PC 2 Promiscuous Sensor NIC.
- **Engine**: Zeek / Suricata daemon captures raw frames → 78-feature statistical extractor → XGBoost Classifier → Real-time WebSocket SOC Alert.

---

## 3. Controlled Attack Scenarios

Attacks are categorized into distinct operational vectors:

| Category | Attack Scenario | Focus & Signature Observed | Expected AI Output |
|---|---|---|---|
| **Reconnaissance** | `PORT_SCAN` | Multi-port probing, rapid inter-arrival, destination port entropy spike | `Port Scan` |
| **Credential Attacks** | `BRUTE_FORCE` | High failed auth frequency, rapid session tear-down (SSH / HTTP) | `Brute Force` |
| **Network Availability** | `DOS_SYN_FLOOD` | Single-source SYN flood, 99% SYN ratio, zero ACK completion | `DoS SYN Flood` |
| **Network Availability** | `DDOS_DISTRIBUTED_FLOOD` | 4-node cluster synchronization (`.10`–`.13`), high Source IP entropy (`4.82`) | `DDoS Distributed Flood` |
| **Network Availability** | `VOLUMETRIC_TRAFFIC_FLOOD` | High UDP / ICMP bandwidth consumption (80+ MB/s), large payload sizes | `Volumetric Traffic Flood` |
| **Protocol Anomalies** | `DNS_ANOMALY` | DNS tunneling, high TXT record ratio, high subdomain character entropy | `DNS Anomaly` |
| **Protocol Anomalies** | `SUSPICIOUS_FLOW` | Non-standard port beaconing (Port 31337), heavy byte asymmetry | `Suspicious Lateral Flow` |

---

## 4. DDoS vs DoS Detection Logic

The AI-NIDS differentiates single-source DoS from distributed DDoS through **feature extraction**:
- **DoS (Single Source)**: Single IP source (`192.168.100.10`), low Source IP Entropy (`0.14`), high SYN ratio (`99.1%`).
- **DDoS (Distributed Cluster)**: Multi-source cluster (`192.168.100.10`, `.11`, `.12`, `.13`), high Source IP Entropy (`4.82`), synchronized burst symmetry, aggregate throughput >140,000 pkts/s. Risk score evaluates to **99 / 100 CRITICAL**.

---

## 5. Network Configuration & Environment Variables

Create or edit `.env` in the root directory:

```env
# PC 2 (AI-NIDS Backend & SOC Host)
VITE_NIDS_HOST=192.168.100.30
VITE_NIDS_PORT=8000
VITE_NIDS_WS_PORT=8000

# PC 1 (Attack Lab Machine)
VITE_ATTACKER_HOST=192.168.100.10

# Safe Laboratory Target
LAB_TARGET_HOST=192.168.100.20
LAB_SUBNET=192.168.100.0/24

# Operation Mode: DEMO | HYBRID | LIVE
VITE_MODE=DEMO

# Client Role: ATTACK_LAB | NIDS_SOC | UNIFIED
VITE_CLIENT_ROLE=UNIFIED

# Network Transport Preference: AUTO | ETHERNET | WI-FI
VITE_TRANSPORT_MODE=AUTO

# Server Bindings
NIDS_BIND_HOST=0.0.0.0
NIDS_API_PORT=8000
VITE_HOST=0.0.0.0
VITE_PORT=5173
```

---

## 6. Firewall & Port Requirements

Configure the local firewall on **PC 2** to permit inbound traffic on the private subnet:

| Port | Protocol | Service | Description |
|---|---|---|---|
| **5173** | TCP | Vite Frontend Server | Web UI access for PC 1 and PC 2 |
| **8000** | TCP | FastAPI REST & WebSocket | `/api/*` REST endpoints and `/ws/live` stream |
| **Promiscuous** | Ethernet | Network TAP / SPAN Port | Raw frame capture for Zeek / Suricata |

---

## 7. Startup Instructions

### 1. Start FastAPI Backend (PC 2)
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*Listens on `0.0.0.0:8000` with CORS enabled for the private LAN.*

### 2. Start Vite Frontend (PC 2 or PC 1)
```bash
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

### 3. Open Browser
- **PC 2 (SOC)**: `http://localhost:5173` (or `http://<PC2_IP>:5173`)
- **PC 1 (Attack Lab)**: `http://<PC2_IP>:5173`

---

## 8. Honest UI Indicators

The application strictly adheres to honest operational reporting:
- **`SENSOR: LIVE`** vs **`SENSOR: SIMULATED`** / **`NOT CONFIGURED`**
- **`AI ENGINE: LIVE`** vs **`AI ENGINE: DEMO`**
- **`NETWORK: WI-FI`** vs **`NETWORK: ETHERNET`**
- **`MODE: DEMO`** vs **`MODE: HYBRID`** vs **`MODE: LIVE`**
