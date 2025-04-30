import Image from 'next/image';

export default function WelcomeMessage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 h-full">
      <div className="w-32 h-32 mb-4 relative">
        <Image
          src="/logo.png"
          alt="RTH Logo"
          fill
          style={{ objectFit: 'contain' }}
          sizes="128px"
        />
      </div>
      <p className="text-2xl mb-2">Welcome to HWDB</p>
      <p className="text-sm">Enter your search query to find Hot Wheels models</p>
    </div>
  );
} 