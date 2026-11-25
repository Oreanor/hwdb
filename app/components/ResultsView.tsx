'use client';

import { useMemo } from 'react';
import { CarData, SortConfig } from '../types';
import { ScaleFilter } from '../lib/seriesCategory';
import { brandOf, inBrandScope } from '../lib/brands';
import { t } from '../i18n';
import { VIEW_MODE_KEYS, FILTER_STORAGE_KEYS } from '../consts';
import { formatCarName } from '../utils';
import { useVariantFilter, isScaleFilter } from '../hooks/useVariantFilter';
import { usePersistedState } from '../hooks/usePersistedState';
import { usePersistedView, ViewMode } from '../hooks/usePersistedView';
import { useStickyOffset } from '../hooks/useStickyOffset';
import ModelsTable from './ModelsTable';
import VariantsGallery from './VariantsGallery';
import CastingsTable from './CastingsTable';
import ModelsGrid from './ModelsGrid';
import CastingsYearMatrix from './CastingsYearMatrix';
import VariantFilterControls from './VariantFilterControls';
import ResultsControls from './ResultsControls';
import ResultsHeader from './ResultsHeader';
import { control, controlActive } from './ui/styles';

// Castings view: sort by make (groups manufacturers) or by the real car's model year.
type CastSortKey = 'make' | 'model';
type CastSort = `${CastSortKey}:${'asc' | 'desc'}`;
const isCastSort = (v: string): v is CastSort => /^(make|model):(asc|desc)$/.test(v);

const CASTING_VIEWS: ViewMode[] = ['table', 'gallery', 'stats'];
const VARIANT_VIEWS: ViewMode[] = ['table', 'gallery'];

function sortCastings(cars: CarData[], key: CastSortKey, dir: 1 | -1): CarData[] {
  return [...cars].sort((a, b) => {
    const byName = formatCarName(a.lnk).localeCompare(formatCarName(b.lnk)); // stable tiebreak
    if (key === 'model') {
      // Castings with no known model year sort last, in either direction.
      const ay = a.tags?.yr;
      const by = b.tags?.yr;
      if (!ay || !by) return ay ? -1 : by ? 1 : byName;
      return (ay - by || byName) * dir;
    }
    // No make sorts last.
    return ((a.tags?.mk ?? '￿').localeCompare(b.tags?.mk ?? '￿') || byName) * dir;
  });
}

interface ResultsViewProps {
  // 'models'   -> variants: table / gallery, with the All / Mainline / Premium filter
  // 'castings' -> castings: table / gallery / year matrix, with a make / year sort
  mode: 'models' | 'castings';
  cars: CarData[];
  title?: string;
  onBack?: () => void;
  selectedYear?: string;
  brandScope?: string; // castings: the top-panel base switcher ('all' or a brand)
  onModelClick: (car: CarData) => void;
  // models mode only:
  sortConfig?: SortConfig;
  onSortChange?: (config: SortConfig) => void;
  onAddToCollection?: (id: string) => void;
  collection?: string[];
  onSeriesClick?: (series: string) => void;
  onYearClick?: (year: string) => void;
}

export default function ResultsView(props: ResultsViewProps) {
  return props.mode === 'models' ? <VariantsResults {...props} /> : <CastingsResults {...props} />;
}

// Variants of many castings: collection, series, year, variant-field search.
function VariantsResults({
  cars,
  title,
  onBack,
  selectedYear,
  onModelClick,
  sortConfig = null,
  onSortChange = () => {},
  onAddToCollection,
  collection = [],
  onSeriesClick,
  onYearClick,
}: ResultsViewProps) {
  const { view, setView, modes } = usePersistedView(VIEW_MODE_KEYS.models, 'table', VARIANT_VIEWS);
  const filterState = useVariantFilter(cars);
  const { ref: headerRef, height: headerH } = useStickyOffset<HTMLDivElement>();
  // The collection is the only variants view without a title / back button.
  const isCollection = !title && !onBack;

  return (
    <div className="flex flex-col gap-4">
      <ResultsHeader ref={headerRef} onBack={onBack} title={title ?? t('auth.myCollection')}>
        {cars.length > 0 && (
          <VariantFilterControls filterState={filterState} view={view} setView={setView} viewModes={modes} />
        )}
      </ResultsHeader>

      {cars.length === 0 ? (
        <EmptyState hint={isCollection ? t('collection.howToAdd') : undefined}>
          {isCollection ? t('collection.empty') : t('common.noResults')}
        </EmptyState>
      ) : view === 'table' ? (
        <ModelsTable
          cars={filterState.filteredCars}
          sortConfig={sortConfig}
          onSortChange={onSortChange}
          selectedYear={selectedYear}
          onAddToCollection={onAddToCollection}
          collection={collection}
          onSeriesClick={onSeriesClick}
          onModelClick={onModelClick}
          onYearClick={onYearClick}
          showCastingName
          stickyTop={headerH}
        />
      ) : (
        <VariantsGallery cars={filterState.filteredCars} selectedYear={selectedYear} showName />
      )}
    </div>
  );
}

