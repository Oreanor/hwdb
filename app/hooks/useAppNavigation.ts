'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { t } from '../i18n';
import { convertKeyboardLayout } from '../utils';
import { carMatchesQuery, tokenize } from '../lib/carSearch';
import { fetchCars, fetchCarByLnk, fetchVariantsByIds, fetchSeriesCars, fetchYearCars } from '../services/carService';
import { ALL_YEARS, isModelSearchField, FILTER_STORAGE_KEYS, MIN_QUERY_LENGTH } from '../consts';
import { tagLabel } from '../lib/tags';
import { BrandScope, isBrandScope } from '../lib/brands';
import { matchesYear, variantYears } from '../lib/years';
import { pushUrl } from '../lib/navigation';
import { usePersistedState } from './usePersistedState';
import { useCollection } from './useCollection';
import { CarData, SortConfig, TableView, ResultTitle } from '../types';

type SearchOptions = {
  year?: string;
  query?: string;
  field?: string;
  // Restoring from the URL: don't push a new history entry.
  fromHistory?: boolean;
};

// Each collection casting minus the variant `id` (castings left empty drop out).
const withoutVariant = (cars: CarData[], id: string): CarData[] =>
  cars.flatMap((car) => {
    if (!car.d.some((v) => v.id === id)) return [car];
    const d = car.d.filter((v) => v.id !== id);
    return d.length ? [{ ...car, d }] : [];
  });

// Client-side filter of the already-loaded collection (same matching as the API).
const filterCollection = (cars: CarData[], year: string, query: string, field: string): CarData[] => {
  let result = cars;
  if (year) {
    result = result
      .map((car) => ({ ...car, d: car.d.filter((item) => matchesYear(item, year)) }))
      .filter((car) => car.d.length > 0);
  }
  if (query) {
    const words = tokenize(query);
    result = result.filter((car) => carMatchesQuery(car, field, words, query));
  }
  return result;
};

