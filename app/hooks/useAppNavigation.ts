'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { t } from '../i18n';
import { convertKeyboardLayout } from '../utils';
import { carMatchesQuery, tokenize } from '../lib/carSearch';
import { keepVariants } from '../lib/seriesCategory';
import { variantHasYear, variantYears } from '../lib/years';
import { tagLabel } from '../lib/tags';
import { BrandScope, isBrandScope } from '../lib/brands';
import { pushUrl } from '../lib/navigation';
import { ALL_YEARS, FILTER_STORAGE_KEYS, isModelSearchField } from '../consts';
import { CarData, SortConfig, TableView, ResultTitle } from '../types';
import {
  fetchCars,
  fetchCarByLnk,
  fetchVariantsByIds,
  fetchSeriesCars,
  fetchYearCars,
} from '../services/carService';
import { addToCollection, getCollection, removeFromCollection } from '../services/collectionService';
import { usePersistedState } from './usePersistedState';

export type { BrandScope };

type SearchOptions = { year?: string; query?: string; field?: string; fromHistory?: boolean };

// Client-side filter of an already-loaded collection (same matching as the server search).
function filterCollection(cars: CarData[], year: string, field: string, query: string): CarData[] {
  let result = year ? keepVariants(cars, (v) => variantHasYear(v.y, year)) : cars;
  if (query) {
    const words = tokenize(query);
    result = result.filter((car) => carMatchesQuery(car, field, words, query));
  }
  return result;
}

