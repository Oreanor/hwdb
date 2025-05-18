import { CarData } from '../types';
import ModelsTable from './ModelsTable';
import { SortConfig } from '../types';
import { t } from '../i18n';

interface CollectionProps {
    cars: CarData[];
  onImageClick: (url: string) => void;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig | ((prev: SortConfig) => SortConfig)) => void;
  selectedYear?: string;
  onAddToCollection: (id: string) => void;
  collection: string[];
}

export default function Collection({ 
  cars, 
  onImageClick, 
  sortConfig, 
  onSortChange,
  selectedYear,
  onAddToCollection,
  collection
}: CollectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 p-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('auth.myCollection')}</h1>
        
        {cars.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400 py-8">
            <p className="mb-2">{t('collection.empty')}</p>
            <p className="text-sm">{t('collection.howToAdd')}</p>
          </div>
        ) : (
          <ModelsTable 
            cars={cars}
            onImageClick={onImageClick}
            sortConfig={sortConfig}
            onSortChange={onSortChange}
            selectedYear={selectedYear}
            onAddToCollection={onAddToCollection}
            collection={collection}
          />
        )}
      </div>
    </div>
  );
} 