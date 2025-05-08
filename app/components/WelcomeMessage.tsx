import Image from 'next/image';
import { t } from '../i18n';

export default function WelcomeMessage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-600 dark:text-gray-400 h-full">
      <div className="w-32 h-32 mb-4 relative">
        <Image
          src="/logo.png"
          alt="RTH Logo"
          fill
          style={{ objectFit: 'contain' }}
          sizes="128px"
        />
      </div>
      <p className="text-2xl mb-2">{t('welcome.title')}</p>
      <p className="text-sm">{t('welcome.subtitle')}</p>
    </div>
  );
} 