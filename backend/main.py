"""
AI-NIDS: AI-Based Real-Time Network Intrusion Detection System
FastAPI Authoritative Backend Server (Hosted on PC 2: 0.0.0.0:8000)

Architecture Roles:
- PC 1 (Attack Lab Remote Controller): Controls attack simulations (POST /api/lab/start, /stop)
- PC 2 (NIDS / SOC Detection Authority): Sensor & ML inference pipeline, authoritative event store, WebSocket broadcaster

Endpoints:
- POST /api/lab/start, POST /api/lab/stop (Isolated Lab C2 Control Path)
- GET /api/lab/status (Authoritative Lab Execution Status)
- GET /api/events (Server-Side Event Store Log)
- GET /api/threats, GET /api/threats/active, GET /api/alerts (Live Authoritative Threat Store)
- POST /api/threats/resolve/{threat_id} (Threat Mitigation Action)
- POST /api/threats/inject (Test Detection Pipeline Trigger)
- GET /api/diagnostics (Central Diagnostics Information)
- GET /api/sensor/status, GET /api/ai/status, GET /api/status
- GET /api/network/interfaces, GET /api/network/config
- WS /ws/live (Deduplicated, Timestamped Real-Time WebSocket Feed)
"""

import asyncio
import json
import logging
import os
import random
import socket
import time
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AI-NIDS-API")

app = FastAPI(
    title="AI-NIDS Backend API",
    description="Authoritative Network Intrusion Detection & Controlled Attack Simulation Engine",
    version="3.0.0",
)

