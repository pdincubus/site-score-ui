# Client List Summary Design

## Overview

The clients list should read as a useful operational list rather than nested cards. Each client item stays as one wide list card, but the created and archived dates move into inline metadata so there is no secondary container inside the item.

## Data Contract

`GET /clients` should add a `summary` object to each list client:

```ts
summary: {
    projectCount: number;
    reportCount: number;
}
```

The fields are additive and keep the existing client fields unchanged. Counts should come from the API query so the UI does not make per-client project or report requests.

## UI Shape

Each client row should show the client link, archived status, edit action, created date, optional archived date, project count, and result count. Count labels should pluralise naturally and use the existing dark list styling without creating a nested bordered card.

## Implementation Plan

1. Add API tests proving client list items include project and active report counts.
2. Update the API client service and OpenAPI schema with the additive summary contract.
3. Update UI types, mock API responses, and clients page tests.
4. Replace the nested date summary block with inline metadata and count badges.
5. Verify with tests, lint, build, and a browser check.

## Risks

The main risk is count semantics. This implementation should count all projects assigned to a client and active, non-archived reports across those projects, matching the project summary pattern that excludes archived reports.
