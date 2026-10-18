"""
SQLite-backed persistence for the AI-NIDS event/threat/notification/attack stores.

Fixes docs/GAPS_AND_FLAWS.md §4.1: previously all server state lived only in
Python process memory, so a crash or the dev auto-reloader wiped the entire
SOC audit trail. Every mutation here is write-through to disk; callers keep
an in-memory list as a hot-path cache and reload it from this module on
startup (see EventStore / LabAttackStore / NotificationStore in main.py).

A single sqlite3 connection is shared across the process. sqlite3 objects
are not thread-safe, so every access goes through `_lock`. That is fine for
this project: FastAPI/uvicorn runs this app as a single async process, and
writes are infrequent relative to request handling.
"""

import json
import os
import sqlite3
import threading
from typing import Any, Dict, List, Optional

_DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "nids_data.db")

_lock = threading.Lock()
_conn: Optional[sqlite3.Connection] = None


def _db_path() -> str:
    return os.getenv("NIDS_DB_PATH", "").strip() or _DEFAULT_DB_PATH


def get_connection() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        _conn = sqlite3.connect(_db_path(), check_same_thread=False)
        _conn.row_factory = sqlite3.Row
    return _conn


def reset_connection() -> None:
    """Test helper: closes and clears the cached connection (e.g. to point at a fresh temp DB)."""
    global _conn
    with _lock:
        if _conn is not None:
            _conn.close()
        _conn = None


def init_db() -> None:
    conn = get_connection()
    with _lock:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS events (
                event_id TEXT PRIMARY KEY,
                event_type TEXT NOT NULL,
                created_at REAL NOT NULL,
                payload TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS threats (
                id TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                created_at REAL NOT NULL,
                payload TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS notifications (
                notification_id TEXT PRIMARY KEY,
                is_read INTEGER NOT NULL DEFAULT 0,
                created_at REAL NOT NULL,
                payload TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS attacks (
                attack_id TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                created_at REAL NOT NULL,
                payload TEXT NOT NULL
            );
            """
        )
        conn.commit()


def _prune(table: str, keep_last: int) -> None:
    conn = get_connection()
    conn.execute(
        f"""
        DELETE FROM {table}
        WHERE rowid NOT IN (
            SELECT rowid FROM {table} ORDER BY created_at DESC LIMIT ?
        )
        """,
        (keep_last,),
    )


# --- events -----------------------------------------------------------------

def save_event(event: Dict[str, Any], keep_last: int = 500) -> None:
    conn = get_connection()
    with _lock:
        conn.execute(
            "INSERT OR REPLACE INTO events (event_id, event_type, created_at, payload) VALUES (?, ?, ?, ?)",
            (event["event_id"], event.get("event_type", "UNKNOWN"), event.get("_ts", 0.0), json.dumps(event)),
        )
        _prune("events", keep_last)
        conn.commit()


def load_events(limit: int = 500) -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT payload FROM events ORDER BY created_at DESC LIMIT ?", (limit,)
    ).fetchall()
    return [json.loads(r["payload"]) for r in rows]


# --- threats ------------------------------------------------------------

def save_threat(threat: Dict[str, Any], keep_last: int = 200) -> None:
    conn = get_connection()
    with _lock:
        conn.execute(
            "INSERT OR REPLACE INTO threats (id, status, created_at, payload) VALUES (?, ?, ?, ?)",
            (threat["id"], threat.get("status", "ACTIVE"), threat.get("_ts", 0.0), json.dumps(threat)),
        )
        _prune("threats", keep_last)
        conn.commit()


def load_threats(limit: int = 200) -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT payload FROM threats ORDER BY created_at DESC LIMIT ?", (limit,)
    ).fetchall()
    return [json.loads(r["payload"]) for r in rows]


# --- notifications ------------------------------------------------------

def save_notification(notif: Dict[str, Any], keep_last: int = 100) -> None:
    conn = get_connection()
    with _lock:
        conn.execute(
            "INSERT OR REPLACE INTO notifications (notification_id, is_read, created_at, payload) VALUES (?, ?, ?, ?)",
            (notif["notification_id"], int(bool(notif.get("read", False))), notif.get("_ts", 0.0), json.dumps(notif)),
        )
        _prune("notifications", keep_last)
        conn.commit()


def load_notifications(limit: int = 100) -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT payload FROM notifications ORDER BY created_at DESC LIMIT ?", (limit,)
    ).fetchall()
    return [json.loads(r["payload"]) for r in rows]


# --- attacks --------------------------------------------------------------

def save_attack(attack: Dict[str, Any], keep_last: int = 50) -> None:
    conn = get_connection()
    with _lock:
        conn.execute(
            "INSERT OR REPLACE INTO attacks (attack_id, status, created_at, payload) VALUES (?, ?, ?, ?)",
            (attack["attack_id"], attack.get("status", "ACTIVE"), attack.get("_ts", 0.0), json.dumps(attack)),
        )
        _prune("attacks", keep_last)
        conn.commit()


def load_attacks(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT payload FROM attacks ORDER BY created_at DESC LIMIT ?", (limit,)
    ).fetchall()
    return [json.loads(r["payload"]) for r in rows]
