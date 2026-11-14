import { promises as fs } from 'fs';
import path from 'path';
import { CarData } from '../types';
import { BRANDS, BrandInfo } from './brands';

let cache: CarData[] | null = null;

export const dataFile = (file: string) => path.join(process.cwd(), 'data', file);

// Reads one brand's raw casting file as stored on disk (no brand stamping).
// Returns null when the file doesn't exist yet (a brand before its first sync).
export async function readBrandFile(b: BrandInfo): Promise<CarData[] | null> {
  try {
    return JSON.parse(await fs.readFile(dataFile(b.file), 'utf-8')) as CarData[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

/**
 * Loads every brand's casting file, stamps each record with its `brand`, and
 * concatenates them.
 *
 * The dataset is static (regenerated on deploy), so it is parsed once and kept
 * in module-level memory. Missing brand files are simply skipped. Every record
 * returned from here carries `brand`, so server code never needs a default.
 */
export async function loadCarsData(): Promise<CarData[]> {
  if (!cache) {
    const perBrand = await Promise.all(
      BRANDS.map(async (b) =>
        // Stamp brand on the casting and on every variant (the latter picks
        // the image subfolder in getImageUrl).
        ((await readBrandFile(b)) ?? []).map((c) => ({
          ...c,
          brand: b.key,
          d: c.d.map((v) => ({ ...v, brand: b.key })),
        }))
      )
    );
    cache = perBrand.flat();
  }
  return cache;
}

// Drop the in-memory cache so the next load re-reads the files (used after the
// local series-cleanup tool rewrites them).
export function invalidateCarsData() {
  cache = null;
}

// Each casting that has variants passing `keep`, with only those variants.
export function selectVariants(
  cars: CarData[],
  keep: (v: CarData['d'][number], car: CarData) => boolean
): CarData[] {
  const result: CarData[] = [];
  for (const car of cars) {
    const d = car.d.filter((v) => keep(v, car));
    if (d.length) result.push(d.length === car.d.length ? car : { ...car, d });
  }
  return result;
}
