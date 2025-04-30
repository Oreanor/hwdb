import { CarData } from '../types';
import ModelCard from './ModelCard';

interface ModelsGridProps {
  cars: CarData[];
  onModelClick: (car: CarData) => void;
  selectedYear?: string;
}

export default function ModelsGrid({ cars, onModelClick, selectedYear }: ModelsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {cars.map((car) => (
        <ModelCard
          key={car.lnk}
          car={car}
          onModelClick={onModelClick}
          selectedYear={selectedYear}
        />
      ))}
    </div>
  );
} 