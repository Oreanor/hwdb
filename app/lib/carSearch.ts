import { CarData } from '../types';
import { MAIN_OBJECT_FIELDS, VARIANT_FIELDS } from '../consts';
import { formatCarName } from '../utils';

/** Splits a query into lowercase words, dropping empty tokens. */
export const tokenize = (value: string): string[] =>
  value.toLowerCase().split(/\s+/).filter(word => word.length > 0);

// Typo tolerance scales with word length: short words must match exactly,
// "1 wrong letter out of 7" for medium words, 2 for long ones.
const maxEdits = (word: string): number => (word.length <= 3 ? 0 : word.length <= 7 ? 1 : 2);

// Bounded Levenshtein: true when edit distance(a, b) <= max. Bails out early
// once a whole DP row exceeds the budget, so it stays cheap for short strings.
const withinEditDistance = (a: string, b: string, max: number): boolean => {
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > max) return false;
  let prev = Array.from({ length: lb + 1 }, (_, j) => j);
  for (let i = 1; i <= la; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return false;
    prev = cur;
  }
  return prev[lb] <= max;
};

// A query word matches if it's a substring (covers partials like "must" ->
// "mustang") or is within the typo budget of any whitespace token in haystack.
const wordMatches = (lowerHaystack: string, tokens: string[], word: string): boolean => {
  if (lowerHaystack.includes(word)) return true;
  const max = maxEdits(word);
  if (max === 0) return false;
  return tokens.some((tok) => withinEditDistance(tok, word, max));
};

/** True when `haystack` matches every word in `words` (case-insensitive, typo-tolerant). */
export const includesAll = (haystack: string | undefined, words: string[]): boolean => {
  if (!haystack) return false;
  const lower = haystack.toLowerCase();
  const tokens = lower.split(/\s+/).filter(Boolean);
  return words.every(word => wordMatches(lower, tokens, word));
};

/**
 * Single source of truth for "does this car match the query?".
 *
 * Used both server-side (the /api/search route, against the full dataset) and
 * client-side (filtering an already-loaded collection), so the two code paths
 * can never drift apart.
 *
 * `words` is the pre-tokenized query (tokenize once, then test many cars);
 * `rawValue` is the original query, needed for the exact-match fields.
 */
export const carMatchesQuery = (
  car: CarData,
  field: string,
  words: string[],
  rawValue: string
): boolean => {
  // Exact-match fields.
  if (field === 'link') return car.lnk === rawValue;
  if (field === 'year') return car.d.some(item => item.y === rawValue);

  // The model name is derived from its wiki link.
  if (field === 'name') return includesAll(formatCarName(car.lnk), words);

  // Top-level car fields (designer, description, ...).
  const mainObjectField = MAIN_OBJECT_FIELDS[field];
  if (mainObjectField) return includesAll(car[mainObjectField] as string | undefined, words);

  // Per-variant fields (series, color, wheels, ...) — match if any variant hits.
  const variantField = VARIANT_FIELDS[field];
  if (variantField) {
    return car.d.some(item => {
      const value = item[variantField];
      return typeof value === 'string' && includesAll(value, words);
    });
  }

  console.warn('Unknown search field:', field);
  return false;
};
