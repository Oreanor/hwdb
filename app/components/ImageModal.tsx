import Image from 'next/image';
import { useEffect } from 'react';
import CloseIcon from './icons/CloseIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export default function ImageModal({ 
  imageUrl, 
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false
}: ImageModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
        onPrev();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  return (
    <div 
      className="fixed inset-0 bg-[rgba(0,0,0,0.3)] z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="fixed right-10 top-10 w-10 h-10 flex items-center justify-center text-white hover:text-gray-300 transition-colors cursor-pointer bg-black/30 backdrop-blur-sm rounded-full border border-white/20 shadow-lg"
          >
            <CloseIcon />
          </button>
          <Image
            src={imageUrl}
            alt="Full size"
            width={1200}
            height={800}
            style={{ objectFit: 'contain' }}
            className="max-w-full max-h-[90vh]"
          />
        <button
          onClick={hasPrev ? onPrev : undefined}
          className={`fixed left-10 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center transition-colors cursor-pointer bg-black/30 backdrop-blur-sm rounded-full border border-white/20 shadow-lg ${
            hasPrev 
              ? 'text-white hover:text-gray-300 cursor-pointer' 
              : 'text-white/30 cursor-default'
          }`}
        >
          <ArrowLeftIcon />
        </button>
        <button
          onClick={hasNext ? onNext : undefined}
          className={`fixed right-10 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center transition-colors cursor-pointer bg-black/30 backdrop-blur-sm rounded-full border border-white/20 shadow-lg ${
            hasNext 
              ? 'text-white hover:text-gray-300 cursor-pointer' 
              : 'text-white/30 cursor-default'
          }`}
        >
          <ArrowRightIcon />
        </button>
      </div>
    </div>
  );
} 