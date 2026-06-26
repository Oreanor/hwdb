'use client';

import { useEffect, useState } from 'react';
import { Language, setLanguage } from '../i18n';
import { LANGUAGES, LANGUAGE_STORAGE_KEY } from '../consts';

// Current UI language. `ready` flips once the saved language has been read, so
// the page can avoid rendering text in the default language first.
export function useLanguage() {
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const allowed = LANGUAGES.map((l) => l.code);
    if (saved && allowed.includes(saved as Language)) {
      setLanguage(saved as Language);
      setCurrentLang(saved as Language);
    }
    setReady(true);
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    setCurrentLang(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  return { currentLang, changeLanguage, ready };
}
