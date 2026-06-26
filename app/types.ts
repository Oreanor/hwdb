import 'next-auth';

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
};

export type CastingTags = {
  mk?: string; // make
  rg?: string; // region
  md?: string; // model ("Ford Mustang")
  th?: string[]; // themes (incl. decade eras like "1950s")
  yr?: number; // the real car's model year
};

export type CarData = {
  lnk: string;
  ds?: string;
  num?: string;
  dsc?: string;
  d: CarDataItem[];
  tags?: CastingTags; // browse tags, attached by /api/car
};

export type SortConfig = {
  field: string;
  direction: 'asc' | 'desc';
} | null;

// A models (variants) view: opened by clicking a series, selecting a year, or
// searching a model field (series / wheels). `title` overrides the default header.
export type TableView = {
  kind: 'series' | 'year' | 'field';
  value: string;
  cars: CarData[];
  title?: string;
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