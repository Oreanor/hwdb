import { NextResponse } from 'next/server';
import { CarData } from '../../types';
import { VARIANT_FIELDS, isModelSearchField } from '../../consts';
import { loadCarsData } from '../../lib/carsData';
import { carMatchesQuery, includesAll, tokenize } from '../../lib/carSearch';
import { castingMatchesTag } from '../../lib/tagsData';
import { isStandardScale } from '../../lib/seriesCategory';
import { STATIC_CACHE_HEADERS } from '../../lib/http';

// Casting results only need year/image flag/id per variant (for the card preview).
const trimVariants = (car: CarData): CarData => ({
  ...car,
  d: car.d.map(item => ({ y: item.y, p: item.p, id: item.id })),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const field = searchParams.get('field');
    const value = searchParams.get('value');
    const year = searchParams.get('year');

    const carsData = await loadCarsData();
    // Casting results carry make + model year (from the embedded tags) so the
    // grid can sort by them.
    const asCasting = (car: CarData): CarData => {
      // Scale (from `Sr`) is dropped by trimVariants, so flag here whether the
      // casting has any standard 1:64 variant — drives the grid's scale filter.
      return {
        ...trimVariants(car),
        s164: car.d.some(isStandardScale),
        sOth: car.d.some((v) => !isStandardScale(v)),
        tags: { mk: car.tags?.mk, yr: car.tags?.yr, ye: car.tags?.ye },
      };
    };

    let filteredData = carsData;

    // Narrow to cars that have at least one variant from the requested year.
    if (year) {
      filteredData = filteredData.filter(car => car.d.some(item => item.y === year));
    }

    // Tag browse (home page): castings matching every token of the tag query.
    if (field === 'tag' && value && value.trim() !== '') {
      const result = filteredData.filter((car) => castingMatchesTag(car.tags, value)).map(asCasting);
      return NextResponse.json(result, { headers: STATIC_CACHE_HEADERS });
    }

    if (field && value && value.trim() !== '') {
      const words = tokenize(value);
      // Model-field searches (series, wheels) return a table of the matching
      // variants, so keep the full variant fields and drop non-matching variants.
      // Casting-field searches (name, designer, ...) return whole castings, trimmed.
      const modelSearch = isModelSearchField(field);
      const variantField = VARIANT_FIELDS[field];
      filteredData = filteredData
        .filter(car => carMatchesQuery(car, field, words, value))
        .map(car => {
          if (!modelSearch || !variantField) return asCasting(car);
          const d = car.d.filter(item => {
            const v = item[variantField];
            return typeof v === 'string' && includesAll(v, words);
          });
          return { ...car, d };
        })
        .filter(car => car.d.length > 0);
    } else {
      // No search term: return nothing (the year-only listing is handled above).
      filteredData = [];
    }

    return NextResponse.json(filteredData, { headers: STATIC_CACHE_HEADERS });
  } catch (error) {
    console.error('Error processing search request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
