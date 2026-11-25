'use client';

import { useEffect, useState } from 'react';
import { AUTOCOMPLETE_FIELDS } from '../consts';
import { fetchFieldOptions } from '../services/carService';

// Lazily loads the autocomplete list for the selected field, scoped to the
// selected brand. Cached per field+brand, so switching back is instant.
export function useFieldOptions(field: string, brand = 'all'): string[] | undefined {
  const [optionsByKey, setOptionsByKey] = useState<Record<string, string[]>>({});
  const key = `${field}:${brand}`;
  const loaded = key in optionsByKey;

  useEffect(() => {
    if (!AUTOCOMPLETE_FIELDS.includes(field) || loaded) return;
    fetchFieldOptions(field, brand)
      .catch(() => []) // suggestions are a nicety: no list, no error
      .then((options) => setOptionsByKey((prev) => ({ ...prev, [key]: options })));
  }, [field, brand, key, loaded]);

  return optionsByKey[key];
}
