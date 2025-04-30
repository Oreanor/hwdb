import Image from 'next/image';
import { SEARCH_FIELDS, YEARS, FIELD_ORDER } from '../consts';
import SearchIcon from './SearchIcon';

type SortConfig = {
  field: string;
  direction: 'asc' | 'desc';
} | null;

interface TopPanelProps {
  selectedField: string | undefined;
  selectedYear: string;
  searchQuery: string;
  sortConfig: SortConfig;
  isCompactView: boolean;
  availableFields: Array<(typeof FIELD_ORDER)[number]>;
  onFieldChange: (field: string) => void;
  onYearChange: (year: string) => void;
  onSearchChange: (query: string) => void;
  onSortChange: (config: SortConfig | ((prev: SortConfig) => SortConfig)) => void;
  onCompactViewChange: (isCompact: boolean) => void;
  onSearch: () => void;
  onKeyPress: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export default function TopPanel({
  selectedField,
  selectedYear,
  searchQuery,
  sortConfig,
  isCompactView,
  availableFields,
  onFieldChange,
  onYearChange,
  onSearchChange,
  onSortChange,
  onCompactViewChange,
  onSearch,
  onKeyPress
}: TopPanelProps) {
  const handleSort = (field: string) => {
    onSortChange((current: SortConfig) => {
      if (current?.field === field) {
        if (current.direction === 'asc') {
          return { field, direction: 'desc' };
        }
        return null;
      }
      return { field, direction: 'asc' };
    });
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-10 p-5 flex items-center gap-3">
      <div className="relative h-10 w-10">
        <Image
          src="/logo.png"
          alt="Logo"
          fill
          style={{ objectFit: 'contain' }}
          sizes="40px"
        />
      </div>
      <h1 className="text-3xl font-bold">HWDB</h1>
      <select
        value={selectedYear}
        onChange={(e) => onYearChange(e.target.value)}
        className="h-9 px-3 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white"
      >
        {YEARS.map((year) => (
          <option key={year.value} value={year.value}>
            {year.label}
          </option>
        ))}
      </select>
      <select
        value={selectedField}
        onChange={(e) => onFieldChange(e.target.value)}
        className="h-9 px-3 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white"
      >
        {SEARCH_FIELDS.map((field) => (
          <option key={field.key} value={field.key}>
            {field.label}
          </option>
        ))}
      </select>
      <div className="flex items-center border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyPress={onKeyPress}
          className="h-9 px-3 py-1 text-sm focus:outline-none rounded-l-md"
        />
        <button
          onClick={onSearch}
          className="h-9 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border-l border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center"
        >
          <SearchIcon />
        </button>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        {!isCompactView && (
          <>
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortConfig?.field || ''}
              onChange={(e) => handleSort(e.target.value)}
              className="h-9 px-3 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white"
            >
              <option value="">None</option>
              <option value="model">Model</option>
              {availableFields.map(field => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
            </select>
            {sortConfig && (
              <button
                onClick={() => handleSort(sortConfig.field)}
                className="h-9 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
              >
                {sortConfig.direction === 'asc' ? '↑' : '↓'}
              </button>
            )}
          </>
        )}
        <div className="flex items-center gap-2 ml-4">
          <input
            type="checkbox"
            id="compactView"
            checked={isCompactView}
            onChange={(e) => onCompactViewChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
          />
          <label htmlFor="compactView" className="text-sm text-gray-600 cursor-pointer select-none">
            Compact view
          </label>
        </div>
      </div>
    </div>
  );
} 