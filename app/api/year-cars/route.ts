import { NextResponse } from 'next/server';
import { CarData, CarDataItem } from '../../types';
import { loadCarsData } from '../../lib/carsData';
import { variantHasYear } from '../../lib/years';
import { STATIC_CACHE_HEADERS } from '../../lib/http';

// Full cars whose variants were released in a given year — used for the
// "pick a year -> table of that year's variants" view. Scoped to the selected
// base when a brand is given. Uses variantHasYear so multi-year `y` values
// (common on Matchbox/Majorette, e.g. "2018-2020") still match.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year')?.trim();
  const brand = searchParams.get('brand')?.trim();
  if (!year) return NextResponse.json({ error: 'year required' }, { status: 400 });

  const cars = await loadCarsData();
  const result: CarData[] = [];
  for (const c of cars) {
    if (brand && brand !== 'all' && (c.brand ?? 'hw') !== brand) continue;
    const d = (c.d ?? []).filter((v: CarDataItem) => variantHasYear(v.y, year));
    if (d.length) result.push({ ...c, d });
  }
  return NextResponse.json(result, { headers: STATIC_CACHE_HEADERS });
}
