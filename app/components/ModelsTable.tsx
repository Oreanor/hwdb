import Image from 'next/image';
import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { CarData, CarDataItem } from '../types';
import { getImageUrl, formatCarName } from '../utils/utils';
import { FIELD_ORDER } from '../consts';

const COLLAPSED_COLUMNS_COOKIE = 'hwdb_collapsed_columns';
const ITEMS_PER_PAGE = 5;

type SortConfig = {
  field: string;
  direction: 'asc' | 'desc';
} | null;

interface ModelsTableProps {
  cars: CarData[];
  onImageClick: (url: string) => void;
  sortConfig: SortConfig;
}

interface TableRowProps {
  car: CarData;
  item: CarDataItem;
  index: number;
  availableFields: Array<(typeof FIELD_ORDER)[number]>;
  collapsedColumns: Set<string>;
  onImageClick: (url: string) => void;
}

const TableRow = memo(({ car, item, index, availableFields, collapsedColumns, onImageClick }: TableRowProps) => {
  const imageUrl = useMemo(() => getImageUrl(item), [item]);
  const formattedName = useMemo(() => formatCarName(car.lnk), [car.lnk]);

  return (
    <tr key={`${car.lnk}-${index}`} className="hover:bg-gray-50">
      <td className="p-2 whitespace-nowrap">
        {imageUrl && (
          <div 
            className="w-16 h-16 relative cursor-pointer"
            onClick={() => onImageClick(imageUrl)}
          >
            <Image
              src={imageUrl}
              alt={`${formattedName} - ${item.y}`}
              fill
              style={{ objectFit: 'contain' }}
              sizes="64px"
            />
          </div>
        )}
      </td>
      <td className="p-2 text-sm text-gray-900 break-words">{formattedName}</td>
      {availableFields.map(field => (
        <td 
          key={field.key} 
          className={`p-2 text-sm text-gray-900 ${
            collapsedColumns.has(field.key) ? 'w-[2%] p-0 bg-gray-50' : 'break-words'
          }`}
        >
          <div className={collapsedColumns.has(field.key) ? 'h-0 overflow-hidden' : ''}>
            {(item[field.key] as string) || '-'}
          </div>
        </td>
      ))}
    </tr>
  );
});

TableRow.displayName = 'TableRow';

const ModelsTable: React.FC<ModelsTableProps> = ({ cars, onImageClick, sortConfig }) => {
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Загружаем состояние при монтировании
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(COLLAPSED_COLUMNS_COOKIE);
      if (savedState) {
        setCollapsedColumns(new Set(JSON.parse(savedState)));
      }
    } catch (e) {
      console.error('Failed to load collapsed columns state:', e);
    }
  }, []);

  // Сбрасываем страницу при изменении данных или сортировки
  useEffect(() => {
    setCurrentPage(1);
  }, [cars, sortConfig]);

  const toggleColumn = useCallback((fieldKey: string) => {
    setCollapsedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldKey)) {
        newSet.delete(fieldKey);
      } else {
        newSet.add(fieldKey);
      }
      // Сохраняем состояние при изменении
      try {
        localStorage.setItem(COLLAPSED_COLUMNS_COOKIE, JSON.stringify(Array.from(newSet)));
      } catch (e) {
        console.error('Failed to save collapsed columns state:', e);
      }
      return newSet;
    });
  }, []);

  // Получаем только те поля, которые есть в данных
  const availableFields = useMemo(() => 
    FIELD_ORDER.filter(field => 
      cars.some(car => car.d.some(item => item[field.key] !== undefined))
    ),
    [cars]
  );

  const allRows = useMemo(() => {
    const rows = cars.flatMap(car => 
      car.d.map((item, index) => ({
        car,
        item,
        index
      }))
    );

    if (sortConfig) {
      rows.sort((a, b) => {
        let aValue: string;
        let bValue: string;

        if (sortConfig.field === 'model') {
          aValue = formatCarName(a.car.lnk);
          bValue = formatCarName(b.car.lnk);
        } else {
          aValue = (a.item[sortConfig.field as keyof CarDataItem] as string) || '';
          bValue = (b.item[sortConfig.field as keyof CarDataItem] as string) || '';
        }

        if (aValue === bValue) return 0;
        
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return rows;
  }, [cars, sortConfig]);

  const totalPages = Math.ceil(allRows.length / ITEMS_PER_PAGE);
  
  const visibleRows = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return allRows
      .slice(startIndex, startIndex + ITEMS_PER_PAGE)
      .map(({ car, item, index }) => (
        <TableRow
          key={`${car.lnk}-${index}`}
          car={car}
          item={item}
          index={index}
          availableFields={availableFields}
          collapsedColumns={collapsedColumns}
          onImageClick={onImageClick}
        />
      ));
  }, [allRows, currentPage, availableFields, collapsedColumns, onImageClick]);

  return (
    <div className="overflow-hidden flex flex-col">
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
          <div><p className="text-sm text-gray-700">Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, allRows.length)} of {allRows.length} results</p></div>
          <div className="flex flex-1 items-center">
            
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`cursor-pointer relative inline-flex items-center rounded px-2 py-1 text-sm font-medium ${
                  currentPage === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`cursor-pointer relative inline-flex items-center rounded px-2 py-1 text-sm font-medium ${
                  currentPage === totalPages 
                    ? 'bg-gray-300 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
          </div>
        </div>
      )}
      <div className="overflow-y-auto flex-1">
        <table className="w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-[10%]">Photo</th>
              <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 w-[15%]">Model</th>
              {availableFields.map(field => (
                <th 
                  key={field.key}
                  className={`p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors ${
                    collapsedColumns.has(field.key) ? 'w-[2%]' : 'w-[7.5%]'
                  }`}
                  onClick={() => toggleColumn(field.key)}
                  title={collapsedColumns.has(field.key) ? 'Expand' : 'Collapse'}
                >
                  {collapsedColumns.has(field.key) ? field.label[0] : field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {visibleRows}
          </tbody>
        </table>
      </div>
      
    </div>
  );
};

export default memo(ModelsTable); 