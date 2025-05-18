import { CarData, CarDataItem } from "./types";
import { Language } from "./i18n";

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

// Генерируем список годов от 1968 до текущего года
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
  { key: 'color', label: 'Color' },
  { key: 'base', label: 'Base' },
  { key: 'wheels', label: 'Wheels' },
  { key: 'country', label: 'Country' }
] as const;

// Маппинг полей поиска на реальные поля в объектах
export const MAIN_OBJECT_FIELDS: Record<string, keyof CarData> = {
  'name': 'lnk',
  'designer': 'ds',
  'description': 'dsc'
};

// Маппинг полей поиска на поля в вариантах
export const VARIANT_FIELDS: Record<string, keyof CarDataItem> = {
  'series': 'Sr',
  'color': 'c',
  'wheels': 'Wh',
  'country': 'Cn',
  'base': 'Bs',
  'year': 'y'
};

export const COLLAPSED_COLUMNS_COOKIE = 'hwdb_collapsed_columns';
export const ITEMS_PER_PAGE = 1000;

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