import { useId, useState } from 'react';
import type {
    ReportGroupTrend,
    ReportInsightResourceType,
    ReportTrendPoint
} from '../../types/api';

const CHART_WIDTH = 640;
const CHART_HEIGHT = 180;
const PADDING = {
    top: 16,
    right: 18,
    bottom: 34,
    left: 90
};

const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom;

type TechnicalMetricKey = 'pageWeight' | 'domNodes' | ReportInsightResourceType;

type TechnicalMetricOption = {
    key: TechnicalMetricKey;
    label: string;
    kind: 'bytes' | 'count';
};

type TechnicalTrendPoint = {
    point: ReportTrendPoint;
    value: number;
    requestCount: number | null;
};

const TECHNICAL_METRICS: TechnicalMetricOption[] = [
    {
        key: 'pageWeight',
        label: 'Page weight',
        kind: 'bytes'
    },
    {
        key: 'document',
        label: 'HTML',
        kind: 'bytes'
    },
    {
        key: 'stylesheet',
        label: 'CSS',
        kind: 'bytes'
    },
    {
        key: 'script',
        label: 'JavaScript',
        kind: 'bytes'
    },
    {
        key: 'image',
        label: 'Images',
        kind: 'bytes'
    },
    {
        key: 'media',
        label: 'Media',
        kind: 'bytes'
    },
    {
        key: 'font',
        label: 'Fonts',
        kind: 'bytes'
    },
    {
        key: 'other',
        label: 'Other',
        kind: 'bytes'
    },
    {
        key: 'third-party',
        label: 'Third-party',
        kind: 'bytes'
    },
    {
        key: 'domNodes',
        label: 'DOM nodes',
        kind: 'count'
    }
];

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

function formatInteger(value: number) {
    return new Intl.NumberFormat('en-GB').format(value);
}

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

function getResourcePoint(
    point: ReportTrendPoint,
    resourceType: ReportInsightResourceType
) {
    return point.technicalMetrics?.resources.find((resource) => resource.resourceType === resourceType);
}

function getMetricValue(point: ReportTrendPoint, metric: TechnicalMetricOption) {
    if (metric.key === 'pageWeight') {
        return point.technicalMetrics?.pageWeightBytes ?? null;
    }

    if (metric.key === 'domNodes') {
        return point.technicalMetrics?.domNodes ?? null;
    }

    return getResourcePoint(point, metric.key as ReportInsightResourceType)?.transferSize ?? null;
}

function getRequestCount(point: ReportTrendPoint, metric: TechnicalMetricOption) {
    if (metric.kind === 'count' || metric.key === 'pageWeight') {
        return null;
    }

    return getResourcePoint(point, metric.key as ReportInsightResourceType)?.requestCount ?? null;
}

function getMetricPoints(
    points: ReportTrendPoint[],
    metric: TechnicalMetricOption
): TechnicalTrendPoint[] {
    return points
        .map((point): TechnicalTrendPoint | null => {
            const value = getMetricValue(point, metric);

            if (value === null) {
                return null;
            }

            return {
                point,
                value,
                requestCount: getRequestCount(point, metric)
            };
        })
        .filter((point): point is TechnicalTrendPoint => point !== null);
}

function getAvailableMetrics(points: ReportTrendPoint[]) {
    return TECHNICAL_METRICS.filter((metric) => getMetricPoints(points, metric).length >= 2);
}

function formatMetricValue(metric: TechnicalMetricOption, value: number) {
    return metric.kind === 'bytes' ? formatBytes(value) : formatInteger(value);
}

function getXPosition(index: number, totalPoints: number) {
    if (totalPoints <= 1) {
        return PADDING.left + PLOT_WIDTH / 2;
    }

    return PADDING.left + (index / (totalPoints - 1)) * PLOT_WIDTH;
}

function getYPosition(value: number, maxValue: number) {
    return PADDING.top + ((maxValue - value) / maxValue) * PLOT_HEIGHT;
}

function getLinePath(points: TechnicalTrendPoint[], maxValue: number) {
    return points
        .map(({ value }, index) => {
            const command = index === 0 ? 'M' : 'L';
            const x = getXPosition(index, points.length);
            const y = getYPosition(value, maxValue);

            return `${command} ${x.toFixed(2)} ${y.toFixed(2)}`;
        })
        .join(' ');
}

type ReportTechnicalTrendChartProps = {
    trend: ReportGroupTrend;
};

