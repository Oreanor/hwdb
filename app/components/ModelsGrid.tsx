import { memo } from 'react';
import { CarData } from '../types';
import { castingKey } from '../lib/brands';
import ModelCard from './ModelCard';

interface ModelsGridProps {
  cars: CarData[];
  onModelClick: (car: CarData) => void;
  selectedYear?: string;
  showBrand?: boolean; // show the brand badge (only when results span >1 brand)
}

const ModelsGrid = memo(function ModelsGrid({ cars, onModelClick, selectedYear, showBrand }: ModelsGridProps) {
  return (
    <div className="w-full h-full overflow-x-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {cars.map((car) => (
          <ModelCard
            key={castingKey(car)}
            car={car}
            onModelClick={onModelClick}
            selectedYear={selectedYear}
            showBrand={showBrand}
          />
        ))}
      </div>
    </div>
  );
});

export default ModelsGrid;
