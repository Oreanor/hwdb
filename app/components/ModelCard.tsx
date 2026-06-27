import { CarData } from '../types';
import { getImageUrl, getPreviewUrl, formatCarName } from '../utils';
import { memo, useMemo } from 'react';
import { t } from '../i18n';
import Thumbnail from './Thumbnail';

interface ModelCardProps {
  car: CarData;
  onModelClick: (car: CarData) => void;
  selectedYear?: string;
}

const ModelCard = memo(function ModelCard({ car, onModelClick, selectedYear }: ModelCardProps) {
  const firstVariantWithImage = useMemo(
    () => selectedYear 
      ? car.d.find(item => item.y === selectedYear && item.p === 't')
      : car.d.find(item => item.p === 't'),
    [car.d, selectedYear]
  );
  const imageUrl = firstVariantWithImage ? getImageUrl(firstVariantWithImage) : undefined;
  const previewUrl = firstVariantWithImage ? getPreviewUrl(firstVariantWithImage) : undefined;
  const formattedName = formatCarName(car.lnk);

  // Count variants, respecting the selected-year filter.
  const variantCount = useMemo(
    () => selectedYear 
      ? car.d.filter(item => item.y === selectedYear).length 
      : car.d.length,
    [car.d, selectedYear]
  );

  // First and last production years for the range label.
  const years = useMemo(
    () => car.d
      .map(item => item.y)
      .filter(year => year)
      .sort(),
    [car.d]
  );
  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  const yearsDisplay = firstYear === lastYear ? firstYear : `${firstYear}–${lastYear}`;

  return (
    <div 
      className="flex flex-col items-center p-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onModelClick(car)}
    >
      <Thumbnail url={previewUrl} fallbackUrl={imageUrl} alt={formattedName} className="w-full h-48" />
      <p className="text-sm text-center font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
        {formattedName} <span className="text-gray-500 dark:text-gray-400 font-medium text-xs">({variantCount})</span>
      </p>

      {car.tags?.yr && (
        <p className="text-xs text-gray-600 dark:text-gray-300">
          {t('model.modelYear')}: <span className="font-semibold">{car.tags.ye ? '≈' : ''}{car.tags.yr}</span>
        </p>
      )}
      {yearsDisplay && <p className="text-xs text-gray-500 dark:text-gray-400">{yearsDisplay}</p>}
    </div>
  );
});

export default ModelCard; 