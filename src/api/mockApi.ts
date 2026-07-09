import type {
    PageSpeedStrategy,
    PaginatedResponse,
    Project,
    ProjectListItem,
    ProjectSummary,
    Report,
    ReportGroup,
    ReportGroupTrend,
    ReportTrendPoint,
    ReportInsightAuditRef,
    ReportInsightMetric,
    ReportInsightOpportunity,
    ReportInsightUserTiming,
    ReportInsights,
    ReportInsightsImportInput,
    User
} from '../types/api';

type MockApiFetchOptions = RequestInit & {
    bodyJson?: unknown;
};

const demoUser: User = {
    id: 'user-demo',
    name: 'Demo User',
    email: 'demo@example.com',
    createdAt: '2026-07-01T08:00:00.000Z'
};

const projects: Project[] = [
    {
        id: 'project-crayons-code',
        name: 'Crayons & Code',
        url: 'https://crayonsandcode.co.uk/',
        createdAt: '2026-07-01T08:30:00.000Z'
    },
    {
        id: 'project-harbour-homeware',
        name: 'Harbour Homeware',
        url: 'https://harbourhomeware.example/',
        createdAt: '2026-06-15T08:30:00.000Z'
    },
    {
        id: 'project-fresh-start',
        name: 'Fresh Start Studio',
        url: 'https://fresh-start.example/',
        createdAt: '2026-05-01T08:30:00.000Z'
    }
];

const reportGroups: ReportGroup[] = [
    {
        id: 'group-home-mobile',
        projectId: 'project-crayons-code',
        name: 'Homepage mobile',
        pageUrl: 'https://crayonsandcode.co.uk/',
        strategy: 'mobile',
        createdAt: '2026-07-01T09:00:00.000Z'
    },
    {
        id: 'group-home-desktop',
        projectId: 'project-crayons-code',
        name: 'Homepage desktop',
        pageUrl: 'https://crayonsandcode.co.uk/',
        strategy: 'desktop',
        createdAt: '2026-07-01T09:05:00.000Z'
    },
    {
        id: 'group-harbour-home-mobile',
        projectId: 'project-harbour-homeware',
        name: 'Homepage mobile',
        pageUrl: 'https://harbourhomeware.example/',
        strategy: 'mobile',
        createdAt: '2026-04-01T09:00:00.000Z'
    },
    {
        id: 'group-harbour-home-desktop',
        projectId: 'project-harbour-homeware',
        name: 'Homepage desktop',
        pageUrl: 'https://harbourhomeware.example/',
        strategy: 'desktop',
        createdAt: '2026-04-01T09:05:00.000Z'
    }
];

const mobileOpportunities: ReportInsightOpportunity[] = [
    {
        id: 'render-blocking-resources',
        title: 'Eliminate render-blocking resources',
        displayValue: 'Potential savings of 620 ms',
        score: 0.62,
        overallSavingsMs: 620
    },
    {
        id: 'unused-javascript',
        title: 'Reduce unused JavaScript',
        displayValue: 'Potential savings of 184 KiB',
        score: 0.71,
        overallSavingsMs: 380
    }
];

const desktopOpportunities: ReportInsightOpportunity[] = [
    {
        id: 'uses-responsive-images',
        title: 'Properly size images',
        displayValue: 'Potential savings of 148 KiB',
        score: 0.74,
        overallSavingsMs: 120
    }
];

const mobileAuditRefs: ReportInsightAuditRef[] = [
    {
        id: 'uses-optimized-images',
        title: 'Serve images in next-gen formats',
        category: 'performance',
        severity: 'warning',
        displayValue: 'Potential savings of 224 KiB',
        score: 0.5
    },
    {
        id: 'tap-targets',
        title: 'Tap targets are not sized appropriately',
        category: 'seo',
        severity: 'fail',
        displayValue: null,
        score: 0
    },
    {
        id: 'aria-allowed-attr',
        title: 'ARIA attributes are used correctly',
        category: 'accessibility',
        severity: 'warning',
        displayValue: null,
        score: 0.78
    }
];

const desktopAuditRefs: ReportInsightAuditRef[] = [
    {
        id: 'uses-long-cache-ttl',
        title: 'Serve static assets with an efficient cache policy',
        category: 'performance',
        severity: 'warning',
        displayValue: '3 resources found',
        score: 0.54
    }
];

function metric(
    value: number | null,
    unit: ReportInsightMetric['unit'],
    displayValue: string | null,
    category = 'performance'
): ReportInsightMetric {
    return {
        value,
        unit,
        displayValue,
        category
    };
}

