# Site Score API Agent Prompt: Current UI Contract And Visual Seed Data

Please update the Site Score API repo to match the current Site Score UI contract.

Treat this as a breaking change for development and seed data. The old report rows were seed-only and can be reset or destructively migrated if that is simpler and safer.

## Current Product Direction

Reports are now grouped performance-monitoring snapshots.

Use flat report groups only:

- `Homepage mobile`
- `Homepage desktop`
- `Pricing mobile`
- `Pricing desktop`

Do not build nested groups yet. `createdAt` is the v1 report date. Do not add `measuredAt` in this slice.

The UI now uses five primary score indicators:

- `performanceScore`
- `accessibilityScore`
- `seoScore`
- `bestPracticesScore`
- `agenticBrowsingScore`

Remove the old `uxScore` contract from create, update, list, detail, seed data, and docs.

## Frontend Display Expectations

The API should return enough data for the UI to show:

- Project heading.
- `Reports` section.
- Group headings such as `Homepage mobile`.
- Report cards under those headings.
- Report date from `createdAt`.
- Report `pageUrl`.
- The five score indicators.
- Score deltas against the previous report in the same group.
- Imported PageSpeed metrics and disclosure sections.
- User Timing marks/measures and timing deltas.

The UI intentionally does not show these fields as prominent visible report-card content:

- `summary`
- card-level `group` label, because group name appears as the section heading
- imported `Source`
- imported `Tested URL`
- imported `Fetched`

The API can still keep and return `summary`, `group`, `testedUrl`, and `fetchedAt` because forms, provenance, and compatibility still use them. Do not rely on those fields to communicate the visible report state.

## Project List Summary

Enrich `GET /projects` with compact per-project summary data. Do not make the frontend fetch reports per project to calculate these values.

```ts
type ProjectSummaryScores = {
    performanceScore: number;
    accessibilityScore: number;
    seoScore: number;
    bestPracticesScore: number;
    agenticBrowsingScore: number;
};

type ProjectSummary = {
    reportCount: number;
    reportGroupCount: number;
    latestReportCreatedAt: string | null;
    latestReportTitle: string | null;
    latestScores: ProjectSummaryScores | null;
};

type ProjectListItem = Project & {
    summary: ProjectSummary;
};
```

Rules:

- Return `summary` for every project in `GET /projects`.
- Scope counts and latest report data to the authenticated user's owned projects.
- `reportCount` counts all reports for that project.
- `reportGroupCount` counts all report groups for that project.
- The latest report is the newest report by `createdAt` across all groups in the project.
- Projects with no reports must return zero counts and `null` latest report fields.
- Preserve existing project pagination, search, sort, and order behaviour.
- Do not add summary-field sorting in this slice.

## Report Group Model

Add a first-class report group model.

```ts
type PageSpeedStrategy = 'mobile' | 'desktop';

type ReportGroup = {
    id: string;
    projectId: string;
    name: string;
    pageUrl: string;
    strategy: PageSpeedStrategy;
    createdAt: string;
};

type ReportGroupSummary = Pick<ReportGroup, 'id' | 'name' | 'pageUrl' | 'strategy'>;
```

Validation:

- `name`: required, trimmed, max 120 characters.
- `pageUrl`: required, trimmed, absolute `http://` or `https://` URL, max 2048 characters.
- `strategy`: required, either `mobile` or `desktop`.
- The authenticated user must be allowed to access the parent project.
- Group names may be unique per project if the API repo already has a clean uniqueness pattern.

Endpoints:

```txt
GET /projects/:projectId/report-groups
POST /projects/:projectId/report-groups
```

`GET /projects/:projectId/report-groups` should return groups for the project only, preferably ordered by name ascending.

`POST /projects/:projectId/report-groups` request:

```json
{
    "name": "Homepage mobile",
    "pageUrl": "https://example.com/",
    "strategy": "mobile"
}
```

Return the created `ReportGroup`.

## Report Model

Update reports to this shape.

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

For new reports, `groupId` should be required. `groupId: null` is only a defensive compatibility fallback for legacy rows while migrations settle.

Validation:

