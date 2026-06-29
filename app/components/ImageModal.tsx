'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { t } from '../i18n';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  caption?: { name?: string; year?: string; series?: string };
}

const navBtn =
  'fixed top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center transition-colors bg-black/30 backdrop-blur-sm rounded-full border border-white/20 shadow-lg';

export default function ImageModal({
  imageUrl,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  caption,
}: ImageModalProps) {
  // Radix Dialog handles Escape; we add the arrow keys for prev/next.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
      else if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPrev, onNext, hasPrev, hasNext]);

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Dialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <Dialog.Title className="sr-only">{t('table.image')}</Dialog.Title>

          <Image
            src={imageUrl}
            alt={t('common.fullSize')}
            width={1200}
            height={800}
            className="block w-auto h-auto max-w-[90vw] max-h-[90vh] bg-white border-4 border-white rounded-sm shadow-lg"
          />

          {caption && (caption.name || caption.year || caption.series) && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 max-w-[90vw] px-4 py-2 rounded-lg bg-black/40 backdrop-blur-sm text-white text-sm shadow-lg">
              {caption.name && <span className="font-bold">{caption.name}</span>}
              {caption.year && <span className="text-white/90">{caption.year}</span>}
              {caption.series && <span className="text-white/70 truncate">{caption.series}</span>}
            </div>
          )}

          <Dialog.Close
            aria-label={t('common.close')}
            className="fixed right-6 top-6 w-10 h-10 flex items-center justify-center text-white hover:text-gray-300 transition-colors bg-black/30 backdrop-blur-sm rounded-full border border-white/20 shadow-lg cursor-pointer"
          >
            <X className="w-6 h-6" />
          </Dialog.Close>

          <button
            onClick={hasPrev ? onPrev : undefined}
            disabled={!hasPrev}
            aria-label={t('common.previous')}
            className={`${navBtn} left-6 ${hasPrev ? 'text-white hover:text-gray-300 cursor-pointer' : 'text-white/30 cursor-default'}`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={hasNext ? onNext : undefined}
            disabled={!hasNext}
            aria-label={t('common.next')}
            className={`${navBtn} right-6 ${hasNext ? 'text-white hover:text-gray-300 cursor-pointer' : 'text-white/30 cursor-default'}`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
