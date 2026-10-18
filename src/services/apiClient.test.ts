import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './apiClient';

describe('apiFetch', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('attaches the X-API-Key header when VITE_API_KEY is configured', async () => {
    vi.stubEnv('VITE_API_KEY', 'secret-123');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));

    await apiFetch('http://example.test/api/lab/start', { method: 'POST' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0];
    const headers = init?.headers as Headers;
    expect(headers.get('X-API-Key')).toBe('secret-123');
  });

  it('omits the header when no API key is configured', async () => {
    vi.stubEnv('VITE_API_KEY', '');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));

    await apiFetch('http://example.test/api/status');

    const [, init] = fetchSpy.mock.calls[0];
    const headers = init?.headers as Headers;
    expect(headers.get('X-API-Key')).toBeNull();
  });

  it('preserves caller-supplied headers alongside the API key', async () => {
    vi.stubEnv('VITE_API_KEY', 'secret-123');
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));

    await apiFetch('http://example.test/api/lab/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const [, init] = fetchSpy.mock.calls[0];
    const headers = init?.headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('X-API-Key')).toBe('secret-123');
  });
});
