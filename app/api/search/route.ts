import { NextResponse } from 'next/server';
import { CarData } from '../../types';
import { MAIN_OBJECT_FIELDS, VARIANT_FIELDS } from '../../consts';
import { formatCarName } from '../../utils';
import { loadCarsData } from '../../lib/carsData';

// Variants are returned trimmed to the fields the grid needs (year, image flag, id).
const trimVariants = (car: CarData): CarData => ({
  ...car,
  d: car.d.map(item => ({ y: item.y, p: item.p, id: item.id })),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const field = searchParams.get('field');
    const value = searchParams.get('value');
    const year = searchParams.get('year');

    const carsData = await loadCarsData();

    let filteredData = carsData;

    // Narrow to cars that have at least one variant from the requested year.
    if (year) {
      filteredData = filteredData.filter(car => car.d.some(item => item.y === year));
    }

    if (field && value && value.trim() !== '') {
      const searchValue = value.toLowerCase();
      const searchWords = searchValue.split(/\s+/).filter(word => word.length > 0);

      filteredData = filteredData
        .map(car => {
          // Exact match on the wiki link.
          if (field === 'link') {
            return car.lnk === value ? trimVariants(car) : { ...car, d: [] };
          }

          // Match against the human-readable model name derived from the link.
          if (field === 'name') {
            const formattedName = formatCarName(car.lnk).toLowerCase();
            return searchWords.every(word => formattedName.includes(word))
              ? trimVariants(car)
              : { ...car, d: [] };
          }

          // Keep the car if any variant is from the requested year.
          if (field === 'year') {
            return car.d.some(item => item.y === value) ? trimVariants(car) : { ...car, d: [] };
          }

          // Top-level car fields (designer, description, ...).
          const mainObjectField = MAIN_OBJECT_FIELDS[field];
          if (mainObjectField) {
            const fieldValue = (car[mainObjectField] as string)?.toLowerCase();
            return fieldValue && searchWords.every(word => fieldValue.includes(word))
              ? trimVariants(car)
              : { ...car, d: [] };
          }

          // Per-variant fields (series, color, wheels, ...).
          const variantField = VARIANT_FIELDS[field];
          if (!variantField) {
            console.warn('Unknown search field:', field);
            return { ...car, d: [] };
          }

          const hasMatchingVariant = car.d.some(item => {
            const fieldValue = item[variantField];
            return (
              typeof fieldValue === 'string' &&
              searchWords.every(word => fieldValue.toLowerCase().includes(word))
            );
          });

          return hasMatchingVariant ? trimVariants(car) : { ...car, d: [] };
        })
        .filter(car => car.d.length > 0);
    } else {
      // No search term: return nothing (the year-only listing is handled above).
      filteredData = [];
    }

    return NextResponse.json(filteredData);
  } catch (error) {
    console.error('Error processing search request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
