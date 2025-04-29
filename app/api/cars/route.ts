import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CarData } from '../../types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('y');
    const search = searchParams.get('s');

    console.log('Request params:', { year, search });

    // Читаем данные из файла
    const filePath = path.join(process.cwd(), 'public', 'carsdata.json');
    console.log('Reading file from:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.error('File does not exist:', filePath);
      return NextResponse.json(
        { error: 'Data file not found' },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    console.log('File size:', fileContent.length);
    
    const carsData: CarData[] = JSON.parse(fileContent);
    console.log('Total cars:', carsData.length);

    let filteredData = carsData;

    // Фильтрация по году
    if (year) {
      console.log('Filtering by year:', year);
      filteredData = filteredData.filter(car => 
        car.d.some(item => item.y === year)
      );
      console.log('Cars after year filter:', filteredData.length);
    }

    // Поиск по названию
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredData = filteredData.filter(car => 
        car.lnk.toLowerCase().includes(searchTerm)
      );
    }

    return NextResponse.json(filteredData);
  } catch (error) {
    console.error('Error processing request:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 