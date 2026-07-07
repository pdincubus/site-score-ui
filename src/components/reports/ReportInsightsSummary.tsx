import type {
    ReportInsightMetricName,
    ReportInsightOpportunity,
    ReportInsights
} from '../../types/api';

const METRIC_LABELS: Array<[ReportInsightMetricName, string]> = [
    ['largestContentfulPaint', 'Largest Contentful Paint'],
    ['cumulativeLayoutShift', 'Cumulative Layout Shift'],
    ['totalBlockingTime', 'Total Blocking Time'],
    ['firstContentfulPaint', 'First Contentful Paint'],
    ['speedIndex', 'Speed Index'],
    ['timeToInteractive', 'Time to Interactive'],
    ['interactionToNextPaint', 'Interaction to Next Paint']
];

type ReportInsightsSummaryProps = {
    insights: ReportInsights;
};

function formatDateTime(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
}

function formatSource(source: ReportInsights['source']) {
    return source === 'PAGESPEED' ? 'PageSpeed' : 'CrUX';
}

function formatStrategy(strategy: ReportInsights['strategy']) {
    return strategy === 'desktop' ? 'Desktop' : 'Mobile';
}

function formatScore(score: number | null) {
    return score === null ? 'Not available' : String(score);
}

function formatOpportunity(opportunity: ReportInsightOpportunity) {
    if (!opportunity.displayValue) {
        return opportunity.title;
    }

    return `${opportunity.title} (${opportunity.displayValue})`;
}

function ReportInsightsSummary({ insights }: ReportInsightsSummaryProps) {
    const visibleMetrics = METRIC_LABELS.map(([key, label]) => ({
        key,
        label,
        metric: insights.metrics[key]
    })).filter(({ metric }) => metric && (metric.displayValue || metric.value !== null));

    const visibleOpportunities = insights.opportunities.slice(0, 3);

    return (
        <section className='report-insights' aria-label='Imported PageSpeed data'>
            <div className='report-insights__meta'>
                <span>{formatSource(insights.source)}</span>
                <span>{formatStrategy(insights.strategy)}</span>
                <span>{formatDateTime(insights.fetchedAt)}</span>
            </div>

            <dl className='report-insights__scores'>
                <div>
                    <dt>Performance</dt>
                    <dd>{formatScore(insights.scores.performance)}</dd>
                </div>
                <div>
                    <dt>Best practices</dt>
                    <dd>{formatScore(insights.scores.bestPractices)}</dd>
                </div>
            </dl>

            {visibleMetrics.length > 0 ? (
                <dl className='report-insights__metrics'>
                    {visibleMetrics.map(({ key, label, metric }) => (
                        <div key={key}>
                            <dt>{label}</dt>
                            <dd>{metric?.displayValue || metric?.value}</dd>
                        </div>
                    ))}
                </dl>
            ) : null}

            {visibleOpportunities.length > 0 ? (
                <ul className='report-insights__opportunities'>
                    {visibleOpportunities.map((opportunity) => (
                        <li key={opportunity.id}>{formatOpportunity(opportunity)}</li>
                    ))}
                </ul>
            ) : null}

            {insights.finalUrl && insights.finalUrl !== insights.testedUrl ? (
                <p className='muted-text'>Final URL: {insights.finalUrl}</p>
            ) : null}
        </section>
    );
}

export { ReportInsightsSummary };
