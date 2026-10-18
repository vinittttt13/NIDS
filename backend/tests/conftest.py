"""
Shared pytest fixtures for the AI-NIDS backend test suite.

Replaces the old `test_lab_event_flow.py` / `test_lab_persisted_flow.py`
manual scripts (which only printed observed values with no real pass/fail
assertion — see docs/GAPS_AND_FLAWS.md §5.3) with a real, isolated,
repeatable pytest suite that doesn't require a running server.
"""

import os
import sys
import tempfile

import pytest

# --- configure environment BEFORE importing main ----------------------------
os.environ["NIDS_API_KEY"] = "test-api-key"
os.environ["NIDS_RATE_LIMIT_MAX"] = "1000"
os.environ["NIDS_RATE_LIMIT_WINDOW"] = "10"
os.environ["NIDS_DB_PATH"] = os.path.join(tempfile.mkdtemp(prefix="nids-test-"), "test_nids.db")
os.environ["VITE_MODE"] = "DEMO"
os.environ.setdefault("LAB_TARGET_HOST", "127.0.0.1")
os.environ.setdefault("LAB_ATTACKER_HOST", "10.0.0.5")
os.environ.setdefault("LAB_SENSOR_HOST", "127.0.0.1")
os.environ.setdefault("LAB_SUBNET", "127.0.0.1/32")

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import main  # noqa: E402
import security  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

API_KEY = os.environ["NIDS_API_KEY"]
AUTH_HEADERS = {"X-API-Key": API_KEY}


@pytest.fixture()
def client():
    with TestClient(main.app) as c:
        yield c


@pytest.fixture(autouse=True)
def _reset_state():
    """Each test starts from a clean in-memory state, independent of the
    on-disk DB (which is a throwaway temp file for the whole test session)."""
    main.event_store.events.clear()
    main.event_store.threats.clear()
    main.lab_attack_store.attacks.clear()
    main.lab_attack_store.active_attack_id = None
    main.notification_store.notifications.clear()
    main.state.active_scenario = None
    main.state.attack_status = "idle"
    main.state.attack_start_time = 0
    main.state.packets_sent = 0
    security.reset_rate_limit_state()
    yield
    # cancel any packet-counter tasks a test may have left running
    for task in list(main._packet_counter_tasks.values()):
        if not task.done():
            task.cancel()
    main._packet_counter_tasks.clear()
