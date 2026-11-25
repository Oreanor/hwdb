'use client';

import { useSession, signIn } from 'next-auth/react';
import { t, Language } from '../i18n';
import { Theme } from '../theme';
import SettingsMenu from './SettingsMenu';
import { primaryButton } from './ui/styles';

interface UserControlsProps {
  showCollection: boolean;
  onCollectionClick: () => void;
  onLanguageChange: (lang: Language) => void;
  currentLang: Language;
  theme: Theme;
  onThemeToggle: () => void;
}

// Login / "My collection" toggle + the settings menu.
export default function UserControls({ showCollection, onCollectionClick, ...settings }: UserControlsProps) {
  const { data: session } = useSession();

  return (
    <>
      {session ? (
        <button onClick={onCollectionClick} className={primaryButton}>
          {showCollection ? t('common.allModels') : t('auth.myCollection')}
        </button>
      ) : (
        <button onClick={() => signIn('google')} className={primaryButton}>
          {t('auth.login')}
        </button>
      )}
      <SettingsMenu {...settings} />
    </>
  );
}
