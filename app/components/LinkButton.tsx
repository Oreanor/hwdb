'use client';

interface LinkButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

// The shared "clickable blue link" used for series / year / designer / model name.
export default function LinkButton({ onClick, children, className = '', title }: LinkButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`text-left text-blue-600 dark:text-blue-400 hover:underline cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
}
