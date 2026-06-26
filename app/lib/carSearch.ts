import { CarData } from '../types';
import { MAIN_OBJECT_FIELDS, VARIANT_FIELDS } from '../consts';
import { formatCarName } from '../utils';

/** Splits a query into lowercase words, dropping empty tokens. */
export const tokenize = (value: string): string[] =>
  value.toLowerCase().split(/\s+/).filter(word => word.length > 0);

/** True when `haystack` contains every word in `words` (case-insensitive). */
const includesAll = (haystack: string | undefined, words: string[]): boolean => {
  if (!haystack) return false;
  const lower = haystack.toLowerCase();
  return words.every(word => lower.includes(word));
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
