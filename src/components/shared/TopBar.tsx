interface TopBarProps {
  title: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-black text-[var(--text)] mb-1">{title}</h1>
      {subtitle && (
        <p className="text-sm text-[var(--muted2)]">{subtitle}</p>
      )}
    </div>
  );
}



