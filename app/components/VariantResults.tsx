'use client';

import { CarData, SortConfig } from '../types';
import { t } from '../i18n';
import { VIEW_MODE_KEYS } from '../consts';
import { useVariantFilter } from '../hooks/useVariantFilter';
import { usePersistedView } from '../hooks/usePersistedView';
import { useStickyOffset } from '../hooks/useStickyOffset';
import { useSpansBrands } from '../hooks/useSpansBrands';
import ModelsTable from './ModelsTable';
import VariantsGallery from './VariantsGallery';
import VariantFilterControls from './VariantFilterControls';
import ResultsHeader from './ResultsHeader';
import EmptyResults from './EmptyResults';

interface VariantResultsProps {
  cars: CarData[];
  title?: string;
  onBack?: () => void;
  // The user's own collection (its empty state explains how to add cars).
  isCollection?: boolean;
  selectedYear?: string;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
  onToggleCollection: (id: string) => void;
  collection: ReadonlySet<string>;
  onModelClick: (car: CarData) => void;
  onSeriesClick: (series: string) => void;
  onYearClick: (year: string) => void;
}

// A multi-casting set of variants (collection, year, series, variant search):
// table <-> gallery, with the scale and mainline/premium filters.
export default function VariantResults({
  cars,
  title,
  onBack,
  isCollection = false,
  selectedYear,
  sortConfig,
  onSortChange,
  onToggleCollection,
  collection,
  onModelClick,
  onSeriesClick,
  onYearClick,
}: VariantResultsProps) {
  const { view, setView, modes } = usePersistedView(VIEW_MODE_KEYS.models, 'table');
  const filterState = useVariantFilter(cars);
  const { filteredCars } = filterState;
  const { ref: headerRef, height: headerH } = useStickyOffset<HTMLDivElement>();
  // Mark each row/card with its brand only when the results mix brands.
  const showBrand = useSpansBrands(cars);

  return (
    <div className="flex flex-col gap-4">
      <ResultsHeader ref={headerRef} onBack={onBack} title={title ?? t('auth.myCollection')}>
        {cars.length > 0 && (
          <VariantFilterControls filterState={filterState} view={view} setView={setView} viewModes={modes} />
        )}
      </ResultsHeader>

      {cars.length === 0 ? (
        <EmptyResults isCollection={isCollection} />
      ) : view === 'table' ? (
        <ModelsTable
          cars={filteredCars}
          sortConfig={sortConfig}
          onSortChange={onSortChange}
          selectedYear={selectedYear}
          onToggleCollection={onToggleCollection}
          collection={collection}
          onSeriesClick={onSeriesClick}
          onModelClick={onModelClick}
          onYearClick={onYearClick}
          // A multi-casting result set, so the casting-name column is shown.
          // Only the single-casting page (ModelDescription) omits it.
          showCastingName
          showBrand={showBrand}
          stickyTop={headerH}
        />
      ) : (
        <VariantsGallery cars={filteredCars} selectedYear={selectedYear} showName showBrand={showBrand} />
      )}
    </div>
  );
}
