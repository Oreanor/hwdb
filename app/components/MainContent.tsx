'use client';

import { TriangleAlert } from 'lucide-react';
import { t } from '../i18n';
import { formatResultTitle } from '../lib/resultTitle';
import { useAppNavigation } from '../hooks/useAppNavigation';
import Spinner from './Spinner';
import ResultsView from './ResultsView';
import ModelDescription from './ModelDescription';
import WelcomeMessage from './WelcomeMessage';

type Nav = ReturnType<typeof useAppNavigation>;

// Picks what the main area shows, in priority order:
// a variants table (series / year / variant search) > the collection > one
// casting > casting search results > the welcome screen.
export default function MainContent({ nav }: { nav: Nav }) {
  const { tableView, showCollection, selectedModel, cars, castingsTitle } = nav;

  // Props every variants table shares.
  const variantsProps = {
    sortConfig: nav.sortConfig,
    onSortChange: nav.setSortConfig,
    onAddToCollection: nav.isLoggedIn ? nav.handleAddToCollection : undefined,
    collection: nav.collection,
    onSeriesClick: nav.handleSeriesClick,
    onYearClick: nav.handleYearClick,
  };

  const content = () => {
    if (nav.loading) return <Spinner />;
    if (tableView) {
      const title =
        tableView.kind === 'series'
          ? `${t('search.fields.series')}: ${tableView.value}`
          : tableView.title
            ? formatResultTitle(tableView.title)
            : tableView.value;
      return (
        <ResultsView
          mode="models"
          {...variantsProps}
          cars={tableView.cars}
          title={title}
          selectedYear={tableView.kind === 'year' ? tableView.value : nav.selectedYear}
          onModelClick={nav.handleModelClick}
          onBack={tableView.kind === 'series' ? nav.handleCloseTable : nav.handleLogoClick}
        />
      );
    }
    if (showCollection) {
      return (
        <ResultsView
          mode="models"
          {...variantsProps}
          cars={nav.filteredCollectionCars}
          selectedYear={nav.selectedYear}
          onModelClick={nav.handleModelClick}
        />
      );
    }
    if (selectedModel) {
      return (
        <ModelDescription
          {...variantsProps}
          model={selectedModel}
          selectedYear={nav.selectedYear}
          onBack={nav.handleBackToSearch}
          onDesignerClick={nav.handleDesignerClick}
          onTagClick={nav.handleTagClick}
        />
      );
    }
    if (cars.length > 0) {
      return (
        <ResultsView
          mode="castings"
          cars={cars}
          title={castingsTitle ? formatResultTitle(castingsTitle) : undefined}
          selectedYear={nav.selectedYear}
          brandScope={nav.selectedBrand}
          onModelClick={nav.handleModelClick}
          onBack={nav.handleLogoClick}
        />
      );
    }
    return <WelcomeMessage brandScope={nav.selectedBrand} onTagClick={nav.handleTagClick} />;
  };

  return (
    <>
      {nav.error && (
        <div
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
        >
          <TriangleAlert className="w-4 h-4 shrink-0" />
          {nav.error}
        </div>
      )}
      {content()}
    </>
  );
}