function createInsights({
    strategy,
    testedUrl,
    finalUrl,
    fetchedAt,
    pageWeight,
    firstContentfulPaint,
    speedIndex,
    largestContentfulPaint,
    totalBlockingTime,
    cumulativeLayoutShift,
    timeToInteractive,
    interactionToNextPaint,
    opportunities,
    auditRefs,
    userTimings
}: {
    strategy: PageSpeedStrategy;
    testedUrl: string;
    finalUrl: string | null;
    fetchedAt: string;
    pageWeight: ReportInsightMetric;
    firstContentfulPaint: ReportInsightMetric;
    speedIndex: ReportInsightMetric;
    largestContentfulPaint: ReportInsightMetric;
    totalBlockingTime: ReportInsightMetric;
    cumulativeLayoutShift: ReportInsightMetric;
    timeToInteractive: ReportInsightMetric;
    interactionToNextPaint: ReportInsightMetric;
    opportunities: ReportInsightOpportunity[];
    auditRefs: ReportInsightAuditRef[];
    userTimings: ReportInsightUserTiming[];
}): ReportInsights {
    return {
        source: 'PAGESPEED',
        strategy,
        testedUrl,
        finalUrl,
        fetchedAt,
        lighthouseVersion: '13.0.0',
        scores: {
            performance: null,
            accessibility: null,
            bestPractices: null,
            seo: null,
            agenticBrowsing: null
        },
        metrics: {
            pageWeight,
            firstContentfulPaint,
            speedIndex,
            largestContentfulPaint,
            totalBlockingTime,
            cumulativeLayoutShift,
            timeToInteractive,
            interactionToNextPaint
        },
        opportunities,
        auditRefs,
        userTimings
    };
}

const mobilePreviousInsights = createInsights({
    strategy: 'mobile',
    testedUrl: 'https://crayonsandcode.co.uk/',
    finalUrl: 'https://www.crayonsandcode.co.uk/',
    fetchedAt: '2026-06-08T09:30:00.000Z',
    pageWeight: metric(2264924, 'bytes', null),
    firstContentfulPaint: metric(1980, 'ms', '2.0 s'),
    speedIndex: metric(3820, 'ms', '3.8 s'),
    largestContentfulPaint: metric(4240, 'ms', '4.2 s'),
    totalBlockingTime: metric(410, 'ms', '410 ms'),
    cumulativeLayoutShift: metric(0.12, 'unitless', '0.12'),
    timeToInteractive: metric(4620, 'ms', '4.6 s'),
    interactionToNextPaint: metric(180, 'ms', '180 ms'),
    opportunities: mobileOpportunities,
    auditRefs: mobileAuditRefs,
    userTimings: [
        {
            name: 'app:hydrate',
            entryType: 'measure',
            startTime: 730,
            duration: 1270,
            displayValue: '1.27 s'
        },
        {
            name: 'app:ready',
            entryType: 'mark',
            startTime: 3000,
            duration: null,
            displayValue: '3.0 s'
        }
    ]
});

const mobileLatestInsights = createInsights({
    strategy: 'mobile',
    testedUrl: 'https://crayonsandcode.co.uk/',
    finalUrl: 'https://www.crayonsandcode.co.uk/',
    fetchedAt: '2026-07-08T09:30:00.000Z',
    pageWeight: metric(1837056, 'bytes', null),
    firstContentfulPaint: metric(1420, 'ms', '1.4 s'),
    speedIndex: metric(2940, 'ms', '2.9 s'),
    largestContentfulPaint: metric(3180, 'ms', '3.2 s'),
    totalBlockingTime: metric(210, 'ms', '210 ms'),
    cumulativeLayoutShift: metric(0.04, 'unitless', '0.04'),
    timeToInteractive: metric(3620, 'ms', '3.6 s'),
    interactionToNextPaint: metric(130, 'ms', '130 ms'),
    opportunities: mobileOpportunities,
    auditRefs: mobileAuditRefs,
    userTimings: [
        {
            name: 'app:hydrate',
            entryType: 'measure',
            startTime: 690,
            duration: 850,
            displayValue: '850 ms'
        },
        {
            name: 'app:ready',
            entryType: 'mark',
            startTime: 3200,
            duration: null,
            displayValue: '3.2 s'
        },
        {
            name: 'hero:visible',
            entryType: 'mark',
            startTime: 1180,
            duration: null,
            displayValue: '1.18 s'
        }
    ]
});

