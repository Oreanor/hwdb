'use client';

import * as RSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
}

const triggerClass =
  'h-7 xs:h-8 sm:h-9 px-2 sm:px-3 inline-flex items-center justify-between gap-1 text-xs xs:text-sm ' +
  'border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 dark:text-gray-200 ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer';

export default function Select({ value, onValueChange, options, ariaLabel, placeholder, className = '' }: SelectProps) {
  return (
    <RSelect.Root value={value} onValueChange={onValueChange}>
      <RSelect.Trigger aria-label={ariaLabel} className={`${triggerClass} ${className}`}>
        <RSelect.Value placeholder={placeholder} />
        <RSelect.Icon>
          <ChevronDown className="w-4 h-4 opacity-60" />
        </RSelect.Icon>
      </RSelect.Trigger>
      <RSelect.Portal>
        <RSelect.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-72 overflow-hidden rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-lg"
        >
          <RSelect.Viewport className="p-1">
            {options.map((o) => (
              <RSelect.Item
                key={o.value}
                value={o.value}
                disabled={o.disabled}
                className="relative flex items-center pl-7 pr-3 py-1.5 text-xs xs:text-sm rounded text-gray-900 dark:text-gray-200 data-[highlighted]:bg-blue-500 data-[highlighted]:text-white data-[disabled]:opacity-40 outline-none cursor-pointer select-none"
              >
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
