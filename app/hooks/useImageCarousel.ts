'use client';

import { useCallback, useMemo, useState } from 'react';
import { CarData } from '../types';
import { formatCarName, getImageUrl } from '../utils';
import { variantsInYear } from '../lib/years';

export interface CarouselPhoto {
  url: string;
  name: string;
  year?: string;
  series?: string;
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

// Every photo of the shown variants, in display order.
export const carouselPhotos = (cars: CarData[], year?: string): CarouselPhoto[] =>
  cars.flatMap((car) => {
    const name = formatCarName(car.lnk);
    return variantsInYear(car.d, year).flatMap((v) => {
      const url = getImageUrl(v);
      return url ? [{ url, name, year: v.y, series: v.Sr }] : [];
    });
  });

// "Click a thumbnail -> full-screen viewer with prev/next", shared by the
// variants table and the variants gallery (render it with <ImageModal>).
export function useImageCarousel(photos: CarouselPhoto[]): ImageCarousel {
  const [index, setIndex] = useState(-1);
  const urls = useMemo(() => photos.map((p) => p.url), [photos]);

  const open = useCallback((url: string) => setIndex(urls.indexOf(url)), [urls]);
  const close = useCallback(() => setIndex(-1), []);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex((i) => Math.min(urls.length - 1, i + 1)), [urls.length]);

  const isOpen = index >= 0 && index < photos.length;
  return {
    isOpen,
    current: isOpen ? photos[index] : null,
    hasPrev: index > 0,
    hasNext: index < photos.length - 1,
    open,
    close,
    prev,
    next,
  };
}
