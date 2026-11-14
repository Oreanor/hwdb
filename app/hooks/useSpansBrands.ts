'use client';

import { useMemo } from 'react';
import { brandOf } from '../lib/brands';
import { Brand } from '../types';

// True when a result set mixes brands. Every view then marks each row/card with
// its brand (BrandBadge) — otherwise a mixed set gives no way to tell them
// apart. The lists are also grouped by brand (see byBrand), so the markers come
// in blocks.
export function useSpansBrands(items: { brand?: Brand }[]): boolean {
  return useMemo(() => new Set(items.map(brandOf)).size > 1, [items]);
}
