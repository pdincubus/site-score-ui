import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReportInsights } from '../../types/api';
import { ReportInsightsSummary } from './ReportInsightsSummary';

const insights: ReportInsights = {
    source: 'PAGESPEED',
    strategy: 'mobile',
    testedUrl: 'https://example.com/',
    finalUrl: 'https://example.com/',
    fetchedAt: '2026-07-08T09:30:00.000Z',
    lighthouseVersion: '13.0.0',
    scores: {
        performance: 78,
        accessibility: 96,
        bestPractices: 92,
        seo: 100,
        agenticBrowsing: null
    },
    metrics: {
        pageWeight: {
            value: 1732608,
            unit: 'bytes',
            displayValue: null
        },
        firstContentfulPaint: {
            value: 1230,
            unit: 'ms',
            displayValue: '1.2 s'
        },
        speedIndex: {
            value: 2410,
            unit: 'ms',
            displayValue: '2.4 s'
        },
        totalBlockingTime: {
            value: 180,
            unit: 'ms',
            displayValue: '180 ms'
        },
        largestContentfulPaint: {
            value: 2600,
            unit: 'ms',
            displayValue: '2.6 s'
        }
    },
    opportunities: [
        {
            id: 'render-blocking-resources',
            title: 'Eliminate render-blocking resources',
            displayValue: 'Potential savings of 520 ms',
            score: 0.71,
            overallSavingsMs: 520
        }
    ],
    auditRefs: [
        {
            id: 'uses-optimized-images',
            title: 'Serve images in next-gen formats',
            category: 'performance',
            severity: 'warning',
            displayValue: 'Potential savings of 320 KiB',
            score: 0.5
        },
        {
            id: 'is-crawlable',
            title: 'Page is blocked from indexing',
            category: 'seo',
            severity: 'fail',
            displayValue: null,
            score: 0
        },
        {
            id: 'document-title',
            title: 'Document has a title element',
            category: 'seo',
            severity: 'pass',
            displayValue: null,
            score: 1
        },
        {
            id: 'manual-check',
            title: 'Manual accessibility review',
            category: 'accessibility',
            severity: 'not-tested',
            displayValue: null,
            score: null
        }
    ],
    userTimings: [
        {
            name: 'app:hydrate',
            entryType: 'measure',
            startTime: 750,
            duration: 1000,
            displayValue: '1.0 s'
        },
        {
            name: 'app:ready',
            entryType: 'mark',
            startTime: 3600,
            duration: null,
            displayValue: '3.6 s'
        }
    ]
};

const previousInsights: ReportInsights = {
    ...insights,
    userTimings: [
        {
            name: 'app:hydrate',
            entryType: 'measure',
            startTime: 760,
            duration: 1420,
            displayValue: '1.42 s'
        },
        {
            name: 'app:ready',
            entryType: 'mark',
            startTime: 3400,
            duration: null,
            displayValue: '3.4 s'
        }
    ]
};

