import { CarData, CarDataItem } from "./types";
import type { Language } from "./i18n";

export const FANDOM_BASE_URL = 'https://hotwheels.fandom.com/wiki/';

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

export const SEARCH_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'designer', label: 'Designer' },
  { key: 'description', label: 'Description' },
  { key: 'series', label: 'Series' },
  { key: 'wheels', label: 'Wheels' }
] as const;

// How a search field's results are shaped:
//  - casting fields describe the whole casting  -> results are castings.
//  - model fields describe a single variant      -> results are individual models.
export const CASTING_SEARCH_FIELDS: string[] = ['name', 'designer', 'description'];
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

// Search fields that get a type-to-filter autocomplete list.
export const AUTOCOMPLETE_FIELDS: string[] = ['designer', 'wheels', 'series'];

// Max autocomplete suggestions shown at once (the list scrolls).
export const MAX_SUGGESTIONS = 50;

// Sentinel for the "All Years" option (Radix Select forbids an empty value).
export const ALL_YEARS_VALUE = '__ALL__';

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