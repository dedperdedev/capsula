import { useState, useEffect } from 'react';
import { Moon, Sun, AlertTriangle, Languages, Bell, Database } from 'lucide-react';
import { TopBar } from '../components/shared/TopBar';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { itemsStore, inventoryStore } from '../data/store';
import { getTheme, setTheme, ensureThemeApplied } from '../lib/theme';
import { toast } from '../components/shared/Toast';
import { useI18n, setLocale } from '../hooks/useI18n';
import { loadDemoData } from '../data/seedData';

const NOTIFICATIONS_KEY = 'capsula_notifications_enabled';

export function SettingsPage() {
  const { locale, t } = useI18n();
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(getTheme());
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(NOTIFICATIONS_KEY) === 'true';
  });

  useEffect(() => {
    ensureThemeApplied();
  }, []);

  const items = itemsStore.getAll();
  const lowStockItems = inventoryStore.getLowStock();

  const handleThemeToggle = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setCurrentTheme(newTheme);
    toast.success(`${t('settings.switchedTheme')} ${newTheme} ${t('settings.mode')}`);
  };

  const handleNotificationsToggle = () => {
    const newState = !isNotificationsEnabled;
    setIsNotificationsEnabled(newState);
    localStorage.setItem(NOTIFICATIONS_KEY, String(newState));
    toast.success(
      newState ? t('settings.notificationsEnabled') : t('settings.notificationsDisabled')
    );
  };

  return (
    <div>
      <TopBar title={t('settings.title')} subtitle={t('settings.managePreferences')} />

      <div className="space-y-4">
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentTheme === 'dark' ? (
                <Moon className="text-[var(--muted)]" size={20} />
              ) : (
                <Sun className="text-[var(--muted)]" size={20} />
              )}
              <div>
                <h3 className="font-semibold text-[var(--text)]">{t('settings.theme')}</h3>
                <p className="text-sm text-[var(--muted2)]">{t('settings.light')} / {t('settings.dark')} {t('settings.system').toLowerCase()}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleThemeToggle}>
              {currentTheme === 'dark' ? t('settings.dark') : t('settings.light')}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Languages className="text-[var(--muted)]" size={20} />
              <div>
                <h3 className="font-semibold text-[var(--text)]">{t('settings.language')}</h3>
                <p className="text-sm text-[var(--muted2)]">{t('settings.russian')} / {t('settings.english')}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setLocale(locale === 'ru' ? 'en' : 'ru')}>
              {locale === 'ru' ? t('settings.russian') : t('settings.english')}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="text-[var(--muted)]" size={20} />
              <div>
                <h3 className="font-semibold text-[var(--text)]">{t('settings.notifications')}</h3>
                <p className="text-sm text-[var(--muted2)]">{t('settings.enableNotifications')}</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isNotificationsEnabled}
              onChange={handleNotificationsToggle}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
        </Card>

        {lowStockItems.length > 0 && (
          <Card className="border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-[var(--danger)] flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <h3 className="font-semibold text-[var(--danger)] mb-2">
                  {t('settings.lowStockAlert')}
                </h3>
                <div className="space-y-1">
                  {lowStockItems.map(inv => {
                    const item = items.find(i => i.id === inv.itemId);
                    return (
                      <p key={inv.itemId} className="text-sm text-[var(--text)]">
                        {item?.name}: {inv.remainingUnits} {inv.unitLabel} {t('settings.remaining')}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="text-[var(--muted)]" size={20} />
              <div>
                <h3 className="font-semibold text-[var(--text)]">{t('settings.demoData')}</h3>
                <p className="text-sm text-[var(--muted2)]">{t('settings.loadSample')}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                if (confirm(t('settings.demoDataConfirm'))) {
                  loadDemoData();
                  toast.success(t('settings.demoDataLoaded'));
                  // Обновляем страницу для отображения новых данных
                  setTimeout(() => window.location.reload(), 500);
                }
              }}
            >
              {t('settings.load')}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="text-sm text-[var(--muted2)]">
            <p className="font-semibold text-[var(--text)] mb-2">{t('settings.medicalDisclaimer')}</p>
            <p>
              {t('settings.disclaimerText')}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

