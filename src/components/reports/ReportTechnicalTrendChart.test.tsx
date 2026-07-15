import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { ReportGroupTrend } from '../../types/api';
import { ReportTechnicalTrendChart } from './ReportTechnicalTrendChart';

const trend: ReportGroupTrend = {
    groupId: 'group-home-mobile',
    groupName: 'Homepage mobile',
    pageUrl: 'https://example.com/',
    strategy: 'mobile',
    points: [
        {
            id: 'report-one',
            title: 'June snapshot',
            pageUrl: 'https://example.com/',
            createdAt: '2026-06-08T09:30:00.000Z',
            performanceScore: 68,
            accessibilityScore: 97,
            seoScore: 100,
            bestPracticesScore: 86,
            agenticBrowsingScore: 82,
            technicalMetrics: {
                pageWeightBytes: 2162688,
                domNodes: 1040,
                resources: [
                    {
                        resourceType: 'script',
                        label: 'JavaScript',
                        requestCount: 6,
                        transferSize: 700000
                    }
                ]
            }
        },
        {
            id: 'report-two',
            title: 'July snapshot',
            pageUrl: 'https://example.com/',
            createdAt: '2026-07-08T09:30:00.000Z',
            performanceScore: 75,
            accessibilityScore: 97,
            seoScore: 98,
            bestPracticesScore: 90,
            agenticBrowsingScore: 79,
            technicalMetrics: {
                pageWeightBytes: 1837056,
                domNodes: 932,
                resources: [
                    {
                        resourceType: 'script',
                        label: 'JavaScript',
                        requestCount: 5,
                        transferSize: 612448
                    }
                ]
            }
        }
    ]
};

describe('ReportTechnicalTrendChart', () => {
    it('renders a selectable technical metric trend with an accessible table', async () => {
        const user = userEvent.setup();

        render(<ReportTechnicalTrendChart trend={trend} />);

        expect(
            screen.getByRole('group', { name: 'Technical trend for Homepage mobile' })
        ).toBeInTheDocument();
        expect(screen.getByRole('img', { name: /Page weight trend chart/ })).toBeInTheDocument();

        const table = screen.getByRole('table', {
            name: 'Technical trend data for Homepage mobile'
        });

        expect(within(table).getByRole('row', { name: /July snapshot/ })).toHaveTextContent('1.8 MiB');

        await user.selectOptions(screen.getByRole('combobox', { name: 'Metric' }), 'script');

        expect(screen.getByRole('img', { name: /JavaScript trend chart/ })).toBeInTheDocument();
        expect(within(table).getByRole('row', { name: /June snapshot/ })).toHaveTextContent('683.6 KiB');
        expect(within(table).getByRole('row', { name: /June snapshot/ })).toHaveTextContent('6');
    });

    it('does not render when fewer than two points have technical data', () => {
        const { container } = render(
            <ReportTechnicalTrendChart
                trend={{
                    ...trend,
                    points: [
                        {
                            ...trend.points[0],
                            technicalMetrics: undefined
                        },
                        trend.points[1]
                    ]
                }}
            />
        );

        expect(container).toBeEmptyDOMElement();
    });
});
