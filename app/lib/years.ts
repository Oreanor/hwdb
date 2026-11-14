// A variant's `y` can be a single year ("1981") or a period spelled out by the
// source ("1978 / 1979 / 1980", "1991 - 1992 - 1993"). These extract every year
// it covers so year features (the year matrix, the year listing, the year
// filter) see all of them.

export const variantYears = (y?: string): string[] =>
  y ? (String(y).match(/(?:19|20)\d\d/g) ?? []) : [];

export const variantHasYear = (y: string | undefined, year: string): boolean =>
  variantYears(y).includes(year);

// The year filter used by every results view: no year selected = everything.
// Kept in one place so the client views agree with the /api/year-cars route
// (a "2018 - 2020" variant shows under 2019 everywhere).
export const matchesYear = (item: { y?: string }, year?: string): boolean =>
  !year || variantHasYear(item.y, year);

// Earliest and latest year a set of variants covers ('' when none).
export const yearSpan = (items: { y?: string }[]): { first: string; last: string } => {
  let first = '';
  let last = '';
  for (const it of items) {
    for (const y of variantYears(it.y)) {
      if (!first || y < first) first = y;
      if (!last || y > last) last = y;
    }
  }
  return { first, last };
};

// "1998" or "1998–2004" ('' when there are no years).
export const formatYearSpan = ({ first, last }: { first: string; last: string }): string =>
  !first ? '' : first === last ? first : `${first}–${last}`;