// Owns the app's search / view / collection state, the handlers that drive it,
// and the URL <-> state syncing (shareable links, Back/Forward). The page just
// wires the returned values into <TopPanel> and <MainContent>.
export function useAppNavigation() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // What is shown. Priority (see MainContent): tableView > collection > model > castings > welcome.
  const [cars, setCars] = useState<CarData[]>([]);
  const [castingsTitle, setCastingsTitle] = useState<ResultTitle | null>(null);
  const [tableView, setTableView] = useState<TableView | null>(null);
  const [selectedModel, setSelectedModel] = useState<CarData | null>(null);
  const [showCollection, setShowCollection] = useState(false);
  const [filteredCollectionCars, setFilteredCollectionCars] = useState<CarData[]>([]);
  const [collection, setCollection] = useState<string[]>([]);
  const [pendingCollection, setPendingCollection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // The top panel's inputs.
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedField, setSelectedField] = useState('name');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedBrand, setSelectedBrand] = usePersistedState<BrandScope>(FILTER_STORAGE_KEYS.brand, 'all', isBrandScope);

  // Values the stable handlers read at call time, so they don't have to be
  // re-created (and re-render the heavy lists) on every keystroke.
  const latest = useRef({ selectedYear, searchQuery, selectedField, selectedBrand });
  latest.current = { selectedYear, searchQuery, selectedField, selectedBrand };

  useEffect(() => {
    if (!userId) {
      setCollection([]);
      return;
    }
    getCollection(userId)
      .then(setCollection)
      .catch((err) => console.error('Failed to load collection ids', err));
  }, [userId]);

  // Runs one load with the shared spinner + error handling. Details go to the
  // console; the user sees a translated message.
  const run = useCallback(async (task: () => Promise<void>, errorKey = 'search.errors.failedToLoad') => {
    setLoading(true);
    setError(null);
    try {
      await task();
    } catch (err) {
      console.error(err);
      setError(t(errorKey));
    } finally {
      setLoading(false);
    }
  }, []);

  const openSeries = useCallback(
    (series: string, push = true) => {
      setSelectedModel(null);
      return run(async () => {
        setTableView({ kind: 'series', value: series, cars: await fetchSeriesCars(series) });
        if (push) pushUrl({ view: 'series', series });
      });
    },
    [run]
  );

  const openYear = useCallback(
    (year: string, push = true) => {
      setSelectedModel(null);
      setShowCollection(false);
      setSelectedYear(year);
      setCars([]);
      return run(async () => {
        setTableView({ kind: 'year', value: year, cars: await fetchYearCars(year, latest.current.selectedBrand) });
        if (push) pushUrl({ view: 'year', year });
      });
    },
    [run]
  );

  // Browse castings by a tag query (home page / model page chips), e.g. "th:Supercar,mk:Nissan".
  const openTag = useCallback(
    (tag: string, push = true) => {
      setSelectedModel(null);
      setTableView(null);
      setShowCollection(false);
      setSearchQuery('');
      setCars([]);
      return run(async () => {
        const data = await fetchCars('tag', tag);
        setCastingsTitle({ text: tagLabel(tag) });
        setCars(data);
        if (push) pushUrl({ view: 'grid', tag });
      });
    },
    [run]
  );

  // A server search. Model fields (series, wheels) yield a table of matching
  // variants; casting fields (name, designer, description) yield castings.
  const searchServer = useCallback(
    (field: string, query: string, year: string, push = true) => {
      setSelectedModel(null);
      setTableView(null);
      setCars([]);
      return run(async () => {
        const data = await fetchCars(field, query, year);
        if (isModelSearchField(field)) {
          setTableView({ kind: 'field', value: query, cars: data, title: { field, query } });
        } else {
          setCastingsTitle({ field, query });
          setCars(data);
        }
        if (push) pushUrl({ view: 'grid', year, searchQuery: query, selectedField: field });
      });
    },
    [run]
  );

  const openCollection = useCallback(
    (uid: string) =>
      run(async () => {
        const ids = await getCollection(uid);
        const variants = await fetchVariantsByIds(ids);
        setCollection(ids);
        setCars(variants);
        setFilteredCollectionCars(variants);
        setShowCollection(true);
      }, 'search.errors.failedToLoadCollection'),
    [run]
  );

  // The search button / Enter / a picked suggestion / a picked year.
  const handleSearch = (opts: SearchOptions = {}) => {
    const year = opts.year ?? selectedYear;
    const field = opts.field ?? selectedField;
    const push = !opts.fromHistory;
    const query = convertKeyboardLayout(opts.query ?? searchQuery);
    if (query !== searchQuery) setSearchQuery(query);
    setTableView(null);

    // The collection is already loaded: filter it on the client.
    if (showCollection) {
      setFilteredCollectionCars(filterCollection(cars, year, field, query));
      return;
    }
    if (!query) {
      if (year) {
        openYear(year, push);
      } else {
        setError(null);
        setCars([]);
        if (push) pushUrl({ view: 'welcome' });
      }
      return;
    }
    // Searching across all years needs at least 3 characters.
    if (!year && query.length < 3) {
      setError(t('search.errors.minChars'));
      setCars([]);
      return;
    }
    searchServer(field, query, year, push);
  };

  // Restore the whole view from the URL: on first load AND on Back/Forward. We
  // read window.location, not history.state — Next's App Router overwrites
  // history.state with its own object.
  const restoreFromLocation = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const model = params.get('model');
    const series = params.get('series');
    const tag = params.get('tag');
    const view = params.get('view');
    const q = params.get('q') || '';
    // buildViewUrl omits `field` for a name search, so a missing field means 'name'.
    const field = params.get('field') || 'name';
    const year = params.get('year') || '';

    setTableView(null);
    setSelectedModel(null);
    setShowCollection(false);
    setError(null);
    setSelectedYear(year);
    setSearchQuery(tag ? '' : q);
    setSelectedField(field);

    if (model) {
      run(async () => setSelectedModel(await fetchCarByLnk(model, params.get('brand') || undefined)));
    } else if (series) {
      openSeries(series, false);
    } else if (tag) {
      openTag(tag, false);
    } else if (view === 'collection') {
      setPendingCollection(true); // opened once the session is known
    } else if (q) {
      searchServer(field, q, year, false);
    } else if (year) {
      openYear(year, false);
    } else {
      setCars([]);
    }
  }, [run, openSeries, openTag, openYear, searchServer]);

  useEffect(() => {
    restoreFromLocation();
    window.addEventListener('popstate', restoreFromLocation);
    return () => window.removeEventListener('popstate', restoreFromLocation);
  }, [restoreFromLocation]);

  // A shared ?view=collection link: open it once the session is ready.
  useEffect(() => {
    if (!pendingCollection || !userId) return;
    setPendingCollection(false);
    openCollection(userId);
  }, [pendingCollection, userId, openCollection]);

  const handleModelClick = useCallback(
    (car: CarData) =>
      run(async () => {
        const full = await fetchCarByLnk(car.lnk, car.brand);
        setTableView(null);
        setSelectedModel(full);
        const { selectedYear, searchQuery, selectedField } = latest.current;
        pushUrl({ view: 'model', model: car.lnk, brand: car.brand, year: selectedYear, searchQuery, selectedField });
      }),
    [run]
  );

  const handleDesignerClick = useCallback(
    (designer: string) => {
      setShowCollection(false);
      setSelectedField('designer');
      setSearchQuery(designer);
      setSelectedYear('');
      searchServer('designer', designer, '');
    },
    [searchServer]
  );

  const handleBackToSearch = () => {
    setSelectedModel(null);
    pushUrl({ view: 'grid', year: selectedYear, searchQuery, selectedField });
  };

  const handleCollectionClick = () => {
    if (!userId) {
      signIn('google');
      return;
    }
    setTableView(null);
    setSelectedModel(null);
    setSelectedYear('');
    setSearchQuery('');
    if (showCollection) {
      setShowCollection(false);
      setCars([]);
      setFilteredCollectionCars([]);
      pushUrl({ view: 'welcome' });
    } else {
      openCollection(userId);
      pushUrl({ view: 'collection' });
    }
  };

  const handleLogoClick = () => {
    setTableView(null);
    setSelectedModel(null);
    setShowCollection(false);
    setSelectedYear('');
    setSearchQuery('');
    setError(null);
    setCars([]);
    pushUrl({ view: 'welcome' });
  };

  const handleAddToCollection = useCallback(
    async (itemId: string) => {
      if (!userId) return;
      const removing = collection.includes(itemId);
      if (removing && !window.confirm(t('collection.confirmDelete'))) return;
      try {
        if (removing) {
          setCollection(await removeFromCollection(userId, itemId));
          const drop = (prev: CarData[]) => keepVariants(prev, (v) => v.id !== itemId);
          setCars(drop);
          setFilteredCollectionCars(drop);
        } else {
          setCollection(await addToCollection(userId, itemId));
        }
      } catch (err) {
        console.error(err);
        setError(t(removing ? 'collection.errors.failedToRemove' : 'collection.errors.failedToAdd'));
      }
    },
    [userId, collection]
  );

  // Year picker options: the open casting's own years, or every year.
  const availableYears = useMemo(
    () => (selectedModel ? [...new Set(selectedModel.d.flatMap((v) => variantYears(v.y)))].sort() : ALL_YEARS),
    [selectedModel]
  );

  return {
    // top panel
    selectedField,
    selectedBrand,
    selectedYear,
    searchQuery,
    availableYears,
    setSearchQuery,
    handleBrandChange: (brand: string) => isBrandScope(brand) && setSelectedBrand(brand),
    // 'year' is a select-only mode, the rest are typed — the two never apply at once.
    handleFieldChange: (field: string) => {
      setSelectedField(field);
      if (field === 'year') setSearchQuery('');
      else setSelectedYear('');
    },
    handleYearChange: (year: string) => {
      setSelectedYear(year);
      if (!selectedModel) handleSearch({ year });
    },
    handleSearch: () => handleSearch(),
    handleSuggestionSelect: (value: string) => {
      setSearchQuery(value);
      handleSearch({ query: value });
    },
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
    collection,
    sortConfig,
    setSortConfig,
    isLoggedIn: !!userId,
    handleAddToCollection,
    handleSeriesClick: openSeries,
    handleYearClick: openYear,
    handleTagClick: openTag,
    handleDesignerClick,
    handleModelClick,
    handleBackToSearch,
    handleCloseTable: () => setTableView(null),
  };
}
