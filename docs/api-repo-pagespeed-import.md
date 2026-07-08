# API Repo Prompt: PageSpeed Report Imports, Indicators, And Groups

Please implement the API side of the Site Score report score-model change, report grouping, and PageSpeed import feature.

## Context

The frontend now treats this as a breaking change. Existing data is seed-only, so do not preserve the old four-score contract.

The primary report indicators are now:

- `performanceScore`
- `accessibilityScore`
- `seoScore`
- `bestPracticesScore`
- `agenticBrowsingScore`

The old `uxScore` field should be removed from report create/update/list/detail responses.

Reports now belong to first-class report groups. These are flat tracking streams such as `"Homepage mobile"` or `"Homepage desktop"`; do not build nested groups yet.

The frontend still keeps the PageSpeed import UI behind:

```env
VITE_ENABLE_PAGESPEED_IMPORT=true
```

Do not expose any Google API key to the frontend. Keep PageSpeed and future CrUX API keys in the API service environment only.

Official references:

- PageSpeed Insights API overview: https://developers.google.com/speed/docs/insights/v5/get-started
- PageSpeed `runPagespeed` reference: https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed
- Lighthouse `total-byte-weight` audit: https://developer.chrome.com/docs/lighthouse/performance/total-byte-weight/
- Lighthouse User Timing audit: https://developer.chrome.com/docs/lighthouse/performance/user-timings/
- Lighthouse `user-timings` audit source: https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/user-timings.js
- Chrome UX Report API: https://developer.chrome.com/docs/crux/api/

Important source note: as of the current PageSpeed API reference, the documented `category` query values are `accessibility`, `best-practices`, `performance`, and `seo`. The response exposes `lighthouseResult.categories` as a generic category map. The frontend contract includes `agenticBrowsing` now, but the import normaliser should return `null` for it unless PageSpeed/Lighthouse returns a documented or observed Agentic Browsing category in the response. Do not invent that score.

## Goal

Ship Option A first:

1. Update report persistence and API validation to the new five-score report contract.
2. Add a required `pageUrl` to reports so each report records the exact page tested.
3. Add report groups so repeated reports can be tracked as a history stream.
4. Add a manual, authenticated import endpoint that calls PageSpeed for one URL and one strategy.
5. Return normalised report insights to the frontend for review before report creation.
6. Persist optional imported insights on report creation.

Do not build scheduled monitoring yet. Leave the contract ready for a later CrUX/CrUX History upgrade.

## Report Contract

Report create should accept:

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

Report update should accept the same editable report fields, but should not replace stored `insights` from the edit form:

```json
{
  "groupId": "report-group-id",
  "title": "Updated audit",
  "summary": "Updated summary",
  "pageUrl": "https://example.com/pricing",
  "performanceScore": 91,
  "accessibilityScore": 96,
  "seoScore": 99,
  "bestPracticesScore": 88,
  "agenticBrowsingScore": 82
}
```

Rules:

- `groupId`: required, must belong to the same project and authenticated user.
- `title`: required, trimmed, capped at 160 characters.
- `summary`: required, trimmed, capped at 500 characters.
- `pageUrl`: required, trimmed, absolute `http://` or `https://` URL, capped at 2048 characters.
- All five scores: required whole numbers from 0 to 100.
- `insights`: optional on create only.
- If an update request includes `insights`, reject it with the API repo's standard validation error so accidental snapshot refreshes are visible.
- Return `groupId`, a lightweight `group` summary, `pageUrl`, the five scores, `insights`, and `createdAt` from report list/detail/create/update responses.
- `createdAt` is the v1 report date shown in the UI. Do not add `measuredAt` yet.

Report response shape:

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

## Report Groups

Add these endpoints:

```txt
GET /projects/:projectId/report-groups
POST /projects/:projectId/report-groups
```

`GET /projects/:projectId/report-groups` should return all groups for that project ordered by name ascending:

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

`POST /projects/:projectId/report-groups` request body:

```json
{
  "name": "Homepage mobile",
  "pageUrl": "https://example.com/",
  "strategy": "mobile"
}
```

Rules:

- `name`: required, trimmed, capped at 120 characters.
- `pageUrl`: required, trimmed, absolute `http://` or `https://` URL, capped at 2048 characters.
- `strategy`: required, `"mobile"` or `"desktop"`.
- The authenticated user must be allowed to access the project.
- Group names should be unique per project if the API already has a uniqueness pattern; otherwise allow duplicates for this first slice and rely on the UI label.

Report listing should accept an optional group filter:

```txt
GET /projects/:projectId/reports?groupId=report-group-id
```

When `groupId` is provided, return only reports in that group. Reject or ignore invalid inaccessible group ids consistently with the API repo's existing validation style; prefer rejecting with `400` or `404`.

The UI also expects a full-history trend endpoint for report group graphs:

```txt
GET /projects/:projectId/report-group-trends
GET /projects/:projectId/report-group-trends?groupId=report-group-id
```

This endpoint should return one trend object per accessible group, or one object when `groupId` is provided. Its points must be sorted oldest to newest by `createdAt` and must not be affected by report-list pagination, search, or sort order.

