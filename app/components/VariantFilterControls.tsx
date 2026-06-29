'use client';

import { t } from '../i18n';
import { SeriesFilter, ScaleFilter } from '../lib/seriesCategory';
import { VariantFilterState } from '../hooks/useVariantFilter';
import { ViewMode } from '../hooks/usePersistedView';
import Select from './ui/Select';
import ViewToggle from './ViewToggle';

interface VariantFilterControlsProps {
  filterState: VariantFilterState;
  viewNext: ViewMode;
  onToggleView: () => void;
}

// "Shown: N" + All/Mainline/Premium selector + table/gallery toggle.
// Shared by every variants view so the controls stay identical everywhere.
export default function VariantFilterControls({ filterState, viewNext, onToggleView }: VariantFilterControlsProps) {
  const { filter, setFilter, scale, setScale, counts, scaleCounts, shownCount } = filterState;

  return (
    <div className="ml-auto flex items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {t('filter.shown')}: {shownCount}
      </span>
      <Select
        value={scale}
        onValueChange={(v) => setScale(v as ScaleFilter)}
        options={[
          { value: 'only164', label: `1:64 (${scaleCounts.only164})` },
          { value: 'other', label: `${t('filter.otherScales')} (${scaleCounts.other})` },
          { value: 'all', label: `${t('filter.allScales')} (${scaleCounts.all})` },
        ]}
        ariaLabel={t('filter.allScales')}
      />
      <Select
        value={filter}
        onValueChange={(v) => setFilter(v as SeriesFilter)}
        options={[
          { value: 'all', label: `${t('filter.all')} (${counts.all})` },
          { value: 'mainline', label: `${t('filter.mainline')} (${counts.mainline})` },
          { value: 'premium', label: `${t('filter.premium')} (${counts.premium})` },
        ]}
        ariaLabel={t('filter.all')}
      />
      <ViewToggle next={viewNext} onToggle={onToggleView} />
    </div>
  );
}
