import sys
from fastapi.testclient import TestClient
from backend.main import app, event_store, lab_attack_store, notification_store

def run_tests():
    client = TestClient(app)
    
    print("=== TEST 1: Initial Empty / Clean State ===")
    r_hist = client.get('/api/lab/history').json()
    r_notif = client.get('/api/notifications').json()
    r_threats = client.get('/api/threats').json()
    print(f"Initial lab attacks count: {len(r_hist.get('attacks', []))}")
    print(f"Initial notifications count: {len(r_notif.get('notifications', []))}")
    print(f"Initial threats detected: {len(r_threats)}")
    assert len(r_threats) == 0, "Threats detected should be 0 (no fake AI detections)"
    
    print("\n=== TEST 2: Start Attack Scenario from PC 1 (10.64.157.140 -> 10.64.157.145) ===")
    start_payload = {
        "scenario": "DOS_SYN_FLOOD",
        "intensity": "HIGH",
        "duration_seconds": 20,
        "source_ip": "10.64.157.140",
        "target_ip": "10.64.157.145"
    }
    start_res = client.post('/api/lab/start', json=start_payload).json()
    print(f"Start Response: started={start_res.get('started')}, attack_id={start_res.get('attack_id')}, event_id={start_res.get('event_id')}")
    attack_id = start_res.get('attack_id')
    assert attack_id is not None, "attack_id must be generated"
    assert start_res.get('started') is True
    
    print("\n=== TEST 3: Check Active Lab History & Notification ===")
    r_hist2 = client.get('/api/lab/history').json()
    attacks = r_hist2.get('attacks', [])
    assert len(attacks) >= 1, "Attack must be in lab history"
    current_atk = [a for a in attacks if a['attack_id'] == attack_id][0]
    print(f"Found active attack: {current_atk['scenario']} (Status: {current_atk['status']}, Source: {current_atk['source_ip']}, Target: {current_atk['target_ip']})")
    assert current_atk['status'] == 'ACTIVE'
    
    r_notif2 = client.get('/api/notifications').json()
    notifs = r_notif2.get('notifications', [])
    start_notifs = [n for n in notifs if n.get('attack_id') == attack_id and n['type'] == 'LAB_ATTACK_STARTED']
    assert len(start_notifs) == 1, "LAB_ATTACK_STARTED notification must exist"
    print(f"Found Start Notification: {start_notifs[0]['title']} (Unread: {not start_notifs[0]['read']})")
    
    print("\n=== TEST 4: Stop Attack Scenario ===")
    stop_payload = {
        "attack_id": attack_id,
        "scenario": "DOS_SYN_FLOOD",
        "source_ip": "10.64.157.140",
        "target_ip": "10.64.157.145",
        "duration_seconds": 20
    }
    stop_res = client.post('/api/lab/stop', json=stop_payload).json()
    print(f"Stop Response: stopped={stop_res.get('stopped')}, attack_id={stop_res.get('attack_id')}")
    
    print("\n=== TEST 5: Verify Persisted History & Completion Notification ===")
    r_hist3 = client.get('/api/lab/history').json()
    attacks3 = r_hist3.get('attacks', [])
    completed_atk = [a for a in attacks3 if a['attack_id'] == attack_id][0]
    print(f"Persisted attack record: {completed_atk['scenario']} (Status: {completed_atk['status']}, Duration: {completed_atk['duration_seconds']}s)")
    assert completed_atk['status'] == 'COMPLETED', "Attack must transition to COMPLETED"
    assert completed_atk['stopped_at'] is not None, "stopped_at timestamp must be set"
    
    r_notif3 = client.get('/api/notifications').json()
    notifs3 = r_notif3.get('notifications', [])
    stop_notifs = [n for n in notifs3 if n.get('attack_id') == attack_id and n['type'] == 'LAB_ATTACK_STOPPED']
    assert len(stop_notifs) == 1, "LAB_ATTACK_STOPPED notification must exist"
    print(f"Found Stop Notification: {stop_notifs[0]['title']}")
    
    print("\n=== TEST 6: Mark Notification Read Endpoint ===")
    first_notif_id = notifs3[0]['notification_id']
    read_res = client.post(f'/api/notifications/read/{first_notif_id}').json()
    assert read_res.get('success') is True
    r_notif4 = client.get('/api/notifications').json()
    updated_notif = [n for n in r_notif4['notifications'] if n['notification_id'] == first_notif_id][0]
    assert updated_notif['read'] is True
    print(f"Notification {first_notif_id} marked as read successfully.")
    
    print("\n=== TEST 7: Verify Zero Fake AI Detections ===")
    r_threats_end = client.get('/api/threats').json()
    print(f"Threats detected count: {len(r_threats_end)}")
    assert len(r_threats_end) == 0, "Threats detected must remain 0"
    
    print("\nALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!")

if __name__ == '__main__':
    run_tests()