- `groupId`: required on create/update, must belong to the same project and authenticated user.
- `title`: required, trimmed, max 160 characters.
- `summary`: required, trimmed, max 500 characters.
- `pageUrl`: required, trimmed, absolute `http://` or `https://` URL, max 2048 characters.
- All five score fields: required whole numbers from 0 to 100.
- `insights`: optional on create.
- Report updates should not replace stored `insights`; reject `insights` in update payloads if the repo validates unknown or protected fields.
- `createdAt`: return on list/detail/create/update. The UI uses it as the report date.

Create request:

```json
{
    "groupId": "report-group-id",
    "title": "Homepage mobile - July snapshot",
    "summary": "Latest mobile PageSpeed snapshot.",
    "pageUrl": "https://example.com/",
    "performanceScore": 75,
    "accessibilityScore": 97,
    "seoScore": 98,
    "bestPracticesScore": 90,
    "agenticBrowsingScore": 79,
    "insights": null
}
```

Update request:

```json
{
    "groupId": "report-group-id",
    "title": "Homepage mobile - July snapshot",
    "summary": "Updated note",
    "pageUrl": "https://example.com/",
    "performanceScore": 77,
    "accessibilityScore": 97,
    "seoScore": 98,
    "bestPracticesScore": 91,
    "agenticBrowsingScore": 80
}
```

## Report List Filtering

Update the existing report list endpoint to accept optional `groupId`.

```txt
GET /projects/:projectId/reports?groupId=report-group-id
```

Rules:

- When `groupId` is present, return only reports in that group.
- Validate that the group belongs to the same project and authenticated user.
- Keep existing pagination, search, sorting, and ordering behaviour.
- Invalid or inaccessible group ids should return a clear `400` or `404` using the repo's existing error style.

## Report Group Trends

Add a full-history trend endpoint for the report group graphs in the UI.

```txt
GET /projects/:projectId/report-group-trends
GET /projects/:projectId/report-group-trends?groupId=report-group-id
```

Response shape:

```ts
type ReportTrendPoint = {
    id: string;
    title: string;
    pageUrl: string;
    createdAt: string;
    performanceScore: number;
    accessibilityScore: number;
    seoScore: number;
    bestPracticesScore: number;
    agenticBrowsingScore: number;
};

type ReportGroupTrend = {
    groupId: string;
    groupName: string;
    pageUrl: string;
    strategy: PageSpeedStrategy;
    points: ReportTrendPoint[];
};
```

Rules:

- Return one trend object per report group in the requested project.
- When `groupId` is present, return only that group.
- Validate project and group access using the same auth/ownership rules as report listing.
- `points` must include the full group history, not only the current reports page.
- Sort `points` oldest to newest by `createdAt`, with a stable `id` tie-break if needed.
- Do not include ungrouped reports in normal trend responses unless the API still has legacy rows and a simple fallback is already available.

## Report Comparisons

The API should return comparison data for each report where a previous report exists in the same group.

Previous means:

- same `projectId`
- same `groupId`
- earlier `createdAt`
- nearest earlier report by `createdAt`
- stable tie-break by `id` if timestamps are equal

If no previous report exists, return `comparison: null`.

