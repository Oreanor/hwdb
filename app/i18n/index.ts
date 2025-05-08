import translations from './translations.json';

export type Language = 'ru' | 'en' | 'de' | 'es' | 'fr' | 'pt';
export type TranslationKey = string;

export type TranslationValue = string | { [key: string]: TranslationValue };

const LANGUAGE_KEY = 'hwdb_language';

// Начальное значение всегда 'ru' для серверного рендеринга
let currentLanguage: Language = 'ru';

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_KEY, lang);
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