'use client';

import { useEffect, useState } from 'react';
import { t } from '../i18n';
import { TagsIndex, TagBucket } from '../lib/tags';
import { fetchTagsIndex } from '../services/carService';

interface WelcomeMessageProps {
  isLoggedIn?: boolean;
  onTagClick: (value: string) => void;
}

const THEME_ORDER = ['Muscle', 'JDM', 'Supercar', 'Fantasy'];
const REGION_ORDER = ['American', 'Japanese', 'European', 'Australian', 'Korean'];

// The N most common makes of a category, then listed alphabetically.
const topMakes = (bucket: TagBucket, n = 18) =>
  Object.entries(bucket.makes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .sort((a, b) => a[0].localeCompare(b[0]));

export default function WelcomeMessage({ onTagClick }: WelcomeMessageProps) {
  const [index, setIndex] = useState<TagsIndex | null>(null);

  useEffect(() => {
    fetchTagsIndex().then(setIndex);
  }, []);

  // One category as a column: clickable heading + its makes listed vertically.
  const column = (
    cat: string,
    bucket: TagBucket,
    catValue: string,
    makeValue: (make: string) => string
  ) => (
    <div key={cat} className="flex flex-col gap-0.5 break-inside-avoid mb-5">
      <button
        onClick={() => onTagClick(catValue)}
        className="flex items-baseline justify-between gap-2 text-left text-sm font-bold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
      >
        <span>{cat}</span>
        <span className="text-xs font-normal text-gray-400 dark:text-gray-500">{bucket.total}</span>
      </button>
      {topMakes(bucket).map(([mk, c]) => (
        <button
          key={mk}
          onClick={() => onTagClick(makeValue(mk))}
          className="flex items-baseline justify-between gap-2 text-left text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
        >
          <span className="truncate">{mk}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{c}</span>
        </button>
      ))}
    </div>
  );

  const section = (
    heading: string,
    order: string[],
    buckets: Record<string, TagBucket>,
    catValue: (cat: string) => string,
    makeValue: (cat: string, make: string) => string
  ) => {
    const cats = order.filter((k) => buckets?.[k]);
    if (!cats.length) return null;
    return (
      <div className="flex flex-col gap-2">
        <h2 className="text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500 font-semibold">{heading}</h2>
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-x-8">
          {cats.map((cat) => column(cat, buckets[cat], catValue(cat), (mk) => makeValue(cat, mk)))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-5 flex flex-col gap-7">
      {index && (
        <>
          {section(t('welcome.byRegion'), REGION_ORDER, index.regions ?? {}, (c) => `rg:${c}`, (_c, mk) => `mk:${mk}`)}
          {section(t('welcome.byEra'), Object.keys(index.eras ?? {}).sort(), index.eras ?? {}, (c) => `th:${c}`, (c, mk) => `th:${c},mk:${mk}`)}
          {section(t('welcome.byStyle'), THEME_ORDER, index.themes ?? {}, (c) => `th:${c}`, (c, mk) => `th:${c},mk:${mk}`)}
        </>
      )}
    </div>
  );
}
