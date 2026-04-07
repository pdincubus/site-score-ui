import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, setOnUnauthorized } from './client';

describe('apiFetch', () => {
    afterEach(() => {
        setOnUnauthorized(null);
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
    });

    it('calls unauthorized handler on 401 responses', async () => {
        const unauthorizedSpy = vi.fn();
        setOnUnauthorized(unauthorizedSpy);

        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'content-type': 'application/json' }
            })
        );

        await expect(apiFetch('/projects')).rejects.toThrow('Unauthorized');
        expect(unauthorizedSpy).toHaveBeenCalledTimes(1);
    });

    it('calls unauthorized handler on 403 responses', async () => {
        const unauthorizedSpy = vi.fn();
        setOnUnauthorized(unauthorizedSpy);

        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ error: 'Forbidden' }), {
                status: 403,
                headers: { 'content-type': 'application/json' }
            })
        );

        await expect(apiFetch('/projects')).rejects.toThrow('Forbidden');
        expect(unauthorizedSpy).toHaveBeenCalledTimes(1);
    });

    it('sends credentials and json body when bodyJson is provided', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            })
        );

        await apiFetch('/auth/login', {
            method: 'POST',
            bodyJson: { email: 'user@example.com', password: 'secret' }
        });

        const [, options] = fetchSpy.mock.calls[0] ?? [];
        expect(options).toMatchObject({
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({ email: 'user@example.com', password: 'secret' })
        });
    });

    it('throws a clear error when VITE_API_BASE_URL is missing', async () => {
        vi.resetModules();
        vi.stubEnv('VITE_API_BASE_URL', '');

        const { apiFetch: apiFetchWithMissingBaseUrl } = await import('./client');

        await expect(apiFetchWithMissingBaseUrl('/projects')).rejects.toThrow(
            'Missing VITE_API_BASE_URL environment variable'
        );
    });

    it('uses fallback error message for non-json failures', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response('Server exploded', {
                status: 500,
                headers: { 'content-type': 'text/plain' }
            })
        );

        await expect(apiFetch('/projects')).rejects.toThrow('Request failed');
    });
});
