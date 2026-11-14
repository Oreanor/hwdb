import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { BRANDS } from '../../lib/brands';
import { dataFile, invalidateCarsData, readBrandFile } from '../../lib/carsData';
import { badRequest, withErrors } from '../../lib/http';

/**
 * Applies a series cleanup to every brand's data file (the /series tool lists
 * the series of all brands, so it must edit all of them):
 *   - `remove`: series names to clear from every variant (Sr deleted)
 *   - `rename`: { oldName: newName } to canonicalize fuzzy duplicates
 * A file is backed up to scripts/output and rewritten only when it changes.
 *
 * Local-only: the production filesystem is read-only and this would be an
 * unauthenticated write, so it is disabled when NODE_ENV === 'production'.
 */
export const POST = withErrors('series-cleanup', async (request: Request) => {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'disabled in production' }, { status: 403 });
  }

  const { remove = [], rename = {} } = await request.json();
  if (!Array.isArray(remove) || typeof rename !== 'object' || rename === null) {
    return badRequest('remove must be an array and rename an object');
  }
  const removeSet = new Set<string>(remove.map((s) => String(s).trim()).filter(Boolean));
  const renameMap = new Map<string, string>();
  for (const [k, v] of Object.entries(rename as Record<string, unknown>)) {
    const from = k.trim();
    const to = String(v).trim();
    if (from && to && from !== to) renameMap.set(from, to);
  }

  const backupDir = path.join(process.cwd(), 'scripts', 'output');
  let removed = 0;
  let renamed = 0;

  for (const b of BRANDS) {
    // A fresh copy from disk (the live cache is never mutated).
    const cars = await readBrandFile(b);
    if (!cars) continue;

    let changed = false;
    for (const c of cars) {
      for (const v of c.d ?? []) {
        const s = v.Sr?.trim();
        if (!s) continue;
        if (removeSet.has(s)) {
          delete v.Sr;
          removed++;
          changed = true;
        } else if (renameMap.has(s)) {
          v.Sr = renameMap.get(s)!;
          renamed++;
          changed = true;
        }
      }
    }
    if (!changed) continue;

    await fs.mkdir(backupDir, { recursive: true });
    await fs.copyFile(dataFile(b.file), path.join(backupDir, `${b.key}.pre-series-cleanup.json`));
    await fs.writeFile(dataFile(b.file), JSON.stringify(cars, null, 2), 'utf-8');
  }
  invalidateCarsData();

  return NextResponse.json({
    ok: true,
    removedVariants: removed,
    renamedVariants: renamed,
    removedSeries: removeSet.size,
    renamedSeries: renameMap.size,
  });
});
