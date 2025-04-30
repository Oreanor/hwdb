import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CarData } from '../../types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lnk = searchParams.get('lnk');

    if (!lnk) {
      return NextResponse.json(
        { error: 'Missing lnk parameter' },
        { status: 400 }
      );
    }

    // Читаем данные из файла
    const filePath = path.join(process.cwd(), 'public', 'carsdata.json');
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Data file not found' },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    const carsData: CarData[] = JSON.parse(fileContent);

    // Ищем модель по lnk
    const car = carsData.find(car => car.lnk === lnk);

    if (!car) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(car);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 