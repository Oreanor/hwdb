import { loadCarsData } from '../../lib/carsData';
import { keepVariants } from '../../lib/seriesCategory';
import { inBrandScope } from '../../lib/brands';
import { variantHasYear } from '../../lib/years';
import { jsonError, staticJson } from '../../lib/http';

// Every variant released in a year ("pick a year -> table of that year"), scoped
// to a brand when given. variantHasYear also matches multi-year `y` values
// (common on Matchbox/Majorette, e.g. "2018-2020").
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const year = params.get('year')?.trim();
  if (!year) return jsonError('year required', 400);
  const cars = inBrandScope(await loadCarsData(), params.get('brand'));
  return staticJson(keepVariants(cars, (v) => variantHasYear(v.y, year)));
}
