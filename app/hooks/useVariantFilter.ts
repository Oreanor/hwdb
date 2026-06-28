'use client';

import { useMemo, useState } from 'react';
import { CarData } from '../types';
import { SeriesFilter, ScaleFilter, matchesVariantFilter, matchesScaleFilter, isMainline, isStandardScale } from '../lib/seriesCategory';

export interface VariantFilterState {
  filter: SeriesFilter;
  setFilter: (filter: SeriesFilter) => void;
  scale: ScaleFilter;
  setScale: (scale: ScaleFilter) => void;
  filteredCars: CarData[];
  counts: { all: number; mainline: number; premium: number };
  scaleCounts: { only164: number; all: number };
  shownCount: number;
}

// Shared All / Mainline / Premium + scale (1:64-only / all scales) filtering for
// any variants view (collection, series, year, single casting). Keeps the
// filters, per-bucket counts and the filtered list in one place.
export function useVariantFilter(cars: CarData[]): VariantFilterState {
  const [filter, setFilter] = useState<SeriesFilter>('all');
  const [scale, setScale] = useState<ScaleFilter>('only164'); // default: standard 1:64 only

  // Scale is applied first; the mainline filter and its counts work within it.
  const scaleCars = useMemo(() => {
    if (scale === 'all') return cars;
    return cars
      .map((c) => ({ ...c, d: c.d.filter((v) => matchesScaleFilter(v, scale)) }))
      .filter((c) => c.d.length > 0);
  }, [cars, scale]);

  const filteredCars = useMemo(() => {
    if (filter === 'all') return scaleCars;
    return scaleCars
      .map((c) => ({ ...c, d: c.d.filter((v) => matchesVariantFilter(v, filter)) }))
      .filter((c) => c.d.length > 0);
  }, [scaleCars, filter]);

  const counts = useMemo(() => {
    let all = 0;
    let mainline = 0;
    for (const c of scaleCars) {
      for (const v of c.d) {
        all++;
        if (isMainline(v)) mainline++;
      }
    }
    return { all, mainline, premium: all - mainline };
  }, [scaleCars]);

  const scaleCounts = useMemo(() => {
    let all = 0;
    let only164 = 0;
    for (const c of cars) {
      for (const v of c.d) {
        all++;
        if (isStandardScale(v)) only164++;
      }
    }
    return { all, only164 };
  }, [cars]);

  const shownCount = filter === 'all' ? counts.all : filter === 'mainline' ? counts.mainline : counts.premium;

  return { filter, setFilter, scale, setScale, filteredCars, counts, scaleCounts, shownCount };
}
