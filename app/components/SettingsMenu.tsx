'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Settings, Sun, Moon, LogOut, Check, Languages, ChevronRight } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { t, Language } from '../i18n';
import { LANGUAGES } from '../consts';
import { Theme } from '../theme';

interface SettingsMenuProps {
  isLoggedIn: boolean;
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  theme: Theme;
  onThemeToggle: () => void;
}

const contentClass =
  'z-50 min-w-[180px] rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-lg p-1';
const itemClass =
  'flex items-center gap-2 px-3 py-1.5 text-xs xs:text-sm rounded text-gray-900 dark:text-gray-200 data-[highlighted]:bg-blue-500 data-[highlighted]:text-white outline-none cursor-pointer select-none';
const radioItemClass =
  'relative flex items-center pl-7 pr-3 py-1.5 text-xs xs:text-sm rounded text-gray-900 dark:text-gray-200 data-[highlighted]:bg-blue-500 data-[highlighted]:text-white outline-none cursor-pointer select-none';

export default function SettingsMenu({
  isLoggedIn,
  currentLang,
  onLanguageChange,
  theme,
  onThemeToggle,
}: SettingsMenuProps) {
  const { data: session } = useSession();
  const name = session?.user?.name || '';
  const email = session?.user?.email || '';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label={t('common.settings')}
          className="h-7 xs:h-8 sm:h-9 w-7 xs:w-8 sm:w-9 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={4} className={contentClass}>
          {isLoggedIn && (name || email) && (
            <>
              <DropdownMenu.Label className="px-3 py-1.5">
                {name && <div className="text-xs xs:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{name}</div>}
                {email && email !== name && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{email}</div>
                )}
              </DropdownMenu.Label>
              <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-600 my-1" />
            </>
          )}

          {/* Theme toggle — keep the menu open so the change is visible. */}
          <DropdownMenu.Item
            className={itemClass}
            onSelect={(e) => {
              e.preventDefault();
              onThemeToggle();
            }}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}
          </DropdownMenu.Item>

          <DropdownMenu.Sub>
            <DropdownMenu.SubTrigger className={itemClass}>
              <Languages className="w-4 h-4" />
              {t('common.language')}
              <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
            </DropdownMenu.SubTrigger>
            <DropdownMenu.Portal>
              <DropdownMenu.SubContent sideOffset={2} className={contentClass}>
                <DropdownMenu.RadioGroup
                  value={currentLang}
                  onValueChange={(v) => onLanguageChange(v as Language)}
                >
                  {LANGUAGES.map((l) => (
                    <DropdownMenu.RadioItem key={l.code} value={l.code} className={radioItemClass}>
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

          {isLoggedIn && (
            <>
              <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-600 my-1" />
              <DropdownMenu.Item
                className={itemClass}
                onSelect={() => signOut({ callbackUrl: window.location.href })}
              >
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
