import { loadCarsData, selectVariants } from '../../lib/carsData';
import { badRequest, staticJson, withErrors } from '../../lib/http';

// Full cars whose variants belong to a given (exact) series — used for the
// "click a series -> table of that series" view.
export const GET = withErrors('series-cars', async (request: Request) => {
  const series = new URL(request.url).searchParams.get('series')?.trim();
  if (!series) return badRequest('series required');

  return staticJson(selectVariants(await loadCarsData(), (v) => v.Sr?.trim() === series));
});
