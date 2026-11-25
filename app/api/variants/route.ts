import { NextResponse } from 'next/server';
import { loadCarsData } from '../../lib/carsData';
import { keepVariants } from '../../lib/seriesCategory';
import { jsonError, serverError } from '../../lib/http';

// The castings holding the given variant ids, each with only those variants (a user's collection).
export async function POST(request: Request) {
  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids)) return jsonError('ids must be an array', 400);
    const wanted = new Set<string>(ids);
    return NextResponse.json(keepVariants(await loadCarsData(), (v) => !!v.id && wanted.has(v.id)));
  } catch (err) {
    return serverError('variants', err);
  }
}
