'use client';

import { memo, useMemo, useState } from 'react';
import { CarData } from '../types';
import { formatCarName, getImageUrl, getPreviewUrl } from '../utils';
import { t } from '../i18n';
import Thumbnail from './Thumbnail';
import LinkButton from './LinkButton';

interface CastingsTableProps {
  cars: CarData[];
  onModelClick: (car: CarData) => void;
  selectedYear?: string;
  stickyTop?: number; // px offset so the header pins below the ResultsHeader bar
}

type SortField = 'name' | 'designer' | 'years' | 'count';
type SortState = { field: SortField; direction: 'asc' | 'desc' } | null;

// One row summarising a whole casting (name, designer, year range, variant count).
interface Row {
  car: CarData;
  name: string;
  designer: string;
  imageUrl?: string;
  previewUrl?: string;
  firstYear: string;
  lastYear: string;
  count: number;
}

const buildRow = (car: CarData, selectedYear?: string): Row => {
  const variants = selectedYear ? car.d.filter((v) => v.y === selectedYear) : car.d;
  const withImage = variants.find((v) => v.p === 't') ?? car.d.find((v) => v.p === 't');
  const years = variants.map((v) => v.y).filter(Boolean).sort();
  return {
    car,
    name: formatCarName(car.lnk),
    designer: car.ds ?? '',
    imageUrl: withImage ? getImageUrl(withImage) : undefined,
    previewUrl: withImage ? getPreviewUrl(withImage) : undefined,
    firstYear: years[0] ?? '',
    lastYear: years[years.length - 1] ?? '',
    count: variants.length,
  };
};

const CastingsTable = memo(function CastingsTable({ cars, onModelClick, selectedYear, stickyTop = 0 }: CastingsTableProps) {
  const [sort, setSort] = useState<SortState>(null);

  const rows = useMemo(() => {
    const built = cars.map((car) => buildRow(car, selectedYear));
    if (sort) {
      const dir = sort.direction === 'asc' ? 1 : -1;
      built.sort((a, b) => {
        let cmp: number;
        if (sort.field === 'count') cmp = a.count - b.count;
        else if (sort.field === 'years') cmp = a.firstYear.localeCompare(b.firstYear);
        else cmp = a[sort.field].localeCompare(b[sort.field]);
        return cmp * dir;
      });
    }
    return built;
  }, [cars, selectedYear, sort]);

  // Hide the Designer column when every row has the same designer (e.g. a
  // designer search) — repeating it on each row is noise; the header says it.
  const showDesigner = rows.length > 0 && !rows.every((r) => r.designer === rows[0].designer);

  const toggleSort = (field: SortField) =>
    setSort((prev) =>
      prev?.field === field
        ? prev.direction === 'asc'
          ? { field, direction: 'desc' }
          : null
        : { field, direction: 'asc' }
    );

  const header = (field: SortField, label: string) => (
    <th
      onClick={() => toggleSort(field)}
      className="p-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 whitespace-nowrap bg-gray-50 dark:bg-gray-700 cursor-pointer hover:text-gray-600 dark:hover:text-gray-400 border-r border-gray-200 dark:border-gray-600"
    >
      {label}
      {sort?.field === field && <span className="ml-1">{sort.direction === 'asc' ? '↑' : '↓'}</span>}
    </th>
  );

  return (
    // No overflow wrapper: it would re-anchor the sticky header. The page content
    // area (flex-1) scrolls, so the sticky thead pins to the viewport top.
    <div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="sticky z-20 bg-gray-50 dark:bg-gray-700" style={{ top: stickyTop }}>
          <tr>
            <th className="p-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 whitespace-nowrap bg-gray-50 dark:bg-gray-700 w-[100px] border-r border-gray-200 dark:border-gray-600">
              {t('table.image')}
            </th>
            {header('name', t('search.fields.name'))}
            {showDesigner && header('designer', t('search.fields.designer'))}
            {header('years', t('model.years'))}
            {header('count', t('table.variants'))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {rows.map((row) => (
            <tr
              key={row.car.lnk}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 [content-visibility:auto] [contain-intrinsic-size:auto_84px]"
            >
              <td className="p-2 whitespace-nowrap">
                <Thumbnail
                  url={row.imageUrl}
                  alt={row.name}
                  onClick={() => onModelClick(row.car)}
                  className="w-16 h-16"
                />
              </td>
              <td className="p-2 text-sm font-medium break-words min-w-[120px]">
                <LinkButton onClick={() => onModelClick(row.car)}>{row.name}</LinkButton>
              </td>
              {showDesigner && (
                <td className="p-2 text-sm text-gray-900 dark:text-gray-200 break-words">{row.designer || '-'}</td>
              )}
              <td className="p-2 text-sm text-gray-900 dark:text-gray-200 whitespace-nowrap">
                {row.firstYear ? (row.firstYear === row.lastYear ? row.firstYear : `${row.firstYear}–${row.lastYear}`) : '-'}
              </td>
              <td className="p-2 text-sm text-gray-500 dark:text-gray-400">{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default CastingsTable;
