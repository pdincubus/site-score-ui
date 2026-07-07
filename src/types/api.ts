export type User = {
    id: string;
    name: string;
    email: string;
    createdAt: string;
};

export type Project = {
    id: string;
    name: string;
    url: string;
    createdAt: string;
};

export type PageSpeedStrategy = 'mobile' | 'desktop';

export type ReportInsightsSource = 'PAGESPEED' | 'CRUX';

export type ReportInsightMetricName =
    | 'firstContentfulPaint'
    | 'largestContentfulPaint'
    | 'cumulativeLayoutShift'
    | 'totalBlockingTime'
    | 'speedIndex'
    | 'timeToInteractive'
    | 'interactionToNextPaint';

export type ReportInsightMetric = {
    value: number | null;
    unit: 'ms' | 'score' | 'unitless';
    displayValue: string | null;
    category?: string | null;
};

export type ReportInsightOpportunity = {
    id: string;
    title: string;
    displayValue: string | null;
    score: number | null;
    overallSavingsMs: number | null;
};

export type ReportInsights = {
    source: ReportInsightsSource;
    strategy: PageSpeedStrategy;
    testedUrl: string;
    finalUrl: string | null;
    fetchedAt: string;
    lighthouseVersion: string | null;
    scores: {
        performance: number | null;
        accessibility: number | null;
        bestPractices: number | null;
        seo: number | null;
    };
    metrics: Partial<Record<ReportInsightMetricName, ReportInsightMetric>>;
    fieldData?: {
        source: ReportInsightsSource;
        overallCategory: string | null;
        metrics: Partial<Record<ReportInsightMetricName, ReportInsightMetric>>;
    } | null;
    opportunities: ReportInsightOpportunity[];
};

export type ReportInsightsImportInput = {
    source: 'PAGESPEED';
    url: string;
    strategy: PageSpeedStrategy;
};

export type Report = {
    id: string;
    projectId: string;
    title: string;
    summary: string;
    accessibilityScore: number;
    performanceScore: number;
    seoScore: number;
    uxScore: number;
    insights?: ReportInsights | null;
    createdAt: string;
};

export type PaginationMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export type PaginatedResponse<T> = {
    data: T[];
    pagination: PaginationMeta;
};

export type ApiError = {
    error: string;
};
