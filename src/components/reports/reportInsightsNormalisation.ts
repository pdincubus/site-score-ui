import type {
    PageSpeedStrategy,
    ReportInsightAuditRef,
    ReportInsightAuditSeverity,
    ReportInsightMetric,
    ReportInsightMetricName,
    ReportInsightOpportunity,
    ReportInsights,
    ReportInsightsSource,
    ReportInsightUserTiming,
    ReportInsightUserTimingEntryType
} from '../../types/api';

const REPORT_INSIGHT_METRIC_NAMES: ReportInsightMetricName[] = [
    'pageWeight',
    'firstContentfulPaint',
    'largestContentfulPaint',
    'cumulativeLayoutShift',
    'totalBlockingTime',
    'speedIndex',
    'timeToInteractive',
    'interactionToNextPaint'
];

const REPORT_INSIGHT_METRIC_UNITS: Array<ReportInsightMetric['unit']> = [
    'ms',
    'score',
    'unitless',
    'bytes'
];

const REPORT_INSIGHT_SOURCES: ReportInsightsSource[] = ['PAGESPEED', 'CRUX'];
const PAGE_SPEED_STRATEGIES: PageSpeedStrategy[] = ['mobile', 'desktop'];
const REPORT_INSIGHT_AUDIT_SEVERITIES: ReportInsightAuditSeverity[] = [
    'pass',
    'fail',
    'warning',
    'not-tested'
];
const REPORT_INSIGHT_AUDIT_SEVERITY_ALIASES: Record<string, ReportInsightAuditSeverity> = {
    pass: 'pass',
    passed: 'pass',
    fail: 'fail',
    failed: 'fail',
    warning: 'warning',
    warn: 'warning',
    'not tested': 'not-tested',
    'not-tested': 'not-tested',
    not_tested: 'not-tested',
    nottested: 'not-tested'
};
const REPORT_INSIGHT_USER_TIMING_ENTRY_TYPES: ReportInsightUserTimingEntryType[] = [
    'mark',
    'measure'
];

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOwnProperty(value: UnknownRecord, property: string) {
    return Object.prototype.hasOwnProperty.call(value, property);
}

function isHttpUrl(value: string) {
    try {
        const parsedUrl = new URL(value);

        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
        return false;
    }
}

function normaliseRequiredText(value: unknown, maxLength: number) {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmedValue = value.trim();

    if (!trimmedValue) {
        return null;
    }

    return trimmedValue.slice(0, maxLength);
}

function normaliseNullableText(value: unknown, maxLength: number) {
    if (typeof value !== 'string') {
        return null;
    }

    return value.slice(0, maxLength);
}

function normaliseNullableUrl(value: unknown) {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmedValue = value.trim();

    if (!trimmedValue || !isHttpUrl(trimmedValue)) {
        return null;
    }

    return trimmedValue.slice(0, 2048);
}

function normaliseRequiredUrl(value: unknown, fallbackUrl: string) {
    return (
        normaliseNullableUrl(value) ||
        normaliseNullableUrl(fallbackUrl) ||
        fallbackUrl.trim()
    );
}

function normaliseDateTime(value: unknown) {
    if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
        return value;
    }

    return new Date().toISOString();
}

function normaliseScore(value: unknown) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return null;
    }

    return Math.min(100, Math.max(0, Math.round(value)));
}

function normaliseFiniteNumber(value: unknown) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return null;
    }

    return value;
}

function normaliseNonNegativeNumber(value: unknown) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        return null;
    }

    return value;
}

function normaliseFractionalScore(value: unknown) {
    if (
        typeof value !== 'number' ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 1
    ) {
        return null;
    }

    return value;
}

function normaliseSource(value: unknown): ReportInsightsSource {
    return REPORT_INSIGHT_SOURCES.includes(value as ReportInsightsSource)
        ? (value as ReportInsightsSource)
        : 'PAGESPEED';
}

function normaliseStrategy(
    value: unknown,
    fallbackStrategy: PageSpeedStrategy
): PageSpeedStrategy {
    return PAGE_SPEED_STRATEGIES.includes(value as PageSpeedStrategy)
        ? (value as PageSpeedStrategy)
        : fallbackStrategy;
}

function normaliseMetric(value: unknown): ReportInsightMetric | undefined {
    if (
        !isRecord(value) ||
        !REPORT_INSIGHT_METRIC_UNITS.includes(value.unit as ReportInsightMetric['unit'])
    ) {
        return undefined;
    }

    const metric: ReportInsightMetric = {
        value: normaliseFiniteNumber(value.value),
        unit: value.unit as ReportInsightMetric['unit'],
        displayValue: normaliseNullableText(value.displayValue, 500),
        category: normaliseNullableText(value.category, 100)
    };

    return metric;
}

function normaliseMetrics(value: unknown): ReportInsights['metrics'] {
    if (!isRecord(value)) {
        return {};
    }

    return REPORT_INSIGHT_METRIC_NAMES.reduce<ReportInsights['metrics']>(
        (metrics, metricName) => {
            const metric = normaliseMetric(value[metricName]);

            if (metric) {
                metrics[metricName] = metric;
            }

            return metrics;
        },
        {}
    );
}

