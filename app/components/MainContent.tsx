'use client';

import { CarData, SortConfig, TableView, ResultTitle } from '../types';
import { t } from '../i18n';
import { formatResultTitle } from '../lib/resultTitle';
import Spinner from './Spinner';
import VariantResults from './VariantResults';
import CastingResults from './CastingResults';
import ModelDescription from './ModelDescription';
import WelcomeMessage from './WelcomeMessage';

interface MainContentProps {
  error: string | null;
  loading: boolean;
  brandScope: string;
  tableView: TableView | null;
  showCollection: boolean;
  selectedModel: CarData | null;
  cars: CarData[];
  castingsTitle: ResultTitle | null;
  filteredCollectionCars: CarData[];
  collection: ReadonlySet<string>;
  selectedYear: string;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
  onToggleCollection: (id: string) => void;
  onSeriesClick: (series: string) => void;
  onDesignerClick: (designer: string) => void;
  onYearClick: (year: string) => void;
  onModelClick: (car: CarData) => void;
  onBackToSearch: () => void;
  onCloseTable: () => void;
  onBackHome: () => void;
  onTagClick: (value: string) => void;
}

// Header of a variants table opened from a series / year / model-field search.
const tableTitle = (tv: TableView): string => {
  if (tv.kind === 'series') return `${t('search.fields.series')}: ${tv.value}`;
  if (tv.title) return formatResultTitle(tv.title);
  return tv.value;
};

// Picks the view to show, in priority order: a variants table, the collection,
// a single casting, casting results, the welcome screen.
export default function MainContent({
  error,
  loading,
  brandScope,
  tableView,
  showCollection,
  selectedModel,
  cars,
  castingsTitle,
  filteredCollectionCars,
  collection,
  selectedYear,
  sortConfig,
  onSortChange,
  onToggleCollection,
  onSeriesClick,
  onDesignerClick,
  onYearClick,
  onModelClick,
  onBackToSearch,
  onCloseTable,
  onBackHome,
  onTagClick,
}: MainContentProps) {
  // Everything a variants view needs.
  const variantProps = {
    sortConfig,
    onSortChange,
    onToggleCollection,
    collection,
    onSeriesClick,
    onModelClick,
    onYearClick,
  };

  const content = tableView ? (
    <VariantResults
      {...variantProps}
      cars={tableView.cars}
      selectedYear={tableView.kind === 'year' ? tableView.value : selectedYear}
      title={tableTitle(tableView)}
      onBack={tableView.kind === 'series' ? onCloseTable : onBackHome}
    />
  ) : showCollection ? (
    <VariantResults {...variantProps} cars={filteredCollectionCars} selectedYear={selectedYear} isCollection />
  ) : selectedModel ? (
    <ModelDescription
      model={selectedModel}
      sortConfig={sortConfig}
      onSortChange={onSortChange}
      selectedYear={selectedYear}
      onToggleCollection={onToggleCollection}
      collection={collection}
      backToSearch={onBackToSearch}
      onSeriesClick={onSeriesClick}
      onDesignerClick={onDesignerClick}
      onYearClick={onYearClick}
      onTagClick={onTagClick}
    />
  ) : cars.length > 0 ? (
    <CastingResults
      cars={cars}
      onModelClick={onModelClick}
      selectedYear={selectedYear}
      brandScope={brandScope}
      title={castingsTitle ? formatResultTitle(castingsTitle) : undefined}
      onBack={onBackHome}
    />
  ) : (
    <WelcomeMessage brandScope={brandScope} onTagClick={onTagClick} />
  );

  return (
    <>
      {error && <div className="p-4 mb-4 text-red-700 dark:text-red-400 rounded">{error}</div>}
      {loading ? <Spinner /> : <div className="flex-1 h-full">{content}</div>}
    </>
  );
}
