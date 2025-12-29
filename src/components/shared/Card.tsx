import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-[18px] border border-[var(--stroke)] bg-[var(--surface)] p-4',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}



