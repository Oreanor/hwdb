'use client';

import Link from 'next/link';
import { getFandomUrl, getImageUrl } from '../consts';
import LazyImage from './LazyImage';

interface CarCardProps {
  car: {
    l: string;
    i?: string;
  };
  year: number | null;
  index: number;
}

export default function CarCard({ car, year, index }: CarCardProps) {
  const carName = car.l ? decodeURIComponent(car.l.split('/').pop() || '').replace(/_/g, ' ') : 'Unknown Car';
  const fandomUrl = car.l ? getFandomUrl(car.l.split('/').pop() || '') : '';
  const imageUrl = car.i ? getImageUrl(car.i) : '';
  const isImageNotAvailable = car.i?.includes('Image_Not_Available');

  const CarSilhouette = () => (
    <div className="w-full h-32 rounded mb-1 bg-gray-100 flex items-center justify-center">
      <svg
        className="w-16 h-16 text-gray-300"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z" />
        <circle cx="7.5" cy="14.5" r="1.5" />
        <circle cx="16.5" cy="14.5" r="1.5" />
      </svg>
    </div>
  );

  return (
    <div
      key={`${year}-${index}`}
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow flex flex-col items-start text-left"
    >
      {year && <p className="font-semibold text-sm mb-1">{year}</p>}
      {imageUrl && !isImageNotAvailable ? (
        <LazyImage
          src={imageUrl}
          alt={carName}
          className="w-full h-32 rounded mb-1"
        />
      ) : (
        <CarSilhouette />
      )}
      <h3 className="font-semibold text-sm mb-1">{carName}</h3>
      
      {fandomUrl && (
        <Link
          href={fandomUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 text-xs"
        >
          View on Fandom
        </Link>
      )}
    </div>
  );
} 