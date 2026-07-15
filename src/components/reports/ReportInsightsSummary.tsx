import type {
    ReportInsightAuditSeverity,
    ReportInsightMetric,
    ReportInsightMetricName,
    ReportInsightOpportunity,
    ReportInsightResourceSummaryItem,
    ReportInsightUserTiming,
    ReportInsightUserTimingComparison,
    ReportInsights
} from '../../types/api';

const METRIC_LABELS: Array<[ReportInsightMetricName, string]> = [
    ['pageWeight', 'Page weight'],
    ['firstContentfulPaint', 'First Contentful Paint'],
    ['speedIndex', 'Speed Index'],
    ['largestContentfulPaint', 'Largest Contentful Paint'],
    ['totalBlockingTime', 'Total Blocking Time'],
    ['cumulativeLayoutShift', 'Cumulative Layout Shift'],
    ['timeToInteractive', 'Time to Interactive'],
    ['interactionToNextPaint', 'Interaction to Next Paint']
];

const AUDIT_SEVERITY_LABELS: Record<ReportInsightAuditSeverity, string> = {
    pass: 'Pass',
    fail: 'Fail',
    warning: 'Warning',
    'not-tested': 'Not tested'
};

type ReportInsightsSummaryProps = {
    insights: ReportInsights;
    previousInsights?: ReportInsights | null;
    userTimingComparisons?: ReportInsightUserTimingComparison[];
    tone?: 'dark' | 'light';
};

