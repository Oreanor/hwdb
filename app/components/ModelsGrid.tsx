import { CarData } from '../types';
import ModelCard from './ModelCard';
import { memo } from 'react';

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
        {cars.map((car, index) => (
          <ModelCard
            key={`${car.brand ?? 'hw'}:${car.lnk}-${index}`}
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

ModelsGrid.displayName = 'ModelsGrid';

export default ModelsGrid; 