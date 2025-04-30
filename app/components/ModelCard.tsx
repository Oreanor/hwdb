import Image from 'next/image';
import { CarData } from '../types';
import { getImageUrl, formatCarName } from '../utils';

interface ModelCardProps {
  car: CarData;
  onModelClick: (car: CarData) => void;
  selectedYear?: string;
}

export default function ModelCard({ car, onModelClick, selectedYear }: ModelCardProps) {
  const firstVariantWithImage = car.d.find(item => getImageUrl(item));
  const imageUrl = firstVariantWithImage ? getImageUrl(firstVariantWithImage) : undefined;
  const formattedName = formatCarName(car.lnk);

  // Считаем количество вариантов с учетом выбранного года
  const variantCount = selectedYear 
    ? car.d.filter(item => item.y === selectedYear).length 
    : car.d.length;

  return (
    <div 
      className="flex flex-col items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onModelClick(car)}
    >
      <div className="relative w-full aspect-square mb-2">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={formattedName}
            fill
            style={{ objectFit: 'contain' }}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
          />
        )}
      </div>
      <p className="text-sm text-center font-bold text-gray-900 dark:text-gray-100">
        {formattedName} <span className="text-gray-500 dark:text-gray-400 font-medium text-xs">({variantCount})</span>
      </p>
    </div>
  );
} 