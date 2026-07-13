import { ApiRequestError, apiFetch } from './client';
import {
    buildQuery,
    encodePathSegment,
    normaliseAllowedValue,
    normaliseLimit,
    normalisePage
} from './query';
import type {
    PaginatedResponse,
    PaginationMeta,
    Project,
    ProjectListItem,
    ResourceStatus,
    Report,
    ReportGroup,
    ReportGroupTrend,
    ReportInsights,
    ReportInsightsImportInput
} from '../types/api';

const PROJECT_SORT_OPTIONS = ['createdAt', 'name'] as const;
const REPORT_SORT_OPTIONS = ['createdAt', 'title'] as const;
const ORDER_OPTIONS = ['asc', 'desc'] as const;
const STATUS_OPTIONS = ['active', 'archived', 'all'] as const;

type ProjectSort = (typeof PROJECT_SORT_OPTIONS)[number];
type ReportSort = (typeof REPORT_SORT_OPTIONS)[number];
type SortOrder = (typeof ORDER_OPTIONS)[number];

type GetProjectsOptions = {
    page?: number;
    limit?: number;
    search?: string;
    sort?: ProjectSort;
    order?: SortOrder;
    status?: ResourceStatus;
    clientId?: string | 'unassigned';
};

type ProjectListApiResponse =
    | PaginatedResponse<ProjectListItem>
    | ProjectListItem[]
    | {
          data?: ProjectListItem[];
          projects?: ProjectListItem[];
          pagination?: Partial<PaginationMeta>;
      };

type CreateProjectInput = {
    name: string;
    url: string;
    clientId?: string | null;
};

type CreateReportInput = {
    groupId: string;
    title: string;
    summary: string;
    pageUrl: string;
    performanceScore: number;
    accessibilityScore: number;
    seoScore: number;
    bestPracticesScore: number;
    agenticBrowsingScore: number;
    insights?: ReportInsights | null;
};

type CreateReportGroupInput = {
    name: string;
    pageUrl: string;
    strategy: ReportGroup['strategy'];
};

type ReportGroupResponse = Partial<ReportGroup> & {
    groupId?: string;
    group_id?: string;
    reportGroupId?: string;
    report_group_id?: string;
    project_id?: string;
    page_url?: string;
    created_at?: string;
};

type UpdateProjectInput = {
    name?: string;
    url?: string;
    clientId?: string | null;
};

type UpdateReportInput = {
    groupId?: string;
    title?: string;
    summary?: string;
    pageUrl?: string;
    performanceScore?: number;
    accessibilityScore?: number;
    seoScore?: number;
    bestPracticesScore?: number;
    agenticBrowsingScore?: number;
};

type GetProjectReportsOptions = {
    page?: number;
    limit?: number;
    search?: string;
    sort?: ReportSort;
    order?: SortOrder;
    groupId?: string;
    status?: ResourceStatus;
};

type GetProjectReportGroupTrendsOptions = {
    groupId?: string;
};

function updateReport(id: string, input: UpdateReportInput) {
    return apiFetch<Report>(`/reports/${encodePathSegment(id)}`, {
        method: 'PATCH',
        bodyJson: input
    });
}

function updateProject(id: string, input: UpdateProjectInput) {
    return apiFetch<Project>(`/projects/${encodePathSegment(id)}`, {
        method: 'PATCH',
        bodyJson: input
    });
}

function getRequiredString(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
}

function assertCreateReportInput(input: CreateReportInput) {
    const requiredStrings: Array<[keyof CreateReportInput, string]> = [
        ['groupId', 'Choose a report group.'],
        ['title', 'Enter a report title.'],
        ['summary', 'Enter a report summary.'],
        ['pageUrl', 'Enter a page URL.']
    ];

    for (const [key, message] of requiredStrings) {
        if (!getRequiredString(input[key])) {
            throw new Error(message);
        }
    }
}

function createReport(projectId: string, input: CreateReportInput) {
    assertCreateReportInput(input);

    return apiFetch<Report>(`/projects/${encodePathSegment(projectId)}/reports`, {
        method: 'POST',
        bodyJson: input
    });
}

function normaliseReportGroup(response: ReportGroupResponse): ReportGroup {
    return {
        id:
            response.id ||
            response.groupId ||
            response.group_id ||
            response.reportGroupId ||
            response.report_group_id ||
            '',
        projectId: response.projectId || response.project_id || '',
        name: response.name || '',
        pageUrl: response.pageUrl || response.page_url || '',
        strategy: response.strategy || 'mobile',
        createdAt: response.createdAt || response.created_at || ''
    };
}

async function createReportGroup(projectId: string, input: CreateReportGroupInput) {
    const group = await apiFetch<ReportGroupResponse>(
        `/projects/${encodePathSegment(projectId)}/report-groups`,
        {
            method: 'POST',
            bodyJson: input
        }
    );

    return normaliseReportGroup(group);
}

function importReportInsights(projectId: string, input: ReportInsightsImportInput) {
    return apiFetch<ReportInsights>(
        `/projects/${encodePathSegment(projectId)}/report-insight-imports`,
        {
            method: 'POST',
            bodyJson: input
        }
    );
}

function getProjectListData(response: ProjectListApiResponse) {
    if (Array.isArray(response)) {
        return {
            data: response,
            pagination: undefined
        };
    }

    return {
        data:
            Array.isArray(response.data)
                ? response.data
                : 'projects' in response && Array.isArray(response.projects)
                    ? response.projects
                    : [],
        pagination: response.pagination
    };
}

