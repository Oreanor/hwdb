import { NextResponse } from 'next/server';
import { loadCarsData, selectVariants } from '../../lib/carsData';
import { badRequest, withErrors } from '../../lib/http';

// Castings trimmed to the variants whose id is in the requested set (renders a
// user's collection).
export const POST = withErrors('variants', async (request: Request) => {
  const { ids } = await request.json();
  if (!Array.isArray(ids)) return badRequest('ids must be an array');

  const wanted = new Set(ids);
  return NextResponse.json(selectVariants(await loadCarsData(), (v) => !!v.id && wanted.has(v.id)));
});
