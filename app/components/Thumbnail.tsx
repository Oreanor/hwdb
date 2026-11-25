'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { t } from '../i18n';

interface ThumbnailProps {
  url?: string;
  // Tried if `url` fails to load (e.g. the preview isn't uploaded yet).
  fallbackUrl?: string;
  alt: string;
  onClick?: () => void;
  // Box size, e.g. "size-16" (table cell) or "w-full h-48" (card).
  className?: string;
}

// Image with graceful degradation: url -> fallbackUrl -> a "No image" placeholder.
export default function Thumbnail({ url, fallbackUrl, alt, onClick, className = '' }: ThumbnailProps) {
  // Remember failed sources (not a position), so a new url is tried afresh.
  const [failed, setFailed] = useState<string[]>([]);
  const src = [url, fallbackUrl].find((s): s is string => !!s && !failed.includes(s));

  const body = src ? (
    <Image src={src} alt={alt} fill className="object-contain" onError={() => setFailed((f) => [...f, src])} />
  ) : (
    <span className="flex h-full w-full flex-col items-center justify-center gap-1 rounded bg-gray-100 dark:bg-gray-700/60 text-[10px] text-gray-400 dark:text-gray-500">
      <ImageOff className="w-4 h-4" />
      {t('table.noImage')}
    </span>
  );

  return onClick && src ? (
    <button type="button" onClick={onClick} aria-label={alt} className={`relative block cursor-zoom-in ${className}`}>
      {body}
    </button>
  ) : (
    <div className={`relative ${className}`}>{body}</div>
  );
}
