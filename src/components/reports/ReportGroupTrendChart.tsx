import { useId } from 'react';
import type { ReportGroupTrend, ReportTrendPoint } from '../../types/api';
import { SCORE_ITEMS, type ScoreKey } from './reportScores';

const CHART_WIDTH = 640;
const CHART_HEIGHT = 220;
const PADDING = {
    top: 16,
    right: 18,
    bottom: 34,
    left: 38
};

const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

const SCORE_STYLES: Record<ScoreKey, { className: string; dashArray?: string }> = {
    performanceScore: {
        className: 'report-trend__series--performance'
    },
    accessibilityScore: {
        className: 'report-trend__series--accessibility',
        dashArray: '8 5'
    },
    seoScore: {
        className: 'report-trend__series--seo',
        dashArray: '3 5'
    },
    bestPracticesScore: {
        className: 'report-trend__series--best-practices',
        dashArray: '12 4 3 4'
    },
    agenticBrowsingScore: {
        className: 'report-trend__series--agentic-browsing',
        dashArray: '2 4 8 4'
    }
};

function getReportTimestamp(point: ReportTrendPoint) {
    const timestamp = new Date(point.createdAt).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getChronologicalPoints(points: ReportTrendPoint[]) {
    return [...points].sort((firstPoint, secondPoint) => {
        const timestampDifference = getReportTimestamp(firstPoint) - getReportTimestamp(secondPoint);

        return timestampDifference === 0
            ? firstPoint.id.localeCompare(secondPoint.id)
            : timestampDifference;
    });
}

function formatReportDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium'
    }).format(date);
}

function clampScore(value: number) {
    return Math.min(Math.max(value, 0), 100);
}

function getXPosition(index: number, totalPoints: number) {
    if (totalPoints <= 1) {
        return PADDING.left + PLOT_WIDTH / 2;
    }

    return PADDING.left + (index / (totalPoints - 1)) * PLOT_WIDTH;
}

function getYPosition(value: number) {
    return PADDING.top + ((100 - clampScore(value)) / 100) * PLOT_HEIGHT;
}

function getLinePath(points: ReportTrendPoint[], scoreKey: ScoreKey) {
    return points
        .map((point, index) => {
            const command = index === 0 ? 'M' : 'L';
            const x = getXPosition(index, points.length);
            const y = getYPosition(point[scoreKey]);

            return `${command} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(' ');
}

function getTrendRange(points: ReportTrendPoint[]) {
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    if (!firstPoint || !lastPoint) {
        return '';
    }

    return `${points.length} results from ${formatReportDate(firstPoint.createdAt)} to ${formatReportDate(lastPoint.createdAt)}`;
}

type ReportGroupTrendChartProps = {
    trend: ReportGroupTrend;
};

function ReportGroupTrendChart({ trend }: ReportGroupTrendChartProps) {
    const titleId = useId();
    const descriptionId = useId();
    const points = getChronologicalPoints(trend.points);
    const labelledBy = `Score trend for ${trend.groupName}`;

    if (points.length < 2) {
        return (
            <section className='report-trend report-trend--empty' role='group' aria-label={labelledBy}>
                <div className='report-trend__header'>
                    <div>
                        <p className='report-trend__eyebrow'>Score trend</p>
                        <p className='report-trend__range'>{trend.pageUrl}</p>
                    </div>
                </div>
                <p className='report-trend__empty' role='status'>
                    Add another result to see a trend.
                </p>
            </section>
        );
    }

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    return (
        <section className='report-trend' role='group' aria-label={labelledBy}>
            <div className='report-trend__header'>
                <div>
                    <p className='report-trend__eyebrow'>Score trend</p>
                    <p className='report-trend__range'>{getTrendRange(points)}</p>
                </div>

                <ul className='report-trend__legend' aria-label='Trend legend'>
                    {SCORE_ITEMS.map((score) => (
                        <li key={score.key} className={SCORE_STYLES[score.key].className}>
                            <span aria-hidden='true' />
                            {score.label}
                        </li>
                    ))}
                </ul>
            </div>

            <div className='report-trend__chart-wrap'>
                <svg
                    className='report-trend__chart'
                    role='img'
                    aria-labelledby={`${titleId} ${descriptionId}`}
                    viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                    focusable='false'
                >
                    <title id={titleId}>Score trend chart for {trend.groupName}</title>
                    <desc id={descriptionId}>
                        Scores from {formatReportDate(firstPoint.createdAt)} to {formatReportDate(lastPoint.createdAt)}.
                    </desc>

                    <g className='report-trend__grid' aria-hidden='true'>
                        {[0, 25, 50, 75, 100].map((value) => {
                            const y = getYPosition(value);

                            return (
                                <g key={value}>
                                    <line
                                        x1={PADDING.left}
                                        x2={CHART_WIDTH - PADDING.right}
                                        y1={y}
                                        y2={y}
                                    />
                                    <text x={PADDING.left - 10} y={y + 4} textAnchor='end'>
                                        {value}
                                    </text>
                                </g>
                            );
                        })}
                    </g>

                    <g className='report-trend__axis' aria-hidden='true'>
                        <text x={PADDING.left} y={CHART_HEIGHT - 8} textAnchor='start'>
                            {formatReportDate(firstPoint.createdAt)}
                        </text>
                        <text x={CHART_WIDTH - PADDING.right} y={CHART_HEIGHT - 8} textAnchor='end'>
                            {formatReportDate(lastPoint.createdAt)}
                        </text>
                    </g>

                    {SCORE_ITEMS.map((score) => {
                        const style = SCORE_STYLES[score.key];

                        return (
                            <g
                                key={score.key}
                                className={`report-trend__series ${style.className}`}
                                aria-label={`${score.label} trend for ${trend.groupName}`}
                            >
                                <path
                                    d={getLinePath(points, score.key)}
                                    strokeDasharray={style.dashArray}
                                />
                                {points.map((point, index) => (
                                    <circle
                                        key={point.id}
                                        cx={getXPosition(index, points.length)}
                                        cy={getYPosition(point[score.key])}
                                        r='4'
                                    >
                                        <title>
                                            {score.label}: {point[score.key]} on {formatReportDate(point.createdAt)}
                                        </title>
                                    </circle>
                                ))}
                            </g>
                        );
                    })}
                </svg>
            </div>

            <table className='vh' aria-label={`Score trend data for ${trend.groupName}`}>
                <thead>
                    <tr>
                        <th scope='col'>Result</th>
                        <th scope='col'>Date</th>
                        {SCORE_ITEMS.map((score) => (
                            <th key={score.key} scope='col'>
                                {score.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {points.map((point) => (
                        <tr key={point.id}>
                            <th scope='row'>{point.title}</th>
                            <td>{formatReportDate(point.createdAt)}</td>
                            {SCORE_ITEMS.map((score) => (
                                <td key={score.key}>{point[score.key]}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}

export { ReportGroupTrendChart };
