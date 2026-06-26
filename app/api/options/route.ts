import { NextResponse } from 'next/server';
import { CarData } from '../../types';
import { loadCarsData } from '../../lib/carsData';
import { AUTOCOMPLETE_FIELDS } from '../../consts';
import { STATIC_CACHE_HEADERS } from '../../lib/http';

const cache: Record<string, string[]> = {};

// Designer values are often collaborations ("Larry Wood and Bob Rosas",
// "Chris Watson, Shawn Moghadam and Manson Cheung", sometimes with a
// "(Collaboration)" / "(Retool)" note). Split them into individual names so the
// dropdown lists one designer per entry; searching a single name still matches
// the collabs (the search does a substring match on the raw designer field).
function splitDesigners(ds: string): string[] {
  return ds
    .replace(/\([^)]*\)/g, ',') // drop parenthetical notes, treat as a boundary
    .split(/\s*,\s*|\s+and\s+|\s*&(?:amp;)?\s*/i) // comma / "and" / "&" / "&amp;"
    .map((s) => s.trim())
    .filter((s) => s && !s.includes('?')); // drop "?" / "???" unknown placeholders
}

function collect(field: string, cars: CarData[]): string[] {
  const set = new Set<string>();
  if (field === 'designer') {
    for (const c of cars) if (c.ds) for (const name of splitDesigners(c.ds)) set.add(name);
  } else if (field === 'wheels') {
    for (const c of cars) for (const v of c.d ?? []) if (v.Wh) set.add(String(v.Wh).trim());
  } else {
    for (const c of cars) for (const v of c.d ?? []) if (v.Sr) set.add(String(v.Sr).trim());
  }
  // Drop empties and any value with a "?" (unknown / uncertain placeholders).
  return [...set].filter((s) => s && !s.includes('?')).sort((a, b) => a.localeCompare(b));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const field = searchParams.get('field');

  if (!field || !AUTOCOMPLETE_FIELDS.includes(field)) {
    return NextResponse.json({ error: 'unsupported field' }, { status: 400 });
  }

  if (!cache[field]) {
    cache[field] = collect(field, await loadCarsData());
  }
  return NextResponse.json(cache[field], { headers: STATIC_CACHE_HEADERS });
}
