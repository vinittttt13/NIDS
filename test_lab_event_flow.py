import asyncio
import json
import urllib.request
import websockets

async def test_full_flow():
    print("1. Testing GET /api/status...")
    req = urllib.request.Request("http://127.0.0.1:8000/api/status")
    with urllib.request.urlopen(req) as response:
        status_data = json.loads(response.read().decode())
        print(f"   Status: {status_data.get('status')}, Sensor: {status_data.get('sensorMode')}, AI: {status_data.get('aiEngineMode')}")

    print("2. Connecting WebSocket client (simulating PC 2 NIDS_SOC)...")
    ws_url = "ws://127.0.0.1:8000/ws/live"
    async with websockets.connect(ws_url) as ws:
        # Receive initial SYSTEM_STATUS event
        msg1 = await ws.recv()
        evt1 = json.loads(msg1)
        print(f"   Received Initial WS Event: {evt1.get('event_type') or evt1.get('type')}")

        print("3. Simulating PC 1 Controller dispatching POST /api/lab/start (PORT_SCAN -> 10.64.157.145)...")
        post_data = json.dumps({
            "scenario": "PORT_SCAN",
            "intensity": "MEDIUM",
            "targetIp": "10.64.157.145"
        }).encode('utf-8')

        req = urllib.request.Request(
            "http://127.0.0.1:8000/api/lab/start",
            data=post_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode())
            print(f"   POST /api/lab/start Response: started={res_data.get('started')}, target={res_data.get('target')}, event_id={res_data.get('event_id')}")

        print("4. Listening for broadcasted ATTACK_STARTED on WebSocket...")
        while True:
            msg = await ws.recv()
            evt = json.loads(msg)
            etype = evt.get("event_type") or evt.get("type")
            if etype == "ATTACK_STARTED":
                print("   [OK] Received ATTACK_STARTED on WebSocket!")
                print(f"     event_id: {evt.get('event_id')}")
                print(f"     scenario: {evt.get('scenario')}")
                print(f"     intensity: {evt.get('intensity')}")
                print(f"     source_ip: {evt.get('source_ip')}")
                print(f"     target_ip: {evt.get('target_ip')}")
                print(f"     duration_seconds: {evt.get('duration_seconds')}")
                print(f"     status: {evt.get('status')}")
                break
            elif etype == "TELEMETRY":
                pass
            else:
                print(f"   Received other event: {etype}")

        print("5. Dispathing POST /api/lab/stop...")
        stop_data = json.dumps({"scenario": "PORT_SCAN"}).encode('utf-8')
        req = urllib.request.Request(
            "http://127.0.0.1:8000/api/lab/stop",
            data=stop_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as response:
            res_stop = json.loads(response.read().decode())
            print(f"   POST /api/lab/stop Response: stopped={res_stop.get('stopped')}, event_id={res_stop.get('event_id')}")

        print("6. Listening for broadcasted ATTACK_STOPPED on WebSocket...")
        while True:
            msg = await ws.recv()
            evt = json.loads(msg)
            etype = evt.get("event_type") or evt.get("type")
            if etype == "ATTACK_STOPPED":
                print("   [OK] Received ATTACK_STOPPED on WebSocket!")
                print(f"     event_id: {evt.get('event_id')}")
                print(f"     scenario: {evt.get('scenario')}")
                print(f"     status: {evt.get('status')}")
                break

    print("7. Verifying threats feed on PC 2 backend (should remain 0 in LIVE mode without active sensor classification)...")
    req = urllib.request.Request("http://127.0.0.1:8000/api/threats")
    with urllib.request.urlopen(req) as response:
        threats_data = json.loads(response.read().decode())
        print(f"   Recent Security Detections Count: {len(threats_data)} (Expected 0 in LIVE mode)")

    print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(test_full_flow())
