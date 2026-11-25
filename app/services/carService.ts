import { BrandStats, CarData } from '../types';
import { BrandTagsIndex } from '../lib/tags';

// GET/POST JSON from our own API; any non-2xx answer becomes an Error carrying
// the route's { error } message, so callers handle every failure the same way.
async function apiJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(
    url,
    body === undefined
      ? undefined
      : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  );
  if (!response.ok) {
    const { error } = await response.json().catch(() => ({ error: undefined }));
    throw new Error(error || `${url} failed (${response.status})`);
  }
  return response.json();
}

// Query string with the empty / "all" values left out.
const query = (params: Record<string, string | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v && v !== 'all') p.set(k, v);
  return p.toString();
};

// Castings matching a search field (or a tag query when field is 'tag').
export const fetchCars = (field: string, value: string, year?: string) =>
  apiJson<CarData[]>(`/api/search?${query({ field, value, year })}`);

// One casting with all its variants. A lnk can repeat across brands, so pass the brand.
export const fetchCarByLnk = async (lnk: string, brand?: string): Promise<CarData> =>
  (await apiJson<CarData[]>('/api/car', { links: [lnk], brand }))[0];

// Every variant of an exact series.
export const fetchSeriesCars = (series: string) => apiJson<CarData[]>(`/api/series-cars?${query({ series })}`);

// Every variant released in a year, scoped to the selected base.
export const fetchYearCars = (year: string, brand?: string) =>
  apiJson<CarData[]>(`/api/year-cars?${query({ year, brand })}`);

// Variants by id (a user's collection).
export const fetchVariantsByIds = (ids: string[]) =>
  ids.length ? apiJson<CarData[]>('/api/variants', { ids }) : Promise.resolve([]);

// Distinct values for an autocomplete field, scoped to the selected base.
export const fetchFieldOptions = (field: string, brand?: string) =>
  apiJson<string[]>(`/api/options?${query({ field, brand })}`);

// Welcome screen: browse index (category -> makes) and per-brand catalog sizes.
export const fetchTagsIndex = () => apiJson<BrandTagsIndex>('/api/tags');
export const fetchStats = () => apiJson<BrandStats>('/api/stats');
