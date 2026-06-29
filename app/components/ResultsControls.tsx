'use client';

import { ReactNode } from 'react';
import { t } from '../i18n';
import { ScaleFilter } from '../lib/seriesCategory';
import { ViewMode } from '../hooks/usePersistedView';
import Select from './ui/Select';
import ViewSelect from './ViewSelect';

interface ResultsControlsProps {
  shownCount: number;
  scale: ScaleFilter;
  onScaleChange: (scale: ScaleFilter) => void;
  scaleCounts: { only164: number; other: number; all: number };
  view: ViewMode;
  setView: (mode: ViewMode) => void;
  viewModes: ViewMode[];
  // View-specific middle controls: the series (mainline/premium) filter for the
  // variants view, the make/model-year sort for the castings grid.
  children?: ReactNode;
}

// Shared chrome for both results filter bars so they stay identical: "Shown: N"
// + scale filter + the view-specific controls + the view picker.
export default function ResultsControls({
  shownCount,
  scale,
  onScaleChange,
  scaleCounts,
  view,
  setView,
  viewModes,
  children,
}: ResultsControlsProps) {
  return (
    <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
      <span className="mr-2.5 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {t('filter.shown')}: {shownCount}
      </span>
      <Select
        value={scale}
        onValueChange={(v) => onScaleChange(v as ScaleFilter)}
        options={[
          { value: 'only164', label: `1:64 (${scaleCounts.only164})` },
          { value: 'other', label: `${t('filter.otherScales')} (${scaleCounts.other})` },
          { value: 'all', label: `${t('filter.allScales')} (${scaleCounts.all})` },
        ]}
        ariaLabel={t('filter.allScales')}
      />
      {children}
      <ViewSelect view={view} setView={setView} modes={viewModes} />
    </div>
  );
}
