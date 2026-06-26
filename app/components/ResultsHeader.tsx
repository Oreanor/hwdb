'use client';

import { ArrowLeft } from 'lucide-react';
import { t } from '../i18n';

interface ResultsHeaderProps {
  onBack?: () => void;
  title?: string;
  // Right-aligned controls (filter, view toggle). Responsible for their own ml-auto.
  children?: React.ReactNode;
}

// Sticky bar shared by every results view: optional back button + title + controls.
export default function ResultsHeader({ onBack, title, children }: ResultsHeaderProps) {
  return (
    <div className="sticky top-0 z-10 -mx-4 sm:-mx-10 px-4 sm:px-10 pt-2 sm:pt-4 pb-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 h-8 sm:h-9 px-3 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </button>
      )}
      {title !== undefined && (
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{title}</h1>
      )}
      {children}
    </div>
  );
}
