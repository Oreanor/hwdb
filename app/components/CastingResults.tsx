'use client';

import { useMemo } from 'react';
import { CarData } from '../types';
import { ScaleFilter, isScaleFilter } from '../lib/seriesCategory';
import { t } from '../i18n';
import { VIEW_MODE_KEYS, FILTER_STORAGE_KEYS } from '../consts';
import { formatCarName } from '../utils';
import { byBrand, inBrandScope } from '../lib/brands';
import { usePersistedState } from '../hooks/usePersistedState';
import { usePersistedView, ViewMode } from '../hooks/usePersistedView';
import { useStickyOffset } from '../hooks/useStickyOffset';
import { useSpansBrands } from '../hooks/useSpansBrands';
import CastingsTable from './CastingsTable';
import ModelsGrid from './ModelsGrid';
import CastingsYearMatrix from './CastingsYearMatrix';
import ResultsControls from './ResultsControls';
import ResultsHeader from './ResultsHeader';
import EmptyResults from './EmptyResults';

interface CastingResultsProps {
  cars: CarData[];
  title?: string;
  onBack?: () => void;
  selectedYear?: string;
  brandScope: string; // 'all' | brand key — the top-panel base switcher
  onModelClick: (car: CarData) => void;
}

// Castings have a sparse little table, so they default to the gallery, and
// add a "stats" (year matrix) view.
const CASTING_VIEWS: ViewMode[] = ['table', 'gallery', 'stats'];

// --- gallery / matrix sort: by make or by the real car's model year ---------

type CastSortKey = 'make' | 'model';
type CastSortDir = 'asc' | 'desc';
type CastSort = `${CastSortKey}:${CastSortDir}`;
const isCastSort = (v: string): v is CastSort => /^(make|model):(asc|desc)$/.test(v);

const NO_MAKE = '￿'; // castings without a make sort after every make

function sortCastings(cars: CarData[], key: CastSortKey, dir: CastSortDir): CarData[] {
  const sign = dir === 'asc' ? 1 : -1;
  return [...cars].sort((a, b) => {
    // Brand is the primary key and keeps its fixed order in both directions,
    // so make/model-year sorting happens inside each brand's block.
    const brandCmp = byBrand(a, b);
    if (brandCmp !== 0) return brandCmp;
    const byName = formatCarName(a.lnk).localeCompare(formatCarName(b.lnk)); // stable tiebreak
    if (key === 'model') {
      // Castings with no known model year always sort last, regardless of direction.
      const ay = a.tags?.yr;
      const by = b.tags?.yr;
      if (!ay && !by) return byName;
      if (!ay) return 1;
      if (!by) return -1;
      return (ay - by || byName) * sign;
    }
    return ((a.tags?.mk ?? NO_MAKE).localeCompare(b.tags?.mk ?? NO_MAKE) || byName) * sign;
  });
}

function CastingSortBar({
  keys,
  active,
  dir,
  onSort,
}: {
  keys: CastSortKey[];
  active: CastSortKey;
  dir: CastSortDir;
  onSort: (key: CastSortKey) => void;
}) {
  const label = (key: CastSortKey) => (key === 'make' ? t('sort.make') : t('model.modelYear'));
  return (
    <div className="flex items-center gap-1">
      {keys.map((key) => (
        <button
          key={key}
          onClick={() => onSort(key)}
          className={`h-7 xs:h-8 sm:h-9 px-3 inline-flex items-center text-xs xs:text-sm rounded-md border cursor-pointer transition-colors ${
            active === key
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {label(key)}
          {active === key ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
        </button>
      ))}
    </div>
  );
}

// --- the view ---------------------------------------------------------------

// Casting search / browse results: table <-> gallery <-> year matrix, with the
// brand scope and the scale filter applied.
export default function CastingResults({
  cars,
  title,
  onBack,
  selectedYear,
  brandScope,
  onModelClick,
}: CastingResultsProps) {
  const { view, setView, modes } = usePersistedView(VIEW_MODE_KEYS.castings, 'gallery', CASTING_VIEWS);
  const { ref: headerRef, height: headerH } = useStickyOffset<HTMLDivElement>();

  // Scale filter (1:64-only / other / all), shared with the variants views.
  // Castings carry `s164` / `sOth` flags from the search API (per-variant Sr is
  // trimmed out of casting results). An unknown flag counts as 1:64.
  const [scale, setScale] = usePersistedState<ScaleFilter>(FILTER_STORAGE_KEYS.scale, 'only164', isScaleFilter);

  const inScope = useMemo(() => cars.filter((c) => inBrandScope(c, brandScope)), [cars, brandScope]);
  const scaleCounts = useMemo(
    () => ({
      all: inScope.length,
      only164: inScope.filter((c) => c.s164 !== false).length,
      other: inScope.filter((c) => c.sOth).length,
    }),
    [inScope]
  );
  const shown = useMemo(() => {
    if (scale === 'all') return inScope;
    if (scale === 'other') return inScope.filter((c) => c.sOth);
    return inScope.filter((c) => c.s164 !== false);
  }, [inScope, scale]);
  const showBrand = useSpansBrands(shown);

  const [sortStr, setSortStr] = usePersistedState<CastSort>(FILTER_STORAGE_KEYS.castingSort, 'make:asc', isCastSort);
  const [sortKey, sortDir] = sortStr.split(':') as [CastSortKey, CastSortDir];
  // When every result shares one make (browsing a make), sorting by make is
  // meaningless — drop that button and sort by model year instead.
  const singleMake = shown.length > 0 && shown.every((c) => c.tags?.mk && c.tags.mk === shown[0].tags?.mk);
  const activeKey: CastSortKey = singleMake ? 'model' : sortKey;
  const sorted = useMemo(() => sortCastings(shown, activeKey, sortDir), [shown, activeKey, sortDir]);
  const toggleSort = (key: CastSortKey) =>
    setSortStr(sortKey === key ? `${key}:${sortDir === 'asc' ? 'desc' : 'asc'}` : `${key}:asc`);

  return (
    <div className="flex flex-col gap-4">
      <ResultsHeader ref={headerRef} onBack={onBack} title={title}>
        {cars.length > 0 && (
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
              <CastingSortBar
                keys={singleMake ? ['model'] : ['make', 'model']}
                active={activeKey}
                dir={sortDir}
                onSort={toggleSort}
              />
            )}
          </ResultsControls>
        )}
      </ResultsHeader>

      {cars.length === 0 ? (
        <EmptyResults />
      ) : view === 'table' ? (
        // The table has its own column sort.
        <CastingsTable cars={shown} onModelClick={onModelClick} selectedYear={selectedYear} showBrand={showBrand} stickyTop={headerH} />
      ) : view === 'stats' ? (
        <CastingsYearMatrix cars={sorted} onModelClick={onModelClick} showBrand={showBrand} stickyTop={headerH} />
      ) : (
        <ModelsGrid cars={sorted} onModelClick={onModelClick} selectedYear={selectedYear} showBrand={showBrand} />
      )}
    </div>
  );
}
