import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
    getProjectById,
    getProjectReportGroups,
    getProjectReportGroupTrends,
    getProjectReports
} from '../api/projects';
import { ProjectDetailPage } from './ProjectDetailPage';
import type { PaginatedResponse, Project, Report, ReportGroup, ReportGroupTrend } from '../types/api';

vi.mock('../api/projects', () => ({
    ORDER_OPTIONS: ['asc', 'desc'],
    REPORT_SORT_OPTIONS: ['createdAt', 'title'],
    getProjectById: vi.fn(),
    getProjectReportGroups: vi.fn(),
    getProjectReportGroupTrends: vi.fn(),
    getProjectReports: vi.fn()
}));

const project: Project = {
    id: 'project-1',
    name: 'Example Project',
    url: 'https://example.com/',
    createdAt: '2026-01-01T00:00:00.000Z'
};

const homepageMobileGroup: ReportGroup = {
    id: 'group-mobile',
    projectId: 'project-1',
    name: 'Homepage mobile',
    pageUrl: 'https://example.com/',
    strategy: 'mobile',
    createdAt: '2026-01-01T00:00:00.000Z'
};

const homepageReport: Report = {
    id: 'report-1',
    projectId: 'project-1',
    groupId: 'group-mobile',
    group: {
        id: 'group-mobile',
        name: 'Homepage mobile',
        pageUrl: 'https://example.com/',
        strategy: 'mobile'
    },
    title: 'Homepage baseline',
    summary: 'Initial PageSpeed snapshot.',
    pageUrl: 'https://example.com/',
    performanceScore: 94,
    accessibilityScore: 98,
    seoScore: 100,
    bestPracticesScore: 92,
    agenticBrowsingScore: 89,
    createdAt: '2026-07-08T07:30:00.000Z'
};

const homepageTrend: ReportGroupTrend = {
    groupId: 'group-mobile',
    groupName: 'Homepage mobile',
    pageUrl: 'https://example.com/',
    strategy: 'mobile',
    points: [
        {
            id: 'report-0',
            title: 'Homepage May',
            pageUrl: 'https://example.com/',
            performanceScore: 88,
            accessibilityScore: 97,
            seoScore: 99,
            bestPracticesScore: 90,
            agenticBrowsingScore: 82,
            createdAt: '2026-05-08T07:30:00.000Z'
        },
        {
            id: 'report-1',
            title: 'Homepage baseline',
            pageUrl: 'https://example.com/',
            performanceScore: 94,
            accessibilityScore: 98,
            seoScore: 100,
            bestPracticesScore: 92,
            agenticBrowsingScore: 89,
            createdAt: '2026-07-08T07:30:00.000Z'
        }
    ]
};

function reportResponse(data: Report[]): PaginatedResponse<Report> {
    return {
        data,
        pagination: {
            page: 1,
            limit: 10,
            total: data.length,
            totalPages: data.length > 0 ? 1 : 0
        }
    };
}

function renderProjectDetailPage(initialPath = '/projects/project-1') {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
                <Route path='/projects/:id' element={<ProjectDetailPage />} />
            </Routes>
        </MemoryRouter>
    );
}

