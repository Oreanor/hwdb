import { CarDataItem } from '../types';
import { LARGE_SCALE_SERIES } from '../consts';

export type SeriesFilter = 'all' | 'mainline' | 'premium';
export type ScaleFilter = 'only164' | 'other' | 'all';

// A larger scale is named in the series with a colon ("1:50 Scale", "McLaren
// 1:43 Dual Scale Pack"). The colon distinguishes a scale from a set position
// ("/ 1/10"). 1:64 and 1:60 (Welly's small line) count as the standard small
// diecast; a few lines are larger without naming it (LARGE_SCALE_SERIES, e.g.
// Hot Wheels XL = 1:43).
export const isStandardScale = (v: CarDataItem): boolean => {
  const sr = (v.Sr || '').trim();
  if (LARGE_SCALE_SERIES.has(sr)) return false;
  return !/1\s*:\s*(?!6[04]\b)\d{2,3}\b/.test(sr);
};

export function matchesScaleFilter(v: CarDataItem, filter: ScaleFilter): boolean {
  if (filter === 'all') return true;
  return filter === 'only164' ? isStandardScale(v) : !isStandardScale(v);
}

// Mainline membership is authoritative: the `m` flag is set from the
// "List of YYYY Hot Wheels" wiki pages (see scripts/build-mainline-flags.js).
// Everything else counts as premium / special.
export const isMainline = (v: CarDataItem): boolean => v.m === 1;

export function matchesVariantFilter(v: CarDataItem, filter: SeriesFilter): boolean {
  if (filter === 'all') return true;
  return filter === 'mainline' ? isMainline(v) : !isMainline(v);
}
