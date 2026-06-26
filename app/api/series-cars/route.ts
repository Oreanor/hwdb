import { NextResponse } from 'next/server';
import { CarData, CarDataItem } from '../../types';
import { loadCarsData } from '../../lib/carsData';
import { STATIC_CACHE_HEADERS } from '../../lib/http';

// Full cars whose variants belong to a given (exact) series — used for the
// "click a series -> table of that series" view.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const series = searchParams.get('series')?.trim();
  if (!series) return NextResponse.json({ error: 'series required' }, { status: 400 });

  const cars = await loadCarsData();
  const result: CarData[] = [];
  for (const c of cars) {
    const d = (c.d ?? []).filter((v: CarDataItem) => v.Sr?.trim() === series);
    if (d.length) result.push({ ...c, d });
  }
  return NextResponse.json(result, { headers: STATIC_CACHE_HEADERS });
}
