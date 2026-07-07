# API Repo Prompt: PageSpeed Report Imports

Please implement the API side of the Site Score PageSpeed report import feature.

## Context

The frontend repo now has an optional, disabled-by-default PageSpeed import UI. It expects the API to provide a small import-preview endpoint, then accepts the returned normalised insights when creating or updating a report.

Enable the UI only after the API work is deployed by setting:

```env
VITE_ENABLE_PAGESPEED_IMPORT=true
```

Do not expose any Google API key to the frontend. Keep PageSpeed and future CrUX API keys in the API service environment only.

Official references:

- PageSpeed Insights API overview: https://developers.google.com/speed/docs/insights/v5/get-started
- PageSpeed `runPagespeed` reference: https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed
- Chrome UX Report API: https://developer.chrome.com/docs/crux/api/

Important source note: PageSpeed can return Lighthouse lab data and, where available, field data. Google now recommends using the CrUX API or CrUX History API for real-world CrUX data over time, so keep this first slice PageSpeed-only but do not design the stored data shape in a way that blocks later CrUX ingestion.

## Goal

Ship Option A first:

1. A manual, authenticated import endpoint that calls PageSpeed for one URL and one strategy.
2. Normalised report insights returned to the frontend for review.
3. Report create endpoints can persist those insights alongside the existing four manual scores.
4. Existing report behaviour remains backwards compatible.

Do not build scheduled monitoring yet. Leave the contract ready for a later CrUX/CrUX History upgrade.

## API Contract

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
- `url` must be an absolute `http://` or `https://` URL, trimmed, and capped at 2048 characters.
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
    "seo": 100
  },
  "metrics": {
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
  ]
}
```

The frontend type shape is:

```ts
type PageSpeedStrategy = 'mobile' | 'desktop';

type ReportInsightsSource = 'PAGESPEED' | 'CRUX';

type ReportInsightMetricName =
    | 'firstContentfulPaint'
    | 'largestContentfulPaint'
    | 'cumulativeLayoutShift'
    | 'totalBlockingTime'
    | 'speedIndex'
    | 'timeToInteractive'
    | 'interactionToNextPaint';

type ReportInsightMetric = {
    value: number | null;
    unit: 'ms' | 'score' | 'unitless';
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
    };
    metrics: Partial<Record<ReportInsightMetricName, ReportInsightMetric>>;
    fieldData?: {
        source: ReportInsightsSource;
        overallCategory: string | null;
        metrics: Partial<Record<ReportInsightMetricName, ReportInsightMetric>>;
    } | null;
    opportunities: ReportInsightOpportunity[];
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
- `category`: request `performance`, `accessibility`, `best-practices`, and `seo`.
- `key`: from server environment when configured.

Use a server-side timeout and return a controlled API error when PageSpeed is slow or unavailable.

## Normalisation Rules

Treat the PageSpeed response as untrusted external data. Validate shape before use.

Scores:

- Read from `lighthouseResult.categories`.
- Convert Lighthouse category scores from `0..1` to whole numbers `0..100`.
- Use `null` when a category is missing or not numeric.
- Do not map best practices into the existing `uxScore`. The frontend keeps UX as a manual score for now.

Metrics:

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
- `unit`: use `ms` for timing metrics, `unitless` for CLS, and `score` only for score-like future metrics.
- `category`: optional, currently `null` unless there is a reliable source value.

Opportunities:

- Pull from Lighthouse audits where `details.type` is `"opportunity"`.
- Include only useful opportunities, preferably those with positive `overallSavingsMs`.
- Sort by `overallSavingsMs` descending.
- Return the top 5.
- Keep `title` and `displayValue` plain strings. Do not return HTML.

URLs and metadata:

- `testedUrl`: the URL requested by the user after trimming.
- `finalUrl`: `lighthouseResult.finalDisplayedUrl`, `lighthouseResult.finalUrl`, or `null`.
- `fetchedAt`: server timestamp when the import completed.
- `lighthouseVersion`: `lighthouseResult.lighthouseVersion` or `null`.

Field data:

- For this first slice, `fieldData` may be `null`.
- If you include PageSpeed field data from `loadingExperience` or `originLoadingExperience`, normalise it into the same metric shape and mark `fieldData.source` as `"PAGESPEED"`.
- Do not rely on PageSpeed field data as the long-term time-series source. Leave future CrUX work to a separate slice.

## Report Persistence

Extend report create validation to accept optional `insights`.

Existing report fields must continue to work:

```json
{
  "title": "Homepage audit",
  "summary": "Short summary",
  "accessibilityScore": 98,
  "performanceScore": 94,
  "seoScore": 100,
  "uxScore": 80,
  "insights": {
    "source": "PAGESPEED"
  }
}
```

Implementation notes:

- Add a nullable JSON/JSONB column for `insights` if the API uses a relational database.
- Validate the `insights` shape at the API boundary rather than storing arbitrary JSON.
- Keep all new report fields additive and optional.
- Return `insights` from report list/detail/create/update responses.
- Report update should preserve existing `insights` and should not replace them from the edit form.
- If an update request includes `insights`, reject it or ignore that field consistently. Prefer rejecting it with the API repo's standard validation error so accidental snapshot refreshes are visible.
- Do not persist the full raw PageSpeed response. Store only the normalised fields above.

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

- Request validation rejects missing source, unsupported source, invalid URL, unsupported strategy, and overlong URL.
- Auth/ownership checks match existing project report endpoints.
- PageSpeed client builds the expected query parameters without exposing the key in errors.
- Normaliser converts category scores from `0..1` to `0..100`.
- Normaliser returns `null` for missing or malformed metrics.
- Opportunity normalisation sorts and limits returned opportunities.
- Report create accepts optional valid `insights`.
- Report create rejects malformed `insights`.
- Report update preserves existing `insights` and does not replace the stored snapshot.
- Existing report create/update payloads without `insights` still pass.

## Future CrUX Slice

Do not implement this yet, but keep the shape ready for it.

Later we can add:

- `source: "CRUX"` imports or scheduled snapshots.
- CrUX API or CrUX History API calls keyed by URL/origin and form factor.
- Time-series storage for p75 values across Core Web Vitals.
- Trend views in the frontend.

The important thing for this slice is that `ReportInsightsSource` already allows `"CRUX"` and `fieldData` is separated from Lighthouse lab data.
