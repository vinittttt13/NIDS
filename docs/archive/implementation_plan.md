# Implementation Plan: AI-NIDS (AI-Based Real-Time Network Intrusion Detection System & Attack Lab)

Build a complete, premium, presentation-ready cybersecurity platform demonstrating the end-to-end workflow:
**CONTROLLED ATTACK (PC 1) → ISOLATED NETWORK TRAFFIC → PORT MIRROR SENSOR → FEATURE EXTRACTION → AI/ML ENGINE (PC 2) → RISK ASSESSMENT → REAL-TIME ALERT → SOC DASHBOARD**

---

## 1. Architectural & Visual Design Overview

### Two-PC Physical Lab Concept
- **PC 1 (Attack Lab - `192.168.100.10`)**: Controlled Attack Controller, safe predetermined attack scenarios against `192.168.100.20` (LAB-VICTIM).
- **Network Layer (`192.168.100.0/24`)**: Managed Switch with Port Mirroring sending full traffic stream to NIDS sensor.
- **PC 2 (AI-NIDS Sensor & SOC - `192.168.100.30`)**: Zeek/Suricata sensor emulation, flow processing, 41/78 feature extraction pipeline, XGBoost + Isolation Forest AI inference engine, Risk assessment, and real-time React SOC Dashboard.

### Aesthetic & UI System
- Professional SOC Dark Theme (charcoal/near-black `#080c14`, deep slate `#0f172a`, card surfaces `#131c2e`, crisp borders `#1e293b`).
- Primary Accents: Electric Blue (`#3b82f6`) & Cyan (`#06b6d4`).
- Security Severity Color Matrix:
  - **Normal / Benign**: Emerald Green (`#10b981`)
  - **Informational**: Sky Blue (`#0ea5e9`)
  - **Suspicious / Medium Risk**: Amber / Yellow (`#f59e0b`)
  - **High Risk**: Deep Orange (`#f97316`)
  - **Critical Threat**: Crimson Red (`#ef4444`)
- High information density, restrained micro-animations, real-time SVG/Canvas animated topology graphs, interactive charts, and responsive layout.

---

## 2. Proposed Module & File Structure

```text
AI_NIDS/
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   ├── attack.ts        # Attack scenario, execution status, attack types
    │   ├── telemetry.ts     # Traffic packets/sec, flows, bandwidth, latency
    │   ├── threat.ts        # Threat alert, severity, XAI explanation factors
    │   ├── ai.ts            # AI model metrics, class probabilities, features (41/78 schema)
    │   └── network.ts       # Network topology nodes, links, switch & mirror ports
    ├── services/
    │   ├── contracts.ts     # TelemetryProvider & AttackController interfaces
    │   ├── mockTelemetry.ts # Realistic, correlated dynamic traffic/attack simulation engine
    │   ├── liveTelemetry.ts # WebSocket/REST adapter for physical 2-PC connection
    │   └── attackService.ts # Attack orchestration & state management
    ├── context/
    │   └── NidsContext.tsx  # Central state management (Live/Demo mode, active attacks, alerts, metrics)
    ├── components/
    │   ├── layout/
    │   │   ├── Topbar.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── SystemStatusBadge.tsx
    │   │   └── ActiveAttackBanner.tsx
    │   ├── common/
    │   │   ├── MetricCard.tsx
    │   │   ├── ThreatBadge.tsx
    │   │   ├── RiskGauge.tsx
    │   │   ├── ToastAlerts.tsx
    │   │   └── Modal.tsx
    │   ├── soc/
    │   │   ├── LiveTrafficChart.tsx
    │   │   ├── ThreatTable.tsx
    │   │   ├── ThreatDetailModal.tsx
    │   │   ├── ProtocolPieChart.tsx
    │   │   ├── TopTalkersTable.tsx
    │   │   └── ActiveConnectionsTable.tsx
    │   ├── ai/
    │   │   ├── ModelHealthCard.tsx
    │   │   ├── ModelMetricsGrid.tsx
    │   │   ├── RealtimeInferenceCard.tsx
    │   │   ├── ClassProbabilityBars.tsx
    │   │   ├── PipelineVisualizer.tsx
    │   │   ├── FeatureImportanceChart.tsx
    │   │   ├── FeatureTable.tsx
    │   │   └── SchemaToggle.tsx
    │   ├── attack/
    │   │   ├── AttackCard.tsx
    │   │   ├── AttackTopologyDiagram.tsx
    │   │   ├── AttackExecutionTimeline.tsx
    │   │   └── ScenarioSelector.tsx
    │   ├── network/
    │   │   ├── InteractiveTopology.tsx
    │   │   ├── HostDetailPanel.tsx
    │   │   └── PortMirrorStatus.tsx
    │   └── architecture/
    │       ├── PhysicalLabDiagram.tsx
    │       ├── DataPipelineDiagram.tsx
    │       └── TechStackGrid.tsx
    └── pages/
        ├── OverviewPage.tsx      # SOC Summary & dynamic KPIs
        ├── LiveMonitorPage.tsx   # Deep flow monitoring & protocols
        ├── ThreatsPage.tsx       # Real-time threat feed & deep inspection
        ├── AiEnginePage.tsx      # Model metrics, real-time inference & 78-feature pipeline
        ├── AttackLabPage.tsx     # Controlled attack triggers & live 2-PC simulation
        ├── NetworkPage.tsx       # Interactive network map & switch topology
        ├── ReportsPage.tsx       # Exportable security & AI performance reports
        ├── ArchitecturePage.tsx  # Detailed 2-PC isolated lab architecture specs
        └── SettingsPage.tsx      # Lab IPs, AI thresholds, data mode toggles
```

