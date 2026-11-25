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
  const { currentLang, changeLanguage, ready } = useLanguage();
  const nav = useAppNavigation();
  const suggestions = useFieldOptions(nav.selectedField, nav.selectedBrand);

  if (!ready) return <Spinner />;

  return (
    // Remount the whole tree on language change so memoized children (tables,
    // grids, cards) re-render in the new language.
    <div key={currentLang} className="h-dvh flex flex-col">
      <TopPanel
        selectedBrand={nav.selectedBrand}
        onBrandChange={nav.handleBrandChange}
        selectedField={nav.selectedField}
        onFieldChange={nav.handleFieldChange}
        selectedYear={nav.selectedYear}
        onYearChange={nav.handleYearChange}
        availableYears={nav.availableYears}
        searchQuery={nav.searchQuery}
        onSearchChange={nav.setSearchQuery}
        onSearch={nav.handleSearch}
        suggestions={suggestions}
        onSuggestionSelect={nav.handleSuggestionSelect}
        onLogoClick={nav.handleLogoClick}
        showCollection={nav.showCollection}
        onCollectionClick={nav.handleCollectionClick}
        currentLang={currentLang}
        onLanguageChange={changeLanguage}
        theme={theme}
        onThemeToggle={toggleTheme}
      />
      {/* The one scroll container: results headers and table heads stick to its top. */}
      <main className="flex-1 overflow-auto px-3 sm:px-10 pb-4">
        <MainContent nav={nav} />
      </main>
    </div>
  );
}
