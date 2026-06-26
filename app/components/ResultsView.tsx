'use client';

import { CarData, SortConfig } from '../types';
import { t } from '../i18n';
import { VIEW_MODE_KEYS } from '../consts';
import { useVariantFilter } from '../hooks/useVariantFilter';
import { usePersistedView } from '../hooks/usePersistedView';
import ModelsTable from './ModelsTable';
import VariantsGallery from './VariantsGallery';
import CastingsTable from './CastingsTable';
import ModelsGrid from './ModelsGrid';
import ViewToggle from './ViewToggle';
import VariantFilterControls from './VariantFilterControls';
import ResultsHeader from './ResultsHeader';

interface ResultsViewProps {
  // 'models'  -> table of variants  <-> gallery of variants (with All/Main/Prem filter)
  // 'castings'-> table of castings  <-> grid of castings
  mode: 'models' | 'castings';
  cars: CarData[];
  title?: string;
  onBack?: () => void;
  selectedYear?: string;
  onModelClick?: (car: CarData) => void;
  // models mode only:
  sortConfig?: SortConfig;
  onSortChange?: (config: SortConfig | ((prev: SortConfig) => SortConfig)) => void;
  onAddToCollection?: (id: string) => void;
  collection?: string[];
  onSeriesClick?: (series: string) => void;
  onYearClick?: (year: string) => void;
}

export default function ResultsView({
  mode,
  cars,
  title,
  onBack,
  selectedYear,
  onModelClick,
  sortConfig,
  onSortChange,
  onAddToCollection,
  collection = [],
  onSeriesClick,
  onYearClick,
}: ResultsViewProps) {
  // Castings have a sparse little table, so they default to the gallery.
  const { view, toggle: toggleView } = usePersistedView(
    mode === 'castings' ? VIEW_MODE_KEYS.castings : VIEW_MODE_KEYS.models,
    mode === 'castings' ? 'gallery' : 'table'
  );
  const filterState = useVariantFilter(cars);
  const cardsForBody = mode === 'models' ? filterState.filteredCars : cars;

  // The plain collection (no title) keeps its richer "how to add" hint.
  const isCollection = mode === 'models' && !title && !onBack;

  return (
    <div className="flex flex-col gap-4">
      <ResultsHeader onBack={onBack} title={title ?? t('auth.myCollection')}>
        {cars.length > 0 &&
          (mode === 'models' ? (
            <VariantFilterControls filterState={filterState} view={view} onToggleView={toggleView} />
          ) : (
            <ViewToggle view={view} onToggle={toggleView} className="ml-auto" />
          ))}
      </ResultsHeader>

      {cars.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-gray-400 py-8">
          <p className="mb-2">{isCollection ? t('collection.empty') : t('common.noResults')}</p>
          {isCollection && <p className="text-sm">{t('collection.howToAdd')}</p>}
        </div>
      ) : mode === 'models' ? (
        view === 'table' ? (
          <ModelsTable
            cars={cardsForBody}
            sortConfig={sortConfig!}
            onSortChange={onSortChange!}
            selectedYear={selectedYear}
            onAddToCollection={onAddToCollection!}
            collection={collection}
            onSeriesClick={onSeriesClick}
            onModelClick={onModelClick}
            onYearClick={onYearClick}
            // Every ResultsView table is a multi-casting result set (collection,
            // year, series, search), so it shows the casting-name column. Only the
            // single-casting page (ModelDescription) omits it.
            showCastingName
          />
        ) : (
          <VariantsGallery cars={cardsForBody} selectedYear={selectedYear} showName />
        )
      ) : view === 'table' ? (
        <CastingsTable cars={cardsForBody} onModelClick={onModelClick!} selectedYear={selectedYear} />
      ) : (
        <ModelsGrid cars={cardsForBody} onModelClick={onModelClick!} selectedYear={selectedYear} />
      )}
    </div>
  );
}
