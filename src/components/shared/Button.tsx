import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  onClick,
  type = 'button',
  disabled = false,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'rounded-[18px] font-black text-sm transition-all active:scale-[0.98] focus:outline-none focus:ring-2',
        variant === 'primary' && 'bg-[var(--acc)] text-white hover:opacity-90 focus:ring-[var(--acc)]',
        variant === 'ghost' && 'bg-[var(--surface2)] text-[var(--text)] hover:bg-[var(--stroke)] focus:ring-[var(--acc2)]',
        variant === 'danger' && 'bg-[var(--danger)] text-white hover:opacity-90 focus:ring-[var(--danger)]',
        size === 'sm' && 'px-3 py-1.5 text-xs',
        size === 'md' && 'px-4 py-2',
        size === 'lg' && 'px-6 py-3 text-base',
        fullWidth && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}