function normalisePagination(
    data: ProjectListItem[],
    pagination: Partial<PaginationMeta> | undefined,
    options: GetProjectsOptions
) {
    const fallbackLimit =
        options.limit === undefined ? Math.max(data.length, 1) : normaliseLimit(options.limit);
    const page = pagination?.page === undefined ? normalisePage(options.page) : normalisePage(pagination.page);
    const limit = pagination?.limit === undefined ? fallbackLimit : normaliseLimit(pagination.limit);
    const total =
        typeof pagination?.total === 'number' && Number.isFinite(pagination.total) && pagination.total >= 0
            ? pagination.total
            : data.length;
    const totalPages =
        typeof pagination?.totalPages === 'number' &&
        Number.isFinite(pagination.totalPages) &&
        pagination.totalPages >= 0
            ? pagination.totalPages
            : total === 0
                ? 0
                : Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages
    };
}

function normaliseProjectListResponse(
    response: ProjectListApiResponse,
    options: GetProjectsOptions
): PaginatedResponse<ProjectListItem> {
    const { data, pagination } = getProjectListData(response);

    return {
        data,
        pagination: normalisePagination(data, pagination, options)
    };
}

function isAuthError(error: unknown) {
    return error instanceof ApiRequestError && (error.status === 401 || error.status === 403);
}

function canRetryBareProjectList(options: GetProjectsOptions) {
    return (
        options.status === undefined &&
        options.clientId === undefined &&
        !options.search &&
        (options.page === undefined || normalisePage(options.page) === 1)
    );
}

async function getProjects(options: GetProjectsOptions = {}) {
    const query = buildQuery({
        page: options.page === undefined ? undefined : normalisePage(options.page),
        limit: options.limit === undefined ? undefined : normaliseLimit(options.limit),
        search: options.search,
        sort:
            options.sort === undefined
                ? undefined
                : normaliseAllowedValue(options.sort, PROJECT_SORT_OPTIONS, 'createdAt'),
        order:
            options.order === undefined
                ? undefined
                : normaliseAllowedValue(options.order, ORDER_OPTIONS, 'desc'),
        status:
            options.status === undefined
                ? undefined
                : normaliseAllowedValue(options.status, STATUS_OPTIONS, 'active'),
        clientId: options.clientId
    });

    try {
        const response = await apiFetch<ProjectListApiResponse>(`/projects${query}`);

        return normaliseProjectListResponse(response, options);
    } catch (error) {
        if (!canRetryBareProjectList(options) || isAuthError(error)) {
            throw error;
        }

        const response = await apiFetch<ProjectListApiResponse>('/projects');

        return normaliseProjectListResponse(response, options);
    }
}

function getProjectById(id: string) {
    return apiFetch<Project>(`/projects/${encodePathSegment(id)}`);
}

async function getProjectReportGroups(id: string) {
    const groups = await apiFetch<ReportGroupResponse[]>(
        `/projects/${encodePathSegment(id)}/report-groups`
    );

    return groups.map(normaliseReportGroup);
}

function getProjectReportGroupTrends(
    id: string,
    options: GetProjectReportGroupTrendsOptions = {}
) {
    const query = buildQuery({
        groupId: options.groupId
    });

    return apiFetch<ReportGroupTrend[]>(
        `/projects/${encodePathSegment(id)}/report-group-trends${query}`
    );
}

function getProjectReports(id: string, options: GetProjectReportsOptions = {}) {
    const query = buildQuery({
        page: options.page === undefined ? undefined : normalisePage(options.page),
        limit: options.limit === undefined ? undefined : normaliseLimit(options.limit),
        search: options.search,
        sort:
            options.sort === undefined
                ? undefined
                : normaliseAllowedValue(options.sort, REPORT_SORT_OPTIONS, 'createdAt'),
        order:
            options.order === undefined
                ? undefined
                : normaliseAllowedValue(options.order, ORDER_OPTIONS, 'desc'),
        groupId: options.groupId,
        status:
            options.status === undefined
                ? undefined
                : normaliseAllowedValue(options.status, STATUS_OPTIONS, 'active')
    });

    return apiFetch<PaginatedResponse<Report>>(
        `/projects/${encodePathSegment(id)}/reports${query}`
    );
}

function createProject(input: CreateProjectInput) {
    return apiFetch<Project>('/projects', {
        method: 'POST',
        bodyJson: input
    });
}

function deleteProject(id: string) {
    return apiFetch<void>(`/projects/${encodePathSegment(id)}`, {
        method: 'DELETE'
    });
}

function archiveProject(id: string) {
    return apiFetch<Project>(`/projects/${encodePathSegment(id)}/archive`, {
        method: 'POST'
    });
}

function restoreProject(id: string) {
    return apiFetch<Project>(`/projects/${encodePathSegment(id)}/restore`, {
        method: 'POST'
    });
}

function deleteReport(id: string) {
    return apiFetch<void>(`/reports/${encodePathSegment(id)}`, {
        method: 'DELETE'
    });
}

function archiveReport(id: string) {
    return apiFetch<Report>(`/reports/${encodePathSegment(id)}/archive`, {
        method: 'POST'
    });
}

function restoreReport(id: string) {
    return apiFetch<Report>(`/reports/${encodePathSegment(id)}/restore`, {
        method: 'POST'
    });
}

export {
    ORDER_OPTIONS,
    PROJECT_SORT_OPTIONS,
    REPORT_SORT_OPTIONS,
    STATUS_OPTIONS,
    getProjects,
    getProjectById,
    getProjectReportGroups,
    getProjectReportGroupTrends,
    getProjectReports,
    createProject,
    createReportGroup,
    createReport,
    importReportInsights,
    updateProject,
    updateReport,
    archiveProject,
    restoreProject,
    deleteProject,
    archiveReport,
    restoreReport,
    deleteReport
};
