import { NextResponse } from 'next/server';
import { CarData, CarDataItem } from '../../types';
import { loadCarsData } from '../../lib/carsData';
import { STATIC_CACHE_HEADERS } from '../../lib/http';

// Full cars whose variants were released in a given year — used for the
// "pick a year -> table of that year's variants" view.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year')?.trim();
  if (!year) return NextResponse.json({ error: 'year required' }, { status: 400 });

  const cars = await loadCarsData();
  const result: CarData[] = [];
  for (const c of cars) {
    const d = (c.d ?? []).filter((v: CarDataItem) => v.y === year);
    if (d.length) result.push({ ...c, d });
  }
  return NextResponse.json(result, { headers: STATIC_CACHE_HEADERS });
}
