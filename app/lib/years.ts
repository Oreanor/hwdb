// A variant's `y` can be a single year ("1981") or a period spelled out by the
// source ("1978 / 1979 / 1980", "1991 - 1992 - 1993"). These extract every year
// it covers so year features (the year matrix, the year listing) see all of them.

export const variantYears = (y?: string): string[] =>
  y ? (String(y).match(/(?:19|20)\d\d/g) ?? []) : [];

export const variantHasYear = (y: string | undefined, year: string): boolean =>
  variantYears(y).includes(year);
