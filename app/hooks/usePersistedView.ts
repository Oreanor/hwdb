'use client';

import { usePersistedState } from './usePersistedState';

export type ViewMode = 'table' | 'gallery' | 'stats';

const DEFAULT_MODES: ViewMode[] = ['table', 'gallery'];

// Remembers a view choice under `key`. `modes` is the ordered set of allowed
// views (a saved value outside it is ignored) and is returned so a picker can
// list them; `setView` persists.
export function usePersistedView(key: string, fallback: ViewMode, modes: ViewMode[] = DEFAULT_MODES) {
  const [view, setView] = usePersistedState<ViewMode>(key, fallback, (v): v is ViewMode =>
    (modes as string[]).includes(v)
  );
  return { view, setView, modes };
}
