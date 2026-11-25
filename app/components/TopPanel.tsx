'use client';

import Image from 'next/image';
import { SEARCH_FIELDS } from '../consts';
import { BRANDS } from '../lib/brands';
import { t, Language } from '../i18n';
import { Theme } from '../theme';
import Select from './ui/Select';
import SearchBox from './SearchBox';
import UserControls from './UserControls';

interface TopPanelProps {
  selectedBrand: string;
  onBrandChange: (brand: string) => void;
  selectedField: string;
  onFieldChange: (field: string) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  availableYears: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
  suggestions?: string[];
  onSuggestionSelect: (value: string) => void;
  onLogoClick: () => void;
  showCollection: boolean;
  onCollectionClick: () => void;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  theme: Theme;
  onThemeToggle: () => void;
}

export default function TopPanel({
  selectedBrand,
  onBrandChange,
  selectedField,
  onFieldChange,
  selectedYear,
  onYearChange,
  availableYears,
  searchQuery,
  onSearchChange,
  onSearch,
  suggestions,
  onSuggestionSelect,
  onLogoClick,
  showCollection,
  onCollectionClick,
  currentLang,
  onLanguageChange,
  theme,
  onThemeToggle,
}: TopPanelProps) {
  const brandOptions = [
    { value: 'all', label: t('filter.allBrands') },
    ...BRANDS.map((b) => ({ value: b.key, label: b.name })),
  ];

  // One "search by" selector: name first, then "By year" (select-only), then the
  // remaining typed fields.
  const [nameField, ...restFields] = SEARCH_FIELDS;
  const fieldOptions = [
    { value: nameField, label: t(`search.fields.${nameField}`) },
    { value: 'year', label: t('common.byYear') },
    ...restFields.map((field) => ({ value: field, label: t(`search.fields.${field}`) })),
  ];

  // Newest year first.
  const yearOptions = [...availableYears].reverse().map((y) => ({ value: y, label: y }));

  const userControls = (
    <UserControls
      showCollection={showCollection}
      onCollectionClick={onCollectionClick}
      currentLang={currentLang}
      onLanguageChange={onLanguageChange}
      theme={theme}
      onThemeToggle={onThemeToggle}
    />
  );

  return (
    <header className="relative z-40 shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm px-3 py-2 sm:px-10 sm:py-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
        <div className="flex items-center justify-between">
          <button onClick={onLogoClick} className="flex items-center cursor-pointer" aria-label="HWDB">
            <span className="relative size-8">
              <Image src="/logo.png" alt="" fill className="object-contain" sizes="32px" />
            </span>
            <span className="-ml-3 text-xl md:text-3xl italic tracking-wider text-gray-500 dark:text-gray-400 font-['Impact','Arial_Narrow',Arial,sans-serif]">
              HWDB
            </span>
          </button>
          <div className="flex items-center gap-2 sm:hidden">{userControls}</div>
        </div>

        <div className="flex flex-1 items-center gap-1.5 sm:gap-3 min-w-0">
          <Select value={selectedBrand} onValueChange={onBrandChange} options={brandOptions} ariaLabel={t('filter.allBrands')} />
          <Select value={selectedField} onValueChange={onFieldChange} options={fieldOptions} />
          {selectedField === 'year' ? (
            <Select
              value={selectedYear}
              onValueChange={onYearChange}
              options={yearOptions}
              placeholder={t('common.selectYear')}
              ariaLabel={t('common.byYear')}
              className="min-w-[120px]"
            />
          ) : (
            <SearchBox
              value={searchQuery}
              onChange={onSearchChange}
              onSearch={onSearch}
              suggestions={suggestions}
              onSuggestionSelect={onSuggestionSelect}
            />
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2">{userControls}</div>
      </div>
    </header>
  );
}
