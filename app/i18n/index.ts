import translations from './translations.json';
import { LANGUAGE_STORAGE_KEY } from '../consts';
import { writeStorage } from '../lib/storage';

export type Language = 'ru' | 'en' | 'de' | 'es' | 'fr' | 'pt' | 'nl' | 'uk';

type TranslationValue = string | { [key: string]: TranslationValue };

// The language rendered before a saved choice is read (see useLanguage).
export const DEFAULT_LANGUAGE: Language = 'en';

export const isLanguage = (v: unknown): v is Language => typeof v === 'string' && v in translations;

// Module-level so plain functions (not only components) can call t(). The page
// remounts its tree on a language change so memoized children re-render.
let currentLanguage: Language = DEFAULT_LANGUAGE;

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
  writeStorage(LANGUAGE_STORAGE_KEY, lang);
};

// Dotted-key lookup ("search.fields.name"); a missing key renders as itself.
export const t = (key: string): string => {
  let value: TranslationValue = translations[currentLanguage];
  for (const k of key.split('.')) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  return typeof value === 'string' ? value : key;
};
