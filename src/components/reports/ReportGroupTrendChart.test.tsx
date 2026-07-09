import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReportGroupTrendChart } from './ReportGroupTrendChart';
import type { ReportGroupTrend } from '../../types/api';

const trend: ReportGroupTrend = {
    groupId: 'group-home-mobile',
    groupName: 'Homepage mobile',
    pageUrl: 'https://example.com/',
    strategy: 'mobile',
    points: [
        {
            id: 'report-one',
            title: 'May snapshot',
            pageUrl: 'https://example.com/',
            createdAt: '2026-05-08T09:30:00.000Z',
            performanceScore: 62,
            accessibilityScore: 94,
            seoScore: 98,
            bestPracticesScore: 84,
            agenticBrowsingScore: 76
        },
        {
            id: 'report-two',
            title: 'June snapshot',
            pageUrl: 'https://example.com/',
            createdAt: '2026-06-08T09:30:00.000Z',
            performanceScore: 68,
            accessibilityScore: 97,
            seoScore: 100,
            bestPracticesScore: 86,
            agenticBrowsingScore: 82
        },
        {
            id: 'report-three',
            title: 'July snapshot',
            pageUrl: 'https://example.com/',
            createdAt: '2026-07-08T09:30:00.000Z',
            performanceScore: 75,
            accessibilityScore: 97,
            seoScore: 98,
            bestPracticesScore: 90,
            agenticBrowsingScore: 79
        }
    ]
};

describe('ReportGroupTrendChart', () => {
    it('renders the five headline score trends with legend labels', () => {
        render(<ReportGroupTrendChart trend={trend} />);

        expect(
            screen.getByRole('group', { name: 'Score trend for Homepage mobile' })
        ).toBeInTheDocument();

        const legend = screen.getByRole('list', { name: 'Trend legend' });

        for (const label of [
            'Performance',
            'Accessibility',
            'SEO',
            'Best practices',
            'Agentic browsing'
        ]) {
            expect(within(legend).getByText(label)).toBeInTheDocument();
            expect(
                screen.getByLabelText(`${label} trend for Homepage mobile`)
            ).toBeInTheDocument();
        }
    });

    it('includes a textual data table for assistive technology', () => {
        render(<ReportGroupTrendChart trend={trend} />);

        const table = screen.getByRole('table', {
            name: 'Score trend data for Homepage mobile'
        });

        expect(within(table).getByRole('columnheader', { name: 'Report' })).toBeInTheDocument();
        expect(within(table).getByRole('columnheader', { name: 'Performance' })).toBeInTheDocument();
        expect(within(table).getByRole('row', { name: /July snapshot/ })).toHaveTextContent('75');
    });

    it('shows a compact empty state when there is not enough history', () => {
        render(
            <ReportGroupTrendChart
                trend={{
                    ...trend,
                    points: [trend.points[0]]
                }}
            />
        );

        expect(screen.getByRole('status')).toHaveTextContent(
            'Add another report to see a trend.'
        );
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
});
