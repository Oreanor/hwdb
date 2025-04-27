'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import CarCard from './CarCard';

interface Car {
  l: string;  // link (fandom_url)
  i?: string; // image (image_url)
}

interface YearData {
  year: number;
  data: Car[];
}

interface Stats {
  totalUnique: number;
  yearStats: Map<number, number>;
}

export default function CarVisualization() {
  const [yearsData, setYearsData] = useState<YearData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [stats, setStats] = useState<Stats>({ totalUnique: 0, yearStats: new Map() });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value.toLowerCase());
  }, []);

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setSearchTerm('');
    setSearchInput('');
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  // Filter years and cars based on search term
  const filteredYearsData = useMemo(() => {
    if (!searchTerm) return yearsData;

    return yearsData.map(yearData => ({
      ...yearData,
      data: yearData.data.filter(car => {
        const carName = car.l ? 
          decodeURIComponent(car.l.split('/').pop() || '').replace(/_/g, ' ').toLowerCase() 
          : '';
        return carName.includes(searchTerm);
      })
    })).filter(yearData => yearData.data.length > 0);
  }, [yearsData, searchTerm]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data');
        const data = await response.json() as YearData[];
        
        // Calculate statistics
        const uniqueLinks = new Set<string>();
        const yearStats = new Map<number, number>();
        
        data.forEach(yearData => {
          const uniqueYearLinks = new Set(yearData.data.map(car => car.l));
          yearStats.set(yearData.year, uniqueYearLinks.size);
          yearData.data.forEach(car => uniqueLinks.add(car.l));
        });

        setStats({
          totalUnique: uniqueLinks.size,
          yearStats
        });
        
        setYearsData(data);
        
        if (data.length > 0) {
          setSelectedYear(data[0].year);
        }
      } catch (error) {
        console.error('Error loading car data:', error);
      }
    };

    fetchData();
  }, []);

  const currentYearData = filteredYearsData.find(year => year.year === selectedYear);
  const allSearchResults = useMemo(() => {
    if (!searchTerm) return null;
    
    return filteredYearsData.flatMap(yearData => 
      yearData.data.map((car, index) => ({
        car,
        year: yearData.year,
        index
      }))
    );
  }, [filteredYearsData, searchTerm]);

  return (
    <div className="flex h-screen">
      <div className="w-1/6 bg-gray-100 p-4 overflow-y-auto">
        <h2 className="font-bold mb-4">
          Total records: {yearsData.reduce((sum, year) => sum + year.data.length, 0)}
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Unique models: {stats.totalUnique}
        </p>
        <div className="mb-4 flex gap-1">
          <input
            type="text"
            placeholder="Search cars..."
            className="w-[calc(100%-2rem)] px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            onChange={(e) => setSearchInput(e.target.value)}
            value={searchInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchInput);
              }
            }}
          />
          <button
            onClick={() => handleSearch(searchInput)}
            className="w-8 h-8 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center cursor-pointer"
            title="Search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
        <div className="space-y-2">
          {filteredYearsData.map((yearData) => (
            <button
              key={yearData.year}
              onClick={() => handleYearSelect(yearData.year)}
              className={`w-full p-2 rounded cursor-pointer ${
                selectedYear === yearData.year
                  ? 'bg-blue-500 text-white'
                  : 'bg-white hover:bg-gray-200'
              }`}
            >
              <span className="font-bold">{yearData.year}</span>{' '}
              <span className="text-sm">
                ({yearData.data.length}/{stats.yearStats.get(yearData.year) || 0})
              </span>
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="w-5/6 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {searchTerm 
            ? `Search results: ${allSearchResults?.length || 0} models`
            : `Cars from ${selectedYear} (${currentYearData?.data.length || 0} models)`
          }
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {searchTerm ? (
            allSearchResults?.map(({ car, year, index }) => (
              <CarCard
                key={`${year}-${index}`}
                car={car}
                year={year}
                index={index}
                showYear={true}
              />
            ))
          ) : (
            currentYearData?.data.map((car, index) => (
              <CarCard
                key={`${selectedYear}-${index}`}
                car={car}
                year={selectedYear}
                index={index}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
} 