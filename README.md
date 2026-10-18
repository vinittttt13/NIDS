# AI-NIDS: Simulated Network Intrusion Detection & Controlled Attack-Lab SOC Dashboard

A presentation-ready Security Operations Center (SOC) dashboard and controlled attack-lab UI, designed to run either on **one laptop (demo mode)** or across **two physical PCs over Ethernet or Wi-Fi**.

> [!IMPORTANT]
> **What this project actually is**: a full SOC-dashboard UX and a scripted attack-simulation workflow. There is **no trained ML model and no real packet-capture sensor** anywhere in this repo — `DEMO`/`HYBRID` mode detections are pre-written payloads keyed by scenario name, not classifier output, and `LIVE` mode intentionally reports `NOT_CONFIGURED` because no real sensor is wired in. Every API response that could be mistaken for a live measurement (`/api/model`, `/api/sensor/status`, `/api/ai/status`) says so explicitly (`"simulated": true`). See [`docs/GAPS_AND_FLAWS.md`](docs/GAPS_AND_FLAWS.md) for the full audit this README's claims are now reconciled with.

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
     │ Attack Lab UI    │                            │ FastAPI Backend    │
     │ Attack Scenarios │     Ethernet OR Wi-Fi      │ (scripted DEMO/     │
     │ Preset Intensity ├───────────────────────────►│  HYBRID detection  │
     │ Role: ATTACK_LAB │                            │  pipeline)         │
     │                  │                            │ React SOC Console  │
     │                  │                            │ Role: NIDS_SOC     │
     └──────────────────┘                            └────────────────────┘
```

> [!IMPORTANT]
> **Safety & Authorization**: Attack scenarios may only be launched against the host configured as `LAB_TARGET_HOST` (plus the sensor IP / localhost). The platform enforces bounded time durations (≤120s) and preset intensity levels (LOW / MEDIUM / HIGH). Arbitrary public IP targeting is rejected with a 403. This is a strictly local-LAN convenience, not a security boundary against a malicious client — see **Security & Authentication** below.

---

## 2. Three Deployment Modes

### MODE 1 — One-Laptop Local Demonstration
- **Configuration**: `VITE_CLIENT_ROLE=UNIFIED`, `VITE_MODE=DEMO` (or `HYBRID`), hosts pointed at `localhost`/`127.0.0.1`.
- **Description**: Single-machine development and presentation with real-time UI telemetry and scripted detection events.
- **Run**: see **Quick Start** below, or `docker compose up --build`.

### MODE 2 — Two PCs over Wi-Fi or Ethernet
- **Configuration**: PC 1 and PC 2 on the same private network/switch.
- **PC 2 (NIDS / SOC Host)**: Runs FastAPI (`0.0.0.0:8000`) and Vite (`0.0.0.0:5173`).
- **PC 1 (Attack Lab)**: Navigates to `http://<PC2_IP>:5173` with `VITE_CLIENT_ROLE=ATTACK_LAB`.
- **Active Transport**: Auto-detected as `WI-FI` or `ETHERNET` based on which interface is actually up (requires `psutil`; without it, this reports `DEGRADED_NO_PSUTIL` rather than guessing).

### MODE 3 — Real Sensor Integration (not implemented)
A real deployment would need a packet-capture daemon (Zeek/Suricata/Scapy), a feature-extraction pipeline, and a trained classifier feeding `LIVE` mode. None of that exists in this repo today — `LIVE` mode is a placeholder that reports `NOT_CONFIGURED` and performs no detection. Building it is a substantial ML/network-engineering project in its own right, not a configuration change.

---

## 3. Controlled Attack Scenarios (scripted, not real traffic)

| Category | Attack Scenario | Simulated Signature Shown | Scripted Detection Output |
|---|---|---|---|
| **Reconnaissance** | `PORT_SCAN` | Multi-port probing, rapid inter-arrival, destination port entropy spike | `Port Scan` |
| **Credential Attacks** | `BRUTE_FORCE` | High failed auth frequency, rapid session tear-down (SSH / HTTP) | `Brute Force` |
| **Network Availability** | `DOS_SYN_FLOOD` | Single-source SYN flood, 99% SYN ratio, zero ACK completion | `DoS SYN Flood` |
| **Network Availability** | `DDOS_DISTRIBUTED_FLOOD` | 4-node cluster synchronization, high Source IP entropy (`4.82`) | `DDoS Distributed Flood` |
| **Network Availability** | `VOLUMETRIC_TRAFFIC_FLOOD` | High UDP bandwidth consumption (80+ MB/s), large payload sizes | `Volumetric Traffic Flood` |
| **Protocol Anomalies** | `DNS_ANOMALY` | DNS tunneling, high TXT record ratio, high subdomain character entropy | `DNS Anomaly` |
| **Protocol Anomalies** | `SUSPICIOUS_FLOW` | Non-standard port beaconing, heavy byte asymmetry | `Suspicious Lateral Flow` |

No actual `nmap`/`hydra`/`hping3` command runs anywhere — `commandSimulated` strings are display-only. Launching a scenario calls `POST /api/lab/start`, which validates the scenario against this exact list server-side (`422` on anything else) and schedules a matching pre-written threat payload in DEMO/HYBRID mode.

---

## 4. Quick Start (one laptop)

