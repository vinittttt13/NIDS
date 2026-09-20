# AI-NIDS: LAN Two-PC Deployment & Real-Time Networking Layer

The **AI-NIDS** system has been upgraded with a complete isolated LAN networking and orchestration layer, enabling physical two-PC operation across `192.168.100.0/24`.

---

## 1. Physical Two-PC Hardware Architecture

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

---

## 2. Implemented Networking & Backend Layer

### A. FastAPI Backend (`backend/main.py`)
- Configured to bind to `0.0.0.0:8000` (allowing PC 1 to communicate with PC 2 via `http://192.168.100.30:8000`).
- **REST Endpoints**:
  - `GET /api/status`: Returns system, sensor (`SIMULATED`/`LIVE`), and AI engine (`DEMO`/`LIVE`) states.
  - `GET /api/lab/status`: Returns isolated lab target scope and attack state machine.
  - `POST /api/lab/start`: Safely executes predefined scenario against locked target `192.168.100.20`.
  - `POST /api/lab/stop`: Terminates ongoing scenario.
  - `GET /api/traffic`, `/api/threats`, `/api/model`, `/api/features`, `/api/network`.
- **WebSocket Streaming (`ws://192.168.100.30:8000/ws/live`)**:
  - Broadcasts `TELEMETRY`, `THREAT_DETECTED`, `ATTACK_STARTED`, `ATTACK_STOPPED`, `FEATURE_EXTRACTION`, `AI_INFERENCE`, `THREAT_RESOLVED`, `SYSTEM_STATUS`.

### B. LAN Host Binding & Environment Configuration
- `vite.config.ts`: Configured with `server: { host: '0.0.0.0', port: 5173 }`.
- `.env` and `.env.example`:
  ```env
  VITE_NIDS_HOST=192.168.100.30
  VITE_NIDS_PORT=8000
  VITE_NIDS_WS_PORT=8000
  VITE_ATTACKER_HOST=192.168.100.10
  VITE_MODE=demo
  VITE_CLIENT_ROLE=UNIFIED
  ```

### C. Client Role Views (`VITE_CLIENT_ROLE`)
- **`ATTACK_LAB` (PC 1 View)**: Displays Attack Lab controller, attack scenarios, lab topology, and C2 status.
- **`NIDS_SOC` (PC 2 View)**: Displays SOC Overview, Live Flow Monitor, Threat Feed, AI Engine, Network Topology, Reports, and Architecture.
- **`UNIFIED` (Dual Presentation View)**: Allows switching dynamically between perspectives during live demonstrations.

### D. Service Providers & Diagnostic Panel
- `LiveTelemetryProvider` & `RemoteAttackController`: Decoupled contracts with automatic WebSocket reconnect, REST fallback, and real-time event subscriptions.
- **Diagnostics Panel in Settings**:
  - PC 1 IP: `192.168.100.10`
  - PC 2 IP: `192.168.100.30`
  - FastAPI Reachability & Latency Check
  - WebSocket Connection Check
  - `[ TEST CONNECTION ]` action button.
- **Sensor & AI Engine Indicators**:
  - `SENSOR MODE: LIVE` / `SIMULATED`
  - `AI ENGINE: LIVE` / `DEMO`

---

## 3. Verification & Build Confirmation

- `npm run build`: Production bundle compiled cleanly (`✓ built in 13.63s`).
- FastAPI server and WebSocket channels verified with full CORS and JSON schemas.
- Complete setup documentation and firewall rules documented in [README.md](file:///c:/Users/Salman/Downloads/AI_NIDS/README.md).
