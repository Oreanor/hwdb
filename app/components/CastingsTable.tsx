'use client';

import { memo, useMemo, useState } from 'react';
import { CarData } from '../types';
import { formatCarName, getImageUrl, getPreviewUrl, hasImage } from '../utils';
import { variantsInYear, yearRange } from '../lib/years';
import { brandOf } from '../lib/brands';
import { t } from '../i18n';
import Thumbnail from './Thumbnail';
import LinkButton from './LinkButton';
import { SortLabel, SortDirection, nextSort } from './SortLabel';
import * as s from './ui/styles';

interface CastingsTableProps {
  cars: CarData[];
  onModelClick: (car: CarData) => void;
  selectedYear?: string;
  stickyTop?: number; // px offset so the header pins below the ResultsHeader bar
}

type SortField = 'name' | 'designer' | 'years' | 'count';

// One row summarising a whole casting (name, designer, year range, variant count).
interface Row {
  car: CarData;
  name: string;
  designer: string;
  photo?: CarData['d'][number];
  years: string;
  count: number;
}

const buildRow = (car: CarData, selectedYear?: string): Row => {
  const variants = variantsInYear(car.d, selectedYear);
  return {
    car,
    name: formatCarName(car.lnk),
    designer: car.ds ?? '',
    photo: variants.find(hasImage) ?? car.d.find(hasImage),
    years: yearRange(variants),
    count: variants.length,
  };
};

const compare = (a: Row, b: Row, field: SortField): number =>
  field === 'count' ? a.count - b.count : a[field].localeCompare(b[field]);

// Castings as a compact table.
const CastingsTable = memo(function CastingsTable({ cars, onModelClick, selectedYear, stickyTop = 0 }: CastingsTableProps) {
  const [sort, setSort] = useState<{ field: SortField; direction: SortDirection } | null>(null);

  const rows = useMemo(() => {
    const built = cars.map((car) => buildRow(car, selectedYear));
    if (sort) {
      const dir = sort.direction === 'asc' ? 1 : -1;
      built.sort((a, b) => compare(a, b, sort.field) * dir);
    }
    return built;
  }, [cars, selectedYear, sort]);

  // Hide the Designer column when every row has the same designer (e.g. a
  // designer search) — the header already says it.
  const showDesigner = rows.some((r) => r.designer !== rows[0].designer);

  const header = (field: SortField, label: string) => (
    <th className={s.thSortable} onClick={() => setSort((prev) => nextSort(prev, field))}>
      <SortLabel label={label} direction={sort?.field === field ? sort.direction : undefined} />
    </th>
  );

  return (
    // No overflow wrapper: it would re-anchor the sticky header. <main> scrolls,
    // so the sticky thead pins just below the (also sticky) ResultsHeader.
    <table className={s.table}>
      <thead className={s.thead} style={{ top: stickyTop }}>
        <tr>
          <th className={`${s.th} w-[100px]`}>{t('table.image')}</th>
          {header('name', t('search.fields.name'))}
          {showDesigner && header('designer', t('search.fields.designer'))}
          {header('years', t('model.years'))}
          {header('count', t('table.variants'))}
        </tr>
      </thead>
      <tbody className={s.tbody}>
        {rows.map(({ car, name, designer, photo, years, count }) => (
          <tr key={`${brandOf(car)}:${car.lnk}`} className={s.tr}>
            <td className="p-2">
              <Thumbnail
                url={photo && getPreviewUrl(photo)}
                fallbackUrl={photo && getImageUrl(photo)}
                alt={name}
                onClick={() => onModelClick(car)}
                className="size-16"
              />
            </td>
            <td className={`${s.td} font-medium break-words min-w-[120px]`}>
              <LinkButton onClick={() => onModelClick(car)}>{name}</LinkButton>
            </td>
            {showDesigner && <td className={`${s.td} break-words`}>{designer || '—'}</td>}
            <td className={`${s.td} whitespace-nowrap`}>{years || '—'}</td>
            <td className={s.tdMuted}>{count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
});

export default CastingsTable;