```ts
type ReportScoreComparison = {
    performanceScore: number;
    accessibilityScore: number;
    seoScore: number;
    bestPracticesScore: number;
    agenticBrowsingScore: number;
};

type ReportInsightUserTimingComparison = {
    name: string;
    entryType: 'mark' | 'measure';
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

Score deltas are:

```txt
current score - previous score
```

Positive score deltas are improvements, negative score deltas are declines, and zero means unchanged.

User Timing deltas are:

```txt
current comparable timing value - previous comparable timing value
```

Use `duration` for measures and `startTime` for marks. For User Timings, negative deltas are improvements because the measure is shorter or the mark happened earlier.

Comparison must be calculated against the true previous report in the database, not only against reports present in the current page or search result.

Add `comparison` to report responses from:

- `GET /projects/:projectId/reports`
- `GET /reports/:reportId`
- `POST /projects/:projectId/reports`, if practical
- `PATCH /reports/:reportId`, if practical

The list endpoint is the most important one for the frontend.

## PageSpeed Import Endpoint

Keep PageSpeed import manual and authenticated.

```txt
POST /projects/:projectId/report-insight-imports
```

Request:

```json
{
    "source": "PAGESPEED",
    "url": "https://example.com/",
    "strategy": "mobile"
}
```

Rules:

- `source` must currently be `"PAGESPEED"`.
- `url` uses the same validation as report `pageUrl`.
- `strategy` is `"mobile"` or `"desktop"`.
- Enforce project auth/access.
- Do not create a report directly.
- Do not expose the Google API key to the frontend.
- Store the Google key server-side only, for example `PAGESPEED_API_KEY`.
- Use documented PageSpeed categories: `performance`, `accessibility`, `best-practices`, and `seo`.
- Return `scores.agenticBrowsing: null` unless PageSpeed/Lighthouse returns a reliable category for it. Do not invent that score.

## Report Insights Shape

Return and persist normalised insight data in this shape.

```ts
type ReportInsightsSource = 'PAGESPEED' | 'CRUX';

type ReportInsightMetricName =
    | 'pageWeight'
    | 'firstContentfulPaint'
    | 'largestContentfulPaint'
    | 'cumulativeLayoutShift'
    | 'totalBlockingTime'
    | 'speedIndex'
    | 'timeToInteractive'
    | 'interactionToNextPaint';

type ReportInsightMetric = {
    value: number | null;
    unit: 'ms' | 'score' | 'unitless' | 'bytes';
    displayValue: string | null;
    category?: string | null;
};

type ReportInsightOpportunity = {
    id: string;
    title: string;
    displayValue: string | null;
    score: number | null;
    overallSavingsMs: number | null;
};

type ReportInsightAuditSeverity = 'fail' | 'warning';

type ReportInsightAuditRef = {
    id: string;
    title: string;
    category: string;
    severity: ReportInsightAuditSeverity;
    displayValue: string | null;
    score: number | null;
};

type ReportInsightUserTiming = {
    name: string;
    entryType: 'mark' | 'measure';
    startTime: number | null;
    duration: number | null;
    displayValue: string | null;
};

