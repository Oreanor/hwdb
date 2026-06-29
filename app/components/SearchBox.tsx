'use client';

import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { t } from '../i18n';
import { MAX_SUGGESTIONS } from '../consts';
import { tokenize, includesAll } from '../lib/carSearch';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onKeyPress: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  suggestions?: string[];
  onSuggestionSelect?: (value: string) => void;
}

export default function SearchBox({
  value,
  onChange,
  onSearch,
  onKeyPress,
  suggestions,
  onSuggestionSelect,
}: SearchBoxProps) {
  const [open, setOpen] = useState(false);
  // Render in chunks; grow as the user scrolls to the bottom of the list.
  const [limit, setLimit] = useState(MAX_SUGGESTIONS);

  // With text: filter with the same word-by-word, typo-tolerant logic the search
  // uses, so a suggestion appears whenever the query would actually find it
  // (e.g. "acura concept" -> "'12 Acura NSX Concept"). Empty + focused: preview.
  const words = value.trim() ? tokenize(value) : [];
  const matches = !suggestions ? [] : words.length ? suggestions.filter((s) => includesAll(s, words)) : suggestions;
  const filtered = matches.slice(0, limit);
  const showList = open && filtered.length > 0;

  // Reset the visible window whenever the filter or field changes.
  useEffect(() => setLimit(MAX_SUGGESTIONS), [value, suggestions]);

  const handleScroll = (e: React.UIEvent<HTMLUListElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120 && limit < matches.length) {
      setLimit((l) => l + MAX_SUGGESTIONS);
    }
  };

  return (
    <div className="relative flex flex-1 min-w-[100px] xs:min-w-[120px] sm:min-w-[150px] max-w-full sm:max-w-[50%]">
      <div className="flex w-full items-center border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        <input
          type="text"
          placeholder={t('common.searchPlaceholder')}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Escape') setOpen(false);
            onKeyPress(e);
          }}
          className="h-7 xs:h-8 sm:h-9 px-1 xs:px-2 sm:px-3 py-0 text-xs xs:text-sm focus:outline-none rounded-l-md w-full bg-white dark:bg-gray-700 dark:text-gray-200"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            aria-label={t('common.clear')}
            className="h-7 xs:h-8 sm:h-9 px-1 xs:px-2 sm:px-3 py-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-l border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onSearch}
          aria-label={t('common.searchPlaceholder')}
          className="h-7 xs:h-8 sm:h-9 px-1 xs:px-2 sm:px-3 py-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border-l border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {showList && (
        <ul
          onScroll={handleScroll}
          className="absolute top-full left-0 right-0 mt-1 z-50 max-h-[60vh] overflow-y-auto overflow-x-hidden overscroll-contain rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-lg"
        >
          {filtered.map((s, i) => (
            <li key={`${s}-${i}`}>
              <button
                // Prevent the input's blur from firing before the click registers.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSuggestionSelect?.(s);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs xs:text-sm text-gray-900 dark:text-gray-200 hover:bg-blue-500 hover:text-white truncate cursor-pointer"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
