'use client';

import TopPanel from './components/TopPanel';
import MainContent from './components/MainContent';
import Spinner from './components/Spinner';
import { useTheme } from './hooks/useTheme';
import { useLanguage } from './hooks/useLanguage';
import { useFieldOptions } from './hooks/useFieldOptions';
import { useAppNavigation } from './hooks/useAppNavigation';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { currentLang, changeLanguage, ready: isInitialized } = useLanguage();
  const nav = useAppNavigation();
  const suggestions = useFieldOptions(nav.selectedField);

  return (
    <div className="h-screen w-full flex flex-col bg-white dark:bg-gray-900">
      {isInitialized ? (
        // Remount the whole tree on language change so memoized children
        // (tables, grids, cards) re-render in the new language. `contents`
        // keeps the flex layout intact.
        <div key={currentLang} className="contents">
          <div className="min-h-[82px]">
            <TopPanel
              selectedField={nav.selectedField}
              selectedYear={nav.selectedYear}
              searchQuery={nav.searchQuery}
              onFieldChange={nav.handleFieldChange}
              onYearChange={nav.handleYearChange}
              onSearchChange={nav.setSearchQuery}
              onSearch={nav.handleSearch}
              onKeyPress={nav.handleKeyPress}
              onLogoClick={nav.handleLogoClick}
              onCollectionClick={nav.handleCollectionClick}
              availableYears={nav.availableYears}
              showCollection={nav.showCollection}
              onLanguageChange={changeLanguage}
              currentLang={currentLang}
              theme={theme}
              onThemeToggle={toggleTheme}
              suggestions={suggestions}
              onSuggestionSelect={nav.handleSuggestionSelect}
            />
          </div>
          <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-2 sm:pb-4">
            <MainContent
              error={nav.error}
              loading={nav.loading}
              tableView={nav.tableView}
              showCollection={nav.showCollection}
              selectedModel={nav.selectedModel}
              cars={nav.cars}
              castingsTitle={nav.castingsTitle}
              filteredCollectionCars={nav.filteredCollectionCars}
              collection={nav.collection}
              selectedYear={nav.selectedYear}
              sortConfig={nav.sortConfig}
              onSortChange={nav.setSortConfig}
              onAddToCollection={nav.handleAddToCollection}
              onSeriesClick={nav.handleSeriesClick}
              onDesignerClick={nav.handleDesignerClick}
              onYearClick={nav.handleYearClick}
              onModelClick={nav.handleModelClick}
              onBackToSearch={nav.handleBackToSearch}
              onCloseTable={nav.handleCloseTable}
              onBackHome={nav.handleLogoClick}
              onTagClick={nav.handleTagClick}
              isLoggedIn={nav.isLoggedIn}
            />
          </div>
        </div>
      ) : (
        <Spinner />
      )}
    </div>
  );
}
