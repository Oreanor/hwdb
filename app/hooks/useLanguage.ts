'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_LANGUAGE, Language, isLanguage, setLanguage } from '../i18n';
import { LANGUAGE_STORAGE_KEY } from '../consts';
import { readStorage } from '../lib/storage';

// Current UI language. `ready` flips once the saved language has been read, so
// the page can avoid rendering text in the default language first.
export function useLanguage() {
  const [currentLang, setCurrentLang] = useState<Language>(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = readStorage(LANGUAGE_STORAGE_KEY);
    if (isLanguage(saved)) {
      setLanguage(saved);
      setCurrentLang(saved);
    }
    setReady(true);
  }, []);

  // setLanguage persists the choice.
  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    setCurrentLang(lang);
  };

  return { currentLang, changeLanguage, ready };
}
