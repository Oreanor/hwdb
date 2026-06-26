'use client';

import { t } from '../i18n';
import { SeriesFilter } from '../lib/seriesCategory';
import { VariantFilterState } from '../hooks/useVariantFilter';
import Select from './ui/Select';
import ViewToggle from './ViewToggle';

interface VariantFilterControlsProps {
  filterState: VariantFilterState;
  view: 'table' | 'gallery';
  onToggleView: () => void;
}

// "Shown: N" + All/Mainline/Premium selector + table/gallery toggle.
// Shared by every variants view so the controls stay identical everywhere.
export default function VariantFilterControls({ filterState, view, onToggleView }: VariantFilterControlsProps) {
  const { filter, setFilter, counts, shownCount } = filterState;

  return (
    <div className="ml-auto flex items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
        {t('filter.shown')}: {shownCount}
      </span>
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
      <ViewToggle view={view} onToggle={onToggleView} />
    </div>
  );
}
