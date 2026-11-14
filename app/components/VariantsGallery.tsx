'use client';

import { useMemo } from 'react';
import { CarData } from '../types';
import { getImageUrl, getPreviewUrl, formatCarName } from '../utils';
import { t } from '../i18n';
import { useImageCarousel } from '../hooks/useImageCarousel';
import CarouselModal from './CarouselModal';
import Thumbnail from './Thumbnail';
import BrandBadge from './BrandBadge';
import { byBrand } from '../lib/brands';

interface VariantsGalleryProps {
  cars: CarData[];
  selectedYear?: string;
  // Show the casting name on each card (the collection mixes many castings).
  showName?: boolean;
  showBrand?: boolean; // brand badge (only when the results span >1 brand)
}

export default function VariantsGallery({ cars, selectedYear, showName, showBrand }: VariantsGalleryProps) {
  // Brand is the primary grouping: a mixed-brand result set (collection, year,
  // series) shows one brand's cards after another instead of interleaving them.
  const items = useMemo(
    () =>
      [...cars]
        .sort(byBrand)
        .flatMap((car) => car.d.filter((v) => !selectedYear || v.y === selectedYear).map((v) => ({ car, v }))),
    [cars, selectedYear]
  );

  // Carousel runs over the variants that actually have an image.
  const photos = useMemo(
    () =>
      items
        .filter(({ v }) => v.p === 't')
        .map(({ car, v }) => ({ url: getImageUrl(v), year: v.y, series: v.Sr, name: formatCarName(car.lnk) }))
        .filter((p): p is { url: string; year: string; series: string | undefined; name: string } =>
          Boolean(p.url)
        ),
    [items]
  );
  const carousel = useImageCarousel(photos);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {items.map(({ car, v }, i) => {
          const imageUrl = v.p === 't' ? getImageUrl(v) : undefined;
          const name = formatCarName(car.lnk);
          return (
            <div
              key={v.id ?? `${car.lnk}-${i}`}
              // Skip layout/paint for off-screen cards (large collections/years).
              className="relative flex flex-col items-center p-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow [content-visibility:auto] [contain-intrinsic-size:auto_260px]"
            >
              {showBrand && <BrandBadge brand={car.brand} className="absolute top-1 left-1 z-10" />}
              <Thumbnail
                url={v.p === 't' ? getPreviewUrl(v) : undefined}
                fallbackUrl={imageUrl}
                alt={name}
                onClick={imageUrl ? () => carousel.open(imageUrl) : undefined}
                className="w-full h-48"
              />
              {showName && (
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 text-center line-clamp-1" title={name}>
                  {name}
                </p>
              )}
              <p className={`${showName ? 'text-xs text-gray-500 dark:text-gray-400' : 'text-sm font-bold text-gray-900 dark:text-gray-100'}`}>
                {v.y || '-'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center line-clamp-2">{v.Sr || '-'}</p>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">{t('collection.empty')}</p>
      )}

      <CarouselModal carousel={carousel} />
    </div>
  );
}
