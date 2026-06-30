import { CarData } from '../types';

export type Brand = NonNullable<CarData['brand']>; // 'hw' | 'mb' | 'mj'

export interface BrandInfo {
  key: Brand;
  name: string;
  file: string; // filename under data/
  wiki: string; // page base for "view on fandom" links
}

// App-side brand registry (the scraper has its own in scripts/lib/brands.js;
// the two runtimes are separate). Hot Wheels is first — the original base.
export const BRANDS: BrandInfo[] = [
  { key: 'hw', name: 'Hot Wheels', file: 'hw.json', wiki: 'https://hotwheels.fandom.com/wiki/' },
  { key: 'mb', name: 'Matchbox', file: 'mb.json', wiki: 'https://matchbox.fandom.com/wiki/' },
  { key: 'mj', name: 'Majorette', file: 'mj.json', wiki: 'https://majorette-model-cars.fandom.com/wiki/' },
  { key: 'we', name: 'Welly', file: 'we.json', wiki: 'https://www.wellydiecast.com/' },
];

// Wiki page base for a casting's brand (falls back to Hot Wheels).
export const brandWiki = (brand: Brand | undefined): string =>
  (BRANDS.find((b) => b.key === brand) ?? BRANDS[0]).wiki;
