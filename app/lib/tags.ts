// A tag query is one or more "prefix:value" tokens joined by ",", AND-ed:
//   mk = make, rg = region, md = model, th = theme.
// e.g. "th:Supercar,mk:Nissan" -> Nissans that are supercars.

export interface TagBucket {
  total: number;
  makes: Record<string, number>;
}

export interface TagsIndex {
  regions: Record<string, TagBucket>;
  themes: Record<string, TagBucket>;
  eras: Record<string, TagBucket>;
}

// Human label for a tag value: "th:Supercar,mk:Nissan" -> "Supercar · Nissan".
export function tagLabel(value: string): string {
  return value
    .split(',')
    .map((tok) => tok.slice(tok.indexOf(':') + 1))
    .filter(Boolean)
    .join(' · ');
}
