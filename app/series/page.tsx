'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

interface Series {
  name: string;
  count: number;
}
interface Edit {
  remove: boolean;
  value: string;
}

const ROW_HEIGHT = 44;
const OVERSCAN = 6;

export default function SeriesAdminPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [filter, setFilter] = useState('');
  const [bulkTarget, setBulkTarget] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/series')
      .then((r) => r.json())
      .then((d: Series[]) => {
        setSeries(d);
        setLoading(false);
      });
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? series.filter((s) => s.name.toLowerCase().includes(q)) : series;
  }, [series, filter]);

  const getEdit = (name: string): Edit => edits[name] ?? { remove: false, value: name };
  const patchEdit = (name: string, patch: Partial<Edit>) =>
    setEdits((prev) => ({ ...prev, [name]: { ...(prev[name] ?? { remove: false, value: name }), ...patch } }));

  const { removeCount, renameCount } = useMemo(() => {
    let removeCount = 0;
    let renameCount = 0;
    for (const s of series) {
      const e = edits[s.name];
      if (!e) continue;
      if (e.remove) removeCount++;
      else if (e.value.trim() && e.value.trim() !== s.name) renameCount++;
    }
    return { removeCount, renameCount };
  }, [series, edits]);

  // Simple windowed rendering — there are thousands of series.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const viewportH = 600;
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visible = Math.ceil(viewportH / ROW_HEIGHT) + OVERSCAN * 2;
  const slice = filtered.slice(start, start + visible);

  function applyBulkRename() {
    const v = bulkTarget.trim();
    if (!v || !filter.trim()) return;
    setEdits((prev) => {
      const next = { ...prev };
      for (const s of filtered) next[s.name] = { remove: false, value: v };
      return next;
    });
  }

  async function apply() {
    const remove: string[] = [];
    const rename: Record<string, string> = {};
    for (const s of series) {
      const e = edits[s.name];
      if (!e) continue;
      if (e.remove) remove.push(s.name);
      else if (e.value.trim() && e.value.trim() !== s.name) rename[s.name] = e.value.trim();
    }
    if (remove.length === 0 && Object.keys(rename).length === 0) {
      setMessage('Nothing to apply.');
      return;
    }
    setApplying(true);
    setMessage(null);
    try {
      const res = await fetch('/api/series-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remove, rename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      setMessage(
        `Applied: ${data.removedSeries} series cleared (${data.removedVariants} variants), ${data.renamedSeries} renamed (${data.renamedVariants} variants). Backup in scripts/output/.`
      );
      setEdits({});
      load();
    } catch (e) {
      setMessage(`Error: ${e instanceof Error ? e.message : 'failed'}`);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold">Series cleanup</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Check the ones to remove (clears the series from those variants), or edit the text to rename/merge.
            {' '}
            {series.length} series.
          </p>
        </div>

        <div className="sticky top-0 bg-white dark:bg-gray-900 py-2 z-10 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 items-center border border-gray-300 dark:border-gray-600 rounded-md focus-within:ring-2 focus-within:ring-blue-500">
              <span className="pl-2 text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter series…"
                className="flex-1 h-9 px-2 bg-transparent focus:outline-none text-sm"
              />
              {filter && (
                <button onClick={() => setFilter('')} className="px-2 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={apply}
              disabled={applying || (removeCount === 0 && renameCount === 0)}
              className="px-4 h-9 rounded-md bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-40 disabled:cursor-default cursor-pointer whitespace-nowrap"
            >
              {applying ? 'Applying…' : `Apply (${removeCount}✕ ${renameCount}✎)`}
            </button>
          </div>

          {/* Bulk-rename every currently filtered series to one name. */}
          <div className="flex items-center gap-2">
            <input
              value={bulkTarget}
              onChange={(e) => setBulkTarget(e.target.value)}
              placeholder={filter ? `Rename all ${filtered.length} filtered to…` : 'Filter first, then bulk-rename…'}
              className="flex-1 h-9 px-3 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={applyBulkRename}
              disabled={!filter.trim() || !bulkTarget.trim() || filtered.length === 0}
              className="px-4 h-9 rounded-md border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-default cursor-pointer whitespace-nowrap"
            >
              Set {filter ? filtered.length : 0} →
            </button>
          </div>
        </div>

        {message && (
          <div className="text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
            {message}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <div
            ref={scrollRef}
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
            className="border border-gray-200 dark:border-gray-700 rounded-md overflow-auto"
            style={{ height: viewportH }}
          >
            <div style={{ height: filtered.length * ROW_HEIGHT, position: 'relative' }}>
              <div style={{ transform: `translateY(${start * ROW_HEIGHT}px)` }}>
                {slice.map((s) => {
                  const e = getEdit(s.name);
                  return (
                    <div
                      key={s.name}
                      className="flex items-center gap-3 px-3 border-b border-gray-100 dark:border-gray-800"
                      style={{ height: ROW_HEIGHT }}
                    >
                      <input
                        type="checkbox"
                        checked={e.remove}
                        onChange={(ev) => patchEdit(s.name, { remove: ev.target.checked })}
                        className="w-4 h-4 cursor-pointer shrink-0"
                        title="Remove this series"
                      />
                      <input
                        value={e.value}
                        disabled={e.remove}
                        onChange={(ev) => patchEdit(s.name, { value: ev.target.value })}
                        className={`flex-1 h-8 px-2 text-sm rounded border bg-white dark:bg-gray-800 ${
                          e.remove
                            ? 'line-through text-gray-400 border-transparent'
                            : e.value.trim() !== s.name
                              ? 'border-amber-400'
                              : 'border-gray-200 dark:border-gray-700'
                        }`}
                      />
                      <span className="text-xs text-gray-400 w-12 text-right shrink-0">{s.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
