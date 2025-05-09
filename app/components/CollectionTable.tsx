import Image from 'next/image';
import { useMemo, memo, useState } from 'react';
import { CarData, CarDataItem, SortConfig } from '../types';
import { formatCarName, getImageUrl } from '../utils';
import { FIELD_ORDER, COLLAPSED_COLUMNS_COOKIE } from '../consts';
import { removeFromCollection } from '../services/collectionService';
import PlusIcon from './icons/PlusIcon';
import { useSession } from 'next-auth/react';
import { fetchVariantsByIds } from '../services/carService';

interface CollectionTableProps {
  cars: CarData[];
  onImageClick: (url: string) => void;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig | ((prev: SortConfig) => SortConfig)) => void;
  onCollectionUpdate?: (updatedCars: CarData[]) => void;
  selectedYear?: string;
}

interface TableRowProps {
  item: CarData;
  variant: CarDataItem;
  availableFields: Array<(typeof FIELD_ORDER)[number]>;
  collapsedColumns: Set<string>;
  onImageClick: (url: string) => void;
  onRemoveFromCollection: (id: string) => void;
}

const TableRow = memo(({ item, variant, availableFields, collapsedColumns, onImageClick, onRemoveFromCollection }: TableRowProps) => {
  const imageUrl = useMemo(() => getImageUrl(variant), [variant]);

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="p-2 whitespace-nowrap">
        <button 
          className="w-6 h-6 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors cursor-pointer"
          onClick={() => variant.id && onRemoveFromCollection(variant.id)}
        >
          <PlusIcon />
        </button>
      </td>
      <td className="p-2 text-sm text-gray-900 dark:text-gray-200 break-words">
        {item.lnk ? formatCarName(item.lnk) : ''}
      </td>
      <td className="p-2 whitespace-nowrap">
        {imageUrl && (
          <div 
            className="w-16 h-16 relative cursor-pointer"
            onClick={() => onImageClick(imageUrl)}
          >
            <Image
              src={imageUrl}
              alt={`${item.lnk} - ${variant.y}`}
              fill
              style={{ objectFit: 'contain' }}
              sizes="64px"
            />
          </div>
        )}
      </td>
      {availableFields.map(field => {
        const value = variant[field.key] || '-';
        return (
          <td 
            key={field.key} 
            className={`p-2 text-sm text-gray-900 dark:text-gray-200 ${collapsedColumns.has(field.key) ? 'w-[40px] min-w-[40px] max-w-[40px] p-0 bg-gray-50 dark:bg-gray-700 overflow-hidden' : 'break-words'}`}
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

const CollectionTable: React.FC<CollectionTableProps> = ({ 
  cars, 
  onImageClick, 
  sortConfig,
  onSortChange,
  onCollectionUpdate,
  selectedYear
}) => {
  const { data: session } = useSession();
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    const saved = localStorage.getItem(COLLAPSED_COLUMNS_COOKIE);
    return new Set(saved ? JSON.parse(saved) : []);
  });

  const availableFields = useMemo(() => 
    FIELD_ORDER.filter(field => 
      cars.some(car => car.d.some(item => item[field.key] !== undefined))
    ),
    [cars]
  );

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
      if (sortConfig?.field === field) {
        onSortChange(null);
      }
    }
    setCollapsedColumns(newCollapsed);
    localStorage.setItem(COLLAPSED_COLUMNS_COOKIE, JSON.stringify(Array.from(newCollapsed)));
  };

  const handleRemoveFromCollection = async (id: string) => {
    if (!session?.user?.id) return;
    if (window.confirm('Delete this model from collection?')) {
      try {
        const updatedVariantsIds = await removeFromCollection(session.user.id, id);
        const updatedVariants = await fetchVariantsByIds(updatedVariantsIds);
        onCollectionUpdate?.(updatedVariants);
      } catch (error) {
        console.error('Error removing from collection:', error);
      }
    }
  };

  const filteredCars = useMemo(() => {
    
    if (!selectedYear) return cars;
    
    return cars.map(car => ({
      ...car,
      d: car.d.filter(variant => variant.y === selectedYear)
    })).filter(car => car.d.length > 0);
  }, [cars, selectedYear]);

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="p-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 whitespace-nowrap border-r border-gray-200 dark:border-gray-600">
              Del
            </th>
            <th className="p-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 whitespace-nowrap border-r border-gray-200 dark:border-gray-600">
              Name
            </th>
            <th className="p-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 whitespace-nowrap border-r border-gray-200 dark:border-gray-600">
              Image
            </th>
            {availableFields.map(field => (
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
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {filteredCars.map(item => 
            item.d.map(variant => (
              <TableRow
                key={`${item.lnk}-${variant.id}`}
                item={item}
                variant={variant}
                availableFields={availableFields}
                collapsedColumns={collapsedColumns}
                onImageClick={onImageClick}
                onRemoveFromCollection={handleRemoveFromCollection}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CollectionTable; 