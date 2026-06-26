'use client';

import { useEffect, useState } from 'react';
import { Theme, getActiveTheme, applyTheme } from '../theme';

// Light/dark theme. The initial class is set by the boot script in layout.tsx
// (no flash); this syncs React state to it and toggles on demand.
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    setTheme(getActiveTheme());
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  };

  return { theme, toggleTheme };
}
