import { NextResponse } from 'next/server';
import { loadCarsData } from '../../lib/carsData';

// Distinct series values with how many variants use each (most-used first).
// Not cached so it reflects the file after the cleanup tool rewrites it.
export async function GET() {
  const cars = await loadCarsData();
  const counts = new Map<string, number>();
  for (const c of cars) {
    for (const v of c.d ?? []) {
      const s = v.Sr?.trim();
      if (s) counts.set(s, (counts.get(s) ?? 0) + 1);
    }
  }
  const series = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return NextResponse.json(series);
}
