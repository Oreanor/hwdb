'use client';

import { useState, useCallback, useMemo } from 'react';
import TopPanel from './components/TopPanel';
import WelcomeMessage from './components/WelcomeMessage';
import ImageModal from './components/ImageModal';
import { CarData } from './types';
import { fetchCars, fetchCarByLnk } from './services/carService';
import { YEARS } from './consts';
import ModelsGrid from './components/ModelsGrid';
import ModelDescription from './components/ModelDescription';
import { getCollection } from './utils/collection';
import CollectionTable from './components/CollectionTable';
import { formatCarName } from './utils';

type SortConfig = {
  field: string;
  direction: 'asc' | 'desc';
} | null;

export default function Home() {
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedField, setSelectedField] = useState<string>('name');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [selectedModel, setSelectedModel] = useState<CarData | null>(null);
  const [showCollection, setShowCollection] = useState(false);

  const handleSearch = useCallback(async (year?: string) => {
    console.log('handleSearch', year);
    // Используем переданный год или текущий из состояния
    const searchYear = year ?? selectedYear;
    
    // Если мы в режиме коллекции, фильтруем на фронте
    if (showCollection) {
      const collection = getCollection();
      const lnk = collection.map(item => item.lnk);
      const allCars: CarData[] = await Promise.all(
        lnk.map(link => fetchCarByLnk(link))
      );
      
      // Фильтруем по году и поисковому запросу
      let filteredCars = allCars;
      
      if (searchYear) {
        filteredCars = filteredCars.map(car => ({
          ...car,
          d: car.d.filter(item => item.y === searchYear)
        })).filter(car => car.d.length > 0);
      }
      
      if (searchQuery) {
        const searchValue = searchQuery.toLowerCase();
        filteredCars = filteredCars.map(car => {
          if (selectedField === 'name') {
            const formattedName = formatCarName(car.lnk).toLowerCase();
            return formattedName.includes(searchValue) ? car : { ...car, d: [] };
          }
          return car;
        }).filter(car => car.d.length > 0);
      }
      
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
      setError('Please enter at least 3 characters for search or select a specific year');
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
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, [selectedField, searchQuery, selectedYear, showCollection]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    setSelectedModel(null);
      handleSearch();
  };

  const handleCollectionClick = async () => {
    setLoading(true);
    try {
      setSelectedYear('');
      setSearchQuery('');
    setSelectedModel(null);

      if (!showCollection) {
        // Сбрасываем год и поиск при входе в режим коллекции
        
        const collection = getCollection();
        const lnk = collection.map(item => item.lnk);
        const allCars: CarData[] = await Promise.all(
          lnk.map(link => fetchCarByLnk(link))
        );
        setCars(allCars);
      } else {
        // Сбрасываем год и поиск при выходе из режима коллекции
        setCars([]);
      }
      setShowCollection(!showCollection);
    } catch (error) {
      console.error('Error loading collection:', error);
      setError(error instanceof Error ? error.message : 'Failed to load collection');
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
          onSearch={() => handleSearch()}
          onKeyPress={handleKeyPress}
          onLogoClick={handleLogoClick}
          onCollectionClick={handleCollectionClick}
          availableYears={availableYears}
          showCollection={showCollection}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 sm:p-4">
        {error && (
          <div className="p-4 mb-4 text-red-700 dark:text-red-400 rounded">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-lg text-gray-600 dark:text-gray-400 h-full">
            Loading...
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
              Back to models
                    </button>
           
              {showCollection ? (
                <CollectionTable
                  cars={cars}
                  onImageClick={handleImageClick}
                  sortConfig={sortConfig}
                  onSortChange={setSortConfig}
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