import { CarData } from '../../types';
import { VARIANT_FIELDS, isModelSearchField } from '../../consts';
import { loadCarsData } from '../../lib/carsData';
import { carMatchesQuery, includesAll, tokenize } from '../../lib/carSearch';
import { castingMatchesTag } from '../../lib/tagsData';
import { isStandardScale } from '../../lib/seriesCategory';
import { variantHasYear } from '../../lib/years';
import { staticJson, withErrors } from '../../lib/http';

// A casting result for the grid: variants trimmed to what the card preview
// needs (year / image flag / id), plus the flags and tags the grid filters and
// sorts by. Scale comes from `Sr`, which the trim drops, so it's flagged here.
const asCasting = (car: CarData): CarData => ({
  ...car,
  d: car.d.map(({ y, p, id, brand }) => ({ y, p, id, brand })),
  s164: car.d.some(isStandardScale),
  sOth: car.d.some((v) => !isStandardScale(v)),
  tags: { mk: car.tags?.mk, yr: car.tags?.yr, ye: car.tags?.ye },
});

// Search over the whole catalog.
//   field=tag   -> castings matching a tag query (home page browse)
//   model field -> castings with only the matching variants, untrimmed (a table)
//   other field -> trimmed castings (a grid)
// `year` narrows to castings with at least one variant from that year.
export const GET = withErrors('search', async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const field = searchParams.get('field');
  const value = searchParams.get('value')?.trim();
  const year = searchParams.get('year');

  // No search term: nothing (the year-only listing is /api/year-cars).
  if (!field || !value) return staticJson([]);

  let cars = await loadCarsData();
  if (year) cars = cars.filter((car) => car.d.some((item) => variantHasYear(item.y, year)));

  if (field === 'tag') {
    return staticJson(cars.filter((car) => castingMatchesTag(car.tags, value)).map(asCasting));
  }

  const words = tokenize(value);
  const matching = cars.filter((car) => carMatchesQuery(car, field, words, value));

  const variantField = VARIANT_FIELDS[field];
  if (!isModelSearchField(field) || !variantField) return staticJson(matching.map(asCasting));

  // Model-field searches (series, wheels) keep the full variant fields and drop
  // the variants that don't match.
  const result: CarData[] = [];
  for (const car of matching) {
    const d = car.d.filter((item) => {
      const v = item[variantField];
      return typeof v === 'string' && includesAll(v, words);
    });
    if (d.length) result.push({ ...car, d });
  }
  return staticJson(result);
});
