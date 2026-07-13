import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { archiveReport, deleteReport, restoreReport, updateReport } from '../../api/projects';
import { EditReportForm } from './EditReportForm';
import type { Report, ReportGroup, ReportInsights } from '../../types/api';

vi.mock('../../api/projects', () => ({
    archiveReport: vi.fn(),
    deleteReport: vi.fn(),
    restoreReport: vi.fn(),
    updateReport: vi.fn()
}));

const importedInsights: ReportInsights = {
    source: 'PAGESPEED',
    strategy: 'desktop',
    testedUrl: 'https://example.com/report',
    finalUrl: 'https://example.com/report',
    fetchedAt: '2026-01-01T00:00:00.000Z',
    lighthouseVersion: '13.0.0',
    scores: {
        performance: 96,
        accessibility: 99,
        bestPractices: 91,
        seo: 97,
        agenticBrowsing: 88
    },
    metrics: {},
    opportunities: []
};

const homepageMobileGroup: ReportGroup = {
    id: 'group-mobile',
    projectId: 'project-1',
    name: 'Homepage mobile',
    pageUrl: 'https://example.com/original',
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

const report: Report = {
    id: 'report-1',
    projectId: 'project-1',
    groupId: 'group-mobile',
    group: {
        id: 'group-mobile',
        name: 'Homepage mobile',
        pageUrl: 'https://example.com/original',
        strategy: 'mobile'
    },
    title: 'Original report',
    summary: 'Original summary',
    pageUrl: 'https://example.com/original',
    performanceScore: 81,
    accessibilityScore: 80,
    seoScore: 82,
    bestPracticesScore: 83,
    agenticBrowsingScore: 84,
    createdAt: '2026-01-01T00:00:00.000Z'
};

describe('EditReportForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('VITE_ENABLE_PAGESPEED_IMPORT', 'false');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('trims report text and parses scores before updating a report', async () => {
        const onUpdated = vi.fn();
        vi.mocked(updateReport).mockResolvedValue({
            ...report,
            title: 'Updated report',
            summary: 'Updated summary',
            pageUrl: 'https://example.com/updated',
            accessibilityScore: 91
        });

        render(
            <EditReportForm
                report={report}
                groups={[homepageMobileGroup, homepageDesktopGroup]}
                onUpdated={onUpdated}
                onDeleted={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        fireEvent.change(screen.getByLabelText('Title'), {
            target: { value: '  Updated report  ' }
        });
        fireEvent.change(screen.getByLabelText('Summary'), {
            target: { value: '  Updated summary  ' }
        });
        fireEvent.change(screen.getByLabelText('Page URL'), {
            target: { value: '  https://example.com/updated  ' }
        });
        fireEvent.change(screen.getByLabelText('Accessibility'), { target: { value: '91' } });
        fireEvent.submit(screen.getByLabelText('Title').closest('form') as HTMLFormElement);

        await waitFor(() => {
            expect(updateReport).toHaveBeenCalledWith('report-1', {
                title: 'Updated report',
                summary: 'Updated summary',
                groupId: 'group-mobile',
                pageUrl: 'https://example.com/updated',
                performanceScore: 81,
                accessibilityScore: 91,
                seoScore: 82,
                bestPracticesScore: 83,
                agenticBrowsingScore: 84
            });
            expect(onUpdated).toHaveBeenCalledTimes(1);
        });
    });

    it('rejects out-of-range scores before calling the API', async () => {
        render(
            <EditReportForm
                report={report}
                groups={[homepageMobileGroup]}
                onUpdated={vi.fn()}
                onDeleted={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        fireEvent.change(screen.getByLabelText('Performance'), { target: { value: '101' } });
        fireEvent.submit(screen.getByLabelText('Title').closest('form') as HTMLFormElement);

        expect(
            await screen.findByText('Performance score must be a whole number from 0 to 100.')
        ).toBeInTheDocument();
        expect(updateReport).not.toHaveBeenCalled();
        expect(archiveReport).not.toHaveBeenCalled();
        expect(restoreReport).not.toHaveBeenCalled();
        expect(deleteReport).not.toHaveBeenCalled();
    });

    it('does not show PageSpeed import controls while editing', () => {
        vi.stubEnv('VITE_ENABLE_PAGESPEED_IMPORT', 'true');

        render(
            <EditReportForm
                report={report}
                groups={[homepageMobileGroup]}
                onUpdated={vi.fn()}
                onDeleted={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        expect(screen.queryByRole('button', { name: 'Import PageSpeed data' })).not.toBeInTheDocument();
        expect(screen.getByLabelText('Page URL')).toHaveValue('https://example.com/original');
        expect(screen.queryByLabelText('Strategy')).not.toBeInTheDocument();
    });

    it('preserves existing imported insights by omitting them from edit updates', async () => {
        const onUpdated = vi.fn();
        const reportWithInsights = {
            ...report,
            insights: importedInsights
        };

        vi.mocked(updateReport).mockResolvedValue({
            ...reportWithInsights,
            title: 'Updated report',
            insights: importedInsights
        });

        render(
            <EditReportForm
                report={reportWithInsights}
                groups={[homepageMobileGroup]}
                onUpdated={onUpdated}
                onDeleted={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        fireEvent.change(screen.getByLabelText('Title'), {
            target: { value: 'Updated report' }
        });
        fireEvent.submit(screen.getByLabelText('Title').closest('form') as HTMLFormElement);

        await waitFor(() => {
            expect(updateReport).toHaveBeenCalledWith('report-1', {
                title: 'Updated report',
                summary: 'Original summary',
                groupId: 'group-mobile',
                pageUrl: 'https://example.com/original',
                performanceScore: 81,
                accessibilityScore: 80,
                seoScore: 82,
                bestPracticesScore: 83,
                agenticBrowsingScore: 84
            });
            expect(onUpdated).toHaveBeenCalledTimes(1);
        });
    });

    it('updates the report group and defaults the page URL from the selected group', async () => {
        const onUpdated = vi.fn();

        vi.mocked(updateReport).mockResolvedValue({
            ...report,
            groupId: 'group-desktop',
            group: {
                id: 'group-desktop',
                name: 'Homepage desktop',
                pageUrl: 'https://example.com/desktop',
                strategy: 'desktop'
            },
            pageUrl: 'https://example.com/desktop'
        });

        render(
            <EditReportForm
                report={report}
                groups={[homepageMobileGroup, homepageDesktopGroup]}
                onUpdated={onUpdated}
                onDeleted={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        fireEvent.change(screen.getByLabelText('Result group'), {
            target: { value: 'group-desktop' }
        });

        expect(screen.getByLabelText('Page URL')).toHaveValue('https://example.com/desktop');

        fireEvent.submit(screen.getByLabelText('Title').closest('form') as HTMLFormElement);

        await waitFor(() => {
            expect(updateReport).toHaveBeenCalledWith('report-1', {
                title: 'Original report',
                summary: 'Original summary',
                groupId: 'group-desktop',
                pageUrl: 'https://example.com/desktop',
                performanceScore: 81,
                accessibilityScore: 80,
                seoScore: 82,
                bestPracticesScore: 83,
                agenticBrowsingScore: 84
            });
            expect(onUpdated).toHaveBeenCalledTimes(1);
        });
    });

    it('shows archive controls for active reports and restore controls for archived reports', () => {
        const { rerender } = render(
            <EditReportForm
                report={report}
                groups={[homepageMobileGroup]}
                onUpdated={vi.fn()}
                onDeleted={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        expect(screen.getByRole('button', { name: 'Archive result' })).toBeInTheDocument();

        rerender(
            <EditReportForm
                report={{
                    ...report,
                    archivedAt: '2026-07-10T09:00:00.000Z'
                }}
                groups={[homepageMobileGroup]}
                onUpdated={vi.fn()}
                onDeleted={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        expect(screen.getByRole('button', { name: 'Restore result' })).toBeInTheDocument();
    });
});
