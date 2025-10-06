# cometbft-analyzer-frontend

Web UI for the CometBFT Analyzer. It visualizes CometBFT consensus activity, latencies, and network behavior using data served by the backend API.

Part of the CometBFT Analyzer suite:

- cometbft-log-etl: Parses CometBFT logs and writes per-simulation DBs
- cometbft-analyzer-backend: HTTP API + orchestration layer consumed by this UI
- cometbft-analyzer-frontend: This project (Next.js web UI)
- cometbft-analyzer-types: Shared Go types/statistics used by ETL/backend

Note: This project is under active development. APIs and schemas may evolve.

## Quickstart

- Requirements:
  - Node.js 18.18+ (or 20+ recommended) and npm
  - Running backend API (default at `http://localhost:8080/v1`)

1) Copy env template and configure the API base URL:

```bash
cp .env.example .env.local
```

Edit `.env.local` as needed:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/v1
NEXT_PUBLIC_DEFAULT_USER_ID=your-user-id-here
```

2) Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:3000 to view the UI.

## Configuration

- `NEXT_PUBLIC_API_BASE_URL`: Base URL of the backend API (e.g., `http://localhost:8080/v1`).
- `NEXT_PUBLIC_DEFAULT_USER_ID`: Optional default user context for demo/testing.
- `.env.local`: Local overrides for your environment (gitignored).

Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser—avoid placing secrets there.

## Development

- Scripts:
  - `npm run dev`: Run Next.js in development mode.
  - `npm run build`: Build production assets.
  - `npm run start`: Start the production build locally.
  - `npm run lint`: Lint the project.

- Code layout:
  - `src/` application code and UI components
  - `public/` static assets

Ensure the backend is reachable at `NEXT_PUBLIC_API_BASE_URL`; most features require it.

## Backend Reference

This frontend consumes the cometbft-analyzer-backend API. For convenience, here is the backend’s overview and quickstart reference:

Backend service for the CometBFT Analyzer. It manages users, projects, and simulations, accepts CometBFT log uploads, invokes the ETL pipeline to normalize logs into MongoDB, and serves metrics and events to the frontend.

Part of the CometBFT Analyzer suite:

- cometbft-log-etl: Parses CometBFT logs and writes per-simulation DBs
- cometbft-analyzer-backend: This service (HTTP API + orchestration)
- cometbft-analyzer-frontend: Web UI that consumes this API
- cometbft-analyzer-types: Shared Go types and statistics used by ETL/backend

Note: This project is under active development. APIs and schemas may evolve.

### Backend Quickstart (summary)

- Requirements:
  - Go 1.21+
  - MongoDB (local or remote)
  - cometbft-log-etl binary on PATH as `cometbft-log-parser`

1) Run MongoDB (defaults to `mongodb://localhost:27017`).

2) Build/install ETL:

```bash
git clone https://github.com/bft-labs/cometbft-log-etl
cd cometbft-log-etl
go build -o cometbft-log-parser .
mv cometbft-log-parser /usr/local/bin/
```

3) Start backend:

```bash
go run .
# or
PORT=8080 MONGODB_URI=mongodb://localhost:27017 go run .
```

The backend listens on `:8080` and exposes routes under `/v1`.

### API Overview (per backend)

- Base URL: `/v1`
- Content types: `application/json` or `multipart/form-data` for uploads
- Time window params: `from`/`to` as RFC3339; default last 1 minute

Key routes (subset):
- Users: `POST /users`, `GET /users`, `GET /users/:userId`, `DELETE /users/:userId`
- Projects: `POST /users/:userId/projects`, `GET /users/:userId/projects`, `GET/PUT/DELETE /projects/:projectId`
- Simulations: create/list/get/update/delete, upload logs, trigger processing
- Metrics/Events (per simulation): events listing and latency/network metrics endpoints

For the full backend documentation and additional endpoints, see the backend repository.

## Example Workflow (end-to-end)

1) Start the backend and ensure `NEXT_PUBLIC_API_BASE_URL` points to it.
2) In the UI, create a user and project, then a simulation.
3) Upload logs via the UI or directly to the backend.
4) Trigger processing and explore metrics, timelines, and charts in the frontend.

## Contributing

- Keep PRs scoped and align UI data contracts with the backend’s documented APIs.
- When backend metrics or schemas evolve, update the UI queries and this README as needed.
- Performance, usability, and observability improvements are welcome.

## License

Licensed under the Apache License, Version 2.0. See the `LICENSE` file for details.
