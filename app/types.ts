import 'next-auth';

// Catalog brands: Hot Wheels, Matchbox, Majorette, Welly (see lib/brands.ts).
export type Brand = 'hw' | 'mb' | 'mj' | 'we';

export type CarDataItem = {
  y: string;
  N?: string;
  Sr?: string;
  c?: string;
  Tm?: string;
  Bs?: string;
  Wn?: string;
  In?: string;
  Wh?: string;
  Tn?: string;
  Cn?: string;
  Nt?: string;
  p?: string;
  id?: string;
  m?: number; // 1 = mainline (toy# is in a "List of YYYY Hot Wheels" page)
  brand?: Brand; // stamped on load; picks the image subfolder
};

export type CastingTags = {
  mk?: string; // make
  rg?: string; // region
  md?: string; // model ("Ford Mustang")
  th?: string[]; // themes (incl. decade eras like "1950s")
  yr?: number; // the real car's model year
  ye?: number; // 1 = yr is an estimate, show as ≈
};

export type CarData = {
  lnk: string;
  ds?: string;
  num?: string;
  dsc?: string;
  d: CarDataItem[];
  brand?: Brand; // stamped on load by lib/carsData; absent = hw
  tags?: CastingTags; // browse tags, attached by /api/car
  s164?: boolean; // casting has >=1 standard 1:64 variant (set on casting search results)
  sOth?: boolean; // casting has >=1 non-1:64 (other-scale) variant
};

// Per-brand catalog sizes, served by /api/stats for the welcome screen.
export type BrandStats = Record<string, { castings: number; variants: number }>;

export type SortConfig = {
  field: string;
  direction: 'asc' | 'desc';
} | null;

// A results-view heading kept as raw parts (not a pre-translated string) so it
// re-localizes on language change. `{ field, query }` -> "Series: 5SP"; `text` is an
// already-final label (e.g. a tag like "Supercar · Nissan").
export type ResultTitle = { field: string; query: string } | { text: string };

// A models (variants) view: opened by clicking a series, selecting a year, or
// searching a model field (series / wheels). `title` overrides the default header.
export type TableView = {
  kind: 'series' | 'year' | 'field';
  value: string;
  cars: CarData[];
  title?: ResultTitle;
};

declare module 'next-auth' {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
} 