'use client';

import { useEffect, useState } from 'react';
import { t } from '../i18n';
import { BrandTagsIndex, TagBucket } from '../lib/tags';
import { BRANDS } from '../lib/brands';
import { fetchTagsIndex, fetchStats } from '../services/carService';

interface WelcomeMessageProps {
  isLoggedIn?: boolean;
  brandScope?: string;
  onTagClick: (value: string) => void;
}

type Stats = Record<string, { castings: number; variants: number }>;

const THEME_ORDER = ['Muscle', 'JDM', 'Supercar', 'Fantasy'];
const REGION_ORDER = ['American', 'Japanese', 'European', 'Australian', 'Korean'];

// The N most common makes of a category, then listed alphabetically.
const topMakes = (bucket: TagBucket, n = 18) =>
  Object.entries(bucket.makes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .sort((a, b) => a[0].localeCompare(b[0]));

export default function WelcomeMessage({ brandScope = 'all', onTagClick }: WelcomeMessageProps) {
  const [index, setIndex] = useState<BrandTagsIndex | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetchTagsIndex().then(setIndex);
    fetchStats().then(setStats);
  }, []);

  // Catalog sizes for the current base: all brands, or just the selected one.
  const statBrands = stats
    ? BRANDS.filter((b) => (brandScope === 'all' ? stats[b.key]?.castings : b.key === brandScope))
    : [];
  // Browse blocks: one per brand when viewing all, else just the selected base.
  const browseBrands = index
    ? BRANDS.filter((b) => (brandScope === 'all' ? index[b.key] : b.key === brandScope))
    : [];

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
      {statBrands.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
          {statBrands.map((b) => (
            <span key={b.key}>
              <span className="font-semibold text-gray-700 dark:text-gray-200">{b.name}:</span>{' '}
              {stats![b.key].castings.toLocaleString()} {t('welcome.castings')} · {stats![b.key].variants.toLocaleString()} {t('table.variants')}
            </span>
          ))}
        </div>
      )}
      {browseBrands.map((b) => {
        const idx = index![b.key];
        return (
          <div key={b.key} className="flex flex-col gap-5">
            {brandScope === 'all' && browseBrands.length > 1 && (
              <h2 className="border-b border-gray-200 dark:border-gray-700 pb-1 text-base font-bold text-gray-800 dark:text-gray-100">{b.name}</h2>
            )}
            {section(t('welcome.byRegion'), REGION_ORDER, idx.regions ?? {}, (c) => `rg:${c}`, (_c, mk) => `mk:${mk}`)}
            {section(t('welcome.byEra'), Object.keys(idx.eras ?? {}).sort(), idx.eras ?? {}, (c) => `th:${c}`, (c, mk) => `th:${c},mk:${mk}`)}
            {section(t('welcome.byStyle'), THEME_ORDER, idx.themes ?? {}, (c) => `th:${c}`, (c, mk) => `th:${c},mk:${mk}`)}
          </div>
        );
      })}
    </div>
  );
}
