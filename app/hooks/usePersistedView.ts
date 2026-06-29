'use client';

import { useEffect, useState } from 'react';

export type ViewMode = 'table' | 'gallery' | 'stats';

// Remembers a view choice in localStorage under `key`, falling back to
// `fallback` until a saved value loads (and when nothing is stored yet).
// `modes` is the ordered set of allowed views (a saved value outside it is
// ignored) and is returned so a picker can list them; `setView` persists.
export function usePersistedView(key: string, fallback: ViewMode, modes: ViewMode[] = ['table', 'gallery']) {
  const [view, setViewState] = useState<ViewMode>(fallback);

  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved && (modes as string[]).includes(saved)) setViewState(saved as ViewMode);
    // Load once per key; `modes` is a stable literal per call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const setView = (next: ViewMode) => {
    setViewState(next);
    localStorage.setItem(key, next);
  };

  return { view, setView, modes };
}
