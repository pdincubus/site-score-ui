import { apiFetch } from './client';
import {
    buildQuery,
    encodePathSegment,
    normaliseAllowedValue,
    normaliseLimit,
    normalisePage
} from './query';
import type {
    PaginatedResponse,
    Project,
    Report,
    ReportInsights,
    ReportInsightsImportInput
} from '../types/api';

const PROJECT_SORT_OPTIONS = ['createdAt', 'name'] as const;
const REPORT_SORT_OPTIONS = ['createdAt', 'title'] as const;
const ORDER_OPTIONS = ['asc', 'desc'] as const;

type ProjectSort = (typeof PROJECT_SORT_OPTIONS)[number];
type ReportSort = (typeof REPORT_SORT_OPTIONS)[number];
type SortOrder = (typeof ORDER_OPTIONS)[number];

type GetProjectsOptions = {
    page?: number;
    limit?: number;
    search?: string;
    sort?: ProjectSort;
    order?: SortOrder;
};

type CreateProjectInput = {
    name: string;
    url: string;
};

type CreateReportInput = {
    title: string;
    summary: string;
    accessibilityScore: number;
    performanceScore: number;
    seoScore: number;
    uxScore: number;
    insights?: ReportInsights | null;
};

type UpdateProjectInput = {
    name?: string;
    url?: string;
};

type UpdateReportInput = {
    title?: string;
    summary?: string;
    accessibilityScore?: number;
    performanceScore?: number;
    seoScore?: number;
    uxScore?: number;
};

type GetProjectReportsOptions = {
    page?: number;
    limit?: number;
    search?: string;
    sort?: ReportSort;
    order?: SortOrder;
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

function createReport(projectId: string, input: CreateReportInput) {
    return apiFetch<Report>(`/projects/${encodePathSegment(projectId)}/reports`, {
        method: 'POST',
        bodyJson: input
    });
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

function getProjects(options: GetProjectsOptions = {}) {
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
                : normaliseAllowedValue(options.order, ORDER_OPTIONS, 'desc')
    });

    return apiFetch<PaginatedResponse<Project>>(`/projects${query}`);
}

function getProjectById(id: string) {
    return apiFetch<Project>(`/projects/${encodePathSegment(id)}`);
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
                : normaliseAllowedValue(options.order, ORDER_OPTIONS, 'desc')
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

function deleteReport(id: string) {
    return apiFetch<void>(`/reports/${encodePathSegment(id)}`, {
        method: 'DELETE'
    });
}

export {
    ORDER_OPTIONS,
    PROJECT_SORT_OPTIONS,
    REPORT_SORT_OPTIONS,
    getProjects,
    getProjectById,
    getProjectReports,
    createProject,
    createReport,
    importReportInsights,
    updateProject,
    updateReport,
    deleteProject,
    deleteReport
};
