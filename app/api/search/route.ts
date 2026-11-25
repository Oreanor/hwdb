import { CarData } from '../../types';
import { VARIANT_FIELDS, isModelSearchField } from '../../consts';
import { loadCarsData } from '../../lib/carsData';
import { carMatchesQuery, includesAll, tokenize } from '../../lib/carSearch';
import { castingMatchesTag } from '../../lib/tags';
import { isStandardScale, keepVariants } from '../../lib/seriesCategory';
import { variantHasYear } from '../../lib/years';
import { serverError, staticJson } from '../../lib/http';

// A casting as a search result: per variant only what the card needs, plus the
// flags/tags the castings view filters and sorts by (variant `Sr` is dropped,
// so the scale is flagged here).
const asCasting = (car: CarData): CarData => ({
  ...car,
  d: car.d.map(({ y, p, id, brand }) => ({ y, p, id, brand })),
  s164: car.d.some(isStandardScale),
  sOth: car.d.some((v) => !isStandardScale(v)),
  tags: { mk: car.tags?.mk, yr: car.tags?.yr, ye: car.tags?.ye },
});

// GET ?field=&value=[&year=]
//   field=tag             -> castings matching a tag query ("th:Supercar,mk:Nissan")
//   series / wheels       -> castings with only the matching variants (full fields)
//   name / designer / ... -> matching castings, trimmed by asCasting
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const field = params.get('field');
    const value = params.get('value')?.trim();
    const year = params.get('year');
    if (!field || !value) return staticJson([]);

    let cars = await loadCarsData();
    if (year) cars = cars.filter((car) => car.d.some((v) => variantHasYear(v.y, year)));

    if (field === 'tag') {
      return staticJson(cars.filter((car) => castingMatchesTag(car.tags, value)).map(asCasting));
    }

    const words = tokenize(value);
    const matches = cars.filter((car) => carMatchesQuery(car, field, words, value));
    const variantField = VARIANT_FIELDS[field];
    if (isModelSearchField(field) && variantField) {
      return staticJson(
        keepVariants(matches, (v) => {
          const s = v[variantField];
          return typeof s === 'string' && includesAll(s, words);
        })
      );
    }
    return staticJson(matches.map(asCasting));
  } catch (err) {
    return serverError('search', err);
  }
}
