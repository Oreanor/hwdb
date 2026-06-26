import { promises as fs } from 'fs';
import path from 'path';

export interface CastingTag {
  lnk: string;
  mk?: string; // make
  rg?: string; // region
  md?: string; // model ("Ford Mustang")
  th?: string[]; // themes (incl. decade eras like "1950s")
  yr?: number; // the real car's model year
}

let cache: Map<string, CastingTag> | null = null;

// Per-casting tags (built by scripts/build-tags.js), parsed once into a lookup.
// Cached in production; re-read in dev so rebuilt tags apply without a restart.
export async function loadCastingTags(): Promise<Map<string, CastingTag>> {
  if (!cache || process.env.NODE_ENV !== 'production') {
    const file = await fs.readFile(path.join(process.cwd(), 'data', 'casting-tags.json'), 'utf-8');
    const arr = JSON.parse(file) as CastingTag[];
    cache = new Map(arr.map((tag) => [tag.lnk, tag]));
  }
  return cache;
}

// True when a casting satisfies every token of a tag query (see lib/tags.ts).
export function castingMatchesTag(tag: CastingTag | undefined, value: string): boolean {
  if (!tag) return false;
  return value.split(',').every((tok) => {
    const i = tok.indexOf(':');
    const p = tok.slice(0, i);
    const v = tok.slice(i + 1);
    if (p === 'mk') return tag.mk === v;
    if (p === 'rg') return tag.rg === v;
    if (p === 'md') return tag.md === v;
    if (p === 'th') return !!tag.th && tag.th.includes(v);
    return false;
  });
}
