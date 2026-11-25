import { Brand, CarData } from '../types';

export type { Brand };

// What the base switcher can be set to: every brand, or one of them.
export type BrandScope = 'all' | Brand;

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

export const isBrand = (v: string | null | undefined): v is Brand => BRANDS.some((b) => b.key === v);
export const isBrandScope = (v: string): v is BrandScope => v === 'all' || isBrand(v);

// A record's brand; records without one predate multi-brand support and are Hot Wheels.
export const brandOf = (item: { brand?: Brand }): Brand => item.brand ?? 'hw';

// Keep only the records of `scope` ('all' or unset keeps everything).
export const inBrandScope = <T extends { brand?: Brand }>(items: T[], scope?: string | null): T[] =>
  !scope || scope === 'all' ? items : items.filter((c) => brandOf(c) === scope);

const brandInfo = (brand: Brand | undefined): BrandInfo => BRANDS.find((b) => b.key === brand) ?? BRANDS[0];

// The "view source" link for a casting. Fandom brands link to the wiki page by
// its slug; Welly (a catalog, not a wiki) has no name pages, so it links to a
// keyword search on the item number.
export const brandSource = (car: CarData) => {
  const b = brandInfo(car.brand);
  const url =
    b.key === 'we'
      ? `${b.base}product.php?keyword=${encodeURIComponent(car.d[0]?.Tn || car.lnk)}&mode=search`
      : `${b.base}${car.lnk}`;
  return { url, label: b.source };
};
