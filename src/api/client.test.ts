import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, setOnUnauthorized } from './client';
import type { PaginatedResponse, Project, Report, ReportGroupTrend } from '../types/api';

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

    it('routes the production Render API base URL through the same-origin proxy', async () => {
        vi.resetModules();
        vi.stubEnv('PROD', true);
        vi.stubEnv('VITE_API_BASE_URL', 'https://site-score-api.onrender.com');

        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            })
        );
        const { apiFetch: productionApiFetch } = await import('./client');

        await productionApiFetch('/auth/me');

        expect(fetchSpy).toHaveBeenCalledWith(
            '/api/auth/me',
            expect.objectContaining({
                credentials: 'include'
            })
        );
    });

    it('throws a clear error when VITE_API_BASE_URL is missing', async () => {
        vi.resetModules();
        vi.stubEnv('VITE_API_BASE_URL', '');

        const { apiFetch: apiFetchWithMissingBaseUrl } = await import('./client');

        await expect(apiFetchWithMissingBaseUrl('/projects')).rejects.toThrow(
            'Missing VITE_API_BASE_URL environment variable'
        );
    });

    it('serves representative visual report data from the local mock API', async () => {
        vi.resetModules();
        vi.stubEnv('VITE_API_BASE_URL', '/mock-api');

        const { apiFetch: mockApiFetch } = await import('./client');

        const projectResponse =
            await mockApiFetch<PaginatedResponse<Project>>('/projects');
        const reportResponse = await mockApiFetch<PaginatedResponse<Report>>(
            '/projects/project-crayons-code/reports'
        );
        const trendResponse = await mockApiFetch<ReportGroupTrend[]>(
            '/projects/project-crayons-code/report-group-trends'
        );
        const latestReport = reportResponse.data[0];
        const mobileTrend = trendResponse.find((trend) => trend.groupId === 'group-home-mobile');

        expect(projectResponse.data[0]?.name).toBe('Crayons & Code');
        expect(latestReport?.insights?.metrics.pageWeight?.value).toBeGreaterThan(0);
        expect(latestReport?.insights?.opportunities.length).toBeGreaterThan(0);
        expect(latestReport?.insights?.auditRefs?.length).toBeGreaterThan(0);
        expect(latestReport?.insights?.userTimings?.length).toBeGreaterThan(0);
        expect(latestReport?.comparison?.scores.performanceScore).not.toBe(0);
        expect(latestReport?.comparison?.userTimings?.length).toBeGreaterThan(0);
        expect(mobileTrend?.points.map((point) => point.title)).toEqual([
            'Homepage mobile - May baseline',
            'Homepage mobile - June baseline',
            'Homepage mobile - July snapshot'
        ]);
    });

    it('serves a low-scoring client project with a clearer improvement trend', async () => {
        vi.resetModules();
        vi.stubEnv('VITE_API_BASE_URL', '/mock-api');

        const { apiFetch: mockApiFetch } = await import('./client');

        const projectResponse =
            await mockApiFetch<PaginatedResponse<Project>>('/projects');
        const trendResponse = await mockApiFetch<ReportGroupTrend[]>(
            '/projects/project-harbour-homeware/report-group-trends?groupId=group-harbour-home-mobile'
        );
        const reportResponse = await mockApiFetch<PaginatedResponse<Report>>(
            '/projects/project-harbour-homeware/reports?groupId=group-harbour-home-mobile&sort=createdAt&order=asc'
        );
        const mobileTrend = trendResponse[0];

        expect(projectResponse.data.map((project) => project.name)).toContain('Harbour Homeware');
        expect(mobileTrend?.points.map((point) => point.performanceScore)).toEqual([
            28,
            36,
            48,
            61
        ]);
        expect(mobileTrend?.points.map((point) => point.agenticBrowsingScore)).toEqual([
            42,
            49,
            58,
            67
        ]);
        expect(reportResponse.data[0]?.comparison).toBeNull();
        expect(reportResponse.data[3]?.comparison?.scores.performanceScore).toBe(13);
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

    it('includes request context on failed API responses', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ error: 'Something went wrong' }), {
                status: 500,
                headers: { 'content-type': 'application/json' }
            })
        );

        await expect(apiFetch('/projects')).rejects.toMatchObject({
            name: 'ApiRequestError',
            message: 'Something went wrong',
            path: '/projects',
            status: 500
        });
    });

    it('does not call unauthorized handler for non-auth errors', async () => {
        const unauthorizedSpy = vi.fn();
        setOnUnauthorized(unauthorizedSpy);

        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ error: 'Bad request' }), {
                status: 400,
                headers: { 'content-type': 'application/json' }
            })
        );

        await expect(apiFetch('/projects')).rejects.toThrow('Bad request');
        expect(unauthorizedSpy).not.toHaveBeenCalled();
    });

    it('does not set content-type when bodyJson is not provided', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            })
        );

        await apiFetch('/projects', { method: 'GET' });

        const [, options] = fetchSpy.mock.calls[0] ?? [];
        const headers = new Headers(options?.headers);
        expect(headers.has('content-type')).toBe(false);
    });
});
