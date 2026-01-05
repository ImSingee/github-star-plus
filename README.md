# GitHub Star Plus

A personal “GitHub starred repos indexer”: it ingests your starred repositories, pulls their README content, and stores everything in Postgres so you can later fuzzy-search and quickly rediscover what you starred.

## Repository Layout

This repo is a Turborepo-managed monorepo:

```
.
├── apps/
│   ├── web/                  # TanStack Start web app (Vite dev server on :3000)
│   ├── worker/               # Restate worker (default :9080, override with PORT)
├── packages/
│   ├── db/                   # Drizzle schema + db client + migration runner
│   ├── github/               # Octokit helper (getOctokit, hasNextPage)
├── migrations -> packages/db/migrations
├── docker/
│   ├── Dockerfile.web
│   └── Dockerfile.worker
├── .env.example
├── AGENTS.md
└── README.md
```

## Prerequisites

- Node.js >= 22
- pnpm 10+
- Postgres (or a hosted Postgres), via `DATABASE_URL`

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Required server-side variables:

- `DATABASE_URL`: Postgres connection string for runtime + migrations
- `PERSONAL_GITHUB_TOKEN`: GitHub token used by Octokit in the worker

## Development

Install dependencies:

```bash
pnpm install
```

Start the web app:

```bash
pnpm dev:web
```

Start the worker (runs DB migrations on startup):

```bash
pnpm dev:worker
```

Override the worker port:

```bash
PORT=9090 pnpm dev:worker
```

## Database Migrations

Migrations are generated into `packages/db/migrations`.

There are symlinks for convenience:

- `migrations/` -> `packages/db/migrations`
- `apps/web/migrations/` -> `packages/db/migrations`
- `apps/worker/migrations/` -> `packages/db/migrations`

Commands (run from repo root):

```bash
pnpm migrations:generate
pnpm migrations:apply
pnpm drizzle:studio
pnpm db:seed
```

## Scripts

Root scripts are split by app when relevant:

- `pnpm dev:web` / `pnpm dev:worker`
- `pnpm build:web` / `pnpm build:worker` (and `pnpm build` for everything)
- `pnpm preview:web` / `pnpm preview:worker`
- `pnpm lint:web` / `pnpm lint:worker` (and `pnpm lint` for everything)
- `pnpm check:types:web` / `pnpm check:types:worker` (and `pnpm check:types` for everything)

## Docker

Build images locally:

```bash
docker build -f docker/Dockerfile.web -t github-star-plus-web .
docker build -f docker/Dockerfile.worker -t github-star-plus-worker .
```

Run the web image (needs `DATABASE_URL`):

```bash
docker run --rm -p 3000:3000 -e DATABASE_URL=... github-star-plus-web
```

Run the worker image (needs `DATABASE_URL` + `PERSONAL_GITHUB_TOKEN`):

```bash
docker run --rm -p 9080:9080 -e DATABASE_URL=... -e PERSONAL_GITHUB_TOKEN=... github-star-plus-worker
```
