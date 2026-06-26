# HWDB — Hot Wheels Database

A web app for browsing and searching a large catalogue of Hot Wheels cars and
their variants, with per-user collections. Data comes from the
[Hot Wheels Fandom wiki](https://hotwheels.fandom.com/); car images are served
from Supabase Storage.

Built with Next.js (App Router), React 19, TypeScript and Tailwind CSS.

## Features

- **Search** models by name, designer, description, series, color, base, wheels
  or country, optionally narrowed to a single production year.
- **Browse by year** — pick a year to see every model released that year.
- **Model view** — a sortable table of all variants with collapsible columns
  (column layout is remembered in `localStorage`) and a full-screen image viewer
  with keyboard navigation.
- **Collections** — signed-in users can save individual variants to a personal
  collection (stored in Supabase).
- **Google sign-in** via NextAuth.
- **Localized UI** in 8 languages (EN, RU, DE, ES, FR, PT, NL, UK).
- **Cyrillic keyboard fallback** — queries typed in a Russian layout are
  automatically remapped to Latin.

## Tech stack

| Concern        | Choice                                  |
| -------------- | --------------------------------------- |
| Framework      | Next.js 15 (App Router)                 |
| UI             | React 19, Tailwind CSS 4                |
| Auth           | NextAuth (Google provider, JWT session) |
| Storage / DB   | Supabase (collections + image hosting)  |
| Virtualization | react-window / react-virtualized-auto-sizer |

## Getting started

### Prerequisites

- Node.js 18.18+ (or 20+)
- A Supabase project
- Google OAuth credentials

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# NextAuth
NEXTAUTH_SECRET=your-random-secret      # e.g. `openssl rand -base64 32`
NEXTAUTH_URL=http://localhost:3000      # the app's base URL

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm run start   # serve the production build
npm run lint    # run ESLint
```

## Data

The car catalogue lives in `public/carsdata.json`. It is a static dataset loaded
once into memory by the API routes (see `app/lib/carsData.ts`) and shaped as:

```ts
type CarData = {
  lnk: string;        // Fandom wiki slug, also the model's unique key
  ds?: string;        // designer
  num?: string;       // toy number
  dsc?: string;       // description
  d: CarDataItem[];   // variants
};

type CarDataItem = {
  y: string;          // year
  N?, Sr?, c?, Tm?, Bs?, Wn?, In?, Wh?, Tn?, Cn?, Nt?: string;
  p?: string;         // image flag ('t' when an image exists)
  id?: string;        // unique variant id (used for images and collections)
};
```

Variant images are read from the Supabase Storage `images` bucket at
`webp2/<id>.webp`.

### Maintenance scripts

One-off data utilities live in `scripts/` and are run with `node` from the
project root (e.g. `node scripts/find-duplicate-images.js`):

- `find-duplicate-images.js` — report models with duplicate variant images.
- `remove-image-fields.js` — strip the `p` field from every variant.
- `replace-image-fields.js` — normalize non-empty `p` values to `'t'`.
- `add-variant-ids.js` — assign sequential zero-padded ids to variants.

## Project structure

```
app/
  api/                # Route handlers (search, car, variants, auth)
  components/         # React components (grid, table, modals, top panel, icons)
  i18n/              # Translations and the `t()` helper
  lib/               # Supabase client + cached carsdata loader
  services/          # Client-side data access (cars, collections)
  consts.ts          # Field definitions, year list, language list
  types.ts           # Shared types
  utils.ts           # Image URLs, name formatting, keyboard remapping
  page.tsx           # Main page (search/grid/model/collection state machine)
public/
  carsdata.json      # The catalogue
scripts/             # One-off data maintenance scripts
```

## Deployment

The app deploys cleanly to [Vercel](https://vercel.com/). Add the same
environment variables in the project settings, and set `NEXTAUTH_URL` to the
deployed URL.
