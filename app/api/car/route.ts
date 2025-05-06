import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CarData } from '../../types';

export async function POST(request: Request) {
  try {
    const { links } = await request.json();

    if (!Array.isArray(links) || links.length === 0) {
      return NextResponse.json(
        { error: 'Invalid input: links must be a non-empty array' },
        { status: 400 }
      );
    }

    // Read data from file
    const filePath = path.join(process.cwd(), 'public', 'carsdata.json');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Data file not found' },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const carsData: CarData[] = JSON.parse(fileContent);

    // Find all cars matching the provided links
    const cars = carsData.filter(car => links.includes(car.lnk));

    if (cars.length === 0) {
      return NextResponse.json(
        { error: 'No cars found for the provided links' },
        { status: 404 }
      );
    }

    return NextResponse.json(cars);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 