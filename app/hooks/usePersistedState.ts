'use client';

import { useEffect, useState } from 'react';

// Remembers a string value in localStorage under `key`, falling back to
// `fallback` until a saved value loads (and when nothing is stored yet).
// `isValid` guards against stale/unknown stored values (e.g. an option that was
// renamed or removed), so a bad entry quietly reverts to the fallback.
export function usePersistedState<T extends string>(
  key: string,
  fallback: T,
  isValid: (v: string) => v is T
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved !== null && isValid(saved)) setValue(saved);
    // Load once per key; `isValid` is a pure guard and must not re-trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = (next: T) => {
    setValue(next);
    localStorage.setItem(key, next);
  };

  return [value, update];
}
