import { loadCarsData } from '../../lib/carsData';
import { BRANDS, brandOf } from '../../lib/brands';
import { staticJson, withErrors } from '../../lib/http';
import type { BrandStats } from '../../types';

// Per-brand catalog sizes (castings + variants), for the welcome screen.
export const GET = withErrors('stats', async () => {
  const stats: BrandStats = {};
  for (const b of BRANDS) stats[b.key] = { castings: 0, variants: 0 };
  for (const c of await loadCarsData()) {
    const s = (stats[brandOf(c)] ??= { castings: 0, variants: 0 });
    s.castings++;
    s.variants += c.d.length;
  }
  return staticJson(stats);
});
