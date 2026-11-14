import { BrandStats, CarData } from '../types';
import { BrandTagsIndex } from '../lib/tags';

// GET/POST JSON from our API. `fallback` turns a non-OK response into a value
// instead of an error (for optional data like the browse index).
async function api<T>(url: string, init?: RequestInit & { fallback?: T }): Promise<T> {
  const { fallback, ...req } = init ?? {};
  const response = await fetch(url, req);
  if (!response.ok) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Request failed (${response.status}): ${url.split('?')[0]}`);
  }
  return response.json();
}

const post = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

// Query string without empty values and without the 'all' brand scope.
const query = (params: Record<string, string | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && !(k === 'brand' && v === 'all')) p.append(k, v);
  }
  return p.toString();
};

// Browse index for the home page (category -> makes with counts). `no-store`
// bypasses any stale browser-cached copy (the index is tiny).
export const fetchTagsIndex = () => api<BrandTagsIndex | null>('/api/tags', { cache: 'no-store', fallback: null });

// Per-brand catalog sizes (castings + variants) for the welcome screen.
export const fetchStats = () => api<BrandStats | null>('/api/stats', { cache: 'no-store', fallback: null });

// Catalog search (see /api/search for the result shapes).
export const fetchCars = (field: string, value: string, year?: string) =>
  api<CarData[]>(`/api/search?${query({ field, value, year })}`);

// A full casting by its slug (brand disambiguates slugs shared across brands).
export const fetchCarByLnk = async (lnk: string, brand?: string): Promise<CarData | undefined> =>
  (await api<CarData[]>('/api/car', post({ links: [lnk], brand })))[0];

// Full cars (with variants) belonging to an exact series.
export const fetchSeriesCars = (series: string) => api<CarData[]>(`/api/series-cars?${query({ series })}`);

// Full cars (with variants) released in a given year, scoped to the selected base.
export const fetchYearCars = (year: string, brand?: string) =>
  api<CarData[]>(`/api/year-cars?${query({ year, brand })}`);

// Distinct values for an autocomplete field (name / designer / wheels / series),
// scoped to the selected base.
export const fetchFieldOptions = (field: string, brand?: string) =>
  api<string[]>(`/api/options?${query({ field, brand })}`, { fallback: [] });

// Variants by their ids, grouped under their castings (renders a collection).
export const fetchVariantsByIds = async (ids: string[]): Promise<CarData[]> =>
  ids.length ? api<CarData[]>('/api/variants', post({ ids })) : [];
