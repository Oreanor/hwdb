'use client';

import { useMemo, useState } from 'react';
import { CarData, SortConfig } from '../types';
import { formatCarName, decodeHtmlEntities } from '../utils';
import { t } from '../i18n';
import { FANDOM_BASE_URL, VIEW_MODE_KEYS } from '../consts';
import { useVariantFilter } from '../hooks/useVariantFilter';
import { usePersistedView } from '../hooks/usePersistedView';
import ModelsTable from './ModelsTable';
import VariantsGallery from './VariantsGallery';
import VariantFilterControls from './VariantFilterControls';
import ResultsHeader from './ResultsHeader';
import LinkButton from './LinkButton';

interface ModelDescriptionProps {
  model: CarData;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig | ((prev: SortConfig) => SortConfig)) => void;
  selectedYear?: string;
  onAddToCollection: (id: string) => void;
  collection: string[];
  backToSearch?: () => void;
  onSeriesClick?: (series: string) => void;
  onDesignerClick?: (designer: string) => void;
  onYearClick?: (year: string) => void;
  onTagClick?: (value: string) => void;
}

export default function ModelDescription({
  model,
  sortConfig,
  onSortChange,
  selectedYear,
  onAddToCollection,
  collection,
  backToSearch,
  onSeriesClick,
  onDesignerClick,
  onYearClick,
  onTagClick,
}: ModelDescriptionProps) {
  const [expandedDescription, setExpandedDescription] = useState(false);
  const { view, toggle: toggleView } = usePersistedView(VIEW_MODE_KEYS.castingPage, 'table');

  const description = decodeHtmlEntities(model.dsc || '');
  const cars = useMemo(() => [model], [model]);
  const filterState = useVariantFilter(cars);
  const { filteredCars } = filterState;

  const yearsDisplay = useMemo(() => {
    const ys = [...new Set(model.d.map((v) => v.y).filter((y) => /^\d{4}$/.test(y)))].sort();
    if (ys.length === 0) return '';
    return ys[0] === ys[ys.length - 1] ? ys[0] : `${ys[0]}–${ys[ys.length - 1]}`;
  }, [model.d]);

  return (
    <div className="flex flex-col gap-4">
      {/* Pinned controls: stay visible while the list scrolls. */}
      <ResultsHeader onBack={backToSearch}>
        <VariantFilterControls filterState={filterState} view={view} onToggleView={toggleView} />
      </ResultsHeader>

      <div className="flex flex-col gap-2 p-2">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCarName(model.lnk)}</h1>
        {yearsDisplay && (
          <div className="text-sm text-gray-800 dark:text-gray-200"><span className="font-bold">{t('model.years')}: </span>{yearsDisplay}</div>
        )}
        {model.tags?.yr && (
          <div className="text-sm text-gray-800 dark:text-gray-200"><span className="font-bold">{t('model.modelYear')}: </span>{model.tags.yr}</div>
        )}
        {model.ds && (
          <div className="text-sm text-gray-800 dark:text-gray-200">
            <span className="font-bold">{t('model.designer')}: </span>
            {onDesignerClick ? (
              <LinkButton onClick={() => onDesignerClick(model.ds as string)} className="inline">
                {model.ds}
              </LinkButton>
            ) : (
              model.ds
            )}
          </div>
        )}
        {onTagClick && model.tags && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              model.tags.mk && { label: model.tags.mk, value: `mk:${model.tags.mk}` },
              model.tags.md && model.tags.md !== model.tags.mk && { label: model.tags.md, value: `md:${model.tags.md}` },
              model.tags.rg && { label: model.tags.rg, value: `rg:${model.tags.rg}` },
              ...(model.tags.th ?? []).map((th) => ({ label: th, value: `th:${th}` })),
            ]
              .filter((c): c is { label: string; value: string } => Boolean(c))
              .map((c) => (
                <button
                  key={c.value}
                  onClick={() => onTagClick(c.value)}
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                >
                  {c.label}
                </button>
              ))}
          </div>
        )}
        {description && (
          <div className="text-sm max-w-[1000px] text-gray-800 dark:text-gray-200">
            <span><span className="font-bold">{t('model.description')}: </span>{expandedDescription ? description : <>{description.substring(0, 100)}...</>}
              {description.length > 100 && (
                <button
                  onClick={() => setExpandedDescription(!expandedDescription)}
                  className="ml-2 underline hover:text-gray-600 dark:hover:text-gray-400 text-xs cursor-pointer"
                >
                  {expandedDescription ? t('common.less') : t('common.more')}
                </button>
              )}
            </span>
          </div>
        )}
        <a
          href={`${FANDOM_BASE_URL}${model.lnk}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t('common.viewOnFandom')}
        </a>
      </div>

      {view === 'table' ? (
        <ModelsTable
          cars={filteredCars}
          sortConfig={sortConfig}
          onSortChange={onSortChange}
          selectedYear={selectedYear}
          onAddToCollection={onAddToCollection}
          collection={collection}
          onSeriesClick={onSeriesClick}
          onYearClick={onYearClick}
        />
      ) : (
        <VariantsGallery cars={filteredCars} selectedYear={selectedYear} />
      )}
    </div>
  );
}
