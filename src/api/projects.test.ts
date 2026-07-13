import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    archiveProject,
    archiveReport,
    createReport,
    createReportGroup,
    deleteProject,
    deleteReport,
    getProjectById,
    getProjectReportGroups,
    getProjectReportGroupTrends,
    getProjectReports,
    getProjects,
    importReportInsights,
    restoreProject,
    restoreReport,
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

function mockProjectListItem() {
    return {
        id: 'project-one',
        name: 'Project One',
        url: 'https://example.com',
        clientId: null,
        archivedAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        summary: {
            reportCount: 0,
            reportGroupCount: 0,
            latestReportCreatedAt: null,
            latestReportTitle: null,
            latestScores: null
        }
    };
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
            order: 'sideways' as 'asc',
            status: 'archived'
        });

        const [url] = fetchSpy.mock.calls[0] ?? [];

        expect(String(url)).toContain(
            '/projects?page=1&limit=50&sort=createdAt&order=desc&status=archived'
        );
    });

    it('retries the bare active project list when the initial decorated request fails', async () => {
        const project = mockProjectListItem();
        const fetchSpy = vi.spyOn(globalThis, 'fetch')
            .mockResolvedValueOnce(
                new Response(JSON.stringify({ error: 'Something went wrong' }), {
                    status: 500,
                    headers: { 'content-type': 'application/json' }
                })
            )
            .mockResolvedValueOnce(
                new Response(
                    JSON.stringify({
                        data: [project],
                        pagination: {
                            page: 1,
                            limit: 10,
                            total: 1,
                            totalPages: 1
                        }
                    }),
                    {
                        status: 200,
                        headers: { 'content-type': 'application/json' }
                    }
                )
            );

        const response = await getProjects({
            page: 1,
            limit: 10,
            sort: 'createdAt',
            order: 'desc'
        });

        expect(fetchSpy).toHaveBeenCalledTimes(2);
        expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(
            '/projects?page=1&limit=10&sort=createdAt&order=desc'
        );
        expect(String(fetchSpy.mock.calls[1]?.[0])).toContain('/projects');
        expect(String(fetchSpy.mock.calls[1]?.[0])).not.toContain('?');
        expect(response.data).toEqual([project]);
    });

    it('does not retry project list requests when the session is rejected', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ error: 'Not authenticated' }), {
                status: 401,
                headers: { 'content-type': 'application/json' }
            })
        );

        await expect(getProjects({
            page: 1,
            limit: 10,
            sort: 'createdAt',
            order: 'desc'
        })).rejects.toThrow('Not authenticated');

        expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('includes client filters and does not retry a filtered project request', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify({ error: 'Something went wrong' }), {
                status: 500,
                headers: { 'content-type': 'application/json' }
            })
        );

        await expect(getProjects({ clientId: 'unassigned' })).rejects.toThrow(
            'Something went wrong'
        );

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(String(fetchSpy.mock.calls[0]?.[0])).toContain(
            '/projects?clientId=unassigned'
        );
    });

    it('normalises plain project arrays into a paginated project response', async () => {
        const project = mockProjectListItem();
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify([project]), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            })
        );

        const response = await getProjects();

        expect(response).toEqual({
            data: [project],
            pagination: {
                page: 1,
                limit: 1,
                total: 1,
                totalPages: 1
            }
        });
    });

    it('encodes project ids when building path segments', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(
                JSON.stringify({
                    id: 'project/one',
                    name: 'Project One',
                    url: 'https://example.com',
                    clientId: null,
                    archivedAt: null,
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
            order: 'sideways' as 'asc',
            groupId: 'group/one',
            status: 'all'
        });

        const [url] = fetchSpy.mock.calls[0] ?? [];

        expect(String(url)).toContain(
            '/projects/project%2Fone/reports?page=1&limit=10&sort=createdAt&order=desc&groupId=group%2Fone&status=all'
        );
    });

    it('encodes project ids when loading report groups', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(
                JSON.stringify([
                    {
                        id: 'group-one',
                        projectId: 'project/one',
                        name: 'Homepage mobile',
                        pageUrl: 'https://example.com/',
                        strategy: 'mobile',
                        createdAt: '2026-01-01T00:00:00.000Z'
                    }
                ]),
                {
                    status: 200,
                    headers: { 'content-type': 'application/json' }
                }
            )
        );

        await getProjectReportGroups('project/one');

        const [url] = fetchSpy.mock.calls[0] ?? [];

        expect(String(url)).toContain('/projects/project%2Fone/report-groups');
    });

    it('normalises report group id aliases from the API response', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(
                JSON.stringify([
                    {
                        group_id: 'group-one',
                        project_id: 'project/one',
                        name: 'Homepage mobile',
                        page_url: 'https://example.com/',
                        strategy: 'mobile',
                        created_at: '2026-01-01T00:00:00.000Z'
                    }
                ]),
                {
                    status: 200,
                    headers: { 'content-type': 'application/json' }
                }
            )
        );

        const groups = await getProjectReportGroups('project/one');

        expect(groups[0]).toMatchObject({
            id: 'group-one',
            projectId: 'project/one',
            pageUrl: 'https://example.com/',
            createdAt: '2026-01-01T00:00:00.000Z',
            name: 'Homepage mobile'
        });
    });

    it('encodes project and group ids when loading report group trends', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'content-type': 'application/json' }
            })
        );

        await getProjectReportGroupTrends('project/one', {
            groupId: 'group/one'
        });

        const [url] = fetchSpy.mock.calls[0] ?? [];

        expect(String(url)).toContain(
            '/projects/project%2Fone/report-group-trends?groupId=group%2Fone'
        );
    });

    it('encodes project ids when creating report groups', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(
                JSON.stringify({
                    id: 'group-one',
                    projectId: 'project/one',
                    name: 'Homepage mobile',
                    pageUrl: 'https://example.com/',
                    strategy: 'mobile',
                    createdAt: '2026-01-01T00:00:00.000Z'
                }),
                {
                    status: 200,
                    headers: { 'content-type': 'application/json' }
                }
            )
        );

        await createReportGroup('project/one', {
            name: 'Homepage mobile',
            pageUrl: 'https://example.com/',
            strategy: 'mobile'
        });

        const [url, options] = fetchSpy.mock.calls[0] ?? [];

        expect(String(url)).toContain('/projects/project%2Fone/report-groups');
        expect(options).toMatchObject({
            method: 'POST',
            body: JSON.stringify({
                name: 'Homepage mobile',
                pageUrl: 'https://example.com/',
                strategy: 'mobile'
            })
        });
    });

    it('normalises created report group id aliases from the API response', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(
                JSON.stringify({
                    report_group_id: 'group-one',
                    project_id: 'project/one',
                    name: 'Homepage mobile',
                    page_url: 'https://example.com/',
                    strategy: 'mobile',
                    created_at: '2026-01-01T00:00:00.000Z'
                }),
                {
                    status: 200,
                    headers: { 'content-type': 'application/json' }
                }
            )
        );

        const group = await createReportGroup('project/one', {
            name: 'Homepage mobile',
            pageUrl: 'https://example.com/',
            strategy: 'mobile'
        });

        expect(group.id).toBe('group-one');
        expect(group.projectId).toBe('project/one');
        expect(group.pageUrl).toBe('https://example.com/');
    });

    it('rejects report create payloads without a group id before calling the API', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockPaginatedResponse());

        expect(() => createReport('project/one', {
            groupId: undefined as unknown as string,
            title: 'Report One',
            summary: 'Summary',
            pageUrl: 'https://example.com/',
            performanceScore: 90,
            accessibilityScore: 90,
            seoScore: 90,
            bestPracticesScore: 90,
            agenticBrowsingScore: 90
        })).toThrow('Choose a report group.');

        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('serialises report create payloads with the selected group id', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(
                JSON.stringify({
                    id: 'report-one',
                    projectId: 'project-one',
                    groupId: 'group-one',
                    title: 'Report One',
                    summary: 'Summary',
                    pageUrl: 'https://example.com/',
                    performanceScore: 90,
                    accessibilityScore: 90,
                    seoScore: 90,
                    bestPracticesScore: 90,
                    agenticBrowsingScore: 90,
                    createdAt: '2026-01-01T00:00:00.000Z'
                }),
                {
                    status: 201,
                    headers: { 'content-type': 'application/json' }
                }
            )
        );

        await createReport('project/one', {
            groupId: 'group-one',
            title: 'Report One',
            summary: 'Summary',
            pageUrl: 'https://example.com/',
            performanceScore: 90,
            accessibilityScore: 90,
            seoScore: 90,
            bestPracticesScore: 90,
            agenticBrowsingScore: 90
        });

        const [url, options] = fetchSpy.mock.calls[0] ?? [];

        expect(String(url)).toContain('/projects/project%2Fone/reports');
        expect(options).toMatchObject({
            method: 'POST',
            body: JSON.stringify({
                groupId: 'group-one',
                title: 'Report One',
                summary: 'Summary',
                pageUrl: 'https://example.com/',
                performanceScore: 90,
                accessibilityScore: 90,
                seoScore: 90,
                bestPracticesScore: 90,
                agenticBrowsingScore: 90
            })
        });
    });

    it('encodes report ids when building path segments', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(
                JSON.stringify({
                    id: 'report/one',
                    projectId: 'project-one',
                    groupId: 'group-one',
                    group: {
                        id: 'group-one',
                        name: 'Homepage mobile',
                        pageUrl: 'https://example.com/',
                        strategy: 'mobile'
                    },
                    title: 'Report One',
                    summary: 'Summary',
                    pageUrl: 'https://example.com/report',
                    performanceScore: 90,
                    accessibilityScore: 90,
                    seoScore: 90,
                    bestPracticesScore: 90,
                    agenticBrowsingScore: 90,
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

    it('encodes project ids when importing report insights', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
            new Response(
                JSON.stringify({
                    source: 'PAGESPEED',
                    strategy: 'mobile',
                    testedUrl: 'https://example.com/',
                    finalUrl: 'https://example.com/',
                    fetchedAt: '2026-01-01T00:00:00.000Z',
                    lighthouseVersion: '13.0.0',
                    scores: {
                        performance: 94,
                        accessibility: 98,
                        bestPractices: 92,
                        seo: 100,
                        agenticBrowsing: 89
                    },
                    metrics: {},
                    opportunities: []
                }),
                {
                    status: 200,
                    headers: { 'content-type': 'application/json' }
                }
            )
        );

        await importReportInsights('project/one', {
            source: 'PAGESPEED',
            url: 'https://example.com/',
            strategy: 'mobile'
        });

        const [url, options] = fetchSpy.mock.calls[0] ?? [];

        expect(String(url)).toContain('/projects/project%2Fone/report-insight-imports');
        expect(options).toMatchObject({
            method: 'POST',
            body: JSON.stringify({
                source: 'PAGESPEED',
                url: 'https://example.com/',
                strategy: 'mobile'
            })
        });
    });

    it('encodes project ids for archive, restore and delete actions', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        id: 'project/one',
                        name: 'Project One',
                        url: 'https://example.com',
                        clientId: null,
                        archivedAt: '2026-07-10T10:00:00.000Z',
                        createdAt: '2026-01-01T00:00:00.000Z'
                    }),
                    {
                        status: 200,
                        headers: { 'content-type': 'application/json' }
                    }
                )
            )
        );

        await archiveProject('project/one');
        await restoreProject('project/one');
        await deleteProject('project/one');

        expect(String(fetchSpy.mock.calls[0]?.[0])).toContain('/projects/project%2Fone/archive');
        expect(fetchSpy.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
        expect(String(fetchSpy.mock.calls[1]?.[0])).toContain('/projects/project%2Fone/restore');
        expect(fetchSpy.mock.calls[1]?.[1]).toMatchObject({ method: 'POST' });
        expect(String(fetchSpy.mock.calls[2]?.[0])).toContain('/projects/project%2Fone');
        expect(fetchSpy.mock.calls[2]?.[1]).toMatchObject({ method: 'DELETE' });
    });

    it('encodes report ids for archive, restore and delete actions', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        id: 'report/one',
                        projectId: 'project-one',
                        groupId: 'group-one',
                        title: 'Report One',
                        summary: 'Summary',
                        pageUrl: 'https://example.com/report',
                        performanceScore: 90,
                        accessibilityScore: 90,
                        seoScore: 90,
                        bestPracticesScore: 90,
                        agenticBrowsingScore: 90,
                        archivedAt: '2026-07-10T10:00:00.000Z',
                        createdAt: '2026-01-01T00:00:00.000Z'
                    }),
                    {
                        status: 200,
                        headers: { 'content-type': 'application/json' }
                    }
                )
            )
        );

        await archiveReport('report/one');
        await restoreReport('report/one');
        await deleteReport('report/one');

        expect(String(fetchSpy.mock.calls[0]?.[0])).toContain('/reports/report%2Fone/archive');
        expect(fetchSpy.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
        expect(String(fetchSpy.mock.calls[1]?.[0])).toContain('/reports/report%2Fone/restore');
        expect(fetchSpy.mock.calls[1]?.[1]).toMatchObject({ method: 'POST' });
        expect(String(fetchSpy.mock.calls[2]?.[0])).toContain('/reports/report%2Fone');
        expect(fetchSpy.mock.calls[2]?.[1]).toMatchObject({ method: 'DELETE' });
    });
});