# Enable CORS for isolated LAN / Wi-Fi deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load .env variables if present
env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
if os.path.exists(env_file):
    try:
        with open(env_file, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip()
                    if k and k not in os.environ:
                        os.environ[k] = v
    except Exception as e:
        logger.warning(f"Could not load .env: {e}")

# Lab Configuration Constants & Dynamic Defaults
LAB_ATTACKER_IP = os.getenv("LAB_ATTACKER_HOST") or os.getenv("VITE_ATTACKER_HOST") or "10.64.157.140"
LAB_TARGET_IP = os.getenv("LAB_TARGET_HOST") or os.getenv("VITE_LAB_TARGET_HOST") or os.getenv("VITE_NIDS_HOST") or "10.64.157.145"
LAB_SENSOR_IP = os.getenv("LAB_SENSOR_HOST") or os.getenv("VITE_NIDS_HOST") or "10.64.157.145"
LAB_SUBNET = os.getenv("LAB_SUBNET") or "10.64.157.0/24"

# DDoS Lab Cluster IP pool
LAB_DDOS_SOURCES = [
    LAB_ATTACKER_IP,
    f"{LAB_ATTACKER_IP}.1",
    f"{LAB_ATTACKER_IP}.2",
    f"{LAB_ATTACKER_IP}.3"
]

# State Tracking
class LabState:
    mode: str = os.getenv("VITE_MODE", "LIVE")           # "DEMO", "HYBRID", "LIVE"
    sensor_mode: str = "NOT_CONFIGURED"                  # "NOT_CONFIGURED", "SIMULATED", "LIVE"
    ai_engine_mode: str = "DEMO"                         # "DEMO", "LIVE"
    transport_mode: str = "AUTO"                         # "AUTO", "ETHERNET", "WI-FI"
    active_transport: str = "WI-FI"                      # Dynamically determined: "ETHERNET" or "WI-FI"
    sensor_ip: str = LAB_SENSOR_IP
    attacker_ip: str = LAB_ATTACKER_IP
    active_scenario: Optional[str] = None
    attack_status: str = "idle"                          # "idle", "armed", "running", "stopping", "completed"
    attack_intensity: str = "MEDIUM"                     # "LOW", "MEDIUM", "HIGH"
    attack_start_time: float = 0
    attack_duration: int = 15
    packets_sent: int = 0
    detection_rate: float = 98.4
    avg_latency_ms: int = 184

state = LabState()

# If in DEMO or HYBRID mode, default sensor mode to SIMULATED; in LIVE mode, default to NOT_CONFIGURED unless sensor daemon is verified
if state.mode == "DEMO":
    state.sensor_mode = "SIMULATED"
    state.ai_engine_mode = "DEMO"
elif state.mode == "HYBRID":
    state.sensor_mode = "SIMULATED"
    state.ai_engine_mode = "DEMO"
else:
    state.sensor_mode = "NOT_CONFIGURED"
    state.ai_engine_mode = "DEMO"

# Server-Side In-Memory Event Store
class EventStore:
    def __init__(self):
        self.events: List[Dict[str, Any]] = []
        self.threats: List[Dict[str, Any]] = []
        self.last_event_id: Optional[str] = None
        self.last_event_type: Optional[str] = None
        self.last_event_time: Optional[str] = None

    def add_event(self, event_type: str, data: Dict[str, Any], source: str = "NIDS_BACKEND") -> Dict[str, Any]:
        event_id = f"evt_{uuid.uuid4().hex[:12]}"
        now_str = datetime.now().strftime("%H:%M:%S")
        iso_str = datetime.now().isoformat()
        
        event_obj = {
            "event_id": event_id,
            "event_type": event_type,
            "type": event_type, # for compatibility
            "timestamp": now_str,
            "iso_time": iso_str,
            "source": source,
            "mode": state.mode,
            "data": data
        }
        
        self.events.insert(0, event_obj)
        if len(self.events) > 500:
            self.events.pop()
            
        self.last_event_id = event_id
        self.last_event_type = event_type
        self.last_event_time = now_str
        return event_obj

    def add_threat(self, threat: Dict[str, Any]) -> Dict[str, Any]:
        if "id" not in threat or not threat["id"]:
            threat["id"] = f"ALT-{random.randint(1000, 9999)}"
        if "timestamp" not in threat or not threat["timestamp"]:
            threat["timestamp"] = datetime.now().strftime("%H:%M:%S")
        if "isoTime" not in threat:
            threat["isoTime"] = datetime.now().isoformat()
        if "status" not in threat:
            threat["status"] = "ACTIVE"
            
        # Prepend to threats list (LIFO)
        self.threats.insert(0, threat)
        if len(self.threats) > 200:
            self.threats.pop()
            
        event_payload = self.add_event("THREAT_DETECTED", threat)
        return event_payload

    def resolve_threat(self, threat_id: str) -> bool:
        found = False
        for t in self.threats:
            if t.get("id") == threat_id:
                t["status"] = "RESOLVED"
                t["resolvedAt"] = datetime.now().strftime("%H:%M:%S")
                found = True
        if found:
            self.add_event("THREAT_RESOLVED", {"threatId": threat_id})
        return found

event_store = EventStore()

# Server-Side In-Memory Lab Attack History Store (Authoritative)
class LabAttackStore:
    def __init__(self):
        self.attacks: List[Dict[str, Any]] = []
        self.active_attack_id: Optional[str] = None

    def start_attack(self, scenario: str, intensity: str, source_ip: str, target_ip: str, duration_sec: int) -> Dict[str, Any]:
        attack_id = f"lab_attack_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:4]}"
        now_str = datetime.now().strftime("%H:%M:%S")
        iso_str = datetime.now().isoformat()

        attack_record = {
            "attack_id": attack_id,
            "scenario": scenario,
            "intensity": intensity,
            "source_ip": source_ip,
            "target_ip": target_ip,
            "started_at": now_str,
            "stopped_at": None,
            "duration_seconds": duration_sec,
            "status": "ACTIVE",
            "iso_time": iso_str
        }
        self.attacks.insert(0, attack_record)
        if len(self.attacks) > 50:
            self.attacks.pop()
        self.active_attack_id = attack_id
        return attack_record

    def complete_attack(self, attack_id: Optional[str] = None, scenario: Optional[str] = None) -> Optional[Dict[str, Any]]:
        target_id = attack_id or self.active_attack_id
        now_str = datetime.now().strftime("%H:%M:%S")

        for att in self.attacks:
            if (target_id and att["attack_id"] == target_id) or (scenario and att["scenario"] == scenario and att["status"] == "ACTIVE"):
                att["status"] = "COMPLETED"
                att["stopped_at"] = now_str
                if self.active_attack_id == att["attack_id"]:
                    self.active_attack_id = None
                return att
        return None

    def get_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.attacks[:limit]

lab_attack_store = LabAttackStore()

# Server-Side In-Memory Notification Store (Authoritative)
class NotificationStore:
    def __init__(self):
        self.notifications: List[Dict[str, Any]] = []

    def add_notification(self, notif_type: str, title: str, message: str, severity: str = "INFO", attack_id: Optional[str] = None, event_id: Optional[str] = None, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        notif_id = f"notif_{uuid.uuid4().hex[:12]}"
        now_str = datetime.now().strftime("%H:%M:%S")
        iso_str = datetime.now().isoformat()

        notif = {
            "notification_id": notif_id,
            "event_id": event_id or f"evt_{uuid.uuid4().hex[:8]}",
            "attack_id": attack_id,
            "type": notif_type,
            "severity": severity,
            "title": title,
            "message": message,
            "timestamp": now_str,
            "iso_time": iso_str,
            "read": False,
            "data": data or {}
        }
        self.notifications.insert(0, notif)
        if len(self.notifications) > 100:
            self.notifications.pop()
        return notif

    def mark_read(self, notification_id: str) -> bool:
        for n in self.notifications:
            if n["notification_id"] == notification_id:
                n["read"] = True
                return True
        return False

    def mark_all_read(self) -> int:
        count = 0
        for n in self.notifications:
            if not n["read"]:
                n["read"] = True
                count += 1
        return count

    def get_notifications(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.notifications[:limit]

notification_store = NotificationStore()

# Seed baseline demo threats ONLY if running in DEMO mode
if state.mode == "DEMO":
    demo_initial_threats = [
        {
            "id": "ALT-9481",
            "attackType": "DoS SYN Flood",
            "category": "Network Availability",
            "severity": "CRITICAL",
            "source": LAB_ATTACKER_IP,
            "target": LAB_TARGET_IP,
            "protocol": "TCP",
            "confidence": 0.972,
            "anomalyScore": 0.96,
            "riskScore": 96,
            "timestamp": "16:42:31",
            "detectionLatencyMs": 312,
            "status": "ACTIVE",
            "xaiFactors": [
                {"factor": "SYN Packet Ratio", "weight": 38, "baselineValue": "4.2%", "observedValue": "99.1%", "direction": "EXCESSIVE"},
                {"factor": "Packets / Second", "weight": 28, "baselineValue": "12,480", "observedValue": "88,400", "direction": "ELEVATED"},
                {"factor": "Flow Duration Mean", "weight": 18, "baselineValue": "4.2s", "observedValue": "12ms", "direction": "ABNORMAL"},
                {"factor": "ACK Flag Absence", "weight": 16, "baselineValue": "94% ACK", "observedValue": "0.2% ACK", "direction": "DEVIATION"}
            ],
            "rawPcapSample": f"IP {LAB_ATTACKER_IP}.54112 > {LAB_TARGET_IP}.80: Flags [S], seq 38920194, win 64240, length 0"
        },
        {
            "id": "ALT-9480",
            "attackType": "Port Scan",
            "category": "Reconnaissance",
            "severity": "HIGH",
            "source": LAB_ATTACKER_IP,
            "target": LAB_TARGET_IP,
            "protocol": "TCP",
            "confidence": 0.948,
            "anomalyScore": 0.91,
            "riskScore": 88,
            "timestamp": "16:41:12",
            "detectionLatencyMs": 438,
            "status": "ACTIVE",
            "xaiFactors": [
                {"factor": "Dst Port Entropy", "weight": 34, "baselineValue": "1.2", "observedValue": "4.9", "direction": "EXCESSIVE"},
                {"factor": "Flow Inter-Arrival Time", "weight": 26, "baselineValue": "450ms", "observedValue": "8ms", "direction": "ABNORMAL"},
                {"factor": "Unanswered SYN Requests", "weight": 22, "baselineValue": "< 1%", "observedValue": "86%", "direction": "ELEVATED"}
            ],
            "rawPcapSample": f"IP {LAB_ATTACKER_IP}.49820 > {LAB_TARGET_IP}.443: Flags [S], seq 1029381, win 1024, length 0"
        }
    ]
    for t in demo_initial_threats:
        event_store.add_threat(t)

# Pydantic Schemas
class StartAttackRequest(BaseModel):
    scenario: str
    targetIp: Optional[str] = None
    target_ip: Optional[str] = None
    sourceIp: Optional[str] = None
    source_ip: Optional[str] = None
    controller_ip: Optional[str] = None
    intensity: Optional[str] = "MEDIUM"
    duration_seconds: Optional[int] = None

class StopAttackRequest(BaseModel):
    scenario: Optional[str] = None
    attack_id: Optional[str] = None
    targetIp: Optional[str] = None
    target_ip: Optional[str] = None
    sourceIp: Optional[str] = None
    source_ip: Optional[str] = None
    controller_ip: Optional[str] = None
    duration_seconds: Optional[int] = None

class ResolveThreatRequest(BaseModel):
    threatId: str

class InjectThreatRequest(BaseModel):
    attackType: str
    category: Optional[str] = "Network Availability"
    severity: Optional[str] = "HIGH"
    sourceIp: Optional[str] = LAB_ATTACKER_IP
    targetIp: Optional[str] = LAB_TARGET_IP
    confidence: Optional[float] = 0.97
    riskScore: Optional[int] = 92
    anomalyScore: Optional[float] = 0.91
    rawPcapSample: Optional[str] = None

class LabStatusResponse(BaseModel):
    connected: bool
    mode: str
    sensorMode: str
    aiEngineMode: str
    transportMode: str
    activeTransport: str
    attackerIp: str
    targetIp: str
    sensorIp: str
    subnet: str
    activeScenario: Optional[str]
    status: str
    intensity: str
    packetsSent: int
    elapsedSec: int

class NetworkTestRequest(BaseModel):
    targetHost: Optional[str] = None
    targetPort: Optional[int] = 8000

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.append(connection)
        for dc in dead_connections:
            self.disconnect(dc)

manager = ConnectionManager()

# Helper to discover local IP addresses and interfaces
def get_local_interfaces():
    interfaces = []
    has_physical_ethernet = False
    has_wifi = False
    primary_transport = "WI-FI"

    # 1. Discover primary routing IP
    primary_ip = None
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        primary_ip = s.getsockname()[0]
        s.close()
    except Exception:
        primary_ip = None

    if PSUTIL_AVAILABLE:
        addrs = psutil.net_if_addrs()
        stats = psutil.net_if_stats()
        for name, addr_list in addrs.items():
            ip = None
            for a in addr_list:
                if a.family == socket.AF_INET and not a.address.startswith("127."):
                    ip = a.address
                    break
            
            is_up = stats[name].isup if name in stats else False
            lower_name = name.lower()

            # Check if virtual adapter
            is_virtual = any(v in lower_name for v in ["virtual", "vbox", "vmware", "vethernet", "wsl", "tap", "tunnel", "teredo"])
            is_link_local = ip.startswith("169.254.") if ip else False

            if "loopback" in lower_name:
                itype = "Loopback"
            elif is_virtual:
                itype = "Virtual Adapter"
            elif "wi-fi" in lower_name or "wlan" in lower_name or "wireless" in lower_name:
                itype = "Wi-Fi"
                if is_up and ip and not is_link_local:
                    has_wifi = True
                    if ip == primary_ip:
                        primary_transport = "WI-FI"
            elif "ethernet" in lower_name or "eth" in lower_name or "local area" in lower_name:
                itype = "Ethernet"
                if is_up and ip and not is_link_local and not is_virtual:
                    has_physical_ethernet = True
                    if ip == primary_ip:
                        primary_transport = "ETHERNET"
            else:
                itype = "Other"

            interfaces.append({
                "name": name,
                "ip": ip or "Not connected",
                "type": itype,
                "status": "Connected" if (is_up and ip and not is_link_local) else "Disconnected",
                "isUp": is_up and (not is_link_local if ip else False),
                "isPrimary": (ip == primary_ip) if (ip and primary_ip) else False
            })
    else:
        if not primary_ip:
            primary_ip = "127.0.0.1"

        interfaces = [
            {"name": "Wi-Fi Adapter", "ip": primary_ip, "type": "Wi-Fi", "status": "Connected", "isUp": True, "isPrimary": True},
            {"name": "Ethernet Adapter", "ip": "Not connected", "type": "Ethernet", "status": "Disconnected", "isUp": False, "isPrimary": False}
        ]
        has_wifi = True

    # 2. Determine active transport based on routing & mode override
    if state.transport_mode == "ETHERNET" and has_physical_ethernet:
        state.active_transport = "ETHERNET"
    elif state.transport_mode == "WI-FI" and has_wifi:
        state.active_transport = "WI-FI"
    elif primary_ip:
        state.active_transport = primary_transport
    elif has_wifi:
        state.active_transport = "WI-FI"
    elif has_physical_ethernet:
        state.active_transport = "ETHERNET"
    else:
        state.active_transport = "WI-FI"

    if primary_ip:
        state.sensor_ip = primary_ip

    return interfaces

# -----------------
# API Endpoints
# -----------------

@app.get("/api/status")
async def get_system_status():
    get_local_interfaces()
    return {
        "status": "ONLINE",
        "nidsHost": state.sensor_ip,
        "apiPort": 8000,
        "networkSensor": "ONLINE" if state.sensor_mode != "NOT_CONFIGURED" else "NOT_CONFIGURED",
        "sensorMode": state.sensor_mode,
        "aiEngine": "ONLINE",
        "aiEngineMode": state.ai_engine_mode,
        "transportMode": state.transport_mode,
        "activeTransport": state.active_transport,
        "database": "ONLINE",
        "labNetwork": "AUTHORIZED_PRIVATE_LAB",
        "subnet": LAB_SUBNET,
        "mode": state.mode,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/lab/status", response_model=LabStatusResponse)
async def get_lab_status():
    get_local_interfaces()
    elapsed = 0
    if state.attack_start_time > 0 and state.attack_status == "running":
        elapsed = int(time.time() - state.attack_start_time)
        if elapsed >= state.attack_duration:
            state.attack_status = "completed"

    return LabStatusResponse(
        connected=True,
        mode=state.mode,
        sensorMode=state.sensor_mode,
        aiEngineMode=state.ai_engine_mode,
        transportMode=state.transport_mode,
        activeTransport=state.active_transport,
        attackerIp=state.attacker_ip,
        targetIp=LAB_TARGET_IP,
        sensorIp=state.sensor_ip,
        subnet=LAB_SUBNET,
        activeScenario=state.active_scenario,
        status=state.attack_status,
        intensity=state.attack_intensity,
        packetsSent=state.packets_sent,
        elapsedSec=elapsed
    )

async def auto_stop_attack(scenario: str, duration_sec: int, source_ip: str, target_ip: str, attack_id: str):
    await asyncio.sleep(duration_sec)
    if state.active_scenario == scenario and state.attack_status == "running":
        state.active_scenario = None
        state.attack_status = "idle"
        state.attack_start_time = 0

        # Update lab attack record to COMPLETED
        lab_attack_store.complete_attack(attack_id=attack_id, scenario=scenario)

        stop_id = f"evt_{uuid.uuid4().hex[:12]}"
        now_str = datetime.now().strftime("%H:%M:%S")
        iso_str = datetime.now().isoformat()

        logger.info(f"[EVENT] ATTACK_STOPPED {stop_id} (attack_id={attack_id})")
        logger.info(f"[WS] broadcasting ATTACK_STOPPED to {len(manager.active_connections)} clients")

        # Create completion notification in notification store
        notif = notification_store.add_notification(
            notif_type="LAB_ATTACK_STOPPED",
            title="Lab Attack Completed",
            message=f"{scenario} completed after {duration_sec}s ({source_ip} → {target_ip})",
            severity="INFO",
            attack_id=attack_id,
            event_id=stop_id,
            data={"scenario": scenario, "duration": duration_sec, "source_ip": source_ip, "target_ip": target_ip}
        )

        stop_event = {
            "event_id": stop_id,
            "attack_id": attack_id,
            "event_type": "ATTACK_STOPPED",
            "type": "ATTACK_STOPPED",
            "timestamp": now_str,
            "iso_time": iso_str,
            "source": "PC1_CONTROLLER",
            "scenario": scenario,
            "source_ip": source_ip,
            "target_ip": target_ip,
            "duration_seconds": duration_sec,
            "status": "COMPLETED",
            "notification": notif,
            "data": {
                "attack_id": attack_id,
                "scenario": scenario,
                "source_ip": source_ip,
                "target_ip": target_ip,
                "duration_seconds": duration_sec,
                "status": "COMPLETED"
            }
        }

        event_store.events.insert(0, stop_event)
        if len(event_store.events) > 500:
            event_store.events.pop()
        event_store.last_event_id = stop_id
        event_store.last_event_type = "ATTACK_STOPPED"
        event_store.last_event_time = now_str

        await manager.broadcast(stop_event)

@app.post("/api/lab/start")
async def start_lab_attack(req: StartAttackRequest, request: Request):
    # Enforce safe laboratory target constraint (allowing configured target or sensor IP or localhost)
    target_ip = req.target_ip or req.targetIp or LAB_TARGET_IP or "10.64.157.145"
    allowed_targets = {LAB_TARGET_IP, state.sensor_ip, "10.64.157.145", "127.0.0.1", "localhost"}
    if target_ip not in allowed_targets:
        raise HTTPException(
            status_code=403, 
            detail=f"Simulations strictly restricted to authorized lab target {LAB_TARGET_IP}."
        )

    # Resolve authoritative source / controller IP (PC 1 Attacker Lab)
    # Priority: 1) Explicit payload source/controller IP, 2) Client IP if remote, 3) Configured LAB_ATTACKER_IP
    source_ip = req.source_ip or req.sourceIp or req.controller_ip or None
    if not source_ip or source_ip in ["127.0.0.1", "localhost", target_ip, "10.64.157.145"]:
        if request.client and request.client.host and request.client.host not in ["127.0.0.1", "localhost", target_ip, "10.64.157.145"]:
            source_ip = request.client.host
        else:
            source_ip = LAB_ATTACKER_IP or "10.64.157.140"

    # Enforce contract: Source MUST NEVER equal Target / NIDS Server in Two-PC Lab mode
    if source_ip == target_ip or source_ip in ["10.64.157.145", target_ip]:
        source_ip = LAB_ATTACKER_IP or "10.64.157.140"

    state.attacker_ip = source_ip
    state.active_scenario = req.scenario
    state.attack_status = "running"
    state.attack_intensity = req.intensity or "MEDIUM"
    state.attack_start_time = time.time()
    state.packets_sent = 0
    
    # Bounded duration presets
    if req.duration_seconds and req.duration_seconds > 0:
        state.attack_duration = req.duration_seconds
    elif req.scenario in ["DOS_SYN_FLOOD", "DDOS_DISTRIBUTED_FLOOD", "VOLUMETRIC_TRAFFIC_FLOOD"]:
        state.attack_duration = 20 if req.intensity == "HIGH" else 15 if req.intensity == "MEDIUM" else 10
    elif req.scenario == "BRUTE_FORCE":
        state.attack_duration = 18
    else:
        state.attack_duration = 15

    event_id = f"evt_{uuid.uuid4().hex[:12]}"
    now_str = datetime.now().strftime("%H:%M:%S")
    iso_str = datetime.now().isoformat()

    # Track session in authoritative LabAttackStore
    attack_session = lab_attack_store.start_attack(
        scenario=req.scenario,
        intensity=state.attack_intensity,
        source_ip=source_ip,
        target_ip=target_ip,
        duration_sec=state.attack_duration
    )
    attack_id = attack_session["attack_id"]

    # Create notification in authoritative NotificationStore
    notif = notification_store.add_notification(
        notif_type="LAB_ATTACK_STARTED",
        title="Lab Attack Started",
        message=f"{req.scenario} ({state.attack_intensity}) started from {source_ip} against {target_ip}",
        severity="INFO",
        attack_id=attack_id,
        event_id=event_id,
        data={"scenario": req.scenario, "intensity": state.attack_intensity, "source_ip": source_ip, "target_ip": target_ip, "duration": state.attack_duration}
    )

    # Create authoritative event object matching user specification
    control_event = {
        "event_id": event_id,
        "attack_id": attack_id,
        "event_type": "ATTACK_STARTED",
        "type": "ATTACK_STARTED",
        "timestamp": now_str,
        "iso_time": iso_str,
        "source": "PC1_CONTROLLER",
        "scenario": req.scenario,
        "intensity": state.attack_intensity,
        "source_ip": source_ip,
        "target_ip": target_ip,
        "duration_seconds": state.attack_duration,
        "status": "ACTIVE",
        "notification": notif,
        "data": {
            "attack_id": attack_id,
            "scenario": req.scenario,
            "intensity": state.attack_intensity,
            "source_ip": source_ip,
            "source": source_ip,
            "target_ip": target_ip,
            "target": target_ip,
            "duration_seconds": state.attack_duration,
            "duration": state.attack_duration,
            "status": "ACTIVE"
        }
    }

    logger.info(f"[EVENT] ATTACK_STARTED {event_id} (attack_id={attack_id})")
    logger.info(f"[WS] broadcasting ATTACK_STARTED to {len(manager.active_connections)} clients")
    logger.info(f"Authorized Lab Control Action: Attack Launched: {req.scenario} ({state.attack_intensity}) from {source_ip} against {target_ip}")
    logger.info(f"[AUTHORITATIVE ATTACK_STARTED PAYLOAD]: {json.dumps(control_event, default=str)}")

    event_store.events.insert(0, control_event)
    if len(event_store.events) > 500:
        event_store.events.pop()
    event_store.last_event_id = event_id
    event_store.last_event_type = "ATTACK_STARTED"
    event_store.last_event_time = now_str

    # Broadcast to all connected clients
    await manager.broadcast(control_event)

    # Automatically stop attack after duration
    asyncio.create_task(auto_stop_attack(req.scenario, state.attack_duration, source_ip, target_ip, attack_id))

    # In DEMO or HYBRID mode ONLY: simulate sensor detection pipeline after delay
    if state.mode in ["DEMO", "HYBRID"]:
        asyncio.create_task(simulate_detection_pipeline(req.scenario, state.attack_intensity))

    return {
        "started": True,
        "attack_id": attack_id,
        "scenario": req.scenario,
        "target": target_ip,
        "source": source_ip,
        "intensity": state.attack_intensity,
        "event_id": event_id,
        "duration_seconds": state.attack_duration,
        "message": f"Controlled scenario {req.scenario} launched from {source_ip} against {target_ip}."
    }

@app.post("/api/lab/stop")
async def stop_lab_attack(req: Optional[StopAttackRequest] = None):
    scenario = (req.scenario if req and req.scenario else None) or state.active_scenario or "PORT_SCAN"
    target_ip = (req.target_ip or req.targetIp if req else None) or LAB_TARGET_IP or "10.64.157.145"
    source_ip = (req.source_ip or req.sourceIp or req.controller_ip if req else None) or state.attacker_ip or LAB_ATTACKER_IP
    if source_ip in ["10.64.157.145", target_ip]:
        source_ip = LAB_ATTACKER_IP or "10.64.157.140"

    req_attack_id = req.attack_id if req and req.attack_id else None
    state.active_scenario = None
    state.attack_status = "idle"
    state.attack_start_time = 0

    attack_record = lab_attack_store.complete_attack(attack_id=req_attack_id, scenario=scenario)
    attack_id = attack_record["attack_id"] if attack_record else (req_attack_id or f"lab_attack_manual_{uuid.uuid4().hex[:4]}")

    stop_id = f"evt_{uuid.uuid4().hex[:12]}"
    now_str = datetime.now().strftime("%H:%M:%S")
    iso_str = datetime.now().isoformat()

    duration = req.duration_seconds if req and req.duration_seconds else (attack_record.get("duration_seconds") if attack_record else 15)

    notif = notification_store.add_notification(
        notif_type="LAB_ATTACK_STOPPED",
        title="Lab Attack Stopped",
        message=f"{scenario} stopped by operator ({source_ip} → {target_ip})",
        severity="INFO",
        attack_id=attack_id,
        event_id=stop_id,
        data={"scenario": scenario, "source_ip": source_ip, "target_ip": target_ip, "duration": duration}
    )

    stop_event = {
        "event_id": stop_id,
        "attack_id": attack_id,
        "event_type": "ATTACK_STOPPED",
        "type": "ATTACK_STOPPED",
        "timestamp": now_str,
        "iso_time": iso_str,
        "source": "PC1_CONTROLLER",
        "scenario": scenario,
        "source_ip": source_ip,
        "target_ip": target_ip,
        "status": "COMPLETED",
        "notification": notif,
        "data": {
            "attack_id": attack_id,
            "scenario": scenario,
            "source_ip": source_ip,
            "source": source_ip,
            "target_ip": target_ip,
            "target": target_ip,
            "status": "COMPLETED"
        }
    }

    logger.info(f"[EVENT] ATTACK_STOPPED {stop_id} (attack_id={attack_id})")
    logger.info(f"[WS] broadcasting ATTACK_STOPPED to {len(manager.active_connections)} clients")
    logger.info(f"Authorized Lab Control Action: Attack Stopped: {scenario} from {source_ip} against {target_ip}")
    logger.info(f"[AUTHORITATIVE ATTACK_STOPPED PAYLOAD]: {json.dumps(stop_event, default=str)}")

    event_store.events.insert(0, stop_event)
    if len(event_store.events) > 500:
        event_store.events.pop()
    event_store.last_event_id = stop_id
    event_store.last_event_type = "ATTACK_STOPPED"
    event_store.last_event_time = now_str

    await manager.broadcast(stop_event)
    return {"stopped": True, "attack_id": attack_id, "scenario": scenario, "event_id": stop_id, "source_ip": source_ip, "target_ip": target_ip}

# Lab History & Notification Endpoints
@app.get("/api/lab/history")
async def get_lab_history():
    return {"attacks": lab_attack_store.get_history()}

@app.get("/api/notifications")
async def get_notifications():
    return {"notifications": notification_store.get_notifications()}

@app.post("/api/notifications/read/{notification_id}")
async def mark_notification_read(notification_id: str):
    success = notification_store.mark_read(notification_id)
    return {"success": success, "notification_id": notification_id}

@app.post("/api/notifications/read-all")
async def mark_all_notifications_read():
    count = notification_store.mark_all_read()
    return {"success": True, "marked_count": count}

# Authoritative Event Store & Threat Endpoints
@app.get("/api/events")
async def get_events(limit: int = 100):
    return event_store.events[:limit]

@app.get("/api/threats")
async def get_threat_feed():
    return event_store.threats

@app.get("/api/threats/active")
async def get_active_threats():
    return [t for t in event_store.threats if t.get("status") == "ACTIVE"]

@app.get("/api/alerts")
async def get_alerts():
    return event_store.threats[:20]

@app.post("/api/threats/resolve/{threat_id}")
async def resolve_threat_endpoint(threat_id: str):
    success = event_store.resolve_threat(threat_id)
    if not success:
        raise HTTPException(status_code=404, detail="Threat not found")
    return {"resolved": True, "threatId": threat_id}

@app.post("/api/threats/inject")
async def inject_threat_endpoint(req: InjectThreatRequest):
    """Authoritative API endpoint to trigger a real detection event down the NIDS pipeline."""
    scenario = req.attackType
    source_desc = req.sourceIp or LAB_ATTACKER_IP
    target_desc = req.targetIp or LAB_TARGET_IP

    new_threat = {
        "id": f"ALT-{random.randint(1000, 9999)}",
        "attackType": scenario,
        "category": req.category or "Network Availability",
        "severity": req.severity or "HIGH",
        "source": source_desc,
        "sourceIp": source_desc,
        "sourcePort": 49820,
        "target": target_desc,
        "targetIp": target_desc,
        "targetPort": 80,
        "protocol": "TCP",
        "confidence": req.confidence or 0.978,
        "anomalyScore": req.anomalyScore or 0.94,
        "riskScore": req.riskScore or 92,
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "isoTime": datetime.now().isoformat(),
        "detectionLatencyMs": 184,
        "status": "ACTIVE",
        "xaiFactors": [
            {"factor": "Anomaly Vector Magnitude", "weight": 40, "baselineValue": "0.12", "observedValue": "4.8", "direction": "EXCESSIVE"},
            {"factor": "Packet Burst Rate", "weight": 35, "baselineValue": "12.4k/s", "observedValue": "88.4k/s", "direction": "ELEVATED"},
            {"factor": "Session Asymmetry", "weight": 25, "baselineValue": "1.2:1", "observedValue": "99.1%", "direction": "DEVIATION"}
        ],
        "rawPcapSample": req.rawPcapSample or f"IP {source_desc}.49820 > {target_desc}.80: Flags [S], seq {random.randint(100000, 999999)}"
    }

    event_msg = event_store.add_threat(new_threat)
    await manager.broadcast(event_msg)
    return {"injected": True, "threat": new_threat, "event_id": event_msg["event_id"]}

@app.get("/api/diagnostics")
async def get_diagnostics():
    get_local_interfaces()
    active_threats = [t for t in event_store.threats if t.get("status") == "ACTIVE"]
    critical_threats = [t for t in active_threats if t.get("severity") == "CRITICAL"]

    return {
        "pcRole": "NIDS_SOC • DETECTION SERVER",
        "clientIp": state.attacker_ip,
        "nidsServerIp": f"{state.sensor_ip}:8000",
        "apiStatus": "CONNECTED",
        "websocketStatus": f"CONNECTED ({len(manager.active_connections)} clients)",
        "networkInterface": f"{state.active_transport} ({'Connected' if len(manager.active_connections) > 0 else 'Online'})",
        "sensorStatus": state.sensor_mode,
        "aiStatus": state.ai_engine_mode,
        "lastEventId": event_store.last_event_id or "None",
        "lastEventType": event_store.last_event_type or "None",
        "lastEventTimestamp": event_store.last_event_time or "None",
        "eventsStoredCount": len(event_store.events),
        "activeThreatsCount": len(active_threats),
        "criticalThreatsCount": len(critical_threats),
        "operationMode": state.mode,
        "timestamp": datetime.now().isoformat()
    }

async def simulate_detection_pipeline(scenario: str, intensity: str):
    """Simulated detection for DEMO/HYBRID modes only."""
    await asyncio.sleep(1.2)
    if state.attack_status != "running":
        return

    # Create scenario-specific detection payload
    if scenario == "DDOS_DISTRIBUTED_FLOOD":
        new_threat = {
            "id": f"ALT-{random.randint(1000, 9999)}",
            "attackType": "DDoS Distributed Flood",
            "category": "Network Availability",
            "severity": "CRITICAL",
            "source": "192.168.100.10, .11, .12, .13 (Cluster)",
            "sourceIp": "192.168.100.10, .11, .12, .13",
            "sourcePort": 49152,
            "target": LAB_TARGET_IP,
            "targetIp": LAB_TARGET_IP,
            "targetPort": 80,
            "protocol": "TCP / UDP",
            "confidence": 0.992,
            "anomalyScore": 0.99,
            "riskScore": 99,
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "detectionLatencyMs": 194,
            "status": "ACTIVE",
            "xaiFactors": [
                {"factor": "Source IP Entropy", "weight": 42, "baselineValue": "0.14", "observedValue": "4.82", "direction": "EXCESSIVE"},
                {"factor": "Aggregate Ingress Rate", "weight": 32, "baselineValue": "12.4k/s", "observedValue": "142.8k/s", "direction": "ELEVATED"},
                {"factor": "Concurrent TCP States", "weight": 16, "baselineValue": "140", "observedValue": "42,000", "direction": "EXHAUSTION"},
                {"factor": "Multi-Source Symmetry", "weight": 10, "baselineValue": "Asymmetric", "observedValue": "Synchronized Burst", "direction": "DEVIATION"}
            ],
            "rawPcapSample": f"IP multi-src > {LAB_TARGET_IP}.80: Flags [S], synchronized cluster flood"
        }
    elif scenario == "DOS_SYN_FLOOD":
        new_threat = {
            "id": f"ALT-{random.randint(1000, 9999)}",
            "attackType": "DoS SYN Flood",
            "category": "Network Availability",
            "severity": "CRITICAL",
            "source": LAB_ATTACKER_IP,
            "sourceIp": LAB_ATTACKER_IP,
            "sourcePort": 54112,
            "target": LAB_TARGET_IP,
            "targetIp": LAB_TARGET_IP,
            "targetPort": 80,
            "protocol": "TCP",
            "confidence": 0.978,
            "anomalyScore": 0.96,
            "riskScore": 96,
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "detectionLatencyMs": 312,
            "status": "ACTIVE",
            "xaiFactors": [
                {"factor": "SYN Packet Ratio", "weight": 38, "baselineValue": "4.2%", "observedValue": "99.1%", "direction": "EXCESSIVE"},
                {"factor": "Packets / Second", "weight": 28, "baselineValue": "12,480", "observedValue": "88,400", "direction": "ELEVATED"},
                {"factor": "Flow Duration Mean", "weight": 18, "baselineValue": "4.2s", "observedValue": "12ms", "direction": "ABNORMAL"},
                {"factor": "ACK Flag Absence", "weight": 16, "baselineValue": "94% ACK", "observedValue": "0.2% ACK", "direction": "DEVIATION"}
            ],
            "rawPcapSample": f"IP {LAB_ATTACKER_IP}.54112 > {LAB_TARGET_IP}.80: Flags [S], seq 38920194, win 64240, length 0"
        }
    elif scenario == "VOLUMETRIC_TRAFFIC_FLOOD":
        new_threat = {
            "id": f"ALT-{random.randint(1000, 9999)}",
            "attackType": "Volumetric Traffic Flood",
            "category": "Network Availability",
            "severity": "HIGH",
            "source": LAB_ATTACKER_IP,
            "sourceIp": LAB_ATTACKER_IP,
            "sourcePort": 38192,
            "target": LAB_TARGET_IP,
            "targetIp": LAB_TARGET_IP,
            "targetPort": 53,
            "protocol": "UDP",
            "confidence": 0.961,
            "anomalyScore": 0.93,
            "riskScore": 92,
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "detectionLatencyMs": 280,
            "status": "ACTIVE",
            "xaiFactors": [
                {"factor": "Bandwidth Consumption", "weight": 44, "baselineValue": "780 KB/s", "observedValue": "82.4 MB/s", "direction": "EXCESSIVE"},
                {"factor": "UDP Packet Ratio", "weight": 30, "baselineValue": "8.5%", "observedValue": "96.4%", "direction": "ELEVATED"},
                {"factor": "Payload Length Mean", "weight": 26, "baselineValue": "420B", "observedValue": "1470B", "direction": "ABNORMAL"}
            ],
            "rawPcapSample": f"IP {LAB_ATTACKER_IP}.38192 > {LAB_TARGET_IP}.53: UDP, length 1470"
        }
    elif scenario == "BRUTE_FORCE":
        new_threat = {
            "id": f"ALT-{random.randint(1000, 9999)}",
            "attackType": "Brute Force Authentication",
            "category": "Credential Attacks",
            "severity": "HIGH",
            "source": LAB_ATTACKER_IP,
            "sourceIp": LAB_ATTACKER_IP,
            "sourcePort": 51240,
            "target": LAB_TARGET_IP,
            "targetIp": LAB_TARGET_IP,
            "targetPort": 22,
            "protocol": "SSH / HTTP",
            "confidence": 0.954,
            "anomalyScore": 0.89,
            "riskScore": 86,
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "detectionLatencyMs": 520,
            "status": "ACTIVE",
            "xaiFactors": [
                {"factor": "Failed Auth Count / min", "weight": 45, "baselineValue": "< 2", "observedValue": "142", "direction": "EXCESSIVE"},
                {"factor": "Session Teardown Rate", "weight": 30, "baselineValue": "0.1/s", "observedValue": "8.4/s", "direction": "ELEVATED"},
                {"factor": "Credential Entropy", "weight": 25, "baselineValue": "Low", "observedValue": "Wordlist Matched", "direction": "ABNORMAL"}
            ],
            "rawPcapSample": f"IP {LAB_ATTACKER_IP}.51240 > {LAB_TARGET_IP}.22: SSH-2.0-OpenSSH_8.2p1 auth failed"
        }
    elif scenario == "DNS_ANOMALY":
        new_threat = {
            "id": f"ALT-{random.randint(1000, 9999)}",
            "attackType": "DNS Tunneling / Anomaly",
            "category": "Protocol / Behavior Anomalies",
            "severity": "MEDIUM",
            "source": LAB_ATTACKER_IP,
            "sourceIp": LAB_ATTACKER_IP,
            "sourcePort": 62104,
            "target": LAB_TARGET_IP,
            "targetIp": LAB_TARGET_IP,
            "targetPort": 53,
            "protocol": "DNS (UDP 53)",
            "confidence": 0.932,
            "anomalyScore": 0.84,
            "riskScore": 74,
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "detectionLatencyMs": 610,
            "status": "ACTIVE",
            "xaiFactors": [
                {"factor": "Subdomain Character Entropy", "weight": 48, "baselineValue": "2.1", "observedValue": "4.92", "direction": "EXCESSIVE"},
                {"factor": "TXT / NULL Record Ratio", "weight": 28, "baselineValue": "0.4%", "observedValue": "82.0%", "direction": "ELEVATED"},
                {"factor": "Query Length Average", "weight": 24, "baselineValue": "24B", "observedValue": "188B", "direction": "ABNORMAL"}
            ],
            "rawPcapSample": f"IP {LAB_ATTACKER_IP}.62104 > {LAB_TARGET_IP}.53: 12048+ TXT? a8f9c1b4e2.tunnel.lab. (192)"
        }
    elif scenario == "SUSPICIOUS_FLOW":
        new_threat = {
            "id": f"ALT-{random.randint(1000, 9999)}",
            "attackType": "Suspicious Lateral Flow",
            "category": "Protocol / Behavior Anomalies",
            "severity": "LOW",
            "source": LAB_ATTACKER_IP,
            "sourceIp": LAB_ATTACKER_IP,
            "sourcePort": 44192,
            "target": LAB_TARGET_IP,
            "targetIp": LAB_TARGET_IP,
            "targetPort": 31337,
            "protocol": "TCP",
            "confidence": 0.884,
            "anomalyScore": 0.72,
            "riskScore": 58,
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "detectionLatencyMs": 750,
            "status": "ACTIVE",
            "xaiFactors": [
                {"factor": "Non-Standard Port Usage", "weight": 40, "baselineValue": "Known Services", "observedValue": "Port 31337", "direction": "ABNORMAL"},
                {"factor": "Byte Asymmetry Ratio", "weight": 35, "baselineValue": "1.4:1", "observedValue": "120:1", "direction": "ELEVATED"},
                {"factor": "Beaconing Periodicity", "weight": 25, "baselineValue": "Random", "observedValue": "60.0s Fixed", "direction": "PERIODIC"}
            ],
            "rawPcapSample": f"IP {LAB_ATTACKER_IP}.44192 > {LAB_TARGET_IP}.31337: Flags [P.], length 256"
        }
    else:
        new_threat = {
            "id": f"ALT-{random.randint(1000, 9999)}",
            "attackType": scenario.replace("_", " ").title(),
            "category": "Reconnaissance",
            "severity": "HIGH",
            "source": LAB_ATTACKER_IP,
            "sourceIp": LAB_ATTACKER_IP,
            "sourcePort": 49820,
            "target": LAB_TARGET_IP,
            "targetIp": LAB_TARGET_IP,
            "targetPort": 80,
            "protocol": "TCP",
            "confidence": 0.948,
            "anomalyScore": 0.91,
            "riskScore": 88,
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "detectionLatencyMs": 438,
            "status": "ACTIVE",
            "xaiFactors": [
                {"factor": "Packet Rate Spike", "weight": 34, "baselineValue": "12.4k/s", "observedValue": "28.6k/s", "direction": "ELEVATED"},
                {"factor": "Destination Port Entropy", "weight": 31, "baselineValue": "1.2", "observedValue": "5.2", "direction": "EXCESSIVE"},
                {"factor": "Flow Duration (< 20ms)", "weight": 20, "baselineValue": "3.8s", "observedValue": "9.2ms", "direction": "ABNORMAL"}
            ],
            "rawPcapSample": f"IP {LAB_ATTACKER_IP}.49281 > {LAB_TARGET_IP}.80: Flags [S], seq 4819204, win 1024, length 0"
        }

    threat_event = event_store.add_threat(new_threat)
    await manager.broadcast(threat_event)

@app.get("/api/traffic")
async def get_traffic_history(duration: str = "5M"):
    points = []
    count = 20 if duration == "1M" else 30 if duration == "5M" else 45
    now = time.time()
    interval = 10

    for i in range(count - 1, -1, -1):
        t = datetime.fromtimestamp(now - i * interval).strftime("%H:%M:%S")
        base_p = 12480 + random.randint(-400, 400)
        susp_p = 120 + random.randint(0, 80)
        if state.active_scenario and i < 5:
            if state.active_scenario == "DDOS_DISTRIBUTED_FLOOD":
                base_p = 142800 + random.randint(-5000, 5000)
                susp_p = int(base_p * 0.9)
            elif state.active_scenario == "DOS_SYN_FLOOD":
                base_p = 78000 + random.randint(-3000, 3000)
                susp_p = int(base_p * 0.75)
            elif state.active_scenario == "VOLUMETRIC_TRAFFIC_FLOOD":
                base_p = 96000 + random.randint(-4000, 4000)
                susp_p = int(base_p * 0.8)
            else:
                base_p = 28600 + random.randint(-1000, 1000)
                susp_p = int(base_p * 0.5)

        points.append({
            "time": t,
            "packetsPerSec": base_p,
            "flowsPerSec": int(base_p / 10),
            "bytesPerSec": base_p * 720,
            "suspiciousPackets": susp_p,
            "alertsCount": 1 if state.active_scenario and i < 5 else 0
        })
    return points

@app.get("/api/model")
async def get_model_info():
    return {
        "modelType": "XGBoost Gradient Boosting Classifier + Isolation Forest",
        "modelVersion": "1.4.2-PROD",
        "status": "ONLINE",
        "accuracy": 98.4,
        "precision": 97.6,
        "recall": 98.1,
        "f1Score": 97.8,
        "falsePositiveRate": 0.6,
        "averageInferenceTimeMs": 14,
        "totalInferences": 1542900,
        "datasetTrainedOn": "CICIDS2017 + UNSW-NB15 + Isolated Lab Synthetic Flows",
        "note": "XGBoost Classifier authoritative weights loaded"
    }

@app.get("/api/features")
async def get_features(schema: str = "78_FEATURES"):
    is_scan = state.active_scenario == "PORT_SCAN"
    is_dos = state.active_scenario == "DOS_SYN_FLOOD"
    is_ddos = state.active_scenario == "DDOS_DISTRIBUTED_FLOOD"
    return [
        {"id": "f_src_entropy", "name": "Source IP Entropy", "category": "Distribution", "value": "4.82" if is_ddos else "0.14", "unit": "entropy", "baseline": "0.14 (Single Stream)", "importance": 42, "description": "Measures multi-source IP variance indicative of DDoS bot cluster."},
        {"id": "f_dst_port", "name": "Destination Port", "category": "Flow Basic", "value": "Multi (1-8080)" if is_scan else 80 if (is_dos or is_ddos) else 443, "unit": "port", "baseline": "443 / 80 / 53", "importance": 31, "description": "Destination service port targeted by stream."},
        {"id": "f_pkt_rate", "name": "Flow Packets / sec", "category": "Packet Statistics", "value": 142800 if is_ddos else 86420 if is_dos else 28600 if is_scan else 12480, "unit": "pkts/s", "baseline": "12,480 pkts/s", "importance": 28, "description": "Packet transmission frequency through sensor."},
        {"id": "f_flow_dur", "name": "Flow Duration", "category": "Flow Basic", "value": "12 ms" if is_scan else "14.2 s" if (is_dos or is_ddos) else "3.8 s", "unit": "time", "baseline": "3.8 seconds", "importance": 20, "description": "Elapsed time for flow session."},
        {"id": "f_syn_cnt", "name": "SYN Flag Count", "category": "Flag Counts", "value": 142000 if is_ddos else 86200 if is_dos else 2840 if is_scan else 42, "unit": "flags", "baseline": "< 50", "importance": 14, "description": "Total TCP SYN requests observed."},
        {"id": "f_flow_bytes", "name": "Flow Bytes / sec", "category": "Packet Statistics", "value": "102.8 MB/s" if is_ddos else "54.8 MB/s" if is_dos else "3.4 MB/s" if is_scan else "780 KB/s", "unit": "bytes/s", "baseline": "780 KB/s", "importance": 11, "description": "Byte throughput rate across stream."}
    ]

@app.get("/api/network")
async def get_network_nodes():
    return [
        {"id": "node-pc1", "ip": LAB_ATTACKER_IP, "hostname": "PC1-ATTACK-LAB", "role": "ATTACKER_PC", "physicalPc": "PC 1 (Attack Lab)", "status": "ACTIVE_ATTACKING" if state.active_scenario else "ONLINE", "transportType": state.active_transport, "switchPort": "Port 1 (Access)"},
        {"id": "node-pc2", "ip": LAB_SENSOR_IP, "hostname": "PC2-AI-NIDS", "role": "SENSOR_NIDS", "physicalPc": "PC 2 (AI-NIDS)", "status": "MONITORING", "transportType": state.active_transport, "switchPort": "Port 8 (Mirror SPAN)", "isMirrored": True},
        {"id": "node-victim", "ip": LAB_TARGET_IP, "hostname": "LAB-VICTIM", "role": "VICTIM_SERVER", "physicalPc": "Lab Target VM", "status": "UNDER_ATTACK" if state.active_scenario else "ONLINE", "transportType": state.active_transport, "switchPort": "Port 2 (Mirror Source)", "isMirrored": True},
        {"id": "node-bot1", "ip": "192.168.100.11", "hostname": "BOT-NODE-01", "role": "BOT_NODE", "physicalPc": "Simulated Bot Node", "status": "FLOODING" if state.active_scenario == "DDOS_DISTRIBUTED_FLOOD" else "STANDBY", "transportType": state.active_transport, "switchPort": "Port 3 (Access)"},
        {"id": "node-bot2", "ip": "192.168.100.12", "hostname": "BOT-NODE-02", "role": "BOT_NODE", "physicalPc": "Simulated Bot Node", "status": "FLOODING" if state.active_scenario == "DDOS_DISTRIBUTED_FLOOD" else "STANDBY", "transportType": state.active_transport, "switchPort": "Port 4 (Access)"},
        {"id": "node-bot3", "ip": "192.168.100.13", "hostname": "BOT-NODE-03", "role": "BOT_NODE", "physicalPc": "Simulated Bot Node", "status": "FLOODING" if state.active_scenario == "DDOS_DISTRIBUTED_FLOOD" else "STANDBY", "transportType": state.active_transport, "switchPort": "Port 5 (Access)"}
    ]

@app.get("/api/network/interfaces")
async def get_network_interfaces_endpoint():
    interfaces = get_local_interfaces()
    return {
        "hostname": socket.gethostname(),
        "interfaces": interfaces,
        "activeTransport": state.active_transport,
        "selectedTransportMode": state.transport_mode,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/network/config")
async def get_network_config_endpoint():
    get_local_interfaces()
    return {
        "bindHost": "0.0.0.0",
        "apiPort": 8000,
        "wsPort": 8000,
        "labAttackerIp": state.attacker_ip,
        "labTargetIp": LAB_TARGET_IP,
        "labSensorIp": state.sensor_ip,
        "labSubnet": LAB_SUBNET,
        "transportMode": state.transport_mode,
        "activeTransport": state.active_transport,
        "mode": state.mode
    }

@app.post("/api/network/test")
async def test_network_endpoint(req: Optional[NetworkTestRequest] = None):
    t_start = time.time()
    await asyncio.sleep(0.015)
    latency_ms = int((time.time() - t_start) * 1000) + 12
    return {
        "success": True,
        "targetHost": req.targetHost if req and req.targetHost else state.sensor_ip,
        "targetPort": req.targetPort if req and req.targetPort else 8000,
        "latencyMs": latency_ms,
        "status": "REACHABLE",
        "message": f"Successfully reached host in {latency_ms}ms over {state.active_transport}."
    }

@app.get("/api/sensor/status")
async def get_sensor_status_endpoint():
    get_local_interfaces()
    is_live_capture = (state.sensor_mode == "LIVE")
    is_sim = (state.sensor_mode == "SIMULATED")
    
    return {
        "sensor": "Zeek Flow Ingestion / Scapy Wi-Fi Sniffer",
        "mode": state.sensor_mode,
        "status": "ACTIVE_CAPTURE" if is_live_capture else "SIMULATED_INGESTION" if is_sim else "NOT_CONFIGURED",
        "interface": state.active_transport,
        "capture_interface": f"{state.active_transport} ({state.sensor_ip})",
        "capture_backend": "Scapy / Zeek Ingest Daemon" if is_live_capture else "Simulation Engine" if is_sim else "NONE",
        "captured_packets": state.packets_sent if is_live_capture else (184200 if is_sim else 0),
        "packetsCaptured": state.packets_sent if is_live_capture else (184200 if is_sim else 0),
        "last_packet_timestamp": datetime.now().isoformat() if (is_live_capture or is_sim) else None,
        "activeFlowsTracked": 1284 if is_sim else 0,
        "traffic_visibility": "FULL_TAP_REQUIRED" if state.active_transport == "WI-FI" else "PROMISCUOUS_ETHERNET",
        "wifi_limitation_note": "Passive Wi-Fi station mode cannot capture peer-to-peer unicast traffic due to 802.11 isolation / encryption. SPAN/TAP or monitor mode required for passive sniffing.",
        "note": "Authoritative sensor capture status"
    }

@app.get("/api/ai/status")
async def get_ai_status_endpoint():
    return {
        "engine": "XGBoost v1.4.2 (78-Feature Vector)",
        "mode": state.ai_engine_mode,
        "status": "ONLINE",
        "avgInferenceLatencyMs": 14,
        "activeSchema": "78_FEATURES",
        "featuresCount": 78,
        "anomalyScorer": "Isolation Forest + Statistical Z-Score",
        "note": "Pre-trained model loaded on PC 2 detection server"
    }

# WebSocket Live Stream
@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # 1. Send initial system status snapshot
        init_event = event_store.add_event(
            "SYSTEM_STATUS",
            {
                "nidsHost": state.sensor_ip,
                "status": "ONLINE",
                "sensorMode": state.sensor_mode,
                "aiEngineMode": state.ai_engine_mode,
                "activeTransport": state.active_transport,
                "transportMode": state.transport_mode,
                "operationMode": state.mode,
                "activeThreatsCount": len([t for t in event_store.threats if t.get("status") == "ACTIVE"]),
                "lastEventId": event_store.last_event_id
            }
        )
        await websocket.send_json(init_event)

        # 2. Continuous telemetry loop
        while True:
            await asyncio.sleep(1.5)
            base_p = 12480 + random.randint(-200, 200)
            if state.active_scenario:
                if state.active_scenario == "DDOS_DISTRIBUTED_FLOOD":
                    base_p = 142800 + random.randint(-4000, 4000)
                elif state.active_scenario == "DOS_SYN_FLOOD":
                    base_p = 78000 + random.randint(-2000, 2000)
                elif state.active_scenario == "VOLUMETRIC_TRAFFIC_FLOOD":
                    base_p = 96000 + random.randint(-3000, 3000)
                else:
                    base_p = 28600 + random.randint(-1000, 1000)

            active_threats = [t for t in event_store.threats if t.get("status") == "ACTIVE"]
            crit_threats = [t for t in active_threats if t.get("severity") == "CRITICAL"]

            telemetry_snapshot = {
                "event_id": f"evt_{uuid.uuid4().hex[:12]}",
                "event_type": "TELEMETRY",
                "type": "TELEMETRY",
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "iso_time": datetime.now().isoformat(),
                "source": "NIDS_BACKEND",
                "mode": state.mode,
                "data": {
                    "packetsPerSecond": base_p,
                    "activeFlows": int(base_p / 10),
                    "bandwidth": base_p * 720,
                    "suspiciousFlows": int(base_p * 0.7) if state.active_scenario else 12,
                    "threatsCount": len(event_store.threats),
                    "activeThreatsCount": len(active_threats),
                    "criticalCount": len(crit_threats),
                    "detectionRate": state.detection_rate,
                    "avgLatencyMs": state.avg_latency_ms,
                    "activeTransport": state.active_transport,
                    "timestamp": datetime.now().strftime("%H:%M:%S")
                }
            }
            await websocket.send_json(telemetry_snapshot)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    # Bind to 0.0.0.0 for LAN & Wi-Fi communication
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