const desktopPreviousInsights = createInsights({
    strategy: 'desktop',
    testedUrl: 'https://crayonsandcode.co.uk/',
    finalUrl: 'https://crayonsandcode.co.uk/',
    fetchedAt: '2026-06-08T10:00:00.000Z',
    pageWeight: metric(2192015, 'bytes', null),
    firstContentfulPaint: metric(820, 'ms', '0.8 s'),
    speedIndex: metric(1420, 'ms', '1.4 s'),
    largestContentfulPaint: metric(1680, 'ms', '1.7 s'),
    totalBlockingTime: metric(80, 'ms', '80 ms'),
    cumulativeLayoutShift: metric(0.02, 'unitless', '0.02'),
    timeToInteractive: metric(1900, 'ms', '1.9 s'),
    interactionToNextPaint: metric(75, 'ms', '75 ms'),
    opportunities: desktopOpportunities,
    auditRefs: desktopAuditRefs,
    userTimings: [
        {
            name: 'app:hydrate',
            entryType: 'measure',
            startTime: 320,
            duration: 420,
            displayValue: '420 ms'
        }
    ]
});

const desktopLatestInsights = createInsights({
    strategy: 'desktop',
    testedUrl: 'https://crayonsandcode.co.uk/',
    finalUrl: 'https://crayonsandcode.co.uk/',
    fetchedAt: '2026-07-08T10:00:00.000Z',
    pageWeight: metric(2044723, 'bytes', null),
    firstContentfulPaint: metric(760, 'ms', '0.8 s'),
    speedIndex: metric(1480, 'ms', '1.5 s'),
    largestContentfulPaint: metric(1740, 'ms', '1.7 s'),
    totalBlockingTime: metric(110, 'ms', '110 ms'),
    cumulativeLayoutShift: metric(0.01, 'unitless', '0.01'),
    timeToInteractive: metric(1980, 'ms', '2.0 s'),
    interactionToNextPaint: metric(68, 'ms', '68 ms'),
    opportunities: desktopOpportunities,
    auditRefs: desktopAuditRefs,
    userTimings: [
        {
            name: 'app:hydrate',
            entryType: 'measure',
            startTime: 310,
            duration: 390,
            displayValue: '390 ms'
        }
    ]
});

