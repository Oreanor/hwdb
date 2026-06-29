'use client';

import { Table, LayoutGrid, CalendarRange } from 'lucide-react';
import { t } from '../i18n';
import { ViewMode } from '../hooks/usePersistedView';

const ICONS: Record<ViewMode, typeof Table> = {
  table: Table,
  gallery: LayoutGrid,
  stats: CalendarRange,
};

export default function ViewToggle({
  next,
  onToggle,
  className = '',
}: {
  // The view you'll switch TO (shown on the button).
  next: ViewMode;
  onToggle: () => void;
  className?: string;
}) {
  const Icon = ICONS[next];

  return (
    <button
      onClick={onToggle}
      title={t('view.label')}
      className={`flex items-center gap-1.5 h-8 sm:h-9 px-3 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer ${className}`}
    >
      <Icon className="w-4 h-4" />
      {t(`view.${next}`)}
    </button>
  );
}
