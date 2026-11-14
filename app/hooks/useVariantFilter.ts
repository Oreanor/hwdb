'use client';

import { useMemo } from 'react';
import { CarData, CarDataItem } from '../types';
import {
  SeriesFilter,
  ScaleFilter,
  isSeriesFilter,
  isScaleFilter,
  matchesVariantFilter,
  matchesScaleFilter,
  isMainline,
  isStandardScale,
} from '../lib/seriesCategory';
import { usePersistedState } from './usePersistedState';
import { FILTER_STORAGE_KEYS } from '../consts';

export interface VariantFilterState {
  filter: SeriesFilter;
  setFilter: (filter: SeriesFilter) => void;
  scale: ScaleFilter;
  setScale: (scale: ScaleFilter) => void;
  filteredCars: CarData[];
  counts: { all: number; mainline: number; premium: number };
  scaleCounts: { only164: number; other: number; all: number };
  shownCount: number;
}

// Each casting with only the variants passing `keep` (empty castings dropped).
const keepVariants = (cars: CarData[], keep: (v: CarDataItem) => boolean): CarData[] =>
  cars.map((c) => ({ ...c, d: c.d.filter(keep) })).filter((c) => c.d.length > 0);

// How many variants (across all castings) pass `test`, out of how many.
const countVariants = (cars: CarData[], test: (v: CarDataItem) => boolean) => {
  let all = 0;
  let hits = 0;
  for (const c of cars) {
    for (const v of c.d) {
      all++;
      if (test(v)) hits++;
    }
  }
  return { all, hits };
};

// Shared All / Mainline / Premium + scale (1:64-only / all scales) filtering for
// any variants view (collection, series, year, single casting). Keeps the
// filters, per-bucket counts and the filtered list in one place.
export function useVariantFilter(cars: CarData[]): VariantFilterState {
  const [filter, setFilter] = usePersistedState<SeriesFilter>(FILTER_STORAGE_KEYS.series, 'all', isSeriesFilter);
  // default: standard 1:64 only; shared with the castings grid scale filter.
  const [scale, setScale] = usePersistedState<ScaleFilter>(FILTER_STORAGE_KEYS.scale, 'only164', isScaleFilter);

  // Scale is applied first; the mainline filter and its counts work within it.
  const scaleCars = useMemo(
    () => (scale === 'all' ? cars : keepVariants(cars, (v) => matchesScaleFilter(v, scale))),
    [cars, scale]
  );

  const filteredCars = useMemo(
    () => (filter === 'all' ? scaleCars : keepVariants(scaleCars, (v) => matchesVariantFilter(v, filter))),
    [scaleCars, filter]
  );

  const counts = useMemo(() => {
    const { all, hits } = countVariants(scaleCars, isMainline);
    return { all, mainline: hits, premium: all - hits };
  }, [scaleCars]);

  const scaleCounts = useMemo(() => {
    const { all, hits } = countVariants(cars, isStandardScale);
    return { all, only164: hits, other: all - hits };
  }, [cars]);

  const shownCount = filter === 'all' ? counts.all : counts[filter];

  return { filter, setFilter, scale, setScale, filteredCars, counts, scaleCounts, shownCount };
}
