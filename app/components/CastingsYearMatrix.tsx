'use client';

import { memo, useMemo, useState } from 'react';
import { CarData, CarDataItem } from '../types';
import { YEARS } from '../consts';
import { formatCarName, getPreviewUrl, getImageUrl } from '../utils';
import { variantYears } from '../lib/years';
import Thumbnail from './Thumbnail';
import { t } from '../i18n';

// All real years (drop the leading "All Years" sentinel), 1968 -> current.
const YEAR_LIST = YEARS.filter((y) => y.value).map((y) => y.value);

// Fixed width (px) of each year column.
const YEAR_COL_W = 20;
const NAME_COL_W = 200;

// Heatmap: more releases that year -> darker cell. Buckets are fixed (not
// per-row) so the shade reads the same across the whole grid.
function cellClass(count: number): string {
  if (count <= 0) return '';
  if (count === 1) return 'bg-blue-200 dark:bg-blue-900/60';
  if (count <= 3) return 'bg-blue-400 dark:bg-blue-700';
  if (count <= 6) return 'bg-blue-500 dark:bg-blue-600';
  return 'bg-blue-700 dark:bg-blue-400';
}

interface HoverState {
  name: string;
  year: string;
  items: CarDataItem[];
  left: number;
  top: number;
}

interface Props {
  cars: CarData[];
  onModelClick: (car: CarData) => void;
  stickyTop?: number;
}

const Row = memo(function Row({
  car,
  years,
  onModelClick,
  onHover,
}: {
  car: CarData;
  years: string[];
  onModelClick: (car: CarData) => void;
  onHover: (h: HoverState | null) => void;
}) {
  const byYear = useMemo(() => {
    const m = new Map<string, CarDataItem[]>();
    for (const v of car.d) {
      // A multi-year period ("1978 / 1979 / 1980") fills every year it covers.
      for (const y of new Set(variantYears(v.y))) {
        const arr = m.get(y);
        if (arr) arr.push(v);
        else m.set(y, [v]);
      }
    }
    return m;
  }, [car.d]);
  const name = formatCarName(car.lnk);

  return (
    <tr className="group">
      <th
        scope="row"
        onClick={() => onModelClick(car)}
        title={name}
        className="sticky left-0 z-10 bg-white dark:bg-gray-900 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 px-2 py-1 text-left text-xs font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 border-r border-gray-200 dark:border-gray-700 max-w-[220px] truncate"
      >
        {name}
      </th>
      {years.map((y) => {
        const items = byYear.get(y);
        const count = items?.length ?? 0;
        return (
          <td
            key={y}
            onClick={() => count && onModelClick(car)}
            onMouseEnter={(e) => {
              if (!count) return;
              const r = e.currentTarget.getBoundingClientRect();
              onHover({ name, year: y, items: items!, left: r.left, top: r.bottom });
            }}
            onMouseLeave={() => count && onHover(null)}
            className={`h-6 border-r border-gray-100 dark:border-gray-800 ${cellClass(count)} ${
              count
                ? 'cursor-pointer hover:outline hover:outline-1 hover:outline-blue-600'
                : 'group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20'
            }`}
          />
        );
      })}
    </tr>
  );
});

function HoverPreview({ hover }: { hover: HoverState }) {
  const withImg = hover.items.filter((it) => it.p === 't');
  // Keep the popover on-screen near the cell.
  const left = Math.min(hover.left, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 290);
  return (
    <div
      className="fixed z-50 pointer-events-none rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 shadow-xl"
      style={{ left: Math.max(8, left), top: hover.top + 4 }}
    >
      <div className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-200">
        {hover.name} · {hover.year} ({hover.items.length})
      </div>
      {withImg.length ? (
        <div className="flex max-w-[270px] flex-wrap gap-1">
          {withImg.slice(0, 8).map((it) => (
            <Thumbnail
              key={it.id}
              url={getPreviewUrl(it)}
              fallbackUrl={getImageUrl(it)}
              alt={`${hover.name} ${hover.year}`}
              className="h-16 w-20"
            />
          ))}
        </div>
      ) : (
        <span className="text-xs text-gray-400 dark:text-gray-500">{t('table.noImage')}</span>
      )}
    </div>
  );
}

// "Stats" view of casting results: one row per casting, one column per year
// (1968 -> now); a cell is shaded when the casting was released that year, and
// hovering a shaded cell previews that year's variants.
export default function CastingsYearMatrix({ cars, onModelClick, stickyTop = 0 }: Props) {
  const [hover, setHover] = useState<HoverState | null>(null);

  // Columns span the actual years present in the shown castings (already scoped
  // by brand/scale), min..max contiguous — so each base gets its own range
  // instead of Hot Wheels' fixed 1968–now.
  const years = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (const car of cars) {
      for (const v of car.d) {
        for (const y of variantYears(v.y)) {
          const n = +y;
          if (n < min) min = n;
          if (n > max) max = n;
        }
      }
    }
    if (!isFinite(min)) return YEAR_LIST;
    return Array.from({ length: max - min + 1 }, (_, i) => String(min + i));
  }, [cars]);

  return (
    <div className="-mt-4" onMouseLeave={() => setHover(null)}>
      <table className="table-fixed border-separate border-spacing-0 text-xs" style={{ width: NAME_COL_W + years.length * YEAR_COL_W }}>
        <colgroup>
          <col style={{ width: NAME_COL_W }} />
          {years.map((y) => (
            <col key={y} style={{ width: YEAR_COL_W }} />
          ))}
        </colgroup>
        <thead className="sticky z-20" style={{ top: stickyTop }}>
          <tr>
            <th className="sticky left-0 z-30 bg-white dark:bg-gray-900 px-2 py-1 text-left font-medium text-gray-500 dark:text-gray-400 border-b border-r border-gray-200 dark:border-gray-700">
              {t('table.casting')}
            </th>
            {years.map((y) => (
              <th
                key={y}
                className="bg-white dark:bg-gray-900 overflow-hidden px-0 pt-1 pb-2 align-top text-[10px] font-normal text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
              >
                <span className="mx-auto block [writing-mode:vertical-rl] rotate-180 leading-none">{y}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cars.map((car, i) => (
            <Row key={`${car.lnk}-${i}`} car={car} years={years} onModelClick={onModelClick} onHover={setHover} />
          ))}
        </tbody>
      </table>

      {hover && <HoverPreview hover={hover} />}
    </div>
  );
}