```bash
cp .env.example .env
# edit .env: set VITE_MODE=DEMO, VITE_CLIENT_ROLE=UNIFIED, hosts to 127.0.0.1,
# and generate NIDS_API_KEY / VITE_API_KEY with:
#   python -c "import secrets; print(secrets.token_urlsafe(32))"

cd backend
pip install -r requirements.txt
python main.py            # listens on 0.0.0.0:8000

# in a second terminal, from the repo root:
npm install
npm run dev                # Vite on localhost:5173
```

Or with Docker (brings up both containers together):

```bash
cp .env.example .env   # fill in NIDS_API_KEY at minimum
docker compose up --build
```

Open `http://localhost:5173`.

---

## 5. Two-PC Setup

### Network Configuration & Environment Variables

Copy `.env.example` to `.env` (also see `.env.pc1` / `.env.pc2` for the two-PC role split) and fill in:

```env
# PC 2 (AI-NIDS Backend & SOC Host)
VITE_NIDS_HOST=192.168.100.30
VITE_NIDS_PORT=8000
VITE_NIDS_WS_PORT=8000

# PC 1 (Attack Lab Machine)
VITE_ATTACKER_HOST=192.168.100.10

# Safe Laboratory Target — keep this in sync with VITE_NIDS_HOST
LAB_TARGET_HOST=192.168.100.30
LAB_SENSOR_HOST=192.168.100.30
LAB_SUBNET=192.168.100.0/24

# Operation Mode: DEMO | HYBRID | LIVE  (see the callout at the top of this file)
VITE_MODE=DEMO

# Client Role: ATTACK_LAB | NIDS_SOC | UNIFIED
VITE_CLIENT_ROLE=UNIFIED

# Required for control endpoints from any non-localhost client (see §6 below)
NIDS_API_KEY=<generate with: python -c "import secrets; print(secrets.token_urlsafe(32))">
VITE_API_KEY=<same value>
NIDS_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://192.168.100.10:5173,http://192.168.100.30:5173
```

`.env` / `.env.pc1` / `.env.pc2` are gitignored (they hold this deployment's real network config and API key) — only `.env.example` is tracked.

### Firewall & Port Requirements

| Port | Protocol | Service | Description |
|---|---|---|---|
| **5173** | TCP | Vite Frontend Server | Web UI access for PC 1 and PC 2 |
| **8000** | TCP | FastAPI REST & WebSocket | `/api/*` REST endpoints and `/ws/live` stream |

### Startup

```bash
# PC 2
cd backend && pip install -r requirements.txt && python main.py

# PC 1 or PC 2 (whichever serves the UI)
npm install && npm run dev -- --host 0.0.0.0 --port 5173
```

- **PC 2 (SOC)**: `http://localhost:5173` (or `http://<PC2_IP>:5173`)
- **PC 1 (Attack Lab)**: `http://<PC2_IP>:5173`

---

## 6. Security & Authentication

- **API key**: every state-mutating endpoint (`/api/lab/start`, `/api/lab/stop`, `/api/threats/resolve/*`, `/api/threats/inject`, `/api/notifications/*`) requires an `X-API-Key` header matching `NIDS_API_KEY`. The frontend sends this automatically from `VITE_API_KEY` (see `src/services/apiClient.ts`). If `NIDS_API_KEY` is unset, **only requests from localhost** are allowed through — anything from another machine on the LAN gets a `503` until a key is configured.
- **CORS** is restricted to `NIDS_CORS_ORIGINS` (comma-separated) instead of `*`, and credentials are not used.
- **Rate limiting**: control endpoints are limited per client IP (`NIDS_RATE_LIMIT_MAX` requests per `NIDS_RATE_LIMIT_WINDOW` seconds, default 20/10s).
- **Persistence**: events/threats/notifications/attack history are written to a local SQLite file (`backend/nids_data.db`, gitignored) so a restart doesn't wipe the SOC's history.
- None of this makes the app safe to expose on the open internet — it's sized for a private lab LAN. Don't port-forward it.

---

## 7. Testing

```bash
# Backend (pytest, runs in-process via FastAPI's TestClient — no server needed)
cd backend
pip install -r requirements.txt -r requirements-dev.txt
pytest -v

# Frontend (vitest)
npm run typecheck
npm run lint
npm run test
```

Both suites run in CI on every push/PR (`.github/workflows/ci.yml`).

---

## 8. Honest UI Indicators

The application reports its own simulated status explicitly rather than implying it's live:
- **`SENSOR: SIMULATED`** / **`NOT_CONFIGURED`** (never actually `LIVE` — no sensor exists)
- **`AI ENGINE: SIMULATED`** (no model is loaded; see `/api/model`'s `"simulated": true`)
- **`NETWORK: WI-FI`** vs **`NETWORK: ETHERNET`** vs **`DEGRADED_NO_PSUTIL`**
- **`MODE: DEMO`** vs **`MODE: HYBRID`** vs **`MODE: LIVE`**

---

## 9. Further reading

- [`docs/GAPS_AND_FLAWS.md`](docs/GAPS_AND_FLAWS.md) — full audit of gaps/flaws found in this codebase and what's been fixed vs. deferred.
- [`docs/archive/`](docs/archive) — superseded planning notes and manual smoke-test scripts, kept for history.
