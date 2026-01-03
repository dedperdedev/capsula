import { useState, useEffect, useRef } from 'react';
import { Moon, Sun, AlertTriangle, Languages, Database, Download, Upload, Trash2, Printer, Bell } from 'lucide-react';
import { TopBar } from '../components/shared/TopBar';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { Modal } from '../components/shared/Modal';
import { itemsStore, inventoryStore } from '../data/store';
import { getTheme, setTheme, ensureThemeApplied } from '../lib/theme';
import { toast } from '../components/shared/Toast';
import { useI18n, setLocale } from '../hooks/useI18n';
import { loadDemoData } from '../data/seedData';
import { downloadBackup, validateBackup, importData, resetAllData, printReport, type BackupPreview } from '../data/backup';
import { loadAppState } from '../data/storage';
import { useNotifications, getNotificationLimitations } from '../hooks/useNotifications';

const NOTIFICATIONS_KEY = 'capsula_notifications_enabled';

export function SettingsPage() {
  const { locale, t } = useI18n();
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(getTheme());
  const [importPreview, setImportPreview] = useState<BackupPreview | null>(null);
  const [importFile, setImportFile] = useState<any>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(NOTIFICATIONS_KEY) === 'true';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { permission, isSupported, requestPermission, isPWA } = useNotifications();
  const limitations = getNotificationLimitations();

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

  const handleNotificationsToggle = async () => {
    if (!isSupported) {
      toast.error(locale === 'ru' ? 'Уведомления не поддерживаются' : 'Notifications not supported');
      return;
    }

    if (permission === 'denied') {
      toast.error(locale === 'ru' ? 'Уведомления заблокированы в настройках браузера' : 'Notifications blocked in browser settings');
      return;
    }

    if (permission === 'default') {
      const granted = await requestPermission();
      if (granted) {
        setIsNotificationsEnabled(true);
        localStorage.setItem(NOTIFICATIONS_KEY, 'true');
        toast.success(locale === 'ru' ? 'Уведомления включены' : 'Notifications enabled');
      } else {
        toast.error(locale === 'ru' ? 'Разрешение отклонено' : 'Permission denied');
      }
    } else {
      const newState = !isNotificationsEnabled;
      setIsNotificationsEnabled(newState);
      localStorage.setItem(NOTIFICATIONS_KEY, String(newState));
      toast.success(
        newState 
          ? (locale === 'ru' ? 'Уведомления включены' : 'Notifications enabled')
          : (locale === 'ru' ? 'Уведомления отключены' : 'Notifications disabled')
      );
    }
  };

  const handleExport = () => {
    try {
      downloadBackup();
      toast.success(locale === 'ru' ? 'Резервная копия скачана' : 'Backup downloaded');
    } catch (error) {
      toast.error(locale === 'ru' ? 'Ошибка экспорта' : 'Export error');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const validation = validateBackup(data);
      
      if (!validation.valid) {
        toast.error(validation.error || (locale === 'ru' ? 'Неверный формат файла' : 'Invalid file format'));
        return;
      }

      setImportPreview(validation.preview || null);
      setImportFile(data);
      setIsImportModalOpen(true);
    } catch (error) {
      toast.error(locale === 'ru' ? 'Не удалось прочитать файл' : 'Failed to read file');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportConfirm = () => {
    if (!importFile) return;

    const result = importData(importFile);
    if (result.success) {
      toast.success(locale === 'ru' ? 'Данные успешно импортированы' : 'Data imported successfully');
      setIsImportModalOpen(false);
      setImportPreview(null);
      setImportFile(null);
      setTimeout(() => window.location.reload(), 500);
    } else {
      toast.error(result.error || (locale === 'ru' ? 'Ошибка импорта' : 'Import error'));
    }
  };

  const handleResetConfirm = () => {
    if (resetConfirmText !== 'DELETE') {
      toast.error(locale === 'ru' ? 'Введите DELETE для подтверждения' : 'Type DELETE to confirm');
      return;
    }

    resetAllData();
    toast.success(locale === 'ru' ? 'Все данные удалены' : 'All data reset');
    setIsResetModalOpen(false);
    setResetConfirmText('');
    setTimeout(() => window.location.reload(), 500);
  };

  const handlePrintReport = () => {
    const state = loadAppState();
    if (state.activeProfileId) {
      printReport(state.activeProfileId, 30);
    } else {
      toast.error(locale === 'ru' ? 'Нет активного профиля' : 'No active profile');
    }
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

        {/* Notifications */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className={`${isNotificationsEnabled && permission === 'granted' ? 'text-green-500' : 'text-[var(--muted)]'}`} size={20} />
              <div>
                <h3 className="font-semibold text-[var(--text)]">{t('settings.notifications')}</h3>
                <p className="text-sm text-[var(--muted2)]">
                  {!isSupported 
                    ? (locale === 'ru' ? 'Не поддерживается' : 'Not supported')
                    : permission === 'denied'
                    ? (locale === 'ru' ? 'Заблокировано в браузере' : 'Blocked in browser')
                    : permission === 'granted' && isNotificationsEnabled
                    ? (locale === 'ru' ? 'Включены' : 'Enabled')
                    : (locale === 'ru' ? 'Отключены' : 'Disabled')}
                </p>
              </div>
            </div>
            {isSupported && permission !== 'denied' && (
              <Button 
                variant={isNotificationsEnabled && permission === 'granted' ? 'primary' : 'ghost'} 
                size="sm" 
                onClick={handleNotificationsToggle}
              >
                {permission === 'default' 
                  ? (locale === 'ru' ? 'Включить' : 'Enable')
                  : isNotificationsEnabled 
                    ? (locale === 'ru' ? 'Вкл' : 'On')
                    : (locale === 'ru' ? 'Выкл' : 'Off')}
              </Button>
            )}
          </div>

          {/* Limitations info */}
          {limitations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--stroke)]">
              <p className="text-xs text-[var(--muted2)] mb-1">
                {locale === 'ru' ? 'Ограничения:' : 'Limitations:'}
              </p>
              <ul className="text-xs text-amber-500 space-y-1">
                {limitations.slice(0, 2).map((lim, i) => (
                  <li key={i}>• {lim}</li>
                ))}
              </ul>
            </div>
          )}

          {/* PWA Install hint */}
          {isSupported && !isPWA && (
            <div className="mt-3 pt-3 border-t border-[var(--stroke)]">
              <p className="text-xs text-[var(--muted2)]">
                💡 {locale === 'ru' 
                  ? 'Установите приложение на домашний экран для надежных уведомлений'
                  : 'Install the app to your home screen for reliable notifications'}
              </p>
            </div>
          )}
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

        {/* Backup Section */}
        <Card>
          <h3 className="font-semibold text-[var(--text)] mb-4">
            {locale === 'ru' ? 'Резервное копирование' : 'Backup & Restore'}
          </h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleExport} fullWidth>
                <Download size={16} className="mr-2" />
                {locale === 'ru' ? 'Экспорт' : 'Export'}
              </Button>
              <Button variant="ghost" onClick={handleImportClick} fullWidth>
                <Upload size={16} className="mr-2" />
                {locale === 'ru' ? 'Импорт' : 'Import'}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handlePrintReport} fullWidth>
                <Printer size={16} className="mr-2" />
                {locale === 'ru' ? 'Печать отчета' : 'Print Report'}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-800">
          <h3 className="font-semibold text-[var(--danger)] mb-4">
            {locale === 'ru' ? 'Опасная зона' : 'Danger Zone'}
          </h3>
          <Button 
            variant="danger" 
            onClick={() => setIsResetModalOpen(true)}
            fullWidth
          >
            <Trash2 size={16} className="mr-2" />
            {locale === 'ru' ? 'Сбросить все данные' : 'Reset All Data'}
          </Button>
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

      {/* Import Preview Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportPreview(null);
          setImportFile(null);
        }}
        title={locale === 'ru' ? 'Импорт данных' : 'Import Data'}
        size="md"
      >
        {importPreview && (
          <div className="space-y-4">
            <div className="bg-[var(--surface2)] rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted2)]">{locale === 'ru' ? 'Дата экспорта' : 'Export date'}:</span>
                <span className="text-[var(--text)]">{new Date(importPreview.exportDate).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted2)]">{locale === 'ru' ? 'Профилей' : 'Profiles'}:</span>
                <span className="text-[var(--text)]">{importPreview.profileCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted2)]">{locale === 'ru' ? 'Препаратов' : 'Medications'}:</span>
                <span className="text-[var(--text)]">{importPreview.medicationCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted2)]">{locale === 'ru' ? 'Расписаний' : 'Schedules'}:</span>
                <span className="text-[var(--text)]">{importPreview.scheduleCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--muted2)]">{locale === 'ru' ? 'Событий' : 'Events'}:</span>
                <span className="text-[var(--text)]">{importPreview.eventCount}</span>
              </div>
            </div>
            <p className="text-sm text-[var(--danger)]">
              {locale === 'ru' 
                ? 'Внимание: импорт заменит все текущие данные!' 
                : 'Warning: Import will replace all current data!'}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsImportModalOpen(false)} fullWidth>
                {locale === 'ru' ? 'Отмена' : 'Cancel'}
              </Button>
              <Button variant="primary" onClick={handleImportConfirm} fullWidth>
                {locale === 'ru' ? 'Импортировать' : 'Import'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => {
          setIsResetModalOpen(false);
          setResetConfirmText('');
        }}
        title={locale === 'ru' ? 'Сброс данных' : 'Reset Data'}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text)]">
            {locale === 'ru' 
              ? 'Это действие удалит все данные приложения. Для подтверждения введите DELETE:' 
              : 'This will delete all app data. Type DELETE to confirm:'}
          </p>
          <input
            type="text"
            value={resetConfirmText}
            onChange={(e) => setResetConfirmText(e.target.value)}
            placeholder="DELETE"
            className="w-full px-4 py-2 border border-[var(--stroke)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--danger)]"
          />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setIsResetModalOpen(false)} fullWidth>
              {locale === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
            <Button 
              variant="danger" 
              onClick={handleResetConfirm} 
              fullWidth
              disabled={resetConfirmText !== 'DELETE'}
            >
              {locale === 'ru' ? 'Удалить все' : 'Delete All'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

