/**
 * Chip Component
 * Reusable chip button for selections
 */

import { clsx } from 'clsx';

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({ label, selected = false, onClick, className }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "px-4 py-2 rounded-[14px] text-sm font-medium transition-colors whitespace-nowrap",
        "active:scale-95",
        selected
          ? "bg-blue-500 text-white"
          : "bg-[var(--surface2)] text-[var(--text)] border border-[var(--stroke)] hover:bg-[var(--stroke)]",
        className
      )}
    >
      {label}
    </button>
  );
}