type ReportInsights = {
    source: ReportInsightsSource;
    strategy: PageSpeedStrategy;
    testedUrl: string;
    finalUrl: string | null;
    fetchedAt: string;
    lighthouseVersion: string | null;
    scores: {
        performance: number | null;
        accessibility: number | null;
        bestPractices: number | null;
        seo: number | null;
        agenticBrowsing: number | null;
    };
    metrics: Partial<Record<ReportInsightMetricName, ReportInsightMetric>>;
    fieldData?: {
        source: ReportInsightsSource;
        overallCategory: string | null;
        metrics: Partial<Record<ReportInsightMetricName, ReportInsightMetric>>;
    } | null;
    opportunities: ReportInsightOpportunity[];
    auditRefs?: ReportInsightAuditRef[];
    userTimings?: ReportInsightUserTiming[];
};
```

## PageSpeed Normalisation

Treat PageSpeed responses as untrusted external data. Validate shape before use.

Scores:

- Read from `lighthouseResult.categories`.
- Convert Lighthouse category scores from `0..1` to whole numbers `0..100`.
- Map `performance`, `accessibility`, `seo`, and `best-practices`.
- Return `agenticBrowsing: null` unless a reliable category exists.
- Use `null` when a category is missing or not numeric.

Metrics:

- `total-byte-weight` -> `pageWeight`, `unit: 'bytes'`, raw bytes in `value`.
- `first-contentful-paint` -> `firstContentfulPaint`, `unit: 'ms'`.
- `largest-contentful-paint` -> `largestContentfulPaint`, `unit: 'ms'`.
- `cumulative-layout-shift` -> `cumulativeLayoutShift`, `unit: 'unitless'`.
- `total-blocking-time` -> `totalBlockingTime`, `unit: 'ms'`.
- `speed-index` -> `speedIndex`, `unit: 'ms'`.
- `interactive` -> `timeToInteractive`, `unit: 'ms'`.
- `interaction-to-next-paint` -> `interactionToNextPaint`, `unit: 'ms'`, only if present.

For each metric:

- `value`: finite `numericValue`, otherwise `null`.
- `displayValue`: audit display value when present, otherwise `null`.
- `category`: currently `null` unless a reliable source value exists.

Page weight should come from Lighthouse `total-byte-weight`. Do not build a separate crawler for this v1.

Opportunities:

- Pull from audits where `details.type` is `"opportunity"`.
- Prefer opportunities with positive `overallSavingsMs`.
- Sort by `overallSavingsMs` descending.
- Return the top 5.
- Keep strings plain text. Do not return HTML.

Warnings and failed audits:

- Build `auditRefs` from `lighthouseResult.categories.*.auditRefs` joined to `lighthouseResult.audits`.
- Include failed and warning audits from all requested categories.
- Use `severity: 'fail'` when numeric `score` is `0`.
- Use `severity: 'warning'` when numeric `score` is greater than `0` and less than `1`.
- Ignore manual, informative, not-applicable, and errored audits for this slice.
- Return only `id`, `title`, `category`, `severity`, `displayValue`, and `score`.
- Do not return raw descriptions, details payloads, warnings arrays, HTML, stack traces, or the full PageSpeed response.
- Cap the output to a sensible limit such as 20.

User Timings:

- Pull from the Lighthouse `user-timings` audit.
- Use `lighthouseResult.audits["user-timings"].details.items` when it is table-like.
- Normalise `timingType: "Measure"` to `entryType: "measure"`.
- Normalise `timingType: "Mark"` to `entryType: "mark"`.
- `startTime`: finite `startTime` in milliseconds, otherwise `null`.
- `duration`: finite `duration` in milliseconds for measures, otherwise `null`.
- `displayValue`: short formatted primary value. Use duration for measures and start time for marks.
- Exclude noisy entries such as names beginning with `goog_`.
- Keep names plain text and cap output to a sensible number such as 50.

Metadata:

- `testedUrl`: trimmed requested URL.
- `finalUrl`: `lighthouseResult.finalDisplayedUrl`, `lighthouseResult.finalUrl`, or `null`.
- `fetchedAt`: server timestamp when import completes.
- `lighthouseVersion`: `lighthouseResult.lighthouseVersion` or `null`.

Field data:

- `fieldData` may be `null` in this slice.
- If PageSpeed `loadingExperience` or `originLoadingExperience` is included, normalise it into the same metric shape.
- Keep CrUX and CrUX History as later work.

## Development Seed Data

Reset the old seed report data and rebuild it around this contract. The seed should make every important visual state easy to check in the UI.

Recommended minimum seed:

- One seeded test user/account following the API repo's existing auth seed pattern.
- One or two realistic projects.
- At least these groups for one project:
    - `Homepage mobile`, homepage URL, `strategy: "mobile"`
    - `Homepage desktop`, homepage URL, `strategy: "desktop"`
- At least three reports per group, with `createdAt` values spaced over time so the trend graph is meaningful.
- Every seeded report includes `groupId`, `group`, `pageUrl`, the five score fields, `createdAt`, and normalised `insights`.
- Later reports include positive, negative, and zero score deltas via `comparison`.
- At least one latest report includes User Timing comparison deltas.
- Trend endpoint seed responses include chronological points for each group.
- Do not seed `uxScore`.
- Do not seed ungrouped reports in the normal development baseline.

The frontend mock data currently uses this representative shape:

```txt
Project: Crayons & Code
URL: https://crayonsandcode.co.uk/

Groups:
- Homepage mobile
- Homepage desktop

