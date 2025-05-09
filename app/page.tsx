'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import TopPanel from './components/TopPanel';
import WelcomeMessage from './components/WelcomeMessage';
import ImageModal from './components/ImageModal';
import { CarData, SortConfig } from './types';
import { fetchCars, fetchCarByLnk, fetchVariantsByIds } from './services/carService';
import { YEARS, MAIN_OBJECT_FIELDS, VARIANT_FIELDS } from './consts';
import ModelsGrid from './components/ModelsGrid';
import ModelDescription from './components/ModelDescription';
import { getCollection } from './services/collectionService';
import CollectionTable from './components/CollectionTable';
import { formatCarName } from './utils';
import { useSession } from 'next-auth/react';
import { signIn } from 'next-auth/react';
import { t } from './i18n';
import { removeFromCollection } from './services/collectionService';

export default function Home() {
  const [cars, setCars] = useState<CarData[]>([]);
  const [originalCollectionCars, setOriginalCollectionCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedField, setSelectedField] = useState<string>('name');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [selectedModel, setSelectedModel] = useState<CarData | null>(null);
  const [showCollection, setShowCollection] = useState(false);
  const [languageKey, setLanguageKey] = useState(0);
  const { data: session } = useSession();

  const handleLanguageChange = () => {
    setLanguageKey(prev => prev + 1);
  };

  const handleSearch = useCallback(async (year?: string | React.MouseEvent) => {
    console.log('handleSearch', year);
    // Используем переданный год или текущий из состояния
    const searchYear = typeof year === 'string' ? year : selectedYear;
    
    // Если мы в режиме коллекции, фильтруем на фронте
    if (showCollection) {
      // Фильтруем по году и поисковому запросу
      let filteredCars = originalCollectionCars;
      
      // Если нет ни года, ни поискового запроса - показываем все
      if (!searchYear && !searchQuery) {
        setCars(originalCollectionCars);
        return;
      }
      
      if (searchYear) {
        console.log('1 searchYear', searchYear);
        filteredCars = filteredCars.map(car => ({
          ...car,
          d: car.d.filter(item => item.y === searchYear)
        })).filter(car => car.d.length > 0);
      }
      
      if (searchQuery && searchQuery.length > 0) {
        console.log('2 searchQuery', searchQuery);
        const searchValue = searchQuery.toLowerCase();
        const searchWords = searchValue.split(/\s+/).filter(word => word.length > 0);
        filteredCars = filteredCars.map(car => {
          if (selectedField === 'name') {
            const formattedName = formatCarName(car.lnk).toLowerCase();
            return searchWords.every(word => formattedName.includes(word)) ? car : { ...car, d: [] };
          }
          
          // Для остальных полей основного объекта
          const mainObjectField = MAIN_OBJECT_FIELDS[selectedField];
          if (mainObjectField) {
            const fieldValue = (car[mainObjectField] as string)?.toLowerCase();
            return fieldValue && searchWords.every(word => fieldValue.includes(word)) ? car : { ...car, d: [] };
          }
          
          // Для полей вариантов
          const variantField = VARIANT_FIELDS[selectedField];
          if (variantField) {
            const hasMatchingVariant = car.d.some(item => {
              const fieldValue = item[variantField];
              if (typeof fieldValue === 'string') {
                const lowerFieldValue = fieldValue.toLowerCase();
                return searchWords.every(word => lowerFieldValue.includes(word));
              }
              return false;
            });
            return hasMatchingVariant ? car : { ...car, d: [] };
          }
          
          return { ...car, d: [] };
        }).filter(car => car.d.length > 0);
      }
      
      console.log('filteredCars2', filteredCars);
      setCars(filteredCars);
      return;
    }
    
    // Если выбран конкретный год и нет поискового запроса - показываем все модели за этот год
    if (searchYear && !searchQuery) {
      try {
        setLoading(true);
        setError(null);
        setSelectedModel(null);
        const data = await fetchCars('year', searchYear, '');
        setCars(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setCars([]);
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // Если год не выбран (все годы) и нет поискового запроса - показываем приветствие
    if (!searchYear && !searchQuery) {
      setError(null);
      setCars([]);
      return;
    }
    
    // Если год не выбран (все годы) и есть поисковый запрос - нужен минимум 3 символа
    if (!searchYear && searchQuery.length < 3) {
      setError(t('search.errors.minChars'));
      setCars([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSelectedModel(null);
      const data = await fetchCars(selectedField, searchQuery, searchYear);
      setCars(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('search.errors.failedToLoad'));
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, [selectedField, searchQuery, selectedYear, showCollection, originalCollectionCars]);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    // Если мы не в просмотре конкретной модели - делаем новый поиск
    if (!selectedModel) {
      handleSearch(year);
    } 
  };

  const handleImageClick = (url: string) => {
    setSelectedImage(url);
  };

  const handleModelClick = async (car: CarData) => {
    try {
      setLoading(true);
      const fullCarData = await fetchCarByLnk(car.lnk);
      setSelectedModel(fullCarData);
      // Добавляем состояние в историю
      window.history.pushState(
        { 
          view: 'model',
          model: car.lnk,
          year: selectedYear,
          searchQuery,
          selectedField
        }, 
        ''
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t('search.errors.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    setSelectedModel(null);
    handleSearch();
    // Добавляем состояние в историю
    window.history.pushState(
      { 
        view: 'grid',
        year: selectedYear,
        searchQuery,
        selectedField
      }, 
      ''
    );
  };

  const handleCollectionClick = async () => {
    if (!session?.user?.id) {
      signIn('google');
      return;
    }

    setLoading(true);
    try {
      setSelectedYear('');
      setSearchQuery('');
      setSelectedModel(null);

      if (!showCollection) {
        const collection = await getCollection(session.user.id);
        let variants: CarData[] = [];
        if (collection.length > 0) {
          variants = await fetchVariantsByIds(collection);
        }
        setOriginalCollectionCars(variants);
        setCars(variants);
        // Добавляем состояние в историю
        window.history.pushState(
          { 
            view: 'collection',
            year: '',
            searchQuery: '',
            selectedField
          }, 
          ''
        );
      } else {
        setCars([]);
        setOriginalCollectionCars([]);
        // Добавляем состояние в историю
        window.history.pushState(
          { 
            view: 'grid',
            year: selectedYear,
            searchQuery,
            selectedField
          }, 
          ''
        );
      }
      setShowCollection(!showCollection);
    } catch (error) {
      console.error('Error loading collection:', error);
      setError(error instanceof Error ? error.message : t('search.errors.failedToLoadCollection'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogoClick = () => {
    setSelectedYear('');
    setSearchQuery('');
    setSelectedModel(null);
    setShowCollection(false);
    setCars([]);
    // Добавляем состояние в историю
    window.history.pushState(
      { 
        view: 'welcome',
        year: '',
        searchQuery: '',
        selectedField: 'name'
      }, 
      ''
    );
  };

  const availableYears = useMemo(() => {
    if (selectedModel) {
      // Get unique years from the selected model's variants using Set
      const years = Array.from(new Set(
        selectedModel.d
          .map(item => item.y)
          .filter((year: string) => year && year !== 'FTE') // Exclude empty years and FTE
      )).sort();
      return years;
    }
    // If no model is selected, return all years
    return YEARS.map(year => year.value);
  }, [selectedModel]);

  // Обработчик навигации по истории
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (!state) return;

      setSelectedYear(state.year || '');
      setSearchQuery(state.searchQuery || '');
      setSelectedField(state.selectedField || 'name');
      setShowCollection(state.view === 'collection');

      if (state.view === 'model' && state.model) {
        fetchCarByLnk(state.model).then(setSelectedModel);
      } else {
        setSelectedModel(null);
        if (state.view === 'grid' || state.view === 'collection') {
          handleSearch(state.year);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handleSearch]);

  // Инициализация начального состояния
  useEffect(() => {
    window.history.replaceState(
      { 
        view: 'welcome',
        year: '',
        searchQuery: '',
        selectedField: 'name'
      }, 
      ''
    );
  }, []);

  // Удаление варианта из коллекции
  const handleRemoveFromCollection = async (id: string) => {
    if (!session?.user?.id) return;
    if (window.confirm('Delete this model from collection?')) {
      try {
        const updatedVariantsIds = await removeFromCollection(session.user.id, id);
        const updatedVariants = await fetchVariantsByIds(updatedVariantsIds);
        setOriginalCollectionCars(updatedVariants);
        setCars(updatedVariants);
      } catch (error) {
        console.error('Error removing from collection:', error);
      }
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-white dark:bg-gray-900">
      <div className="h-[56px] sm:h-[80px]">
        <TopPanel
          selectedField={selectedField}
          selectedYear={selectedYear}
          searchQuery={searchQuery}
          onFieldChange={setSelectedField}
          onYearChange={handleYearChange}
          onSearchChange={setSearchQuery}
          onSearch={handleSearch}
          onKeyPress={handleKeyPress}
          onLogoClick={handleLogoClick}
          onCollectionClick={handleCollectionClick}
          availableYears={availableYears}
          showCollection={showCollection}
          onLanguageChange={handleLanguageChange}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 sm:p-4" key={languageKey}>
        {error && (
          <div className="p-4 mb-4 text-red-700 dark:text-red-400 rounded">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-lg text-gray-600 dark:text-gray-400 h-full">
            {t('common.loading')}
          </div>
        ) : cars.length > 0 ? (
          <div className="flex-1">
            {selectedImage && (
              <ImageModal
                imageUrl={selectedImage}
                onClose={() => setSelectedImage(null)}
              />
            )}
            <button
              onClick={handleBackClick}
              className={`flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer ${!selectedModel ? 'invisible' : ''}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('model.backToModels')}
            </button>
           
            {showCollection ? (
              <CollectionTable
                cars={cars}
                onImageClick={handleImageClick}
                sortConfig={sortConfig}
                onSortChange={setSortConfig}
                onRemoveFromCollection={handleRemoveFromCollection}
                selectedYear={selectedYear}
              />
            ) : (
              <>{selectedModel ? (
                <ModelDescription 
                  model={selectedModel}
                  onImageClick={handleImageClick}
                  sortConfig={sortConfig}
                  onSortChange={setSortConfig}
                  selectedYear={selectedYear}
                />
              ) : (<ModelsGrid 
                cars={cars}
                onModelClick={handleModelClick}
                selectedYear={selectedYear}
              />)}
              </>
            )}
          </div>
        ) : (
          <WelcomeMessage />
        )}
      </div>
    </div>
  );
}