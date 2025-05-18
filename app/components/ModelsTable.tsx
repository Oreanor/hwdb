import Image from 'next/image';
import { useState, useMemo, memo, useCallback } from 'react';
import { CarData, CarDataItem, SortConfig } from '../types';
import { formatCarName, getImageUrl } from '../utils';
import { FIELD_ORDER, COLLAPSED_COLUMNS_COOKIE } from '../consts';
import PlusIcon from './icons/PlusIcon';
import { useSession } from 'next-auth/react';
import ImageModal from './ImageModal';


interface ModelsTableProps {
  cars: CarData[];
  onImageClick: (url: string) => void;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig | ((prev: SortConfig) => SortConfig)) => void;
  selectedYear?: string;
  onAddToCollection?: (id: string) => void;
  collection: string[];
}

interface TableRowProps {
  car: CarData;
  item: CarDataItem;
  index: number;
  collapsedColumns: Set<string>;
  onImageClick: (url: string) => void;
  isCollected: boolean;
  onAddToCollection?: (id: string) => void;
}

const TableRow = memo(({ car, item, collapsedColumns, onImageClick, isCollected, onAddToCollection }: TableRowProps) => {
  const [imageError, setImageError] = useState(false);
  const { data: session } = useSession();
  const imageUrl = item.p === 't' ? getImageUrl(item) : undefined;

  return (
    <tr 
      key={`${item.id}`} 
      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
        isCollected ? 'bg-gray-100 dark:bg-gray-700' : ''
      }`}
    >
      {session?.user && (
        <td className="p-2 whitespace-nowrap">
          <button 
            className={`w-6 h-6 transition-colors cursor-pointer ${
              isCollected 
                ? 'text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
            onClick={() => onAddToCollection && item.id && onAddToCollection(item.id)}
          >
            <PlusIcon />
          </button>
        </td>
      )}
      <td className="p-2 whitespace-nowrap">
        <div 
          className="w-16 h-16 relative cursor-pointer"
          onClick={() => imageUrl && onImageClick(imageUrl)}
        >
          {imageUrl && !imageError ? (
            <Image
              src={imageUrl}
              alt={`${formatCarName(car.lnk)}`}
              fill
              className="object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
              <span className="text-gray-400 dark:text-gray-500 text-xs">No image</span>
            </div>
          )}
        </div>
      </td>
      {FIELD_ORDER.map(field => {
        const value = item[field.key] || '-';
        return (
          <td 
            key={field.key} 
            className={`p-2 text-sm text-gray-900 dark:text-gray-200 ${
              collapsedColumns.has(field.key) ? 'w-[40px] min-w-[40px] max-w-[40px] p-0 bg-gray-50 dark:bg-gray-700 overflow-hidden' : 'break-words'
            }`}
          >
            <div className={collapsedColumns.has(field.key) ? 'h-0 overflow-hidden' : ''}>
              {value}
            </div>
          </td>
        );
      })}
    </tr>
  );
});

TableRow.displayName = 'TableRow';

