import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteReport, updateReport } from '../../api/projects';
import { EditReportForm } from './EditReportForm';
import type { Report } from '../../types/api';

vi.mock('../../api/projects', () => ({
    deleteReport: vi.fn(),
    updateReport: vi.fn()
}));

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
});