Reports:
- Homepage mobile - May baseline
- Homepage mobile - June baseline
- Homepage mobile - July snapshot
- Homepage desktop - May baseline
- Homepage desktop - June baseline
- Homepage desktop - July snapshot
```

The seed insights should include enough data to visually verify:

- `Strategy`
- `Lighthouse`
- `Final URL` when it differs from `testedUrl`
- `Page weight`
- `First Contentful Paint`
- `Speed Index`
- `Largest Contentful Paint`
- `Total Blocking Time`
- `Cumulative Layout Shift`
- `Time to Interactive`
- `Interaction to Next Paint`
- opportunities disclosure
- failed/warning audits disclosure
- User Timings disclosure
- User Timing deltas

Example latest mobile report values:

```json
{
    "title": "Homepage mobile - July snapshot",
    "pageUrl": "https://crayonsandcode.co.uk/",
    "performanceScore": 75,
    "accessibilityScore": 97,
    "seoScore": 98,
    "bestPracticesScore": 90,
    "agenticBrowsingScore": 79,
    "createdAt": "2026-07-08T09:30:00.000Z",
    "comparison": {
        "previousReportId": "report-home-mobile-previous",
        "previousCreatedAt": "2026-06-08T09:30:00.000Z",
        "scores": {
            "performanceScore": 7,
            "accessibilityScore": 0,
            "seoScore": -2,
            "bestPracticesScore": 4,
            "agenticBrowsingScore": -3
        },
        "userTimings": [
            {
                "name": "app:hydrate",
                "entryType": "measure",
                "currentValue": 850,
                "previousValue": 1270,
                "delta": -420,
                "unit": "ms"
            },
            {
                "name": "app:ready",
                "entryType": "mark",
                "currentValue": 3200,
                "previousValue": 3000,
                "delta": 200,
                "unit": "ms"
            }
        ]
    }
}
```

Example latest mobile `insights` fragment:

```json
{
    "source": "PAGESPEED",
    "strategy": "mobile",
    "testedUrl": "https://crayonsandcode.co.uk/",
    "finalUrl": "https://www.crayonsandcode.co.uk/",
    "fetchedAt": "2026-07-08T09:30:00.000Z",
    "lighthouseVersion": "13.0.0",
    "scores": {
        "performance": null,
        "accessibility": null,
        "bestPractices": null,
        "seo": null,
        "agenticBrowsing": null
    },
    "metrics": {
        "pageWeight": {
            "value": 1837056,
            "unit": "bytes",
            "displayValue": null,
            "category": "performance"
        },
        "firstContentfulPaint": {
            "value": 1420,
            "unit": "ms",
            "displayValue": "1.4 s",
            "category": "performance"
        },
        "speedIndex": {
            "value": 2940,
            "unit": "ms",
            "displayValue": "2.9 s",
            "category": "performance"
        },
        "largestContentfulPaint": {
            "value": 3180,
            "unit": "ms",
            "displayValue": "3.2 s",
            "category": "performance"
        },
        "totalBlockingTime": {
            "value": 210,
            "unit": "ms",
            "displayValue": "210 ms",
            "category": "performance"
        }
    },
    "opportunities": [
        {
            "id": "render-blocking-resources",
            "title": "Eliminate render-blocking resources",
            "displayValue": "Potential savings of 620 ms",
            "score": 0.62,
            "overallSavingsMs": 620
        }
    ],
    "auditRefs": [
        {
            "id": "tap-targets",
            "title": "Tap targets are not sized appropriately",
            "category": "seo",
            "severity": "fail",
            "displayValue": null,
            "score": 0
        }
    ],
    "userTimings": [
        {
            "name": "app:hydrate",
            "entryType": "measure",
            "startTime": 690,
            "duration": 850,
            "displayValue": "850 ms"
        },
        {
            "name": "app:ready",
            "entryType": "mark",
            "startTime": 3200,
            "duration": null,
            "displayValue": "3.2 s"
        }
    ]
}
```

## Security And Performance

- Store Google API keys server-side only.
- Never log API keys.
- Never return raw Google responses or stack traces to the browser.
- Validate all third-party API responses before normalising.
- Add a timeout for PageSpeed requests.
- Return controlled errors for PageSpeed timeout/unavailable responses.
- Rate limit imports per user and/or project if the repo has rate-limit infrastructure.
- Consider a short cache for identical `url + strategy` imports, around 5 to 15 minutes.
- Consider rejecting localhost, private network, and non-public URLs.
- Keep response payloads bounded.

Recommended error mapping:

- `400` or `422`: validation error.
- `401`: unauthenticated.
- `403`: authenticated but not allowed to access the project.
- `404`: project/group/report not found.
- `429`: local rate limit or PageSpeed quota issue.
- `502`: PageSpeed returned an unusable response.
- `504`: PageSpeed timed out.

Use the API repo's existing structured error shape.

## Tests To Add Or Update

Reports:

- Create requires `groupId`, `pageUrl`, and the five score fields.
- Create rejects missing, non-integer, or out-of-range scores.
- Create rejects `uxScore` if the repo rejects unknown fields, or at least never returns it.
- Create accepts optional valid `insights`.
- Create rejects malformed `insights`.
- Update accepts `groupId`, `pageUrl`, and the five score fields.
- Update protects stored `insights` from replacement.
- Responses include `createdAt`, `groupId`, lightweight `group`, and optional `comparison`.
- Responses no longer include `uxScore`.

Report groups:

- Create validates name, page URL, strategy, auth, and project ownership.
- List returns only groups for the requested project.
- Reports cannot be created with a group from another project.
- Report list filters by `groupId`.
- Inaccessible or invalid group ids are handled consistently.

Report group trends:

- Trend endpoint returns one object per accessible group.
- Optional `groupId` filters to a single group.
- Trend points are ordered oldest to newest by `createdAt`.
- Trend points include the full group history independent of report list pagination, search, and sort order.
- Trend endpoint never leaks groups or reports from another project/user.

Comparisons:

- First report in a group returns `comparison: null`.
- Later reports return positive, negative, and zero score deltas.
- Reports are compared only within the same `groupId`.
- Reports from another project are never used as previous reports.
- Pagination still compares against the true previous report outside the current page.
- `groupId` filtering produces the same comparison values as the unfiltered list for the same reports.
- Search filtering does not break comparison against the previous same-group report.
- User Timing comparisons match by `entryType + name`.

PageSpeed imports:

- Request validation rejects missing source, unsupported source, invalid URL, unsupported strategy, and overlong URL.
- Auth/project checks match existing report endpoints.
- PageSpeed client builds expected query parameters and keeps the API key out of returned errors.
- Normaliser converts category scores from `0..1` to `0..100`.
- Normaliser returns `null` for missing or malformed scores and metrics.
- Normaliser returns `agenticBrowsing: null` when no reliable category exists.
- Normaliser maps `total-byte-weight` to `metrics.pageWeight`.
- Normaliser includes FCP, Speed Index, TBT, LCP, CLS, TTI, and INP when present.
- Opportunity normalisation sorts and limits returned opportunities.
- Audit-ref normalisation includes failed/warning audits and excludes passed/manual/informative/not-applicable/errored audits.
- User Timing normalisation maps Lighthouse `user-timings` to `insights.userTimings`.
- Timeout and unavailable PageSpeed responses return controlled errors.

Seed data:

- Seed reset removes old four-score report data.
- Seeded reports include report groups, page URLs, five scores, dates, insights, comparisons, and enough chronological history for trend graphs.
- Seeded insights include enough metrics/audits/user timings to verify the UI visually.

## Acceptance Criteria

This API work is ready when the frontend can:

1. Load report groups for a project.
2. Create a report group inline from the new-report dialog.
3. Create a report with `groupId`, `pageUrl`, five scores, and optional `insights`.
4. Edit a report's group, URL, summary, title, and five scores without replacing `insights`.
5. Filter reports by `groupId`.
6. Render grouped report history streams with dates and score deltas.
7. Render report group trend graphs from full-history trend data.
8. Render PageSpeed metrics, page weight, opportunities, failed/warning audits, and User Timings.
9. Import PageSpeed data without exposing a Google key to the browser.
10. Run against seeded development data that exercises all visible report states without needing to call PageSpeed on every local run.

## Deferred Work

Do not implement these yet:

- `measuredAt` or editable/backdated report dates.
- Nested groups such as `Homepage > Mobile`.
- Charts/trends in the API.
- Scheduled monitoring.
- CrUX History time series storage.

Keep the shapes ready for future CrUX work by preserving `ReportInsightsSource = 'PAGESPEED' | 'CRUX'` and keeping `fieldData` separate from Lighthouse lab data.
