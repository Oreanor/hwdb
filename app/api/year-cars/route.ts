import { loadCarsData, selectVariants } from '../../lib/carsData';
import { inBrandScope } from '../../lib/brands';
import { variantHasYear } from '../../lib/years';
import { badRequest, staticJson, withErrors } from '../../lib/http';

// Full cars whose variants were released in a given year — used for the
// "pick a year -> table of that year's variants" view. Scoped to the selected
// base when a brand is given. Uses variantHasYear so multi-year `y` values
// (common on Matchbox/Majorette, e.g. "2018-2020") still match.
export const GET = withErrors('year-cars', async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year')?.trim();
  const brand = searchParams.get('brand')?.trim();
  if (!year) return badRequest('year required');

  const cars = (await loadCarsData()).filter((c) => inBrandScope(c, brand));
  return staticJson(selectVariants(cars, (v) => variantHasYear(v.y, year)));
});
