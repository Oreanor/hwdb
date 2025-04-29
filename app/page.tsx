'use client';

import { useState, useEffect } from 'react';
import CarCard from './components/CarCard';
import { CarData } from './types';
import { fetchCars } from './services/carService';


export default function Home() {
  const [cars, setCars] = useState<CarData[]>([]);
  const [selectedYear, setSelectedYear] = useState('1968');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');



  useEffect(() => {
    if (selectedYear !== 'All') {
      setSearchQuery('');
    }

    const loadCars = async () => {
      try {
        setLoading(true);
        const data = await fetchCars(selectedYear === 'All' ? '' : selectedYear, selectedYear === 'All' ? searchQuery : '');
        setCars(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (selectedYear !== 'All' || searchQuery.length >= 3) {
      loadCars();
    }
  }, [selectedYear]);

  const handleSearch = async () => {
    if (searchQuery.length < 3) return;
    setSelectedYear('All');
    try {
      setLoading(true);
      const data = await fetchCars('', searchQuery);
      setCars(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const years = Array.from({ length: 57 }, (_, i) => (1968 + i).toString());

  return (
    <div className="p-5 min-h-screen flex flex-col gap-5">
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-10 p-5 flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="h-10" />
        <h1 className="text-3xl font-bold">HWDB</h1>
        <div className="flex items-center border border-gray-300 rounded">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="px-3 py-2 focus:outline-none"
          />
          <button
            onClick={handleSearch}
            className="px-3 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600"
          >
            🔍
          </button>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
        >
          <option value="All">All</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-24 flex-1 flex flex-col min-w-0 overflow-y-auto">
        {error && (
          <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-lg text-gray-600">
            Loading...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {cars.map((car) => (
              <CarCard key={car.lnk} car={car} selectedYear={selectedYear} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