const reports: Report[] = [
    {
        id: 'report-home-mobile-latest',
        projectId: 'project-crayons-code',
        groupId: 'group-home-mobile',
        group: {
            id: 'group-home-mobile',
            name: 'Homepage mobile',
            pageUrl: 'https://crayonsandcode.co.uk/',
            strategy: 'mobile'
        },
        title: 'Homepage mobile - July snapshot',
        summary: 'Latest mobile PageSpeed snapshot.',
        pageUrl: 'https://crayonsandcode.co.uk/',
        performanceScore: 75,
        accessibilityScore: 97,
        seoScore: 98,
        bestPracticesScore: 90,
        agenticBrowsingScore: 79,
        insights: mobileLatestInsights,
        comparison: {
            previousReportId: 'report-home-mobile-previous',
            previousCreatedAt: '2026-06-08T09:30:00.000Z',
            scores: {
                performanceScore: 7,
                accessibilityScore: 0,
                seoScore: -2,
                bestPracticesScore: 4,
                agenticBrowsingScore: -3
            },
            userTimings: [
                {
                    name: 'app:hydrate',
                    entryType: 'measure',
                    currentValue: 850,
                    previousValue: 1270,
                    delta: -420,
                    unit: 'ms',
                    previousReportId: 'report-home-mobile-previous',
                    previousCreatedAt: '2026-06-08T09:30:00.000Z'
                },
                {
                    name: 'app:ready',
                    entryType: 'mark',
                    currentValue: 3200,
                    previousValue: 3000,
                    delta: 200,
                    unit: 'ms',
                    previousReportId: 'report-home-mobile-previous',
                    previousCreatedAt: '2026-06-08T09:30:00.000Z'
                }
            ]
        },
        createdAt: '2026-07-08T09:30:00.000Z'
    },
    {
        id: 'report-home-desktop-latest',
        projectId: 'project-crayons-code',
        groupId: 'group-home-desktop',
        group: {
            id: 'group-home-desktop',
            name: 'Homepage desktop',
            pageUrl: 'https://crayonsandcode.co.uk/',
            strategy: 'desktop'
        },
        title: 'Homepage desktop - July snapshot',
        summary: 'Latest desktop PageSpeed snapshot.',
        pageUrl: 'https://crayonsandcode.co.uk/',
        performanceScore: 89,
        accessibilityScore: 100,
        seoScore: 100,
        bestPracticesScore: 97,
        agenticBrowsingScore: 91,
        insights: desktopLatestInsights,
        comparison: {
            previousReportId: 'report-home-desktop-previous',
            previousCreatedAt: '2026-06-08T10:00:00.000Z',
            scores: {
                performanceScore: -2,
                accessibilityScore: 1,
                seoScore: 0,
                bestPracticesScore: 1,
                agenticBrowsingScore: 3
            },
            userTimings: [
                {
                    name: 'app:hydrate',
                    entryType: 'measure',
                    currentValue: 390,
                    previousValue: 420,
                    delta: -30,
                    unit: 'ms',
                    previousReportId: 'report-home-desktop-previous',
                    previousCreatedAt: '2026-06-08T10:00:00.000Z'
                }
            ]
        },
        createdAt: '2026-07-08T10:00:00.000Z'
    },
    {
        id: 'report-home-mobile-previous',
        projectId: 'project-crayons-code',
        groupId: 'group-home-mobile',
        group: {
            id: 'group-home-mobile',
            name: 'Homepage mobile',
            pageUrl: 'https://crayonsandcode.co.uk/',
            strategy: 'mobile'
        },
        title: 'Homepage mobile - June baseline',
        summary: 'Earlier mobile PageSpeed snapshot.',
        pageUrl: 'https://crayonsandcode.co.uk/',
        performanceScore: 68,
        accessibilityScore: 97,
        seoScore: 100,
        bestPracticesScore: 86,
        agenticBrowsingScore: 82,
        insights: mobilePreviousInsights,
        comparison: {
            previousReportId: 'report-home-mobile-initial',
            previousCreatedAt: '2026-05-08T09:30:00.000Z',
            scores: {
                performanceScore: 6,
                accessibilityScore: 2,
                seoScore: 2,
                bestPracticesScore: 4,
                agenticBrowsingScore: 6
            }
        },
        createdAt: '2026-06-08T09:30:00.000Z'
    },
    {
        id: 'report-home-desktop-previous',
        projectId: 'project-crayons-code',
        groupId: 'group-home-desktop',
        group: {
            id: 'group-home-desktop',
            name: 'Homepage desktop',
            pageUrl: 'https://crayonsandcode.co.uk/',
            strategy: 'desktop'
        },
        title: 'Homepage desktop - June baseline',
        summary: 'Earlier desktop PageSpeed snapshot.',
        pageUrl: 'https://crayonsandcode.co.uk/',
        performanceScore: 91,
        accessibilityScore: 99,
        seoScore: 100,
        bestPracticesScore: 96,
        agenticBrowsingScore: 88,
        insights: desktopPreviousInsights,
        comparison: {
            previousReportId: 'report-home-desktop-initial',
            previousCreatedAt: '2026-05-08T10:00:00.000Z',
            scores: {
                performanceScore: 3,
                accessibilityScore: 1,
                seoScore: 0,
                bestPracticesScore: 2,
                agenticBrowsingScore: 4
            }
        },
        createdAt: '2026-06-08T10:00:00.000Z'
    },
    {
        id: 'report-home-mobile-initial',
        projectId: 'project-crayons-code',
        groupId: 'group-home-mobile',
        group: {
            id: 'group-home-mobile',
            name: 'Homepage mobile',
            pageUrl: 'https://crayonsandcode.co.uk/',
            strategy: 'mobile'
        },
        title: 'Homepage mobile - May baseline',
        summary: 'Initial mobile PageSpeed snapshot.',
        pageUrl: 'https://crayonsandcode.co.uk/',
        performanceScore: 62,
        accessibilityScore: 95,
        seoScore: 98,
        bestPracticesScore: 82,
        agenticBrowsingScore: 76,
        insights: null,
        comparison: null,
        createdAt: '2026-05-08T09:30:00.000Z'
    },
    {
        id: 'report-home-desktop-initial',
        projectId: 'project-crayons-code',
        groupId: 'group-home-desktop',
        group: {
            id: 'group-home-desktop',
            name: 'Homepage desktop',
            pageUrl: 'https://crayonsandcode.co.uk/',
            strategy: 'desktop'
        },
        title: 'Homepage desktop - May baseline',
        summary: 'Initial desktop PageSpeed snapshot.',
        pageUrl: 'https://crayonsandcode.co.uk/',
        performanceScore: 88,
        accessibilityScore: 98,
        seoScore: 100,
        bestPracticesScore: 94,
        agenticBrowsingScore: 84,
        insights: null,
        comparison: null,
        createdAt: '2026-05-08T10:00:00.000Z'
    },
    {
        id: 'report-harbour-mobile-july',
        projectId: 'project-harbour-homeware',
        groupId: 'group-harbour-home-mobile',
        group: {
            id: 'group-harbour-home-mobile',
            name: 'Homepage mobile',
            pageUrl: 'https://harbourhomeware.example/',
            strategy: 'mobile'
        },
        title: 'Homepage mobile - July recovery',
        summary: 'Fourth mobile snapshot after the initial performance work.',
        pageUrl: 'https://harbourhomeware.example/',
        performanceScore: 61,
        accessibilityScore: 85,
        seoScore: 82,
        bestPracticesScore: 76,
        agenticBrowsingScore: 67,
        insights: null,
        comparison: {
            previousReportId: 'report-harbour-mobile-june',
            previousCreatedAt: '2026-06-08T09:30:00.000Z',
            scores: {
                performanceScore: 13,
                accessibilityScore: 7,
                seoScore: 10,
                bestPracticesScore: 7,
                agenticBrowsingScore: 9
            }
        },
        createdAt: '2026-07-08T09:30:00.000Z'
    },
    {
        id: 'report-harbour-desktop-july',
        projectId: 'project-harbour-homeware',
        groupId: 'group-harbour-home-desktop',
        group: {
            id: 'group-harbour-home-desktop',
            name: 'Homepage desktop',
            pageUrl: 'https://harbourhomeware.example/',
            strategy: 'desktop'
        },
        title: 'Homepage desktop - July recovery',
        summary: 'Fourth desktop snapshot after the initial performance work.',
        pageUrl: 'https://harbourhomeware.example/',
        performanceScore: 74,
        accessibilityScore: 88,
        seoScore: 86,
        bestPracticesScore: 83,
        agenticBrowsingScore: 75,
        insights: null,
        comparison: {
            previousReportId: 'report-harbour-desktop-june',
            previousCreatedAt: '2026-06-08T10:00:00.000Z',
            scores: {
                performanceScore: 8,
                accessibilityScore: 6,
                seoScore: 8,
                bestPracticesScore: 5,
                agenticBrowsingScore: 7
            }
        },
        createdAt: '2026-07-08T10:00:00.000Z'
    },
    {
        id: 'report-harbour-mobile-june',
        projectId: 'project-harbour-homeware',
        groupId: 'group-harbour-home-mobile',
        group: {
            id: 'group-harbour-home-mobile',
            name: 'Homepage mobile',
            pageUrl: 'https://harbourhomeware.example/',
            strategy: 'mobile'
        },
        title: 'Homepage mobile - June fixes',
        summary: 'Third mobile snapshot after image and script reductions.',
        pageUrl: 'https://harbourhomeware.example/',
        performanceScore: 48,
        accessibilityScore: 78,
        seoScore: 72,
        bestPracticesScore: 69,
        agenticBrowsingScore: 58,
        insights: null,
        comparison: {
            previousReportId: 'report-harbour-mobile-may',
            previousCreatedAt: '2026-05-08T09:30:00.000Z',
            scores: {
                performanceScore: 12,
                accessibilityScore: 6,
                seoScore: 6,
                bestPracticesScore: 8,
                agenticBrowsingScore: 9
            }
        },
        createdAt: '2026-06-08T09:30:00.000Z'
    },
    {
        id: 'report-harbour-desktop-june',
        projectId: 'project-harbour-homeware',
        groupId: 'group-harbour-home-desktop',
        group: {
            id: 'group-harbour-home-desktop',
            name: 'Homepage desktop',
            pageUrl: 'https://harbourhomeware.example/',
            strategy: 'desktop'
        },
        title: 'Homepage desktop - June fixes',
        summary: 'Third desktop snapshot after image and script reductions.',
        pageUrl: 'https://harbourhomeware.example/',
        performanceScore: 66,
        accessibilityScore: 82,
        seoScore: 78,
        bestPracticesScore: 78,
        agenticBrowsingScore: 68,
        insights: null,
        comparison: {
            previousReportId: 'report-harbour-desktop-may',
            previousCreatedAt: '2026-05-08T10:00:00.000Z',
            scores: {
                performanceScore: 11,
                accessibilityScore: 6,
                seoScore: 8,
                bestPracticesScore: 8,
                agenticBrowsingScore: 8
            }
        },
        createdAt: '2026-06-08T10:00:00.000Z'
    },
    {
        id: 'report-harbour-mobile-may',
        projectId: 'project-harbour-homeware',
        groupId: 'group-harbour-home-mobile',
        group: {
            id: 'group-harbour-home-mobile',
            name: 'Homepage mobile',
            pageUrl: 'https://harbourhomeware.example/',
            strategy: 'mobile'
        },
        title: 'Homepage mobile - May quick wins',
        summary: 'Second mobile snapshot after critical content fixes.',
        pageUrl: 'https://harbourhomeware.example/',
        performanceScore: 36,
        accessibilityScore: 72,
        seoScore: 66,
        bestPracticesScore: 61,
        agenticBrowsingScore: 49,
        insights: null,
        comparison: {
            previousReportId: 'report-harbour-mobile-april',
            previousCreatedAt: '2026-04-08T09:30:00.000Z',
            scores: {
                performanceScore: 8,
                accessibilityScore: 4,
                seoScore: 8,
                bestPracticesScore: 7,
                agenticBrowsingScore: 7
            }
        },
        createdAt: '2026-05-08T09:30:00.000Z'
    },
    {
        id: 'report-harbour-desktop-may',
        projectId: 'project-harbour-homeware',
        groupId: 'group-harbour-home-desktop',
        group: {
            id: 'group-harbour-home-desktop',
            name: 'Homepage desktop',
            pageUrl: 'https://harbourhomeware.example/',
            strategy: 'desktop'
        },
        title: 'Homepage desktop - May quick wins',
        summary: 'Second desktop snapshot after critical content fixes.',
        pageUrl: 'https://harbourhomeware.example/',
        performanceScore: 55,
        accessibilityScore: 76,
        seoScore: 70,
        bestPracticesScore: 70,
        agenticBrowsingScore: 60,
        insights: null,
        comparison: {
            previousReportId: 'report-harbour-desktop-april',
            previousCreatedAt: '2026-04-08T10:00:00.000Z',
            scores: {
                performanceScore: 10,
                accessibilityScore: 6,
                seoScore: 8,
                bestPracticesScore: 7,
                agenticBrowsingScore: 8
            }
        },
        createdAt: '2026-05-08T10:00:00.000Z'
    },
    {
        id: 'report-harbour-mobile-april',
        projectId: 'project-harbour-homeware',
        groupId: 'group-harbour-home-mobile',
        group: {
            id: 'group-harbour-home-mobile',
            name: 'Homepage mobile',
            pageUrl: 'https://harbourhomeware.example/',
            strategy: 'mobile'
        },
        title: 'Homepage mobile - April baseline',
        summary: 'Initial mobile snapshot before performance work.',
        pageUrl: 'https://harbourhomeware.example/',
        performanceScore: 28,
        accessibilityScore: 68,
        seoScore: 58,
        bestPracticesScore: 54,
        agenticBrowsingScore: 42,
        insights: null,
        comparison: null,
        createdAt: '2026-04-08T09:30:00.000Z'
    },
    {
        id: 'report-harbour-desktop-april',
        projectId: 'project-harbour-homeware',
        groupId: 'group-harbour-home-desktop',
        group: {
            id: 'group-harbour-home-desktop',
            name: 'Homepage desktop',
            pageUrl: 'https://harbourhomeware.example/',
            strategy: 'desktop'
        },
        title: 'Homepage desktop - April baseline',
        summary: 'Initial desktop snapshot before performance work.',
        pageUrl: 'https://harbourhomeware.example/',
        performanceScore: 45,
        accessibilityScore: 70,
        seoScore: 62,
        bestPracticesScore: 63,
        agenticBrowsingScore: 52,
        insights: null,
        comparison: null,
        createdAt: '2026-04-08T10:00:00.000Z'
    }
];

