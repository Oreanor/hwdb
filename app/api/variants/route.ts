import { NextRequest, NextResponse } from 'next/server';
import { CarData, CarDataItem } from '@/app/types';
import { loadCarsData } from '@/app/lib/carsData';

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: 'ids must be an array' }, { status: 400 });
    }

    const cars = await loadCarsData();

    // Return each car with only the variants whose id is in the requested set.
    const result: CarData[] = [];
    for (const car of cars) {
      const filteredVariants = car.d.filter((variant: CarDataItem) => ids.includes(variant.id));
      if (filteredVariants.length > 0) {
        result.push({ ...car, d: filteredVariants });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
