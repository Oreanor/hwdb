import { THEME_STORAGE_KEY } from './consts';

export type Theme = 'light' | 'dark';

// The currently applied theme, read from the <html> class the inline boot
// script sets before paint.
export const getActiveTheme = (): Theme =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
    ? 'dark'
    : 'light';

// Apply a theme: toggle the <html> class and persist the choice.
export const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(THEME_STORAGE_KEY, theme);
};
