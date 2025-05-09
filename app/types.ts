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