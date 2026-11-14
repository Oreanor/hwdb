'use client';

import { useCallback, useEffect, useState } from 'react';
import { readStorage, writeStorage } from '../lib/storage';

// Remembers a string value in localStorage under `key`, falling back to
// `fallback` until a saved value loads (and when nothing is stored yet).
// `isValid` guards against stale/unknown stored values (e.g. an option that was
// renamed or removed), so a bad entry quietly reverts to the fallback.
export function usePersistedState<T extends string>(
  key: string,
  fallback: T,
  isValid: (v: string) => v is T
): [T, (next: T) => void] {
  // Read synchronously on the client, so the very first render (and anything
  // loaded on mount, e.g. a ?year= link scoped by the saved brand) already sees
  // the saved value. On the server storage is empty -> fallback; every user of
  // this hook renders client-only (page.tsx shows a spinner until then).
  const [value, setValue] = useState<T>(() => {
    const saved = readStorage(key);
    return saved !== null && isValid(saved) ? saved : fallback;
  });

  // Pick up a different key's saved value.
  useEffect(() => {
    const saved = readStorage(key);
    if (saved !== null && isValid(saved)) setValue(saved);
    // Load once per key; `isValid` is a pure guard and must not re-trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T) => {
      setValue(next);
      writeStorage(key, next);
    },
    [key]
  );

  return [value, update];
}
