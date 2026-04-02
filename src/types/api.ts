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

export type Report = {
    id: string;
    projectId: string;
    title: string;
    summary: string;
    accessibilityScore: number;
    performanceScore: number;
    seoScore: number;
    uxScore: number;
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