function formatBytes(value: number) {
    if (value <= 0) {
        return '0 bytes';
    }

    if (value < 1024) {
        return '< 1 KiB';
    }

    const units = ['KiB', 'MiB', 'GiB'];
    let size = value / 1024;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatInteger(value: number) {
    return new Intl.NumberFormat('en-GB').format(value);
}

function formatMetric(metric: ReportInsightMetric, key: ReportInsightMetricName) {
    if (metric.displayValue) {
        if (key === 'pageWeight') {
            return metric.displayValue.replace(/^Total size was\s+/i, '');
        }

        return metric.displayValue;
    }

    if (metric.value === null) {
        return 'Not available';
    }

    if (metric.unit === 'bytes') {
        return formatBytes(metric.value);
    }

    if (metric.unit === 'ms') {
        return `${Math.round(metric.value)} ms`;
    }

    return String(metric.value);
}

function formatMetricDeltaValue(metric: ReportInsightMetric, delta: number) {
    const absoluteDelta = Math.abs(delta);

    if (metric.unit === 'bytes') {
        return formatBytes(absoluteDelta);
    }

    if (metric.unit === 'ms') {
        return formatMilliseconds(absoluteDelta);
    }

    if (metric.unit === 'unitless') {
        return String(Number(absoluteDelta.toFixed(3)));
    }

    return String(absoluteDelta);
}

function formatMetricDelta(metric: ReportInsightMetric, delta: number) {
    if (delta > 0) {
        return `+${formatMetricDeltaValue(metric, delta)}`;
    }

    if (delta < 0) {
        return `-${formatMetricDeltaValue(metric, delta)}`;
    }

    return formatMetricDeltaValue(metric, delta);
}

function isMetricImprovement(metric: ReportInsightMetric, delta: number) {
    return metric.unit === 'score' ? delta > 0 : delta < 0;
}

function formatMetricDeltaLabel(label: string, metric: ReportInsightMetric, delta: number) {
    const absoluteDelta = formatMetricDeltaValue(metric, delta);

    if (delta === 0) {
        return `${label} did not change compared with the previous result.`;
    }

    return isMetricImprovement(metric, delta)
        ? `${label} improved by ${absoluteDelta} compared with the previous result.`
        : `${label} declined by ${absoluteDelta} compared with the previous result.`;
}

function getMetricDeltaClass(metric: ReportInsightMetric, delta: number) {
    if (delta === 0) {
        return 'metric-delta metric-delta--unchanged';
    }

    return isMetricImprovement(metric, delta)
        ? 'metric-delta metric-delta--improved'
        : 'metric-delta metric-delta--declined';
}

function getMetricComparison(
    metric: ReportInsightMetric,
    previousMetric: ReportInsightMetric | undefined
) {
    if (
        metric.value === null ||
        previousMetric?.value === null ||
        previousMetric?.value === undefined
    ) {
        return null;
    }

    return metric.value - previousMetric.value;
}

function formatMilliseconds(value: number) {
    const roundedValue = Math.round(value);

    if (Math.abs(roundedValue) < 1000) {
        return `${roundedValue} ms`;
    }

    return `${(roundedValue / 1000).toFixed(2)} s`;
}

function formatOpportunity(opportunity: ReportInsightOpportunity) {
    if (!opportunity.displayValue) {
        return opportunity.title;
    }

    return `${opportunity.title} (${opportunity.displayValue})`;
}

function getResourceSummaryItems(items: ReportInsightResourceSummaryItem[] | undefined) {
    return items?.filter((item) => item.transferSize > 0 || item.requestCount > 0) ?? [];
}

function formatAuditCategory(category: string) {
    if (category === 'seo') {
        return 'SEO';
    }

    return category
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function formatAuditSeverity(severity: ReportInsightAuditSeverity) {
    return AUDIT_SEVERITY_LABELS[severity];
}

function formatTimingType(entryType: ReportInsightUserTiming['entryType']) {
    return entryType === 'measure' ? 'Measure' : 'Mark';
}

function getUserTimingKey(timing: Pick<ReportInsightUserTiming, 'entryType' | 'name'>) {
    return `${timing.entryType}:${timing.name}`;
}

function getUserTimingValue(timing: ReportInsightUserTiming) {
    return timing.duration ?? timing.startTime;
}

function formatUserTimingValue(timing: ReportInsightUserTiming) {
    if (timing.displayValue) {
        return timing.displayValue;
    }

    const value = getUserTimingValue(timing);

    return value === null ? 'Not available' : formatMilliseconds(value);
}

function formatTimingDelta(delta: number) {
    if (delta > 0) {
        return `+${formatMilliseconds(delta)}`;
    }

    if (delta < 0) {
        return `-${formatMilliseconds(Math.abs(delta))}`;
    }

    return '0 ms';
}

function formatTimingDeltaLabel(timing: ReportInsightUserTiming, delta: number) {
    const absoluteDelta = formatMilliseconds(Math.abs(delta));

    if (delta === 0) {
        return `${timing.name} did not change compared with the previous result.`;
    }

    if (timing.entryType === 'mark') {
        return delta < 0
            ? `${timing.name} happened earlier by ${absoluteDelta} compared with the previous result.`
            : `${timing.name} happened later by ${absoluteDelta} compared with the previous result.`;
    }

    return delta < 0
        ? `${timing.name} improved by ${absoluteDelta} compared with the previous result.`
        : `${timing.name} slowed by ${absoluteDelta} compared with the previous result.`;
}

function getTimingDeltaClass(delta: number) {
    if (delta < 0) {
        return 'metric-delta metric-delta--improved';
    }

    if (delta > 0) {
        return 'metric-delta metric-delta--declined';
    }

    return 'metric-delta metric-delta--unchanged';
}

function getUserTimingComparison(
    timing: ReportInsightUserTiming,
    previousTimingMap: Map<string, ReportInsightUserTiming>,
    userTimingComparisonMap: Map<string, ReportInsightUserTimingComparison>
) {
    const key = getUserTimingKey(timing);
    const apiComparison = userTimingComparisonMap.get(key);

    if (apiComparison && apiComparison.delta !== null) {
        return apiComparison.delta;
    }

    const currentValue = getUserTimingValue(timing);
    const previousTiming = previousTimingMap.get(key);
    const previousValue = previousTiming ? getUserTimingValue(previousTiming) : null;

    if (currentValue === null || previousValue === null) {
        return null;
    }

    return currentValue - previousValue;
}

function ReportInsightsSummary({
    insights,
    previousInsights = null,
    userTimingComparisons = [],
    tone = 'dark'
}: ReportInsightsSummaryProps) {
    const metaItems: Array<[string, string]> = [];

    if (insights.finalUrl && insights.finalUrl !== insights.testedUrl) {
        metaItems.push(['Final URL', insights.finalUrl]);
    }

    if (insights.lighthouseVersion) {
        metaItems.push(['Lighthouse', insights.lighthouseVersion]);
    }

    const visibleMetrics = METRIC_LABELS.flatMap(([key, label]) => {
        const metric = insights.metrics[key];

        if (!metric || (!metric.displayValue && metric.value === null)) {
            return [];
        }

        return [
            {
                key,
                label,
                metric,
                previousMetric: previousInsights?.metrics[key]
            }
        ];
    });
    const domSize = typeof insights.domSize?.totalElements === 'number'
        ? insights.domSize
        : null;
    const resourceSummaryItems = getResourceSummaryItems(insights.resourceSummary?.items);

    const visibleOpportunities = insights.opportunities;
    const visibleAudits = insights.auditRefs ?? [];
    const visibleUserTimings = insights.userTimings ?? [];
    const previousTimingMap = new Map(
        (previousInsights?.userTimings ?? []).map((timing) => [getUserTimingKey(timing), timing])
    );
    const userTimingComparisonMap = new Map(
        userTimingComparisons.map((timing) => [getUserTimingKey(timing), timing])
    );

    return (
        <section
            className={`report-insights report-insights--${tone}`}
            aria-label='Imported PageSpeed data'
        >
            {visibleMetrics.length > 0 || domSize ? (
                <dl className='report-insights__metrics'>
                    {visibleMetrics.map(({ key, label, metric, previousMetric }) => {
                        const delta = getMetricComparison(metric, previousMetric);

                        return (
                            <div key={key}>
                                <dt>{label}</dt>
                                <dd>
                                    <span className='report-insights__metric-value'>
                                        {formatMetric(metric, key)}
                                    </span>
                                    {delta === null ? null : (
                                        <span
                                            className={getMetricDeltaClass(metric, delta)}
                                            aria-label={formatMetricDeltaLabel(label, metric, delta)}
                                        >
                                            {formatMetricDelta(metric, delta)}
                                        </span>
                                    )}
                                </dd>
                            </div>
                        );
                    })}
                    {domSize ? (
                        <div>
                            <dt>DOM nodes</dt>
                            <dd>
                                <span className='report-insights__metric-value'>
                                    {formatInteger(domSize.totalElements ?? 0)}
                                </span>
                            </dd>
                        </div>
                    ) : null}
                </dl>
            ) : null}

            {metaItems.length > 0 ? (
                <dl className='report-insights__meta'>
                    {metaItems.map(([label, value]) => (
                        <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                        </div>
                    ))}
                </dl>
            ) : null}

            {resourceSummaryItems.length > 0 ? (
                <details className='report-insights__details'>
                    <summary>Payload breakdown ({resourceSummaryItems.length})</summary>
                    <table className='report-insights__resource-table'>
                        <thead>
                            <tr>
                                <th scope='col'>Resource</th>
                                <th scope='col'>Size</th>
                                <th scope='col'>Requests</th>
                            </tr>
                        </thead>
                        <tbody>
                            {resourceSummaryItems.map((item) => (
                                <tr key={item.resourceType}>
                                    <th scope='row'>{item.label}</th>
                                    <td>{formatBytes(item.transferSize)}</td>
                                    <td>{formatInteger(item.requestCount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </details>
            ) : null}

            {visibleOpportunities.length > 0 ? (
                <details className='report-insights__details'>
                    <summary>Opportunities ({visibleOpportunities.length})</summary>
                    <ul className='report-insights__opportunities'>
                        {visibleOpportunities.map((opportunity) => (
                            <li key={opportunity.id}>{formatOpportunity(opportunity)}</li>
                        ))}
                    </ul>
                </details>
            ) : null}

            {visibleAudits.length > 0 ? (
                <details className='report-insights__details'>
                    <summary>Audit checks ({visibleAudits.length})</summary>
                    <ul className='report-insights__audit-list'>
                        {visibleAudits.map((audit) => (
                            <li key={audit.id} className='report-insights__audit-item'>
                                <span className='report-insights__audit-row'>
                                    <span className='report-insights__audit-title'>
                                        {audit.title}
                                    </span>
                                    <span
                                        className={`report-insights__severity report-insights__severity--${audit.severity}`}
                                    >
                                        <span className='vh'>
                                            Current status:{' '}
                                        </span>
                                        {formatAuditSeverity(audit.severity)}
                                    </span>
                                </span>
                                <span className='report-insights__audit-meta'>
                                    {audit.displayValue ? (
                                        <span className='report-insights__audit-value'>
                                            {audit.displayValue}
                                        </span>
                                    ) : null}
                                    <span className='report-insights__category'>
                                        {formatAuditCategory(audit.category)}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </details>
            ) : null}

            {visibleUserTimings.length > 0 ? (
                <details className='report-insights__details'>
                    <summary>User timings ({visibleUserTimings.length})</summary>
                    <ul className='report-insights__timing-list'>
                        {visibleUserTimings.map((timing) => {
                            const delta = getUserTimingComparison(
                                timing,
                                previousTimingMap,
                                userTimingComparisonMap
                            );

                            return (
                                <li key={getUserTimingKey(timing)}>
                                    <span className='report-insights__timing-name'>
                                        {timing.name}
                                    </span>
                                    <span className='report-insights__category'>
                                        {formatTimingType(timing.entryType)}
                                    </span>
                                    <span className='report-insights__timing-value'>
                                        {formatUserTimingValue(timing)}
                                    </span>
                                    {delta === null ? null : (
                                        <span
                                            className={getTimingDeltaClass(delta)}
                                            aria-label={formatTimingDeltaLabel(timing, delta)}
                                        >
                                            {formatTimingDelta(delta)}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </details>
            ) : null}

        </section>
    );
}

export { ReportInsightsSummary };
