'use client';

import * as RSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { control, menuContent, menuItemChecked } from './styles';

interface SelectProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: string }[];
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
}

// The app's one dropdown: a `control` trigger and a menu of checkable options.
// Typed by its option values, so callers get their own union back.
export default function Select<T extends string>({
  value,
  onValueChange,
  options,
  ariaLabel,
  placeholder,
  className = '',
}: SelectProps<T>) {
  return (
    <RSelect.Root value={value} onValueChange={(v) => onValueChange(v as T)}>
      <RSelect.Trigger aria-label={ariaLabel} className={`${control} justify-between ${className}`}>
        <RSelect.Value placeholder={placeholder} />
        <RSelect.Icon>
          <ChevronDown className="w-4 h-4 opacity-60" />
        </RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content position="popper" sideOffset={4} className={`${menuContent} max-h-72 overflow-hidden`}>
          <RSelect.Viewport>
            {options.map((o) => (
              <RSelect.Item key={o.value} value={o.value} className={menuItemChecked}>
                <RSelect.ItemIndicator className="absolute left-1.5 inline-flex">
                  <Check className="w-4 h-4" />
                </RSelect.ItemIndicator>
                <RSelect.ItemText>{o.label}</RSelect.ItemText>
              </RSelect.Item>
            ))}
          </RSelect.Viewport>
        </RSelect.Content>
      </RSelect.Portal>
    </RSelect.Root>
  );
}
