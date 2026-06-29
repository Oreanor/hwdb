'use client';

import { memo, useMemo, useState } from 'react';
import { CarData, CarDataItem } from '../types';
import { YEARS } from '../consts';
import { formatCarName, getPreviewUrl, getImageUrl } from '../utils';
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

// Header pins below the filter bar (top: stickyTop) using the page scroll — no
// own scroll box, so the page has a single scrollbar. `top` is set inline.
const HEAD = 'sticky bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700';

const Row = memo(function Row({
  car,
  onModelClick,
  onHover,
}: {
  car: CarData;
  onModelClick: (car: CarData) => void;
  onHover: (h: HoverState | null) => void;
}) {
  const byYear = useMemo(() => {
    const m = new Map<string, CarDataItem[]>();
    for (const v of car.d) {
      if (!v.y) continue;
      const arr = m.get(v.y);
      if (arr) arr.push(v);
      else m.set(v.y, [v]);
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
      {YEAR_LIST.map((y) => {
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

  return (
    <div onMouseLeave={() => setHover(null)}>
      <table className="table-fixed border-collapse text-xs" style={{ width: NAME_COL_W + YEAR_LIST.length * YEAR_COL_W }}>
        <colgroup>
          <col style={{ width: NAME_COL_W }} />
          {YEAR_LIST.map((y) => (
            <col key={y} style={{ width: YEAR_COL_W }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th
              className={`${HEAD} left-0 z-30 px-2 py-1 text-left font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700`}
              style={{ top: stickyTop }}
            >
              {t('table.casting')}
            </th>
            {YEAR_LIST.map((y) => (
              <th
                key={y}
                className={`${HEAD} z-20 overflow-hidden px-0 align-bottom text-[10px] font-normal text-gray-500 dark:text-gray-400`}
                style={{ top: stickyTop }}
              >
                <span className="mx-auto block [writing-mode:vertical-rl] rotate-180 py-2 leading-none">{y}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cars.map((car, i) => (
            <Row key={`${car.lnk}-${i}`} car={car} onModelClick={onModelClick} onHover={setHover} />
          ))}
        </tbody>
      </table>

      {hover && <HoverPreview hover={hover} />}
    </div>
  );
}