## Import Endpoint

Add this endpoint:

```txt
POST /projects/:projectId/report-insight-imports
```

Request body:

```json
{
  "source": "PAGESPEED",
  "url": "https://example.com/",
  "strategy": "mobile"
}
```

Rules:

- `source` must currently be `"PAGESPEED"`.
- `url` must use the same validation rules as report `pageUrl`.
- `strategy` must be `"mobile"` or `"desktop"`.
- The authenticated user must be allowed to access the project.
- The endpoint should not create a report by itself. It returns data for the UI to review and later save.

Successful response:

```json
{
  "source": "PAGESPEED",
  "strategy": "mobile",
  "testedUrl": "https://example.com/",
  "finalUrl": "https://example.com/",
  "fetchedAt": "2026-07-07T12:00:00.000Z",
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

The frontend type shape is:

```ts
type PageSpeedStrategy = 'mobile' | 'desktop';

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

type ReportGroup = {
    id: string;
    projectId: string;
    name: string;
    pageUrl: string;
    strategy: PageSpeedStrategy;
    createdAt: string;
};

type ReportGroupSummary = Pick<ReportGroup, 'id' | 'name' | 'pageUrl' | 'strategy'>;

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

## PageSpeed Request

Call the PageSpeed endpoint server-side:

```txt
GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed
```

Use query parameters:

- `url`: the validated URL.
- `strategy`: `mobile` or `desktop`.
- `category`: request the documented categories `performance`, `accessibility`, `best-practices`, and `seo`.
- `key`: from server environment when configured.

Use a server-side timeout and return a controlled API error when PageSpeed is slow or unavailable.

## Normalisation Rules

Treat the PageSpeed response as untrusted external data. Validate shape before use.

Scores:

- Read from `lighthouseResult.categories`.
- Convert Lighthouse category scores from `0..1` to whole numbers `0..100`.
- Map `performance` to `scores.performance`.
- Map `accessibility` to `scores.accessibility`.
- Map `seo` to `scores.seo`.
- Map `best-practices` to `scores.bestPractices`.
- Map Agentic Browsing to `scores.agenticBrowsing` only if the PageSpeed/Lighthouse response includes a reliable category for it. Otherwise return `null`.
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

- `value`: use `numericValue` when it is a finite number, otherwise `null`.
- `displayValue`: use the audit display value when present, otherwise `null`.
- `unit`: use `bytes` for `pageWeight`, `ms` for timing metrics, `unitless` for CLS, and `score` only for score-like future metrics.
- `category`: optional, currently `null` unless there is a reliable source value.

Page weight:

- Use the Lighthouse `total-byte-weight` audit.
- Store `numericValue` as raw bytes when it is finite.
- Store the audit `displayValue` when provided, but the frontend can format raw bytes if needed.
- Do not implement a separate crawler for this v1. PageSpeed already returns the Lighthouse audit payload needed for this value.

Opportunities:

- Pull from Lighthouse audits where `details.type` is `"opportunity"`.
- Include only useful opportunities, preferably those with positive `overallSavingsMs`.
- Sort by `overallSavingsMs` descending.
- Return the top 5.
- Keep `title` and `displayValue` plain strings. Do not return HTML.

Warnings and failed audits:

- Build `auditRefs` from `lighthouseResult.categories.*.auditRefs` plus the matching entries in `lighthouseResult.audits`.
- Include audits from any requested category when they fail or need attention.
- Suggested v1 severity mapping:
  - `fail`: numeric `score` is `0`.
  - `warning`: numeric `score` is greater than `0` and less than `1`.
- Ignore audits with `scoreDisplayMode` values such as `manual`, `informative`, `not_applicable`, or `error` unless the API has a clear product reason to surface them later.
- `category` should be the Lighthouse category id, for example `performance`, `accessibility`, `best-practices`, `seo`, or a documented Agentic Browsing category if one appears.
- Keep the returned fields bounded to `id`, `title`, `category`, `severity`, `displayValue`, and `score`. Do not return raw audit descriptions, HTML, warnings arrays, stack traces, or full details payloads.
- Sort by category order and then failed audits before warnings; cap the list to a sensible limit such as 20.

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
- If the audit is missing or not applicable, return `userTimings: []` or omit the field consistently.

URLs and metadata:

- `testedUrl`: the URL requested by the user after trimming.
- `finalUrl`: `lighthouseResult.finalDisplayedUrl`, `lighthouseResult.finalUrl`, or `null`.
- `fetchedAt`: server timestamp when the import completed.
- `lighthouseVersion`: `lighthouseResult.lighthouseVersion` or `null`.

Field data:

- For this first slice, `fieldData` may be `null`.
- If you include PageSpeed field data from `loadingExperience` or `originLoadingExperience`, normalise it into the same metric shape and mark `fieldData.source` as `"PAGESPEED"`.
- Do not rely on PageSpeed field data as the long-term time-series source. Leave future CrUX work to a separate slice.

## Persistence Notes

