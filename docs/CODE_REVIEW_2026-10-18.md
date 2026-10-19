# AI-NIDS — Code Review (2026-10-18, post-redesign)

## Why this doc exists

`docs/GAPS_AND_FLAWS.md` (dated the same day) audited the repo as of commit
`4ecbcd5` ("security hardening, sqlite persistence, test suite"). Eleven
commits landed **after** that audit — `9f1c6d5` through `30cc31e`, a full
visual redesign ("phosphor-green-on-black") touching `App.tsx`, every page,
and most components. None of that redesign work has been reviewed until now.
This doc covers what's new or still open; it does not repeat §1/§2 of
`GAPS_AND_FLAWS.md` (the "no real ML/sensor" scope decision — still the
correct, deliberate call and unchanged).

**Verified clean:** `git status` is clean, nothing uncommitted. `.env*`
secrets, `backend/*.db`, and `dist/` are correctly gitignored and untracked.
`backend/pytest` → **20/20 passing**. Frontend `typecheck` / `lint` /
`vitest run` (5/5) / `build` → **all passing**, including on the
post-redesign code. `npm audit --omit=dev` → **0 vulnerabilities**.

---

## Backend — new findings since commit `4ecbcd5`

No backend file actually changed after `4ecbcd5` (`git diff --stat
4ecbcd5..HEAD -- backend` is empty) — these are pre-existing issues the
original audit missed, not regressions.

### High
- **Concurrent/overlapping `/api/lab/start` calls corrupt state.**
  `start_lab_attack` (`backend/main.py:768-898`) never checks whether an
  attack is already running before accepting a new one. A second call while
  one is active overwrites the single global `LabState`
  (`active_scenario`, `attack_start_time`, resets `packets_sent=0`). The
  first attack's DB row is left permanently `ACTIVE` — `auto_stop_attack`
  only completes an attack while `state.active_scenario == scenario`, which
  is now false — and its background `simulate_packet_counter` task is
  orphaned.
- **`_packet_counter_tasks` leaks.** (`backend/main.py:125, 690-707`) A
  counter task that exits because a *different* attack took over is never
  popped from the dict — only an explicit cancel pops it. Repeated
  start/stomp cycles grow this dict unbounded over a long demo session.
- **Threat IDs can collide.** `id = f"ALT-{random.randint(1000, 9999)}"`
  (`backend/main.py:205, 1022, 1092, …`) draws from only 9000 values, no
  collision check. `storage.save_threat` does `INSERT OR REPLACE` keyed on
  `id`, so a collision silently overwrites an unrelated persisted threat,
  and in-memory lists can end up with two distinct objects sharing an id —
  breaking id-based lookups in `resolve_threat` and the frontend.

### Medium
- **`GAPS_AND_FLAWS.md` §4 overstates lock coverage.** It claims a
  `store_lock` guards "all store mutations," but
  `notification_store.add_notification/mark_read/mark_all_read` and
  `event_store.add_event/add_raw_event` are never called under
  `store_lock` — only the attack-store and threat add/resolve paths are.
  Benign today only because nothing `await`s inside those sync methods on
  the single-threaded loop; the doc's claim should be corrected or the lock
  should actually be extended to match it.
- **Blocking SQLite I/O inside async handlers.** Every `storage.save_*`
  call does synchronous disk I/O directly inside `async def` request
  handlers, with no executor offload — a slow write stalls the whole event
  loop and delays WebSocket broadcasts to every connected client.
- **Dead "live" telemetry fields.** `state.detection_rate` (`98.4`) and
  `state.avg_latency_ms` (`184`) (`backend/main.py:142-143`) are set once at
  startup and never recomputed, yet streamed every 1.5s over `/ws/live` as
  if measured live. Should either be computed or explicitly labeled static,
  consistent with the honesty fix already applied elsewhere (§1/§6 of
  `GAPS_AND_FLAWS.md`).

### Low
- `backend/Dockerfile` has no `HEALTHCHECK`, runs as root, and doesn't
  document which env vars (`NIDS_API_KEY`, `NIDS_DB_PATH`) it expects at
  runtime.
- `GET /api/events?limit=` still has no upper-bound validation (previously
  noted as §4.3 in `GAPS_AND_FLAWS.md`; still open, not new).

---

## Frontend — new findings from the redesign (commits `9f1c6d5`..`30cc31e`)

### High
- **Widespread WCAG-failing text contrast.** The new `paper-600` token
  (`#49594F`, `tailwind.config.js:29`) against `ink-900`/`ink-950`
  backgrounds (`#0A0F0C`/`#050806`) measures ~2.6:1 contrast — below WCAG AA
  (4.5:1 normal text, 3:1 large text). It's used **191 times across 33
  files** for actually-read content, not just decorative labels: Topbar
  diagnostics labels (`src/components/layout/Topbar.tsx:146-167`), the
  Sidebar "victim IP" label (`src/components/layout/Sidebar.tsx:115`),
  notification timestamps, etc. This is a real accessibility regression
  introduced by the redesign, not a pre-existing issue.

