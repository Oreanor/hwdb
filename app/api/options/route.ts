import { CarData } from '../../types';
import { loadCarsData } from '../../lib/carsData';
import { inBrandScope } from '../../lib/brands';
import { AUTOCOMPLETE_FIELDS } from '../../consts';
import { formatCarName } from '../../utils';
import { jsonError, staticJson } from '../../lib/http';

// Designer values are often collaborations ("Larry Wood and Bob Rosas",
// "Chris Watson, Shawn Moghadam and Manson Cheung", sometimes with a
// "(Collaboration)" / "(Retool)" note). Split them into individual names so the
// list has one designer per entry; searching one name still matches the collabs.
const splitDesigners = (ds: string): string[] =>
  ds
    .replace(/\([^)]*\)/g, ',') // drop parenthetical notes, treat as a boundary
    .split(/\s*,\s*|\s+and\s+|\s*&(?:amp;)?\s*/i); // comma / "and" / "&" / "&amp;"

// The raw values of a field across the given castings.
const fieldValues: Record<string, (c: CarData) => (string | undefined)[]> = {
  // The name search matches the formatted casting name, so suggest exactly that.
  name: (c) => [formatCarName(c.lnk)],
  designer: (c) => (c.ds ? splitDesigners(c.ds) : []),
  wheels: (c) => c.d.map((v) => v.Wh),
  series: (c) => c.d.map((v) => v.Sr),
};

// Distinct values, sorted; drops empties and "?" placeholders for unknowns.
const collect = (cars: CarData[], values: (c: CarData) => (string | undefined)[]): string[] => {
  const set = new Set<string>();
  for (const c of cars) for (const v of values(c)) if (v?.trim()) set.add(v.trim());
  return [...set].filter((s) => !s.includes('?')).sort((a, b) => a.localeCompare(b));
};

const cache = new Map<string, string[]>();

// GET ?field=&brand= -> autocomplete values for a search field, scoped to a brand.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const field = params.get('field') ?? '';
  const brand = params.get('brand') || 'all';
  if (!AUTOCOMPLETE_FIELDS.includes(field)) return jsonError('unsupported field', 400);

  const key = `${field}:${brand}`;
  if (!cache.has(key)) cache.set(key, collect(inBrandScope(await loadCarsData(), brand), fieldValues[field]));
  return staticJson(cache.get(key));
}
