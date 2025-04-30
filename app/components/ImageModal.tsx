import Image from 'next/image';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

export default function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="relative w-3/4 h-3/4 p-4">
        <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl border-4 border-white bg-white">
          <Image
            src={imageUrl}
            alt="Enlarged car image"
            fill
            style={{ objectFit: 'contain' }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </div>
    </div>
  );
} 