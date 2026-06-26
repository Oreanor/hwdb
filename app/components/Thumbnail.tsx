'use client';

import Image from 'next/image';
import { useState } from 'react';
import { t } from '../i18n';

interface ThumbnailProps {
  url?: string;
  // Tried if `url` fails to load (e.g. the preview isn't uploaded yet).
  fallbackUrl?: string;
  alt: string;
  onClick?: () => void;
  // Sizing for the box, e.g. "w-16 h-16" (table cell) or "w-full h-48" (card).
  className?: string;
}

// Image with graceful degradation: url -> fallbackUrl -> "No image".
export default function Thumbnail({ url, fallbackUrl, alt, onClick, className = '' }: ThumbnailProps) {
  const sources = [url, fallbackUrl].filter(Boolean) as string[];
  const [stage, setStage] = useState(0);
  const src = sources[stage];

  return (
    <div className={`relative ${onClick ? 'cursor-pointer' : ''} ${className}`} onClick={onClick}>
      {src ? (
        <Image src={src} alt={alt} fill className="object-contain" onError={() => setStage((s) => s + 1)} />
      ) : (
        <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center rounded">
          <span className="text-gray-400 dark:text-gray-500 text-xs">{t('table.noImage')}</span>
        </div>
      )}
    </div>
  );
}
