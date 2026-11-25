import translations from './translations.json';

export type Language = 'ru' | 'en' | 'de' | 'es' | 'fr' | 'pt' | 'nl' | 'uk';

type TranslationValue = string | { [key: string]: TranslationValue };

// Module-level current language. English until useLanguage() reads the saved
// choice (persisting it is the hook's job, not this module's).
let currentLanguage: Language = 'en';

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
};

// Looks up a dotted key ("search.fields.name"); a missing key renders as itself.
export const t = (key: string): string => {
  let value: TranslationValue = translations[currentLanguage];
  for (const k of key.split('.')) {
    if (typeof value !== 'object' || !(k in value)) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    value = value[k];
  }
  return typeof value === 'string' ? value : key;
};
