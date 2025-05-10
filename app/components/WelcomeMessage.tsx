import Image from 'next/image';
import { t } from '../i18n';

interface WelcomeMessageProps {
  isLoggedIn?: boolean;
}

export default function WelcomeMessage({ isLoggedIn }: WelcomeMessageProps) {
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
      <p className="text-sm max-w-[400px] text-center">
        {t('welcome.subtitle')}
      </p>
      {!isLoggedIn && <p className="text-sm max-w-[400px] text-center">
        {t('welcome.subtitle2')}
      </p>}
    </div>
  );
} 