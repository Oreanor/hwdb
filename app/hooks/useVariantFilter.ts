'use client';

import { useMemo, useState } from 'react';
import { CarData } from '../types';
import { SeriesFilter, matchesVariantFilter, isMainline } from '../lib/seriesCategory';

export interface VariantFilterState {
  filter: SeriesFilter;
  setFilter: (filter: SeriesFilter) => void;
  filteredCars: CarData[];
  counts: { all: number; mainline: number; premium: number };
  shownCount: number;
}

// Shared All / Mainline / Premium filtering for any variants view
// (collection, series, year, single casting). Keeps the filter, the
// per-bucket counts and the filtered list in one place.
export function useVariantFilter(cars: CarData[]): VariantFilterState {
  const [filter, setFilter] = useState<SeriesFilter>('all');

  const filteredCars = useMemo(() => {
    if (filter === 'all') return cars;
    return cars
      .map((c) => ({ ...c, d: c.d.filter((v) => matchesVariantFilter(v, filter)) }))
      .filter((c) => c.d.length > 0);
  }, [cars, filter]);

  const counts = useMemo(() => {
    let all = 0;
    let mainline = 0;
    for (const c of cars) {
      for (const v of c.d) {
        all++;
        if (isMainline(v)) mainline++;
      }
    }
    return { all, mainline, premium: all - mainline };
  }, [cars]);

  const shownCount = filter === 'all' ? counts.all : filter === 'mainline' ? counts.mainline : counts.premium;

  return { filter, setFilter, filteredCars, counts, shownCount };
}
