'use client';

import { useMemo } from 'react';
import { CarData, SortConfig } from '../types';
import { ScaleFilter } from '../lib/seriesCategory';
import { t } from '../i18n';
import { VIEW_MODE_KEYS, FILTER_STORAGE_KEYS } from '../consts';
import { formatCarName } from '../utils';
import { useVariantFilter, isScaleFilter } from '../hooks/useVariantFilter';
import { usePersistedState } from '../hooks/usePersistedState';
import { usePersistedView } from '../hooks/usePersistedView';
import { useStickyOffset } from '../hooks/useStickyOffset';
import ModelsTable from './ModelsTable';
import VariantsGallery from './VariantsGallery';
import CastingsTable from './CastingsTable';
import ModelsGrid from './ModelsGrid';
import CastingsYearMatrix from './CastingsYearMatrix';
import VariantFilterControls from './VariantFilterControls';
import ResultsControls from './ResultsControls';
import ResultsHeader from './ResultsHeader';

interface ResultsViewProps {
  // 'models'  -> table of variants  <-> gallery of variants (with All/Main/Prem filter)
  // 'castings'-> table of castings  <-> grid of castings
  mode: 'models' | 'castings';
  cars: CarData[];
  title?: string;
  onBack?: () => void;
  selectedYear?: string;
  brandScope?: string; // 'all' | brand key — base switcher (castings mode)
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
  brandScope = 'all',
  onModelClick,
  sortConfig,
  onSortChange,
  onAddToCollection,
  collection = [],
  onSeriesClick,
  onYearClick,
}: ResultsViewProps) {
  // Castings have a sparse little table, so they default to the gallery, and
  // add a "stats" (year matrix) view; variants views are table/gallery only.
  const { view, setView, modes: viewModes } = usePersistedView(
    mode === 'castings' ? VIEW_MODE_KEYS.castings : VIEW_MODE_KEYS.models,
    mode === 'castings' ? 'gallery' : 'table',
    mode === 'castings' ? ['table', 'gallery', 'stats'] : ['table', 'gallery']
  );
  const filterState = useVariantFilter(cars);

  // Casting grid scale filter (1:64-only / all scales). Castings carry an `s164`
  // flag from the search API (per-variant Sr is trimmed out of casting results).
  // Defaults to 1:64-only, matching the variants view. Unknown flag -> shown.
  const [castScale, setCastScale] = usePersistedState<ScaleFilter>(FILTER_STORAGE_KEYS.scale, 'only164', isScaleFilter);
  const castScaleCounts = useMemo(() => {
    if (mode !== 'castings') return { all: 0, only164: 0, other: 0 };
    let only164 = 0;
    let other = 0;
    for (const c of cars) {
      if (c.s164 !== false) only164++;
      if (c.sOth) other++;
    }
    return { all: cars.length, only164, other };
  }, [cars, mode]);
  const castingsByScale = useMemo(() => {
    if (mode !== 'castings' || castScale === 'all') return cars;
    if (castScale === 'other') return cars.filter((c) => c.sOth);
    return cars.filter((c) => c.s164 !== false);
  }, [cars, castScale, mode]);

  // Brand scope comes from the top-panel base switcher. When viewing all brands
  // and the results span more than one, cards get a brand badge to tell them apart.
  const multiBrand = useMemo(
    () => mode === 'castings' && new Set(cars.map((c) => c.brand ?? 'hw')).size > 1,
    [cars, mode]
  );
  const showBrandBadge = brandScope === 'all' && multiBrand;
  const castingsByBrand = useMemo(() => {
    if (mode !== 'castings' || brandScope === 'all') return castingsByScale;
    return castingsByScale.filter((c) => (c.brand ?? 'hw') === brandScope);
  }, [castingsByScale, brandScope, mode]);

  const cardsForBody = mode === 'models' ? filterState.filteredCars : castingsByBrand;
  const { ref: headerRef, height: headerH } = useStickyOffset<HTMLDivElement>();

  // The gallery has no column headers, so castings get an explicit sort bar:
  // by make (groups by manufacturer) or by the car's model year.
  type CastSortKey = 'make' | 'model';
  type CastSortStr = 'make:asc' | 'make:desc' | 'model:asc' | 'model:desc';
  const isCastSort = (v: string): v is CastSortStr =>
    v === 'make:asc' || v === 'make:desc' || v === 'model:asc' || v === 'model:desc';
  const [castSortStr, setCastSortStr] = usePersistedState<CastSortStr>(FILTER_STORAGE_KEYS.castingSort, 'make:asc', isCastSort);
  const castSort = useMemo(() => {
    const [key, dir] = castSortStr.split(':') as [CastSortKey, 'asc' | 'desc'];
    return { key, dir };
  }, [castSortStr]);
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
    setCastSortStr(castSort.key === key ? `${key}:${castSort.dir === 'asc' ? 'desc' : 'asc'}` : `${key}:asc`);

  // The plain collection (no title) keeps its richer "how to add" hint.
  const isCollection = mode === 'models' && !title && !onBack;

  return (
    <div className="flex flex-col gap-4">
      <ResultsHeader ref={headerRef} onBack={onBack} title={title ?? t('auth.myCollection')}>
        {cars.length > 0 &&
          (mode === 'models' ? (
            <VariantFilterControls filterState={filterState} view={view} setView={setView} viewModes={viewModes} />
          ) : (
            <ResultsControls
              shownCount={cardsForBody.length}
              scale={castScale}
              onScaleChange={setCastScale}
              scaleCounts={castScaleCounts}
              view={view}
              setView={setView}
              viewModes={viewModes}
            >
              {(view === 'gallery' || view === 'stats') && (
                <div className="flex items-center gap-1">
                  {(singleMake
                    ? ([['model', t('model.modelYear')]] as const)
                    : ([['make', t('sort.make')], ['model', t('model.modelYear')]] as const)
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setSort(key)}
                      className={`h-7 xs:h-8 sm:h-9 px-3 inline-flex items-center text-xs xs:text-sm rounded-md border cursor-pointer transition-colors ${
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
            </ResultsControls>
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
            stickyTop={headerH}
          />
        ) : (
          <VariantsGallery cars={cardsForBody} selectedYear={selectedYear} showName />
        )
      ) : view === 'table' ? (
        <CastingsTable cars={cardsForBody} onModelClick={onModelClick!} selectedYear={selectedYear} stickyTop={headerH} />
      ) : view === 'stats' ? (
        <CastingsYearMatrix cars={galleryCastings} onModelClick={onModelClick!} stickyTop={headerH} />
      ) : (
        <ModelsGrid cars={galleryCastings} onModelClick={onModelClick!} selectedYear={selectedYear} showBrand={showBrandBadge} />
      )}
    </div>
  );
}
