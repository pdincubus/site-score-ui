import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createReport } from '../../api/projects';
import { CreateReportForm } from './CreateReportForm';

vi.mock('../../api/projects', () => ({
    createReport: vi.fn()
}));

describe('CreateReportForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('adds browser validation attributes for required report fields', () => {
        render(<CreateReportForm projectId='project-1' onCreated={vi.fn()} />);

        expect(screen.getByLabelText('Title')).toBeRequired();
        expect(screen.getByLabelText('Title')).toHaveAttribute('maxlength', '160');
        expect(screen.getByLabelText('Summary')).toBeRequired();
        expect(screen.getByLabelText('Summary')).toHaveAttribute('maxlength', '500');
        expect(screen.getByLabelText('Accessibility')).toBeRequired();
        expect(screen.getByLabelText('Accessibility')).toHaveAttribute('step', '1');
    });

    it('trims report text and parses scores before creating a report', async () => {
        const onCreated = vi.fn();
        vi.mocked(createReport).mockResolvedValue({
            id: 'report-1',
            projectId: 'project-1',
            title: 'Homepage audit',
            summary: 'A short summary',
            accessibilityScore: 92,
            performanceScore: 88,
            seoScore: 90,
            uxScore: 87,
            createdAt: '2026-01-01T00:00:00.000Z'
        });

        render(<CreateReportForm projectId='project-1' onCreated={onCreated} />);

        fireEvent.change(screen.getByLabelText('Title'), {
            target: { value: '  Homepage audit  ' }
        });
        fireEvent.change(screen.getByLabelText('Summary'), {
            target: { value: '  A short summary  ' }
        });
        fireEvent.change(screen.getByLabelText('Accessibility'), { target: { value: '92' } });
        fireEvent.change(screen.getByLabelText('Performance'), { target: { value: '88' } });
        fireEvent.change(screen.getByLabelText('SEO'), { target: { value: '90' } });
        fireEvent.change(screen.getByLabelText('UX'), { target: { value: '87' } });
        fireEvent.submit(screen.getByLabelText('Title').closest('form') as HTMLFormElement);

        await waitFor(() => {
            expect(createReport).toHaveBeenCalledWith('project-1', {
                title: 'Homepage audit',
                summary: 'A short summary',
                accessibilityScore: 92,
                performanceScore: 88,
                seoScore: 90,
                uxScore: 87
            });
            expect(onCreated).toHaveBeenCalledTimes(1);
        });
    });

    it('rejects empty score values before calling the API', async () => {
        render(<CreateReportForm projectId='project-1' onCreated={vi.fn()} />);

        fireEvent.change(screen.getByLabelText('Title'), {
            target: { value: 'Homepage audit' }
        });
        fireEvent.change(screen.getByLabelText('Summary'), {
            target: { value: 'Summary' }
        });
        fireEvent.change(screen.getByLabelText('Accessibility'), { target: { value: '' } });
        fireEvent.submit(screen.getByLabelText('Title').closest('form') as HTMLFormElement);

        expect(await screen.findByText('Enter an accessibility score.')).toBeInTheDocument();
        expect(createReport).not.toHaveBeenCalled();
    });
});
