'use client';

import { useState, useMemo, memo, useCallback } from 'react';
import { CarData, CarDataItem, SortConfig } from '../types';
import { formatCarName, getVariantImages } from '../utils';
import { FIELD_ORDER, COLLAPSED_COLUMNS_KEY } from '../consts';
import { Plus, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { t } from '../i18n';
import { useImageCarousel, CarouselPhoto } from '../hooks/useImageCarousel';
import { byBrand, castingKey } from '../lib/brands';
import { matchesYear } from '../lib/years';
import { readStorageJson, writeStorage } from '../lib/storage';
import CarouselModal from './CarouselModal';
import Thumbnail from './Thumbnail';
import LinkButton from './LinkButton';
import ClampCell from './ClampCell';
import BrandBadge from './BrandBadge';

type FieldKey = (typeof FIELD_ORDER)[number]['key'];

interface ModelsTableProps {
  cars: CarData[];
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
  selectedYear?: string;
  onToggleCollection?: (id: string) => void;
  collection: ReadonlySet<string>;
  onSeriesClick?: (series: string) => void;
  onModelClick?: (car: CarData) => void;
  onYearClick?: (year: string) => void;
  showCastingName?: boolean;
  showBrand?: boolean; // brand column (only when the results span >1 brand)
  stickyTop?: number; // px offset so the header pins below the ResultsHeader bar
}

const thClass =
  'p-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 whitespace-nowrap bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600';

interface TableRowProps {
  car: CarData;
  item: CarDataItem;
  collapsedColumns: ReadonlySet<string>;
  onImageClick: (url: string) => void;
  // Shown only for a signed-in user (the column exists only then).
  canCollect: boolean;
  isCollected: boolean;
  onToggleCollection?: (id: string) => void;
  onSeriesClick?: (series: string) => void;
  onModelClick?: (car: CarData) => void;
  onYearClick?: (year: string) => void;
  showCastingName?: boolean;
  showBrand?: boolean;
}

// Every prop is a primitive or a stable reference, so a row re-renders only
// when its own data changes (year views can reach ~1750 rows).
const TableRow = memo(function TableRow({
  car,
  item,
  collapsedColumns,
  onImageClick,
  canCollect,
  isCollected,
  onToggleCollection,
  onSeriesClick,
  onModelClick,
  onYearClick,
  showCastingName,
  showBrand,
}: TableRowProps) {
  const { full, preview } = getVariantImages(item);
  const name = formatCarName(car.lnk);

  const cellContent = (key: FieldKey) => {
    const value = item[key] || '-';
    if (key === 'Sr' && onSeriesClick && item.Sr) {
      return <LinkButton onClick={() => onSeriesClick(item.Sr!)}>{value}</LinkButton>;
    }
    if (key === 'y' && onYearClick && item.y) {
      return <LinkButton onClick={() => onYearClick(item.y)}>{value}</LinkButton>;
    }
    return <ClampCell text={String(value)} />;
  };

  return (
    <tr
      // content-visibility skips layout/paint for off-screen rows;
      // contain-intrinsic-size reserves an estimated height.
      className={`hover:bg-gray-50 dark:hover:bg-gray-700 [content-visibility:auto] [contain-intrinsic-size:auto_84px] ${
        isCollected ? 'bg-gray-100 dark:bg-gray-700' : ''
      }`}
    >
      {canCollect && (
        <td className="p-2 whitespace-nowrap">
          <button
            className={`w-6 h-6 transition-colors cursor-pointer ${
              isCollected
                ? 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
            title={isCollected ? t('collection.remove') : t('collection.add')}
            onClick={() => item.id && onToggleCollection?.(item.id)}
          >
            {isCollected ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        </td>
      )}
      <td className="p-2 whitespace-nowrap">
        <Thumbnail
          url={preview}
          fallbackUrl={full}
          alt={name}
          onClick={full ? () => onImageClick(full) : undefined}
          className="w-16 h-16"
        />
      </td>
      {showBrand && (
        <td className="p-2 whitespace-nowrap">
          <BrandBadge brand={car.brand} />
        </td>
      )}
      {showCastingName && (
        <td className="p-2 text-sm font-medium break-words min-w-[120px]">
          {onModelClick ? (
            <LinkButton onClick={() => onModelClick(car)}>{name}</LinkButton>
          ) : (
            <span className="text-gray-900 dark:text-gray-200">{name}</span>
          )}
        </td>
      )}
      {FIELD_ORDER.map(({ key }) => {
        const collapsed = collapsedColumns.has(key);
        return (
          <td
            key={key}
            className={`p-2 text-sm text-gray-900 dark:text-gray-200 ${
              collapsed ? 'w-[40px] min-w-[40px] max-w-[40px] p-0 bg-gray-50 dark:bg-gray-700 overflow-hidden' : 'break-words'
            }`}
          >
            <div className={collapsed ? 'h-0 overflow-hidden' : ''}>{cellContent(key)}</div>
          </td>
        );
      })}
    </tr>
  );
});

function TableHeader({
  fieldKey,
  sortConfig,
  collapsed,
  onSort,
  onToggleCollapse,
}: {
  fieldKey: FieldKey;
  sortConfig: SortConfig;
  collapsed: boolean;
  onSort: (field: string) => void;
  onToggleCollapse: (field: string) => void;
}) {
  const label = t(`table.col.${fieldKey}`);
  return (
    <th className={`${thClass} ${collapsed ? 'w-[30px] min-w-[30px] max-w-[30px] p-0 overflow-hidden' : ''}`}>
      <div className="flex items-center justify-between">
        {collapsed ? (
          <span className="text-gray-600 dark:text-gray-400">{label.charAt(0)}</span>
        ) : (
          <span className="cursor-pointer hover:text-gray-600 dark:hover:text-gray-400" onClick={() => onSort(fieldKey)}>
            {label}
            {sortConfig?.field === fieldKey && (
              <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
            )}
          </span>
        )}
        <button
          onClick={() => onToggleCollapse(fieldKey)}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-pointer font-bold"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>
    </th>
  );
}

// Sort value of a row for a column ('model' = the casting slug).
const sortValue = (car: CarData, item: CarDataItem, field: string): string =>
  field === 'model' ? car.lnk : String(item[field as keyof CarDataItem] ?? '');

// Table of variants (one row each), with sortable, collapsible columns and a
// full-screen image carousel.
function ModelsTable({
  cars,
  sortConfig,
  onSortChange,
  selectedYear,
  onToggleCollection,
  collection,
  onSeriesClick,
  onModelClick,
  onYearClick,
  showCastingName,
  showBrand,
  stickyTop = 0,
}: ModelsTableProps) {
  const { data: session } = useSession();
  const canCollect = !!session?.user;
  // Column layout is remembered across visits.
  const [collapsedColumns, setCollapsedColumns] = useState<ReadonlySet<string>>(
    () => new Set(readStorageJson<string[]>(COLLAPSED_COLUMNS_KEY, []))
  );

  const rows = useMemo(() => {
    const list = [...cars]
      .sort(byBrand)
      .flatMap((car) => car.d.filter((item) => matchesYear(item, selectedYear)).map((item, index) => ({ car, item, index })));

    if (sortConfig) {
      const { field, direction } = sortConfig;
      const sign = direction === 'asc' ? 1 : -1;
      list.sort(
        (a, b) =>
          // Brand groups first; the column sort only orders rows within a brand.
          byBrand(a.car, b.car) ||
          sortValue(a.car, a.item, field).localeCompare(sortValue(b.car, b.item, field)) * sign
      );
    }
    return list;
  }, [cars, sortConfig, selectedYear]);

  // Every image shown in the table, in row order, for the modal's prev/next.
  const photos = useMemo(() => {
    const result: CarouselPhoto[] = [];
    for (const { car, item } of rows) {
      const { full } = getVariantImages(item);
      if (full) result.push({ url: full, year: item.y, series: item.Sr, name: formatCarName(car.lnk) });
    }
    return result;
  }, [rows]);
  const carousel = useImageCarousel(photos);

  // asc -> desc -> unsorted. A collapsed column can't be sorted.
  const handleSort = useCallback(
    (field: string) => {
      if (collapsedColumns.has(field)) onSortChange(null);
      else if (sortConfig?.field !== field) onSortChange({ field, direction: 'asc' });
      else onSortChange(sortConfig.direction === 'asc' ? { field, direction: 'desc' } : null);
    },
    [collapsedColumns, sortConfig, onSortChange]
  );

  const handleToggleCollapse = useCallback(
    (field: string) => {
      const next = new Set(collapsedColumns);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
        // Collapsing the sorted column clears the sort.
        if (sortConfig?.field === field) onSortChange(null);
      }
      setCollapsedColumns(next);
      writeStorage(COLLAPSED_COLUMNS_KEY, JSON.stringify([...next]));
    },
    [collapsedColumns, sortConfig, onSortChange]
  );

  return (
    // No overflow wrapper here: a scroll container would re-anchor the sticky
    // header to itself. The page's content area (flex-1) scrolls both axes, so
    // the sticky thead pins just below the (also sticky) ResultsHeader bar.
    <div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="sticky z-20 bg-gray-50 dark:bg-gray-700" style={{ top: stickyTop }}>
          <tr>
            {canCollect && <th className={`${thClass} w-[40px]`}>{t('table.add')}</th>}
            <th className={`${thClass} w-[100px]`}>{t('table.image')}</th>
            {showBrand && <th className={`${thClass} w-[60px]`}>{t('table.brand')}</th>}
            {showCastingName && <th className={thClass}>{t('table.casting')}</th>}
            {FIELD_ORDER.map(({ key }) => (
              <TableHeader
                key={key}
                fieldKey={key}
                sortConfig={sortConfig}
                collapsed={collapsedColumns.has(key)}
                onSort={handleSort}
                onToggleCollapse={handleToggleCollapse}
              />
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {rows.map(({ car, item, index }) => (
            <TableRow
              key={`${castingKey(car)}-${index}`}
              car={car}
              item={item}
              collapsedColumns={collapsedColumns}
              onImageClick={carousel.open}
              canCollect={canCollect}
              isCollected={!!item.id && collection.has(item.id)}
              onToggleCollection={onToggleCollection}
              onSeriesClick={onSeriesClick}
              onModelClick={onModelClick}
              onYearClick={onYearClick}
              showCastingName={showCastingName}
              showBrand={showBrand}
            />
          ))}
        </tbody>
      </table>
      <CarouselModal carousel={carousel} />
    </div>
  );
}

export default memo(ModelsTable);
