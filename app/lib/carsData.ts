import { promises as fs } from 'fs';
import path from 'path';
import { CarData } from '../types';

let cache: CarData[] | null = null;

/**
 * Loads and parses public/carsdata.json.
 *
 * The dataset is static (regenerated on deploy), so it is parsed once and kept
 * in module-level memory. This avoids re-reading and re-parsing ~15 MB of JSON
 * on every API request.
 */
export async function loadCarsData(): Promise<CarData[]> {
  if (!cache) {
    const filePath = path.join(process.cwd(), 'public', 'carsdata.json');
    const file = await fs.readFile(filePath, 'utf-8');
    cache = JSON.parse(file) as CarData[];
  }
  return cache;
}
