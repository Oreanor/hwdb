import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { CarData } from '../../types';
import { invalidateCarsData, CARS_DATA_PATH } from '../../lib/carsData';

/**
 * Applies a series cleanup to data/hw.json:
 *   - `remove`: series names to clear from every variant (Sr deleted)
 *   - `rename`: { oldName: newName } to canonicalize fuzzy duplicates
 *
 * Local-only: the production filesystem is read-only and this would be an
 * unauthenticated write, so it is disabled when NODE_ENV === 'production'.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'disabled in production' }, { status: 403 });
  }

  try {
    const { remove = [], rename = {} } = await request.json();
    const removeSet = new Set<string>((remove as string[]).map((s) => s.trim()).filter(Boolean));
    const renameMap = new Map<string, string>();
    for (const [k, v] of Object.entries(rename as Record<string, string>)) {
      const from = k.trim();
      const to = String(v).trim();
      if (from && to && from !== to) renameMap.set(from, to);
    }

    // Operate on a fresh copy read from disk (don't mutate the live cache).
    const cars: CarData[] = JSON.parse(await fs.readFile(CARS_DATA_PATH, 'utf-8'));

    let removed = 0;
    let renamed = 0;
    for (const c of cars) {
      for (const v of c.d ?? []) {
        const s = v.Sr?.trim();
        if (!s) continue;
        if (removeSet.has(s)) {
          delete v.Sr;
          removed++;
        } else if (renameMap.has(s)) {
          v.Sr = renameMap.get(s)!;
          renamed++;
        }
      }
    }

    const backup = path.join(process.cwd(), 'scripts', 'output', 'carsdata.pre-series-cleanup.json');
    await fs.mkdir(path.dirname(backup), { recursive: true });
    await fs.copyFile(CARS_DATA_PATH, backup);
    await fs.writeFile(CARS_DATA_PATH, JSON.stringify(cars, null, 2), 'utf-8');
    invalidateCarsData();

    return NextResponse.json({
      ok: true,
      removedVariants: removed,
      renamedVariants: renamed,
      removedSeries: removeSet.size,
      renamedSeries: renameMap.size,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
