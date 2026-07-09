import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createReport, createReportGroup, importReportInsights } from '../../api/projects';
import { CreateReportForm } from './CreateReportForm';
import type { ReportGroup, ReportInsights } from '../../types/api';

vi.mock('../../api/projects', () => ({
    createReport: vi.fn(),
    createReportGroup: vi.fn(),
    importReportInsights: vi.fn()
}));

const homepageMobileGroup: ReportGroup = {
    id: 'group-mobile',
    projectId: 'project-1',
    name: 'Homepage mobile',
    pageUrl: 'https://example.com/',
    strategy: 'mobile',
    createdAt: '2026-01-01T00:00:00.000Z'
};

const homepageDesktopGroup: ReportGroup = {
    id: 'group-desktop',
    projectId: 'project-1',
    name: 'Homepage desktop',
    pageUrl: 'https://example.com/desktop',
    strategy: 'desktop',
    createdAt: '2026-01-01T00:00:00.000Z'
};

const importedInsights: ReportInsights = {
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
    metrics: {
        largestContentfulPaint: {
            value: 1800,
            unit: 'ms',
            displayValue: '1.8 s',
            category: null
        }
    },
    opportunities: []
};

describe('CreateReportForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('VITE_ENABLE_PAGESPEED_IMPORT', 'false');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('adds browser validation attributes for required report fields', () => {
        render(
            <CreateReportForm
                projectId='project-1'
                groups={[homepageMobileGroup]}
                onCreated={vi.fn()}
            />
        );

        expect(screen.getByLabelText('Group')).toBeRequired();
        expect(screen.getByLabelText('Title')).toBeRequired();
        expect(screen.getByLabelText('Title')).toHaveAttribute('maxlength', '160');
        expect(screen.queryByLabelText('Summary')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Page URL')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Performance')).toBeRequired();
        expect(screen.getByLabelText('Performance')).toHaveAttribute('step', '1');
        expect(screen.queryByRole('button', { name: 'Import PageSpeed data' })).not.toBeInTheDocument();
    });

    it('trims report text and parses scores before creating a report', async () => {
        const onCreated = vi.fn();
        vi.mocked(createReport).mockResolvedValue({
            id: 'report-1',
            projectId: 'project-1',
            groupId: 'group-mobile',
            group: {
                id: 'group-mobile',
                name: 'Homepage mobile',
                pageUrl: 'https://example.com/',
                strategy: 'mobile'
            },
            title: 'Homepage audit',
            summary: 'Homepage audit',
            pageUrl: 'https://example.com/pricing',
            performanceScore: 88,
            accessibilityScore: 92,
            seoScore: 90,
            bestPracticesScore: 87,
            agenticBrowsingScore: 84,
            createdAt: '2026-01-01T00:00:00.000Z'
        });

        render(
            <CreateReportForm
                projectId='project-1'
                groups={[homepageMobileGroup]}
                onCreated={onCreated}
            />
        );

        fireEvent.change(screen.getByLabelText('Title'), {
            target: { value: '  Homepage audit  ' }
        });
        fireEvent.change(screen.getByLabelText('Performance'), { target: { value: '88' } });
        fireEvent.change(screen.getByLabelText('Accessibility'), { target: { value: '92' } });
        fireEvent.change(screen.getByLabelText('SEO'), { target: { value: '90' } });
        fireEvent.change(screen.getByLabelText('Best practices'), { target: { value: '87' } });
        fireEvent.change(screen.getByLabelText('Agentic browsing'), { target: { value: '84' } });
        fireEvent.submit(screen.getByLabelText('Title').closest('form') as HTMLFormElement);

        await waitFor(() => {
            expect(createReport).toHaveBeenCalledWith('project-1', {
                groupId: 'group-mobile',
                title: 'Homepage audit',
                summary: 'Homepage audit',
                pageUrl: 'https://example.com/',
                performanceScore: 88,
                accessibilityScore: 92,
                seoScore: 90,
                bestPracticesScore: 87,
                agenticBrowsingScore: 84
            });
            expect(onCreated).toHaveBeenCalledTimes(1);
        });
    });

    it('rejects empty score values before calling the API', async () => {
        render(
            <CreateReportForm
                projectId='project-1'
                groups={[homepageMobileGroup]}
                onCreated={vi.fn()}
            />
        );

        fireEvent.change(screen.getByLabelText('Title'), {
            target: { value: 'Homepage audit' }
        });
        fireEvent.change(screen.getByLabelText('Accessibility'), { target: { value: '' } });
        fireEvent.submit(screen.getByLabelText('Title').closest('form') as HTMLFormElement);

        expect(await screen.findByText('Enter an accessibility score.')).toBeInTheDocument();
        expect(createReport).not.toHaveBeenCalled();
    });

    it('requires a group when creating a new group inline', async () => {
        render(<CreateReportForm projectId='project-1' onCreated={vi.fn()} />);

        fireEvent.change(screen.getByLabelText('Title'), {
            target: { value: 'Homepage audit' }
        });
        fireEvent.change(screen.getByLabelText('Page URL'), {
            target: { value: 'https://example.com/' }
        });
        fireEvent.submit(screen.getByLabelText('Title').closest('form') as HTMLFormElement);

        expect(await screen.findByText('Enter a group name.')).toBeInTheDocument();
        expect(createReportGroup).not.toHaveBeenCalled();
        expect(createReport).not.toHaveBeenCalled();
    });

    it('creates an inline report group before creating a report', async () => {
        const onCreated = vi.fn();
        const onGroupCreated = vi.fn();

        vi.mocked(createReportGroup).mockResolvedValue(homepageMobileGroup);
        vi.mocked(createReport).mockResolvedValue({
            id: 'report-1',
            projectId: 'project-1',
            groupId: 'group-mobile',
            group: {
                id: 'group-mobile',
                name: 'Homepage mobile',
                pageUrl: 'https://example.com/',
                strategy: 'mobile'
            },
            title: 'Homepage audit',
            summary: 'Homepage audit',
            pageUrl: 'https://example.com/',
            performanceScore: 80,
            accessibilityScore: 80,
            seoScore: 80,
            bestPracticesScore: 80,
            agenticBrowsingScore: 80,
            createdAt: '2026-01-01T00:00:00.000Z'
        });

        render(
            <CreateReportForm
                projectId='project-1'
                onCreated={onCreated}
                onGroupCreated={onGroupCreated}
            />
        );

        fireEvent.change(screen.getByLabelText('Group name'), {
            target: { value: '  Homepage mobile  ' }
        });
        fireEvent.change(screen.getByLabelText('Page URL'), {
            target: { value: '  https://example.com/  ' }
        });
        fireEvent.change(screen.getByLabelText('Title'), {
            target: { value: 'Homepage audit' }
        });
        fireEvent.submit(screen.getByLabelText('Title').closest('form') as HTMLFormElement);

        await waitFor(() => {
            expect(createReportGroup).toHaveBeenCalledWith('project-1', {
                name: 'Homepage mobile',
                pageUrl: 'https://example.com/',
                strategy: 'mobile'
            });
            expect(createReport).toHaveBeenCalledWith('project-1', {
                groupId: 'group-mobile',
                title: 'Homepage audit',
                summary: 'Homepage audit',
                pageUrl: 'https://example.com/',
                performanceScore: 80,
                accessibilityScore: 80,
                seoScore: 80,
                bestPracticesScore: 80,
                agenticBrowsingScore: 80
            });
            expect(onGroupCreated).toHaveBeenCalledWith(homepageMobileGroup);
            expect(onCreated).toHaveBeenCalledTimes(1);
        });
    });

    it('stops before creating a report when the created group response has no id', async () => {
        vi.mocked(createReportGroup).mockResolvedValue({
            ...homepageMobileGroup,
            id: ''
        });

        render(<CreateReportForm projectId='project-1' onCreated={vi.fn()} />);

        fireEvent.change(screen.getByLabelText('Group name'), {
            target: { value: 'Homepage mobile' }
        });
        fireEvent.change(screen.getByLabelText('Page URL'), {
            target: { value: 'https://example.com/' }
        });
        fireEvent.change(screen.getByLabelText('Title'), {
            target: { value: 'Homepage audit' }
        });
        fireEvent.submit(screen.getByLabelText('Title').closest('form') as HTMLFormElement);

        expect(
            await screen.findByText(
                'The report group was created without an id. Refresh and try again.'
            )
        ).toBeInTheDocument();
        expect(createReport).not.toHaveBeenCalled();
    });

    it('imports PageSpeed scores when the feature flag is enabled', async () => {
        const onCreated = vi.fn();
        vi.stubEnv('VITE_ENABLE_PAGESPEED_IMPORT', 'true');
        vi.mocked(importReportInsights).mockResolvedValue(importedInsights);
        vi.mocked(createReport).mockResolvedValue({
            id: 'report-1',
            projectId: 'project-1',
            groupId: 'group-mobile',
            group: {
                id: 'group-mobile',
                name: 'Homepage mobile',
                pageUrl: 'https://example.com/',
                strategy: 'mobile'
            },
            title: 'Homepage audit',
            summary: 'Homepage audit',
            pageUrl: 'https://example.com/',
            performanceScore: 94,
            accessibilityScore: 98,
            seoScore: 100,
            bestPracticesScore: 92,
            agenticBrowsingScore: 89,
            insights: importedInsights,
            createdAt: '2026-01-01T00:00:00.000Z'
        });

        render(
            <CreateReportForm
                projectId='project-1'
                groups={[homepageMobileGroup]}
                defaultPageSpeedUrl='https://example.com/'
                onCreated={onCreated}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Import PageSpeed data' }));

        await waitFor(() => {
            expect(importReportInsights).toHaveBeenCalledWith('project-1', {
                source: 'PAGESPEED',
                url: 'https://example.com/',
                strategy: 'mobile'
            });
        });

        expect(screen.getByLabelText('Performance')).toHaveValue(94);
        expect(screen.getByLabelText('Accessibility')).toHaveValue(98);
        expect(screen.getByLabelText('SEO')).toHaveValue(100);
        expect(screen.getByLabelText('Best practices')).toHaveValue(92);
        expect(screen.getByLabelText('Agentic browsing')).toHaveValue(89);
        expect(screen.getByText('PageSpeed data imported')).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText('Title'), {
            target: { value: 'Homepage audit' }
        });
        fireEvent.submit(screen.getByLabelText('Title').closest('form') as HTMLFormElement);

        await waitFor(() => {
            expect(createReport).toHaveBeenCalledWith('project-1', {
                groupId: 'group-mobile',
                title: 'Homepage audit',
                summary: 'Homepage audit',
                pageUrl: 'https://example.com/',
                performanceScore: 94,
                accessibilityScore: 98,
                seoScore: 100,
                bestPracticesScore: 92,
                agenticBrowsingScore: 89,
                insights: importedInsights
            });
            expect(onCreated).toHaveBeenCalledTimes(1);
        });
    });

    it('normalises imported insight fields before creating a report', async () => {
        const onCreated = vi.fn();
        const importedInsightsWithMissingNullableStrings = {
            ...importedInsights,
            finalUrl: undefined,
            lighthouseVersion: undefined,
            scores: {
                ...importedInsights.scores,
                agenticBrowsing: undefined
            },
            metrics: {
                largestContentfulPaint: {
                    value: 1800,
                    unit: 'ms',
                    displayValue: undefined
                }
            },
            fieldData: {
                overallCategory: undefined,
                metrics: {}
            },
            opportunities: [
                {
                    id: 'unused-javascript',
                    title: 'Reduce unused JavaScript',
                    displayValue: undefined,
                    score: 0.5,
                    overallSavingsMs: 300
                }
            ],
            auditRefs: [
                {
                    id: 'tap-targets',
                    title: 'Tap targets are not sized appropriately',
                    category: 'seo',
                    severity: 'not_tested',
                    displayValue: undefined,
                    score: 0
                }
            ],
            userTimings: [
                {
                    name: 'app:hydrate',
                    entryType: 'measure',
                    startTime: 690,
                    duration: undefined,
                    displayValue: undefined
                }
            ]
        } as unknown as ReportInsights;

        vi.stubEnv('VITE_ENABLE_PAGESPEED_IMPORT', 'true');
        vi.mocked(importReportInsights).mockResolvedValue(
            importedInsightsWithMissingNullableStrings
        );
        vi.mocked(createReport).mockResolvedValue({
            id: 'report-1',
            projectId: 'project-1',
            groupId: 'group-mobile',
            title: 'Homepage audit',
            summary: 'Homepage audit',
            pageUrl: 'https://example.com/',
            performanceScore: 94,
            accessibilityScore: 98,
            seoScore: 100,
            bestPracticesScore: 92,
            agenticBrowsingScore: 80,
            insights: importedInsights,
            createdAt: '2026-01-01T00:00:00.000Z'
        });

        render(
            <CreateReportForm
                projectId='project-1'
                groups={[homepageMobileGroup]}
                defaultPageSpeedUrl='https://example.com/'
                onCreated={onCreated}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Import PageSpeed data' }));

        await waitFor(() => {
            expect(importReportInsights).toHaveBeenCalled();
        });

        fireEvent.change(screen.getByLabelText('Title'), {
            target: { value: 'Homepage audit' }
        });
        fireEvent.submit(screen.getByLabelText('Title').closest('form') as HTMLFormElement);

        await waitFor(() => {
            expect(createReport).toHaveBeenCalledWith(
                'project-1',
                expect.objectContaining({
                    insights: expect.objectContaining({
                        finalUrl: null,
                        lighthouseVersion: null,
                        scores: expect.objectContaining({
                            agenticBrowsing: null
                        }),
                        metrics: expect.objectContaining({
                            largestContentfulPaint: expect.objectContaining({
                                displayValue: null,
                                category: null
                            })
                        }),
                        fieldData: null,
                        opportunities: [
                            expect.objectContaining({
                                displayValue: null
                            })
                        ],
                        auditRefs: [
                            expect.objectContaining({
                                displayValue: null,
                                severity: 'not-tested'
                            })
                        ],
                        userTimings: [
                            expect.objectContaining({
                                duration: null,
                                displayValue: null
                            })
                        ]
                    })
                })
            );
        });
    });

    it('uses the selected group URL and strategy as PageSpeed import defaults', async () => {
        vi.stubEnv('VITE_ENABLE_PAGESPEED_IMPORT', 'true');
        vi.mocked(importReportInsights).mockResolvedValue({
            ...importedInsights,
            strategy: 'desktop',
            testedUrl: 'https://example.com/desktop'
        });

        render(
            <CreateReportForm
                projectId='project-1'
                groups={[homepageMobileGroup, homepageDesktopGroup]}
                onCreated={vi.fn()}
            />
        );

        fireEvent.change(screen.getByLabelText('Group'), {
            target: { value: 'group-desktop' }
        });

        expect(screen.queryByLabelText('Page URL')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Strategy')).not.toBeInTheDocument();
        expect(screen.getByText('https://example.com/desktop')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Import PageSpeed data' }));

        await waitFor(() => {
            expect(importReportInsights).toHaveBeenCalledWith('project-1', {
                source: 'PAGESPEED',
                url: 'https://example.com/desktop',
                strategy: 'desktop'
            });
        });
    });
});
