"""
Integration tests for the AI-NIDS FastAPI backend, run in-process via
FastAPI's TestClient (no server/socket needed). These assert real behavior
(status codes, response fields, state transitions) instead of just printing
observed values for a human to eyeball.
"""

AUTH_HEADERS = {"X-API-Key": "test-api-key"}  # must match conftest.py's NIDS_API_KEY


def test_status_endpoint_reports_demo_mode(client):
    res = client.get("/api/status")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ONLINE"
    assert body["mode"] == "DEMO"


def test_model_endpoint_discloses_simulation(client):
    res = client.get("/api/model")
    assert res.status_code == 200
    body = res.json()
    assert body["simulated"] is True
    assert "not actually trained" in body["modelType"].lower() or "simulated" in body["note"].lower()


def test_lab_start_requires_api_key(client):
    res = client.post("/api/lab/start", json={"scenario": "PORT_SCAN"})
    assert res.status_code == 401


def test_lab_start_rejects_wrong_api_key(client):
    res = client.post(
        "/api/lab/start",
        json={"scenario": "PORT_SCAN"},
        headers={"X-API-Key": "not-the-right-key"},
    )
    assert res.status_code == 401


def test_lab_start_rejects_unknown_scenario(client):
    res = client.post(
        "/api/lab/start",
        json={"scenario": "NOT_A_REAL_SCENARIO"},
        headers=AUTH_HEADERS,
    )
    assert res.status_code == 422


def test_lab_start_rejects_disallowed_target(client):
    res = client.post(
        "/api/lab/start",
        json={"scenario": "PORT_SCAN", "targetIp": "8.8.8.8"},
        headers=AUTH_HEADERS,
    )
    assert res.status_code == 403


def test_lab_start_and_stop_full_cycle(client):
    start_res = client.post(
        "/api/lab/start",
        json={"scenario": "PORT_SCAN", "targetIp": "127.0.0.1", "duration_seconds": 30},
        headers=AUTH_HEADERS,
    )
    assert start_res.status_code == 200
    start_body = start_res.json()
    assert start_body["started"] is True
    attack_id = start_body["attack_id"]

    status_res = client.get("/api/lab/status")
    assert status_res.status_code == 200
    status_body = status_res.json()
    assert status_body["status"] == "running"
    assert status_body["activeScenario"] == "PORT_SCAN"
    assert status_body["packetsSimulated"] is True

    history_res = client.get("/api/lab/history")
    assert any(a["attack_id"] == attack_id for a in history_res.json()["attacks"])

    stop_res = client.post(
        "/api/lab/stop",
        json={"attack_id": attack_id},
        headers=AUTH_HEADERS,
    )
    assert stop_res.status_code == 200
    assert stop_res.json()["stopped"] is True

    status_after_stop = client.get("/api/lab/status").json()
    assert status_after_stop["status"] == "idle"
    assert status_after_stop["activeScenario"] is None


def test_lab_start_and_stop_create_notifications(client):
    start_res = client.post(
        "/api/lab/start",
        json={"scenario": "DOS_SYN_FLOOD", "intensity": "HIGH", "targetIp": "127.0.0.1", "duration_seconds": 30},
        headers=AUTH_HEADERS,
    )
    attack_id = start_res.json()["attack_id"]

    notifs = client.get("/api/notifications").json()["notifications"]
    start_notifs = [n for n in notifs if n.get("attack_id") == attack_id and n["type"] == "LAB_ATTACK_STARTED"]
    assert len(start_notifs) == 1
    assert start_notifs[0]["read"] is False

    client.post("/api/lab/stop", json={"attack_id": attack_id}, headers=AUTH_HEADERS)

    notifs_after = client.get("/api/notifications").json()["notifications"]
    stop_notifs = [n for n in notifs_after if n.get("attack_id") == attack_id and n["type"] == "LAB_ATTACK_STOPPED"]
    assert len(stop_notifs) == 1

    notif_id = stop_notifs[0]["notification_id"]
    read_res = client.post(f"/api/notifications/read/{notif_id}", headers=AUTH_HEADERS)
    assert read_res.json()["success"] is True
    updated = [n for n in client.get("/api/notifications").json()["notifications"] if n["notification_id"] == notif_id][0]
    assert updated["read"] is True


def test_lab_stop_requires_api_key(client):
    res = client.post("/api/lab/stop", json={})
    assert res.status_code == 401


def test_threat_inject_and_resolve_cycle(client):
    inject_res = client.post(
        "/api/threats/inject",
        json={"attackType": "Test Injected Threat"},
        headers=AUTH_HEADERS,
    )
    assert inject_res.status_code == 200
    threat = inject_res.json()["threat"]
    assert threat["simulated"] is True
    threat_id = threat["id"]

    feed_res = client.get("/api/threats")
    assert any(t["id"] == threat_id for t in feed_res.json())

    resolve_res = client.post(f"/api/threats/resolve/{threat_id}", headers=AUTH_HEADERS)
    assert resolve_res.status_code == 200
    assert resolve_res.json()["resolved"] is True

    active_res = client.get("/api/threats/active")
    assert all(t["id"] != threat_id for t in active_res.json())


def test_threat_inject_requires_api_key(client):
    res = client.post("/api/threats/inject", json={"attackType": "x"})
    assert res.status_code == 401


def test_resolve_unknown_threat_returns_404(client):
    res = client.post("/api/threats/resolve/DOES-NOT-EXIST", headers=AUTH_HEADERS)
    assert res.status_code == 404


def test_rate_limit_enforced_on_mutating_endpoint(client, monkeypatch):
    monkeypatch.setenv("NIDS_RATE_LIMIT_MAX", "2")
    import security
    security.reset_rate_limit_state()

    payload = {"attackType": "Rate Limit Probe"}
    r1 = client.post("/api/threats/inject", json=payload, headers=AUTH_HEADERS)
    r2 = client.post("/api/threats/inject", json=payload, headers=AUTH_HEADERS)
    r3 = client.post("/api/threats/inject", json=payload, headers=AUTH_HEADERS)
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r3.status_code == 429


def test_websocket_sends_initial_system_status(client):
    with client.websocket_connect("/ws/live") as ws:
        msg = ws.receive_json()
        assert msg.get("event_type") == "SYSTEM_STATUS" or msg.get("type") == "SYSTEM_STATUS"
        assert "operationMode" in msg["data"]