// Owns the app's search / view / collection state, the handlers that drive it,
// and the URL <-> state syncing (shareable links, Back/Forward). The page just
// wires the returned values into <TopPanel> and <MainContent>.
//
// Which view shows is decided by MainContent in this order: tableView (a
// variants table: series / year / model-field search), the collection, a
// single casting (selectedModel), casting results (cars), the welcome screen.
export function useAppNavigation() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { idSet: collectionIds, reload: reloadCollection, add, remove } = useCollection(userId);

  // Casting search results and their header (e.g. "Designer: Larry Wood").
  const [cars, setCars] = useState<CarData[]>([]);
  const [castingsTitle, setCastingsTitle] = useState<ResultTitle | null>(null);
  // The whole collection (variants grouped by casting) and its filtered view.
  const [collectionCars, setCollectionCars] = useState<CarData[]>([]);
  const [filteredCollectionCars, setFilteredCollectionCars] = useState<CarData[]>([]);
  const [showCollection, setShowCollection] = useState(false);
  const [pendingCollection, setPendingCollection] = useState(false);
  const [tableView, setTableView] = useState<TableView | null>(null);
  const [selectedModel, setSelectedModel] = useState<CarData | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedField, setSelectedField] = useState<string>('name');
  const [selectedYear, setSelectedYear] = useState('');
  // Brand scope (base switcher) — filters results to one brand's catalog.
  const [selectedBrand, setSelectedBrandState] = usePersistedState<BrandScope>(
    FILTER_STORAGE_KEYS.brand,
    'all',
    isBrandScope
  );
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // Mirror of the values handlers read at call time, so every handler can be
  // referentially stable (no re-render of the heavy lists on each keystroke,
  // and the popstate listener never sees a stale closure).
  const live = useRef({ selectedYear, searchQuery, selectedField, selectedBrand, showCollection, collectionCars, tableView });
  live.current = { selectedYear, searchQuery, selectedField, selectedBrand, showCollection, collectionCars, tableView };

  // Runs a data load with the shared loading/error handling. Only the latest
  // load may touch state: `isCurrent()` turns false once a newer one starts,
  // so a slow response can't overwrite the view the user has moved on to.
  const requestId = useRef(0);
  const load = useCallback(
    async (task: (isCurrent: () => boolean) => Promise<void>, errorKey = 'search.errors.failedToLoad') => {
      const id = ++requestId.current;
      const isCurrent = () => id === requestId.current;
      setLoading(true);
      setError(null);
      try {
        await task(isCurrent);
      } catch (err) {
        console.error(err);
        if (isCurrent()) setError(t(errorKey));
      } finally {
        if (isCurrent()) setLoading(false);
      }
    },
    []
  );

  // Leave whatever view is open (table / collection / casting page).
  const closeViews = useCallback(() => {
    setTableView(null);
    setSelectedModel(null);
    setShowCollection(false);
  }, []);

  const showWelcome = useCallback(() => {
    requestId.current++; // drop any load still in flight
    setLoading(false);
    setError(null);
    closeViews();
    setCars([]);
  }, [closeViews]);

  const openYear = useCallback(
    (year: string, fromHistory = false, brand: BrandScope = live.current.selectedBrand) =>
      load(async (isCurrent) => {
        const data = await fetchYearCars(year, brand);
        if (!isCurrent()) return;
        closeViews();
        setCars([]);
        setSelectedYear(year);
        setTableView({ kind: 'year', value: year, cars: data });
        if (!fromHistory) pushUrl({ view: 'year', year });
      }),
    [load, closeViews]
  );

  const openSeries = useCallback(
    (series: string, fromHistory = false) =>
      load(async (isCurrent) => {
        const data = await fetchSeriesCars(series);
        if (!isCurrent()) return;
        setSelectedModel(null);
        setShowCollection(false);
        setTableView({ kind: 'series', value: series, cars: data });
        if (!fromHistory) pushUrl({ view: 'series', series });
      }),
    [load]
  );

  // Browse castings by a tag query (home page chips), e.g. "th:Supercar,mk:Nissan".
  const openTag = useCallback(
    (tag: string, fromHistory = false) =>
      load(async (isCurrent) => {
        const data = await fetchCars('tag', tag);
        if (!isCurrent()) return;
        closeViews();
        setSearchQuery('');
        setCastingsTitle({ text: tagLabel(tag) });
        setCars(data);
        if (!fromHistory) pushUrl({ view: 'grid', tag });
      }),
    [load, closeViews]
  );

  const openModel = useCallback(
    (lnk: string, brand?: string, fromHistory = false) =>
      load(async (isCurrent) => {
        const car = await fetchCarByLnk(lnk, brand);
        if (!isCurrent() || !car) return;
        setTableView(null);
        setShowCollection(false);
        setSelectedModel(car);
        if (!fromHistory) {
          const { selectedYear, searchQuery, selectedField } = live.current;
          pushUrl({ view: 'model', model: lnk, brand, year: selectedYear, searchQuery, selectedField });
        }
      }),
    [load]
  );

  const openCollection = useCallback(
    (fromHistory = false) =>
      load(async (isCurrent) => {
        const ids = await reloadCollection();
        const variants = await fetchVariantsByIds(ids);
        if (!isCurrent()) return;
        setTableView(null);
        setSelectedModel(null);
        setSelectedYear('');
        setSearchQuery('');
        setCollectionCars(variants);
        setFilteredCollectionCars(variants);
        setShowCollection(true);
        if (!fromHistory) pushUrl({ view: 'collection' });
      }, 'search.errors.failedToLoadCollection'),
    [load, reloadCollection]
  );

  // The search button / Enter / a picked suggestion / a restored URL. Missing
  // options fall back to the current top-panel state.
  const runSearch = useCallback(
    async (opts: SearchOptions = {}) => {
      const cur = live.current;
      const fromHistory = opts.fromHistory ?? false;
      const year = opts.year ?? cur.selectedYear;
      const field = opts.field ?? cur.selectedField;
      // Remap a query typed in a Cyrillic keyboard layout to Latin.
      const query = convertKeyboardLayout(opts.query ?? cur.searchQuery);
      if (query !== cur.searchQuery) setSearchQuery(query);

      // In the collection everything is already loaded, so filter on the client.
      // (A restored URL never targets the collection: that goes via openCollection.)
      if (cur.showCollection && !fromHistory) {
        setTableView(null);
        setFilteredCollectionCars(filterCollection(cur.collectionCars, year, query, field));
        return;
      }

      if (!query) {
        // A year but no query: that year's variants as a table.
        if (year) return openYear(year, fromHistory);
        showWelcome();
        if (!fromHistory) pushUrl({ view: 'welcome' });
        return;
      }

      // Searching across all years requires a few characters.
      if (!year && query.length < MIN_QUERY_LENGTH) {
        setError(t('search.errors.minChars'));
        return;
      }

      await load(async (isCurrent) => {
        const data = await fetchCars(field, query, year);
        if (!isCurrent()) return;
        closeViews();
        // Model fields (series, wheels) yield a table of matching variants;
        // casting fields (name, designer, description) yield castings.
        if (isModelSearchField(field)) {
          setCars([]);
          setTableView({ kind: 'field', value: query, cars: data, title: { field, query } });
        } else {
          setCastingsTitle({ field, query });
          setCars(data);
        }
        if (!fromHistory) pushUrl({ view: 'grid', year, searchQuery: query, selectedField: field });
      });
    },
    [load, openYear, showWelcome, closeViews]
  );

  // Restore the whole app view from the URL. Used on first load AND on browser
  // Back/Forward. We read window.location — NOT history.state — because Next's
  // App Router overwrites history.state with its own internal object, which
  // would drop our view and leave Back/Forward showing nothing.
  const restoreFromLocation = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const model = params.get('model');
    const series = params.get('series');
    const tag = params.get('tag');
    const view = params.get('view');
    const q = params.get('q') || '';
    // buildViewUrl omits the field param when it's 'name'.
    const field = params.get('field') || 'name';
    const year = params.get('year') || '';

    setSelectedYear(year);
    setSearchQuery(tag ? '' : q);
    setSelectedField(field);
    setPendingCollection(false);

    if (model) openModel(model, params.get('brand') || undefined, true);
    else if (series) openSeries(series, true);
    else if (tag) openTag(tag, true);
    else if (view === 'collection') {
      // Needs the session, which may still be loading: see the effect below.
      showWelcome();
      setPendingCollection(true);
    } else if (q || year) runSearch({ year, query: q, field, fromHistory: true });
    else showWelcome();
  }, [openModel, openSeries, openTag, runSearch, showWelcome]);

  // On mount (shareable links / refresh) and on Back/Forward.
  useEffect(() => {
    restoreFromLocation();
    window.addEventListener('popstate', restoreFromLocation);
    return () => window.removeEventListener('popstate', restoreFromLocation);
  }, [restoreFromLocation]);

  // Open the collection once the session is ready (for a ?view=collection link).
  useEffect(() => {
    if (!pendingCollection || !userId) return;
    setPendingCollection(false);
    openCollection(true);
  }, [pendingCollection, userId, openCollection]);

  // --- top panel ------------------------------------------------------------

  const availableYears = useMemo(
    () =>
      selectedModel
        ? [...new Set(selectedModel.d.flatMap((item) => variantYears(item.y)))].sort()
        : ALL_YEARS,
    [selectedModel]
  );

  const handleSearch = useCallback(() => runSearch(), [runSearch]);

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') runSearch();
    },
    [runSearch]
  );

  // Picking a suggestion searches that exact value.
  const handleSuggestionSelect = useCallback(
    (value: string) => {
      setSearchQuery(value);
      runSearch({ query: value });
    },
    [runSearch]
  );

  const handleYearChange = useCallback(
    (year: string) => {
      setSelectedYear(year);
      if (!selectedModel) runSearch({ year });
    },
    [selectedModel, runSearch]
  );

  // Switching the search parameter: 'year' is a select-only mode, the rest are
  // typed — so the two never apply at once.
  const handleFieldChange = useCallback((field: string) => {
    setSelectedField(field);
    if (field === 'year') setSearchQuery('');
    else setSelectedYear('');
  }, []);

  // The year table is brand-scoped, so a brand switch reloads it.
  const handleBrandChange = useCallback(
    (brand: string) => {
      if (!isBrandScope(brand)) return;
      setSelectedBrandState(brand);
      const tv = live.current.tableView;
      if (tv?.kind === 'year') openYear(tv.value, true, brand);
    },
    [setSelectedBrandState, openYear]
  );

  const handleLogoClick = useCallback(() => {
    setSelectedYear('');
    setSearchQuery('');
    showWelcome();
    pushUrl({ view: 'welcome' });
  }, [showWelcome]);

  const handleCollectionClick = useCallback(() => {
    if (!userId) {
      signIn('google');
      return;
    }
    if (live.current.showCollection) {
      handleLogoClick();
      return;
    }
    openCollection();
  }, [userId, openCollection, handleLogoClick]);

  // --- content --------------------------------------------------------------

  const handleBackToSearch = useCallback(() => {
    setSelectedModel(null);
    const { selectedYear, searchQuery, selectedField } = live.current;
    pushUrl({ view: 'grid', year: selectedYear, searchQuery, selectedField });
  }, []);

  const handleCloseTable = useCallback(() => setTableView(null), []);

  // Clicking a designer lists all of their castings (across all years).
  const handleDesignerClick = useCallback(
    (designer: string) => {
      setSelectedField('designer');
      setSearchQuery(designer);
      setSelectedYear('');
      runSearch({ field: 'designer', query: designer, year: '' });
    },
    [runSearch]
  );

  const handleModelClick = useCallback((car: CarData) => openModel(car.lnk, car.brand), [openModel]);
  const handleSeriesClick = useCallback((series: string) => openSeries(series), [openSeries]);
  const handleYearClick = useCallback((year: string) => openYear(year), [openYear]);
  const handleTagClick = useCallback((tag: string) => openTag(tag), [openTag]);

  // The +/x button on a variant row: add, or (after confirming) remove.
  const handleToggleCollection = useCallback(
    async (itemId: string) => {
      if (!userId) return;
      try {
        if (!collectionIds.has(itemId)) {
          await add(itemId);
          return;
        }
        if (!window.confirm(t('collection.confirmDelete'))) return;
        await remove(itemId);
        // Drop just that variant from the open collection view.
        setCollectionCars((prev) => withoutVariant(prev, itemId));
        setFilteredCollectionCars((prev) => withoutVariant(prev, itemId));
      } catch (err) {
        console.error(err);
        setError(t(collectionIds.has(itemId) ? 'collection.errors.failedToRemove' : 'collection.errors.failedToAdd'));
      }
    },
    [userId, collectionIds, add, remove]
  );

  return {
    // search / top panel
    selectedField,
    handleFieldChange,
    selectedBrand,
    handleBrandChange,
    selectedYear,
    searchQuery,
    setSearchQuery,
    availableYears,
    handleSearch,
    handleKeyPress,
    handleYearChange,
    handleSuggestionSelect,
    handleLogoClick,
    handleCollectionClick,
    // content
    error,
    loading,
    tableView,
    showCollection,
    selectedModel,
    cars,
    castingsTitle,
    filteredCollectionCars,
    collection: collectionIds,
    sortConfig,
    setSortConfig,
    handleToggleCollection,
    handleSeriesClick,
    handleDesignerClick,
    handleYearClick,
    handleTagClick,
    handleModelClick,
    handleBackToSearch,
    handleCloseTable,
  };
}
