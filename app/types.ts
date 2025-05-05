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
};

export type CarData = {
  lnk: string;
  ds?: string;
  num?: string;
  dsc?: string;
  d: CarDataItem[];
};

export type SortConfig = {
  field: string;
  direction: 'asc' | 'desc';
} | null;