'use client';

import { t } from '../i18n';
import { SeriesFilter } from '../lib/seriesCategory';
import { VariantFilterState } from '../hooks/useVariantFilter';
import { ViewMode } from '../hooks/usePersistedView';
import Select from './ui/Select';
import ResultsControls from './ResultsControls';

interface VariantFilterControlsProps {
  filterState: VariantFilterState;
  view: ViewMode;
  setView: (mode: ViewMode) => void;
  viewModes: ViewMode[];
}

// Variants view filter bar: shared chrome (shown / scale / view) + the
// All/Mainline/Premium selector. Used by every variants view so they match.
export default function VariantFilterControls({ filterState, view, setView, viewModes }: VariantFilterControlsProps) {
  const { filter, setFilter, scale, setScale, counts, scaleCounts, shownCount } = filterState;

  return (
    <ResultsControls
      shownCount={shownCount}
      scale={scale}
      onScaleChange={setScale}
      scaleCounts={scaleCounts}
      view={view}
      setView={setView}
      viewModes={viewModes}
    >
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
    </ResultsControls>
  );
}
