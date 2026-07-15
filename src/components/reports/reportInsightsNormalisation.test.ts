import { describe, expect, it } from 'vitest';
import type { ReportInsights } from '../../types/api';
import { normaliseReportInsights } from './reportInsightsNormalisation';

describe('normaliseReportInsights', () => {
    it('keeps valid resource summary and DOM size data while dropping unsupported resources', () => {
        const result = normaliseReportInsights(
            {
                source: 'PAGESPEED',
                strategy: 'mobile',
                testedUrl: 'https://example.com/',
                finalUrl: 'https://example.com/',
                fetchedAt: '2026-07-08T09:30:00.000Z',
                lighthouseVersion: '13.0.0',
                scores: {
                    performance: 90,
                    accessibility: 98,
                    bestPractices: 96,
                    seo: 100,
                    agenticBrowsing: null
                },
                metrics: {},
                resourceSummary: {
                    items: [
                        {
                            resourceType: 'script',
                            label: 'JavaScript',
                            requestCount: 5,
                            transferSize: 612448
                        },
                        {
                            resourceType: 'video',
                            label: 'Video',
                            requestCount: 1,
                            transferSize: 1000000
                        }
                    ]
                },
                domSize: {
                    totalElements: 932,
                    maxDepth: 17,
                    maxChildElements: 42,
                    displayValue: '932 elements'
                },
                opportunities: []
            } as unknown as ReportInsights,
            'https://fallback.example/',
            'desktop'
        );

        expect(result.resourceSummary).toEqual({
            items: [
                {
                    resourceType: 'script',
                    label: 'JavaScript',
                    requestCount: 5,
                    transferSize: 612448
                }
            ]
        });
        expect(result.domSize).toEqual({
            totalElements: 932,
            maxDepth: 17,
            maxChildElements: 42,
            displayValue: '932 elements'
        });
    });
});
