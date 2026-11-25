'use client';

import { useMemo } from 'react';
import { CarData } from '../types';
import { getImageUrl, getPreviewUrl, formatCarName } from '../utils';
import { variantsInYear } from '../lib/years';
import { t } from '../i18n';
import { carouselPhotos, useImageCarousel } from '../hooks/useImageCarousel';
import ImageModal from './ImageModal';
import Thumbnail from './Thumbnail';
import { card, cardGrid, cardMeta, cardTitle } from './ui/styles';

interface VariantsGalleryProps {
  cars: CarData[];
  selectedYear?: string;
  // Show the casting name on each card (result sets that mix many castings).
  showName?: boolean;
}

// Variants as a grid of cards: photo, (name), year, series. Photos open the viewer.
export default function VariantsGallery({ cars, selectedYear, showName }: VariantsGalleryProps) {
  const items = useMemo(
    () => cars.flatMap((car) => variantsInYear(car.d, selectedYear).map((v) => ({ car, v }))),
    [cars, selectedYear]
  );
  const photos = useMemo(() => carouselPhotos(cars, selectedYear), [cars, selectedYear]);
  const carousel = useImageCarousel(photos);

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">{t('common.noResults')}</p>;
  }

  return (
    <>
      <div className={`${cardGrid} pt-4`}>
        {items.map(({ car, v }, i) => {
          const imageUrl = getImageUrl(v);
          const name = formatCarName(car.lnk);
          return (
            <div key={v.id ?? `${car.lnk}-${i}`} className={card}>
              <Thumbnail
                url={getPreviewUrl(v)}
                fallbackUrl={imageUrl}
                alt={name}
                onClick={imageUrl ? () => carousel.open(imageUrl) : undefined}
                className="w-full h-48"
              />
              {showName && (
                <p className={cardTitle} title={name}>
                  {name}
                </p>
              )}
              <p className={showName ? cardMeta : cardTitle}>{v.y || '—'}</p>
              <p className={`${cardMeta} line-clamp-2`}>{v.Sr || '—'}</p>
            </div>
          );
        })}
      </div>
      <ImageModal carousel={carousel} />
    </>
  );
}
