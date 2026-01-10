import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, BookOpen, BarChart3, Settings, Plus, Search, FilePlus } from 'lucide-react';
import { clsx } from 'clsx';
import { BottomSheet } from './shared/BottomSheet';
import { useI18n } from '../hooks/useI18n';

const tabs = [
  { path: '/today', icon: Calendar, label: 'Today' },
  { path: '/insights', icon: BarChart3, label: 'Stats' },
  { path: '/library', icon: BookOpen, label: 'Library' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-center pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Pill container */}
      <div className="pointer-events-auto mx-auto flex items-center justify-center pb-3" style={{ width: 'calc(100% - 32px)', maxWidth: '360px', minWidth: '280px' }}>
        <div className="relative w-full">
          {/* Pill background - Hero blue matching Today header with premium touches */}
          <div className="relative w-full h-[56px] rounded-full bg-[#5C8FF0] shadow-sm grid grid-cols-[1fr_1fr_84px_1fr_1fr] items-center px-1.5 overflow-hidden">
            {/* Premium top highlight - subtle gradient */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
            
            {/* Left tabs (columns 1-2) - fixed slot positions, no reflow */}
            {tabs.slice(0, 2).map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path;
              
              // Get short localized label
              const getShortLabel = () => {
                if (locale === 'ru') {
                  if (path === '/today') return 'Главная';
                  if (path === '/insights') return 'Стат';
                  if (path === '/library') return 'Аптечка';
                  if (path === '/settings') return 'Настройки';
                }
                // English: keep short
                if (path === '/insights') return 'Stats';
                return label;
              };
              
              return (
                <div key={path} className="flex items-center justify-center min-w-0 relative z-10 overflow-hidden">
                  <Link
                    to={path}
                    className={clsx(
                      'h-11 rounded-full transition-all flex items-center justify-center overflow-hidden whitespace-nowrap',
                      isActive ? 'text-white max-w-full' : 'text-white/80 w-11',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#5C8FF0]'
                    )}
                    aria-label={label}
                  >
                    {isActive ? (
                      <div 
                        className="h-11 px-3 rounded-full flex items-center gap-2 min-w-0"
                        style={{ backgroundColor: 'rgba(67, 124, 213, 0.9)', maxWidth: '100%' }} // ~15% darker than #5C8FF0
                      >
                        <Icon size={22} strokeWidth={2} className="text-white shrink-0" />
                        <span className="text-sm font-medium text-white truncate max-w-[72px] min-w-0">
                          {getShortLabel()}
                        </span>
                      </div>
                    ) : (
                      <Icon size={22} strokeWidth={2} />
                    )}
                  </Link>
                </div>
              );
            })}

            {/* Center pocket (column 3) - reserved space for + button */}
            <div className="w-[84px] flex-shrink-0" />

            {/* Right tabs (columns 4-5) - fixed slot positions, no reflow */}
            {tabs.slice(2).map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path;
              
              // Get short localized label
              const getShortLabel = () => {
                if (locale === 'ru') {
                  if (path === '/today') return 'Главная';
                  if (path === '/insights') return 'Стат';
                  if (path === '/library') return 'Аптечка';
                  if (path === '/settings') return 'Настройки';
                }
                // English: keep short
                if (path === '/insights') return 'Stats';
                return label;
              };
              
              return (
                <div key={path} className="flex items-center justify-center min-w-0 relative z-10 overflow-hidden">
                  <Link
                    to={path}
                    className={clsx(
                      'h-11 rounded-full transition-all flex items-center justify-center overflow-hidden whitespace-nowrap',
                      isActive ? 'text-white max-w-full' : 'text-white/80 w-11',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#5C8FF0]'
                    )}
                    aria-label={label}
                  >
                    {isActive ? (
                      <div 
                        className="h-11 px-3 rounded-full flex items-center gap-2 min-w-0"
                        style={{ backgroundColor: 'rgba(67, 124, 213, 0.9)', maxWidth: '100%' }} // ~15% darker than #5C8FF0
                      >
                        <Icon size={22} strokeWidth={2} className="text-white shrink-0" />
                        <span className="text-sm font-medium text-white truncate max-w-[72px] min-w-0">
                          {getShortLabel()}
                        </span>
                      </div>
                    ) : (
                      <Icon size={22} strokeWidth={2} />
                    )}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Center + button - clean green circle with subtle shadow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsActionSheetOpen(true);
            }}
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[10px] rounded-full bg-emerald-500 text-white shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#5C8FF0] transition-all hover:opacity-90 active:scale-95 flex items-center justify-center z-20 pointer-events-auto"
            style={{ width: '58px', height: '58px' }}
            aria-label={locale === 'ru' ? 'Добавить' : 'Add'}
          >
            <Plus size={22} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Action Sheet */}
      <BottomSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        title={locale === 'ru' ? 'Добавить' : 'Add'}
      >
        <div className="space-y-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsActionSheetOpen(false);
              // Small delay to ensure BottomSheet closes before navigation
              setTimeout(() => {
                navigate('/search');
              }, 100);
            }}
            className="w-full flex items-center gap-4 p-4 rounded-[18px] bg-[var(--surface2)] hover:bg-[var(--stroke)] transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--acc)]/10 flex items-center justify-center">
              <Search size={20} className="text-[var(--acc)]" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-[var(--text)]">
                {locale === 'ru' ? 'Добавить из каталога' : 'Add from catalog'}
              </p>
              <p className="text-xs text-[var(--muted2)] mt-0.5">
                {locale === 'ru' ? 'Найти и добавить препарат из базы' : 'Search and add from drug database'}
              </p>
            </div>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsActionSheetOpen(false);
              // Open QuickAddWizard via event (existing pattern)
              // Small delay to ensure BottomSheet closes before opening wizard
              setTimeout(() => {
                window.dispatchEvent(new Event('openQuickAddWizard'));
              }, 100);
            }}
            className="w-full flex items-center gap-4 p-4 rounded-[18px] bg-[var(--surface2)] hover:bg-[var(--stroke)] transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--acc)]/10 flex items-center justify-center">
              <FilePlus size={20} className="text-[var(--acc)]" />
            </div>
            <div className="flex-1">
              <p className="text-base font-semibold text-[var(--text)]">
                {locale === 'ru' ? 'Добавить вручную' : 'Add manually'}
              </p>
              <p className="text-xs text-[var(--muted2)] mt-0.5">
                {locale === 'ru' ? 'Создать препарат без каталога' : 'Create medication without catalog'}
              </p>
            </div>
          </button>
        </div>
      </BottomSheet>
    </nav>
  );
}



