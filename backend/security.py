"""
Authentication and rate-limiting primitives for the AI-NIDS backend.

Design notes (see docs/GAPS_AND_FLAWS.md §3.1 / §3.3):
- State-mutating endpoints require an `X-API-Key` header matching NIDS_API_KEY.
- As a convenience for the single-laptop / localhost demo workflow, a request
  with NO API key configured on the server is still allowed through *only*
  when it originates from the loopback interface. Any non-loopback (LAN)
  client is always rejected once a key is required, so the moment this is
  reachable from another machine it is no longer silently wide open.
- A small in-memory sliding-window limiter guards the same endpoints against
  being hammered by a single client.

Both read their configuration from os.environ lazily (inside the functions),
not at import time, so it does not matter whether this module is imported
before or after main.py finishes loading the .env file.
"""

import os
import time
from collections import defaultdict, deque
from typing import Deque, Dict

from fastapi import Header, HTTPException, Request, status

LOOPBACK_HOSTS = {"127.0.0.1", "::1", "localhost"}

_request_log: Dict[str, Deque[float]] = defaultdict(deque)


def _get_api_key() -> str:
    return os.getenv("NIDS_API_KEY", "").strip()


def require_api_key(request: Request, x_api_key: str = Header(default=None, alias="X-API-Key")) -> None:
    """FastAPI dependency: guards every state-mutating endpoint."""
    configured_key = _get_api_key()
    client_host = request.client.host if request.client else ""
    is_loopback = client_host in LOOPBACK_HOSTS

    if not configured_key:
        if is_loopback:
            return
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "NIDS_API_KEY is not configured on the server. Control endpoints are "
                "only reachable from localhost until an API key is set (see README "
                "'Security & Authentication')."
            ),
        )

    if not x_api_key or x_api_key != configured_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing X-API-Key header.",
        )


def enforce_rate_limit(request: Request) -> None:
    """FastAPI dependency: simple sliding-window rate limit keyed by client IP."""
    window_seconds = float(os.getenv("NIDS_RATE_LIMIT_WINDOW", "10"))
    max_requests = int(os.getenv("NIDS_RATE_LIMIT_MAX", "20"))

    client_ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    bucket = _request_log[client_ip]

    while bucket and now - bucket[0] > window_seconds:
        bucket.popleft()

    if len(bucket) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded: max {max_requests} requests per {window_seconds:.0f}s.",
        )

    bucket.append(now)


def reset_rate_limit_state() -> None:
    """Test helper: clears the in-memory rate-limit buckets between test cases."""
    _request_log.clear()
