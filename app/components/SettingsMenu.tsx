'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Settings, Sun, Moon, LogOut, Check, Languages, ChevronRight } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { t, Language } from '../i18n';
import { LANGUAGES } from '../consts';
import { Theme } from '../theme';
import { iconButton, menuContent, menuItem, menuItemChecked, menuSeparator } from './ui/styles';

interface SettingsMenuProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  theme: Theme;
  onThemeToggle: () => void;
}

export default function SettingsMenu({ currentLang, onLanguageChange, theme, onThemeToggle }: SettingsMenuProps) {
  const { data: session } = useSession();
  const name = session?.user?.name || '';
  const email = session?.user?.email || '';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button aria-label={t('common.settings')} className={iconButton}>
          <Settings className="w-4 h-4" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={4} className={menuContent}>
          {session && (name || email) && (
            <>
              <DropdownMenu.Label className="px-3 py-1.5">
                {name && <div className="text-xs xs:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{name}</div>}
                {email && email !== name && <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{email}</div>}
              </DropdownMenu.Label>
              <DropdownMenu.Separator className={menuSeparator} />
            </>
          )}

          {/* Theme toggle — keep the menu open so the change is visible. */}
          <DropdownMenu.Item
            className={menuItem}
            onSelect={(e) => {
              e.preventDefault();
              onThemeToggle();
            }}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
          </DropdownMenu.Item>

          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className={menuItem}>
              <Languages className="w-4 h-4" />
              {t('common.language')}
              <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent sideOffset={2} className={menuContent}>
                <DropdownMenu.RadioGroup value={currentLang} onValueChange={(v) => onLanguageChange(v as Language)}>
                  {LANGUAGES.map((l) => (
                    <DropdownMenu.RadioItem key={l.code} value={l.code} className={menuItemChecked}>
                      <DropdownMenu.ItemIndicator className="absolute left-1.5 inline-flex">
                        <Check className="w-4 h-4" />
                      </DropdownMenu.ItemIndicator>
                      {l.label}
                    </DropdownMenu.RadioItem>
                  ))}
                </DropdownMenu.RadioGroup>
              </DropdownMenu.SubContent>
            </DropdownMenu.Portal>
          </DropdownMenu.Sub>

          {session && (
            <>
              <DropdownMenu.Separator className={menuSeparator} />
              <DropdownMenu.Item className={menuItem} onSelect={() => signOut({ callbackUrl: window.location.href })}>
                <LogOut className="w-4 h-4" />
                {t('auth.logout')}
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
