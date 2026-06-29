'use client';

import Image from 'next/image';
import { SEARCH_FIELDS, YEARS } from '../consts';
import { t, Language } from '../i18n';
import { Theme } from '../theme';
import Select from './ui/Select';
import SearchBox from './SearchBox';
import UserControls from './UserControls';

interface TopPanelProps {
  selectedField: string | undefined;
  selectedYear: string;
  searchQuery: string;
  onFieldChange: (field: string) => void;
  onYearChange: (year: string) => void;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
  onKeyPress: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onLogoClick?: () => void;
  onCollectionClick: () => void;
  availableYears?: string[];
  showCollection: boolean;
  onLanguageChange: (lang: Language) => void;
  currentLang: Language;
  theme: Theme;
  onThemeToggle: () => void;
  suggestions?: string[];
  onSuggestionSelect: (value: string) => void;
}

export default function TopPanel({
  selectedField,
  selectedYear,
  searchQuery,
  onFieldChange,
  onYearChange,
  onSearchChange,
  onSearch,
  onKeyPress,
  onLogoClick,
  onCollectionClick,
  availableYears,
  showCollection,
  onLanguageChange,
  currentLang,
  theme,
  onThemeToggle,
  suggestions,
  onSuggestionSelect,
}: TopPanelProps) {
  const isYearAvailable = (year: string) => (availableYears ? availableYears.includes(year) : true);

  // One "search by" selector: name first (autocompletes makes), then "By year"
  // (select-only), then the remaining typed fields.
  const [nameField, ...restFields] = SEARCH_FIELDS;
  const parameterOptions = [
    { value: nameField, label: t(`search.fields.${nameField}`) },
    { value: 'year', label: t('common.byYear') },
    ...restFields.map((field) => ({ value: field, label: t(`search.fields.${field}`) })),
  ];

  // Newest year first.
  const yearPickOptions = YEARS.filter((y) => y.value !== '' && isYearAvailable(y.value))
    .map((y) => ({ value: y.value, label: y.label }))
    .reverse();

  const userControls = (
    <UserControls
      showCollection={showCollection}
      onCollectionClick={onCollectionClick}
      onLanguageChange={onLanguageChange}
      currentLang={currentLang}
      theme={theme}
      onThemeToggle={onThemeToggle}
    />
  );

  return (
    <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md z-40 p-2 xs:p-3 sm:p-5">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
        <div className="flex items-center justify-between sm:justify-start">
          <div className="flex items-center gap-1 cursor-pointer" onClick={onLogoClick}>
            <div className="relative h-7 xs:h-8 sm:h-8 w-7 xs:w-8 sm:w-8">
              <Image src="/logo.png" alt="HWDB" fill className="object-contain" sizes="32px" />
            </div>
            <div className="relative block -ml-3">
              <h1 className="text-xl md:text-3xl font-['Impact','Arial_Narrow',Arial,sans-serif] text-[#82807C] tracking-wider italic">
                HWDB
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:hidden">{userControls}</div>
        </div>

        <div className="flex flex-1 items-center gap-1 xs:gap-2 sm:gap-3 min-w-0">
          <Select
            value={selectedField ?? 'name'}
            onValueChange={onFieldChange}
            options={parameterOptions}
            className="min-w-[64px] xs:min-w-[72px] sm:min-w-[84px]"
          />
          {selectedField === 'year' ? (
            <Select
              value={selectedYear}
              onValueChange={onYearChange}
              options={yearPickOptions}
              placeholder={t('common.selectYear')}
              ariaLabel={t('common.byYear')}
              className="min-w-[100px] xs:min-w-[120px] sm:min-w-[140px]"
            />
          ) : (
            <SearchBox
              value={searchQuery}
              onChange={onSearchChange}
              onSearch={onSearch}
              onKeyPress={onKeyPress}
              suggestions={suggestions}
              onSuggestionSelect={onSuggestionSelect}
            />
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2 ml-auto">{userControls}</div>
      </div>
    </div>
  );
}
