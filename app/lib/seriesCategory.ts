import { CarDataItem } from '../types';

export type SeriesFilter = 'all' | 'mainline' | 'premium';

// Mainline membership is authoritative: the `m` flag is set from the
// "List of YYYY Hot Wheels" wiki pages (see scripts/build-mainline-flags.js).
// Everything else counts as premium / special.
export const isMainline = (v: CarDataItem): boolean => v.m === 1;

export function matchesVariantFilter(v: CarDataItem, filter: SeriesFilter): boolean {
  if (filter === 'all') return true;
  return filter === 'mainline' ? isMainline(v) : !isMainline(v);
}
