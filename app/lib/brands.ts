import { CarData } from '../types';

export type Brand = NonNullable<CarData['brand']>; // 'hw' | 'mb' | 'mj'

export interface BrandInfo {
  key: Brand;
  name: string;
  file: string; // filename under data/
  base: string; // site base for the "view source" link
  source: string; // label for that link ("Matchbox Fandom", "wellydiecast.com")
}

// App-side brand registry (the scraper has its own in scripts/lib/brands.js;
// the two runtimes are separate). Hot Wheels is first — the original base.
export const BRANDS: BrandInfo[] = [
  { key: 'hw', name: 'Hot Wheels', file: 'hw.json', base: 'https://hotwheels.fandom.com/wiki/', source: 'Hot Wheels Fandom' },
  { key: 'mb', name: 'Matchbox', file: 'mb.json', base: 'https://matchbox.fandom.com/wiki/', source: 'Matchbox Fandom' },
  { key: 'mj', name: 'Majorette', file: 'mj.json', base: 'https://majorette-model-cars.fandom.com/wiki/', source: 'Majorette Fandom' },
  { key: 'we', name: 'Welly', file: 'we.json', base: 'https://www.wellydiecast.com/', source: 'wellydiecast.com' },
];

const brandInfo = (brand: Brand | undefined): BrandInfo => BRANDS.find((b) => b.key === brand) ?? BRANDS[0];

// The "view source" link for a casting. Fandom brands link to the wiki page by
// its slug; Welly (a catalog, not a wiki) has no name pages, so it links to a
// keyword search on the item number.
export const brandSource = (brand: Brand | undefined, lnk: string, itemNo?: string) => {
  const b = brandInfo(brand);
  const url = b.key === 'we'
    ? `${b.base}product.php?keyword=${encodeURIComponent(itemNo || lnk)}&mode=search`
    : `${b.base}${lnk}`;
  return { url, label: b.source };
};
