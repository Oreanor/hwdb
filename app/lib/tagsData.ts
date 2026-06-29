import { CastingTags } from '../types';

// A tag query is one or more "prefix:value" tokens joined by ",", AND-ed
// (see lib/tags.ts). Browse tags now live on each casting (`car.tags`), embedded
// by scripts/tags/build-tags.js — there is no separate tags file to load.

// True when a casting's tags satisfy every token of a tag query.
export function castingMatchesTag(tag: CastingTags | undefined, value: string): boolean {
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
