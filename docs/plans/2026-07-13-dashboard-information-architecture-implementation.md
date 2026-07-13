# Dashboard information architecture implementation plan

## Overview

Implement the approved shared-workspace dashboard across `site-score-api` and `site-score-ui`. Authentication remains mandatory, but authenticated users gain administrative access to the same clients, projects, and results. The UI gains a dashboard landing page, client drill-down, a client-filterable global project index, clearer breadcrumbs, and user-facing “Results” terminology.

## Architecture decisions

- Keep existing `user_id` database columns as creator metadata; change access checks and list queries without a schema migration.
- Add a purpose-built `GET /dashboard` endpoint so the overview arrives as one coherent payload with linkable identifiers and names.
- Extend `GET /projects` with `clientId=<uuid>` and `clientId=unassigned`; preserve all existing pagination, search, sort, order, and status behaviour.
- Keep `Report` in API and TypeScript contracts while using “Result” in visible UI copy.
- Retain `/projects` as a global authenticated workspace view and use `/clients/:id` for the client-scoped project view.
- Preserve URL-based filter state, existing archive flows, semantic links, focus behaviour, and current visual language.

## Task list

### Phase 1: Shared authenticated workspace

## Task 1: Make client access workspace-wide

**Description:** Update client listing and mutation authorisation so every authenticated account can see and manage all client records while unauthenticated requests remain blocked.

**Acceptance criteria:**

- Client lists are no longer filtered by the current user.
- Client detail, edit, archive, restore, and delete work for any authenticated account.
- Cross-account API tests demonstrate shared access; unauthenticated tests remain green.

**Verification:**

- Run focused client route tests.
- Run API lint/type checks through the existing build.

**Dependencies:** None.

**Files likely touched:**

- `/Users/psteer/Code/site-score-api/src/controllers/client-controller.ts`
- `/Users/psteer/Code/site-score-api/src/services/client-service.ts`
- `/Users/psteer/Code/site-score-api/src/routes/client-routes.test.ts`

**Estimated scope:** Medium.

## Task 2: Make projects workspace-wide and add client filtering

**Description:** Remove per-user project filtering and ownership rejection, then add optional client and unassigned filters to the existing paginated project list.

**Acceptance criteria:**

- Authenticated accounts can list, view, create, update, archive, restore, and delete workspace projects.
- `GET /projects?clientId=<uuid>` returns only that client's projects.
- `GET /projects?clientId=unassigned` returns only projects without a client; invalid identifiers receive a validation error.

**Verification:**

- Run focused project route and pagination tests.
- Confirm existing search, status, sort, order, and pagination tests still pass.

**Dependencies:** Task 1.

**Files likely touched:**

- `/Users/psteer/Code/site-score-api/src/controllers/project-controller.ts`
- `/Users/psteer/Code/site-score-api/src/services/project-service.ts`
- `/Users/psteer/Code/site-score-api/src/utils/pagination.ts`
- `/Users/psteer/Code/site-score-api/src/routes/project-routes.test.ts`
- `/Users/psteer/Code/site-score-api/src/utils/pagination.test.ts`

**Estimated scope:** Medium.

## Task 3: Make project results and supporting resources workspace-wide

**Description:** Apply the same authenticated shared-workspace rule to report groups, results, trends, and PageSpeed imports, using project existence rather than creator ownership as the access boundary.

**Acceptance criteria:**

- Any authenticated account can manage results and report groups for any workspace project.
- Trends and PageSpeed imports work across creator accounts.
- Missing resources retain `404` behaviour and unauthenticated requests retain `401` behaviour.

**Verification:**

- Run focused report, report-group, and insight-import route tests.
- Run the full API suite at the phase checkpoint.

**Dependencies:** Task 2.

**Files likely touched:**

- `/Users/psteer/Code/site-score-api/src/controllers/report-controller.ts`
- `/Users/psteer/Code/site-score-api/src/controllers/report-group-controller.ts`
- `/Users/psteer/Code/site-score-api/src/controllers/report-insight-import-controller.ts`
- `/Users/psteer/Code/site-score-api/src/routes/report-routes.test.ts`
- `/Users/psteer/Code/site-score-api/src/routes/report-insight-import-routes.test.ts`

**Estimated scope:** Medium.

### Checkpoint: Shared workspace

- Full API test suite passes serially.
- API TypeScript build succeeds.
- Authenticated cross-account access works without weakening authentication.
- Both repositories remain free of unrelated changes.

### Phase 2: Dashboard vertical slice

## Task 4: Add the dashboard API contract

**Description:** Add an authenticated dashboard endpoint returning up to five recent clients, projects, and results with the identifiers and related names needed for navigation.

**Acceptance criteria:**

- `GET /dashboard` returns stable typed collections ordered newest first.
- Project items include assigned client identity where available.
- Result items include project identity and assigned client identity where available; archived records are excluded.

**Verification:**

- Add route tests for populated, empty, authenticated, and unauthenticated responses.
- Run API tests and build.

**Dependencies:** Tasks 1–3.

**Files likely touched:**

