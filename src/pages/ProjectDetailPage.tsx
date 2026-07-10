import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
    ORDER_OPTIONS,
    REPORT_SORT_OPTIONS,
    STATUS_OPTIONS,
    getProjectById,
    getProjectReportGroups,
    getProjectReportGroupTrends,
    getProjectReports
} from '../api/projects';
import { normaliseAllowedValue, normaliseLimit, normalisePage } from '../api/query';
import { Alert } from '../components/feedback/Alert';
import { Loading } from '../components/feedback/Loading';
import { ModalDialog } from '../components/feedback/ModalDialog';
import { EditProjectForm } from '../components/projects/EditProjectForm';
import { CreateReportForm } from '../components/reports/CreateReportForm';
import { EditReportForm } from '../components/reports/EditReportForm';
import { ReportGroupTrendChart } from '../components/reports/ReportGroupTrendChart';
import { ReportInsightsSummary } from '../components/reports/ReportInsightsSummary';
import { SCORE_ITEMS, type ScoreKey } from '../components/reports/reportScores';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type {
    PaginatedResponse,
    Project,
    Report,
    ReportGroup,
    ReportGroupTrend,
    ResourceStatus
} from '../types/api';

type ReportSection = {
    key: string;
    name: string;
    reports: Report[];
};

type ReportScoreComparison = Partial<Record<ScoreKey, number>>;

function formatReportDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(date);
}

function getReportGroupName(report: Report, groups: ReportGroup[]) {
    return (
        report.group?.name ||
        groups.find((group) => group.id === report.groupId)?.name ||
        'Ungrouped'
    );
}

function getReportSections(reports: Report[], groups: ReportGroup[], shouldGroup: boolean) {
    if (!shouldGroup) {
        return [
            {
                key: 'filtered',
                name: '',
                reports
            }
        ];
    }

    const sections: ReportSection[] = [];

    for (const report of reports) {
        const key = report.groupId || 'ungrouped';
        const existingSection = sections.find((section) => section.key === key);

        if (existingSection) {
            existingSection.reports.push(report);
            continue;
        }

        sections.push({
            key,
            name: getReportGroupName(report, groups),
            reports: [report]
        });
    }

    return sections;
}

function getTrendMap(trends: ReportGroupTrend[]) {
    return new Map(trends.map((trend) => [trend.groupId, trend]));
}

