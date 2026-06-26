'use client';

import { useEffect, useState } from 'react';
import { AUTOCOMPLETE_FIELDS } from '../consts';
import { fetchFieldOptions } from '../services/carService';

// Lazily loads and caches the autocomplete option list for the selected field,
// returning the suggestions for the current field (or undefined).
export function useFieldOptions(selectedField: string): string[] | undefined {
  const [optionsByField, setOptionsByField] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!AUTOCOMPLETE_FIELDS.includes(selectedField) || optionsByField[selectedField]) return;
    fetchFieldOptions(selectedField).then((options) =>
      setOptionsByField((prev) => ({ ...prev, [selectedField]: options }))
    );
  }, [selectedField, optionsByField]);

  return optionsByField[selectedField];
}
