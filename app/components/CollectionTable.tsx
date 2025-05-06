import Image from 'next/image';
import { useMemo, memo } from 'react';
import { CarData, CarDataItem, SortConfig } from '../types';
import { getImageUrl } from '../utils';
import { FIELD_ORDER } from '../consts';
import { removeFromCollection, getCollection } from '../utils/collection';
import { formatCarName } from '../utils';

interface CollectionTableProps {
  cars: CarData[];
  onImageClick: (url: string) => void;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig | ((prev: SortConfig) => SortConfig)) => void;
}

interface TableRowProps {
  car: CarData;
  item: CarDataItem;
  index: number;
  availableFields: Array<(typeof FIELD_ORDER)[number]>;
  onImageClick: (url: string) => void;
  onRemoveFromCollection: (car: CarData, index: number) => void;
  name: string;
}

const TableRow = memo(({ car, item, index, availableFields, onImageClick, onRemoveFromCollection, name }: TableRowProps) => {
  const imageUrl = useMemo(() => getImageUrl(item), [item]);

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="p-2 whitespace-nowrap">
        <button 
          className="w-6 h-6 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors cursor-pointer"
          onClick={() => onRemoveFromCollection(car, index)}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
      </td>
      <td className="p-2 text-sm text-gray-900 dark:text-gray-200 break-words">
        {name}
      </td>
      <td className="p-2 whitespace-nowrap">
        {imageUrl && (
          <div 
            className="w-16 h-16 relative cursor-pointer"
            onClick={() => onImageClick(imageUrl)}
          >
            <Image
              src={imageUrl}
              alt={`${car.lnk} - ${item.y}`}
              fill
              style={{ objectFit: 'contain' }}
              sizes="64px"
            />
          </div>
        )}
      </td>
      {availableFields.map(field => {
        const value = item[field.key] || '-';
        return (
          <td 
            key={field.key} 
            className="p-2 text-sm text-gray-900 dark:text-gray-200 break-words"
          >
            {value}
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
  onSort 
}: { 
  field: (typeof FIELD_ORDER)[number]; 
  sortConfig: SortConfig | null; 
  onSort: (field: string) => void;
}) => {
  const isSorted = sortConfig?.field === field.key;

  return (
    <th 
      className="p-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 whitespace-nowrap border-r border-gray-200 dark:border-gray-600"
    >
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
    </th>
  );
});

TableHeader.displayName = 'TableHeader';

const CollectionTable: React.FC<CollectionTableProps> = ({ 
  cars, 
  onImageClick, 
  sortConfig,
  onSortChange,
}) => {
  const availableFields = useMemo(() => 
    FIELD_ORDER.filter(field => 
      cars.some(car => car.d.some(item => item[field.key] !== undefined))
    ),
    [cars]
  );

  const handleSort = (field: string) => {
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

  const handleRemoveFromCollection = (car: CarData, index: number) => {
    if (window.confirm('Delete this model from collection?')) {
      removeFromCollection({ lnk: car.lnk, variantIndex: index });
    }
  };

  const collectionItems = useMemo(() => {
    const collection = getCollection();
    return collection.map(item => ({ lnk: item.lnk, variantIndex: item.variantIndex, item: cars.find(c => c.lnk === item.lnk)?.d[item.variantIndex] }));
  }, [cars]);

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
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
              />
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {collectionItems.map(({ lnk, variantIndex, item }) => {
            const car = cars.find(c => c.lnk === lnk);
            if (!car || !item) return null;
            return (
              <TableRow
                key={`${lnk}-${variantIndex}`}
                car={car}
                item={item}
                index={variantIndex}
                availableFields={availableFields}
                onImageClick={onImageClick}
                onRemoveFromCollection={handleRemoveFromCollection}
                name={formatCarName(lnk)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CollectionTable; 