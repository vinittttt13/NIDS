> **Status (2026-10-18): remediation pass complete.** Every item below has a
> ✅/🟡/⏭️ marker showing what was actually done. Summary: §3 (security), §4
> (persistence/races), §5 (frontend architecture/tests), §6 (honesty/docs),
> and most of §7 (tooling) are fixed and verified (backend: 20 pytest cases
> passing; frontend: typecheck + vitest + production build all green). §1/§2
> (no real ML/sensor) were deliberately left as a **documentation-honesty
> fix** rather than building an actual trained classifier — see the note at
> the top of each. Deferred items are called out individually with why.

# AI-NIDS — Gap & Flaw Analysis

Scope: full repository at `E:\FINAL YEAR AASTHA\AI_NIDS` — `backend/main.py` (FastAPI), the Vite/React/TypeScript frontend under `src/`, config, env files, and the two ad-hoc test scripts. Analysis performed by direct code reading, not static-analysis tooling.

Severity legend: **Critical** (breaks the core claim of the product or is a real security exposure) · **High** (functional/architectural gap that will bite in real use) · **Medium** (correctness/maintainability issue) · **Low** (polish / nice-to-have).

---

## 1. The core premise — "AI-based intrusion detection" — isn't real

> **Resolution: 🟡 honesty fix applied, not rebuilt.** Per explicit scope decision, this was not turned into a real trained classifier (a separate, substantial ML-engineering project). Instead: `/api/model`, `/api/sensor/status`, `/api/ai/status`, `/api/diagnostics` now all return `"simulated": true` plus plain-language notes; every scripted threat (seed data, `simulate_detection_pipeline`, manual inject) is tagged `"simulated": true`; README leads with an explicit disclosure instead of "Authoritative … XGBoost Sensor Stream".

| # | Finding | Evidence |
|---|---|---|
| 1.1 | There is **no machine-learning model anywhere in the repo**. No `.pkl`/`.joblib`/`.onnx`/`.h5` file, no training script, no scikit-learn/xgboost import. The backend's only Python dependencies are `fastapi`, `uvicorn`, `pydantic`, `websockets`, `psutil` (`backend/requirements.txt`). | `backend/requirements.txt`; repo-wide search for model artifacts returns nothing. |
| 1.2 | All "XGBoost v1.4.2", "98.4% accuracy", "Isolation Forest" figures are **hardcoded literals**, not computed from any data. | `backend/main.py:1153-1169` (`/api/model`), `src/services/liveTelemetry.ts:525-547` (`getModelStats` fallback literals). |
| 1.3 | Threat detections in the only mode that does anything (`DEMO`/`HYBRID`) are **pre-written canned payloads keyed by attack-scenario name** (`if scenario == "DDOS_DISTRIBUTED_FLOOD": … elif scenario == "DOS_SYN_FLOOD": …`), not inference over observed traffic. | `backend/main.py:923-1113` (`simulate_detection_pipeline`). |
| 1.4 | In `LIVE` mode — the mode the README presents as the real deployment target — `sensor_mode` defaults to `NOT_CONFIGURED` and **no detection pipeline runs at all**; the project's own test script explicitly documents "Expected 0 in LIVE mode". | `backend/main.py:110-119`; `test_lab_event_flow.py:80-84` ("Recent Security Detections Count … Expected 0 in LIVE mode"). |
| 1.5 | Frontend "AI inference" and "feature" views are stubs returning fixed data regardless of real traffic: `getAiInference()` always returns the same 99.1% BENIGN classification; `getActiveConnections()` and `getHosts()` always return `[]`. | `src/services/liveTelemetry.ts:419-425`, `549-568`. |
| 1.6 | The "XAI explainability" factors (`xaiFactors` with weights/baselines) shown per-threat are literal strings baked into each canned scenario object — there is no explainability engine, no SHAP/LIME, nothing computed. | `backend/main.py:298-303`, `949-1112`. |

**Net effect:** this is a **UI/UX simulation of a NIDS SOC dashboard**, not a working intrusion-detection system. That may be acceptable for a final-year project demo, but the README and in-app copy ("Authoritative … XGBoost v1.4 Sensor Stream", "Pre-trained model loaded on PC 2 detection server") state it as if it is real, which is itself a documentation/communication gap (see §6).