function clone<T>(value: T) {
    return JSON.parse(JSON.stringify(value)) as T;
}

function paginate<T>(data: T[], page: number, limit: number): PaginatedResponse<T> {
    const offset = (page - 1) * limit;
    const pageData = data.slice(offset, offset + limit);

    return {
        data: pageData,
        pagination: {
            page,
            limit,
            total: data.length,
            totalPages: data.length > 0 ? Math.ceil(data.length / limit) : 0
        }
    };
}

function getPositiveInteger(value: string | null, fallback: number) {
    const parsedValue = Number(value);

    return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function getSortOrder(value: string | null) {
    return value === 'asc' ? 'asc' : 'desc';
}

function sortProjects(data: Project[], sort: string | null, order: string | null) {
    const sortKey = sort === 'name' ? 'name' : 'createdAt';
    const direction = getSortOrder(order) === 'asc' ? 1 : -1;

    return [...data].sort((firstProject, secondProject) =>
        firstProject[sortKey].localeCompare(secondProject[sortKey]) * direction
    );
}

function sortReports(data: Report[], sort: string | null, order: string | null) {
    const sortKey = sort === 'title' ? 'title' : 'createdAt';
    const direction = getSortOrder(order) === 'asc' ? 1 : -1;

    return [...data].sort((firstReport, secondReport) =>
        firstReport[sortKey].localeCompare(secondReport[sortKey]) * direction
    );
}

function getReportTimestamp(report: Report) {
    const timestamp = new Date(report.createdAt).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getLatestProjectReport(projectReports: Report[]) {
    const [latestReport] = [...projectReports].sort((firstReport, secondReport) => {
        const timestampDifference =
            getReportTimestamp(secondReport) - getReportTimestamp(firstReport);

        return timestampDifference === 0
            ? firstReport.id.localeCompare(secondReport.id)
            : timestampDifference;
    });

    return latestReport ?? null;
}

function getProjectSummary(projectId: string): ProjectSummary {
    const projectReports = reports.filter((report) => report.projectId === projectId);
    const projectGroups = reportGroups.filter((group) => group.projectId === projectId);
    const latestReport = getLatestProjectReport(projectReports);

    return {
        reportCount: projectReports.length,
        reportGroupCount: projectGroups.length,
        latestReportCreatedAt: latestReport?.createdAt ?? null,
        latestReportTitle: latestReport?.title ?? null,
        latestScores: latestReport
            ? {
                performanceScore: latestReport.performanceScore,
                accessibilityScore: latestReport.accessibilityScore,
                seoScore: latestReport.seoScore,
                bestPracticesScore: latestReport.bestPracticesScore,
                agenticBrowsingScore: latestReport.agenticBrowsingScore
            }
            : null
    };
}

function toProjectListItem(project: Project): ProjectListItem {
    return {
        ...project,
        summary: getProjectSummary(project.id)
    };
}

function searchProjects(data: Project[], search: string | null) {
    const query = search?.trim().toLowerCase();

    if (!query) {
        return data;
    }

    return data.filter((project) =>
        `${project.name} ${project.url}`.toLowerCase().includes(query)
    );
}

function searchReports(data: Report[], search: string | null) {
    const query = search?.trim().toLowerCase();

    if (!query) {
        return data;
    }

    return data.filter((report) =>
        `${report.title} ${report.pageUrl}`.toLowerCase().includes(query)
    );
}

function getProjectOrThrow(projectId: string) {
    const project = projects.find((item) => item.id === projectId);

    if (!project) {
        throw new Error('Project not found');
    }

    return project;
}

function getReportGroups(projectId: string) {
    getProjectOrThrow(projectId);

    return reportGroups.filter((group) => group.projectId === projectId);
}

function getReports(projectId: string, searchParams: URLSearchParams) {
    getProjectOrThrow(projectId);

    const groupId = searchParams.get('groupId');
    const page = getPositiveInteger(searchParams.get('page'), 1);
    const limit = Math.min(getPositiveInteger(searchParams.get('limit'), 10), 50);
    const filteredReports = reports.filter((report) => {
        if (report.projectId !== projectId) {
            return false;
        }

        return groupId ? report.groupId === groupId : true;
    });
    const searchedReports = searchReports(filteredReports, searchParams.get('search'));
    const sortedReports = sortReports(
        searchedReports,
        searchParams.get('sort'),
        searchParams.get('order')
    );

    return paginate(sortedReports, page, limit);
}

function toTrendPoint(report: Report): ReportTrendPoint {
    return {
        id: report.id,
        title: report.title,
        pageUrl: report.pageUrl,
        createdAt: report.createdAt,
        performanceScore: report.performanceScore,
        accessibilityScore: report.accessibilityScore,
        seoScore: report.seoScore,
        bestPracticesScore: report.bestPracticesScore,
        agenticBrowsingScore: report.agenticBrowsingScore
    };
}

function getReportGroupTrends(
    projectId: string,
    searchParams: URLSearchParams
): ReportGroupTrend[] {
    const groupId = searchParams.get('groupId');
    const groups = getReportGroups(projectId).filter((group) =>
        groupId ? group.id === groupId : true
    );

    return groups.map((group) => ({
        groupId: group.id,
        groupName: group.name,
        pageUrl: group.pageUrl,
        strategy: group.strategy,
        points: reports
            .filter((report) => report.projectId === projectId && report.groupId === group.id)
            .sort((firstReport, secondReport) =>
                firstReport.createdAt.localeCompare(secondReport.createdAt)
            )
            .map(toTrendPoint)
    }));
}

function createImportedInsights(input: Partial<ReportInsightsImportInput> | undefined) {
    const strategy = input?.strategy === 'desktop' ? 'desktop' : 'mobile';
    const testedUrl =
        typeof input?.url === 'string' && input.url.trim()
            ? input.url.trim()
            : 'https://crayonsandcode.co.uk/';

    return createInsights({
        strategy,
        testedUrl,
        finalUrl: testedUrl,
        fetchedAt: '2026-07-08T12:00:00.000Z',
        pageWeight: metric(1748992, 'bytes', null),
        firstContentfulPaint: metric(strategy === 'desktop' ? 820 : 1510, 'ms', strategy === 'desktop' ? '0.8 s' : '1.5 s'),
        speedIndex: metric(strategy === 'desktop' ? 1460 : 3010, 'ms', strategy === 'desktop' ? '1.5 s' : '3.0 s'),
        largestContentfulPaint: metric(strategy === 'desktop' ? 1720 : 3290, 'ms', strategy === 'desktop' ? '1.7 s' : '3.3 s'),
        totalBlockingTime: metric(strategy === 'desktop' ? 90 : 240, 'ms', strategy === 'desktop' ? '90 ms' : '240 ms'),
        cumulativeLayoutShift: metric(0.03, 'unitless', '0.03'),
        timeToInteractive: metric(strategy === 'desktop' ? 1960 : 3720, 'ms', strategy === 'desktop' ? '2.0 s' : '3.7 s'),
        interactionToNextPaint: metric(strategy === 'desktop' ? 70 : 140, 'ms', strategy === 'desktop' ? '70 ms' : '140 ms'),
        opportunities: strategy === 'desktop' ? desktopOpportunities : mobileOpportunities,
        auditRefs: strategy === 'desktop' ? desktopAuditRefs : mobileAuditRefs,
        userTimings: [
            {
                name: 'app:hydrate',
                entryType: 'measure',
                startTime: strategy === 'desktop' ? 310 : 690,
                duration: strategy === 'desktop' ? 390 : 860,
                displayValue: strategy === 'desktop' ? '390 ms' : '860 ms'
            }
        ]
    });
}

async function mockApiFetch<T>(path: string, options: MockApiFetchOptions = {}): Promise<T> {
    const url = new URL(path, 'https://mock-api.local');
    const method = options.method?.toUpperCase() || 'GET';
    const segments = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);

    if (method === 'GET' && url.pathname === '/auth/me') {
        return clone(demoUser) as T;
    }

    if (method === 'POST' && url.pathname === '/auth/login') {
        return clone(demoUser) as T;
    }

    if (method === 'POST' && url.pathname === '/auth/logout') {
        return undefined as T;
    }

    if (method === 'GET' && url.pathname === '/projects') {
        const page = getPositiveInteger(url.searchParams.get('page'), 1);
        const limit = Math.min(getPositiveInteger(url.searchParams.get('limit'), 10), 50);
        const searchedProjects = searchProjects(projects, url.searchParams.get('search'));
        const sortedProjects = sortProjects(
            searchedProjects,
            url.searchParams.get('sort'),
            url.searchParams.get('order')
        );

        return clone(paginate(sortedProjects.map(toProjectListItem), page, limit)) as T;
    }

    if (method === 'GET' && segments[0] === 'projects' && segments.length === 2) {
        return clone(getProjectOrThrow(segments[1])) as T;
    }

    if (
        method === 'GET' &&
        segments[0] === 'projects' &&
        segments.length === 3 &&
        segments[2] === 'report-groups'
    ) {
        return clone(getReportGroups(segments[1])) as T;
    }

    if (
        method === 'GET' &&
        segments[0] === 'projects' &&
        segments.length === 3 &&
        segments[2] === 'report-group-trends'
    ) {
        return clone(getReportGroupTrends(segments[1], url.searchParams)) as T;
    }

    if (
        method === 'GET' &&
        segments[0] === 'projects' &&
        segments.length === 3 &&
        segments[2] === 'reports'
    ) {
        return clone(getReports(segments[1], url.searchParams)) as T;
    }

    if (
        method === 'POST' &&
        segments[0] === 'projects' &&
        segments.length === 3 &&
        segments[2] === 'report-insight-imports'
    ) {
        getProjectOrThrow(segments[1]);

        return clone(
            createImportedInsights(options.bodyJson as Partial<ReportInsightsImportInput> | undefined)
        ) as T;
    }

    throw new Error('Mock API does not support this request yet.');
}

export { mockApiFetch };
