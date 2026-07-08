# Site Score API Agent Prompt: Report Score And Timing Comparisons

Please update the Site Score API repo to return previous-report score and User Timing comparisons for project reports.

## Context

The frontend now has a UI-only v1 comparison that compares each visible report with the previous visible report in the same flat report group. That works for the current page, but it is not fully reliable across pagination, search results, or narrow filtered responses.

The API should become the source of truth for comparisons.

The frontend also supports optional User Timing comparisons for PageSpeed-imported insights. These should use the same previous-report boundary as score comparisons.

Reports already belong to flat report groups such as:

- `Homepage mobile`
- `Homepage desktop`
- `Pricing mobile`
- `Pricing desktop`

Use those groups as the comparison boundary. Do not compare reports across groups.

## Goal

For each report returned by the API, include an optional comparison to the immediately previous report in the same group.

Previous means:

- same `groupId`
- same project
- earlier `createdAt`
- nearest earlier report by `createdAt`
- if timestamps are equal, use a stable secondary order such as `id`

If no previous report exists, return `comparison: null`.

## API Shape

Add this shape to report responses:

```ts
type ReportScoreComparison = {
    performanceScore: number;
    accessibilityScore: number;
    seoScore: number;
    bestPracticesScore: number;
    agenticBrowsingScore: number;
};

type ReportInsightUserTimingEntryType = 'mark' | 'measure';

type ReportInsightUserTimingComparison = {
    name: string;
    entryType: ReportInsightUserTimingEntryType;
    currentValue: number | null;
    previousValue: number | null;
    delta: number | null;
    unit: 'ms';
    previousReportId?: string;
    previousCreatedAt?: string;
};

type ReportComparison = {
    previousReportId: string;
    previousCreatedAt: string;
    scores: ReportScoreComparison;
    userTimings?: ReportInsightUserTimingComparison[];
};
```

Extend `Report`:

```ts
type Report = {
    id: string;
    projectId: string;
    groupId: string | null;
    group?: ReportGroupSummary | null;
    title: string;
    summary: string;
    pageUrl: string;
    performanceScore: number;
    accessibilityScore: number;
    seoScore: number;
    bestPracticesScore: number;
    agenticBrowsingScore: number;
    insights?: ReportInsights | null;
    comparison?: ReportComparison | null;
    createdAt: string;
};
```

Example:

```json
{
    "id": "report-new",
    "projectId": "project-id",
    "groupId": "homepage-mobile-group-id",
    "group": {
        "id": "homepage-mobile-group-id",
        "name": "Homepage mobile",
        "pageUrl": "https://example.com/",
        "strategy": "mobile"
    },
    "title": "Homepage mobile snapshot 3",
    "summary": "Latest homepage mobile report.",
    "pageUrl": "https://example.com/",
    "performanceScore": 84,
    "accessibilityScore": 98,
    "seoScore": 100,
    "bestPracticesScore": 93,
    "agenticBrowsingScore": 84,
    "insights": null,
    "comparison": {
        "previousReportId": "report-previous",
        "previousCreatedAt": "2026-06-15T09:00:00.000Z",
        "scores": {
            "performanceScore": 6,
            "accessibilityScore": 2,
            "seoScore": 2,
            "bestPracticesScore": 3,
            "agenticBrowsingScore": 4
        },
        "userTimings": [
            {
                "name": "app:hydrate",
                "entryType": "measure",
                "currentValue": 1000,
                "previousValue": 1420,
                "delta": -420,
                "unit": "ms",
                "previousReportId": "report-previous",
                "previousCreatedAt": "2026-06-15T09:00:00.000Z"
            },
            {
                "name": "app:ready",
                "entryType": "mark",
                "currentValue": 3600,
                "previousValue": 3400,
                "delta": 200,
                "unit": "ms",
                "previousReportId": "report-previous",
                "previousCreatedAt": "2026-06-15T09:00:00.000Z"
            }
        ]
    },
    "createdAt": "2026-07-01T09:00:00.000Z"
}
```

Score deltas are always:

```txt
current report score - previous report score
```

So:

- positive means improvement
- negative means decline
- zero means unchanged

User timing deltas are always:

```txt
current comparable timing value - previous comparable timing value
```

Use `duration` for measures and `startTime` for marks. For user timings:

- negative means improvement because the measure is shorter or the mark happened earlier.
- positive means decline because the measure is longer or the mark happened later.
- zero means unchanged.
- compare entries by matching `entryType + name`.
- omit entries where either current or previous comparable value is missing.

## Endpoints To Update

Add `comparison` to reports returned from:

- `GET /projects/:projectId/reports`
- `GET /reports/:reportId`
- `POST /projects/:projectId/reports`, if practical
- `PATCH /reports/:reportId`, if practical

The list endpoint is the most important one for the frontend.

## Pagination And Filtering Rules

Comparison must be calculated against the real previous report in the database, not only against reports present in the current page.

Examples:

- Page 1 should still compare the first report with the previous report in its group, even if that previous report would appear on page 2.
- Filtering to `groupId=homepage-mobile` should produce the same comparisons as `All groups` for those homepage mobile reports.
- Search results should still compare each matching report to the previous report in its group, even if the previous report does not match the search term.

This is why the API needs to own this logic.

## Database Query Guidance

Prefer a database-level solution rather than N+1 queries.

Good options:

- Use a window function such as `LAG(...) OVER (PARTITION BY group_id ORDER BY created_at ASC, id ASC)`.
- Use a lateral join to select the nearest earlier report per report.
- Use a CTE containing the filtered page, then join each page row to its previous same-group report.

The exact approach should match the API repo's existing query style.

Important:

- Keep project ownership checks unchanged.
- Do not compare reports with `groupId: null` unless the repo still has legacy rows. If legacy null groups exist, compare only within the null group for the same project or return `comparison: null`; pick the simpler consistent option.
- Keep response ordering and pagination metadata unchanged.

## Tests To Add

Please add focused API tests for:

- Report list returns `comparison: null` for the first report in a group.
- Report list returns positive, negative, and zero deltas for later reports.
- Reports are compared only within the same `groupId`.
- Reports from another project are never used as the previous report.
- Pagination still compares against the true previous report outside the current page.
- `groupId` filtering produces the same comparison values as the unfiltered list for the same reports.
- Search filtering does not break comparison against the previous same-group report.
- Report detail includes comparison when a previous report exists.

## Frontend Follow-Up

After this API change is available, update the UI to prefer `report.comparison` when present and fall back to the current visible-list comparison only when it is missing. That keeps the frontend compatible during rollout but makes comparisons pagination-safe once the API supports them.
