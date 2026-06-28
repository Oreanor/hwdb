import { CarDataItem } from '../types';

export type SeriesFilter = 'all' | 'mainline' | 'premium';
export type ScaleFilter = 'only164' | 'all';

// A non-1:64 scale is named in the series with a colon ("1:50 Scale", "McLaren
// 1:43 Dual Scale Pack"). The colon distinguishes a scale from a set position
// ("/ 1/10"). No scale named -> standard 1:64.
export const isStandardScale = (v: CarDataItem): boolean => !/1\s*:\s*(?!64\b)\d{2,3}\b/.test(v.Sr || '');

export function matchesScaleFilter(v: CarDataItem, filter: ScaleFilter): boolean {
  return filter === 'all' || isStandardScale(v);
}

// Mainline membership is authoritative: the `m` flag is set from the
// "List of YYYY Hot Wheels" wiki pages (see scripts/build-mainline-flags.js).
// Everything else counts as premium / special.
export const isMainline = (v: CarDataItem): boolean => v.m === 1;

export function matchesVariantFilter(v: CarDataItem, filter: SeriesFilter): boolean {
  if (filter === 'all') return true;
  return filter === 'mainline' ? isMainline(v) : !isMainline(v);
}
