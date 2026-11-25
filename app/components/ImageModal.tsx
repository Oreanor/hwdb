'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { t } from '../i18n';
import { ImageCarousel } from '../hooks/useImageCarousel';

const roundButton =
  'fixed w-10 h-10 flex items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-sm shadow-lg text-white transition-colors hover:bg-black/60 disabled:opacity-30 disabled:hover:bg-black/40 cursor-pointer disabled:cursor-default';

// Full-screen photo viewer for a useImageCarousel: Esc / click outside closes,
// arrow keys and buttons step through the photos.
export default function ImageModal({ carousel }: { carousel: ImageCarousel }) {
  const { isOpen, current, hasPrev, hasNext, prev, next, close } = carousel;

  // Radix handles Escape; add the arrow keys.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrev) prev();
      else if (e.key === 'ArrowRight' && hasNext) next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, hasPrev, hasNext, prev, next]);

  if (!isOpen || !current) return null;
  const { url, name, year, series } = current;

  return (
    <Dialog.Root open onOpenChange={(open) => !open && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <Dialog.Title className="sr-only">{name || t('table.image')}</Dialog.Title>

          <Image
            src={url}
            alt={name || t('common.fullSize')}
            width={1200}
            height={800}
            className="block w-auto h-auto max-w-[90vw] max-h-[85vh] rounded-md bg-white p-1 shadow-2xl"
          />

          {(name || year || series) && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 max-w-[90vw] px-4 py-2 rounded-lg bg-black/50 backdrop-blur-sm text-sm text-white shadow-lg">
              {name && <span className="font-semibold">{name}</span>}
              {year && <span className="text-white/90">{year}</span>}
              {series && <span className="truncate text-white/70">{series}</span>}
            </div>
          )}

          <Dialog.Close aria-label={t('common.close')} className={`${roundButton} right-6 top-6`}>
            <X className="w-6 h-6" />
          </Dialog.Close>
          <button
            onClick={prev}
            disabled={!hasPrev}
            aria-label={t('common.previous')}
            className={`${roundButton} left-6 top-1/2 -translate-y-1/2`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={next}
            disabled={!hasNext}
            aria-label={t('common.next')}
            className={`${roundButton} right-6 top-1/2 -translate-y-1/2`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
