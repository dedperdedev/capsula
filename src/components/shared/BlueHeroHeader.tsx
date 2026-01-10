/**
 * Blue Hero Header Component
 * Unified header system across all screens
 */

import type { ReactNode } from 'react';

export type BlueHeroHeaderVariant = 'large' | 'compact' | 'none';

interface BlueHeroHeaderProps {
  variant: BlueHeroHeaderVariant;
  title: string;
  subtitle?: string;
  leftAction?: ReactNode;
  rightActions?: ReactNode;
  children?: ReactNode; // For large variant content (e.g., progress ring)
  className?: string;
}

export function BlueHeroHeader({
  variant,
  title,
  subtitle,
  leftAction,
  rightActions,
  children,
  className = '',
}: BlueHeroHeaderProps) {
  if (variant === 'none') {
    return null;
  }

  const isLarge = variant === 'large';

  return (
    <div
      className={`relative w-full text-white ${
        isLarge ? 'rounded-b-[28px] shadow-lg' : ''
      } ${className}`}
      style={{
        height: isLarge ? 'min(300px, 35vh)' : '84px',
        minHeight: isLarge ? '240px' : '84px',
        paddingTop: `calc(env(safe-area-inset-top, 0px) + ${isLarge ? '16px' : '12px'})`,
        background: 'linear-gradient(to bottom, var(--hero-blue-start, #5C8FF0), var(--hero-blue-end, #4E7FE6))',
      }}
    >
      <div className={`h-full flex flex-col px-5 ${isLarge ? 'pb-6' : 'pb-3'}`}>
        {/* Top row: Left action + Right actions */}
        {(leftAction || rightActions) && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex-shrink-0">{leftAction}</div>
            {rightActions && (
              <div className="flex items-center gap-2 flex-shrink-0">{rightActions}</div>
            )}
          </div>
        )}

        {/* Content area */}
        {isLarge ? (
          <div className="flex-1 flex flex-col">
            {/* Custom content (e.g., progress ring, date navigation) */}
            {children ? (
              <div className="flex-1 flex flex-col">
                {children}
              </div>
            ) : (
              <>
                {/* Default title and subtitle when no custom content */}
                <div className="mb-auto">
                  <h1 className="text-2xl font-bold text-white mb-1 leading-tight">{title}</h1>
                  {subtitle && (
                    <p className="text-sm text-white/80 leading-relaxed">{subtitle}</p>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-white leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-white/80 mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
