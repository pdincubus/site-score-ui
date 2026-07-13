# Project Card Client Context Design

## Overview

Project cards should lead with their client context so the global projects view is easier to scan. Each project card should show the assigned client before the project name, with unassigned projects clearly labelled.

## Data Contract

`GET /projects` should add `clientName` to each list project:

```ts
clientName: string | null;
```

The field is additive and leaves the existing `clientId` unchanged. The API should source the name with a left join on `clients`, avoiding any extra UI requests or incomplete client filter lookups.

## UI Shape

Each project card should start with a compact client line:

- Assigned project: `Client: Crayons & Code`, linked to `/clients/:id`.
- Unassigned project: `Unassigned client`, rendered as plain text.

The project name remains the primary heading link, followed by the URL and existing summary stats.

## Implementation Plan

1. Add an API route test proving project list items include `clientName`.
2. Update the API project list query, types, and OpenAPI schema.
3. Update UI types, mock API data, and project page tests.
4. Render the client context above each project card heading.
5. Verify with tests, lint, build, and a browser check.

## Risks

The main risk is deployment order. The API should deploy before the UI so the UI receives the additive `clientName` field it expects.
