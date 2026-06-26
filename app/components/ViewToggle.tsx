'use client';

import { Table, LayoutGrid } from 'lucide-react';
import { t } from '../i18n';

type ViewMode = 'table' | 'gallery';

export default function ViewToggle({
  view,
  onToggle,
  className = '',
}: {
  view: ViewMode;
  onToggle: () => void;
  className?: string;
}) {
  // Show the view you'll switch TO.
  const next: ViewMode = view === 'table' ? 'gallery' : 'table';
  const Icon = next === 'gallery' ? LayoutGrid : Table;

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
