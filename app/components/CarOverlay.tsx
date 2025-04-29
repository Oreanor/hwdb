import { useState } from 'react';
import Image from 'next/image';
import { CarData } from '../types';
import { formatCarName } from '../utils/utils';
import CarTable from './CarTable';

interface CarOverlayProps {
  car: CarData;
  onClose: () => void;
}

const formatYears = (years: string[]): string => {
  const uniqueYears = [...new Set(years)].map(Number).sort((a, b) => a - b);
  const result: string[] = [];
  let start = uniqueYears[0];
  let prev = uniqueYears[0];

  for (let i = 1; i <= uniqueYears.length; i++) {
    const current = uniqueYears[i];
    if (current === prev + 1) {
      prev = current;
    } else {
      if (start === prev) {
        result.push(start.toString());
      } else {
        result.push(`${start}-${prev}`);
      }
      start = current;
      prev = current;
    }
  }

  return result.join(', ');
};

const CarOverlay: React.FC<CarOverlayProps> = ({ car, onClose }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const formattedName = formatCarName(car.lnk);
  const formattedYears = formatYears(car.d.map(item => item.y));

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-200 bg-opacity-30 flex items-center justify-center z-50 p-8"
      onClick={handleOverlayClick}
    >
      <div className="relative">
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 text-gray-500 hover:text-gray-700 text-xl z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md cursor-pointer"
        >
          ✕
        </button>
        <div 
          className="bg-white rounded-lg p-8 w-[90vw] max-w-[1320px] max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold">{formattedName}</h2>
              <div className="mt-2 text-sm text-gray-600">
                <div><span className="font-semibold">Years:</span> {formattedYears}</div>
                {car.ds && <div><span className="font-semibold">Designer:</span> {car.ds}</div>}
              </div>
            </div>
          </div>
          
          <CarTable car={car} onImageClick={setSelectedImage} />
        </div>
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 cursor-pointer p-8"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-[45vw] h-[45vh] bg-white rounded-lg shadow-2xl border-4 border-white">
            <Image
              src={selectedImage}
              alt="Enlarged view"
              fill
              objectFit="contain"
              sizes="45vw"
              className="rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CarOverlay; 