'use client';

import { useState, useCallback } from 'react';
import TopPanel from './components/TopPanel';
import WelcomeMessage from './components/WelcomeMessage';
import ImageModal from './components/ImageModal';
import { CarData } from './types';
import { fetchCars } from './services/carService';
import { SEARCH_FIELDS } from './consts';
import ModelsGrid from './components/ModelsGrid';
import ModelDescription from './components/ModelDescription';

type SortConfig = {
  field: string;
  direction: 'asc' | 'desc';
} | null;

export default function Home() {
  const [cars, setCars] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedField, setSelectedField] = useState<string | undefined>(SEARCH_FIELDS[0].key);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [selectedModel, setSelectedModel] = useState<CarData | null>(null);

  const handleSearch = useCallback(async (year?: string) => {
    // Используем переданный год или текущий из состояния
    const searchYear = year ?? selectedYear;
    
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
  }, [selectedField, searchQuery, selectedYear]);

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

  const handleModelClick = (car: CarData) => {
    setSelectedModel(car);
  };

  const handleBackClick = () => {
    setSelectedModel(null);
  };

  const handleLogoClick = () => {
    setSelectedYear('');
    setSearchQuery('');
    setSelectedModel(null);
    setCars([]);
  };

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="h-[80px]">
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
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="p-4 mb-4 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-lg text-gray-600 h-full">
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
              className={`flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer ${!selectedModel ? 'invisible' : ''}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to models
            </button>
            {selectedModel && (
              <ModelDescription 
                model={selectedModel}
                cars={cars}
                onImageClick={handleImageClick}
                sortConfig={sortConfig}
                onSortChange={setSortConfig}
                selectedYear={selectedYear}
                onYearChange={handleYearChange}
              />
            )}
            <div className={selectedModel ? 'hidden' : ''}>
              <ModelsGrid 
                cars={cars}
                onModelClick={handleModelClick}
                selectedYear={selectedYear}
              />
            </div>
          </div>
        ) : (
          <WelcomeMessage />
        )}
      </div>
    </div>
  );
}