- `/Users/psteer/Code/site-score-api/src/routes/dashboard-routes.ts`
- `/Users/psteer/Code/site-score-api/src/controllers/dashboard-controller.ts`
- `/Users/psteer/Code/site-score-api/src/services/dashboard-service.ts`
- `/Users/psteer/Code/site-score-api/src/types/dashboard.ts`
- `/Users/psteer/Code/site-score-api/src/routes/dashboard-routes.test.ts`

**Estimated scope:** Medium.

## Task 5: Make Dashboard the authenticated UI entry point

**Description:** Add the dashboard API client and page, then change login, root, title, and primary navigation destinations to `/dashboard`.

**Acceptance criteria:**

- Successful login and `/` lead to Dashboard.
- Dashboard, Clients, and Projects appear in primary navigation; the site title links to Dashboard.
- Recent cards use semantic lists and links, with accessible loading, empty, and error states.

**Verification:**

- Add failing-then-passing route, login, shell, API-client, and dashboard page tests.
- Verify keyboard navigation and narrow viewport layout in a browser.

**Dependencies:** Task 4.

**Files likely touched:**

- `src/App.tsx`
- `src/components/layout/AppShell.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/api/dashboard.ts`

**Estimated scope:** Medium.

### Checkpoint: Dashboard

- Dashboard API and UI focused tests pass.
- Login → Dashboard → recent item navigation works locally.
- UI and API builds succeed.

### Phase 3: Client and project hierarchy

## Task 6: Add the client detail project view

**Description:** Link client names to a client detail route that loads the client and a paginated, filterable list of its projects, with project creation preassigned to that client.

**Acceptance criteria:**

- `/clients/:id` identifies the client and lists only its projects.
- Client index names are links; edit/archive actions remain separate controls.
- Creating a project from client detail preselects and preserves that client.

**Verification:**

- Add client detail and linked-index tests.
- Verify Client → Project navigation and keyboard focus in a browser.

**Dependencies:** Tasks 2 and 5.

**Files likely touched:**

- `src/pages/ClientsPage.tsx`
- `src/pages/ClientDetailPage.tsx`
- `src/pages/ClientDetailPage.test.tsx`
- `src/components/projects/CreateProjectForm.tsx`
- `src/App.tsx`

**Estimated scope:** Medium.

## Task 7: Add global project client filtering

**Description:** Extend the frontend project API and global project page with URL-backed filters for all clients, one client, and unassigned projects.

**Acceptance criteria:**

- Client filter state is represented by `clientId` in the URL.
- Filtering composes with search, status, sort, order, and pagination.
- Project list API calls send the selected client filter without triggering the legacy bare-list fallback.

**Verification:**

- Add API client and Projects page tests for assigned and unassigned filters.
- Verify filter labels, keyboard use, and empty states in a browser.

**Dependencies:** Tasks 2 and 5.

**Files likely touched:**

- `src/api/projects.ts`
- `src/api/projects.test.ts`
- `src/pages/ProjectsPage.tsx`
- `src/pages/ProjectsPage.test.tsx`

**Estimated scope:** Medium.

## Task 8: Clarify hierarchy and Results terminology

**Description:** Add client-aware breadcrumbs and replace visible “report” wording with “result” where it describes user-facing audit outputs, without renaming internal contracts.

**Acceptance criteria:**

- Project detail links back through its client when assigned and back to Projects when unassigned.
- Visible page headings, actions, empty states, and summaries consistently use “Result(s)”.
- Existing report IDs, API paths, types, and behaviour remain unchanged.

**Verification:**

- Update project detail and copy assertions.
- Run accessibility-oriented DOM checks for headings, breadcrumbs, link names, and focus order.

**Dependencies:** Tasks 6 and 7.

**Files likely touched:**

- `src/pages/ProjectDetailPage.tsx`
- `src/pages/ProjectDetailPage.test.tsx`
- `src/pages/NotFoundPage.tsx`
- `src/index.css`

**Estimated scope:** Medium.

### Checkpoint: Complete hierarchy

- Full API and UI test suites pass.
- API and UI production builds succeed; UI lint passes.
- `git diff --check` passes in both repositories.
- Browser flow works: Login → Dashboard → Client → Project → Results.
- Browser flow works: Projects → client filter → Project.
- Desktop and narrow viewport layouts retain visible focus and usable controls.

## Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Shared access accidentally removes authentication | High | Keep `requireAuth` on every route and add explicit unauthenticated regression tests. |
| Existing data remains split by creator | Medium | Treat creator IDs as metadata and query across them; do not rewrite production data. |
| Dashboard endpoint duplicates list logic | Medium | Use focused read queries and shared row mappers where they remain clear; avoid coupling dashboard pagination to full indexes. |
| Client filtering conflicts with existing fallback behaviour | Medium | Add API-client regression tests and disable bare retry when `clientId` is set. |
| Results terminology creates code churn | Low | Change visible copy only; retain `Report` internally. |
| Cross-repository deployment order causes temporary UI errors | Medium | Deploy API additions before or alongside UI; additive endpoints keep the existing UI compatible. |

## Open questions

None. “Go for it” is treated as approval of the dashboard hierarchy and shared authenticated admin workspace described in the design document.
