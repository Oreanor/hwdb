'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';

export type SortDirection = 'asc' | 'desc';

// Cycles a column's sort: none -> asc -> desc -> none (another column starts at asc).
export function nextSort<F extends string>(
  current: { field: F; direction: SortDirection } | null,
  field: F
): { field: F; direction: SortDirection } | null {
  if (current?.field !== field) return { field, direction: 'asc' };
  return current.direction === 'asc' ? { field, direction: 'desc' } : null;
}

// Label + arrow for a sortable column header (the <th> itself stays with the caller).
export function SortLabel({ label, direction }: { label: string; direction?: SortDirection }) {
  const Arrow = direction === 'asc' ? ArrowUp : ArrowDown;
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      {direction && <Arrow className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
    </span>
  );
}