// Casting search results (name / designer / description / tag).
function CastingsResults({ cars, title, onBack, selectedYear, brandScope = 'all', onModelClick }: ResultsViewProps) {
  const { view, setView, modes } = usePersistedView(VIEW_MODE_KEYS.castings, 'gallery', CASTING_VIEWS);
  const { ref: headerRef, height: headerH } = useStickyOffset<HTMLDivElement>();
  // Shares its stored value with the variants scale filter. Castings carry
  // `s164` / `sOth` flags from the search API (per-variant Sr is trimmed out).
  const [scale, setScale] = usePersistedState<ScaleFilter>(FILTER_STORAGE_KEYS.scale, 'only164', isScaleFilter);
  const [sortValue, setSortValue] = usePersistedState<CastSort>(FILTER_STORAGE_KEYS.castingSort, 'make:asc', isCastSort);
  const [sortKey, sortDir] = sortValue.split(':') as [CastSortKey, 'asc' | 'desc'];

  const inScope = useMemo(() => inBrandScope(cars, brandScope), [cars, brandScope]);
  const scaleCounts = useMemo(
    () => ({
      all: inScope.length,
      only164: inScope.filter((c) => c.s164 !== false).length,
      other: inScope.filter((c) => c.sOth).length,
    }),
    [inScope]
  );
  const shown = useMemo(
    () => (scale === 'all' ? inScope : inScope.filter((c) => (scale === 'other' ? c.sOth : c.s164 !== false))),
    [inScope, scale]
  );

  // When every result shares one make (browsing a make), sorting by make is
  // meaningless — offer only the model-year sort.
  const singleMake = shown.length > 0 && shown.every((c) => c.tags?.mk && c.tags.mk === shown[0].tags?.mk);
  const activeKey: CastSortKey = singleMake ? 'model' : sortKey;
  const sorted = useMemo(
    () => sortCastings(shown, activeKey, sortDir === 'asc' ? 1 : -1),
    [shown, activeKey, sortDir]
  );
  const toggleSort = (key: CastSortKey) =>
    setSortValue(`${key}:${key === sortKey && sortDir === 'asc' ? 'desc' : 'asc'}`);
  const sortKeys: [CastSortKey, string][] = singleMake
    ? [['model', t('model.modelYear')]]
    : [['make', t('sort.make')], ['model', t('model.modelYear')]];

  // Badge cards with their brand when "all brands" results mix several.
  const showBrand = brandScope === 'all' && new Set(cars.map(brandOf)).size > 1;

  return (
    <div className="flex flex-col gap-4">
      <ResultsHeader ref={headerRef} onBack={onBack} title={title}>
        <ResultsControls
          shownCount={shown.length}
          scale={scale}
          onScaleChange={setScale}
          scaleCounts={scaleCounts}
          view={view}
          setView={setView}
          viewModes={modes}
        >
          {view !== 'table' && (
            <div className="flex items-center gap-1">
              {sortKeys.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSort(key)}
                  className={activeKey === key ? controlActive : control}
                >
                  {label}
                  {activeKey === key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                </button>
              ))}
            </div>
          )}
        </ResultsControls>
      </ResultsHeader>

      {shown.length === 0 ? (
        <EmptyState>{t('common.noResults')}</EmptyState>
      ) : view === 'table' ? (
        <CastingsTable cars={shown} onModelClick={onModelClick} selectedYear={selectedYear} stickyTop={headerH} />
      ) : view === 'stats' ? (
        <CastingsYearMatrix cars={sorted} onModelClick={onModelClick} stickyTop={headerH} />
      ) : (
        <ModelsGrid cars={sorted} onModelClick={onModelClick} selectedYear={selectedYear} showBrand={showBrand} />
      )}
    </div>
  );
}

function EmptyState({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
      <p>{children}</p>
      {hint && <p className="mt-2 text-sm">{hint}</p>}
    </div>
  );
}
