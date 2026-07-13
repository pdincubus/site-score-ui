import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDashboard } from './dashboard';

describe('dashboard API', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('gets recent workspace activity', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ clients: [], projects: [], results: [] }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            })
        );

        await getDashboard();

        expect(String(fetchSpy.mock.calls[0]?.[0])).toContain('/dashboard');
        expect(fetchSpy.mock.calls[0]?.[1]).toMatchObject({
            credentials: 'include'
        });
    });
});
