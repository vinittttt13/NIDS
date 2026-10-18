/**
 * Thin wrapper around fetch() that attaches the X-API-Key header (from
 * VITE_API_KEY) to every request. The backend now requires this header on
 * state-mutating endpoints (lab start/stop, threat resolve/inject,
 * notifications) — see docs/GAPS_AND_FLAWS.md §3.1. GET requests don't need
 * it, but sending it is harmless, so every call goes through here.
 */
export function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const apiKey = import.meta.env.VITE_API_KEY as string | undefined;
  const headers = new Headers(init.headers);
  if (apiKey) {
    headers.set('X-API-Key', apiKey);
  }
  return fetch(input, { ...init, headers });
}
