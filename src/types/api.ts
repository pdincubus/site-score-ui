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
    clientId: string | null;
    archivedAt: string | null;
    createdAt: string;
};

export type Client = {
    id: string;
    name: string;
    archivedAt: string | null;
    createdAt: string;
};

export type DashboardClient = Pick<Client, 'id' | 'name' | 'createdAt'>;

export type DashboardProject = Pick<Project, 'id' | 'name' | 'clientId' | 'createdAt'> & {
    clientName: string | null;
};

export type DashboardResult = {
    id: string;
    title: string;
    projectId: string;
    projectName: string;
    clientId: string | null;
    clientName: string | null;
    createdAt: string;
};

export type Dashboard = {
    clients: DashboardClient[];
    projects: DashboardProject[];
    results: DashboardResult[];
};

export type ResourceStatus = 'active' | 'archived' | 'all';

export type ProjectSummaryScores = {
    performanceScore: number;
    accessibilityScore: number;
    seoScore: number;
    bestPracticesScore: number;
    agenticBrowsingScore: number;
};

export type ProjectSummary = {
    reportCount: number;
    reportGroupCount: number;
    latestReportCreatedAt: string | null;
    latestReportTitle: string | null;
    latestScores: ProjectSummaryScores | null;
};

export type ProjectListItem = Project & {
    summary: ProjectSummary;
};

export type PageSpeedStrategy = 'mobile' | 'desktop';

export type ReportInsightsSource = 'PAGESPEED' | 'CRUX';

export type ReportInsightMetricName =
    | 'pageWeight'
    | 'firstContentfulPaint'
    | 'largestContentfulPaint'
    | 'cumulativeLayoutShift'
    | 'totalBlockingTime'
    | 'speedIndex'
    | 'timeToInteractive'
    | 'interactionToNextPaint';

export type ReportInsightMetric = {
    value: number | null;
    unit: 'ms' | 'score' | 'unitless' | 'bytes';
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

export type ReportInsightAuditSeverity = 'pass' | 'fail' | 'warning' | 'not-tested';

export type ReportInsightAuditRef = {
    id: string;
    title: string;
    category: string;
    severity: ReportInsightAuditSeverity;
    displayValue: string | null;
    score: number | null;
};

export type ReportInsightUserTimingEntryType = 'mark' | 'measure';

export type ReportInsightUserTiming = {
    name: string;
    entryType: ReportInsightUserTimingEntryType;
    startTime: number | null;
    duration: number | null;
    displayValue: string | null;
};

export type ReportInsightUserTimingComparison = {
    name: string;
    entryType: ReportInsightUserTimingEntryType;
    currentValue: number | null;
    previousValue: number | null;
    delta: number | null;
    unit: 'ms';
    previousReportId?: string;
    previousCreatedAt?: string;
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
        agenticBrowsing: number | null;
    };
    metrics: Partial<Record<ReportInsightMetricName, ReportInsightMetric>>;
    fieldData?: {
        source: ReportInsightsSource;
        overallCategory: string | null;
        metrics: Partial<Record<ReportInsightMetricName, ReportInsightMetric>>;
    } | null;
    opportunities: ReportInsightOpportunity[];
    auditRefs?: ReportInsightAuditRef[];
    userTimings?: ReportInsightUserTiming[];
};

export type ReportInsightsImportInput = {
    source: 'PAGESPEED';
    url: string;
    strategy: PageSpeedStrategy;
};

export type ReportGroup = {
    id: string;
    projectId: string;
    name: string;
    pageUrl: string;
    strategy: PageSpeedStrategy;
    createdAt: string;
};

export type ReportGroupSummary = Pick<ReportGroup, 'id' | 'name' | 'pageUrl' | 'strategy'>;

export type ReportTrendPoint = {
    id: string;
    title: string;
    pageUrl: string;
    createdAt: string;
    performanceScore: number;
    accessibilityScore: number;
    seoScore: number;
    bestPracticesScore: number;
    agenticBrowsingScore: number;
};

export type ReportGroupTrend = {
    groupId: string;
    groupName: string;
    pageUrl: string;
    strategy: PageSpeedStrategy;
    points: ReportTrendPoint[];
};

export type ReportScoreComparison = {
    performanceScore: number;
    accessibilityScore: number;
    seoScore: number;
    bestPracticesScore: number;
    agenticBrowsingScore: number;
};

export type ReportComparison = {
    previousReportId: string;
    previousCreatedAt: string;
    scores: ReportScoreComparison;
    userTimings?: ReportInsightUserTimingComparison[];
};

export type Report = {
    id: string;
    projectId: string;
    groupId: string | null;
    group?: ReportGroupSummary | null;
    title: string;
    summary: string;
    pageUrl: string;
    performanceScore: number;
    accessibilityScore: number;
    seoScore: number;
    bestPracticesScore: number;
    agenticBrowsingScore: number;
    insights?: ReportInsights | null;
    comparison?: ReportComparison | null;
    archivedAt?: string | null;
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
