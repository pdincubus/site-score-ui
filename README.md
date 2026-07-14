# Site Score UI

A lightweight React and TypeScript frontend for the Site Score API.

This project exists as a companion UI for the API so the data can be browsed and used in a more realistic front end workflow. It focuses on consuming authenticated API endpoints, handling cookie-based sessions, showing paginated data, and presenting projects and reports in a simple admin-style interface.

## Live API

- API base URL: `https://site-score-api.onrender.com`
- API docs: `https://site-score-api.onrender.com/docs`

Production browser requests are proxied through the UI deployment at `/api` so auth cookies stay on the same site as the frontend.

## Tech stack

- React
- TypeScript
- Vite
- React Router
- native `fetch`
- plain CSS

## Features

- Login with email and password
- Cookie-based auth against the Site Score API
- Auth check on app load via `/auth/me`
- Protected routes
- Projects list page
- Project search, sorting, and pagination
- Project detail page
- Report list for a project
- Report pagination
- Logout

## Project structure

```txt
src/
    api/
    components/
        auth/
        layout/
    context/
    pages/
    types/
    App.tsx
    main.tsx
    index.css
```

### Structure overview

- `api` contains API client helpers and endpoint-specific request functions
- `components` contains reusable UI pieces
- `context` contains auth state and auth actions
- `pages` contains route-level UI
- `types` contains shared frontend TypeScript types

## Environment variables

Create a local env file in the project root.

### `.env.local`

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_ENABLE_PAGESPEED_IMPORT=false
```

### `.env.production`

```env
VITE_API_BASE_URL=/api
VITE_ENABLE_PAGESPEED_IMPORT=false
```

You should also add an `.env.example` file.

### `.env.example`

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_ENABLE_PAGESPEED_IMPORT=false
```

### Optional PageSpeed import

The report forms include a disabled-by-default PageSpeed import UI. Enable it only after the API repo exposes `POST /projects/:projectId/report-insight-imports`.

```env
VITE_ENABLE_PAGESPEED_IMPORT=true
```

The frontend never stores or reads a Google API key. PageSpeed and CrUX keys belong in the API service only.

### Local visual test data

For UI checks without a running API, point the app at the built-in read-only mock API.

```env
VITE_API_BASE_URL=/mock-api
VITE_ENABLE_PAGESPEED_IMPORT=true
```

This mock returns a demo user automatically, multiple projects, compact project summary stats, mobile and desktop homepage report groups, and repeated reports with score deltas, trend history, PageSpeed metrics, page weight, Lighthouse metadata, opportunities, failed/warning audits, and User Timing data. It includes a more polished `Crayons & Code` project, a lower-scoring `Harbour Homeware` project so the report trend charts can be checked against a more realistic improvement path, and a blank project for empty summary states. It is intended for visual checks only; unsupported write requests return a mock API error.

## Local setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start the dev server

```bash
pnpm dev
```

The app should then be available at:

```txt
http://localhost:5173
```

## Scripts

```bash
pnpm dev
pnpm build
pnpm preview
```

## How auth works

The frontend uses cookie-based auth against the API.

Important details:

- requests use `credentials: 'include'`
- production browser requests use the `/api` Vercel rewrite to avoid third-party cookies
- the API must allow the frontend origin in CORS when it is called directly
- login state is restored by calling `/auth/me` on app load

## API client notes

The API client lives in `src/api/client.ts`.

It:
- reads the base URL from `VITE_API_BASE_URL`
- routes production calls through `/api` when the configured API base is the Render production API
- includes cookies with each request
- parses JSON responses
- throws a simple error message when the API returns an error

## Current routes

- `/login`
- `/projects`
- `/projects/:id`

## Current UI flow