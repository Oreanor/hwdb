// Shared Tailwind class sets, so every bar, table, card and menu looks the same.
// Palette: page white / gray-900; surfaces (bars, cards, menus, controls) white /
// gray-800; hover gray-50 / gray-700; accent blue-600 (blue-400 for dark text).

// ---- Controls (selects, search box, buttons in the bars) --------------------

// One height for every control in a row.
export const controlSize = 'h-8 sm:h-9 text-xs xs:text-sm';

const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

// Bordered surface of an input-like control (also wraps the search box).
export const controlFrame =
  'rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm';

// Shape shared by `control` and `controlActive` (colors live in each, never both on one element).
const controlShape = `${controlSize} ${focusRing} inline-flex items-center gap-1.5 px-2 sm:px-3 whitespace-nowrap rounded-md border shadow-sm transition-colors cursor-pointer`;

// Secondary button / select trigger.
export const control = `${controlShape} border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700`;

// The pressed button of a toggle group (use instead of `control`).
export const controlActive = `${controlShape} border-blue-600 bg-blue-600 text-white hover:bg-blue-700`;

// The one call-to-action in a bar.
export const primaryButton = `${controlSize} ${focusRing} inline-flex items-center gap-2 px-3 rounded-md font-medium whitespace-nowrap bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer`;

// A square icon-only `control`.
export const iconButton = `${control} justify-center w-8 sm:w-9 !px-0`;

// ---- Menus (select lists, dropdowns, autocomplete) ---------------------------

export const menuContent =
  'z-50 min-w-[180px] rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 shadow-lg';

export const menuItem =
  'relative flex items-center gap-2 px-3 py-1.5 rounded text-xs xs:text-sm text-gray-900 dark:text-gray-200 outline-none cursor-pointer select-none data-[highlighted]:bg-blue-600 data-[highlighted]:text-white data-[disabled]:opacity-40';

// Menu item with room on the left for a check mark.
export const menuItemChecked = `${menuItem} pl-7`;

export const menuSeparator = 'my-1 h-px bg-gray-200 dark:bg-gray-700';

// ---- Tables -----------------------------------------------------------------

export const table = 'min-w-full divide-y divide-gray-200 dark:divide-gray-700';
export const thead = 'sticky z-20 bg-gray-50 dark:bg-gray-800';
export const th =
  'p-2 text-left text-sm font-semibold whitespace-nowrap text-gray-900 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700';
export const thSortable = `${th} cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400`;
export const tbody = 'bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700';
// content-visibility skips layout/paint for off-screen rows (year views reach
// ~1750 rows); contain-intrinsic-size reserves their estimated height.
export const tr = 'hover:bg-gray-50 dark:hover:bg-gray-800 [content-visibility:auto] [contain-intrinsic-size:auto_84px]';
export const td = 'p-2 text-sm text-gray-900 dark:text-gray-200';
export const tdMuted = 'p-2 text-sm text-gray-500 dark:text-gray-400';

// ---- Cards and text ------------------------------------------------------------

export const cardGrid = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2';
export const card =
  'relative flex flex-col items-center gap-0.5 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 hover:shadow-md transition-shadow [content-visibility:auto] [contain-intrinsic-size:auto_260px]';
export const cardTitle = 'text-sm font-semibold text-center text-gray-900 dark:text-gray-100 line-clamp-1';
export const cardMeta = 'text-xs text-center text-gray-500 dark:text-gray-400';

export const link = 'text-left text-blue-600 dark:text-blue-400 hover:underline cursor-pointer';

// Small rounded tag (model page tags).
export const chip =
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer';
