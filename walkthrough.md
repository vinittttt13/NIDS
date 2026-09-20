# AI-NIDS: AI-Based Real-Time Network Intrusion Detection & Controlled Attack Simulation Platform

A cybersecurity platform and presentation-ready Security Operations Center (SOC) demonstrating:

**CONTROLLED ATTACK (PC 1) → REAL NETWORK TRAFFIC → PORT MIRROR SENSOR → FEATURE EXTRACTION → AI/ML ENGINE (PC 2) → RISK ASSESSMENT → REAL-TIME ALERT → SOC DASHBOARD**

---

## 1. Physical Two-PC Isolated Lab Architecture

```text
                         ISOLATED CYBER LAB (192.168.100.0/24)
                                          │
                 ┌────────────────────────┴────────────────────────┐
                 │                                                 │
                 ▼                                                 ▼
        ┌──────────────────┐                              ┌────────────────────┐
        │     PC 1         │                              │       PC 2         │
        │                  │                              │                    │
        │   ATTACK LAB     │                              │      AI-NIDS       │
        │                  │                              │                    │
        │ Attack Lab UI    │                              │ Zeek Sensor        │
        │ Attack Controller│                              │ Suricata Engine    │
        │ Kali/Test VM     │                              │ 78-Feature Pipeline│
        │ 192.168.100.10   │                              │ XGBoost v1.4 Model │
        │                  │                              │ Risk Engine        │
        │                  │                              │ FastAPI & WebSockets│
        │                  │                              │ React SOC Dashboard│
        │                  │                              │ 192.168.100.30     │
        └────────┬─────────┘                              └─────────┬──────────┘
                 │                                                  │
                 └────────────────────────┬─────────────────────────┘
                                          │
                                   MANAGED SWITCH
                                   (Port Mirroring)
                                          │
                                          ▼
                                   NIDS SENSOR PORT (SPAN-08)
```

### Communication Paths Separation
1. **Path A (Real Network Traffic)**: Controlled test traffic flows from `192.168.100.10` to `192.168.100.20` (LAB-VICTIM). The managed switch mirrors traffic directly to `192.168.100.30` (AI-NIDS).
2. **Path B (Application C2)**: Attack Lab UI orchestrates tests via REST/WebSocket endpoints (`/api/lab/start`, `/api/lab/status`) completely independent of the mirrored sensor stream.

---

## 2. Core Capabilities & Pages Built

| Page | Features & Specifications |
|---|---|
| **SOC Overview** | 6 Live KPI cards (Packets/sec 12,481, Active Flows 1,284, Threats Detected, Critical Threats, AI Detection Rate 97.8%, Avg Latency 184ms), interactive multi-range traffic stream chart (1M, 5M, 15M, 1H), Protocol breakdown, and live threat feed table. |
| **Live Monitor** | Deep flow monitoring, active TCP/UDP/DNS connections with live AI classification tags, throughput rates, and top talker / target matrices. |
| **Live Threat Feed** | Real-time incident center with instant investigation modal, risk scoring (0-100), and resolution workflows. |
| **AI Detection Engine** | Complete model specs (XGBoost v1.4 + Isolation Forest), Benchmark validation grid (Accuracy 97.8%, Precision 96.9%, Recall 97.2%, F1 97.0%, FPR 0.8%, Latency 14ms), dominant real-time inference inspection card, animated class probability bars (Benign, Port Scan, DoS, Brute Force, Other), 6-stage feature processing pipeline visualizer, and 41 vs 78 feature schema tables with SHAP feature importance. |
| **Attack Lab (PC 1)** | 🔒 **ISOLATED CYBER RANGE** badge, locked target (`192.168.100.20 LAB-VICTIM`), animated physical topology diagram with packet flow, 5 authorized test cards (SYN Port Scan, SSH/HTTP Brute Force, DoS SYN Flood, DNS Tunneling Anomaly, Evasive Flow), and live 8-stage detection timeline with ms precision. |
| **Network Topology** | Interactive visual graph with Cisco SG350 switch, SPAN mirror port, Gateway, and live host telemetry inspector. |
| **Reports & Analytics** | Executive security report generator with printable view and IOC JSON exporter. |
| **2-PC Architecture** | Deep architectural breakdown of hardware, decoupled C2 vs sensor data paths, and full technology stack (React 19, TypeScript, Tailwind, FastAPI, Python, Zeek, Suricata, XGBoost, scikit-learn, PostgreSQL, WebSockets, Docker). |
| **Lab Settings** | IP scope configuration, XGBoost confidence threshold sliders, Isolation Forest sensitivity controls, and audio alarm toggles. |

---

## 3. Explainable AI (XAI) Attribution Example

When a threat is selected, the deep investigation modal reveals **"Why Was This Flagged?"**:

```text
✓ SYN Packet Ratio               Baseline: 4.2%       → Observed: 99.1%      (+38% Weight)
✓ Packets / Second               Baseline: 12,480     → Observed: 88,400     (+28% Weight)
✓ Flow Duration Mean             Baseline: 4.2s       → Observed: 12ms       (+18% Weight)
✓ ACK Flag Absence               Baseline: 94% ACK    → Observed: 0.2% ACK   (+16% Weight)
```

---

## 4. Verification Results

- **Production Build (`npm run build`)**: Compiled cleanly with zero errors (`✓ built in 15.54s`, bundle size ~393 KB JS / 33 KB CSS).
- **HTTP Server**: Local development server verified serving `http://127.0.0.1:5173` with status **200 OK**.
- **Dynamic Scenario Correlated Engine**: Verified all 5 attack scenarios trigger logically correlated packet surges, XGBoost probabilities, and risk score adjustments.
