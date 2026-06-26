import { NextResponse } from 'next/server';
import { CarData } from '../../types';
import { loadCarsData } from '../../lib/carsData';
import { carMatchesQuery, tokenize } from '../../lib/carSearch';

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
      const words = tokenize(value);
      filteredData = filteredData
        .filter(car => carMatchesQuery(car, field, words, value))
        .map(trimVariants)
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
