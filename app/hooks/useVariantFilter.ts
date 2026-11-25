'use client';

import { useMemo } from 'react';
import { CarData } from '../types';
import {
  SeriesFilter,
  ScaleFilter,
  matchesVariantFilter,
  matchesScaleFilter,
  isMainline,
  isStandardScale,
  keepVariants,
} from '../lib/seriesCategory';
import { usePersistedState } from './usePersistedState';
import { FILTER_STORAGE_KEYS } from '../consts';

const isSeriesFilter = (v: string): v is SeriesFilter => v === 'all' || v === 'mainline' || v === 'premium';
export const isScaleFilter = (v: string): v is ScaleFilter => v === 'only164' || v === 'other' || v === 'all';

export interface VariantFilterState {
  filter: SeriesFilter;
  setFilter: (filter: SeriesFilter) => void;
  scale: ScaleFilter;
  setScale: (scale: ScaleFilter) => void;
  filteredCars: CarData[];
  counts: Record<SeriesFilter, number>;
  scaleCounts: Record<ScaleFilter, number>;
}

// Counts variants overall and those passing `pred`.
const countVariants = (cars: CarData[], pred: (v: CarData['d'][number]) => boolean) => {
  let all = 0;
  let hit = 0;
  for (const c of cars) {
    for (const v of c.d) {
      all++;
      if (pred(v)) hit++;
    }
  }
  return { all, hit };
};

// Shared All / Mainline / Premium + scale (1:64-only / other / all) filtering for
// every variants view (collection, series, year, single casting): the filters,
// per-option counts and the filtered list in one place.
export function useVariantFilter(cars: CarData[]): VariantFilterState {
  const [filter, setFilter] = usePersistedState<SeriesFilter>(FILTER_STORAGE_KEYS.series, 'all', isSeriesFilter);
  // Default: standard 1:64 only; shared with the castings grid scale filter.
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
    const { all, hit } = countVariants(scaleCars, isMainline);
    return { all, mainline: hit, premium: all - hit };
  }, [scaleCars]);

  const scaleCounts = useMemo(() => {
    const { all, hit } = countVariants(cars, isStandardScale);
    return { all, only164: hit, other: all - hit };
  }, [cars]);

  return { filter, setFilter, scale, setScale, filteredCars, counts, scaleCounts };
}
