# Site Score API Agent Prompt: Reports, PageSpeed Imports, Dates, And Groups

Please update the Site Score API repo to support the latest Site Score UI direction. Treat this as a breaking change: existing report data is seed-only and can be reset or destructively migrated if that is simpler and safer.

## Product Direction

Reports should now work as grouped performance-monitoring snapshots.

For example:

- `Homepage mobile`
- `Homepage desktop`
- `Pricing mobile`
- `Pricing desktop`

Each group is a flat tracking stream. Do not build nested groups yet. The frontend will use these groups to show report history over time.

`createdAt` is the v1 report date. Do not add `measuredAt` in this slice.

## Frontend Expectations

The UI now expects:

- Five primary report indicators:
    - `performanceScore`
    - `accessibilityScore`
    - `seoScore`
    - `bestPracticesScore`
    - `agenticBrowsingScore`
- No `uxScore`.
- A required `pageUrl` on every report.
- A required `groupId` when creating or updating reports.
- A lightweight `group` summary on report responses.
- Report groups that can be listed and created per project.
- Optional filtering of report lists by `groupId`.
- Optional PageSpeed-imported `insights` persisted on report creation.
- Report updates should not replace stored `insights`.

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

Validation rules:

- `name`: required, trimmed, max 120 characters.
- `pageUrl`: required, trimmed, absolute `http://` or `https://` URL, max 2048 characters.
- `strategy`: required, either `mobile` or `desktop`.
- The authenticated user must be allowed to access the parent project.
- Group names can be unique per project if the repo already has a clean uniqueness pattern. Otherwise, duplicates are acceptable for this first slice.

## Report Group Endpoints

Add:

```txt
GET /projects/:projectId/report-groups
POST /projects/:projectId/report-groups
```

`GET /projects/:projectId/report-groups`

- Return groups for the project only.
- Order by name ascending, then `createdAt` ascending if useful.
- Enforce the same auth/project access checks as report endpoints.

Response:

```json
[
    {
        "id": "report-group-id",
        "projectId": "project-id",
        "name": "Homepage mobile",
        "pageUrl": "https://example.com/",
        "strategy": "mobile",
        "createdAt": "2026-07-08T08:00:00.000Z"
    }
]
```

`POST /projects/:projectId/report-groups`

Request:

```json
{
    "name": "Homepage mobile",
    "pageUrl": "https://example.com/",
    "strategy": "mobile"
}
```

Response: return the created `ReportGroup`.

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
    createdAt: string;
};
```

For new reports, `groupId` should be required. Returning `null` is only for defensive compatibility with existing/seed rows while the migration settles.

Validation rules:

- `groupId`: required on create/update, must belong to the same project and authenticated user.
- `title`: required, trimmed, max 160 characters.
- `summary`: required, trimmed, max 500 characters.
- `pageUrl`: required, trimmed, absolute `http://` or `https://` URL, max 2048 characters.
- All five score fields: required whole numbers from 0 to 100.
- `uxScore`: remove from create/update/list/detail responses.
- `insights`: optional on create only.
- If an update request includes `insights`, reject it with the repo's standard validation error. This prevents accidental replacement of historical import snapshots.
- `createdAt`: return on list/detail/create/update. This is the date shown on report cards.

Create request:

```json
{
    "groupId": "report-group-id",
    "title": "Homepage audit",
    "summary": "Short summary",
    "pageUrl": "https://example.com/",
    "performanceScore": 94,
    "accessibilityScore": 98,
    "seoScore": 100,
    "bestPracticesScore": 92,
    "agenticBrowsingScore": 80,
    "insights": {
        "source": "PAGESPEED"
    }
}
```

Update request:

```json
{
    "groupId": "report-group-id",
    "title": "Updated homepage audit",
    "summary": "Updated summary",
    "pageUrl": "https://example.com/",
    "performanceScore": 91,
    "accessibilityScore": 96,
    "seoScore": 99,
    "bestPracticesScore": 88,
    "agenticBrowsingScore": 82
}
```

Response:

```json
{
    "id": "report-id",
    "projectId": "project-id",
    "groupId": "report-group-id",
    "group": {
        "id": "report-group-id",
        "name": "Homepage mobile",
        "pageUrl": "https://example.com/",
        "strategy": "mobile"
    },
    "title": "Homepage audit",
    "summary": "Short summary",
    "pageUrl": "https://example.com/",
    "performanceScore": 94,
    "accessibilityScore": 98,
    "seoScore": 100,
    "bestPracticesScore": 92,
    "agenticBrowsingScore": 80,
    "insights": null,
    "createdAt": "2026-07-08T08:00:00.000Z"
}
```

