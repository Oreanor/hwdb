import { CarData } from '../types';
import { formatCarName } from '../utils';
import { useState } from 'react';
import ModelsTable from './ModelsTable';
import { decodeHtmlEntities } from '../utils';
import { SortConfig } from '../types';

interface ModelDescriptionProps {
  model: CarData;
  onImageClick: (url: string) => void;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig | ((prev: SortConfig) => SortConfig)) => void;
  selectedYear?: string;
}

export default function ModelDescription({ 
  model, 
  onImageClick, 
  sortConfig, 
  onSortChange,
  selectedYear,
}: ModelDescriptionProps) {
  const [expandedDescription, setExpandedDescription] = useState(false);

  const description = decodeHtmlEntities(model.dsc);  

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 p-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCarName(model.lnk)}</h1>
        <div className="text-sm text-gray-800 dark:text-gray-200"><span className='font-bold'>Number: </span>{model.num}</div>
        <div className="text-sm text-gray-800 dark:text-gray-200"><span className='font-bold'>Designer: </span>{model.ds}</div>
        <div className="text-sm max-w-[1000px] text-gray-800 dark:text-gray-200">
          <span><span className='font-bold'>Description: </span>{expandedDescription ? description : <>{description.substring(0, 100)}...</>}

            {description && description.length > 100 && <button
                onClick={() => setExpandedDescription(!expandedDescription)}
                className="ml-2 underline hover:text-gray-600 dark:hover:text-gray-400 text-xs cursor-pointer"
              >
                {expandedDescription ? "Less" : "More"}
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
      />
    </div>
  );
} 