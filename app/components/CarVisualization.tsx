'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { getFandomUrl, getImageUrl } from '../consts';

// Simple debounce implementation
const useDebounce = (callback: (value: string) => void, delay: number) => {
  const timeoutRef = useRef<number | undefined>(undefined);

  return useCallback((value: string) => {
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => callback(value), delay);
  }, [callback, delay]);
};

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

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value.toLowerCase());
  }, []);

  const debouncedSearch = useDebounce(handleSearch, 300);

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

  return (
    <div className="flex h-screen">
      <div className="w-1/6 bg-gray-100 p-4 overflow-y-auto">
        <h2 className="font-bold mb-4">
          Total: {stats.totalUnique}
        </h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search cars..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          {filteredYearsData.map((yearData) => (
            <button
              key={yearData.year}
              onClick={() => setSelectedYear(yearData.year)}
              className={`w-full p-2 rounded ${
                selectedYear === yearData.year
                  ? 'bg-blue-500 text-white'
                  : 'bg-white hover:bg-gray-200'
              }`}
            >
              {yearData.year} ({yearData.data.length})
            </button>
          ))}
        </div>
      </div>

      <div className="w-5/6 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          Cars from {selectedYear} ({currentYearData?.data.length || 0} models)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {currentYearData?.data.map((car, index) => {
            const carName = car.l ? decodeURIComponent(car.l.split('/').pop() || '').replace(/_/g, ' ') : 'Unknown Car';
            const fandomUrl = car.l ? getFandomUrl(car.l.split('/').pop() || '') : '';
            const imageUrl = car.i ? getImageUrl(car.i) : '';

            return (
              <div
                key={`${selectedYear}-${index}`}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow flex flex-col"
              >
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt={carName}
                    className="w-full h-32 object-contain rounded mb-1"
                    onError={(e) => {
                      console.error('Image load error:', imageUrl);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <h3 className="font-semibold text-sm mb-1">{carName}</h3>
                {fandomUrl && (
                  <Link
                    href={fandomUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 text-xs"
                  >
                    View on Fandom
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 