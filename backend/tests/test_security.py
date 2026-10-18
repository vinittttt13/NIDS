"""Unit tests for security.py's auth/rate-limit dependencies, exercised
directly against constructed Starlette Request objects so the loopback-bypass
and rate-limit behavior is deterministic regardless of how a test client
reports its own host (FastAPI's TestClient identifies as "testclient", not a
real loopback address)."""

import os

import pytest
from fastapi import HTTPException
from starlette.requests import Request

import security


def make_request(client_host: str) -> Request:
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [],
        "client": (client_host, 12345),
    }
    return Request(scope)


def test_require_api_key_rejects_wrong_key(monkeypatch):
    monkeypatch.setenv("NIDS_API_KEY", "correct-key")
    with pytest.raises(HTTPException) as exc:
        security.require_api_key(make_request("10.0.0.9"), x_api_key="wrong-key")
    assert exc.value.status_code == 401


def test_require_api_key_accepts_correct_key(monkeypatch):
    monkeypatch.setenv("NIDS_API_KEY", "correct-key")
    # Should not raise
    security.require_api_key(make_request("10.0.0.9"), x_api_key="correct-key")


def test_require_api_key_without_configured_key_allows_loopback(monkeypatch):
    monkeypatch.setenv("NIDS_API_KEY", "")
    security.require_api_key(make_request("127.0.0.1"), x_api_key=None)
    security.require_api_key(make_request("localhost"), x_api_key=None)


def test_require_api_key_without_configured_key_rejects_lan_client(monkeypatch):
    monkeypatch.setenv("NIDS_API_KEY", "")
    with pytest.raises(HTTPException) as exc:
        security.require_api_key(make_request("10.0.0.9"), x_api_key=None)
    assert exc.value.status_code == 503


def test_rate_limit_allows_under_threshold(monkeypatch):
    monkeypatch.setenv("NIDS_RATE_LIMIT_MAX", "3")
    monkeypatch.setenv("NIDS_RATE_LIMIT_WINDOW", "10")
    security.reset_rate_limit_state()
    req = make_request("10.0.0.5")
    for _ in range(3):
        security.enforce_rate_limit(req)  # should not raise


def test_rate_limit_blocks_over_threshold(monkeypatch):
    monkeypatch.setenv("NIDS_RATE_LIMIT_MAX", "3")
    monkeypatch.setenv("NIDS_RATE_LIMIT_WINDOW", "10")
    security.reset_rate_limit_state()
    req = make_request("10.0.0.6")
    for _ in range(3):
        security.enforce_rate_limit(req)
    with pytest.raises(HTTPException) as exc:
        security.enforce_rate_limit(req)
    assert exc.value.status_code == 429
