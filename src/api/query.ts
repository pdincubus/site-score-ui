const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

type QueryValue = string | number | undefined;

function normalisePositiveInteger(value: string | number | null | undefined, fallback: number) {
    const parsedValue = typeof value === 'number' ? value : Number(value);

    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
        return fallback;
    }

    return parsedValue;
}

function normalisePage(value: string | number | null | undefined) {
    return normalisePositiveInteger(value, DEFAULT_PAGE);
}

function normaliseLimit(value: string | number | null | undefined) {
    return Math.min(normalisePositiveInteger(value, DEFAULT_LIMIT), MAX_LIMIT);
}

function normaliseAllowedValue<T extends string>(
    value: string | null | undefined,
    allowedValues: readonly T[],
    fallback: T
) {
    return allowedValues.includes(value as T) ? (value as T) : fallback;
}

function encodePathSegment(value: string) {
    return encodeURIComponent(value);
}

function buildQuery(params: Record<string, QueryValue>) {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '') {
            searchParams.set(key, String(value));
        }
    }

    const query = searchParams.toString();

    return query ? `?${query}` : '';
}

export {
    DEFAULT_LIMIT,
    DEFAULT_PAGE,
    MAX_LIMIT,
    buildQuery,
    encodePathSegment,
    normaliseAllowedValue,
    normaliseLimit,
    normalisePage
};
