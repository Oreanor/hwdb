'use client';

import { useCallback, useMemo, useState } from 'react';

export interface CarouselPhoto {
  url: string;
  year?: string;
  series?: string;
  name?: string;
}

export interface ImageCarousel {
  isOpen: boolean;
  current: CarouselPhoto | null;
  hasPrev: boolean;
  hasNext: boolean;
  open: (url: string) => void;
  close: () => void;
  prev: () => void;
  next: () => void;
}

// One place for the "click a thumbnail -> open a full-screen carousel" behaviour,
// shared by the variants table and the variants gallery.
export function useImageCarousel(photos: CarouselPhoto[]): ImageCarousel {
  const [index, setIndex] = useState(-1);
  const urls = useMemo(() => photos.map((p) => p.url), [photos]);

  const open = useCallback(
    (url: string) => {
      const i = urls.indexOf(url);
      if (i !== -1) setIndex(i);
    },
    [urls]
  );
  const close = useCallback(() => setIndex(-1), []);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex((i) => Math.min(urls.length - 1, i + 1)), [urls.length]);

  const isOpen = index >= 0 && index < photos.length;
  return {
    isOpen,
    current: isOpen ? photos[index] : null,
    hasPrev: index > 0,
    hasNext: index < urls.length - 1,
    open,
    close,
    prev,
    next,
  };
}
