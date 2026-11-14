import { CarData } from '../../types';
import { loadCarsData } from '../../lib/carsData';
import { inBrandScope } from '../../lib/brands';
import { AUTOCOMPLETE_FIELDS } from '../../consts';
import { formatCarName } from '../../utils';
import { badRequest, staticJson, withErrors } from '../../lib/http';

const cache = new Map<string, string[]>();

// Designer values are often collaborations ("Larry Wood and Bob Rosas",
// "Chris Watson, Shawn Moghadam and Manson Cheung", sometimes with a
// "(Collaboration)" / "(Retool)" note). Split them into individual names so the
// dropdown lists one designer per entry; searching a single name still matches
// the collabs (the search does a substring match on the raw designer field).
function splitDesigners(ds: string): string[] {
  return ds
    .replace(/\([^)]*\)/g, ',') // drop parenthetical notes, treat as a boundary
    .split(/\s*,\s*|\s+and\s+|\s*&(?:amp;)?\s*/i) // comma / "and" / "&" / "&amp;"
    .map((s) => s.trim());
}

// The raw values a field suggests, per casting.
const VALUES_OF: Record<string, (c: CarData) => Iterable<string | undefined>> = {
  // Name search matches the formatted casting name, so suggest exactly that.
  // Covers brands and sub-brands (e.g. "Acura") that aren't top-level makes.
  name: (c) => [formatCarName(c.lnk)],
  designer: (c) => (c.ds ? splitDesigners(c.ds) : []),
  wheels: (c) => c.d.map((v) => v.Wh),
  series: (c) => c.d.map((v) => v.Sr),
};

function collect(field: string, cars: CarData[]): string[] {
  const valuesOf = VALUES_OF[field];
  const set = new Set<string>();
  for (const c of cars) {
    for (const raw of valuesOf(c)) {
      const s = raw ? String(raw).trim() : '';
      // Drop empties and any value with a "?" (unknown / uncertain placeholders).
      if (s && !s.includes('?')) set.add(s);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

// Distinct values for an autocomplete field, scoped to the selected base so the
// dropdowns suggest values from that brand only (cached per field+brand).
export const GET = withErrors('options', async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const field = searchParams.get('field');
  const brand = searchParams.get('brand') || 'all';

  if (!field || !AUTOCOMPLETE_FIELDS.includes(field) || !VALUES_OF[field]) {
    return badRequest('unsupported field');
  }

  const key = `${field}:${brand}`;
  let options = cache.get(key);
  if (!options) {
    const cars = (await loadCarsData()).filter((c) => inBrandScope(c, brand));
    options = collect(field, cars);
    cache.set(key, options);
  }
  return staticJson(options);
});
