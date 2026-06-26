import { NextResponse } from 'next/server';
import { loadCarsData } from '../../lib/carsData';

export async function POST(request: Request) {
  try {
    const { links } = await request.json();

    if (!Array.isArray(links) || links.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input: links must be a non-empty array' },
        { status: 400 }
      );
    }

    const carsData = await loadCarsData();
    const cars = carsData.filter(car => links.includes(car.lnk));

    if (cars.length === 0) {
      return NextResponse.json(
        { error: 'No cars found for the provided links' },
        { status: 404 }
      );
    }

    return NextResponse.json(cars);
  } catch (error) {
    console.error('Error processing car request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
