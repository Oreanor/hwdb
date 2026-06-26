'use client';

import { useEffect, useState } from 'react';

export type ViewMode = 'table' | 'gallery';

// Remembers a table/gallery choice in localStorage under `key`, falling back to
// `fallback` until a saved value loads (and when nothing is stored yet).
export function usePersistedView(key: string, fallback: ViewMode) {
  const [view, setView] = useState<ViewMode>(fallback);

  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved === 'table' || saved === 'gallery') setView(saved);
  }, [key]);

  const update = (next: ViewMode) => {
    setView(next);
    localStorage.setItem(key, next);
  };
  const toggle = () => update(view === 'table' ? 'gallery' : 'table');

  return { view, toggle };
}
