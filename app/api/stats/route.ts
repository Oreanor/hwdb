import { loadCarsData } from '../../lib/carsData';
import { BRANDS, brandOf } from '../../lib/brands';
import { staticJson } from '../../lib/http';
import { BrandStats } from '../../types';

// Per-brand catalog sizes (castings + variants), for the welcome screen.
export async function GET() {
  const stats: BrandStats = Object.fromEntries(BRANDS.map((b) => [b.key, { castings: 0, variants: 0 }]));
  for (const c of await loadCarsData()) {
    const s = stats[brandOf(c)];
    s.castings++;
    s.variants += c.d.length;
  }
  return staticJson(stats);
}
