'use client';

import { t } from '../i18n';
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

// Variants filter bar: the shared controls + the All / Mainline / Premium selector.
export default function VariantFilterControls({ filterState, view, setView, viewModes }: VariantFilterControlsProps) {
  const { filter, setFilter, scale, setScale, counts, scaleCounts } = filterState;

  return (
    <ResultsControls
      shownCount={counts[filter]}
      scale={scale}
      onScaleChange={setScale}
      scaleCounts={scaleCounts}
      view={view}
      setView={setView}
      viewModes={viewModes}
    >
      <Select
        value={filter}
        onValueChange={setFilter}
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
