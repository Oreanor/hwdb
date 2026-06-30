'use client';

import { useEffect, useState } from 'react';
import { AUTOCOMPLETE_FIELDS } from '../consts';
import { fetchFieldOptions } from '../services/carService';

// Lazily loads and caches the autocomplete option list for the selected field,
// scoped to the selected brand. Cached per field+brand so switching base swaps
// the suggestions (and switching back is instant).
export function useFieldOptions(selectedField: string, brand = 'all'): string[] | undefined {
  const [optionsByKey, setOptionsByKey] = useState<Record<string, string[]>>({});
  const key = `${selectedField}:${brand}`;

  useEffect(() => {
    if (!AUTOCOMPLETE_FIELDS.includes(selectedField) || optionsByKey[key]) return;
    fetchFieldOptions(selectedField, brand).then((options) =>
      setOptionsByKey((prev) => ({ ...prev, [key]: options }))
    );
  }, [selectedField, brand, key, optionsByKey]);

  return optionsByKey[key];
}
