'use client';

import { ImageCarousel } from '../hooks/useImageCarousel';
import ImageModal from './ImageModal';

interface CarouselModalProps {
  carousel: ImageCarousel;
}

// Renders the full-screen image modal for a useImageCarousel instance.
// The carousel always shows individual variants, so the caption always carries
// casting name + year + series.
export default function CarouselModal({ carousel }: CarouselModalProps) {
  if (!carousel.isOpen || !carousel.current) return null;
  const { url, name, year, series } = carousel.current;
  return (
    <ImageModal
      imageUrl={url}
      onClose={carousel.close}
      onPrev={carousel.prev}
      onNext={carousel.next}
      hasPrev={carousel.hasPrev}
      hasNext={carousel.hasNext}
      caption={{ name, year, series }}
    />
  );
}
