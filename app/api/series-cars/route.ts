import { loadCarsData } from '../../lib/carsData';
import { keepVariants } from '../../lib/seriesCategory';
import { jsonError, staticJson } from '../../lib/http';

// Every variant of an exact series ("click a series -> table of that series").
export async function GET(request: Request) {
  const series = new URL(request.url).searchParams.get('series')?.trim();
  if (!series) return jsonError('series required', 400);
  return staticJson(keepVariants(await loadCarsData(), (v) => v.Sr?.trim() === series));
}
