import Image from 'next/image';
import { SEARCH_FIELDS, YEARS } from '../consts';
import SearchIcon from './icons/SearchIcon';

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
  availableYears?: string[];
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
  availableYears
}: TopPanelProps) {

  return (
    <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md z-10 p-5 flex gap-3">
      <div className="flex items-center gap-3 cursor-pointer" onClick={onLogoClick}>
        <div className="relative h-9 w-9">
          <Image
            src="/logo.png"
            alt="Logo"
            fill
            style={{ objectFit: 'contain' }}
            sizes="36px"
          />
        </div>
        <h1 className="text-4xl font-bold font-['Arial_Narrow',Arial,sans-serif] text-gray-400 dark:text-gray-500 hidden sm:block">HWDB</h1>
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(e.target.value)}
          className="h-9 px-2 sm:px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white dark:bg-gray-700 dark:text-gray-200 min-w-[80px]"
        >
          {YEARS.map((year) => (
            <option 
              key={year.value} 
              value={year.value}
              disabled={availableYears && year.value !== '' && !availableYears.includes(year.value)}
              className={availableYears && year.value !== '' && !availableYears.includes(year.value) ? 'text-gray-200 dark:text-gray-600' : ''}
            >
              {year.label}
            </option>
          ))}
        </select>
        <select
          value={selectedField}
          onChange={(e) => onFieldChange(e.target.value)}
          className="h-9 px-2 sm:px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white dark:bg-gray-700 dark:text-gray-200 min-w-[80px]"
        >
          {SEARCH_FIELDS.map((field) => (
            <option key={field.key} value={field.key}>
              {field.label}
            </option>
          ))}
        </select>
        <div className="flex flex-1 items-center border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 min-w-[150px]">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={onKeyPress}
            className="h-9 px-2 sm:px-3 py-1 text-sm focus:outline-none rounded-l-md w-full bg-white dark:bg-gray-700 dark:text-gray-200"
          />
          <button
            onClick={onSearch}
            className="h-9 px-2 sm:px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-l border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
          >
            <SearchIcon />
          </button>
        </div>
      </div>
    </div>
  );
} 