describe('ProjectDetailPage', () => {
    beforeAll(() => {
        HTMLDialogElement.prototype.showModal = vi.fn();
        HTMLDialogElement.prototype.close = vi.fn();
    });

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getProjectById).mockResolvedValue(project);
        vi.mocked(getProjectReportGroups).mockResolvedValue([homepageMobileGroup]);
        vi.mocked(getProjectReportGroupTrends).mockResolvedValue([homepageTrend]);
        vi.mocked(getProjectReports).mockResolvedValue(reportResponse([homepageReport]));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows the report group heading and created date without repeating the group inside the report card', async () => {
        renderProjectDetailPage();

        const reportHeading = await screen.findByRole('heading', { name: 'Homepage baseline' });
        const reportCard = reportHeading.closest('li');

        expect(reportCard).not.toBeNull();
        expect(screen.getByRole('heading', { name: 'Homepage mobile' })).toBeInTheDocument();
        expect(within(reportCard as HTMLElement).queryByText('Group')).not.toBeInTheDocument();
        expect(within(reportCard as HTMLElement).queryByText('Homepage mobile')).not.toBeInTheDocument();
        expect(
            within(reportCard as HTMLElement).getByText(
                new Intl.DateTimeFormat('en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                }).format(new Date(homepageReport.createdAt))
            )
        ).toBeInTheDocument();
        expect(screen.queryByText('Initial PageSpeed snapshot.')).not.toBeInTheDocument();
    });

    it('nests report card headings under report group headings in all groups view', async () => {
        renderProjectDetailPage();

        expect(await screen.findByRole('heading', { level: 1, name: 'Example Project' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Reports' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 3, name: 'Homepage mobile' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 4, name: 'Homepage baseline' })).toBeInTheDocument();
        expect(
            screen.queryByRole('heading', { level: 3, name: 'Homepage baseline' })
        ).not.toBeInTheDocument();
    });

    it('nests report card headings under report group headings when a group is filtered', async () => {
        renderProjectDetailPage('/projects/project-1?groupId=group-mobile');

        expect(await screen.findByRole('heading', { level: 1, name: 'Example Project' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: 'Reports' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 3, name: 'Homepage mobile' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 4, name: 'Homepage baseline' })).toBeInTheDocument();
        expect(
            screen.queryByRole('heading', { level: 3, name: 'Homepage baseline' })
        ).not.toBeInTheDocument();
    });

    it('loads and renders report group trend data without blocking report cards', async () => {
        renderProjectDetailPage();

        expect(await screen.findByRole('heading', { name: 'Homepage baseline' })).toBeInTheDocument();
        expect(
            await screen.findByRole('group', { name: 'Score trend for Homepage mobile' })
        ).toBeInTheDocument();
    });

    it('requests trend data for the selected report group', async () => {
        renderProjectDetailPage('/projects/project-1?groupId=group-mobile');

        await screen.findByRole('heading', { name: 'Homepage baseline' });

        expect(getProjectReportGroupTrends).toHaveBeenLastCalledWith(
            'project-1',
            expect.objectContaining({
                groupId: 'group-mobile'
            })
        );
    });

    it('keeps report cards usable when trend data is unavailable', async () => {
        vi.mocked(getProjectReportGroupTrends).mockRejectedValue(new Error('Something went wrong'));

        renderProjectDetailPage();

        expect(await screen.findByRole('heading', { name: 'Homepage baseline' })).toBeInTheDocument();
        expect(screen.queryByText('Could not load project')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('group', { name: 'Score trend for Homepage mobile' })
        ).not.toBeInTheDocument();
    });

    it('passes the selected report group to the report list request', async () => {
        renderProjectDetailPage();

        await screen.findByRole('heading', { name: 'Homepage baseline' });

        fireEvent.change(screen.getByLabelText('Group'), {
            target: { value: 'group-mobile' }
        });

        await waitFor(() => {
            expect(getProjectReports).toHaveBeenLastCalledWith(
                'project-1',
                expect.objectContaining({
                    groupId: 'group-mobile'
                })
            );
        });
    });

    it('keeps the project screen usable when report groups are unavailable', async () => {
        vi.mocked(getProjectReportGroups).mockRejectedValue(new Error('Something went wrong'));
        vi.mocked(getProjectReports).mockResolvedValue(
            reportResponse([
                {
                    ...homepageReport,
                    groupId: null,
                    group: null
                }
            ])
        );

        renderProjectDetailPage();

        expect(await screen.findByRole('heading', { name: 'Homepage baseline' })).toBeInTheDocument();
        expect(screen.getAllByText('Ungrouped').length).toBeGreaterThan(0);
        expect(screen.queryByText('Could not load project')).not.toBeInTheDocument();
    });

    it('shows score changes compared with the previous report in the same group', async () => {
        vi.mocked(getProjectReports).mockResolvedValue(
            reportResponse([
                {
                    ...homepageReport,
                    id: 'report-new',
                    title: 'Homepage latest',
                    performanceScore: 94,
                    accessibilityScore: 98,
                    seoScore: 95,
                    bestPracticesScore: 92,
                    agenticBrowsingScore: 89,
                    createdAt: '2026-07-08T07:30:00.000Z'
                },
                {
                    ...homepageReport,
                    id: 'report-old',
                    title: 'Homepage previous',
                    performanceScore: 90,
                    accessibilityScore: 98,
                    seoScore: 97,
                    bestPracticesScore: 92,
                    agenticBrowsingScore: 83,
                    createdAt: '2026-06-08T07:30:00.000Z'
                }
            ])
        );

        renderProjectDetailPage();

        expect(await screen.findByRole('heading', { name: 'Homepage latest' })).toBeInTheDocument();
        expect(
            screen.getByLabelText('Performance improved by 4 points from the previous report.')
        ).toHaveTextContent('+4');
        expect(
            screen.getByLabelText('SEO declined by 2 points from the previous report.')
        ).toHaveTextContent('-2');
        expect(
            screen.getAllByLabelText('Accessibility did not change from the previous report.')[0]
        ).toHaveTextContent('0');
    });

    it('shows user timing changes compared with the previous report in the same group', async () => {
        vi.mocked(getProjectReports).mockResolvedValue(
            reportResponse([
                {
                    ...homepageReport,
                    id: 'report-new',
                    title: 'Homepage latest',
                    insights: {
                        source: 'PAGESPEED',
                        strategy: 'mobile',
                        testedUrl: 'https://example.com/',
                        finalUrl: 'https://example.com/',
                        fetchedAt: '2026-07-08T07:30:00.000Z',
                        lighthouseVersion: '13.0.0',
                        scores: {
                            performance: 94,
                            accessibility: 98,
                            bestPractices: 92,
                            seo: 100,
                            agenticBrowsing: null
                        },
                        metrics: {},
                        opportunities: [],
                        userTimings: [
                            {
                                name: 'app:hydrate',
                                entryType: 'measure',
                                startTime: 750,
                                duration: 1000,
                                displayValue: '1.0 s'
                            }
                        ]
                    },
                    createdAt: '2026-07-08T07:30:00.000Z'
                },
                {
                    ...homepageReport,
                    id: 'report-old',
                    title: 'Homepage previous',
                    insights: {
                        source: 'PAGESPEED',
                        strategy: 'mobile',
                        testedUrl: 'https://example.com/',
                        finalUrl: 'https://example.com/',
                        fetchedAt: '2026-06-08T07:30:00.000Z',
                        lighthouseVersion: '13.0.0',
                        scores: {
                            performance: 90,
                            accessibility: 98,
                            bestPractices: 92,
                            seo: 97,
                            agenticBrowsing: null
                        },
                        metrics: {},
                        opportunities: [],
                        userTimings: [
                            {
                                name: 'app:hydrate',
                                entryType: 'measure',
                                startTime: 760,
                                duration: 1420,
                                displayValue: '1.42 s'
                            }
                        ]
                    },
                    createdAt: '2026-06-08T07:30:00.000Z'
                }
            ])
        );

        renderProjectDetailPage();

        expect(await screen.findByRole('heading', { name: 'Homepage latest' })).toBeInTheDocument();
        expect(screen.getAllByText('User timings (1)').length).toBeGreaterThan(0);
        expect(
            screen.getByLabelText('app:hydrate improved by 420 ms compared with the previous report.')
        ).toHaveTextContent('-420 ms');
    });

    it('prefers API-provided report comparisons when present', async () => {
        vi.mocked(getProjectReports).mockResolvedValue(
            reportResponse([
                {
                    ...homepageReport,
                    id: 'report-new',
                    title: 'Homepage latest',
                    performanceScore: 94,
                    accessibilityScore: 98,
                    seoScore: 95,
                    bestPracticesScore: 92,
                    agenticBrowsingScore: 89,
                    comparison: {
                        previousReportId: 'report-outside-page',
                        previousCreatedAt: '2026-05-08T07:30:00.000Z',
                        scores: {
                            performanceScore: 12,
                            accessibilityScore: 1,
                            seoScore: -4,
                            bestPracticesScore: 2,
                            agenticBrowsingScore: 8
                        }
                    },
                    createdAt: '2026-07-08T07:30:00.000Z'
                },
                {
                    ...homepageReport,
                    id: 'report-visible-previous',
                    title: 'Homepage visible previous',
                    performanceScore: 93,
                    accessibilityScore: 98,
                    seoScore: 95,
                    bestPracticesScore: 92,
                    agenticBrowsingScore: 89,
                    comparison: null,
                    createdAt: '2026-06-08T07:30:00.000Z'
                }
            ])
        );

        renderProjectDetailPage();

        expect(await screen.findByRole('heading', { name: 'Homepage latest' })).toBeInTheDocument();
        expect(
            screen.getByLabelText('Performance improved by 12 points from the previous report.')
        ).toHaveTextContent('+12');
        expect(
            screen.getByLabelText('SEO declined by 4 points from the previous report.')
        ).toHaveTextContent('-4');
    });
});
