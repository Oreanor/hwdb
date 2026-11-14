'use client';

import { useMemo, useState } from 'react';
import { CarData, CastingTags, SortConfig } from '../types';
import { formatCarName, decodeHtmlEntities } from '../utils';
import { t } from '../i18n';
import { VIEW_MODE_KEYS, DESCRIPTION_PREVIEW_CHARS } from '../consts';
import { yearSpan, formatYearSpan } from '../lib/years';
import { brandSource } from '../lib/brands';
import { useVariantFilter } from '../hooks/useVariantFilter';
import { usePersistedView } from '../hooks/usePersistedView';
import { useStickyOffset } from '../hooks/useStickyOffset';
import ModelsTable from './ModelsTable';
import VariantsGallery from './VariantsGallery';
import VariantFilterControls from './VariantFilterControls';
import ResultsHeader from './ResultsHeader';
import LinkButton from './LinkButton';

interface ModelDescriptionProps {
  model: CarData;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
  selectedYear?: string;
  onToggleCollection: (id: string) => void;
  collection: ReadonlySet<string>;
  backToSearch?: () => void;
  onSeriesClick?: (series: string) => void;
  onDesignerClick?: (designer: string) => void;
  onYearClick?: (year: string) => void;
  onTagClick?: (value: string) => void;
}

// Browse chips for a casting's tags: make, model (when it differs), region, themes.
const tagChips = (tags: CastingTags): { label: string; value: string }[] => [
  ...(tags.mk ? [{ label: tags.mk, value: `mk:${tags.mk}` }] : []),
  ...(tags.md && tags.md !== tags.mk ? [{ label: tags.md, value: `md:${tags.md}` }] : []),
  ...(tags.rg ? [{ label: tags.rg, value: `rg:${tags.rg}` }] : []),
  ...(tags.th ?? []).map((th) => ({ label: th, value: `th:${th}` })),
];

// Collapsed to a preview with a more/less toggle when long.
function Description({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > DESCRIPTION_PREVIEW_CHARS;
  return (
    <div className="text-sm max-w-[1000px] text-gray-800 dark:text-gray-200">
      <span className="font-bold">{t('model.description')}: </span>
      {long && !expanded ? `${text.substring(0, DESCRIPTION_PREVIEW_CHARS)}…` : text}
      {long && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-2 underline hover:text-gray-600 dark:hover:text-gray-400 text-xs cursor-pointer"
        >
          {expanded ? t('common.less') : t('common.more')}
        </button>
      )}
    </div>
  );
}

export default function ModelDescription({
  model,
  sortConfig,
  onSortChange,
  selectedYear,
  onToggleCollection,
  collection,
  backToSearch,
  onSeriesClick,
  onDesignerClick,
  onYearClick,
  onTagClick,
}: ModelDescriptionProps) {
  const { view, setView, modes: viewModes } = usePersistedView(VIEW_MODE_KEYS.castingPage, 'table');
  const { ref: headerRef, height: headerH } = useStickyOffset<HTMLDivElement>();

  const description = decodeHtmlEntities(model.dsc || '');
  const cars = useMemo(() => [model], [model]);
  const filterState = useVariantFilter(cars);
  const { filteredCars } = filterState;

  const yearsDisplay = useMemo(() => formatYearSpan(yearSpan(model.d)), [model.d]);
  const source = brandSource(model.brand, model.lnk, model.d[0]?.Tn);

  return (
    <div className="flex flex-col gap-4">
      {/* Pinned controls: stay visible while the list scrolls. */}
      <ResultsHeader ref={headerRef} onBack={backToSearch}>
        <VariantFilterControls filterState={filterState} view={view} setView={setView} viewModes={viewModes} />
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
            {tagChips(model.tags).map((c) => (
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
        {description && <Description text={description} />}
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t('common.viewOn')} {source.label}
        </a>
      </div>

      {view === 'table' ? (
        <ModelsTable
          cars={filteredCars}
          sortConfig={sortConfig}
          onSortChange={onSortChange}
          selectedYear={selectedYear}
          onToggleCollection={onToggleCollection}
          collection={collection}
          onSeriesClick={onSeriesClick}
          onYearClick={onYearClick}
          stickyTop={headerH}
        />
      ) : (
        <VariantsGallery cars={filteredCars} selectedYear={selectedYear} />
      )}
    </div>
  );
}
