# Dashboard information architecture design

## Goal

Make Site Score reflect the way audit work is organised: a shared workspace contains clients, clients contain projects, and projects contain results. Give trusted authenticated users a useful overview immediately after login without exposing an unstructured global results list.

## Access model

- Authentication remains required for every application and API route.
- Every authenticated account has full administrative access to the same clients, projects, report groups, results, and archive actions.
- Existing `user_id` values remain as creator metadata for now, but no longer restrict reads or mutations.
- Unauthenticated requests and invalid sessions continue to receive the existing authentication errors.

## Navigation and routes

The primary navigation contains:

- Dashboard
- Clients
- Projects

The site title links to the dashboard. Successful login and the root route both lead to `/dashboard`.

Application routes:

- `/dashboard` — recent workspace activity
- `/clients` — searchable and filterable client index
- `/clients/:id` — one client and its projects
- `/projects` — searchable cross-client project index with a client filter
- `/projects/:id` — one project and its results

Results do not receive a global navigation item. They retain their project context and are surfaced on the dashboard as recent activity.

## Dashboard

The dashboard presents three compact sections, each limited to five items:

- Recent clients: client name and creation date, linking to the client detail page.
- Recent projects: project name, client name where assigned, and creation date, linking to project detail.
- Recent results: result title, project name, client name where assigned, and creation date, linking to its project and the relevant result context.

Each section includes a link to its relevant full index where one exists. Empty, loading, and error states remain explicit and accessible. Dashboard data should be returned by a purpose-built authenticated API endpoint so the page loads coherently without several independent requests or client-side joins.

## Client detail

The client index makes each client name a conventional link. The client detail page:

- identifies the client with an `h1`;
- provides edit/archive actions using existing behaviour;
- lists that client's projects with the same useful summaries as the global project list;
- provides a create-project action with the client preselected;
- supports project search, ordering, status filtering, and pagination;
- provides a breadcrumb back to Clients.

Archived clients remain viewable. Existing rules for creating or assigning projects to archived clients are preserved unless the API already rejects them.

## Projects and results

The global project index remains available for cross-client work. It gains a client filter with options for all clients, one client, and unassigned projects. The API project-list endpoint gains an optional `clientId` query parameter.

Project detail remains the place for report groups, trends, and individual audit outputs. User-facing copy calls these items “results”; internal TypeScript and API names can remain `Report` to avoid a broad migration. Breadcrumbs link back through the assigned client when possible, otherwise back to Projects.

## API contract

The API changes are intentionally additive:

- `GET /dashboard` returns recent clients, projects, and results with the names and identifiers required for links.
- `GET /projects` accepts an optional `clientId`; a documented sentinel value represents unassigned projects.
- Existing client, project, report-group, result, archive, and restore endpoints become shared-workspace operations for any authenticated account.

The API continues to validate identifiers, request bodies, pagination, sorting, and archive status. Cross-user ownership tests are replaced with shared-admin access tests while unauthenticated access tests remain.

## Accessibility and progressive enhancement

- Navigation and hierarchy use real links, headings, lists, and breadcrumbs.
- Filter state remains represented in the URL.
- Existing visible focus treatment and keyboard behaviour are preserved.
- Loading announcements and error alerts use existing components.
- No new client-side state library or dependency is introduced.

## Verification

- API tests cover shared authenticated access, dashboard response shape, client filtering, unassigned filtering, and retained authentication checks.
- UI tests cover login/root redirects, navigation, dashboard states, linked client cards, client-scoped projects, client filtering, and breadcrumbs.
- Full API and UI test suites, linting, TypeScript builds, and production builds pass.
- Browser verification covers Dashboard → Client → Project → Results and global Projects → client filter → Project at desktop and narrow viewport widths.

## Out of scope

- Role-based permissions or account administration.
- A global Results index or primary navigation item.
- Renaming database tables, API endpoints, or TypeScript report types from “report” to “result”.
- Removing creator ownership columns from the database.
