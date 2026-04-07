const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const NORMALIZED_API_BASE_URL = API_BASE_URL?.replace(/\/+$/, '');

let onUnauthorizedHandler: (() => void) | null = null;

type ApiFetchOptions = RequestInit & {
    bodyJson?: unknown;
};

async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
    if (!NORMALIZED_API_BASE_URL) {
        throw new Error('Missing VITE_API_BASE_URL environment variable');
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

        const message =
            data && typeof data === 'object' && 'error' in data
                ? String(data.error)
                : 'Request failed';

        throw new Error(message);
    }

    return data as T;
}

function setOnUnauthorized(handler: (() => void) | null) {
    onUnauthorizedHandler = handler;
}

export { apiFetch, setOnUnauthorized };