- Add a required `pageUrl` column/string field to reports.
- Add report groups with `projectId`, `name`, `pageUrl`, `strategy`, and `createdAt`.
- Add `groupId` to reports and enforce that it belongs to the report's project.
- Replace `uxScore` with required `bestPracticesScore` and `agenticBrowsingScore`.
- Add a nullable JSON/JSONB column for `insights` if the API uses a relational database.
- Validate the `insights` shape at the API boundary rather than storing arbitrary JSON.
- Do not persist the full raw PageSpeed response. Store only the normalised fields above.
- Seed data can be reset or migrated destructively for this change.

## Seed Data Reset

Remove the old seed report data and rebuild the development seed from the new report contract. The current seed data can be treated as disposable because it was only used for the first four-score prototype.

Recommended baseline:

- One seeded test user/account, following the repo's existing auth seed pattern.
- Two realistic projects, such as `Crayons & Code` and `Example Commerce`.
- Four flat report groups per project:
  - `Homepage mobile`
  - `Homepage desktop`
  - `Pricing mobile`
  - `Pricing desktop`
- At least three reports per group, with `createdAt` values spaced over time so the frontend trend graph is meaningful.
- Every seeded report should include `groupId`, `pageUrl`, the five score fields, and `createdAt`.
- Include at least one report with valid normalised `insights`.
- Trend endpoint responses should include chronological points for every seeded group.
- Do not seed `uxScore`.
- Do not seed ungrouped reports in the normal development baseline. Keep ungrouped handling as a defensive fallback only.

The seed data should make it easy to verify grouped history streams, trend graphs, group filtering, date display, URL display, five-score cards, and the imported insights block locally.

## Errors

Use the API repo's existing error response shape. Recommended statuses:

- `400` or `422`: invalid request body.
- `401`: not authenticated.
- `403`: authenticated but not allowed to access the project.
- `404`: project not found.
- `429`: local rate limit or PageSpeed quota issue.
- `502`: PageSpeed returned an unusable response.
- `504`: PageSpeed timed out.

Error messages should be safe for users and should not expose API keys, stack traces, raw Google responses, or internal service details.

## Security And Performance

- Store the Google API key in server environment only, for example `PAGESPEED_API_KEY`.
- Never log the API key.
- Do not proxy arbitrary raw Google responses back to the browser.
- Rate limit the import endpoint per user and/or project.
- Cache recent imports for the same `url + strategy` for a short window, such as 5 to 15 minutes, to protect quota and make repeated UI clicks cheaper.
- Consider rejecting localhost, private network, and non-public URLs, even though PageSpeed itself performs the fetch.
- Keep request payloads small and response payloads bounded.

## Tests To Add

- Report create requires `pageUrl` and the five score fields.
- Report create requires a valid `groupId`.
- Report create rejects missing, non-integer, or out-of-range scores.
- Report create accepts optional valid `insights`.
- Report create rejects malformed `insights`.
- Report update accepts `groupId`, `pageUrl`, and the five score fields.
- Report update preserves existing `insights` and rejects or ignores `insights` consistently.
- Report responses no longer include `uxScore`.
- Report responses include `createdAt`, `groupId`, and lightweight `group`.
- Report group create validates name, page URL, strategy, auth, and project ownership.
- Report group list returns only groups for the requested project.
- Report list filters by `groupId`.
- Report group trend endpoint returns full-history chronological points for each accessible group.
- Report group trend endpoint supports optional `groupId` filtering.
- Report group trend endpoint is not affected by report list pagination, search, or sort order.
- Request validation rejects missing source, unsupported source, invalid URL, unsupported strategy, and overlong URL.
- Auth/ownership checks match existing project report endpoints.
- PageSpeed client builds the expected query parameters without exposing the key in errors.
- Normaliser converts category scores from `0..1` to `0..100`.
- Normaliser returns `null` for missing or malformed category scores and metrics.
- Normaliser returns `agenticBrowsing: null` when no reliable Agentic Browsing category is present.
- Normaliser maps the `total-byte-weight` Lighthouse audit to `metrics.pageWeight` with `unit: "bytes"`.
- Normaliser includes FCP, Speed Index, and TBT when the corresponding Lighthouse audits exist.
- Opportunity normalisation sorts and limits returned opportunities.
- Audit-ref normalisation includes failed and warning audits from all requested categories.
- Audit-ref normalisation does not expose raw audit details, descriptions, warnings arrays, or HTML.
- User timing normalisation maps the Lighthouse `user-timings` audit to `insights.userTimings`.
- User timing normalisation handles marks without duration and measures with duration.
- User timing normalisation filters noisy entries, caps output, and rejects malformed saved user timing entries.

## Future CrUX Slice

Do not implement this yet, but keep the shape ready for it.

Later we can add:

- `source: "CRUX"` imports or scheduled snapshots.
- CrUX API or CrUX History API calls keyed by URL/origin and form factor.
- Time-series storage for p75 values across Core Web Vitals.
- Trend views in the frontend.

The important thing for this slice is that `ReportInsightsSource` already allows `"CRUX"` and `fieldData` is separated from Lighthouse lab data.