---

## 2. No real packet capture / network sensor

> **Resolution: 🟡 honesty fix applied, not built.** Same scope decision as §1. `state.packets_sent` is no longer a permanently-dead field (§2.2 fix below under §3), and `/api/sensor/status` now labels its backend as "NOT IMPLEMENTED — see docs/GAPS_AND_FLAWS.md §2" instead of claiming Zeek/Scapy are running. Real packet capture remains unbuilt — this is still a UX simulation, now an honestly-labeled one.

| # | Finding | Evidence |
|---|---|---|
| 2.1 | There is no packet-capture code anywhere (no `scapy`, `pyshark`, `dpkt`, raw sockets, or `zeek`/`suricata` integration), despite the README and `/api/sensor/status` claiming "Zeek Flow Ingestion / Scapy Wi-Fi Sniffer". | `backend/requirements.txt` (no capture libs); `backend/main.py:1236-1256` (`sensor` field is a hardcoded string). |
| 2.2 | `state.packets_sent` is initialized to `0`, reset to `0` on attack start, and **never incremented anywhere** in the codebase, yet it's surfaced to the UI as `packetsSent` / `packetsCaptured` and implied to reflect real capture volume. | `backend/main.py:104`, `551`, `645`, `1249-1250` (no other assignment exists). |
| 2.3 | `LAB_DDOS_SOURCES` builds IPs via string concatenation on a single dotted-quad (`f"{LAB_ATTACKER_IP}.1"`), e.g. `"10.64.157.140.1"` — this is not a valid IPv4 address. Cosmetic only (never parsed as an IP), but shows the "4-node bot cluster" is purely decorative text. | `backend/main.py:83-88`. |
| 2.4 | "Stage 4 — Full Physical Sensor Deployment (SPAN Mirroring)" in the README describes a Zeek/Suricata + feature-extractor + classifier pipeline that **does not exist in the codebase at all** — it's aspirational documentation for unbuilt work. | `README.md:60-63`. |

---

## 3. Security / hardening gaps in the backend

> **Resolution: ✅ fixed.** §3.1 API-key auth (`backend/security.py`, fail-closed except loopback-when-unconfigured) now guards every mutating endpoint; frontend sends it automatically (`src/services/apiClient.ts`). §3.2 CORS restricted to `NIDS_CORS_ORIGINS`, `allow_credentials=False`. §3.3 rate limiting via `enforce_rate_limit` (sliding window, configurable). §3.4 `.env`/`.env.pc1`/`.env.pc2` untracked from git (`git rm --cached`) and gitignored; `.env.example` is now complete and the only tracked template. §3.5 target allow-list now derives purely from env vars, no stray literal IP. §3.6/§3.7 scenario input is now validated against a `Literal` enum (422 on anything else) with length/range limits on the free-text inject endpoint; plaintext-only transport is unchanged (documented, out of scope for a lab LAN). All verified by `backend/tests/test_security.py` + `test_api.py` (20 passing).

