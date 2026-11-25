import { NextResponse } from 'next/server';
import { loadCarsData } from '../../lib/carsData';
import { brandOf } from '../../lib/brands';
import { jsonError, serverError } from '../../lib/http';

// Full castings (all variants, embedded browse tags) by their wiki links.
// A lnk can repeat across brands; when a brand is given, it must match too.
export async function POST(request: Request) {
  try {
    const { links, brand } = await request.json();
    if (!Array.isArray(links) || links.length === 0) {
      return jsonError('links must be a non-empty array', 400);
    }
    const wanted = new Set<string>(links);
    const cars = (await loadCarsData()).filter((car) => wanted.has(car.lnk) && (!brand || brandOf(car) === brand));
    if (cars.length === 0) return jsonError('No cars found for the provided links', 404);
    return NextResponse.json(cars);
  } catch (err) {
    return serverError('car', err);
  }
}
