'use client';

import { link } from './ui/styles';

interface LinkButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

// The shared in-app link (series / year / designer / model name): a button styled as a link.
export default function LinkButton({ onClick, children, className = '' }: LinkButtonProps) {
  return (
    <button type="button" onClick={onClick} className={`${link} ${className}`}>
      {children}
    </button>
  );
}
