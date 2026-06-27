import { useState, useMemo, memo } from 'react';
import { CarData, CarDataItem, SortConfig } from '../types';
import { formatCarName, getImageUrl, getPreviewUrl } from '../utils';
import { FIELD_ORDER, COLLAPSED_COLUMNS_COOKIE } from '../consts';
import { Plus, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { t } from '../i18n';
import { useImageCarousel } from '../hooks/useImageCarousel';
import CarouselModal from './CarouselModal';
import Thumbnail from './Thumbnail';
import LinkButton from './LinkButton';
import ClampCell from './ClampCell';


interface ModelsTableProps {
  cars: CarData[];
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig | ((prev: SortConfig) => SortConfig)) => void;
  selectedYear?: string;
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
  collapsedColumns: Set<string>;
  onImageClick: (url: string) => void;
  isCollected: boolean;
  onAddToCollection?: (id: string) => void;
  onSeriesClick?: (series: string) => void;
  onModelClick?: (car: CarData) => void;
  onYearClick?: (year: string) => void;
  showCastingName?: boolean;
}

const TableRow = memo(({ car, item, collapsedColumns, onImageClick, isCollected, onAddToCollection, onSeriesClick, onModelClick, onYearClick, showCastingName }: TableRowProps) => {
  const { data: session } = useSession();
  const imageUrl = item.p === 't' ? getImageUrl(item) : undefined;
  const previewUrl = item.p === 't' ? getPreviewUrl(item) : undefined;

  return (
    <tr
      key={`${item.id}`}
      // content-visibility skips layout/paint for off-screen rows (year views
      // can reach ~1750 rows); contain-intrinsic-size reserves an estimated height.
      className={`hover:bg-gray-50 dark:hover:bg-gray-700 [content-visibility:auto] [contain-intrinsic-size:auto_84px] ${
        isCollected ? 'bg-gray-100 dark:bg-gray-700' : ''
      }`}
    >
      {session?.user && (
        <td className="p-2 whitespace-nowrap">
          <button
            className={`w-6 h-6 transition-colors cursor-pointer ${
              isCollected
                ? 'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
            title={isCollected ? t('collection.remove') : t('collection.add')}
            onClick={() => onAddToCollection && item.id && onAddToCollection(item.id)}
          >
            {isCollected ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        </td>
      )}
      <td className="p-2 whitespace-nowrap">
        <Thumbnail
          url={previewUrl}
          fallbackUrl={imageUrl}
          alt={formatCarName(car.lnk)}
          onClick={imageUrl ? () => onImageClick(imageUrl) : undefined}
          className="w-16 h-16"
        />
      </td>
      {showCastingName && (
        <td className="p-2 text-sm font-medium break-words min-w-[120px]">
          {onModelClick ? (
            <LinkButton onClick={() => onModelClick(car)}>{formatCarName(car.lnk)}</LinkButton>
          ) : (
            <span className="text-gray-900 dark:text-gray-200">{formatCarName(car.lnk)}</span>
          )}
        </td>
      )}
      {FIELD_ORDER.map(field => {
        const value = item[field.key] || '-';
        const clickableSeries = field.key === 'Sr' && onSeriesClick && item.Sr;
        const clickableYear = field.key === 'y' && onYearClick && item.y;
        return (
          <td
            key={field.key}
            className={`p-2 text-sm text-gray-900 dark:text-gray-200 ${
              collapsedColumns.has(field.key) ? 'w-[40px] min-w-[40px] max-w-[40px] p-0 bg-gray-50 dark:bg-gray-700 overflow-hidden' : 'break-words'
            }`}
          >
            <div className={collapsedColumns.has(field.key) ? 'h-0 overflow-hidden' : ''}>
              {clickableSeries ? (
                <LinkButton onClick={() => onSeriesClick(item.Sr as string)}>{value}</LinkButton>
              ) : clickableYear ? (
                <LinkButton onClick={() => onYearClick(item.y)}>{value}</LinkButton>
              ) : (
                <ClampCell text={String(value)} />
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
});

TableRow.displayName = 'TableRow';

const TableHeader = memo(({
  field,
  sortConfig,
  onSort,
  collapsedColumns,
  onToggleCollapse
}: {
  field: (typeof FIELD_ORDER)[number];
  sortConfig: SortConfig | null;
  onSort: (field: string) => void;
  collapsedColumns: Set<string>;
  onToggleCollapse: (field: string) => void;
}) => {
  const isSorted = sortConfig?.field === field.key;
  const isCollapsed = collapsedColumns.has(field.key);

  return (
    <th
      className={`p-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 whitespace-nowrap bg-gray-50 dark:bg-gray-700 ${
        isCollapsed ? 'w-[30px] min-w-[30px] max-w-[30px] p-0 overflow-hidden' : ''
      } border-r border-gray-200 dark:border-gray-600`}
    >
      <div className="flex items-center justify-between">
        {isCollapsed ? (
          <span className="text-gray-600 dark:text-gray-400">{t(`table.col.${field.key}`).charAt(0)}</span>
        ) : (
          <span
            className="cursor-pointer hover:text-gray-600 dark:hover:text-gray-400"
            onClick={() => onSort(field.key)}
          >
            {t(`table.col.${field.key}`)}
            {isSorted && (
              <span className="ml-1">
                {sortConfig?.direction === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </span>
        )}
        <button
          onClick={() => onToggleCollapse(field.key)}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-pointer font-bold"
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>
    </th>
  );
});

TableHeader.displayName = 'TableHeader';

const ModelsTable: React.FC<ModelsTableProps> = ({
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
  stickyTop = 0
}) => {
  const { data: session } = useSession();
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    const saved = localStorage.getItem(COLLAPSED_COLUMNS_COOKIE);
    return new Set(saved ? JSON.parse(saved) : []);
  });

  // Every image shown in the table, in order, for the modal's prev/next carousel.
  const photos = useMemo(() => {
    const result: { url: string; year: string; series?: string; name: string }[] = [];
    cars.forEach(car => {
      const name = formatCarName(car.lnk);
      car.d
        .filter(item => !selectedYear || item.y === selectedYear)
        .filter(item => item.p === 't')
        .forEach(item => {
          const url = getImageUrl(item);
          if (url) result.push({ url, year: item.y, series: item.Sr, name });
        });
    });
    return result;
  }, [cars, selectedYear]);
  const carousel = useImageCarousel(photos);

  const handleSort = (field: string) => {
    if (collapsedColumns.has(field)) {
      onSortChange(null);
      return;
    }

    if (sortConfig?.field === field) {
      if (sortConfig.direction === 'asc') {
        onSortChange({ field, direction: 'desc' });
      } else {
        onSortChange(null);
      }
    } else {
      onSortChange({ field, direction: 'asc' });
    }
  };

  const handleToggleCollapse = (field: string) => {
    const newCollapsed = new Set(collapsedColumns);
    if (newCollapsed.has(field)) {
      newCollapsed.delete(field);
    } else {
      newCollapsed.add(field);
      // Collapsing the sorted column clears the sort.
      if (sortConfig?.field === field) {
        onSortChange(null);
      }
    }
    setCollapsedColumns(newCollapsed);
    localStorage.setItem(COLLAPSED_COLUMNS_COOKIE, JSON.stringify(Array.from(newCollapsed)));
  };

  const allRows = useMemo(() => {
    const rows = cars.flatMap(car =>
      car.d
        .filter(item => !selectedYear || item.y === selectedYear)
        .map((item, index) => ({
          car,
          item,
          index
        }))
    );

    if (sortConfig) {
      rows.sort((a, b) => {
        let aValue: string;
        let bValue: string;

        if (sortConfig.field === 'model') {
          aValue = a.car.lnk;
          bValue = b.car.lnk;
        } else {
          aValue = (a.item[sortConfig.field as keyof CarDataItem] as string) || '';
          bValue = (b.item[sortConfig.field as keyof CarDataItem] as string) || '';
        }

        if (aValue === bValue) return 0;

        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return rows;
  }, [cars, sortConfig, selectedYear]);

  return (
    // No overflow wrapper here: a scroll container would re-anchor the sticky
    // header to itself. The page's content area (flex-1) scrolls both axes, so
    // the sticky thead pins just below the (also sticky) ResultsHeader bar.
    <div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="sticky z-20 bg-gray-50 dark:bg-gray-700" style={{ top: stickyTop }}>
          <tr>
            {session?.user && (
              <th className="p-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 whitespace-nowrap bg-gray-50 dark:bg-gray-700 w-[40px] border-r border-gray-200 dark:border-gray-600">
                {t('table.add')}
              </th>
            )}
            <th className="p-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 whitespace-nowrap bg-gray-50 dark:bg-gray-700 w-[100px] border-r border-gray-200 dark:border-gray-600">
              {t('table.image')}
            </th>
            {showCastingName && (
              <th className="p-2 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 whitespace-nowrap bg-gray-50 dark:bg-gray-700 border-r border-gray-200 dark:border-gray-600">
                {t('table.casting')}
              </th>
            )}
            {FIELD_ORDER.map(field => (
              <TableHeader
                key={field.key}
                field={field}
                sortConfig={sortConfig}
                onSort={handleSort}
                collapsedColumns={collapsedColumns}
                onToggleCollapse={handleToggleCollapse}
              />
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {allRows.map(({ car, item, index }) => (
            <TableRow
              key={`${car.lnk}-${index}`}
              car={car}
              item={item}
              collapsedColumns={collapsedColumns}
              onImageClick={carousel.open}
              isCollected={collection.some(c => c === item.id)}
              onAddToCollection={() => onAddToCollection && item.id && onAddToCollection(item.id)}
              onSeriesClick={onSeriesClick}
              onModelClick={onModelClick}
              onYearClick={onYearClick}
              showCastingName={showCastingName}
            />
          ))}
        </tbody>
      </table>
      <CarouselModal carousel={carousel} />
    </div>
  );
};

export default memo(ModelsTable);
