import { CarData, CarDataItem } from "./types";
import type { Language } from "./i18n";

export const FIELD_ORDER = [
  { key: 'y', label: 'Year' },
  { key: 'N', label: 'Number' },
  { key: 'Sr', label: 'Series' },
  { key: 'c', label: 'Color' },
  { key: 'Tm', label: 'Tampo' },
  { key: 'Bs', label: 'Base' },
  { key: 'Wn', label: 'Window' },
  { key: 'In', label: 'Interior' },
  { key: 'Wh', label: 'Wheels' },
  { key: 'Tn', label: 'Toy #' },
  { key: 'Cn', label: 'Country' },
  { key: 'Nt', label: 'Notes' }
] as const;

// Build the list of years from 1968 to the current year.
const currentYear = new Date().getFullYear();
export const YEARS = Array.from(
  { length: currentYear - 1968 + 1 }, 
  (_, i) => ({ value: String(currentYear - i), label: String(currentYear - i) })
).reverse();
YEARS.unshift({ value: '', label: 'All Years' });

// Search field keys; their display labels come from i18n (search.fields.*).
export const SEARCH_FIELDS = ['name', 'designer', 'description', 'series', 'wheels'] as const;

// How a search field's results are shaped:
//  - model fields describe a single variant -> results are individual models;
//  - everything else describes the whole casting -> results are castings.
export const MODEL_SEARCH_FIELDS: string[] = ['series', 'wheels'];

export const isModelSearchField = (field: string): boolean => MODEL_SEARCH_FIELDS.includes(field);

// Maps a search field to the matching top-level car property.
export const MAIN_OBJECT_FIELDS: Record<string, keyof CarData> = {
  'name': 'lnk',
  'designer': 'ds',
  'description': 'dsc'
};

// Maps a search field to the matching per-variant property.
export const VARIANT_FIELDS: Record<string, keyof CarDataItem> = {
  'series': 'Sr',
  'color': 'c',
  'wheels': 'Wh',
  'country': 'Cn',
  'base': 'Bs',
  'year': 'y'
};

export const COLLAPSED_COLUMNS_COOKIE = 'hwdb_collapsed_columns';

// localStorage keys.
export const THEME_STORAGE_KEY = 'hwdb_theme';
export const LANGUAGE_STORAGE_KEY = 'hwdb_language';

// Remembered table/gallery choice per kind of results page.
export const VIEW_MODE_KEYS = {
  models: 'hwdb_view_models', // collection / year / series / variant search
  castings: 'hwdb_view_castings', // name / designer / description search
  castingPage: 'hwdb_view_casting_page', // a single casting's variants
} as const;

// Remembered filter / sort choices (localStorage). Scale is shared across the
// variants view and the castings grid, so a 1:64 preference set in one applies
// to the other.
export const FILTER_STORAGE_KEYS = {
  scale: 'hwdb_filter_scale', // ScaleFilter: only164 / other / all
  series: 'hwdb_filter_series', // SeriesFilter: all / mainline / premium
  castingSort: 'hwdb_sort_castings', // "make:asc" | "make:desc" | "model:asc" | "model:desc"
  brand: 'hwdb_brand', // brand scope: all / hw / mb / mj
} as const;

// Search fields that get a type-to-filter autocomplete list. 'name' suggests
// the available makes (from casting tags); the rest suggest their own values.
export const AUTOCOMPLETE_FIELDS: string[] = ['name', 'designer', 'wheels', 'series'];

// Series that are a larger scale than 1:64 but don't name the scale in `Sr`,
// so the "1:NN" detector can't catch them. Hot Wheels XL is 1:43.
export const LARGE_SCALE_SERIES = new Set<string>(['Hot Wheels XL']);

// Max autocomplete suggestions shown at once (the list scrolls).
export const MAX_SUGGESTIONS = 50;

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'ru', label: 'РУ' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
  { code: 'pt', label: 'PT' },
  { code: 'nl', label: 'NL' },
  { code: 'uk', label: 'UA' }
];