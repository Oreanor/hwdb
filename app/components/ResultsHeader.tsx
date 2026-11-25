'use client';

import { ArrowLeft } from 'lucide-react';
import { forwardRef } from 'react';
import { t } from '../i18n';
import { control } from './ui/styles';

interface ResultsHeaderProps {
  onBack?: () => void;
  title?: string;
  // Right-aligned controls (filters, view picker).
  children?: React.ReactNode;
}

// Sticky bar shared by every results view: optional back button + title + controls.
// It bleeds into <main>'s side padding so it spans the full width while pinned;
// z-30 so a sticky table header (z-20) pinned just below it slides underneath.
const ResultsHeader = forwardRef<HTMLDivElement, ResultsHeaderProps>(function ResultsHeader(
  { onBack, title, children },
  ref
) {
  return (
    <div
      ref={ref}
      className="sticky top-0 z-30 -mx-3 sm:-mx-10 px-3 sm:px-10 py-2 sm:py-3 flex flex-wrap items-center gap-x-3 gap-y-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
    >
      {onBack && (
        <button onClick={onBack} className={control}>
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </button>
      )}
      {title && <h1 className="min-w-0 truncate text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>}
      {children && <div className="ml-auto flex flex-wrap items-center justify-end gap-2">{children}</div>}
    </div>
  );
});

export default ResultsHeader;
