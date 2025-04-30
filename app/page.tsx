'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import ModelsTable from './components/ModelsTable';
import TopPanel from './components/TopPanel';
import { CarData } from './types';
import { fetchCars } from './services/carService';
import { SEARCH_FIELDS, FIELD_ORDER } from './consts';
import ModelsGrid from './components/ModelsGrid';

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
  const [isCompactView, setIsCompactView] = useState(false);

  // Получаем только те поля, которые есть в данных
  const availableFields = useMemo(() => 
    FIELD_ORDER.filter(field => 
      cars.some(car => car.d.some(item => item[field.key] !== undefined))
    ),
    [cars]
  );

  const handleSearch = useCallback(async (year?: string) => {
    // Используем переданный год или текущий из состояния
    const searchYear = year ?? selectedYear;
    
    // Если выбран конкретный год - поиск разрешен всегда
    // Если год не выбран (все годы) - нужен поисковый запрос не менее 3 символов
    if (!searchYear && searchQuery.length < 3) {
      setError('Please enter at least 3 characters for search or select a specific year');
      setCars([]); // Очищаем результаты
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCars(selectedField, searchQuery, searchYear);
      setCars(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCars([]); // Очищаем результаты при ошибке
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
    // Передаем новое значение года напрямую в handleSearch
    handleSearch(year);
  };

  const handleImageClick = (url: string) => {
    setSelectedImage(url);
  };

  return (
    <div className="p-5 min-h-screen flex flex-col gap-5">
      <TopPanel
        selectedField={selectedField}
        selectedYear={selectedYear}
        searchQuery={searchQuery}
        sortConfig={sortConfig}
        isCompactView={isCompactView}
        availableFields={availableFields}
        onFieldChange={setSelectedField}
        onYearChange={handleYearChange}
        onSearchChange={setSearchQuery}
        onSortChange={setSortConfig}
        onCompactViewChange={setIsCompactView}
        onSearch={() => handleSearch()}
        onKeyPress={handleKeyPress}
      />

      <div className="pt-24 flex-1 flex flex-col min-w-0 overflow-y-auto">
        {error && (
          <div className="p-4 mb-4 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-lg text-gray-600">
            Loading...
          </div>
        ) : cars.length > 0 ? (
          <div className="flex-1">
            {selectedImage && (
              <div 
                className="fixed inset-0 flex items-center justify-center z-50"
                onClick={() => setSelectedImage(null)}
              >
                <div className="relative w-3/4 h-3/4 p-4">
                  <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl border-4 border-white bg-white">
                    <Image
                      src={selectedImage}
                      alt="Enlarged car image"
                      fill
                      style={{ objectFit: 'contain' }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                </div>
              </div>
            )}
            {isCompactView ? (
              <ModelsGrid 
                cars={cars}
                selectedYear={selectedYear}
                onImageClick={handleImageClick}
              />
            ) : (
              <ModelsTable 
                cars={cars} 
                onImageClick={handleImageClick} 
                sortConfig={sortConfig}
              />
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
            <div className="w-16 h-16 mb-4 relative">
              <Image
                src="/rth-logo.webp"
                alt="RTH Logo"
                fill
                style={{ objectFit: 'contain' }}
                sizes="64px"
              />
            </div>
            <p className="text-2xl mb-2">Welcome to HWDB</p>
            <p className="text-sm">Enter your search query to find Hot Wheels models</p>
          </div>
        )}
      </div>
    </div>
  );
}