function getReportTimestamp(report: Report) {
    const timestamp = new Date(report.createdAt).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getReportComparisonMap(reports: Report[]) {
    const comparisons = new Map<string, ReportScoreComparison>();
    const reportsByGroup = new Map<string, Report[]>();
    const reportsWithApiComparison = new Set<string>();

    for (const report of reports) {
        if (report.comparison !== undefined) {
            reportsWithApiComparison.add(report.id);

            if (report.comparison) {
                comparisons.set(report.id, report.comparison.scores);
            }
        }

        const key = report.groupId || 'ungrouped';
        const groupReports = reportsByGroup.get(key) || [];

        groupReports.push(report);
        reportsByGroup.set(key, groupReports);
    }

    for (const groupReports of reportsByGroup.values()) {
        const chronologicalReports = [...groupReports].sort((firstReport, secondReport) => {
            const timestampDifference =
                getReportTimestamp(firstReport) - getReportTimestamp(secondReport);

            return timestampDifference === 0
                ? firstReport.id.localeCompare(secondReport.id)
                : timestampDifference;
        });

        for (let index = 1; index < chronologicalReports.length; index += 1) {
            const report = chronologicalReports[index];
            const previousReport = chronologicalReports[index - 1];
            const comparison: ReportScoreComparison = {};

            if (reportsWithApiComparison.has(report.id)) {
                continue;
            }

            for (const score of SCORE_ITEMS) {
                comparison[score.key] = report[score.key] - previousReport[score.key];
            }

            comparisons.set(report.id, comparison);
        }
    }

    return comparisons;
}

function getPreviousReportMap(reports: Report[]) {
    const previousReports = new Map<string, Report>();
    const reportsByGroup = new Map<string, Report[]>();

    for (const report of reports) {
        const key = report.groupId || 'ungrouped';
        const groupReports = reportsByGroup.get(key) || [];

        groupReports.push(report);
        reportsByGroup.set(key, groupReports);
    }

    for (const groupReports of reportsByGroup.values()) {
        const chronologicalReports = [...groupReports].sort((firstReport, secondReport) => {
            const timestampDifference =
                getReportTimestamp(firstReport) - getReportTimestamp(secondReport);

            return timestampDifference === 0
                ? firstReport.id.localeCompare(secondReport.id)
                : timestampDifference;
        });

        for (let index = 1; index < chronologicalReports.length; index += 1) {
            previousReports.set(chronologicalReports[index].id, chronologicalReports[index - 1]);
        }
    }

    return previousReports;
}

function formatScoreDelta(delta: number) {
    if (delta > 0) {
        return `+${delta}`;
    }

    return String(delta);
}

function formatScoreDeltaLabel(label: string, delta: number) {
    const absoluteDelta = Math.abs(delta);
    const pointLabel = absoluteDelta === 1 ? 'point' : 'points';

    if (delta > 0) {
        return `${label} improved by ${absoluteDelta} ${pointLabel} from the previous report.`;
    }

    if (delta < 0) {
        return `${label} declined by ${absoluteDelta} ${pointLabel} from the previous report.`;
    }

    return `${label} did not change from the previous report.`;
}

function getScoreDeltaClass(delta: number) {
    if (delta > 0) {
        return 'score-delta score-delta--improved';
    }

    if (delta < 0) {
        return 'score-delta score-delta--declined';
    }

    return 'score-delta score-delta--unchanged';
}

function getEmptyReportsTitle(status: ResourceStatus) {
    if (status === 'archived') {
        return 'No archived reports found';
    }

    if (status === 'all') {
        return 'No reports found';
    }

    return 'No active reports found';
}

function getEmptyReportsMessage(status: ResourceStatus) {
    if (status === 'archived') {
        return 'Archived reports will appear here when you archive them.';
    }

    return 'Create a report to start reviewing this project.';
}

function ProjectDetailPage() {
    const { id = '' } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [project, setProject] = useState<Project | null>(null);
    const [reports, setReports] = useState<PaginatedResponse<Report> | null>(null);
    const [reportGroups, setReportGroups] = useState<ReportGroup[]>([]);
    const [reportGroupTrends, setReportGroupTrends] = useState<ReportGroupTrend[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    const [editingReportId, setEditingReportId] = useState<string | null>(null);
    const [editProjectDialogOpen, setEditProjectDialogOpen] = useState(false);
    const [createReportDialogOpen, setCreateReportDialogOpen] = useState(false);
    const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

    const debouncedSearch = useDebouncedValue(searchInput, 300);
    const page = normalisePage(searchParams.get('page'));
    const limit = normaliseLimit(searchParams.get('limit'));
    const search = searchParams.get('search') || '';
    const groupId = searchParams.get('groupId') || '';
    const sort = normaliseAllowedValue(searchParams.get('sort'), REPORT_SORT_OPTIONS, 'createdAt');
    const order = normaliseAllowedValue(searchParams.get('order'), ORDER_OPTIONS, 'desc');
    const status = normaliseAllowedValue(searchParams.get('status'), STATUS_OPTIONS, 'active');

    useDocumentTitle(project ? `${project.name} | Site Score UI` : 'Project | Site Score UI');

    const updateQuery = useCallback(
        (next: Record<string, string>) => {
            const params = new URLSearchParams(searchParams);

            for (const [key, value] of Object.entries(next)) {
                if (value) {
                    params.set(key, value);
                } else {
                    params.delete(key);
                }
            }

            setSearchParams(params);
        },
        [searchParams, setSearchParams]
    );

    useEffect(() => {
        async function loadProjectData() {
            setIsLoading(true);
            setError('');
    
            try {
                const [projectData, groupData, reportData] = await Promise.all([
                    getProjectById(id),
                    getProjectReportGroups(id).catch((): ReportGroup[] => []),
                    getProjectReports(id, {
                        page,
                        limit,
                        search,
                        sort,
                        order,
                        groupId: groupId || undefined,
                        status: status === 'active' ? undefined : status
                    })
                ]);
    
                setProject(projectData);
                setReportGroups(groupData);
                setReports(reportData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load project');
            } finally {
                setIsLoading(false);
            }
        }
    
        if (id) {
            void loadProjectData();
        }
    }, [id, page, limit, search, sort, order, groupId, status, reloadKey]);

    useEffect(() => {
        let isCurrentRequest = true;

        async function loadReportGroupTrends() {
            setReportGroupTrends([]);

            if (status === 'archived') {
                return;
            }

            try {
                const trendData = await getProjectReportGroupTrends(id, {
                    groupId: groupId || undefined
                });

                if (isCurrentRequest) {
                    setReportGroupTrends(trendData);
                }
            } catch {
                if (isCurrentRequest) {
                    setReportGroupTrends([]);
                }
            }
        }

        if (id) {
            void loadReportGroupTrends();
        }

        return () => {
            isCurrentRequest = false;
        };
    }, [id, groupId, status, reloadKey]);

    useEffect(() => {
        setSearchInput(search);
    }, [search]);

    useEffect(() => {
        if (debouncedSearch === search) {
            return;
        }
    
        updateQuery({
            search: debouncedSearch,
            page: '1'
        });
    }, [debouncedSearch, search, updateQuery]);

    useEffect(() => {
        setSuccessMessage('');
    }, [search, sort, order, groupId, status, page]);

    function setPage(nextPage: number) {
        const params = new URLSearchParams(searchParams);
        params.set('page', String(nextPage));
        setSearchParams(params);
    }

    function handleProjectUpdated(updatedProject: Project) {
        setProject(updatedProject);
        setSuccessMessage(`Project updated: ${updatedProject.name}`);
        setEditProjectDialogOpen(false);
    }

    function handleProjectDeleted() {
        navigate('/projects');
    }

    function removeReportFromCurrentList(reportId: string) {
        setReports((current) => {
            if (!current) {
                return current;
            }

            const nextData = current.data.filter((report) => report.id !== reportId);
            const nextTotal = Math.max(current.pagination.total - 1, 0);

            return {
                data: nextData,
                pagination: {
                    ...current.pagination,
                    total: nextTotal,
                    totalPages: nextTotal === 0 ? 0 : Math.ceil(nextTotal / current.pagination.limit)
                }
            };
        });
    }

    function handleReportCreated() {
        setSuccessMessage('Report created successfully');
        setReloadKey((value) => value + 1);
        setCreateReportDialogOpen(false);
    }

    function handleReportGroupCreated(group: ReportGroup) {
        setReportGroups((current) => {
            if (current.some((item) => item.id === group.id)) {
                return current;
            }

            return [...current, group];
        });
    }

    function handleReportUpdated(updatedReport: Report) {
        setReports((current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                data: current.data.map((report) =>
                    report.id === updatedReport.id ? updatedReport : report
                )
            };
        });

        setEditingReportId(null);
        setSuccessMessage(`Report updated: ${updatedReport.title}`);
        setReloadKey((value) => value + 1);
    }

    function handleReportDeleted(reportId: string) {
        removeReportFromCurrentList(reportId);

        setEditingReportId(null);
        setSuccessMessage('Report deleted successfully');
        setReloadKey((value) => value + 1);
    }

    function handleReportArchived(reportId: string) {
        removeReportFromCurrentList(reportId);
        setEditingReportId(null);
        setSuccessMessage('Report archived successfully');
        setReloadKey((value) => value + 1);
    }

    function handleReportRestored(report: Report) {
        if (status === 'all') {
            handleReportUpdated(report);
            return;
        }

        removeReportFromCurrentList(report.id);
        setEditingReportId(null);
        setSuccessMessage('Report restored successfully');
        setReloadKey((value) => value + 1);
    }

    const reportComparisons = reports ? getReportComparisonMap(reports.data) : new Map();
    const previousReports = reports ? getPreviousReportMap(reports.data) : new Map();
    const reportTrends = getTrendMap(reportGroupTrends);
    const shouldShowReportTrends = status !== 'archived';

    function renderReportCard(report: Report, headingLevel: 3 | 4) {
        const comparison = reportComparisons.get(report.id);
        const previousReport = previousReports.get(report.id);
        const ReportHeading = headingLevel === 4 ? 'h4' : 'h3';

        return (
            <li key={report.id} className='item-card'>
                {editingReportId === report.id ? (
                    <>
                        <ReportHeading>Edit report</ReportHeading>
                        <EditReportForm
                            report={report}
                            groups={reportGroups}
                            onUpdated={handleReportUpdated}
                            onArchived={handleReportArchived}
                            onRestored={handleReportRestored}
                            onDeleted={handleReportDeleted}
                            onCancel={() => setEditingReportId(null)}
                        />
                    </>
                ) : (
                    <>
                        <div className='item-card__header'>
                            <ReportHeading>{report.title}</ReportHeading>
                            <div className='item-card__actions'>
                                {report.archivedAt ? (
                                    <span className='status-pill'>Archived</span>
                                ) : null}
                                <button
                                    type='button'
                                    onClick={() => setEditingReportId(report.id)}
                                >
                                    Edit
                                </button>
                            </div>
                        </div>

                        <dl className='report-card__meta'>
                            <div>
                                <dt>Date</dt>
                                <dd>{formatReportDate(report.createdAt)}</dd>
                            </div>
                        </dl>

                        <p className='report-card__url'>{report.pageUrl}</p>

                        <dl className='score-grid'>
                            {SCORE_ITEMS.map((score) => {
                                const delta = comparison?.[score.key];

                                return (
                                    <div key={score.key}>
                                        <dt>{score.label}</dt>
                                        <dd>
                                            <span className='score-grid__value'>
                                                {report[score.key]}
                                            </span>
                                            {delta === undefined ? null : (
                                                <span
                                                    className={getScoreDeltaClass(delta)}
                                                    aria-label={formatScoreDeltaLabel(score.label, delta)}
                                                >
                                                    {formatScoreDelta(delta)}
                                                </span>
                                            )}
                                        </dd>
                                    </div>
                                );
                            })}
                        </dl>

                        {report.insights ? (
                            <ReportInsightsSummary
                                insights={report.insights}
                                previousInsights={previousReport?.insights ?? null}
                                userTimingComparisons={report.comparison?.userTimings}
                            />
                        ) : null}
                    </>
                )}
            </li>
        );
    }

    return (
        <section className='page'>
            <p>
                <Link to='/projects'>← Back to projects</Link>
            </p>

            {isLoading ? (
                <Loading
                    label='Loading project details'
                    description='The API may be waking from an idle state. This usually clears in a few seconds.'
                    size='large'
                    centred
                />
            ) : null}

            {error ? (
                <Alert variant='error' title='Could not load project'>
                    {error}
                </Alert>
            ) : null}

            {!isLoading && !error && project ? (
                <>
                    <div className='page-heading page-heading--with-actions'>
                        <div>
                            <div className='heading-with-status'>
                                <h1>{project.name}</h1>
                                {project.archivedAt ? (
                                    <span className='status-pill'>Archived</span>
                                ) : null}
                            </div>
                            <p>{project.url}</p>
                        </div>
                        <div className='page-heading__actions'>
                            <button type='button' onClick={() => setCreateReportDialogOpen(true)}>
                                Create report
                            </button>
                            <button type='button' onClick={() => setEditProjectDialogOpen(true)}>
                                Edit project
                            </button>
                        </div>
                    </div>

                    <ModalDialog
                        title='Create report'
                        open={createReportDialogOpen}
                        onClose={() => setCreateReportDialogOpen(false)}
                    >
                        {createReportDialogOpen ? (
                            <CreateReportForm
                                variant='embedded'
                                projectId={project.id}
                                groups={reportGroups}
                                defaultReportGroupId={groupId}
                                defaultPageSpeedUrl={project.url}
                                onCreated={handleReportCreated}
                                onGroupCreated={handleReportGroupCreated}
                            />
                        ) : null}
                    </ModalDialog>

                    <ModalDialog
                        title='Edit project'
                        open={editProjectDialogOpen}
                        onClose={() => setEditProjectDialogOpen(false)}
                    >
                        {editProjectDialogOpen ? (
                            <EditProjectForm
                                variant='embedded'
                                project={project}
                                onUpdated={handleProjectUpdated}
                                onDeleted={handleProjectDeleted}
                            />
                        ) : null}
                    </ModalDialog>

                    {successMessage ? (
                        <Alert variant='success' title='Success'>
                            {successMessage}
                        </Alert>
                    ) : null}

                    <div className='card'>
                        <h2>Reports</h2>

                        <div className='toolbar'>
                            <label>
                                <span>Search</span>
                                <input
                                    type='text'
                                    value={searchInput}
                                    onChange={(event) => setSearchInput(event.target.value)}
                                    placeholder='Search title or summary'
                                />
                            </label>

                            <label>
                                <span>Group</span>
                                <select
                                    value={groupId}
                                    onChange={(event) =>
                                        updateQuery({
                                            groupId: event.target.value,
                                            page: '1'
                                        })
                                    }
                                >
                                    <option value=''>All groups</option>
                                    {reportGroups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                <span>Status</span>
                                <select
                                    value={status}
                                    onChange={(event) =>
                                        updateQuery({
                                            status: event.target.value === 'active' ? '' : event.target.value,
                                            page: '1'
                                        })
                                    }
                                >
                                    <option value='active'>Active reports</option>
                                    <option value='archived'>Archived reports</option>
                                    <option value='all'>All reports</option>
                                </select>
                            </label>

                            <label>
                                <span>Sort</span>
                                <select
                                    value={sort}
                                    onChange={(event) =>
                                        updateQuery({
                                            sort: event.target.value,
                                            page: '1'
                                        })
                                    }
                                >
                                    <option value='createdAt'>Created date</option>
                                    <option value='title'>Title</option>
                                </select>
                            </label>

                            <label>
                                <span>Order</span>
                                <select
                                    value={order}
                                    onChange={(event) =>
                                        updateQuery({
                                            order: event.target.value,
                                            page: '1'
                                        })
                                    }
                                >
                                    <option value='desc'>Descending</option>
                                    <option value='asc'>Ascending</option>
                                </select>
                            </label>
                        </div>

                        {reports && reports.data.length > 0 ? (
                            <>
                                <div className='report-group-list'>
                                    {getReportSections(reports.data, reportGroups, true).map((section) => {
                                        const trend = reportTrends.get(section.key);

                                        return (
                                            <section key={section.key} className='report-group-section'>
                                                <h3>{section.name}</h3>
                                                {shouldShowReportTrends && trend ? (
                                                    <ReportGroupTrendChart trend={trend} />
                                                ) : null}
                                                <ul className='item-list'>
                                                    {section.reports.map((report) =>
                                                        renderReportCard(report, 4)
                                                    )}
                                                </ul>
                                            </section>
                                        );
                                    })}
                                </div>

                                <div className='pagination'>
                                    <button
                                        type='button'
                                        onClick={() => setPage(Math.max(page - 1, 1))}
                                        disabled={page <= 1}
                                    >
                                        Previous
                                    </button>

                                    <span>
                                        Page {reports.pagination.page} of {Math.max(reports.pagination.totalPages, 1)}
                                    </span>

                                    <button
                                        type='button'
                                        onClick={() => setPage(page + 1)}
                                        disabled={page >= reports.pagination.totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </>
                        ) : (
                            <Alert variant='info' title={getEmptyReportsTitle(status)}>
                                {getEmptyReportsMessage(status)}
                            </Alert>
                        )}
                    </div>
                </>
            ) : null}
        </section>
    );
}

export { ProjectDetailPage };
