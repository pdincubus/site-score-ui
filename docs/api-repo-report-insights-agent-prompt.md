# API Repo Prompt: Report Insight Metrics, Page Weight, User Timings, And Failed Audits

Please update the Site Score API repo to support the latest frontend report-insights direction.

## Context

The frontend now shows PageSpeed import data as:

- A compact metadata row.
- Useful headline metrics.
- Disclosure sections for opportunities and failed or warning audits.
- A disclosure section for User Timing marks and measures, including changes from the previous report when comparison data is available.

The frontend intentionally no longer shows report `summary` on report cards, and it hides repeated imported metadata such as `Source`, `Tested URL`, and `Fetched`. The API can keep accepting and returning `summary` and `fetchedAt` for now because forms and provenance data still use them, but it should not rely on either field to communicate the visible report state.

## Page Weight Answer

Page weight can come from PageSpeed/Lighthouse data. Do not build a separate crawler for this v1.

Use the Lighthouse `total-byte-weight` audit from the PageSpeed `lighthouseResult.audits` map. Store the audit `numericValue` as raw bytes and return it as the normalised `pageWeight` metric.

Official references:

- PageSpeed `runPagespeed` response includes `lighthouseResult.audits` and `lighthouseResult.categories.*.auditRefs`: https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed
- Lighthouse documents the network payload audit as showing the total size in KiB of all resources requested by the page: https://developer.chrome.com/docs/lighthouse/performance/total-byte-weight/
- Lighthouse documents User Timing marks and measures as an informative audit populated from the User Timing API: https://developer.chrome.com/docs/lighthouse/performance/user-timings/
- Lighthouse source currently emits `user-timings` table rows with `name`, `timingType`, `startTime`, and `duration`: https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/user-timings.js

## Frontend Contract Delta

Extend the existing `ReportInsights` shape like this:

```ts
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
    source: 'PAGESPEED' | 'CRUX';
    strategy: 'mobile' | 'desktop';
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
        source: 'PAGESPEED' | 'CRUX';
        overallCategory: string | null;
        metrics: Partial<Record<ReportInsightMetricName, ReportInsightMetric>>;
    } | null;
    opportunities: ReportInsightOpportunity[];
    auditRefs?: ReportInsightAuditRef[];
    userTimings?: ReportInsightUserTiming[];
};
```

## Normalisation Rules

Metrics:

- `total-byte-weight` -> `pageWeight`, `unit: 'bytes'`, `value: numericValue`, `displayValue: displayValue ?? null`.
- `first-contentful-paint` -> `firstContentfulPaint`, `unit: 'ms'`.
- `speed-index` -> `speedIndex`, `unit: 'ms'`.
- `total-blocking-time` -> `totalBlockingTime`, `unit: 'ms'`.
- Keep the existing LCP, CLS, TTI, and INP mappings.
- Use `null` for missing or malformed metric values.

Audit refs:

- Build `auditRefs` from `lighthouseResult.categories.*.auditRefs` joined to `lighthouseResult.audits`.
- Include audits with numeric `score` below `1`.
- Use `severity: 'fail'` when `score === 0`.
- Use `severity: 'warning'` when `score > 0 && score < 1`.
- Ignore `manual`, `informative`, `not_applicable`, and `error` display modes for this slice.
- Return only bounded plain fields: `id`, `title`, `category`, `severity`, `displayValue`, and `score`.
- Do not return raw descriptions, details payloads, HTML, warnings arrays, stack traces, or the full PageSpeed response.
- Sort failed audits before warnings within their category, and cap the list to a sensible number such as 20.

Opportunities:

- Keep the existing opportunities output, but make sure it can include more than three items. The frontend now hides the list in a disclosure element, so five useful opportunities is fine.

User timings:

- Pull from the Lighthouse `user-timings` audit.
- Use `lighthouseResult.audits["user-timings"].details.items` when it is a table-like details payload.
- Normalise each row into:
  - `name`: the timing name.
  - `entryType`: `"measure"` when Lighthouse `timingType` is `"Measure"`, otherwise `"mark"` when it is `"Mark"`.
  - `startTime`: finite `startTime` in milliseconds, otherwise `null`.
  - `duration`: finite `duration` in milliseconds for measures, otherwise `null`.
  - `displayValue`: a short formatted value for the primary comparable number. For measures use duration; for marks use start time.
- Treat lower numbers as better for comparisons. Measures becoming shorter are improvements; marks happening earlier are improvements.
- Exclude third-party/noisy entries using the same spirit as Lighthouse, including names that start with `goog_`.
- Keep strings plain text and cap the list to a sensible number such as 50.
- If the audit is missing or not applicable, return `userTimings: []` or omit the field consistently.

## Example Response Fragment

```json
{
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
    }
  },
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

## Persistence And Compatibility

- Update validation for saved `insights` JSON so `metrics.pageWeight`, metric `unit: 'bytes'`, optional `auditRefs`, and optional `userTimings` are accepted.
- Existing seed-only insight records can be reset or reseeded if that is simpler.
- Keep `createdAt` as the report date for this slice.
- Do not add `measuredAt` yet.
- Do not expose a Google API key to the frontend.

## Tests To Add

- PageSpeed normaliser maps `total-byte-weight` to `metrics.pageWeight`.
- PageSpeed normaliser includes FCP, Speed Index, and TBT when present.
- PageSpeed normaliser returns `null` for malformed metric values.
- Audit-ref normaliser includes failed and warning audits from requested Lighthouse categories.
- Audit-ref normaliser ignores passed, manual, informative, not-applicable, and errored audits.
- Audit-ref normaliser caps the output and does not expose raw audit details.
- Create report accepts persisted insights with `pageWeight`, `unit: 'bytes'`, and `auditRefs`.
- Create report rejects malformed `auditRefs`.
- User timing normaliser maps the Lighthouse `user-timings` audit to `insights.userTimings`.
- User timing normaliser accepts marks without duration and measures with duration.
- User timing normaliser filters noisy entries, caps output, and rejects malformed saved user timing entries.
