import { CarDataItem } from '../types';

// A variant's `y` can be a single year ("1981") or a period spelled out by the
// source ("1978 / 1979 / 1980", "1991 - 1992 - 1993"). These extract every year
// it covers so every year feature (filters, ranges, the year matrix) sees all of them.

export const variantYears = (y?: string): string[] =>
  y ? (String(y).match(/(?:19|20)\d\d/g) ?? []) : [];

export const variantHasYear = (y: string | undefined, year: string): boolean =>
  variantYears(y).includes(year);

// Variants released in `year`, or all of them when no year is selected.
export const variantsInYear = (variants: CarDataItem[], year?: string): CarDataItem[] =>
  year ? variants.filter((v) => variantHasYear(v.y, year)) : variants;

// "1995" or "1995–2008" for a set of variants; '' when none has a year.
export function yearRange(variants: CarDataItem[]): string {
  let min = '';
  let max = '';
  for (const v of variants) {
    for (const y of variantYears(v.y)) {
      if (!min || y < min) min = y;
      if (!max || y > max) max = y;
    }
  }
  return min === max ? min : `${min}–${max}`;
}
