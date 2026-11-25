'use client';

import { useState, useMemo, memo } from 'react';
import { Plus, X, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { CarData, CarDataItem, SortConfig } from '../types';
import { formatCarName, getImageUrl, getPreviewUrl } from '../utils';
import { variantsInYear } from '../lib/years';
import { VARIANT_COLUMNS, VariantColumn, COLLAPSED_COLUMNS_KEY } from '../consts';
import { t } from '../i18n';
import { carouselPhotos, useImageCarousel } from '../hooks/useImageCarousel';
import ImageModal from './ImageModal';
import Thumbnail from './Thumbnail';
import LinkButton from './LinkButton';
import ClampCell from './ClampCell';
import { SortLabel, nextSort } from './SortLabel';
import * as s from './ui/styles';

// Sort key for the casting-name column (the rest sort by their VariantColumn).
const CASTING_SORT = 'casting';

// Free-text columns that get a minimum width so long values don't make rows very tall.
const WIDE_COLUMNS = new Set<string>(['Sr', 'c', 'Tm', 'Wh', 'Nt']);

interface ModelsTableProps {
  cars: CarData[];
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
  selectedYear?: string;
  // Present only for a signed-in user: adds the add/remove column.
  onAddToCollection?: (id: string) => void;
  collection: string[];
  onSeriesClick?: (series: string) => void;
  onModelClick?: (car: CarData) => void;
  onYearClick?: (year: string) => void;
  showCastingName?: boolean;
  stickyTop?: number; // px offset so the header pins below the ResultsHeader bar
}

interface TableRowProps {
  car: CarData;
  item: CarDataItem;
  collapsed: Set<string>;
  onImageClick: (url: string) => void;
  isCollected: boolean;
  onAddToCollection?: (id: string) => void;
  onSeriesClick?: (series: string) => void;
  onModelClick?: (car: CarData) => void;
  onYearClick?: (year: string) => void;
  showCastingName?: boolean;
}

const TableRow = memo(function TableRow({
  car,
  item,
  collapsed,
  onImageClick,
  isCollected,
  onAddToCollection,
  onSeriesClick,
  onModelClick,
  onYearClick,
  showCastingName,
}: TableRowProps) {
  const imageUrl = getImageUrl(item);
  const name = formatCarName(car.lnk);

  const cell = (key: VariantColumn) => {
    const value = item[key];
    if (!value) return '—';
    if (key === 'Sr' && onSeriesClick) return <LinkButton onClick={() => onSeriesClick(value)}>{value}</LinkButton>;
    if (key === 'y' && onYearClick) return <LinkButton onClick={() => onYearClick(value)}>{value}</LinkButton>;
    return <ClampCell text={value} />;
  };

  return (
    <tr className={`${s.tr} ${isCollected ? 'bg-blue-50/70 dark:bg-blue-950/30' : ''}`}>
      {onAddToCollection && (
        <td className="p-2">
          <button
            type="button"
            onClick={() => item.id && onAddToCollection(item.id)}
            title={isCollected ? t('collection.remove') : t('collection.add')}
            aria-label={isCollected ? t('collection.remove') : t('collection.add')}
            className={`flex size-7 items-center justify-center rounded-md transition-colors cursor-pointer ${
              isCollected
                ? 'text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {isCollected ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </td>
      )}
      <td className="p-2">
        <Thumbnail
          url={getPreviewUrl(item)}
          fallbackUrl={imageUrl}
          alt={name}
          onClick={imageUrl ? () => onImageClick(imageUrl) : undefined}
          className="size-16"
        />
      </td>
      {showCastingName && (
        <td className={`${s.td} font-medium break-words min-w-[120px]`}>
          {onModelClick ? <LinkButton onClick={() => onModelClick(car)}>{name}</LinkButton> : name}
        </td>
      )}
      {VARIANT_COLUMNS.map((key) =>
        collapsed.has(key) ? (
          <td key={key} className="w-10 bg-gray-50 dark:bg-gray-800" />
        ) : (
          <td key={key} className={`${s.td} break-words ${WIDE_COLUMNS.has(key) ? 'min-w-40' : ''}`}>
            {cell(key)}
          </td>
        )
      )}
    </tr>
  );
});

const loadCollapsed = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(COLLAPSED_COLUMNS_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

// Variants as a table: one row per variant, sortable and collapsible columns,
// photos open the viewer.
const ModelsTable = memo(function ModelsTable({
  cars,
  sortConfig,
  onSortChange,
  selectedYear,
  onAddToCollection,
  collection,
  onSeriesClick,
  onModelClick,
  onYearClick,
  showCastingName,
  stickyTop = 0,
}: ModelsTableProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() =>
    typeof window === 'undefined' ? new Set() : loadCollapsed()
  );
  const collected = useMemo(() => new Set(collection), [collection]);

  const photos = useMemo(() => carouselPhotos(cars, selectedYear), [cars, selectedYear]);
  const carousel = useImageCarousel(photos);

  const toggleCollapse = (key: string) => {
    const next = new Set(collapsed);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
      if (sortConfig?.field === key) onSortChange(null); // a hidden column can't stay sorted
    }
    setCollapsed(next);
    localStorage.setItem(COLLAPSED_COLUMNS_KEY, JSON.stringify([...next]));
  };

  const rows = useMemo(() => {
    const all = cars.flatMap((car) => variantsInYear(car.d, selectedYear).map((item) => ({ car, item })));
    if (!sortConfig) return all;
    const { field, direction } = sortConfig;
    const value = (r: (typeof all)[number]) =>
      field === CASTING_SORT ? formatCarName(r.car.lnk) : String(r.item[field as keyof CarDataItem] ?? '');
    const dir = direction === 'asc' ? 1 : -1;
    return [...all].sort((a, b) => value(a).localeCompare(value(b)) * dir);
  }, [cars, sortConfig, selectedYear]);

  const sortArrow = (field: string) => (sortConfig?.field === field ? sortConfig.direction : undefined);

  return (
    // No overflow wrapper: a scroll container would re-anchor the sticky header.
    // <main> scrolls both axes, so the thead pins just below the ResultsHeader.
    <>
      <table className={s.table}>
        <thead className={s.thead} style={{ top: stickyTop }}>
          <tr>
            {onAddToCollection && <th className={`${s.th} w-10`}>{t('table.add')}</th>}
            <th className={`${s.th} w-[100px]`}>{t('table.image')}</th>
            {showCastingName && (
              <th className={s.thSortable} onClick={() => onSortChange(nextSort(sortConfig, CASTING_SORT))}>
                <SortLabel label={t('table.casting')} direction={sortArrow(CASTING_SORT)} />
              </th>
            )}
            {VARIANT_COLUMNS.map((key) => {
              const label = t(`table.col.${key}`);
              const isCollapsed = collapsed.has(key);
              return (
                <th key={key} className={`${s.th} ${isCollapsed ? 'w-10 px-0' : ''}`}>
                  <div className="flex items-center justify-between gap-1">
                    {!isCollapsed && (
                      <button
                        type="button"
                        onClick={() => onSortChange(nextSort(sortConfig, key))}
                        className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <SortLabel label={label} direction={sortArrow(key)} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleCollapse(key)}
                      title={label}
                      aria-label={label}
                      className="mx-auto flex items-center text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 cursor-pointer"
                    >
                      {isCollapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
                    </button>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className={s.tbody}>
          {rows.map(({ car, item }, i) => (
            <TableRow
              key={item.id ?? `${car.lnk}-${i}`}
              car={car}
              item={item}
              collapsed={collapsed}
              onImageClick={carousel.open}
              isCollected={!!item.id && collected.has(item.id)}
              onAddToCollection={onAddToCollection}
              onSeriesClick={onSeriesClick}
              onModelClick={onModelClick}
              onYearClick={onYearClick}
              showCastingName={showCastingName}
            />
          ))}
        </tbody>
      </table>
      <ImageModal carousel={carousel} />
    </>
  );
});

export default ModelsTable;
