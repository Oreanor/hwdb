import { CarData, CarDataItem } from './types';
import type { Language } from './i18n';

// Variant columns of the models table, in display order. Labels: i18n table.col.*.
export const VARIANT_COLUMNS = ['y', 'N', 'Sr', 'c', 'Tm', 'Bs', 'Wn', 'In', 'Wh', 'Tn', 'Cn', 'Nt'] as const;
export type VariantColumn = (typeof VARIANT_COLUMNS)[number];

// Every year the catalog can have, oldest first (Hot Wheels started in 1968).
const FIRST_YEAR = 1968;
const CURRENT_YEAR = new Date().getFullYear();
export const ALL_YEARS: string[] = Array.from({ length: CURRENT_YEAR - FIRST_YEAR + 1 }, (_, i) => String(FIRST_YEAR + i));

// Search field keys; their display labels come from i18n (search.fields.*).
export const SEARCH_FIELDS = ['name', 'designer', 'description', 'series', 'wheels'] as const;

// How a search field's results are shaped:
//  - model fields describe a single variant -> results are individual models;
//  - everything else describes the whole casting -> results are castings.
const MODEL_SEARCH_FIELDS = ['series', 'wheels'];
export const isModelSearchField = (field: string): boolean => MODEL_SEARCH_FIELDS.includes(field);

// Search fields that get a type-to-filter autocomplete list.
export const AUTOCOMPLETE_FIELDS = ['name', 'designer', 'wheels', 'series'];

// Maps a search field to the matching top-level car property.
export const MAIN_OBJECT_FIELDS: Record<string, keyof CarData> = {
  name: 'lnk',
  designer: 'ds',
  description: 'dsc',
};

// Maps a search field to the matching per-variant property.
export const VARIANT_FIELDS: Record<string, keyof CarDataItem> = {
  series: 'Sr',
  color: 'c',
  wheels: 'Wh',
  country: 'Cn',
  base: 'Bs',
  year: 'y',
};

// localStorage keys.
export const THEME_STORAGE_KEY = 'hwdb_theme';
export const LANGUAGE_STORAGE_KEY = 'hwdb_language';
export const COLLAPSED_COLUMNS_KEY = 'hwdb_collapsed_columns';

// Remembered table/gallery choice per kind of results page.
export const VIEW_MODE_KEYS = {
  models: 'hwdb_view_models', // collection / year / series / variant search
  castings: 'hwdb_view_castings', // name / designer / description search
  castingPage: 'hwdb_view_casting_page', // a single casting's variants
} as const;

// Remembered filter / sort choices. Scale is shared across the variants view and
// the castings grid, so a 1:64 preference set in one applies to the other.
export const FILTER_STORAGE_KEYS = {
  scale: 'hwdb_filter_scale', // ScaleFilter: only164 / other / all
  series: 'hwdb_filter_series', // SeriesFilter: all / mainline / premium
  castingSort: 'hwdb_sort_castings', // "make:asc" | "make:desc" | "model:asc" | "model:desc"
  brand: 'hwdb_brand', // BrandScope: all / one of BRANDS
} as const;

// Series that are a larger scale than 1:64 but don't name the scale in `Sr`,
// so the "1:NN" detector can't catch them. Hot Wheels XL is 1:43.
export const LARGE_SCALE_SERIES = new Set<string>(['Hot Wheels XL']);

// Matchbox lines that are a larger scale than 1:64 (their series names never
// carry the scale): Models of Yesteryear (~1:40), the "Kings" lines and King
// Size (large), Matchbox Dinky (~1:43).
export const LARGE_SCALE_PATTERNS: RegExp[] = [
  /models of yesteryear/i,
  /\b(super|battle|sea)\s*kings\b/i,
  /\bking[\s-]*size\b/i,
  /\bdinky\b/i,
];

// Autocomplete suggestions rendered per chunk (the list grows as it scrolls).
export const MAX_SUGGESTIONS = 50;

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'ru', label: 'РУ' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
  { code: 'pt', label: 'PT' },
  { code: 'nl', label: 'NL' },
  { code: 'uk', label: 'UA' },
];
