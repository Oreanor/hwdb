import translations from './translations.json';
import { LANGUAGE_STORAGE_KEY } from '../consts';

export type Language = 'ru' | 'en' | 'de' | 'es' | 'fr' | 'pt' | 'nl' | 'uk';
export type TranslationKey = string;

export type TranslationValue = string | { [key: string]: TranslationValue };

// Default language. Must match the initial `currentLang` state in page.tsx so
// the settings selection and the rendered text agree before a saved language is
// read. The client switches to the saved language after hydration.
let currentLanguage: Language = 'en';

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  }
};

export const getLanguage = (): Language => {
  return currentLanguage;
};

export const t = (key: TranslationKey): string => {
  const keys = key.split('.');
  let value: TranslationValue = translations[currentLanguage];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  return typeof value === 'string' ? value : key;
}; 