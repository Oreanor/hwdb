import type { Brand } from '../types';

export type { Brand };

// The top-panel base switcher: every brand, or a single one.
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

// The brand a record belongs to when it carries none (the original HW base).
export const DEFAULT_BRAND: Brand = BRANDS[0].key;

// A record's brand, with the default applied.
export const brandOf = (x: { brand?: Brand }): Brand => x.brand ?? DEFAULT_BRAND;

export const isBrand = (v: unknown): v is Brand => BRANDS.some((b) => b.key === v);

export const isBrandScope = (v: unknown): v is BrandScope => v === 'all' || isBrand(v);

// True when `x` belongs to the selected scope ('all' or missing = everything).
export const inBrandScope = (x: { brand?: Brand }, scope: string | null | undefined): boolean =>
  !scope || scope === 'all' || brandOf(x) === scope;

// Stable React key for a casting: slugs repeat across brands ("Ford_GT" is in
// both HW and MB), so the brand has to be part of it.
export const castingKey = (car: { brand?: Brand; lnk: string }): string => `${brandOf(car)}:${car.lnk}`;

const brandInfo = (brand: Brand | undefined): BrandInfo => BRANDS.find((b) => b.key === brand) ?? BRANDS[0];

// Human label for a brand ("Hot Wheels"), used by the mixed-brand markers.
export const brandLabel = (brand: Brand | undefined): string => brandInfo(brand).name;

// Position in BRANDS — the display order of a mixed-brand result set. Results
// are grouped by brand before any other sort key, and the grouping never flips
// with the sort direction, so a brand's block always stays in one place.
export const brandRank = (brand: Brand | undefined): number => {
  const i = BRANDS.findIndex((b) => b.key === (brand ?? DEFAULT_BRAND));
  return i === -1 ? BRANDS.length : i;
};

// Primary comparator for every result list that can span brands.
export const byBrand = (a: { brand?: Brand }, b: { brand?: Brand }): number =>
  brandRank(a.brand) - brandRank(b.brand);

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
