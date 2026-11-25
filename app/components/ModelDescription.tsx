'use client';

import { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { CarData, SortConfig } from '../types';
import { formatCarName, formatModelYear, decodeHtmlEntities } from '../utils';
import { yearRange } from '../lib/years';
import { brandSource } from '../lib/brands';
import { t } from '../i18n';
import { VIEW_MODE_KEYS } from '../consts';
import { useVariantFilter } from '../hooks/useVariantFilter';
import { usePersistedView } from '../hooks/usePersistedView';
import { useStickyOffset } from '../hooks/useStickyOffset';
import ModelsTable from './ModelsTable';
import VariantsGallery from './VariantsGallery';
import VariantFilterControls from './VariantFilterControls';
import ResultsHeader from './ResultsHeader';
import LinkButton from './LinkButton';
import { chip } from './ui/styles';

// Descriptions longer than this start collapsed.
const DESCRIPTION_PREVIEW = 200;

interface ModelDescriptionProps {
  model: CarData;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
  selectedYear?: string;
  onAddToCollection?: (id: string) => void;
  collection: string[];
  onBack: () => void;
  onSeriesClick: (series: string) => void;
  onYearClick: (year: string) => void;
  onDesignerClick: (designer: string) => void;
  onTagClick: (value: string) => void;
}

// Browse tags of a casting as chips: make, model, region, themes.
const tagChips = (tags: CarData['tags']) =>
  tags
    ? [
        tags.mk && { label: tags.mk, value: `mk:${tags.mk}` },
        tags.md && tags.md !== tags.mk && { label: tags.md, value: `md:${tags.md}` },
        tags.rg && { label: tags.rg, value: `rg:${tags.rg}` },
        ...(tags.th ?? []).map((th) => ({ label: th, value: `th:${th}` })),
      ].filter((c): c is { label: string; value: string } => !!c)
    : [];

// One casting's page: its facts, tags, description, source link and variants.
export default function ModelDescription({
  model,
  sortConfig,
  onSortChange,
  selectedYear,
  onAddToCollection,
  collection,
  onBack,
  onSeriesClick,
  onYearClick,
  onDesignerClick,
  onTagClick,
}: ModelDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const { view, setView, modes } = usePersistedView(VIEW_MODE_KEYS.castingPage, 'table');
  const { ref: headerRef, height: headerH } = useStickyOffset<HTMLDivElement>();

  const cars = useMemo(() => [model], [model]);
  const filterState = useVariantFilter(cars);

  const description = decodeHtmlEntities(model.dsc ?? '').trim();
  const isLong = description.length > DESCRIPTION_PREVIEW;
  const years = yearRange(model.d);
  const modelYear = formatModelYear(model.tags);
  const chips = tagChips(model.tags);
  const source = brandSource(model);

  const fact = (label: string, value: React.ReactNode) => (
    <div className="flex gap-1.5">
      <dt className="font-semibold">{label}:</dt>
      <dd>{value}</dd>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <ResultsHeader ref={headerRef} onBack={onBack}>
        <VariantFilterControls filterState={filterState} view={view} setView={setView} viewModes={modes} />
      </ResultsHeader>

      <section className="flex flex-col gap-2 max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCarName(model.lnk)}</h1>

        <dl className="flex flex-col gap-0.5 text-sm text-gray-700 dark:text-gray-300">
          {years && fact(t('model.years'), years)}
          {modelYear && fact(t('model.modelYear'), modelYear)}
          {model.ds && fact(t('model.designer'), <LinkButton onClick={() => onDesignerClick(model.ds!)}>{model.ds}</LinkButton>)}
        </dl>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <button key={c.value} type="button" onClick={() => onTagClick(c.value)} className={chip}>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {description && (
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {isLong && !expanded ? `${description.slice(0, DESCRIPTION_PREVIEW).trimEnd()}…` : description}
            {isLong && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="ml-2 text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {expanded ? t('common.less') : t('common.more')}
              </button>
            )}
          </p>
        )}

        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t('common.viewOn')} {source.label}
          <ExternalLink className="w-3 h-3" />
        </a>
      </section>

      {view === 'table' ? (
        <ModelsTable
          cars={filterState.filteredCars}
          sortConfig={sortConfig}
          onSortChange={onSortChange}
          selectedYear={selectedYear}
          onAddToCollection={onAddToCollection}
          collection={collection}
          onSeriesClick={onSeriesClick}
          onYearClick={onYearClick}
          stickyTop={headerH}
        />
      ) : (
        <VariantsGallery cars={filterState.filteredCars} selectedYear={selectedYear} />
      )}
    </div>
  );
}
