'use client';

import { memo, useMemo } from 'react';
import { CarData } from '../types';
import { formatCarName, formatModelYear, getImageUrl, getPreviewUrl, hasImage } from '../utils';
import { variantsInYear, yearRange } from '../lib/years';
import { t } from '../i18n';
import Thumbnail from './Thumbnail';
import { card, cardMeta, cardTitle } from './ui/styles';

interface ModelCardProps {
  car: CarData;
  onModelClick: (car: CarData) => void;
  selectedYear?: string;
  showBrand?: boolean;
}

// One casting in the castings grid: photo, name (variant count), model year, release years.
const ModelCard = memo(function ModelCard({ car, onModelClick, selectedYear, showBrand }: ModelCardProps) {
  const variants = useMemo(() => variantsInYear(car.d, selectedYear), [car.d, selectedYear]);
  const photo = variants.find(hasImage);
  const name = formatCarName(car.lnk);
  const modelYear = formatModelYear(car.tags);
  const years = yearRange(car.d);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onModelClick(car)}
      onKeyDown={(e) => e.key === 'Enter' && onModelClick(car)}
      className={`${card} cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
    >
      {showBrand && car.brand && (
        <span className="absolute top-1.5 left-1.5 z-10 rounded bg-gray-900/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
          {car.brand}
        </span>
      )}
      <Thumbnail url={photo && getPreviewUrl(photo)} fallbackUrl={photo && getImageUrl(photo)} alt={name} className="w-full h-48" />
      <p className={cardTitle} title={name}>
        {name} <span className="text-xs font-medium text-gray-500 dark:text-gray-400">({variants.length})</span>
      </p>
      {modelYear && (
        <p className={cardMeta}>
          {t('model.modelYear')}: <span className="font-semibold text-gray-700 dark:text-gray-200">{modelYear}</span>
        </p>
      )}
      {years && <p className={cardMeta}>{years}</p>}
    </div>
  );
});

export default ModelCard;
