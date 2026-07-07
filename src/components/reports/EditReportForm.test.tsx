import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteReport, updateReport } from '../../api/projects';
import { EditReportForm } from './EditReportForm';
import type { Report, ReportInsights } from '../../types/api';

vi.mock('../../api/projects', () => ({
    deleteReport: vi.fn(),
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
        seo: 97
    },
    metrics: {},
    opportunities: []
};

const report: Report = {
    id: 'report-1',
    projectId: 'project-1',
    title: 'Original report',
    summary: 'Original summary',
    accessibilityScore: 80,
    performanceScore: 81,
    seoScore: 82,
    uxScore: 83,
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
            accessibilityScore: 91
        });

        render(
            <EditReportForm
                report={report}
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
        fireEvent.change(screen.getByLabelText('Accessibility'), { target: { value: '91' } });
        fireEvent.submit(screen.getByLabelText('Title').closest('form') as HTMLFormElement);

        await waitFor(() => {
            expect(updateReport).toHaveBeenCalledWith('report-1', {
                title: 'Updated report',
                summary: 'Updated summary',
                accessibilityScore: 91,
                performanceScore: 81,
                seoScore: 82,
                uxScore: 83
            });
            expect(onUpdated).toHaveBeenCalledTimes(1);
        });
    });

    it('rejects out-of-range scores before calling the API', async () => {
        render(
            <EditReportForm
                report={report}
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
        expect(deleteReport).not.toHaveBeenCalled();
    });

    it('does not show PageSpeed import controls while editing', () => {
        vi.stubEnv('VITE_ENABLE_PAGESPEED_IMPORT', 'true');

        render(
            <EditReportForm
                report={report}
                onUpdated={vi.fn()}
                onDeleted={vi.fn()}
                onCancel={vi.fn()}
            />
        );

        expect(screen.queryByRole('button', { name: 'Import PageSpeed data' })).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Page URL')).not.toBeInTheDocument();
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
                accessibilityScore: 80,
                performanceScore: 81,
                seoScore: 82,
                uxScore: 83
            });
            expect(onUpdated).toHaveBeenCalledTimes(1);
        });
    });
});
