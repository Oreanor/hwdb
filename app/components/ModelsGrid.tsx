'use client';

import { memo } from 'react';
import { CarData } from '../types';
import { brandOf } from '../lib/brands';
import ModelCard from './ModelCard';
import { cardGrid } from './ui/styles';

interface ModelsGridProps {
  cars: CarData[];
  onModelClick: (car: CarData) => void;
  selectedYear?: string;
  showBrand?: boolean; // show the brand badge (only when results span >1 brand)
}

// Castings as a grid of cards.
const ModelsGrid = memo(function ModelsGrid({ cars, onModelClick, selectedYear, showBrand }: ModelsGridProps) {
  return (
    <div className={`${cardGrid} pt-4`}>
      {cars.map((car) => (
        <ModelCard
          key={`${brandOf(car)}:${car.lnk}`}
          car={car}
          onModelClick={onModelClick}
          selectedYear={selectedYear}
          showBrand={showBrand}
        />
      ))}
    </div>
  );
});

export default ModelsGrid;
