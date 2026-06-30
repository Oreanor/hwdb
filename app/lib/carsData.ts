import { promises as fs } from 'fs';
import path from 'path';
import { CarData } from '../types';
import { BRANDS } from './brands';

let cache: CarData[] | null = null;

const dataFile = (file: string) => path.join(process.cwd(), 'data', file);

// Hot Wheels is the original single-file base that the local series-cleanup tool
// rewrites in place.
export const CARS_DATA_PATH = dataFile(BRANDS[0].file);

/**
 * Loads every brand's casting file, stamps each record with its `brand`, and
 * concatenates them.
 *
 * The dataset is static (regenerated on deploy), so it is parsed once and kept
 * in module-level memory. Missing brand files (e.g. Matchbox/Majorette before
 * their first sync) are simply skipped.
 */
export async function loadCarsData(): Promise<CarData[]> {
  if (!cache) {
    const perBrand = await Promise.all(
      BRANDS.map(async (b) => {
        try {
          const raw = await fs.readFile(dataFile(b.file), 'utf-8');
          // Stamp brand on the casting and on every variant (the latter picks
          // the image subfolder in getImageUrl).
          return (JSON.parse(raw) as CarData[]).map((c) => ({
            ...c,
            brand: b.key,
            d: c.d.map((v) => ({ ...v, brand: b.key })),
          }));
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
          throw err;
        }
      })
    );
    cache = perBrand.flat();
  }
  return cache;
}

// Drop the in-memory cache so the next load re-reads the files (used after the
// local series-cleanup tool rewrites the Hot Wheels base).
export function invalidateCarsData() {
  cache = null;
}
