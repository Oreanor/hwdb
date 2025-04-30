import Image from 'next/image';
import { useMemo } from 'react';
import { CarData } from '../types';
import { getImageUrl, formatCarName } from '../utils/utils';

interface ModelsGridProps {
  cars: CarData[];
  selectedYear: string;
  onImageClick: (url: string) => void;
}

export default function ModelsGrid({ cars, selectedYear, onImageClick }: ModelsGridProps) {
  const modelCards = useMemo(() => {
    return cars.map(car => {
      // Find first variant with an image for the selected year, or any year if none found
      const selectedYearVariant = car.d.find(item => 
        item.y === selectedYear && getImageUrl(item)
      );
      const anyYearVariant = car.d.find(item => getImageUrl(item));
      const variant = selectedYearVariant || anyYearVariant;
      
      const imageUrl = variant ? getImageUrl(variant) : null;
      const modelName = formatCarName(car.lnk);
      const modelNumber = variant?.N || car.d[0]?.N;

      return {
        modelName,
        modelNumber,
        imageUrl,
        variant
      };
    });
  }, [cars, selectedYear]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
      {modelCards.map(({ modelName, modelNumber, imageUrl }) => (
        <div 
          key={modelName}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
          style={{ height: '200px' }}
        >
          <div className="relative h-[140px] bg-gray-100">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={modelName}
                fill
                style={{ objectFit: 'contain' }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="cursor-pointer"
                onClick={() => onImageClick(imageUrl)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                No image
              </div>
            )}
          </div>
          <div className="p-3">
            <h3 className="text-sm font-bold text-gray-900 truncate" title={modelName}>
              {modelName}
            </h3>
            {modelNumber && (
              <p className="text-xs text-gray-500 mt-1">
                #{modelNumber}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 