'use client';

import { useSession, signIn } from 'next-auth/react';
import { t, Language } from '../i18n';
import { Theme } from '../theme';
import SettingsMenu from './SettingsMenu';

interface UserControlsProps {
  showCollection: boolean;
  onCollectionClick: () => void;
  onLanguageChange: (lang: Language) => void;
  currentLang: Language;
  theme: Theme;
  onThemeToggle: () => void;
}

const primaryBtn =
  'flex items-center gap-2 px-2 xs:px-3 py-1.5 xs:py-2 rounded-lg text-xs xs:text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer';

export default function UserControls({
  showCollection,
  onCollectionClick,
  onLanguageChange,
  currentLang,
  theme,
  onThemeToggle,
}: UserControlsProps) {
  const { data: session } = useSession();

  return (
    <>
      {!session ? (
        <button onClick={() => signIn('google')} className={primaryBtn}>
          {t('auth.login')}
        </button>
      ) : (
        <button onClick={onCollectionClick} className={primaryBtn}>
          {!showCollection ? t('auth.myCollection') : t('common.allModels')}
        </button>
      )}
      <SettingsMenu
        isLoggedIn={!!session}
        currentLang={currentLang}
        onLanguageChange={onLanguageChange}
        theme={theme}
        onThemeToggle={onThemeToggle}
      />
    </>
  );
}