function ReportTechnicalTrendChart({ trend }: ReportTechnicalTrendChartProps) {
    const titleId = useId();
    const descriptionId = useId();
    const [selectedMetricKey, setSelectedMetricKey] = useState<TechnicalMetricKey>('pageWeight');
    const points = getChronologicalPoints(trend.points);
    const technicalPointCount = points.filter((point) => point.technicalMetrics).length;

    if (technicalPointCount < 2) {
        return null;
    }

    const availableMetrics = getAvailableMetrics(points);
    const selectedMetric =
        availableMetrics.find((metric) => metric.key === selectedMetricKey) ??
        availableMetrics[0];

    if (!selectedMetric) {
        return null;
    }

    const metricPoints = getMetricPoints(points, selectedMetric);
    const maxValue = Math.max(...metricPoints.map((point) => point.value), 1);

    return (
        <section className='report-trend report-technical-trend' role='group' aria-label={`Technical trend for ${trend.groupName}`}>
            <div className='report-trend__header report-technical-trend__header'>
                <div>
                    <p className='report-trend__eyebrow'>Technical trend</p>
                    <p className='report-trend__range'>
                        {metricPoints.length} results from {formatReportDate(metricPoints[0].point.createdAt)} to {formatReportDate(metricPoints[metricPoints.length - 1].point.createdAt)}
                    </p>
                </div>

                <label className='report-technical-trend__metric'>
                    <span>Metric</span>
                    <select
                        value={selectedMetric.key}
                        onChange={(event) => {
                            setSelectedMetricKey(event.currentTarget.value as TechnicalMetricKey);
                        }}
                    >
                        {availableMetrics.map((metric) => (
                            <option key={metric.key} value={metric.key}>
                                {metric.label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className='report-trend__chart-wrap'>
                <svg
                    className='report-trend__chart report-technical-trend__chart'
                    role='img'
                    aria-labelledby={`${titleId} ${descriptionId}`}
                    viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                    focusable='false'
                >
                    <title id={titleId}>{selectedMetric.label} trend chart for {trend.groupName}</title>
                    <desc id={descriptionId}>
                        {selectedMetric.label} from {formatReportDate(metricPoints[0].point.createdAt)} to {formatReportDate(metricPoints[metricPoints.length - 1].point.createdAt)}.
                    </desc>

                    <g className='report-trend__grid' aria-hidden='true'>
                        {[0, 0.5, 1].map((ratio) => {
                            const value = maxValue * ratio;
                            const y = getYPosition(value, maxValue);

                            return (
                                <g key={ratio}>
                                    <line
                                        x1={PADDING.left}
                                        x2={CHART_WIDTH - PADDING.right}
                                        y1={y}
                                        y2={y}
                                    />
                                    <text x={PADDING.left - 10} y={y + 4} textAnchor='end'>
                                        {ratio === 0 ? '0' : formatMetricValue(selectedMetric, value)}
                                    </text>
                                </g>
                            );
                        })}
                    </g>

                    <g className='report-trend__axis' aria-hidden='true'>
                        <text x={PADDING.left} y={CHART_HEIGHT - 8} textAnchor='start'>
                            {formatReportDate(metricPoints[0].point.createdAt)}
                        </text>
                        <text x={CHART_WIDTH - PADDING.right} y={CHART_HEIGHT - 8} textAnchor='end'>
                            {formatReportDate(metricPoints[metricPoints.length - 1].point.createdAt)}
                        </text>
                    </g>

                    <g className='report-technical-trend__series' aria-label={`${selectedMetric.label} trend for ${trend.groupName}`}>
                        <path d={getLinePath(metricPoints, maxValue)} />
                        {metricPoints.map(({ point, value }, index) => (
                            <circle
                                key={point.id}
                                cx={getXPosition(index, metricPoints.length)}
                                cy={getYPosition(value, maxValue)}
                                r='4'
                            >
                                <title>
                                    {selectedMetric.label}: {formatMetricValue(selectedMetric, value)} on {formatReportDate(point.createdAt)}
                                </title>
                            </circle>
                        ))}
                    </g>
                </svg>
            </div>

            <table className='vh' aria-label={`Technical trend data for ${trend.groupName}`}>
                <thead>
                    <tr>
                        <th scope='col'>Result</th>
                        <th scope='col'>Date</th>
                        <th scope='col'>{selectedMetric.label}</th>
                        {selectedMetric.kind === 'bytes' && selectedMetric.key !== 'pageWeight' ? (
                            <th scope='col'>Requests</th>
                        ) : null}
                    </tr>
                </thead>
                <tbody>
                    {metricPoints.map(({ point, value, requestCount }) => (
                        <tr key={point.id}>
                            <th scope='row'>{point.title}</th>
                            <td>{formatReportDate(point.createdAt)}</td>
                            <td>{formatMetricValue(selectedMetric, value)}</td>
                            {selectedMetric.kind === 'bytes' && selectedMetric.key !== 'pageWeight' ? (
                                <td>{requestCount === null ? 'Not available' : formatInteger(requestCount)}</td>
                            ) : null}
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}

export { ReportTechnicalTrendChart };