---

## 3. Core Feature Specifications

### A. Realistic Correlated Simulation Engine
When a controlled attack is started (e.g. from Attack Lab or Demo Mode):
1. **Port Scan**: Connection attempts surge from `192.168.100.10` to `192.168.100.20`, unique destination ports rise (21, 22, 80, 443, 3306, 8080), SYN count spikes to 88%, flow duration is short (<20ms), AI pipeline triggers: Feature Extraction (78 features) -> XGBoost inference (14ms) -> Prediction: **Port Scan (96.8%)** -> Anomaly Score: **0.91** -> Risk Score: **94** -> Alert generated within **438ms**.
2. **Brute Force (SSH/HTTP)**: High packet frequency on port 22/80, failed payload sizes, RST flag increase, AI Prediction: **Brute Force (95.4%)**, Risk Score: **86**.
3. **DoS Flood (SYN/UDP)**: Traffic surges from 12k pps to 85k pps, bandwidth saturates, flow buffer grows, AI Prediction: **DoS Flood (98.9%)**, Risk Score: **98**.
4. **DNS Anomaly**: High volume of abnormal TXT/NXDOMAIN queries, Anomaly Score: **0.87**, AI Prediction: **DNS Tunneling / Anomaly (91.2%)**, Risk Score: **79**.
5. **Suspicious Flow**: Abnormal packet inter-arrival time (IAT) variance, AI Prediction: **Suspicious Flow (88.5%)**, Risk Score: **72**.

### B. Explainable AI (XAI) Inspection
For every detected threat, provide a "Why Was This Flagged?" factor attribution breakdown:
- Primary contributing features with exact variance against baseline
- XGBoost SHAP-like feature weights
- Sensor extraction timestamp breakdown (Capture -> Flow Assembly -> Feature Computation -> ML Inference -> Alert Delivery)

### C. Two-PC Presentation & Screen Mode
- Toggle to view the dashboard in full SOC mode, or switch between PC 1 (Attack Controller) and PC 2 (AI-NIDS) perspective overlays.

---

## 4. Verification Plan

### Automated Checks
- `npm run build`: Full TypeScript check and asset bundling verification.

### Manual / Browser Verification
- Launch local development server (`npm run dev`) and test with browser subagent.
- Verify all 9 navigation tabs and responsive views.
- Test starting every attack scenario in Attack Lab and validating the real-time timeline, live chart spike, AI inference probability bar animation, and dynamic threat table entry.
- Test Explainable AI drawer inspection on generated threats.
- Test Report generation and CSV/JSON export actions.
