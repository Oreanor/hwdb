'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { t } from '../i18n';
import { convertKeyboardLayout } from '../utils';
import { carMatchesQuery, tokenize } from '../lib/carSearch';
import {
  fetchCars,
  fetchCarByLnk,
  fetchVariantsByIds,
  fetchSeriesCars,
  fetchYearCars,
} from '../services/carService';
import { YEARS, isModelSearchField } from '../consts';
import { tagLabel } from '../lib/tags';
import { CarData, SortConfig, TableView } from '../types';
import { addToCollection, getCollection, removeFromCollection } from '../services/collectionService';
import { ViewState, pushUrl } from '../lib/navigation';

// Owns the app's search / view / collection state, the handlers that drive it,
// and the URL <-> state syncing (shareable links, Back/Forward). The page just
// wires the returned values into <TopPanel> and <MainContent>.
export function useAppNavigation() {
  const [cars, setCars] = useState<CarData[]>([]);
  // Header for the castings results view (e.g. "Designer: Larry Wood").
  const [castingsTitle, setCastingsTitle] = useState('');
  const [filteredCollectionCars, setFilteredCollectionCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedField, setSelectedField] = useState<string>('name');
  const [selectedYear, setSelectedYear] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [selectedModel, setSelectedModel] = useState<CarData | null>(null);
  const [showCollection, setShowCollection] = useState(false);
  const { data: session } = useSession();
  const [collection, setCollection] = useState<string[]>([]);
  const [tableView, setTableView] = useState<TableView | null>(null);
  const [pendingCollection, setPendingCollection] = useState(false);

  // Mirror values that click handlers read at call-time, so the handlers stay
  // referentially stable (and don't re-render the heavy lists on every keystroke).
  const navStateRef = useRef({ selectedYear, searchQuery, selectedField });
  navStateRef.current = { selectedYear, searchQuery, selectedField };

  useEffect(() => {
    if (session?.user?.id) {
      getCollection(session.user.id).then(setCollection);
    } else {
      setCollection([]);
    }
  }, [session?.user?.id]);

  const availableYears = useMemo(() => {
    if (selectedModel) {
      return Array.from(new Set(selectedModel.d.map((item) => item.y).filter((year: string) => year))).sort();
    }
    return YEARS.map((year) => year.value);
  }, [selectedModel]);

  // Picking a suggestion searches that exact value (bypassing the stale query state).
  const handleSuggestionSelect = (value: string) => {
    setSearchQuery(value);
    handleSearch(undefined, { query: value });
  };

  // Clicking a series opens a table of every variant of that series.
  const handleSeriesClick = useCallback(async (series: string) => {
    setSelectedModel(null);
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSeriesCars(series);
      setTableView({ kind: 'series', value: series, cars: data });
      pushUrl({ view: 'series', series });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('search.errors.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCloseTable = () => setTableView(null);

  // Browse castings by a tag query (home page chips), e.g. "th:Supercar,mk:Nissan".
  const handleTagClick = useCallback(async (value: string) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedModel(null);
      setTableView(null);
      setShowCollection(false);
      setSearchQuery('');
      const data = await fetchCars('tag', value);
      setCastingsTitle(tagLabel(value));
      setCars(data);
      pushUrl({ view: 'grid', tag: value });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('search.errors.failedToLoad'));
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Clicking a year cell opens the table of that whole year.
  const handleYearClick = useCallback(async (year: string) => {
    setSelectedModel(null);
    setShowCollection(false);
    setSelectedYear(year);
    try {
      setLoading(true);
      setError(null);
      setCars([]);
      const data = await fetchYearCars(year);
      setTableView({ kind: 'year', value: year, cars: data });
      pushUrl({ view: 'year', year });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('search.errors.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Clicking a designer lists all of their castings (across all years).
  const handleDesignerClick = useCallback(async (designer: string) => {
    setTableView(null);
    setSelectedModel(null);
    setShowCollection(false);
    setSelectedField('designer');
    setSearchQuery(designer);
    setSelectedYear('');
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCars('designer', designer, '');
      setCars(data);
      pushUrl({ view: 'grid', year: '', searchQuery: designer, selectedField: 'designer' });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('search.errors.failedToLoad'));
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(
    async (yearArg?: string | React.MouseEvent, opts: { fromHistory?: boolean; query?: string; field?: string } = {}) => {
      const searchYear = typeof yearArg === 'string' ? yearArg : selectedYear;
      // When restoring from history, query/field come from the saved state.
      const fromHistory = opts.fromHistory ?? false;
      const query = opts.query ?? searchQuery;
      const field = opts.field ?? selectedField;

      setTableView(null);

      const pushState = (state: ViewState) => {
        if (!fromHistory) pushUrl(state);
      };

      // In collection mode everything is already loaded, so filter on the client.
      if (showCollection) {
        let filteredCars = cars;
        if (!searchYear && !query) {
          setFilteredCollectionCars(filteredCars);
          return;
        }
        if (searchYear) {
          filteredCars = filteredCars
            .map((car) => ({ ...car, d: car.d.filter((item) => item.y === searchYear) }))
            .filter((car) => car.d.length > 0);
        }
        if (query && query.length > 0) {
          const searchWords = tokenize(query);
          filteredCars = filteredCars.filter((car) => carMatchesQuery(car, field, searchWords, query));
        }
        setFilteredCollectionCars(filteredCars);
        return;
      }

      // A year is selected but no query: show that year's variants as a table.
      if (searchYear && !query) {
        try {
          setLoading(true);
          setError(null);
          setSelectedModel(null);
          setCars([]);
          const data = await fetchYearCars(searchYear);
          setTableView({ kind: 'year', value: searchYear, cars: data });
          pushState({ view: 'year', year: searchYear });
        } catch (err) {
          setError(err instanceof Error ? err.message : t('search.errors.failedToLoad'));
        } finally {
          setLoading(false);
        }
        return;
      }

      // No year and no query: show the welcome screen.
      if (!searchYear && !query) {
        setError(null);
        setCars([]);
        pushState({ view: 'welcome', year: '', searchQuery: '', selectedField: field });
        return;
      }

      // Searching across all years requires at least 3 characters.
      if (!searchYear && query.length < 3) {
        setError(t('search.errors.minChars'));
        setCars([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setSelectedModel(null);
        // Remap the query from a Cyrillic keyboard layout to Latin if needed.
        const convertedQuery = convertKeyboardLayout(query);
        if (convertedQuery !== query) setSearchQuery(convertedQuery);
        const data = await fetchCars(field, convertedQuery, searchYear);
        // Model fields (series, wheels) yield a table of matching variants;
        // casting fields (name, designer, description) yield a grid/table of castings.
        if (isModelSearchField(field)) {
          setCars([]);
          setTableView({
            kind: 'field',
            value: convertedQuery,
            cars: data,
            title: `${t(`search.fields.${field}`)}: ${convertedQuery}`,
          });
        } else {
          setCastingsTitle(`${t(`search.fields.${field}`)}: ${convertedQuery}`);
          setCars(data);
        }
        pushState({ view: 'grid', year: searchYear, searchQuery: convertedQuery, selectedField: field });
      } catch (err) {
        setError(err instanceof Error ? err.message : t('search.errors.failedToLoad'));
        setCars([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedField, searchQuery, selectedYear, showCollection, cars]
  );

  // Restore the whole app view from the URL. Used on first load AND on browser
  // Back/Forward. We read window.location — NOT history.state — because Next's
  // App Router overwrites history.state with its own internal object, which
  // would drop our view and leave Back/Forward showing nothing (refresh worked
  // because that path always read the URL).
  const restoreFromLocation = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const model = params.get('model');
    const series = params.get('series');
    const tag = params.get('tag');
    const view = params.get('view');
    const q = params.get('q') || '';
    // Default to name search on a fresh load; buildViewUrl omits the field param
    // when it's 'name', so a missing field param always means a name search.
    const field = params.get('field') || 'name';
    const year = params.get('year') || '';

    setTableView(null);
    setSelectedModel(null);
    setShowCollection(view === 'collection');
    setSelectedYear(year);
    setSearchQuery(tag ? '' : q);
    setSelectedField(field);

    if (model) {
      setLoading(true);
      fetchCarByLnk(model).then((c) => c && setSelectedModel(c)).finally(() => setLoading(false));
    } else if (series) {
      setLoading(true);
      fetchSeriesCars(series).then((d) => setTableView({ kind: 'series', value: series, cars: d })).finally(() => setLoading(false));
    } else if (tag) {
      setLoading(true);
      fetchCars('tag', tag).then((d) => { setCastingsTitle(tagLabel(tag)); setCars(d); }).finally(() => setLoading(false));
    } else if (year && !q) {
      handleSearch(year, { fromHistory: true, query: '' });
    } else if (view === 'collection') {
      setPendingCollection(true);
    } else if (q) {
      handleSearch(year, { fromHistory: true, query: q, field });
    } else {
      setCars([]); // welcome
    }
  }, [handleSearch]);

  // Run once on mount (shareable links / refresh).
  useEffect(() => {
    restoreFromLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-restore on Back/Forward; re-subscribe when the callback updates so it
  // always closes over the latest handleSearch.
  useEffect(() => {
    window.addEventListener('popstate', restoreFromLocation);
    return () => window.removeEventListener('popstate', restoreFromLocation);
  }, [restoreFromLocation]);

  // Open the collection once the session is ready (for a shared ?view=collection link).
  useEffect(() => {
    if (!pendingCollection || !session?.user?.id) return;
    setPendingCollection(false);
    (async () => {
      try {
        setLoading(true);
        const ids = await getCollection(session.user!.id!);
        setCollection(ids);
        const variants = ids.length ? await fetchVariantsByIds(ids) : [];
        setFilteredCollectionCars(variants);
        setCars(variants);
        setShowCollection(true);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCollection, session?.user?.id]);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const convertedQuery = convertKeyboardLayout(searchQuery);
      if (convertedQuery !== searchQuery) setSearchQuery(convertedQuery);
      handleSearch();
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    if (!selectedModel) handleSearch(year);
  };

  // Switching the search parameter: 'year' is a select-only mode, the rest are
  // typed — so the two never apply at once.
  const handleFieldChange = (field: string) => {
    setSelectedField(field);
    if (field === 'year') setSearchQuery('');
    else setSelectedYear('');
  };

  const handleModelClick = useCallback(async (car: CarData) => {
    try {
      setLoading(true);
      const fullCarData = await fetchCarByLnk(car.lnk);
      setTableView(null);
      setSelectedModel(fullCarData);
      const { selectedYear, searchQuery, selectedField } = navStateRef.current;
      pushUrl({ view: 'model', model: car.lnk, year: selectedYear, searchQuery, selectedField });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('search.errors.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBackToSearch = () => {
    setSelectedModel(null);
    pushUrl({ view: 'grid', year: selectedYear, searchQuery, selectedField });
  };

  const handleCollectionClick = async () => {
    if (!session?.user?.id) {
      signIn('google');
      return;
    }
    setLoading(true);
    setTableView(null);
    try {
      setSelectedYear('');
      setSearchQuery('');
      setSelectedModel(null);
      if (!showCollection) {
        const variants = collection.length > 0 ? await fetchVariantsByIds(collection) : [];
        setFilteredCollectionCars(variants);
        setCars(variants);
        pushUrl({ view: 'collection' });
      } else {
        setFilteredCollectionCars([]);
        setCars([]);
        pushUrl({ view: 'grid', year: selectedYear, searchQuery, selectedField });
      }
      setShowCollection(!showCollection);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('search.errors.failedToLoadCollection'));
      setShowCollection(false);
      setFilteredCollectionCars([]);
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoClick = () => {
    setTableView(null);
    setSelectedYear('');
    setSearchQuery('');
    setSelectedModel(null);
    setShowCollection(false);
    setCars([]);
    pushUrl({ view: 'welcome' });
  };

  const handleAddToCollection = useCallback(
    async (itemId: string) => {
      if (!session?.user?.id) return;
      const isCollected = collection.includes(itemId);
      if (isCollected) {
        if (window.confirm(t('collection.confirmDelete'))) {
          try {
            const updated = await removeFromCollection(session.user.id, itemId);
            setCollection(updated);
            setCars((prev) => prev.filter((car) => !car.d.some((item) => item.id === itemId)));
            setFilteredCollectionCars((prev) => prev.filter((car) => !car.d.some((item) => item.id === itemId)));
          } catch (err) {
            setError(err instanceof Error ? err.message : t('collection.errors.failedToRemove'));
          }
        }
      } else {
        try {
          const updated = await addToCollection(session.user.id, itemId);
          setCollection(updated);
        } catch (err) {
          setError(err instanceof Error ? err.message : t('collection.errors.failedToAdd'));
        }
      }
    },
    [session?.user?.id, collection]
  );

  return {
    // search / top panel
    selectedField,
    setSelectedField,
    handleFieldChange,
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
    collection,
    sortConfig,
    setSortConfig,
    handleAddToCollection,
    handleSeriesClick,
    handleDesignerClick,
    handleYearClick,
    handleTagClick,
    handleModelClick,
    handleBackToSearch,
    handleCloseTable,
    isLoggedIn: !!session?.user?.id,
  };
}