| # | Finding | Severity | Evidence |
|---|---|---|---|
| 3.1 | **Zero authentication or authorization** on any endpoint. Anyone who can reach the host/port (explicitly bound to `0.0.0.0:8000`) can start/stop "attacks", resolve threats, inject fake threats, and read all internal state. | Critical | `backend/main.py:46-59` (no auth dependency anywhere), all `@app.post`/`@app.get` handlers. |
| 3.2 | CORS is wide open: `allow_origins=["*"]` combined with `allow_credentials=True`. Browsers reject this combination for credentialed requests, but it still signals "no origin restriction was designed in," and if anyone later adds cookies/session auth this configuration becomes actively dangerous. | High | `backend/main.py:52-59`. |
| 3.3 | No rate limiting on any endpoint. `/api/threats/inject` and `/api/lab/start` can be hit in a tight loop by any LAN client to spam the in-memory stores or flood the WebSocket broadcast to all connected clients. | Medium | `backend/main.py:616-745`, `860-896`. |
| 3.4 | `.env` (containing real LAN IPs for the "isolated lab") is **committed to git and not in `.gitignore`** — only `.env.local` is ignored. `.env`, `.env.pc1`, `.env.pc2`, `.env.example` are all tracked and already pushed to the public GitHub remote (`origin https://github.com/Salman99A/AI_NIDS`). Low sensitivity today (private-range IPs), but it's the wrong pattern and will bite the moment real credentials/secrets are added to `.env`. | Medium | `git ls-files | grep env` → `.env`, `.env.pc1`, `.env.pc2`, `.env.example`; `.gitignore` only excludes `.env.local`. |
| 3.5 | The "safe laboratory target" allow-list in `/api/lab/start` is an ad-hoc set of hardcoded strings (`{LAB_TARGET_IP, state.sensor_ip, "10.64.157.145", "127.0.0.1", "localhost"}`), mixing env-derived and literal IPs from a different subnet than the one actually configured (`10.64.157.0/24` vs. literal `10.64.157.145` baked in twice). Changing `.env` to a different lab subnet silently reintroduces the old literal IP as an always-allowed target. | Medium | `backend/main.py:620-625`. |
| 3.6 | `attackType` / `scenario` strings from the request body are logged and echoed back without sanitization (`logger.info(f"... {req.scenario} ...")`, `json.dumps(control_event, default=str)`). Not a classic injection (Python logging, not SQL/shell), but unvalidated free-text from the network is written straight into logs and broadcast to all WebSocket clients — log-injection / spoofed-event risk if this is ever exposed beyond a trusted LAN. | Low | `backend/main.py:712-715`, `860-896`. |
| 3.7 | No HTTPS/WSS anywhere — all traffic (REST + WebSocket) is plaintext `http://` / `ws://`, acceptable for an isolated lab but worth calling out since `.env` files already show real campus/home Wi-Fi IPs (`10.64.157.x`), i.e. this has already been run on a shared network, not a truly isolated one. | Medium | `.env`, `.env.pc1`, `.env.pc2`; `src/services/liveTelemetry.ts:69-77`. |

---

## 4. State management & data-integrity gaps