function normaliseFieldData(value: unknown): ReportInsights['fieldData'] {
    if (
        !isRecord(value) ||
        !REPORT_INSIGHT_SOURCES.includes(value.source as ReportInsightsSource)
    ) {
        return null;
    }

    return {
        source: value.source as ReportInsightsSource,
        overallCategory: normaliseNullableText(value.overallCategory, 100),
        metrics: normaliseMetrics(value.metrics)
    };
}

function normaliseList<T>(
    value: unknown,
    normaliseItem: (item: unknown) => T | null,
    maxLength: number
) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item) => normaliseItem(item))
        .filter((item): item is T => item !== null)
        .slice(0, maxLength);
}

function normaliseOpportunity(value: unknown): ReportInsightOpportunity | null {
    if (!isRecord(value)) {
        return null;
    }

    const id = normaliseRequiredText(value.id, 120);
    const title = normaliseRequiredText(value.title, 300);

    if (!id || !title) {
        return null;
    }

    return {
        id,
        title,
        displayValue: normaliseNullableText(value.displayValue, 300),
        score: normaliseFractionalScore(value.score),
        overallSavingsMs: normaliseNonNegativeNumber(value.overallSavingsMs)
    };
}

function normaliseAuditSeverity(value: unknown): ReportInsightAuditSeverity | null {
    if (typeof value !== 'string') {
        return null;
    }

    const normalisedValue = value.trim().toLowerCase();

    if (REPORT_INSIGHT_AUDIT_SEVERITIES.includes(normalisedValue as ReportInsightAuditSeverity)) {
        return normalisedValue as ReportInsightAuditSeverity;
    }

    return REPORT_INSIGHT_AUDIT_SEVERITY_ALIASES[normalisedValue] ?? null;
}

function normaliseAuditRef(value: unknown): ReportInsightAuditRef | null {
    if (!isRecord(value)) {
        return null;
    }

    const severity = normaliseAuditSeverity(value.severity);
    const id = normaliseRequiredText(value.id, 120);
    const title = normaliseRequiredText(value.title, 300);
    const category = normaliseRequiredText(value.category, 120);

    if (!id || !title || !category || !severity) {
        return null;
    }

    return {
        id,
        title,
        category,
        severity,
        displayValue: normaliseNullableText(value.displayValue, 300),
        score: normaliseFractionalScore(value.score)
    };
}

function normaliseUserTiming(value: unknown): ReportInsightUserTiming | null {
    if (
        !isRecord(value) ||
        !REPORT_INSIGHT_USER_TIMING_ENTRY_TYPES.includes(
            value.entryType as ReportInsightUserTimingEntryType
        )
    ) {
        return null;
    }

    const name = normaliseRequiredText(value.name, 200);

    if (!name) {
        return null;
    }

    return {
        name,
        entryType: value.entryType as ReportInsightUserTimingEntryType,
        startTime: normaliseNonNegativeNumber(value.startTime),
        duration: normaliseNonNegativeNumber(value.duration),
        displayValue: normaliseNullableText(value.displayValue, 120)
    };
}

function normaliseReportInsights(
    insights: ReportInsights,
    fallbackPageUrl: string,
    fallbackStrategy: PageSpeedStrategy
): ReportInsights {
    const insightRecord: UnknownRecord = isRecord(insights) ? insights : {};
    const scores: UnknownRecord = isRecord(insightRecord.scores) ? insightRecord.scores : {};
    const normalisedInsights: ReportInsights = {
        source: normaliseSource(insightRecord.source),
        strategy: normaliseStrategy(insightRecord.strategy, fallbackStrategy),
        testedUrl: normaliseRequiredUrl(insightRecord.testedUrl, fallbackPageUrl),
        finalUrl: normaliseNullableUrl(insightRecord.finalUrl),
        fetchedAt: normaliseDateTime(insightRecord.fetchedAt),
        lighthouseVersion: normaliseNullableText(insightRecord.lighthouseVersion, 80),
        scores: {
            performance: normaliseScore(scores.performance),
            accessibility: normaliseScore(scores.accessibility),
            bestPractices: normaliseScore(scores.bestPractices),
            seo: normaliseScore(scores.seo),
            agenticBrowsing: normaliseScore(scores.agenticBrowsing)
        },
        metrics: normaliseMetrics(insightRecord.metrics),
        opportunities: normaliseList(insightRecord.opportunities, normaliseOpportunity, 5)
    };

    if (hasOwnProperty(insightRecord, 'fieldData')) {
        normalisedInsights.fieldData = normaliseFieldData(insightRecord.fieldData);
    }

    if (Array.isArray(insightRecord.auditRefs)) {
        normalisedInsights.auditRefs = normaliseList(
            insightRecord.auditRefs,
            normaliseAuditRef,
            20
        );
    }

    if (Array.isArray(insightRecord.userTimings)) {
        normalisedInsights.userTimings = normaliseList(
            insightRecord.userTimings,
            normaliseUserTiming,
            50
        );
    }

    return normalisedInsights;
}

export { normaliseReportInsights };
