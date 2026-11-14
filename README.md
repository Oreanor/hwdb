# HWDB — Hot Wheels Database

A web app for browsing and searching a large catalogue of Hot Wheels, Matchbox,
Majorette and Welly cars and their variants, with per-user collections. Data
comes from the brands' Fandom wikis (and Welly's own catalogue); car images are
served from the local `images/` folder in development and from Supabase Storage
/ Cloudinary in production.

Built with Next.js (App Router), React 19, TypeScript and Tailwind CSS.

## Features

- **Search** models by name, designer, description, series, color, base, wheels
  or country, optionally narrowed to a single production year.
- **Browse by year** — pick a year to see every model released that year.
- **Model view** — a sortable table of all variants with collapsible columns
  (column layout is remembered in `localStorage`) and a full-screen image viewer
  with keyboard navigation.
- **Collections** — signed-in users can save individual variants to a personal
  collection (Supabase in production, `localStorage` in local mode).
- **Google sign-in** via NextAuth.
- **Localized UI** in 8 languages (EN, RU, DE, ES, FR, PT, NL, UK).
- **Cyrillic keyboard fallback** — queries typed in a Russian layout are
  automatically remapped to Latin.

## Tech stack

| Concern      | Choice                                  |
| ------------ | --------------------------------------- |
| Framework    | Next.js 15 (App Router)                 |
| UI           | React 19, Tailwind CSS 4                |
| Auth         | NextAuth (Google provider, JWT session) |
| Storage / DB | Supabase (collections + HW images), Cloudinary (other brands) |

## Getting started

### Prerequisites

- Node.js 18.18+ (or 20+)
- Google OAuth credentials (only for the collection feature)
- A Supabase project and a Cloudinary account — for a **production** deploy
  only; local development runs entirely offline (see below)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local.example` to `.env.local`. For local development only the auth
block is needed:

```bash
# NextAuth
NEXTAUTH_SECRET=your-random-secret      # e.g. `openssl rand -base64 32`
NEXTAUTH_URL=http://localhost:3000      # the app's base URL

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

The cloud variables (`NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_CLOUDINARY_BASE`,
`CLOUDINARY_*`) are only read in production — see
[Local vs cloud backend](#local-vs-cloud-backend).

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Local vs cloud backend

`next dev` runs the app without any cloud service:

| | local (`NODE_ENV !== 'production'`) | cloud (production build) |
| --- | --- | --- |
| Images | `images/<brand>/{id}.webp` via the `/localimg` route | Supabase Storage (`hw`) + Cloudinary (`mb`/`mj`/`we`) |
| Collection | `localStorage` | Supabase `collections` table |

The switch is `LOCAL_BACKEND` in `app/consts.ts`. Override it with
`NEXT_PUBLIC_LOCAL_BACKEND=true|false` to run either mode on localhost, or
override just the image base with `NEXT_PUBLIC_IMG_BASE`. The `images/` catalogue
is git-ignored — populate it with `scripts/images/fetch-brand-images.js`.

### Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # run ESLint
```

## Data

The car catalogue lives in one file per brand — `data/hw.json`, `data/mb.json`,
`data/mj.json`, `data/we.json` (outside `public/`, so it is not served as a
static asset — only the API routes read it server-side). They are concatenated
and stamped with their `brand` once into memory by the API routes (see
`app/lib/carsData.ts`) and shaped as:

```ts
type CarData = {
  lnk: string;        // Fandom wiki slug, also the model's unique key
  ds?: string;        // designer
  num?: string;       // toy number
  dsc?: string;       // description
  d: CarDataItem[];   // variants
  brand?: 'hw' | 'mb' | 'mj' | 'we';  // stamped on load; absent = hw
};

type CarDataItem = {
  y: string;          // year
  N?, Sr?, c?, Tm?, Bs?, Wn?, In?, Wh?, Tn?, Cn?, Nt?: string;
  p?: string;         // image flag ('t' when an image exists)
  id?: string;        // unique variant id (used for images and collections)
};
```

Variant images are keyed by the (globally unique) variant `id`. On disk and in
Cloudinary they live at `<brand>/{id}.webp` with a 256px thumbnail at
`<brand>/preview/{id}.webp`; Hot Wheels keeps its legacy flat layout
(`webp2/{id}.webp`) in the Supabase Storage `images` bucket. `app/utils.ts`
(`getImageUrl` / `getPreviewUrl`) is the single place that builds these URLs.

### Maintenance scripts

Data + wiki-sync utilities live under `scripts/`, grouped by purpose, and are run
with `node` from the project root (e.g. `node scripts/images/audit-images.js`):

- `lib/parse-casting.js` — shared wiki-page → variant-schema parser (imported by
  the others; also runnable directly for a single slug).
- `tags/` — browse tags & model years: `build-tags.js` (make/region/theme/era +
  year, embeds the tags in each casting of `data/<brand>.json` and writes
  `data/tags-index.json`; a per-brand report goes to `scripts/output/`),
  `build-mainline-flags.js`, `propose-model-years.js`, `propose-model-years-v2.js`
  (Wikipedia + generation lookup), `check-casting-years.js`.
- `sync/` — catalogue sync: `find-missing-castings.js`, `build-new-castings.js`,
  `audit-recent-years.js`, `merge-into-db.js`, `reparse-new-fields.js`.
- `images/` — all work on `images/<brand>/` (see `imageDirs` in
  `scripts/lib/brands.js`): `fetch-brand-images.js`, `fetch-missing-images.js`,
  `make-thumbs.js`, `audit-images.js`, `set-image-flags.js`,
  `find-duplicate-images.js`, `upload-cloudinary.js`.
- `data/` — `dedup-malformed-lnk.js`, `crystallize-series.js`, `fix-descriptions.js`.

Committed inputs they read: `data/model-year-overrides.json` (authoritative
manual years) and `data/model-year-estimates.json` (approximate `≈` years).

## Project structure

```
app/
  api/                # Route handlers (search, car, variants, year/series, options, stats, tags, auth)
  components/         # React components (results views, tables, grids, modals, top panel)
  hooks/              # useAppNavigation (view state + URL sync), useCollection, filters, persistence
  i18n/              # Translations and the `t()` helper
  lib/               # Brand registry, cached data loader, search/year/tag logic, API helpers
  services/          # Client-side data access (cars, collections)
  consts.ts          # Field definitions, year list, language list
  types.ts           # Shared types
  utils.ts           # Image URLs, name formatting, keyboard remapping
  page.tsx           # Main page: wires useAppNavigation into TopPanel + MainContent
data/
  hw|mb|mj|we.json           # The catalogue, one file per brand (server-only)
  tags-index.json            # Tag browser index (categories → makes)
  model-year-overrides.json  # Authoritative manual model years
  model-year-estimates.json  # Approximate (≈) model years
scripts/             # Data maintenance + wiki-sync scripts (lib/tags/sync/images/data)
  output/            # Generated reports / snapshots (git-ignored)
```

## Deployment

The app deploys cleanly to [Vercel](https://vercel.com/). Add the same
environment variables in the project settings, and set `NEXTAUTH_URL` to the
deployed URL.
