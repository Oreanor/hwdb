'use client';

import { CarData, SortConfig, TableView } from '../types';
import { t } from '../i18n';
import Spinner from './Spinner';
import ResultsView from './ResultsView';
import ModelDescription from './ModelDescription';
import WelcomeMessage from './WelcomeMessage';

interface MainContentProps {
  error: string | null;
  loading: boolean;
  tableView: TableView | null;
  showCollection: boolean;
  selectedModel: CarData | null;
  cars: CarData[];
  castingsTitle: string;
  filteredCollectionCars: CarData[];
  collection: string[];
  selectedYear: string;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig | ((prev: SortConfig) => SortConfig)) => void;
  onAddToCollection: (id: string) => void;
  onSeriesClick: (series: string) => void;
  onDesignerClick: (designer: string) => void;
  onYearClick: (year: string) => void;
  onModelClick: (car: CarData) => void;
  onBackToSearch: () => void;
  onCloseTable: () => void;
  onBackHome: () => void;
  onTagClick: (value: string) => void;
  isLoggedIn: boolean;
}

export default function MainContent(props: MainContentProps) {
  const {
    error,
    loading,
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
    onAddToCollection,
    onSeriesClick,
    onDesignerClick,
    onYearClick,
    onModelClick,
    onBackToSearch,
    onCloseTable,
    onBackHome,
    onTagClick,
    isLoggedIn,
  } = props;

  return (
    <>
      {error && <div className="p-4 mb-4 text-red-700 dark:text-red-400 rounded">{error}</div>}

      {loading ? (
        <Spinner />
      ) : (
        <div className="flex-1 h-full">
          {tableView ? (
            <ResultsView
              mode="models"
              cars={tableView.cars}
              sortConfig={sortConfig}
              onSortChange={onSortChange}
              onAddToCollection={onAddToCollection}
              selectedYear={tableView.kind === 'year' ? tableView.value : selectedYear}
              collection={collection}
              onSeriesClick={onSeriesClick}
              onModelClick={onModelClick}
              onYearClick={onYearClick}
              title={
                tableView.kind === 'series'
                  ? `${t('search.fields.series')}: ${tableView.value}`
                  : tableView.kind === 'field'
                    ? tableView.title
                    : tableView.value
              }
              onBack={tableView.kind === 'series' ? onCloseTable : undefined}
            />
          ) : showCollection ? (
            <ResultsView
              mode="models"
              cars={filteredCollectionCars}
              sortConfig={sortConfig}
              onSortChange={onSortChange}
              onAddToCollection={onAddToCollection}
              selectedYear={selectedYear}
              collection={collection}
              onSeriesClick={onSeriesClick}
              onModelClick={onModelClick}
              onYearClick={onYearClick}
            />
          ) : selectedModel ? (
            <ModelDescription
              model={selectedModel}
              sortConfig={sortConfig}
              onSortChange={onSortChange}
              selectedYear={selectedYear}
              onAddToCollection={onAddToCollection}
              collection={collection}
              backToSearch={onBackToSearch}
              onSeriesClick={onSeriesClick}
              onDesignerClick={onDesignerClick}
              onYearClick={onYearClick}
              onTagClick={onTagClick}
            />
          ) : cars.length > 0 ? (
            <ResultsView mode="castings" cars={cars} onModelClick={onModelClick} selectedYear={selectedYear} title={castingsTitle} onBack={onBackHome} />
          ) : (
            <WelcomeMessage isLoggedIn={isLoggedIn} onTagClick={onTagClick} />
          )}
        </div>
      )}
    </>
  );
}
