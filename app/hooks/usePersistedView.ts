'use client';

import { useEffect, useState } from 'react';

export type ViewMode = 'table' | 'gallery' | 'stats';

// Remembers a view choice in localStorage under `key`, falling back to
// `fallback` until a saved value loads (and when nothing is stored yet).
// `modes` is the ordered set of allowed views (a saved value outside it is
// ignored); `toggle` cycles to the next one and `next` is that upcoming view.
export function usePersistedView(key: string, fallback: ViewMode, modes: ViewMode[] = ['table', 'gallery']) {
  const [view, setView] = useState<ViewMode>(fallback);

  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved && (modes as string[]).includes(saved)) setView(saved as ViewMode);
    // Load once per key; `modes` is a stable literal per call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const next = modes[(modes.indexOf(view) + 1) % modes.length];
  const toggle = () => {
    setView(next);
    localStorage.setItem(key, next);
  };

  return { view, toggle, next };
}
