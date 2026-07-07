import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createReport, importReportInsights } from '../../api/projects';
import { CreateReportForm } from './CreateReportForm';
import type { ReportInsights } from '../../types/api';

vi.mock('../../api/projects', () => ({
    createReport: vi.fn(),
    importReportInsights: vi.fn()
}));

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
        seo: 100
    },
    metrics: {
        largestContentfulPaint: {
            value: 1800,
            unit: 'ms',
            displayValue: '1.8 s'
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
        render(<CreateReportForm projectId='project-1' onCreated={vi.fn()} />);

        expect(screen.getByLabelText('Title')).toBeRequired();
        expect(screen.getByLabelText('Title')).toHaveAttribute('maxlength', '160');
        expect(screen.getByLabelText('Summary')).toBeRequired();
        expect(screen.getByLabelText('Summary')).toHaveAttribute('maxlength', '500');
        expect(screen.getByLabelText('Accessibility')).toBeRequired();
        expect(screen.getByLabelText('Accessibility')).toHaveAttribute('step', '1');
        expect(screen.queryByRole('button', { name: 'Import PageSpeed data' })).not.toBeInTheDocument();
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

    it('imports PageSpeed scores when the feature flag is enabled', async () => {
        const onCreated = vi.fn();
        vi.stubEnv('VITE_ENABLE_PAGESPEED_IMPORT', 'true');
        vi.mocked(importReportInsights).mockResolvedValue(importedInsights);
        vi.mocked(createReport).mockResolvedValue({
            id: 'report-1',
            projectId: 'project-1',
            title: 'Homepage audit',
            summary: 'Imported summary',
            accessibilityScore: 98,
            performanceScore: 94,
            seoScore: 100,
            uxScore: 80,
            insights: importedInsights,
            createdAt: '2026-01-01T00:00:00.000Z'
        });

        render(
            <CreateReportForm
                projectId='project-1'
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
        expect(screen.getByLabelText('UX')).toHaveValue(80);

        fireEvent.change(screen.getByLabelText('Title'), {
            target: { value: 'Homepage audit' }
        });
        fireEvent.change(screen.getByLabelText('Summary'), {
            target: { value: 'Imported summary' }
        });
        fireEvent.submit(screen.getByLabelText('Title').closest('form') as HTMLFormElement);

        await waitFor(() => {
            expect(createReport).toHaveBeenCalledWith('project-1', {
                title: 'Homepage audit',
                summary: 'Imported summary',
                accessibilityScore: 98,
                performanceScore: 94,
                seoScore: 100,
                uxScore: 80,
                insights: importedInsights
            });
            expect(onCreated).toHaveBeenCalledTimes(1);
        });
    });
});
