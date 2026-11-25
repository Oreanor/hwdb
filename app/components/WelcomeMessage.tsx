'use client';

import { useEffect, useState } from 'react';
import { t } from '../i18n';
import { BrandStats } from '../types';
import { BrandTagsIndex, TagBucket } from '../lib/tags';
import { BRANDS } from '../lib/brands';
import { fetchTagsIndex, fetchStats } from '../services/carService';

interface WelcomeMessageProps {
  brandScope: string;
  onTagClick: (value: string) => void;
}

const THEME_ORDER = ['Muscle', 'JDM', 'Supercar', 'Fantasy'];
const REGION_ORDER = ['American', 'Japanese', 'European', 'Australian', 'Korean'];
const MAKES_PER_CATEGORY = 18;

// The most common makes of a category, listed alphabetically.
const topMakes = (bucket: TagBucket) =>
  Object.entries(bucket.makes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAKES_PER_CATEGORY)
    .sort((a, b) => a[0].localeCompare(b[0]));

const rowButton =
  'flex items-baseline justify-between gap-2 text-left text-sm hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer';
const count = 'text-xs font-normal text-gray-400 dark:text-gray-500';

// One category as a column: clickable heading + its top makes.
function CategoryColumn({
  name,
  bucket,
  catValue,
  makeValue,
  onTagClick,
}: {
  name: string;
  bucket: TagBucket;
  catValue: string;
  makeValue: (make: string) => string;
  onTagClick: (value: string) => void;
}) {
  return (
    <div className="mb-5 flex break-inside-avoid flex-col gap-0.5">
      <button type="button" onClick={() => onTagClick(catValue)} className={`${rowButton} font-bold text-gray-900 dark:text-gray-100`}>
        <span>{name}</span>
        <span className={count}>{bucket.total}</span>
      </button>
      {topMakes(bucket).map(([make, n]) => (
        <button
          key={make}
          type="button"
          onClick={() => onTagClick(makeValue(make))}
          className={`${rowButton} text-gray-600 dark:text-gray-300`}
        >
          <span className="truncate">{make}</span>
          <span className={count}>{n}</span>
        </button>
      ))}
    </div>
  );
}

// A group of categories (regions / eras / styles) laid out in columns.
function Section({
  heading,
  order,
  buckets = {},
  catValue,
  makeValue,
  onTagClick,
}: {
  heading: string;
  order: string[];
  buckets?: Record<string, TagBucket>;
  catValue: (cat: string) => string;
  makeValue: (cat: string, make: string) => string;
  onTagClick: (value: string) => void;
}) {
  const cats = order.filter((k) => buckets[k]);
  if (!cats.length) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{heading}</h2>
      <div className="columns-2 gap-x-8 sm:columns-3 lg:columns-4">
        {cats.map((cat) => (
          <CategoryColumn
            key={cat}
            name={cat}
            bucket={buckets[cat]}
            catValue={catValue(cat)}
            makeValue={(mk) => makeValue(cat, mk)}
            onTagClick={onTagClick}
          />
        ))}
      </div>
    </section>
  );
}

// Home screen: catalog sizes + browse-by-region / era / style, per brand.
export default function WelcomeMessage({ brandScope, onTagClick }: WelcomeMessageProps) {
  const [index, setIndex] = useState<BrandTagsIndex | null>(null);
  const [stats, setStats] = useState<BrandStats | null>(null);

  useEffect(() => {
    // Both are decoration: on failure the screen just shows less.
    fetchTagsIndex().then(setIndex, (err) => console.error(err));
    fetchStats().then(setStats, (err) => console.error(err));
  }, []);

  const inScope = BRANDS.filter((b) => brandScope === 'all' || b.key === brandScope);
  const statBrands = stats ? inScope.filter((b) => stats[b.key]?.castings) : [];
  const browseBrands = index ? inScope.filter((b) => index[b.key]) : [];
  const themeValue = (cat: string, mk: string) => `th:${cat},mk:${mk}`;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-6">
      {statBrands.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {statBrands.map((b) => (
            <div
              key={b.key}
              className="rounded-lg bg-gray-50 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 px-3 py-2 text-sm"
            >
              <div className="font-semibold text-gray-900 dark:text-gray-100">{b.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {stats![b.key].castings.toLocaleString()} {t('welcome.castings')} ·{' '}
                {stats![b.key].variants.toLocaleString()} {t('table.variants')}
              </div>
            </div>
          ))}
        </div>
      )}

      {browseBrands.map((b) => {
        const idx = index![b.key];
        return (
          <div key={b.key} className="flex flex-col gap-5">
            {browseBrands.length > 1 && (
              <h2 className="border-b border-gray-200 dark:border-gray-700 pb-1 text-base font-bold text-gray-900 dark:text-gray-100">
                {b.name}
              </h2>
            )}
            <Section
              heading={t('welcome.byRegion')}
              order={REGION_ORDER}
              buckets={idx.regions}
              catValue={(c) => `rg:${c}`}
              makeValue={(_c, mk) => `mk:${mk}`}
              onTagClick={onTagClick}
            />
            <Section
              heading={t('welcome.byEra')}
              order={Object.keys(idx.eras ?? {}).sort()}
              buckets={idx.eras}
              catValue={(c) => `th:${c}`}
              makeValue={themeValue}
              onTagClick={onTagClick}
            />
            <Section
              heading={t('welcome.byStyle')}
              order={THEME_ORDER}
              buckets={idx.themes}
              catValue={(c) => `th:${c}`}
              makeValue={themeValue}
              onTagClick={onTagClick}
            />
          </div>
        );
      })}
    </div>
  );
}