describe('ReportInsightsSummary', () => {
    it('shows useful PageSpeed metrics while hiding repeated metadata', () => {
        render(<ReportInsightsSummary insights={insights} />);

        expect(screen.queryByText('Source')).not.toBeInTheDocument();
        expect(screen.queryByText('Tested URL')).not.toBeInTheDocument();
        expect(screen.queryByText('Fetched')).not.toBeInTheDocument();
        expect(screen.queryByText('Strategy')).not.toBeInTheDocument();
        expect(screen.queryByText('Mobile')).not.toBeInTheDocument();
        expect(screen.getByText('Lighthouse')).toBeInTheDocument();
        expect(screen.getByText('13.0.0')).toBeInTheDocument();
        expect(screen.getByText('Page weight')).toBeInTheDocument();
        expect(screen.getByText('1.7 MiB')).toBeInTheDocument();
        expect(screen.getByText('First Contentful Paint')).toBeInTheDocument();
        expect(screen.getByText('Speed Index')).toBeInTheDocument();
        expect(screen.getByText('Total Blocking Time')).toBeInTheDocument();
        expect(
            screen.getByText('Total Blocking Time').compareDocumentPosition(
                screen.getByText('Lighthouse')
            ) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
    });

    it('keeps opportunities and audit status pills in disclosure sections', () => {
        render(<ReportInsightsSummary insights={insights} />);

        expect(screen.getByText('Opportunities (1)')).toBeInTheDocument();
        expect(screen.getByText('Eliminate render-blocking resources (Potential savings of 520 ms)')).toBeInTheDocument();
        expect(screen.getByText('Audit checks (4)')).toBeInTheDocument();
        expect(screen.getByText('Serve images in next-gen formats')).toBeInTheDocument();
        expect(screen.getByText('Page is blocked from indexing')).toBeInTheDocument();
        expect(screen.getByText('Document has a title element')).toBeInTheDocument();
        expect(screen.getByText('Manual accessibility review')).toBeInTheDocument();
        expect(screen.queryByText('Current status')).not.toBeInTheDocument();

        const passPill = screen.getByText('Pass').closest('.report-insights__severity');
        const warningPill = screen.getByText('Warning').closest('.report-insights__severity');
        const failPill = screen.getByText('Fail').closest('.report-insights__severity');
        const notTestedPill = screen.getByText('Not tested').closest('.report-insights__severity');

        expect(passPill).not.toBeNull();
        expect(warningPill).not.toBeNull();
        expect(failPill).not.toBeNull();
        expect(notTestedPill).not.toBeNull();
        expect(passPill).toHaveTextContent('Current status: Pass');
        expect(warningPill).toHaveTextContent('Current status: Warning');
        expect(failPill).toHaveTextContent('Current status: Fail');
        expect(notTestedPill).toHaveTextContent('Current status: Not tested');
        expect(within(passPill as HTMLElement).getByText('Current status:')).toHaveClass('vh');
        expect(within(warningPill as HTMLElement).getByText('Current status:')).toHaveClass('vh');
        expect(within(failPill as HTMLElement).getByText('Current status:')).toHaveClass('vh');
        expect(within(notTestedPill as HTMLElement).getByText('Current status:')).toHaveClass('vh');
    });

    it('shows additional metric changes compared with the previous report', () => {
        render(
            <ReportInsightsSummary
                insights={insights}
                previousInsights={{
                    ...insights,
                    metrics: {
                        ...insights.metrics,
                        pageWeight: {
                            value: 2000000,
                            unit: 'bytes',
                            displayValue: null
                        },
                        firstContentfulPaint: {
                            value: 1100,
                            unit: 'ms',
                            displayValue: '1.1 s'
                        },
                        totalBlockingTime: {
                            value: 180,
                            unit: 'ms',
                            displayValue: '180 ms'
                        }
                    }
                }}
            />
        );

        expect(
            screen.getByLabelText('Page weight improved by 261.1 KiB compared with the previous result.')
        ).toHaveTextContent('-261.1 KiB');
        expect(
            screen.getByLabelText('First Contentful Paint declined by 130 ms compared with the previous result.')
        ).toHaveTextContent('+130 ms');
        expect(
            screen.getByLabelText('Total Blocking Time did not change compared with the previous result.')
        ).toHaveTextContent('0 ms');
    });

    it('shows user timing marks and measures with previous report changes', () => {
        render(
            <ReportInsightsSummary
                insights={insights}
                previousInsights={previousInsights}
            />
        );

        expect(screen.getByText('User timings (2)')).toBeInTheDocument();
        expect(screen.getByText('app:hydrate')).toBeInTheDocument();
        expect(screen.getByText('app:ready')).toBeInTheDocument();
        expect(screen.getByText('Measure')).toBeInTheDocument();
        expect(screen.getByText('Mark')).toBeInTheDocument();
        expect(
            screen.getByLabelText('app:hydrate improved by 420 ms compared with the previous result.')
        ).toHaveTextContent('-420 ms');
        expect(
            screen.getByLabelText('app:ready happened later by 200 ms compared with the previous result.')
        ).toHaveTextContent('+200 ms');
    });
});
