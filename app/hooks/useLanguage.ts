'use client';

import { useEffect, useState } from 'react';
import { Language, setLanguage } from '../i18n';
import { LANGUAGES, LANGUAGE_STORAGE_KEY } from '../consts';

const isLanguage = (v: string | null): v is Language => LANGUAGES.some((l) => l.code === v);

// Current UI language, persisted in localStorage. `ready` flips once the saved
// language has been read, so the page doesn't render English text first.
export function useLanguage() {
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isLanguage(saved)) {
      setLanguage(saved);
      setCurrentLang(saved);
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
