'use client';

import { usePersistedState } from './usePersistedState';

export type ViewMode = 'table' | 'gallery' | 'stats';

// A remembered view choice. `modes` is the ordered set this page offers (a saved
// value outside it falls back) and is returned so a picker can list them.
export function usePersistedView(key: string, fallback: ViewMode, modes: ViewMode[] = ['table', 'gallery']) {
  const [view, setView] = usePersistedState<ViewMode>(key, fallback, (v): v is ViewMode =>
    (modes as string[]).includes(v)
  );
  return { view, setView, modes };
}
