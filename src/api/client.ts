import { mockApiFetch } from './mockApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const NORMALIZED_API_BASE_URL = API_BASE_URL?.replace(/\/+$/, '');
const MOCK_API_PATH = '/mock-api';

let onUnauthorizedHandler: (() => void) | null = null;

type ApiFetchOptions = RequestInit & {
    bodyJson?: unknown;
};

class ApiRequestError extends Error {
    readonly status: number;
    readonly path: string;
    readonly data: unknown;

    constructor(message: string, status: number, path: string, data: unknown) {
        super(message);

        this.name = 'ApiRequestError';
        this.status = status;
        this.path = path;
        this.data = data;
    }
}

function isMockApiEnabled() {
    return (
        NORMALIZED_API_BASE_URL === MOCK_API_PATH ||
        NORMALIZED_API_BASE_URL?.endsWith(MOCK_API_PATH)
    );
}

function getApiErrorMessage(data: unknown) {
    if (!data || typeof data !== 'object') {
        return 'Request failed';
    }

    if ('error' in data) {
        const error = data.error;

        if (typeof error === 'string' && error.trim()) {
            return error;
        }

        if (error && typeof error === 'object' && 'message' in error) {
            const message = error.message;

            if (typeof message === 'string' && message.trim()) {
                return message;
            }
        }
    }

    if ('message' in data && typeof data.message === 'string' && data.message.trim()) {
        return data.message;
    }

    return 'Request failed';
}

async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
    if (!NORMALIZED_API_BASE_URL) {
        throw new Error('Missing VITE_API_BASE_URL environment variable');
    }

    if (isMockApiEnabled()) {
        return mockApiFetch<T>(path, options);
    }

    const headers = new Headers(options.headers);

    if (options.bodyJson !== undefined) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${NORMALIZED_API_BASE_URL}${path}`, {
        ...options,
        credentials: 'include',
        headers,
        body: options.bodyJson !== undefined ? JSON.stringify(options.bodyJson) : options.body
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            onUnauthorizedHandler?.();
        }

        throw new ApiRequestError(getApiErrorMessage(data), response.status, path, data);
    }

    return data as T;
}

function setOnUnauthorized(handler: (() => void) | null) {
    onUnauthorizedHandler = handler;
}

export { ApiRequestError, apiFetch, setOnUnauthorized };
