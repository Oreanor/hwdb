import { CastingTags } from '../types';

// A tag query is one or more "prefix:value" tokens joined by ",", AND-ed:
//   mk = make, rg = region, md = model, th = theme.
// e.g. "th:Supercar,mk:Nissan" -> Nissans that are supercars.
// The tags themselves live on each casting (`car.tags`), embedded by
// scripts/tags/build-tags.js; the browse index is data/tags-index.json.

export interface TagBucket {
  total: number;
  makes: Record<string, number>;
}

export interface TagsIndex {
  regions: Record<string, TagBucket>;
  themes: Record<string, TagBucket>;
  eras: Record<string, TagBucket>;
}

// The browse index is keyed by brand so the home page can show a block per base.
export type BrandTagsIndex = Record<string, TagsIndex>;

const parseTag = (query: string) =>
  query.split(',').map((tok) => {
    const i = tok.indexOf(':');
    return { prefix: tok.slice(0, i), value: tok.slice(i + 1) };
  });

// Human label for a tag query: "th:Supercar,mk:Nissan" -> "Supercar · Nissan".
export const tagLabel = (query: string): string =>
  parseTag(query)
    .map((t) => t.value)
    .filter(Boolean)
    .join(' · ');

// True when a casting's tags satisfy every token of a tag query.
export function castingMatchesTag(tags: CastingTags | undefined, query: string): boolean {
  if (!tags) return false;
  return parseTag(query).every(({ prefix, value }) => {
    switch (prefix) {
      case 'mk':
        return tags.mk === value;
      case 'rg':
        return tags.rg === value;
      case 'md':
        return tags.md === value;
      case 'th':
        return !!tags.th?.includes(value);
      default:
        return false;
    }
  });
}
