'use client';

import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { t } from '../i18n';
import { MAX_SUGGESTIONS } from '../consts';
import { tokenize, includesAll } from '../lib/carSearch';
import { controlFrame, controlSize, menuContent } from './ui/styles';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  suggestions?: string[];
  onSuggestionSelect: (value: string) => void;
}

const inlineButton =
  'h-full px-2 sm:px-3 flex items-center justify-center border-l border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer';

// Text input + clear + search buttons, with a type-to-filter suggestion list.
export default function SearchBox({ value, onChange, onSearch, suggestions, onSuggestionSelect }: SearchBoxProps) {
  const [open, setOpen] = useState(false);
  // Render in chunks; grow as the user scrolls to the bottom of the list.
  const [limit, setLimit] = useState(MAX_SUGGESTIONS);

  // With text: filter with the same word-by-word, typo-tolerant logic the search
  // uses, so a suggestion appears whenever the query would actually find it
  // (e.g. "acura concept" -> "'12 Acura NSX Concept"). Empty + focused: preview.
  const words = tokenize(value);
  const matches = !suggestions ? [] : words.length ? suggestions.filter((s) => includesAll(s, words)) : suggestions;
  const shown = matches.slice(0, limit);

  // Reset the visible window whenever the filter or field changes.
  useEffect(() => setLimit(MAX_SUGGESTIONS), [value, suggestions]);

  const handleScroll = (e: React.UIEvent<HTMLUListElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120 && limit < matches.length) {
      setLimit((l) => l + MAX_SUGGESTIONS);
    }
  };

  return (
    <div className="relative flex flex-1 min-w-[100px] sm:max-w-xl">
      <div
        className={`${controlFrame} ${controlSize} flex w-full items-stretch overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500`}
      >
        <input
          type="text"
          placeholder={t('common.searchPlaceholder')}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'Enter') {
              setOpen(false);
              onSearch();
            }
          }}
          className="w-full min-w-0 px-2 sm:px-3 bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none"
        />
        {value && (
          <button onClick={() => onChange('')} aria-label={t('common.clear')} className={inlineButton}>
            <X className="w-4 h-4" />
          </button>
        )}
        <button onClick={onSearch} aria-label={t('common.searchPlaceholder')} className={inlineButton}>
          <Search className="w-4 h-4" />
        </button>
      </div>

      {open && shown.length > 0 && (
        <ul
          onScroll={handleScroll}
          className={`${menuContent} absolute top-full left-0 right-0 mt-1 max-h-[60vh] overflow-y-auto overflow-x-hidden overscroll-contain`}
        >
          {shown.map((s, i) => (
            <li key={`${s}-${i}`}>
              <button
                // Keep focus in the input so its blur doesn't close the list before the click lands.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSuggestionSelect(s);
                  setOpen(false);
                }}
                className="w-full px-3 py-1.5 rounded text-left text-xs xs:text-sm truncate text-gray-900 dark:text-gray-200 hover:bg-blue-600 hover:text-white cursor-pointer"
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
