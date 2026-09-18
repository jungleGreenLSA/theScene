# The Scene

*Your car. Your page. Your people.*

A free car-community site. Every member's car gets its own page — specs, categorized mods, photos, build journal, guestbook — plus a feed, events, clubs, a marketplace, spotted sightings, and local discovery by radius.

**One membership, free.** There is no premium tier. Members sign up with Google or email through Supabase Auth and get every feature.

## Stack

- **Next.js 16** (App Router, React 19) — see `AGENTS.md`: this Next version has breaking changes; read `node_modules/next/dist/docs/` before writing framework code.
- **Supabase** — Postgres, Auth (Google OAuth + email), Storage, RLS. Schema lives in `supabase/migrations/`.
- **Tailwind v4** + a hand-rolled class layer in `src/app/globals.css`. Design notes in `DESIGN.md`.
- **Mapbox** — geocoding for radius filters and the heatmaps.

## Local setup

```bash
cp .env.example .env.local   # fill in Supabase + Mapbox values
npm install
npm run dev                   # http://localhost:3000
```

Supabase setup (project, Google OAuth, buckets, migrations) is walked through in `docs/supabase-setup.md`. Run the migrations in order; `024_one_membership.sql` removes the old tier/Stripe columns.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Deploy

Pushes to `main` trigger `.github/workflows/deploy.yml`, which SSHes to the VPS, pulls, builds, and restarts the PM2 process (`ecosystem.config.js`). Server notes: `docs/server-deploy.md`, `docs/serverSetup.md`, `docs/cloudflare-setup.md`.

## Layout of `src/`

```
app/            routes (feed, garage, explore, events, clubs, marketplace, …)
app/auth/       login, register, OAuth callback
components/     shared UI (Navbar, Footer, GoogleButton, OnboardingWizard, …)
lib/supabase/   browser + server clients
lib/            image compression, Mapbox helpers, radius filtering
middleware.ts   session refresh + auth guard for member routes
```
