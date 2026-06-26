import { promises as fs } from 'fs';
import path from 'path';
import { CarData } from '../types';

let cache: CarData[] | null = null;

export const CARS_DATA_PATH = path.join(process.cwd(), 'data', 'carsdata.json');

/**
 * Loads and parses data/carsdata.json.
 *
 * The dataset is static (regenerated on deploy), so it is parsed once and kept
 * in module-level memory. This avoids re-reading and re-parsing ~15 MB of JSON
 * on every API request.
 */
export async function loadCarsData(): Promise<CarData[]> {
  if (!cache) {
    const file = await fs.readFile(CARS_DATA_PATH, 'utf-8');
    cache = JSON.parse(file) as CarData[];
  }
  return cache;
}

// Drop the in-memory cache so the next load re-reads the file (used after the
// local series-cleanup tool rewrites it).
export function invalidateCarsData() {
  cache = null;
}
