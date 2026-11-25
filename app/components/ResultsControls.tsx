'use client';

import { ReactNode } from 'react';
import { t } from '../i18n';
import { ScaleFilter } from '../lib/seriesCategory';
import { ViewMode } from '../hooks/usePersistedView';
import Select from './ui/Select';

interface ResultsControlsProps {
  shownCount: number;
  scale: ScaleFilter;
  onScaleChange: (scale: ScaleFilter) => void;
  scaleCounts: Record<ScaleFilter, number>;
  view: ViewMode;
  setView: (mode: ViewMode) => void;
  viewModes: ViewMode[];
  // View-specific controls between the scale filter and the view picker: the
  // series (mainline/premium) filter for variants, the sort for castings.
  children?: ReactNode;
}

// The filter bar every results view shares: "Shown: N", scale, extras, view picker.
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
    <>
      <span className="mr-1 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {t('filter.shown')}: {shownCount}
      </span>
      <Select
        value={scale}
        onValueChange={onScaleChange}
        options={[
          { value: 'only164', label: `1:64 (${scaleCounts.only164})` },
          { value: 'other', label: `${t('filter.otherScales')} (${scaleCounts.other})` },
          { value: 'all', label: `${t('filter.allScales')} (${scaleCounts.all})` },
        ]}
        ariaLabel={t('filter.allScales')}
      />
      {children}
      <Select
        value={view}
        onValueChange={setView}
        options={viewModes.map((m) => ({ value: m, label: t(`view.${m}`) }))}
        ariaLabel={t('view.label')}
      />
    </>
  );
}
