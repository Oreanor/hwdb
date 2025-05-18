import { CarData } from '../types';
import { formatCarName } from '../utils';
import { useState } from 'react';
import ModelsTable from './ModelsTable';
import { decodeHtmlEntities } from '../utils';
import { SortConfig } from '../types';
import { t } from '../i18n';
import { FANDOM_BASE_URL } from '../consts';

interface ModelDescriptionProps {
  model: CarData;
  onImageClick: (url: string) => void;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig | ((prev: SortConfig) => SortConfig)) => void;
  selectedYear?: string;
  onAddToCollection: (id: string) => void;
  collection: string[];
  backToSearch?: () => void;
}

export default function ModelDescription({ 
  model, 
  onImageClick, 
  sortConfig, 
  onSortChange,
  selectedYear,
  onAddToCollection,
  collection,
  backToSearch
}: ModelDescriptionProps) {
  const [expandedDescription, setExpandedDescription] = useState(false);

  const description = decodeHtmlEntities(model.dsc || '');  

  return (
    <div className="flex flex-col gap-4">
      {backToSearch && (
        <button
          onClick={backToSearch}
          className="ml-2 underline hover:text-gray-600 dark:hover:text-gray-400 text-sm cursor-pointer"
        >
          ← {t('common.backToSearch')}
        </button>
      )}
      <div className="flex flex-col gap-2 p-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCarName(model.lnk)}</h1>
        <a 
          href={`${FANDOM_BASE_URL}${model.lnk}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t('common.viewOnFandom')}
        </a>
        <div className="text-sm text-gray-800 dark:text-gray-200"><span className='font-bold'>{t('model.number')}: </span>{model.num}</div>
        <div className="text-sm text-gray-800 dark:text-gray-200"><span className='font-bold'>{t('model.designer')}: </span>{model.ds}</div>
        <div className="text-sm max-w-[1000px] text-gray-800 dark:text-gray-200">
          <span><span className='font-bold'>{t('model.description')}: </span>{expandedDescription ? description : <>{description.substring(0, 100)}...</>}

            {description && description.length > 100 && <button
                onClick={() => setExpandedDescription(!expandedDescription)}
                className="ml-2 underline hover:text-gray-600 dark:hover:text-gray-400 text-xs cursor-pointer"
              >
                {expandedDescription ? t('common.less') : t('common.more')}
              </button>}
          </span>
        </div>
      </div>
      <ModelsTable 
        cars={[model]}
        onImageClick={onImageClick}
        sortConfig={sortConfig}
        onSortChange={onSortChange}
        selectedYear={selectedYear}
        onAddToCollection={onAddToCollection}
        collection={collection}
      />
    </div>
  );
} 