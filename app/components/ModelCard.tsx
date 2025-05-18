import Image from 'next/image';
import { CarData } from '../types';
import { getImageUrl, formatCarName } from '../utils';
import { memo, useMemo, useState } from 'react';

interface ModelCardProps {
  car: CarData;
  onModelClick: (car: CarData) => void;
  selectedYear?: string;
}

const ModelCard = memo(function ModelCard({ car, onModelClick, selectedYear }: ModelCardProps) {
  const [imageError, setImageError] = useState(false);
  
  const firstVariantWithImage = useMemo(
    () => selectedYear 
      ? car.d.find(item => item.y === selectedYear && item.p === 't')
      : car.d.find(item => item.p === 't'),
    [car.d, selectedYear]
  );
  const imageUrl = firstVariantWithImage ? getImageUrl(firstVariantWithImage) : undefined;
  const formattedName = formatCarName(car.lnk);

  // Считаем количество вариантов с учетом выбранного года
  const variantCount = useMemo(
    () => selectedYear 
      ? car.d.filter(item => item.y === selectedYear).length 
      : car.d.length,
    [car.d, selectedYear]
  );

  // Получаем первый и последний год
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
      <div className="relative w-full h-48">
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={formattedName}
            fill
            className="object-contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
            <span className="text-gray-400 dark:text-gray-500 text-sm">No image</span>
          </div>
        )}
      </div>
      <p className="text-sm text-center font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
        {formattedName} <span className="text-gray-500 dark:text-gray-400 font-medium text-xs">({variantCount})</span>
      </p>

      <p className="text-xs text-gray-500 dark:text-gray-400">{yearsDisplay}</p>
    </div>
  );
});

export default ModelCard; 