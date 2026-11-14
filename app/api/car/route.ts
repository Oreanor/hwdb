import { NextResponse } from 'next/server';
import { loadCarsData } from '../../lib/carsData';
import { inBrandScope } from '../../lib/brands';
import { badRequest, withErrors } from '../../lib/http';

// Full castings by wiki slug. A slug can repeat across brands; when a brand is
// given, match it too. Browse tags are embedded on each record, so the cars are
// returned as-is.
export const POST = withErrors('car', async (request: Request) => {
  const { links, brand } = await request.json();
  if (!Array.isArray(links) || links.length === 0) {
    return badRequest('links must be a non-empty array');
  }

  const wanted = new Set(links);
  const cars = (await loadCarsData()).filter((car) => wanted.has(car.lnk) && inBrandScope(car, brand));
  if (cars.length === 0) {
    return NextResponse.json({ error: 'No cars found for the provided links' }, { status: 404 });
  }
  return NextResponse.json(cars);
});
