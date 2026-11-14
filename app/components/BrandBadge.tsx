import { Brand, BRANDS, brandLabel } from '../lib/brands';

interface BrandBadgeProps {
  brand?: Brand;
  className?: string;
}

// Brand marker for result sets that span more than one brand: the short key
// ("hw"), with the full name on hover. Callers position it (cards overlay it on
// the thumbnail, tables put it in its own cell).
export default function BrandBadge({ brand, className = '' }: BrandBadgeProps) {
  return (
    <span
      title={brandLabel(brand)}
      className={`inline-block rounded bg-gray-900/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white ${className}`}
    >
      {brand ?? BRANDS[0].key}
    </span>
  );
}
