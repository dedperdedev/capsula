import type { ReactNode } from 'react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  rightContent?: ReactNode;
}

export function TopBar({ title, subtitle, rightContent }: TopBarProps) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-black text-[var(--text)] mb-1">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[var(--muted2)]">{subtitle}</p>
        )}
      </div>
      {rightContent && <div className="flex-shrink-0">{rightContent}</div>}
    </div>
  );
}