const TableHeader = memo(({ 
  field, 
  sortConfig, 
  onSort, 
  collapsedColumns, 
  onToggleCollapse 
}: { 
  field: (typeof FIELD_ORDER)[number]; 
  sortConfig: SortConfig | null; 
  onSort: (field: string) => void;
  collapsedColumns: Set<string>;
  onToggleCollapse: (field: string) => void;
}) => {
  const isSorted = sortConfig?.field === field.key;
  const isCollapsed = collapsedColumns.has(field.key);

  return (
    <th 
      className={`p-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 whitespace-nowrap ${
        isCollapsed ? 'w-[30px] min-w-[30px] max-w-[30px] p-0 bg-gray-50 dark:bg-gray-700 overflow-hidden' : ''
      } border-r border-gray-200 dark:border-gray-600`}
    >
      <div className="flex items-center justify-between">
        {isCollapsed ? (
          <span className="text-gray-600 dark:text-gray-400">{field.label[0]}</span>
        ) : (
          <span 
            className="cursor-pointer hover:text-gray-600 dark:hover:text-gray-400"
            onClick={() => onSort(field.key)}
          >
            {field.label}
            {isSorted && (
              <span className="ml-1">
                {sortConfig?.direction === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </span>
        )}
        <button
          onClick={() => onToggleCollapse(field.key)}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-pointer font-bold"
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
    </th>
  );
});

TableHeader.displayName = 'TableHeader';

const ModelsTable: React.FC<ModelsTableProps> = ({ 
  cars,
  sortConfig,
  onSortChange,
  selectedYear,
  onAddToCollection,
  collection
}) => {
  const { data: session } = useSession();
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    const saved = localStorage.getItem(COLLAPSED_COLUMNS_COOKIE);
    return new Set(saved ? JSON.parse(saved) : []);
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(-1);

  // Собираем все доступные изображения из таблицы
  const allImages = useMemo(() => {
    const images: string[] = [];
    cars.forEach(car => {
      car.d
        .filter(item => !selectedYear || item.y === selectedYear)
        .filter(item => item.p === 't')
        .forEach(item => {
          const imageUrl = getImageUrl(item);
          if (imageUrl) {
            images.push(imageUrl);
          }
        });
    });
    return images;
  }, [cars, selectedYear]);

  const handleImageClick = useCallback((imageUrl: string) => {
    const index = allImages.indexOf(imageUrl);
    if (index !== -1) {
      setCurrentImageIndex(index);
      setSelectedImage(imageUrl);
    }
  }, [allImages]);

  const handlePrevImage = useCallback(() => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      setSelectedImage(allImages[currentImageIndex - 1]);
    }
  }, [currentImageIndex, allImages]);

  const handleNextImage = useCallback(() => {
    if (currentImageIndex < allImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      setSelectedImage(allImages[currentImageIndex + 1]);
    }
  }, [currentImageIndex, allImages]);

  const handleSort = (field: string) => {
    if (collapsedColumns.has(field)) {
      onSortChange(null);
      return;
    }

    if (sortConfig?.field === field) {
      if (sortConfig.direction === 'asc') {
        onSortChange({ field, direction: 'desc' });
      } else {
        onSortChange(null);
      }
    } else {
      onSortChange({ field, direction: 'asc' });
    }
  };

  const handleToggleCollapse = (field: string) => {
    const newCollapsed = new Set(collapsedColumns);
    if (newCollapsed.has(field)) {
      newCollapsed.delete(field);
    } else {
      newCollapsed.add(field);
      // Если сворачиваем столбец, по которому идет сортировка - сбрасываем сортировку
      if (sortConfig?.field === field) {
        onSortChange(null);
      }
    }
    setCollapsedColumns(newCollapsed);
    localStorage.setItem(COLLAPSED_COLUMNS_COOKIE, JSON.stringify(Array.from(newCollapsed)));
  };

  const allRows = useMemo(() => {
    const rows = cars.flatMap(car => 
      car.d
        .filter(item => !selectedYear || item.y === selectedYear)
        .map((item, index) => ({
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
          aValue = a.car.lnk;
          bValue = b.car.lnk;
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
  }, [cars, sortConfig, selectedYear]);

  const visibleRows = useMemo(() => {
    return allRows
      .map(({ car, item, index }) => {
        return (
          <TableRow
            key={`${car.lnk}-${index}`}
            car={car}
            item={item}
            index={index}
            collapsedColumns={collapsedColumns}
            onImageClick={handleImageClick}
            isCollected={collection.some(c => c === item.id)}
            onAddToCollection={() => onAddToCollection && item.id && onAddToCollection(item.id)}
          />
        );
      });
  }, [allRows, collapsedColumns, handleImageClick, collection, onAddToCollection]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {session?.user && (
              <th className="p-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 whitespace-nowrap w-[40px] border-r border-gray-200 dark:border-gray-600">
                Add
              </th>
            )}
            <th className="p-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 whitespace-nowrap w-[100px] border-r border-gray-200 dark:border-gray-600">
              Image
            </th>
            {FIELD_ORDER.map(field => (
              <TableHeader
                key={field.key}
                field={field}
                sortConfig={sortConfig}
                onSort={handleSort}
                collapsedColumns={collapsedColumns}
                onToggleCollapse={handleToggleCollapse}
              />
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {visibleRows}
        </tbody>
      </table>
      {selectedImage && allImages.length > 0 && (
        <ImageModal
          imageUrl={selectedImage}
          onClose={() => setSelectedImage(null)}
          onPrev={handlePrevImage}
          onNext={handleNextImage}
          hasPrev={currentImageIndex > 0}
          hasNext={currentImageIndex < allImages.length - 1}
        />
      )}
    </div>
  );
};

export default memo(ModelsTable); 