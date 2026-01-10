/**
 * Form Card Component
 * Card-like selectable button with icon and label (for dosage forms)
 */

import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface FormCardProps {
  icon: ReactNode;
  label: string;
  selected?: boolean;
  onClick?: () => void;
}

export function FormCard({ icon, label, selected = false, onClick }: FormCardProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex flex-col items-center justify-center gap-2 p-4 rounded-[24px] border transition-all",
        "active:scale-95 min-h-[100px] w-full",
        selected
          ? "bg-blue-500 border-blue-500 shadow-sm"
          : "bg-[var(--surface)] border-[var(--stroke)] hover:border-blue-300"
      )}
    >
      <div className={clsx(
        "text-2xl transition-colors",
        selected ? "text-white" : "text-blue-500"
      )}>
        {icon}
      </div>
      <span className={clsx(
        "text-sm font-medium",
        selected ? "text-white" : "text-[var(--text)]"
      )}>
        {label}
      </span>
    </button>
  );
}