## Report List Filtering

Update the existing report list endpoint to accept an optional `groupId` query parameter.

```txt
GET /projects/:projectId/reports?groupId=report-group-id
```

Rules:

- When `groupId` is present, return only reports in that group.
- Validate that the group belongs to the same project and authenticated user.
- Keep existing pagination and search behaviour.
- If the `groupId` is invalid or inaccessible, prefer a clear `400` or `404` using the repo's existing error style.

## PageSpeed Import Endpoint

Keep the PageSpeed import as a manual, authenticated endpoint. It should fetch one URL and one strategy, then return normalised data for the UI to review before creating a report.

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

- `source`: must currently be `"PAGESPEED"`.
- `url`: same validation as report `pageUrl`.
- `strategy`: `"mobile"` or `"desktop"`.
- Must enforce project auth/access.
- Must not create a report by itself.
- Must not expose the Google API key to the browser.

Use server-side environment only, for example:

```env
PAGESPEED_API_KEY=...
```

Call:

```txt
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
```

Use query parameters:

- `url`
- `strategy`
- documented categories: `performance`, `accessibility`, `best-practices`, `seo`
- `key`, only when configured

Important: PageSpeed currently documents `performance`, `accessibility`, `best-practices`, and `seo`. The frontend has an `agenticBrowsing` field, but the normaliser should return `null` unless PageSpeed/Lighthouse returns a reliable category for it. Do not invent this score.

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

type ReportInsightUserTimingEntryType = 'mark' | 'measure';