### Medium
- **`ThreatDetailModal` has no keyboard/focus management.**
  (`src/components/soc/ThreatDetailModal.tsx:44-50`) Marked up correctly
  (`role="dialog"`, `aria-modal="true"`) but no Escape-to-close, no focus
  trap, no focus restoration to the triggering element on close.
- **`RiskGauge`'s `size` prop is dead.**
  (`src/components/common/RiskGauge.tsx:5,9`) Declared and threaded through
  but never used in the render — every caller passing `size="sm"`/`"lg"`
  gets the same fixed size regardless. Flagged by oxlint as unused.
- **Dead imports/vars in `NidsContext.tsx`:** `LabStatus` (line 8),
  `AttackTimelineStage` (line 28), `LAB_SENSOR_IP` (line 43),
  `mockAttackController` (line 45), and a computed-but-unused `sourceDesc`
  (line 801) — leftover scaffolding from the redesign passes.
- **Unused scaffold assets:** `src/assets/hero.png`, `react.svg`,
  `vite.svg` are referenced nowhere in `src/**` — original Vite template
  leftovers, safe to delete.

### Low
- `oxlint` `react/set-state-in-effect` warning on the init/heartbeat effect
  in `NidsContext.tsx:475` — not a functional bug (cleanup via
  `clearInterval` is correct), just a React-pattern nit.
- A few unused-parameter warnings in `mockTelemetry.ts:844`,
  `attackService.ts:321,400` — cosmetic.
- `SettingsPage.handleSave`'s `setTimeout(() => setSaved(false), 3000)`
  (line 53) is never cleared on unmount — harmless (no subscription, just a
  primitive timeout) but worth cleaning up.

### `GAPS_AND_FLAWS.md` §5 claims — re-verified against current (redesigned) code
All still hold: real `react-router-dom` v7 routing (§5.1), error boundaries
wrapping the app and every route (§5.5), `React.lazy` per-page code
splitting confirmed in the production build (§5.6), exponential WebSocket
backoff with jitter (§5.7). Test suite (§5.2/§5.3) is present and passing
but still thin — only `ErrorBoundary.test.tsx` and `apiClient.test.ts` (5
cases total, matching the doc's claimed count). **None of the ~30
components touched by the redesign, `NidsContext`, or any page has test
coverage.**

---

## Documentation — now stale relative to the code

All of `README.md`, `PROJECT_DOCUMENTATION.md/.docx/.pdf`,
`INSTALLATION_AND_RUN_GUIDE.md/.docx/.pdf`, and `GAPS_AND_FLAWS.md` were
last touched **before 2026-10-18 14:20** (commit `4ecbcd5`). The entire
visual redesign landed between **15:03 and 15:33** the same day. None of the
docs — including their screenshots/descriptions of the UI, if any — reflect
current look-and-feel. The `.docx`/`.pdf` exports are additionally stale
relative to their own `.md` sources (file timestamps: `.md` files 2026-10-18
00:04–00:05, `.docx`/`.pdf` 2026-10-17 23:32 — i.e. generated *before* the
last `.md` edit pass, let alone the redesign). `convert_docs.py` exists to
regenerate them but was not re-run after either the 00:04 `.md` edits or the
redesign.

---

## Priority punch list

1. **High** — Fix `paper-600`-on-dark contrast across the 33 affected files
   (either darken-text/lighten-bg the token pair, or introduce a dedicated
   higher-contrast "muted" token for anything that's actually read).
2. **High** — Guard `/api/lab/start` against a second concurrent attack
   (reject with 409, or queue) to stop the state-stomp/orphaned-task/stuck-
   ACTIVE-row failure mode.
3. **Medium** — Make threat IDs collision-safe (`uuid4` or a counter) instead
   of a 9000-value random range.
4. **Medium** — Add focus trap + Escape handling to `ThreatDetailModal`.
5. **Medium** — Pop finished tasks from `_packet_counter_tasks` on natural
   exit, not just on explicit cancel.
6. **Medium** — Either compute `detection_rate`/`avg_latency_ms` for real or
   label them static in the API response, consistent with the existing
   honesty-fix pattern elsewhere.
7. **Low** — Dead-code sweep: `RiskGauge.size`, unused `NidsContext`
   imports/vars, unused Vite-scaffold assets, oxlint warnings.
8. **Decide & act** — Regenerate `PROJECT_DOCUMENTATION`/
   `INSTALLATION_AND_RUN_GUIDE` `.docx`/`.pdf` via `convert_docs.py` (or drop
   them) and refresh `README.md`/`GAPS_AND_FLAWS.md` to reflect the current
   UI, now that the redesign is done.
9. **Deferred, unchanged** — Tailwind v3→v4 migration to clear the remaining
   7 `npm audit` advisories (all dev-toolchain only, 0 in production deps);
   still correctly deferred as a deliberate, scoped migration rather than a
   drive-by `--force` fix.
