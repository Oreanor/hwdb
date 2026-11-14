'use client';

import { useMemo } from 'react';
import { CarData } from '../types';
import { getVariantImages, formatCarName } from '../utils';
import { t } from '../i18n';
import { useImageCarousel, CarouselPhoto } from '../hooks/useImageCarousel';
import { byBrand, castingKey } from '../lib/brands';
import { matchesYear } from '../lib/years';
import CarouselModal from './CarouselModal';
import Thumbnail from './Thumbnail';
import BrandBadge from './BrandBadge';

interface VariantsGalleryProps {
  cars: CarData[];
  selectedYear?: string;
  // Show the casting name on each card (the collection mixes many castings).
  showName?: boolean;
  showBrand?: boolean; // brand badge (only when the results span >1 brand)
}

// Cards of variants (one per variant) with a full-screen image carousel.
export default function VariantsGallery({ cars, selectedYear, showName, showBrand }: VariantsGalleryProps) {
  // Brand is the primary grouping: a mixed-brand result set (collection, year,
  // series) shows one brand's cards after another instead of interleaving them.
  const items = useMemo(
    () =>
      [...cars].sort(byBrand).flatMap((car) => {
        const name = formatCarName(car.lnk);
        return car.d
          .filter((v) => matchesYear(v, selectedYear))
          .map((v, i) => ({ key: `${castingKey(car)}-${i}`, car, v, name, ...getVariantImages(v) }));
      }),
    [cars, selectedYear]
  );

  // Carousel runs over the variants that actually have an image.
  const photos = useMemo(
    () =>
      items.flatMap(({ v, name, full }): CarouselPhoto[] =>
        full ? [{ url: full, year: v.y, series: v.Sr, name }] : []
      ),
    [items]
  );
  const carousel = useImageCarousel(photos);

  if (items.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">{t('common.noResults')}</p>;
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {items.map(({ key, car, v, name, full, preview }) => (
          <div
            key={key}
            // Skip layout/paint for off-screen cards (large collections/years).
            className="relative flex flex-col items-center p-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow [content-visibility:auto] [contain-intrinsic-size:auto_260px]"
          >
            {showBrand && <BrandBadge brand={car.brand} className="absolute top-1 left-1 z-10" />}
            <Thumbnail
              url={preview}
              fallbackUrl={full}
              alt={name}
              onClick={full ? () => carousel.open(full) : undefined}
              className="w-full h-48"
            />
            {showName && (
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 text-center line-clamp-1" title={name}>
                {name}
              </p>
            )}
            <p className={showName ? 'text-xs text-gray-500 dark:text-gray-400' : 'text-sm font-bold text-gray-900 dark:text-gray-100'}>
              {v.y || '-'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center line-clamp-2">{v.Sr || '-'}</p>
          </div>
        ))}
      </div>

      <CarouselModal carousel={carousel} />
    </div>
  );
}
