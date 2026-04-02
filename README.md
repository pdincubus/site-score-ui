# Site Score UI

A lightweight React and TypeScript frontend for the Site Score API.

This project exists as a companion UI for the API so the data can be browsed and used in a more realistic front end workflow. It focuses on consuming authenticated API endpoints, handling cookie-based sessions, showing paginated data, and presenting projects and reports in a simple admin-style interface.

## Live API

- API base URL: `https://site-score-api.onrender.com`
- API docs: `https://site-score-api.onrender.com/docs`

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
```

### `.env.production`

```env
VITE_API_BASE_URL=https://site-score-api.onrender.com
```

You should also add an `.env.example` file.

### `.env.example`

```env
VITE_API_BASE_URL=http://localhost:3000
```

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
- the API must allow the frontend origin in CORS
- login state is restored by calling `/auth/me` on app load

## API client notes

The API client lives in `src/api/client.ts`.

It:
- reads the base URL from `VITE_API_BASE_URL`
- includes cookies with each request
- parses JSON responses
- throws a simple error message when the API returns an error

## Current routes

- `/login`
- `/projects`
- `/projects/:id`

## Current UI flow

1. Log in
2. Load current user from the API
3. Browse paginated projects
4. Search and sort projects
5. Open a project detail page
6. Browse paginated reports for that project
7. Log out

## Deployment

This frontend is intended to be deployed separately from the API.

A simple deployment target is Vercel.

### Build settings

- Framework preset: `Vite`
- Build command: `pnpm build`
- Output directory: `dist`

### Required environment variable

```env
VITE_API_BASE_URL=https://site-score-api.onrender.com
```

## Current status

This project currently demonstrates:

- React with TypeScript
- route-based UI structure
- consuming a separate API
- cookie-based auth in the browser
- protected routes
- paginated list rendering
- search and sorting controls
- basic frontend state handling without heavy libraries

## Planned next steps

- Create project form
- Create report form
- Edit project flow
- Edit report flow
- UI polish for loading, empty, and error states
- Deploy the frontend to Vercel

## Why this project exists

This project exists to complement the Site Score API and show a realistic frontend consuming authenticated API data in a lightweight React application.
