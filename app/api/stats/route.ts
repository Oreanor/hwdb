import { NextResponse } from 'next/server';
import { loadCarsData } from '../../lib/carsData';
import { BRANDS } from '../../lib/brands';
import { STATIC_CACHE_HEADERS } from '../../lib/http';

export type BrandStats = Record<string, { castings: number; variants: number }>;

// Per-brand catalog sizes (castings + variants), for the welcome screen.
export async function GET() {
  const cars = await loadCarsData();
  const stats: BrandStats = {};
  for (const b of BRANDS) stats[b.key] = { castings: 0, variants: 0 };
  for (const c of cars) {
    const k = c.brand ?? 'hw';
    (stats[k] ??= { castings: 0, variants: 0 });
    stats[k].castings++;
    stats[k].variants += c.d?.length ?? 0;
  }
  return NextResponse.json(stats, { headers: STATIC_CACHE_HEADERS });
}
