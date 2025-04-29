import { useState } from 'react';
import Image from 'next/image';
import CarIcon from './CarIcon';
import { getImageUrl as getFullImageUrl, formatCarName } from '../utils/utils';
import CarOverlay from './CarOverlay';
import { CarData } from '../types';

interface CarCardProps {
  car: CarData;
  selectedYear: string;
}

const getImageUrl = (car: CarData, selectedYear: string): string | undefined => {
  if (selectedYear === 'All') {
    // When searching, get the first available image from any year
    const firstImage = car.d.find(item => item.p && !item.p.includes('Image_Not_Available'));
    if (!firstImage?.p) {
      return undefined;
    }
    return getFullImageUrl(firstImage.p);
  }
  
  // When viewing by year, get image for specific year
  const firstImage = car.d.find(item => item.y === selectedYear && item.p && !item.p.includes('Image_Not_Available'));
  if (!firstImage?.p) {
    return undefined;
  }
  return getFullImageUrl(firstImage.p);
};

const CarCard: React.FC<CarCardProps> = ({ car, selectedYear }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const formattedName = formatCarName(car.lnk);
  const imageUrl = getImageUrl(car, selectedYear);

  return (
    <>
      <div 
        className="bg-white rounded-lg shadow hover:translate-y-[-2px] transition-transform overflow-hidden p-2 cursor-pointer"
        onClick={() => setShowOverlay(true)}
      >
        <div className="relative w-full pb-[75%]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={formattedName}
              fill
              objectFit="contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-2">
              <CarIcon />
            </div>
          )}
        </div>
        <div className="pt-1">
          <h3 className="text-xs font-semibold text-blue-600 mb-1">{formattedName}</h3>
        </div>
      </div>

      {showOverlay && (
        <CarOverlay 
          car={car} 
          onClose={() => setShowOverlay(false)} 
        />
      )}
    </>
  );
};

export default CarCard; 