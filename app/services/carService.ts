import { CarData } from '../types';
import { BrandTagsIndex } from '../lib/tags';

// Browse index for the home page (category -> makes with counts). `no-store`
// bypasses any stale browser-cached copy (the index is tiny).
export const fetchTagsIndex = async (): Promise<BrandTagsIndex | null> => {
  const response = await fetch('/api/tags', { cache: 'no-store' });
  if (!response.ok) return null;
  return response.json();
};

// Per-brand catalog sizes (castings + variants) for the welcome screen.
export const fetchStats = async (): Promise<Record<string, { castings: number; variants: number }> | null> => {
  const response = await fetch('/api/stats', { cache: 'no-store' });
  if (!response.ok) return null;
  return response.json();
};

export const fetchCars = async (field?: string, value?: string, year?: string): Promise<CarData[]> => {
  const params = new URLSearchParams();
  if (field && value) {
    params.append('field', field);
    params.append('value', value);
  }
  if (year) {
    params.append('year', year);
  }

  const response = await fetch(`/api/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

export const fetchCarsByLinks = async (links: string[], brand?: string): Promise<CarData[]> => {
  const response = await fetch('/api/car', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ links, brand }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch car data');
  }
  return response.json();
};

export const fetchCarByLnk = async (lnk: string, brand?: string): Promise<CarData> => {
  const cars = await fetchCarsByLinks([lnk], brand);
  return cars[0];
};

// Full cars (with variants) belonging to an exact series.
export const fetchSeriesCars = async (series: string): Promise<CarData[]> => {
  const response = await fetch(`/api/series-cars?series=${encodeURIComponent(series)}`);
  if (!response.ok) return [];
  return response.json();
};

// Full cars (with variants) released in a given year.
export const fetchYearCars = async (year: string): Promise<CarData[]> => {
  const response = await fetch(`/api/year-cars?year=${encodeURIComponent(year)}`);
  if (!response.ok) return [];
  return response.json();
};

// Distinct values for an autocomplete field (name / designer / wheels / series),
// scoped to the selected base.
export const fetchFieldOptions = async (field: string, brand?: string): Promise<string[]> => {
  const params = new URLSearchParams({ field });
  if (brand && brand !== 'all') params.append('brand', brand);
  const response = await fetch(`/api/options?${params.toString()}`);
  if (!response.ok) return [];
  return response.json();
};

// Fetch variants by their ids (used to render a user's collection).
export const fetchVariantsByIds = async (ids: string[]): Promise<CarData[]> => {
  const response = await fetch('/api/variants', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch variants by ids');
  }
  return response.json();
};