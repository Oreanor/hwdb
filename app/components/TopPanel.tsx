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
  onCollectionClick?: () => void;
  availableYears?: string[];
  showCollection: boolean;
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
  showCollection
}: TopPanelProps) {

  const isYearAvailable = (year: string) => {
    return availableYears ? availableYears.includes(year) : true;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-md z-10 p-2 xs:p-3 sm:p-5 flex gap-4 sm:gap-6">
      <div className="flex items-center gap-1 xs:gap-2 sm:gap-3 cursor-pointer" onClick={onLogoClick}>
        <div className="relative h-7 xs:h-8 sm:h-9 w-7 xs:w-8 sm:w-9">
          <Image
            src="/logo.png"
            alt="Logo"
            fill
            style={{ objectFit: 'contain' }}
            sizes="36px"
          />
        </div>
        <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold font-['Arial_Narrow',Arial,sans-serif] text-gray-400 dark:text-gray-500 hidden sm:block">HWDB</h1>
      </div>
      <div className="flex flex-1 items-center gap-1 xs:gap-2 sm:gap-3 min-w-0">
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(e.target.value)}
          className="h-7 xs:h-8 sm:h-9 px-0.5 xs:px-1 sm:px-3 py-0 text-xs xs:text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white dark:bg-gray-700 dark:text-gray-200 min-w-[60px] xs:min-w-[70px] sm:min-w-[80px]"
        >
          <option value="">All Years</option>
          {YEARS.map((year) => (
            isYearAvailable(year.value) && year.value !== '' && (
              <option 
                key={year.value} 
                value={year.value}
              >
                {year.label}
              </option>
            )
          ))}
        </select>
        <select
          value={selectedField}
          onChange={(e) => onFieldChange(e.target.value)}
          className="h-7 xs:h-8 sm:h-9 px-0.5 xs:px-1 sm:px-3 py-0 text-xs xs:text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white dark:bg-gray-700 dark:text-gray-200 min-w-[60px] xs:min-w-[70px] sm:min-w-[80px]"
        >
          {SEARCH_FIELDS.map((field) => (
            <option key={field.key} value={field.key}>
              {field.label}
            </option>
          ))}
        </select>
        <div className="flex flex-1 items-center border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 min-w-[100px] xs:min-w-[120px] sm:min-w-[150px] max-w-[50%]">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={onKeyPress}
            className="h-7 xs:h-8 sm:h-9 px-1 xs:px-2 sm:px-3 py-0 text-xs xs:text-sm focus:outline-none rounded-l-md w-full bg-white dark:bg-gray-700 dark:text-gray-200"
          />
          <button
            onClick={onSearch}
            className="h-7 xs:h-8 sm:h-9 px-1 xs:px-2 sm:px-3 py-0 text-xs xs:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-l border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center cursor-pointer"
          >
            <SearchIcon />
          </button>
        </div>
        <button
          onClick={onCollectionClick}
          className={`h-7 xs:h-8 sm:h-9 px-2 xs:px-3 sm:px-4 py-0 text-xs xs:text-sm border rounded-md transition-colors flex items-center justify-center cursor-pointer ${
            showCollection
              ? 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
          }`}
        >
          My Collection
        </button>
      </div>
    </div>
  );
} 