> **Resolution: ✅ fixed.** §4.1 added `backend/storage.py` (SQLite, write-through on every mutation, loaded back on startup) — events/threats/notifications/attack-history now survive a restart. §4.2 `reload=True` is gated behind `NIDS_DEV_RELOAD` (default off); the documented run command no longer auto-reloads. §4.3 left as-is (low priority, store caps already bound memory). §4.4 left as-is (cosmetic eviction-order nitpick, not worth the complexity it'd add). §4.5 added `store_lock` (`asyncio.Lock`) around all store mutations, and `complete_attack` now prefers an exact `attack_id` match before falling back to scenario-matching, closing the overlapping-attacks race.

| # | Finding | Severity | Evidence |
|---|---|---|---|
| 4.1 | **All server state is process-memory only** (`EventStore`, `LabAttackStore`, `NotificationStore` are plain Python lists). Restarting `main.py` (or the `reload=True` dev auto-reloader triggering) wipes every event, threat, notification and attack-history record with no persistence layer (no DB, no file, no cache). | High | `backend/main.py:122-279`, `1340-1343` (`uvicorn.run(..., reload=True)` in "production" entrypoint). |
| 4.2 | `uvicorn.run("main:app", ..., reload=True)` is hardcoded in the `__main__` block — this is a **dev-server setting left in what's documented as the production/deployment entrypoint** (`python main.py` in the README's "Startup Instructions"). `reload=True` spawns a file-watcher subprocess and is not meant for any real deployment. | Medium | `backend/main.py:1340-1343`; `README.md:140-146`. |
| 4.3 | Threat/event/notification stores all cap themselves by silently dropping the oldest entry past a fixed limit (500 events, 200 threats, 100 notifications) — fine as a safeguard, but there is no way to query older history, no pagination, and `GET /api/events?limit=` has no upper bound validation (a client can request an arbitrarily large `limit` with no 400/422, though it's capped anyway by store size). | Low | `backend/main.py:146-148`, `166-168`, `256-258`, `837-839`. |
| 4.4 | `WebSocketMessage` deduplication on the frontend uses an in-memory `Set<string>` capped at 1000 entries with FIFO-ish eviction via `.values().next().value` — this evicts an effectively **arbitrary** entry (insertion order of a `Set` is preserved, so it is actually the oldest, but the eviction only removes one entry per message even though many could already be stale), meaning under sustained load the dedup window silently shrinks in effectiveness well before 1000 distinct IDs are truly "old enough" to drop. | Low | `src/services/liveTelemetry.ts:136-147`. |
| 4.5 | No optimistic/pessimistic concurrency control anywhere — e.g., `resolve_threat` mutates threats found by a linear scan with no locking; under concurrent requests (two SOC operators resolving the same alert at once) there is a benign but unguarded race, and `lab_attack_store.complete_attack` can match on `scenario` + `status == ACTIVE"` which could resolve the **wrong** concurrently-running attack of the same type if duration windows overlap (no mutex / attack-id hard requirement). | Medium | `backend/main.py:173-182`, `215-226`. |

---

## 5. Frontend architecture gaps

> **Resolution: ✅ mostly fixed, 2 left as-is.** §5.1 added `react-router-dom`; `App.tsx` now uses real routes (deep-linking, back/forward, role-based redirects via `useEffect`+`navigate`). §5.2/§5.3 added a real pytest suite (`backend/tests/`, 20 cases) and a vitest + React Testing Library suite (`src/**/*.test.ts(x)`, 5 cases); the old manual scripts are archived in `docs/archive/*.manual.py` with notes on what superseded them. §5.4 added `.github/workflows/ci.yml` (lint+typecheck+test+build for frontend, pytest for backend). §5.5 added `src/components/common/ErrorBoundary.tsx`, wrapping the whole app and each routed page. §5.6 pages are now `React.lazy`-loaded — the production build confirms separate per-page chunks instead of one bundle. §5.7 WebSocket reconnect now backs off exponentially (1s→30s cap, jittered) instead of a fixed 4s forever. §5.8 left as-is (minor UX nicety, not worth the added surface right now).

| # | Finding | Severity | Evidence |
|---|---|---|---|
| 5.1 | **No routing library** (`react-router` etc. is absent from `package.json`). Navigation between the 9 "pages" is done via `useState<NavPage>` in `App.tsx`. This means: no deep-linking, no shareable URLs, no back/forward-button support, and a full page reload always drops the user back to the default page. | High | `package.json` deps list; `src/App.tsx:24-83`. |
| 5.2 | **No automated tests of any kind** for the frontend (`package.json` has no `vitest`, `jest`, `@testing-library/*`, or `playwright`/`cypress`). `"lint"` only runs `oxlint`; there is no `"test"` script at all. | High | `package.json:6-11`. |
| 5.3 | The two Python test files (`test_lab_event_flow.py`, `test_lab_persisted_flow.py`) are **manual smoke scripts**, not a test suite: no `pytest`, no `assert`, no CI integration, no fixtures/teardown — they just `print()` observed values and rely on a human reading stdout to judge pass/fail (the only "ALL VERIFICATIONS PASSED" line is unconditional, printed after the script merely finishes running, not after verifying any condition). | High | `test_lab_event_flow.py:86` (printed unconditionally at the end, not gated on any assertion). |
| 5.4 | No CI/CD configuration anywhere (no `.github/workflows`, no `azure-pipelines.yml`, etc.) — nothing runs lint/build/tests automatically on push or PR. | Medium | Repo-wide file listing. |
| 5.5 | No error boundaries anywhere in the React tree — an uncaught render error in any page/component white-screens the entire app with no fallback UI. | Medium | No `componentDidCatch` / `ErrorBoundary` found in `src/`. |
| 5.6 | No code-splitting / lazy loading (`React.lazy`, dynamic `import()`) despite 9 distinct pages and a sizeable component tree (~8.2k LOC) — everything ships in one bundle. | Low | `src/App.tsx:9-18` (static imports only). |
| 5.7 | Reconnect logic for the WebSocket is a fixed 4-second timer with **no backoff and no cap on retry attempts** — a backend that's down for an extended period causes indefinite reconnect storms of one client per 4s, which is harmless at demo scale but is a known anti-pattern. | Low | `src/services/liveTelemetry.ts:118-125`. |
| 5.8 | Client role / mode are read from `localStorage` with a same-key fallback chain (URL param → localStorage → env var → default) but there's no UI affordance to see *which* of those four sources is currently winning, which will confuse anyone debugging why a role "won't change" after editing `.env`. | Low | `src/context/NidsContext.tsx:148-201`. |

---

## 6. Documentation / honesty gaps

> **Resolution: ✅ fixed.** §6.1 README rewritten to lead with an explicit "what this project actually is" disclosure; API responses carry the same disclosure (see §1). §6.2 `PROJECT_DOCUMENTATION.md`/`INSTALLATION_AND_RUN_GUIDE.md` now each carry a source-of-truth note pointing at `convert_docs.py` for regeneration and at `README.md`/this file for the maintained, accurate version — the `.docx`/`.pdf` copies themselves were left in place (not deleted) since they may be a submission deliverable; that's a call for you to make, not one this pass made unilaterally. §6.3/§6.4 `walkthrough.md`, `walkthrough1`, and `implementation_plan.md` moved into `docs/archive/` instead of sitting at repo root. §6.5 README/`.env.example`/the Sidebar's hardcoded footer IP are now all consistent (either a single placeholder scheme or pulled live from `getLabTargetIp()`), and the live `.env`/`.env.pc1`/`.env.pc2` files were left on their real working values rather than overwritten.

| # | Finding | Severity | Evidence |
|---|---|---|---|
| 6.1 | README section "8. Honest UI Indicators" explicitly brands the app as practicing "honest operational reporting," yet `/api/model`, `/api/sensor/status`, and `/api/ai/status` emit confident, specific operational claims ("XGBoost v1.4.2 (78-Feature Vector)", "Pre-trained model loaded on PC 2 detection server", accuracy to one decimal place) **even when there is no model and no sensor behind them.** This is the single biggest gap between how the project presents itself and what it actually does. | High | `README.md:160-166` vs. `backend/main.py:1153-1269`. |
| 6.2 | Three separate, redundant copies of the same documentation exist in three formats (`PROJECT_DOCUMENTATION.md/.docx/.pdf`, `INSTALLATION_AND_RUN_GUIDE.md/.docx/.pdf`) plus a `convert_docs.py` script to regenerate them. Binary `.docx`/`.pdf` build artifacts are committed to source control, which bloats the repo and will drift out of sync with the `.md` sources over time (no generation step is wired into CI). | Medium | Root directory listing; `convert_docs.py`. |
| 6.3 | `walkthrough1` (no extension) sits at repo root alongside `walkthrough.md` — unclear purpose, not referenced from README, looks like an accidental/duplicate artifact left over from editing. | Low | Root directory listing. |
| 6.4 | `implementation_plan.md` is a planning document committed at the repo root rather than under `docs/`, mixed in with runtime config and source — no clear separation between "docs for contributors/users" and "scratch planning notes." | Low | Root directory listing. |
| 6.5 | The README's safety callout says targeting is restricted to `LAB_TARGET_HOST=192.168.100.20`, but every `.env*` file in the repo actually uses `10.64.157.145`, and the backend's hardcoded fallback/allow-list literal is yet a third value family mixed with env vars (§3.5) — three different "source of truth" target IPs across README / env files / code defaults. | Medium | `README.md:32`; `.env:1-12`; `backend/main.py:78`, `620`. |

---

## 7. Dependency / tooling gaps

> **Resolution: ✅ mostly fixed, 1 deferred.** §7.1 `backend/requirements.txt` now pins exact versions (matching what's actually tested in CI); `backend/requirements-dev.txt` adds pytest/httpx. §7.2 added `backend/Dockerfile`, root `Dockerfile`, and `docker-compose.yml` for a reproducible one-command run. §7.3 added `npm run typecheck` (`tsc -b`) wired into CI alongside lint/test/build. §7.4 the `psutil`-missing fallback now reports `DEGRADED_NO_PSUTIL` instead of fabricating two fake "Connected" interfaces. **Deferred**: `npm audit` still flags 7 moderate/high advisories, all inside the Tailwind v3 build toolchain (`braces`/`postcss-selector-parser` via `tailwindcss`→`chokidar`); the fix is a Tailwind v3→v4 migration, which is a real breaking change across every component's utility classes and out of scope for this pass — `npm audit fix --force` was deliberately *not* run. (Separately, a critical `vitest`/`tinypool` RCE advisory that showed up while adding the test tooling *was* fixed, by pinning `vitest`/`@vitest/ui` to latest — 0 vulnerabilities in production dependencies per `npm audit --omit=dev`.)

| # | Finding | Severity | Evidence |
|---|---|---|---|
| 7.1 | No pinned/locked Python dependency versions — `requirements.txt` uses only `>=` floors (`fastapi>=0.110.0`, etc.) with no `requirements.lock`/`poetry.lock`/`pip-compile` output, so a fresh `pip install` months from now can silently pull breaking major versions. | Medium | `backend/requirements.txt`. |
| 7.2 | No Python virtual-env or Docker setup committed — the README's install instructions (`pip install -r requirements.txt`) install straight into whatever interpreter is active, with no `venv`/`docker-compose` to keep PC 1 / PC 2 environments reproducible, despite the project's whole premise being a two-machine deployment. | Medium | `README.md:140-146`; no `Dockerfile`/`docker-compose.yml`/`venv` instructions anywhere. |
| 7.3 | `oxlint` is used for linting but there's no corresponding `.oxlintrc.json` rule customization beyond defaults worth noting, and more importantly there is **no TypeScript `strict` check wired into CI** and no `tsc --noEmit` pre-commit/pre-push hook — type errors are only caught at `npm run build` time. | Low | `.oxlintrc.json`; `package.json` scripts. |
| 7.4 | `psutil` is an optional dependency (`try/except ImportError`) with a fallback path that fabricates two fake network interfaces (`"Wi-Fi Adapter"`, `"Ethernet Adapter"`) when it's missing — meaning on a machine without `psutil` installed, `/api/network/interfaces` **silently lies** about having real interfaces rather than reporting degraded capability. | Medium | `backend/main.py:37-41`, `475-483`. |

---

## 8. Summary — what to prioritize

All six original priorities below are now done (see the per-section resolution notes above for specifics and the files touched):

1. ✅ **Decided and stated clearly what this project is** — README and every relevant API response now disclose the simulated nature explicitly (§6.1). `LIVE` mode was deliberately *not* turned into a real NIDS (separate ML-engineering effort, out of scope for this pass).
2. ✅ **Added auth** — `X-API-Key` required on every control endpoint, loopback-only when unconfigured (§3.1).
3. ✅ **Stopped committing `.env`** — untracked via `git rm --cached`, gitignored going forward (§3.4). Note: this does **not** remove it from existing git history; if these values need to be purged from history too (e.g. before making the repo public), that needs a separate history-rewrite (`git filter-repo` or BFG) and a force-push, which is a deliberately destructive operation this pass did not take without your explicit go-ahead.
4. ✅ **Added a real test suite + CI** — `backend/tests/` (pytest, 20 cases) and `src/**/*.test.ts(x)` (vitest, 5 cases), both wired into `.github/workflows/ci.yml` (§5.2-§5.4).
5. ✅ **Added persistence** — SQLite via `backend/storage.py` (§4.1).
6. ✅ **Fixed `reload=True`** — now opt-in via `NIDS_DEV_RELOAD` (§4.2).

### What's left for you to decide (not code fixes — judgment calls)

- **Review and commit the staged changes.** Everything in this pass is staged/edited locally but not committed — review `git status`/`git diff` yourself before committing, especially the `.env*` removals.
- **Rotate the API key** in `.env`/`.env.pc1`/`.env.pc2` before any real deployment beyond this machine — the value currently in those files was generated during this session and is also printed earlier in this conversation.
- **Decide the fate of the committed `.docx`/`.pdf` duplicates** (§6.2) — left in place since they may be a submission deliverable; regenerate them from the `.md` sources with `python convert_docs.py` if you've edited the `.md` files, or remove them if they're not needed.
- **Tailwind v3→v4 migration** (§7, deferred) — only worth doing deliberately, with time to re-check every component's classes, not as a drive-by `npm audit fix --force`.