type ReportInsightUserTiming = {
    name: string;
    entryType: ReportInsightUserTimingEntryType;
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

Example response:

```json
{
    "source": "PAGESPEED",
    "strategy": "mobile",
    "testedUrl": "https://example.com/",
    "finalUrl": "https://example.com/",
    "fetchedAt": "2026-07-08T08:00:00.000Z",
    "lighthouseVersion": "13.0.0",
    "scores": {
        "performance": 94,
        "accessibility": 98,
        "bestPractices": 92,
        "seo": 100,
    "agenticBrowsing": null
    },
    "metrics": {
        "pageWeight": {
            "value": 1732608,
            "unit": "bytes",
            "displayValue": "1,692 KiB",
            "category": null
        },
        "firstContentfulPaint": {
            "value": 1200,
            "unit": "ms",
            "displayValue": "1.2 s",
            "category": null
        },
        "speedIndex": {
            "value": 2400,
            "unit": "ms",
            "displayValue": "2.4 s",
            "category": null
        },
        "totalBlockingTime": {
            "value": 180,
            "unit": "ms",
            "displayValue": "180 ms",
            "category": null
        },
        "largestContentfulPaint": {
            "value": 1800,
            "unit": "ms",
            "displayValue": "1.8 s",
            "category": null
        },
        "cumulativeLayoutShift": {
            "value": 0.02,
            "unit": "unitless",
            "displayValue": "0.02",
            "category": null
        }
    },
    "fieldData": null,
    "opportunities": [
        {
            "id": "render-blocking-resources",
            "title": "Eliminate render-blocking resources",
            "displayValue": "Potential savings of 520 ms",
            "score": 0.71,
            "overallSavingsMs": 520
        }
    ],
    "auditRefs": [
        {
            "id": "uses-optimized-images",
            "title": "Serve images in next-gen formats",
            "category": "performance",
            "severity": "warning",
            "displayValue": "Potential savings of 320 KiB",
            "score": 0.5
        },
        {
            "id": "is-crawlable",
            "title": "Page is blocked from indexing",
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
            "startTime": 750,
            "duration": 1000,
            "displayValue": "1.0 s"
        },
        {
            "name": "app:ready",
            "entryType": "mark",
            "startTime": 3600,
            "duration": null,
            "displayValue": "3.6 s"
        }
    ]
}
```

## PageSpeed Normalisation Rules

Treat the PageSpeed response as untrusted external data. Validate shape before use.

Scores:

- Read from `lighthouseResult.categories`.
- Convert Lighthouse category scores from `0..1` to whole numbers `0..100`.
- Map `performance` to `scores.performance`.
- Map `accessibility` to `scores.accessibility`.
- Map `seo` to `scores.seo`.
- Map `best-practices` to `scores.bestPractices`.
- Return `scores.agenticBrowsing: null` unless there is a reliable category in the response.
- Use `null` when a category is missing or not numeric.

Metrics:

- `total-byte-weight` -> `pageWeight`
- `first-contentful-paint` -> `firstContentfulPaint`
- `largest-contentful-paint` -> `largestContentfulPaint`
- `cumulative-layout-shift` -> `cumulativeLayoutShift`
- `total-blocking-time` -> `totalBlockingTime`
- `speed-index` -> `speedIndex`
- `interactive` -> `timeToInteractive`
- `interaction-to-next-paint` -> `interactionToNextPaint`, only if present

For each metric:

- `value`: `numericValue` when finite, otherwise `null`.
- `displayValue`: audit display value when present, otherwise `null`.
- `unit`: `bytes` for `pageWeight`, `ms` for timing metrics, `unitless` for CLS, `score` only for future score-like metrics.
- `category`: currently `null` unless a reliable source value exists.

Page weight:

- Use the Lighthouse `total-byte-weight` audit from PageSpeed.
- Store finite `numericValue` as raw bytes.
- Store `displayValue` when PageSpeed provides it.
- Do not implement a separate crawler for page weight in this slice.

Opportunities:

- Pull from audits where `details.type` is `"opportunity"`.
- Prefer opportunities with positive `overallSavingsMs`.
- Sort by `overallSavingsMs` descending.
- Return the top 5.
- Keep strings plain text. Do not return HTML.

Warnings and failed audits:

- Build `auditRefs` from `lighthouseResult.categories.*.auditRefs` joined to `lighthouseResult.audits`.
- Include failed and warning audits from all requested categories.
- Use `severity: "fail"` when numeric `score` is `0`.
- Use `severity: "warning"` when numeric `score` is greater than `0` and less than `1`.
- Ignore manual, informative, not-applicable, and errored audits for this slice.
- Return only `id`, `title`, `category`, `severity`, `displayValue`, and `score`.
- Do not return raw descriptions, details payloads, warnings arrays, HTML, or the full PageSpeed response.
- Cap the output to a sensible limit such as 20.

User timings:

- Pull from the Lighthouse `user-timings` audit.
- Use `lighthouseResult.audits["user-timings"].details.items` when it is a table-like details payload.
- Normalise `timingType: "Measure"` to `entryType: "measure"` and `timingType: "Mark"` to `entryType: "mark"`.
- `startTime`: finite `startTime` in milliseconds, otherwise `null`.
- `duration`: finite `duration` in milliseconds for measures, otherwise `null`.
- `displayValue`: short formatted primary value. Use duration for measures and start time for marks.
- Treat lower numbers as better for comparisons. Measures becoming shorter are improvements; marks happening earlier are improvements.
- Exclude noisy entries such as names beginning with `goog_`.
- Keep names plain text and cap output to a sensible number such as 50.

Metadata:

- `testedUrl`: trimmed requested URL.
- `finalUrl`: `lighthouseResult.finalDisplayedUrl`, `lighthouseResult.finalUrl`, or `null`.
- `fetchedAt`: server timestamp when import completes.
- `lighthouseVersion`: `lighthouseResult.lighthouseVersion` or `null`.

Field data:

- It is acceptable for `fieldData` to be `null` in this slice.
- If PageSpeed `loadingExperience` or `originLoadingExperience` is included, normalise it into the same metric shape.
- Keep CrUX/CrUX History as a later upgrade.

## Persistence Notes

Please inspect the API repo's existing database/ORM style first, then implement this in the smallest consistent way.

Expected persistence changes:

- Add report groups with `projectId`, `name`, `pageUrl`, `strategy`, and `createdAt`.
- Add `groupId` to reports.
- Enforce that a report's group belongs to the same project.
- Add required `pageUrl` to reports.
- Remove or stop exposing `uxScore`.
- Add required `bestPracticesScore`.
- Add required `agenticBrowsingScore`.
- Add nullable JSON/JSONB `insights` if the backend uses a relational database.
- Store only the normalised `insights`, not the raw PageSpeed response.

## Seed Data Reset

Please remove the existing seed report data and rebuild it around the new contract. The old seed data was useful for the first four-score prototype, but it now makes local development harder because it does not represent the real report shape.

This reset can be destructive for local/dev seed data.

Recommended baseline:

- One seeded test user/account, following the repo's existing auth seed pattern.
- Two realistic projects:
    - `Crayons & Code`, `https://www.crayonsandcode.com/`
    - `Example Commerce`, `https://example.com/`
- Four flat report groups per project:
    - `Homepage mobile`, `pageUrl` set to the project homepage, `strategy: "mobile"`
    - `Homepage desktop`, `pageUrl` set to the project homepage, `strategy: "desktop"`
    - `Pricing mobile`, `pageUrl` set to `/pricing` where useful, `strategy: "mobile"`
    - `Pricing desktop`, `pageUrl` set to `/pricing` where useful, `strategy: "desktop"`
- Two or three reports per group, with `createdAt` values spaced over time so the UI can show a history stream.
- Every seeded report should include:
    - `groupId`
    - `pageUrl`
    - `performanceScore`
    - `accessibilityScore`
    - `seoScore`
    - `bestPracticesScore`
    - `agenticBrowsingScore`
    - `createdAt`
- Include at least one report with valid normalised `insights` so the frontend can render the imported PageSpeed data block locally.
- Do not seed `uxScore`.
- Do not seed ungrouped reports in the normal development baseline. Keep ungrouped handling as a frontend/API defensive fallback only.

Use deterministic IDs if the repo's current seed setup already does that. Otherwise, it is fine to let the database generate IDs as long as relationships are created from inserted records rather than hard-coded stale IDs.

Example report sequence for one group:

```txt
Homepage mobile
2026-06-01: performance 72, accessibility 94, SEO 96, best practices 88, agentic browsing 76
2026-06-15: performance 78, accessibility 96, SEO 98, best practices 90, agentic browsing 80
2026-07-01: performance 84, accessibility 98, SEO 100, best practices 93, agentic browsing 84
```

The seed data should make these UI behaviours easy to check locally:

1. Project report cards show group name, date, URL, and five scores.
2. `All groups` shows multiple grouped history streams.
3. Filtering to `Homepage mobile` shows only that stream.
4. Creating a new report can use existing groups immediately.
5. Imported insights can be rendered without calling PageSpeed during every local run.

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

Please add focused tests around the contract and normalisation.

Reports:

- Create requires `groupId`, `pageUrl`, and the five score fields.
- Create rejects missing, non-integer, or out-of-range scores.
- Create rejects `uxScore` if the repo rejects unknown fields, or at least never returns it.
- Create accepts optional valid `insights`.
- Create rejects malformed `insights`.
- Update accepts `groupId`, `pageUrl`, and the five score fields.
- Update rejects or otherwise protects against replacing `insights`.
- Responses include `createdAt`, `groupId`, and lightweight `group`.
- Responses no longer include `uxScore`.

Report groups:

- Create validates name, page URL, strategy, auth, and project ownership.
- List returns only groups for the requested project.
- Reports cannot be created with a group from another project.
- Report list filters by `groupId`.
- Inaccessible or invalid group ids are handled consistently.

PageSpeed imports:

- Request validation rejects missing source, unsupported source, invalid URL, unsupported strategy, and overlong URL.
- Auth/project checks match existing report endpoints.
- PageSpeed client builds the expected query parameters.
- API key is not exposed in returned errors.
- Normaliser converts category scores from `0..1` to `0..100`.
- Normaliser returns `null` for missing or malformed scores and metrics.
- Normaliser returns `agenticBrowsing: null` when no reliable category exists.
- Opportunity normalisation sorts and limits returned opportunities.
- Timeout/unavailable PageSpeed responses return controlled errors.

## Acceptance Criteria

This API work is ready when the frontend can:

1. Load report groups for a project.
2. Create a report group inline from the new-report dialog.
3. Create a report with `groupId`, `pageUrl`, the five scores, and optional `insights`.
4. Edit a report's group, URL, summary, title, and five scores without replacing `insights`.
5. Filter reports by `groupId`.
6. Render each report card with `createdAt`, group name, URL, and the five scores.
7. Import PageSpeed data without exposing a Google key to the browser.

## Deferred Work

Do not implement these yet:

- `measuredAt` or editable/backdated report dates.
- Nested groups such as `Homepage > Mobile`.
- Charts/trends in the API.
- Scheduled monitoring.
- CrUX History time series storage.

Keep the shapes ready for future CrUX work by preserving `ReportInsightsSource = 'PAGESPEED' | 'CRUX'` and keeping `fieldData` separate from Lighthouse lab data.
