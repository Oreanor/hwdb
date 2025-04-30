import { CarData } from '../types';
import { formatCarName } from '../utils';
import { useState, useMemo } from 'react';
import ModelsTable from './ModelsTable';
import { decodeHtmlEntities } from '../utils';
import TopPanel from './TopPanel';

type SortConfig = {
  field: string;
  direction: 'asc' | 'desc';
} | null;

interface ModelDescriptionProps {
  model: CarData;
  cars: CarData[];
  onImageClick: (url: string) => void;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig | ((prev: SortConfig) => SortConfig)) => void;
  selectedYear?: string;
  onYearChange: (year: string) => void;
}

export default function ModelDescription({ 
  model, 
  cars, 
  onImageClick, 
  sortConfig, 
  onSortChange,
  selectedYear,
  onYearChange
}: ModelDescriptionProps) {
  const [expandedDescription, setExpandedDescription] = useState(false);

  const availableYears = useMemo(() => {
    // Получаем все года из всех вариантов модели
    const allYears = model.d
      .map(item => item.y)
      .filter(year => year && year !== 'FTE') // Исключаем пустые года и FTE
      .filter((year, index, self) => self.indexOf(year) === index) // Убираем дубликаты
      .sort((a, b) => b.localeCompare(a)); // Сортируем по убыванию
    
    return allYears;
  }, [model]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 p-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCarName(model.lnk)}</h1>
        <div className="text-sm text-gray-800 dark:text-gray-200"><span className='font-bold'>Number: </span>{model.num}</div>
        <div className="text-sm text-gray-800 dark:text-gray-200"><span className='font-bold'>Designer: </span>{model.ds}</div>
        <div className="text-sm max-w-[1000px] text-gray-800 dark:text-gray-200">
          <span className='font-bold'>Description: </span>
          {expandedDescription ? (
            <>
              <span>{decodeHtmlEntities(model.dsc)}</span>
              <button
                onClick={() => setExpandedDescription(false)}
                className="ml-2 underline hover:text-gray-600 dark:hover:text-gray-400 text-xs cursor-pointer"
              >
                Less
              </button>
            </>
          ) : (
            <>
              <span className="inline-block">
                {model.dsc && model.dsc.length > 100 ? `${decodeHtmlEntities(model.dsc).substring(0, 100)}...` : decodeHtmlEntities(model.dsc)}
              </span>
              {model.dsc && model.dsc.length > 100 && (
                <button
                  onClick={() => setExpandedDescription(true)}
                  className="ml-2 underline hover:text-gray-600 dark:hover:text-gray-400 text-xs cursor-pointer"
                >
                  More
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <ModelsTable 
        cars={cars.filter(car => car.lnk === model.lnk)}
        onImageClick={onImageClick}
        sortConfig={sortConfig}
        onSortChange={onSortChange}
        selectedYear={selectedYear}
      />
      <TopPanel
        selectedField=""
        selectedYear={selectedYear || ''}
        searchQuery=""
        onFieldChange={() => {}}
        onYearChange={onYearChange}
        onSearchChange={() => {}}
        onSearch={() => {}}
        onKeyPress={() => {}}
        availableYears={availableYears}
      />
    </div>
  );
} 