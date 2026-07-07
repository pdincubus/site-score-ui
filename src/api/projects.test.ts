import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    getProjectById,
    getProjectReports,
    getProjects,
    updateReport
} from './projects';
import { setOnUnauthorized } from './client';

function mockPaginatedResponse() {
    return new Response(
        JSON.stringify({
            data: [],
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0
            }
        }),
        {
            status: 200,
            headers: { 'content-type': 'application/json' }
        }
    );
}

describe('project API helpers', () => {
    afterEach(() => {
        setOnUnauthorized(null);
        vi.restoreAllMocks();
    });

    it('clamps unsafe pagination values before building project list requests', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockPaginatedResponse());

        await getProjects({
            page: 0,
            limit: 5000,
            sort: 'not-a-sort' as 'createdAt',
            order: 'sideways' as 'asc'
        });

        const [url] = fetchSpy.mock.calls[0] ?? [];

        expect(String(url)).toContain(
            '/projects?page=1&limit=50&sort=createdAt&order=desc'
        );
    });

    it('encodes project ids when building path segments', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(
                JSON.stringify({
                    id: 'project/one',
                    name: 'Project One',
                    url: 'https://example.com',
                    createdAt: '2026-01-01T00:00:00.000Z'
                }),
                {
                    status: 200,
                    headers: { 'content-type': 'application/json' }
                }
            )
        );

        await getProjectById('project/one');

        const [url] = fetchSpy.mock.calls[0] ?? [];

        expect(String(url)).toContain('/projects/project%2Fone');
    });

    it('clamps unsafe pagination values before building project report requests', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockPaginatedResponse());

        await getProjectReports('project/one', {
            page: Number.NaN,
            limit: -1,
            sort: 'not-a-sort' as 'createdAt',
            order: 'sideways' as 'asc'
        });

        const [url] = fetchSpy.mock.calls[0] ?? [];

        expect(String(url)).toContain(
            '/projects/project%2Fone/reports?page=1&limit=10&sort=createdAt&order=desc'
        );
    });

    it('encodes report ids when building path segments', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(
                JSON.stringify({
                    id: 'report/one',
                    projectId: 'project-one',
                    title: 'Report One',
                    summary: 'Summary',
                    accessibilityScore: 90,
                    performanceScore: 90,
                    seoScore: 90,
                    uxScore: 90,
                    createdAt: '2026-01-01T00:00:00.000Z'
                }),
                {
                    status: 200,
                    headers: { 'content-type': 'application/json' }
                }
            )
        );

        await updateReport('report/one', { title: 'Updated' });

        const [url] = fetchSpy.mock.calls[0] ?? [];

        expect(String(url)).toContain('/reports/report%2Fone');
    });
});
