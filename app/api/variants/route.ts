import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import { CarDataItem } from '@/app/types';

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: 'ids must be an array' }, { status: 400 });
    }
    // Путь к carsdata.json
    const filePath = path.join(process.cwd(), 'public', 'carsdata.json');
    const file = await fs.readFile(filePath, 'utf-8');
    const cars = JSON.parse(file);
    // Собираем CarData, где d содержит только нужные варианты
    const result = [];
    for (const car of cars) {
      if (Array.isArray(car.d)) {
        const filteredVariants = car.d.filter((variant: CarDataItem) => ids.includes(variant.id));
        if (filteredVariants.length > 0) {
          result.push({ ...car, d: filteredVariants });
        }
      }
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 