import { memo, useMemo } from 'react';
import { CarData } from '../types';
import { getVariantImages, formatCarName, hasImage } from '../utils';
import { matchesYear, yearSpan, formatYearSpan } from '../lib/years';
import { t } from '../i18n';
import Thumbnail from './Thumbnail';
import BrandBadge from './BrandBadge';

interface ModelCardProps {
  car: CarData;
  onModelClick: (car: CarData) => void;
  selectedYear?: string;
  showBrand?: boolean;
}

// A casting card: photo, name, variant count (within the selected year),
// the real car's model year and the casting's production span.
const ModelCard = memo(function ModelCard({ car, onModelClick, selectedYear, showBrand }: ModelCardProps) {
  const { count, images, years } = useMemo(() => {
    const variants = car.d.filter((v) => matchesYear(v, selectedYear));
    return {
      count: variants.length,
      images: getVariantImages(variants.find(hasImage)),
      years: formatYearSpan(yearSpan(car.d)),
    };
  }, [car.d, selectedYear]);
  const name = formatCarName(car.lnk);

  return (
    <div
      className="relative flex flex-col items-center p-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onModelClick(car)}
    >
      {showBrand && <BrandBadge brand={car.brand} className="absolute top-1 left-1 z-10" />}
      <Thumbnail url={images.preview} fallbackUrl={images.full} alt={name} className="w-full h-48" />
      <p className="text-sm text-center font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
        {name} <span className="text-gray-500 dark:text-gray-400 font-medium text-xs">({count})</span>
      </p>

      {car.tags?.yr && (
        <p className="text-xs text-gray-600 dark:text-gray-300">
          {t('model.modelYear')}: <span className="font-semibold">{car.tags.ye ? '≈' : ''}{car.tags.yr}</span>
        </p>
      )}
      {years && <p className="text-xs text-gray-500 dark:text-gray-400">{years}</p>}
    </div>
  );
});

export default ModelCard;
