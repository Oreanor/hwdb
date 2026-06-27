'use client';

import { useMemo, useState } from 'react';
import { CarData, SortConfig } from '../types';
import { t } from '../i18n';
import { VIEW_MODE_KEYS } from '../consts';
import { formatCarName } from '../utils';
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

  // The gallery has no column headers, so castings get an explicit sort bar:
  // by make (groups by manufacturer) or by the car's model year.
  type CastSortKey = 'make' | 'model';
  const [castSort, setCastSort] = useState<{ key: CastSortKey; dir: 'asc' | 'desc' }>({ key: 'make', dir: 'asc' });
  // When every result shares one make (browsing a make), sorting by make is
  // meaningless — drop that button and sort by model year instead.
  const singleMake =
    mode === 'castings' && cardsForBody.length > 0 && cardsForBody.every((c) => c.tags?.mk && c.tags.mk === cardsForBody[0].tags?.mk);
  const activeKey: CastSortKey = singleMake ? 'model' : castSort.key;
  const galleryCastings = useMemo(() => {
    if (mode !== 'castings') return cardsForBody;
    const dir = castSort.dir === 'asc' ? 1 : -1;
    return [...cardsForBody].sort((a, b) => {
      const byName = formatCarName(a.lnk).localeCompare(formatCarName(b.lnk)); // stable tiebreak
      if (activeKey === 'model') {
        // Castings with no known model year always sort last, regardless of direction.
        const ay = a.tags?.yr;
        const by = b.tags?.yr;
        if (!ay && !by) return byName;
        if (!ay) return 1;
        if (!by) return -1;
        return (ay - by || byName) * dir;
      }
      return ((a.tags?.mk ?? '￿').localeCompare(b.tags?.mk ?? '￿') || byName) * dir;
    });
  }, [cardsForBody, castSort, activeKey, mode]);
  const setSort = (key: CastSortKey) =>
    setCastSort((p) => (p.key === key ? { key, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  // The plain collection (no title) keeps its richer "how to add" hint.
  const isCollection = mode === 'models' && !title && !onBack;

  return (
    <div className="flex flex-col gap-4">
      <ResultsHeader onBack={onBack} title={title ?? t('auth.myCollection')}>
        {cars.length > 0 &&
          (mode === 'models' ? (
            <VariantFilterControls filterState={filterState} view={view} onToggleView={toggleView} />
          ) : (
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {t('filter.shown')}: {cars.length}
              </span>
              {view === 'gallery' && (
                <div className="flex items-center gap-1">
                  {(singleMake
                    ? ([['model', t('model.modelYear')]] as const)
                    : ([['make', t('sort.make')], ['model', t('model.modelYear')]] as const)
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSort(key)}
                      className={`px-2 py-1 text-xs rounded-md border cursor-pointer transition-colors ${
                        activeKey === key
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {label}
                      {activeKey === key ? (castSort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                    </button>
                  ))}
                </div>
              )}
              <ViewToggle view={view} onToggle={toggleView} />
            </div>
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
        <ModelsGrid cars={galleryCastings} onModelClick={onModelClick!} selectedYear={selectedYear} />
      )}
    </div>
  );
}
