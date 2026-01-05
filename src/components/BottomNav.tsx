import { Link, useLocation } from 'react-router-dom';
import { Calendar, BookOpen, BarChart3, Settings, Plus } from 'lucide-react';
import { clsx } from 'clsx';

const tabs = [
  { path: '/today', icon: Calendar, label: 'Today' },
  { path: '/insights', icon: BarChart3, label: 'Stats' },
  { path: '/library', icon: BookOpen, label: 'Library' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const location = useLocation();

  const handleFABClick = () => {
    if (location.pathname === '/library') {
      window.dispatchEvent(new Event('openAddItemModal'));
    } else if (location.pathname === '/schedule') {
      window.dispatchEvent(new Event('openAddScheduleModal'));
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)]/80 backdrop-blur-lg border-t border-[var(--stroke)] safe-area-bottom">
      <div className="mx-auto max-w-[430px] relative">
        <div className="flex items-center justify-around px-4 py-2">
          {tabs.slice(0, 2).map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={clsx(
                  'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-[18px] transition-colors',
                  isActive
                    ? 'text-[var(--acc)]'
                    : 'text-[var(--muted2)] hover:text-[var(--text)]'
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-black">{label}</span>
              </Link>
            );
          })}
          
          {/* FAB Button */}
          <button
            onClick={handleFABClick}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[var(--acc)] text-white shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center"
            aria-label="Add"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
          
          {tabs.slice(2).map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={clsx(
                  'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-[18px] transition-colors',
                  isActive
                    ? 'text-[var(--acc)]'
                    : 'text-[var(--muted2)] hover:text-[var(--text)]'
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-black">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}



