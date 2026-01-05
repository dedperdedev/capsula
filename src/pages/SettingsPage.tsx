import { useState, useEffect, useRef } from 'react';
import { Moon, Sun, AlertTriangle, Languages, Database, Upload, Trash2, Printer, Bell, Shield, Lock, Package, FileText, Calendar, FileJson, Users, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { loadAppState, saveAppState } from '../data/storage';
import { useNotifications, getNotificationLimitations } from '../hooks/useNotifications';
import { downloadCSV, downloadICS } from '../lib/exports';
import { isPinEnabled, setPin, removePin, verifyPin } from '../lib/appLock';
import { NotificationDiagnostics } from '../components/NotificationDiagnostics';
import { getCurrentTimezone, detectTimezoneChange, handleTimezoneChange, getTimezoneOptions } from '../lib/timezone';
import { Clock, Globe } from 'lucide-react';

const NOTIFICATIONS_KEY = 'capsula_notifications_enabled';

export function SettingsPage() {
  const { locale, t } = useI18n();
  const navigate = useNavigate();
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
  const [pinValue, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [currentPinForChange, setCurrentPinForChange] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const state = loadAppState();
  const [guardianMode, setGuardianMode] = useState(state.profiles.find(p => p.id === state.activeProfileId)?.guardianModeEnabled || false);
  const [refillReminders, setRefillReminders] = useState(state.settings.refillRemindersEnabled ?? true);
  const [refillThreshold, setRefillThreshold] = useState(state.settings.refillThresholdDays || 3);
  const [appLockEnabled, setAppLockEnabled] = useState(isPinEnabled());
  
  // Routine anchors
  const [wakeTime, setWakeTime] = useState(state.settings.wakeTime || '07:00');
  const [breakfastTime, setBreakfastTime] = useState(state.settings.breakfastTime || '08:00');
  const [lunchTime, setLunchTime] = useState(state.settings.lunchTime || '13:00');
  const [dinnerTime, setDinnerTime] = useState(state.settings.dinnerTime || '19:00');
  const [bedTime, setBedTime] = useState(state.settings.bedTime || '22:00');
  
  // Travel mode
  const [travelMode, setTravelMode] = useState(state.settings.travelModeEnabled || false);
  const [timezone, setTimezone] = useState(state.settings.timezone || getCurrentTimezone().timezone);
  const [timezoneChange, setTimezoneChange] = useState<{ changed: boolean; message: { ru: string; en: string } } | null>(null);
  
  const { permission, isSupported, requestPermission, isPWA } = useNotifications();
  const limitations = getNotificationLimitations();

  useEffect(() => {
    ensureThemeApplied();
    
    // Check for timezone changes
    if (state.activeProfileId) {
      const detection = detectTimezoneChange(state.activeProfileId);
      if (detection.changed) {
        setTimezoneChange(detection);
      }
    }
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

        {/* Family Overview */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="text-[var(--primary)]" size={20} />
              <div>
                <h3 className="font-semibold text-[var(--text)]">
                  {locale === 'ru' ? 'Обзор семьи' : 'Family Overview'}
                </h3>
                <p className="text-sm text-[var(--muted2)]">
                  {locale === 'ru' 
                    ? 'Статус всех профилей'
                    : 'Status of all profiles'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/family')}
            >
              {locale === 'ru' ? 'Открыть' : 'Open'}
            </Button>
          </div>
        </Card>

        {/* Shopping List */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingCart className="text-[var(--primary)]" size={20} />
              <div>
                <h3 className="font-semibold text-[var(--text)]">
                  {locale === 'ru' ? 'Список покупок' : 'Shopping List'}
                </h3>
                <p className="text-sm text-[var(--muted2)]">
                  {locale === 'ru' 
                    ? 'Препараты для пополнения'
                    : 'Medications to refill'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/shopping')}
            >
              {locale === 'ru' ? 'Открыть' : 'Open'}
            </Button>
          </div>
        </Card>

        {/* Notification Diagnostics */}
        <NotificationDiagnostics />

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

        {/* Guardian Mode */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="text-[var(--primary)]" size={20} />
              <div>
                <h3 className="font-semibold text-[var(--text)]">
                  {locale === 'ru' ? 'Режим опекуна' : 'Guardian Mode'}
                </h3>
                <p className="text-sm text-[var(--muted2)]">
                  {locale === 'ru' ? 'Уведомления о пропущенных приемах' : 'Missed dose alerts'}
                </p>
              </div>
            </div>
            <Button
              variant={guardianMode ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => {
                const newState = !guardianMode;
                setGuardianMode(newState);
                const updatedState = loadAppState();
                const profile = updatedState.profiles.find(p => p.id === updatedState.activeProfileId);
                if (profile) {
                  profile.guardianModeEnabled = newState;
                  saveAppState(updatedState);
                }
                toast.success(newState 
                  ? (locale === 'ru' ? 'Режим опекуна включен' : 'Guardian mode enabled')
                  : (locale === 'ru' ? 'Режим опекуна выключен' : 'Guardian mode disabled')
                );
              }}
            >
              {guardianMode ? (locale === 'ru' ? 'Вкл' : 'On') : (locale === 'ru' ? 'Выкл' : 'Off')}
            </Button>
          </div>
        </Card>

        {/* Refill Reminders */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Package className="text-amber-500" size={20} />
              <div>
                <h3 className="font-semibold text-[var(--text)]">
                  {locale === 'ru' ? 'Напоминания о пополнении' : 'Refill Reminders'}
                </h3>
                <p className="text-sm text-[var(--muted2)]">
                  {locale === 'ru' ? 'Автоматические уведомления о низком запасе' : 'Automatic low stock alerts'}
                </p>
              </div>
            </div>
            <Button
              variant={refillReminders ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => {
                const newState = !refillReminders;
                setRefillReminders(newState);
                const updatedState = loadAppState();
                updatedState.settings.refillRemindersEnabled = newState;
                saveAppState(updatedState);
                toast.success(newState 
                  ? (locale === 'ru' ? 'Напоминания включены' : 'Reminders enabled')
                  : (locale === 'ru' ? 'Напоминания выключены' : 'Reminders disabled')
                );
              }}
            >
              {refillReminders ? (locale === 'ru' ? 'Вкл' : 'On') : (locale === 'ru' ? 'Выкл' : 'Off')}
            </Button>
          </div>
          {refillReminders && (
            <div className="mt-3 pt-3 border-t border-[var(--stroke)]">
              <label className="block text-sm text-[var(--muted)] mb-2">
                {locale === 'ru' ? 'Порог (дней до окончания)' : 'Threshold (days before running out)'}
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={refillThreshold}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 3;
                  setRefillThreshold(val);
                  const updatedState = loadAppState();
                  updatedState.settings.refillThresholdDays = val;
                  saveAppState(updatedState);
                }}
                className="w-full bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-2 border border-[var(--border)]"
              />
            </div>
          )}
        </Card>

        {/* Routine Anchors */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Clock className="text-[var(--primary)]" size={20} />
            <div>
              <h3 className="font-semibold text-[var(--text)]">
                {locale === 'ru' ? 'Якоря распорядка' : 'Routine Anchors'}
              </h3>
              <p className="text-sm text-[var(--muted2)]">
                {locale === 'ru' 
                  ? 'Настройте время для привязки расписаний'
                  : 'Set times for schedule anchoring'}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">
                {locale === 'ru' ? 'Пробуждение' : 'Wake Time'}
              </label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => {
                  setWakeTime(e.target.value);
                  const updatedState = loadAppState();
                  updatedState.settings.wakeTime = e.target.value;
                  saveAppState(updatedState);
                }}
                className="w-full bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-2 border border-[var(--border)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">
                {locale === 'ru' ? 'Завтрак' : 'Breakfast'}
              </label>
              <input
                type="time"
                value={breakfastTime}
                onChange={(e) => {
                  setBreakfastTime(e.target.value);
                  const updatedState = loadAppState();
                  updatedState.settings.breakfastTime = e.target.value;
                  saveAppState(updatedState);
                }}
                className="w-full bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-2 border border-[var(--border)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">
                {locale === 'ru' ? 'Обед' : 'Lunch'}
              </label>
              <input
                type="time"
                value={lunchTime}
                onChange={(e) => {
                  setLunchTime(e.target.value);
                  const updatedState = loadAppState();
                  updatedState.settings.lunchTime = e.target.value;
                  saveAppState(updatedState);
                }}
                className="w-full bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-2 border border-[var(--border)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">
                {locale === 'ru' ? 'Ужин' : 'Dinner'}
              </label>
              <input
                type="time"
                value={dinnerTime}
                onChange={(e) => {
                  setDinnerTime(e.target.value);
                  const updatedState = loadAppState();
                  updatedState.settings.dinnerTime = e.target.value;
                  saveAppState(updatedState);
                }}
                className="w-full bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-2 border border-[var(--border)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">
                {locale === 'ru' ? 'Сон' : 'Bed Time'}
              </label>
              <input
                type="time"
                value={bedTime}
                onChange={(e) => {
                  setBedTime(e.target.value);
                  const updatedState = loadAppState();
                  updatedState.settings.bedTime = e.target.value;
                  saveAppState(updatedState);
                }}
                className="w-full bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-2 border border-[var(--border)]"
              />
            </div>
          </div>
        </Card>

        {/* Travel Mode / Timezone */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Globe className="text-[var(--primary)]" size={20} />
            <div>
              <h3 className="font-semibold text-[var(--text)]">
                {locale === 'ru' ? 'Часовой пояс' : 'Timezone'}
              </h3>
              <p className="text-sm text-[var(--muted2)]">
                {locale === 'ru' 
                  ? 'Управление временными зонами и путешествиями'
                  : 'Manage timezones and travel'}
              </p>
            </div>
          </div>
          
          {timezoneChange?.changed && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-500 mb-2">
                {timezoneChange.message[locale]}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (state.activeProfileId) {
                      handleTimezoneChange(state.activeProfileId, 'update_to_new');
                      setTimezoneChange(null);
                      toast.success(locale === 'ru' ? 'Часовой пояс обновлен' : 'Timezone updated');
                    }
                  }}
                >
                  {locale === 'ru' ? 'Обновить' : 'Update'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (state.activeProfileId) {
                      handleTimezoneChange(state.activeProfileId, 'travel_mode');
                      setTimezoneChange(null);
                      toast.success(locale === 'ru' ? 'Режим путешествий включен' : 'Travel mode enabled');
                    }
                  }}
                >
                  {locale === 'ru' ? 'Режим путешествий' : 'Travel Mode'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTimezoneChange(null)}
                >
                  {locale === 'ru' ? 'Игнорировать' : 'Ignore'}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">
                {locale === 'ru' ? 'Часовой пояс' : 'Timezone'}
              </label>
              <select
                value={timezone}
                onChange={(e) => {
                  setTimezone(e.target.value);
                  const updatedState = loadAppState();
                  updatedState.settings.timezone = e.target.value;
                  saveAppState(updatedState);
                }}
                className="w-full bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-2 border border-[var(--border)]"
              >
                {getTimezoneOptions().map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label} ({tz.offset})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text)]">
                  {locale === 'ru' ? 'Режим путешествий' : 'Travel Mode'}
                </p>
                <p className="text-xs text-[var(--muted2)]">
                  {locale === 'ru' 
                    ? 'Сохранить исходный часовой пояс'
                    : 'Keep original timezone'}
                </p>
              </div>
              <button
                onClick={() => {
                  const newValue = !travelMode;
                  setTravelMode(newValue);
                  const updatedState = loadAppState();
                  updatedState.settings.travelModeEnabled = newValue;
                  saveAppState(updatedState);
                }}
                className={`w-12 h-6 rounded-full transition-colors ${
                  travelMode ? 'bg-[var(--primary)]' : 'bg-[var(--surface2)]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  travelMode ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
            <p className="text-xs text-[var(--muted2)]">
              {locale === 'ru' 
                ? 'Текущий часовой пояс: ' + getCurrentTimezone().timezone
                : 'Current timezone: ' + getCurrentTimezone().timezone}
            </p>
          </div>
        </Card>

        {/* App Lock */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Lock className="text-[var(--primary)]" size={20} />
              <div>
                <h3 className="font-semibold text-[var(--text)]">
                  {locale === 'ru' ? 'Блокировка приложения' : 'App Lock'}
                </h3>
                <p className="text-sm text-[var(--muted2)]">
                  {appLockEnabled 
                    ? (locale === 'ru' ? 'PIN-код установлен' : 'PIN code set')
                    : (locale === 'ru' ? 'Защита PIN-кодом' : 'PIN protection')}
                </p>
              </div>
            </div>
            <Button
              variant={appLockEnabled ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => {
                if (appLockEnabled) {
                  setShowChangePinModal(true);
                } else {
                  setShowPinModal(true);
                }
              }}
            >
              {appLockEnabled 
                ? (locale === 'ru' ? 'Изменить PIN' : 'Change PIN')
                : (locale === 'ru' ? 'Установить PIN' : 'Set PIN')}
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
                <FileJson size={16} className="mr-2" />
                {locale === 'ru' ? 'JSON' : 'JSON'}
              </Button>
              <Button variant="ghost" onClick={() => downloadCSV()} fullWidth>
                <FileText size={16} className="mr-2" />
                CSV
              </Button>
              <Button variant="ghost" onClick={() => downloadICS('capsula-schedule.ics', 30)} fullWidth>
                <Calendar size={16} className="mr-2" />
                ICS
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleImportClick} fullWidth>
                <Upload size={16} className="mr-2" />
                {locale === 'ru' ? 'Импорт' : 'Import'}
              </Button>
              <Button variant="ghost" onClick={handlePrintReport} fullWidth>
                <Printer size={16} className="mr-2" />
                {locale === 'ru' ? 'Печать' : 'Print'}
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

      {/* Set PIN Modal */}
      <Modal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPinValue('');
          setPinConfirm('');
        }}
        title={locale === 'ru' ? 'Установить PIN-код' : 'Set PIN Code'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">
              {locale === 'ru' ? 'PIN-код (4 цифры)' : 'PIN Code (4 digits)'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-2 border border-[var(--border)] text-center text-2xl tracking-widest"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">
              {locale === 'ru' ? 'Подтвердите PIN-код' : 'Confirm PIN Code'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pinConfirm}
              onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-2 border border-[var(--border)] text-center text-2xl tracking-widest"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowPinModal(false);
                setPinValue('');
                setPinConfirm('');
              }}
              fullWidth
            >
              {locale === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (pinValue.length !== 4) {
                  toast.error(locale === 'ru' ? 'PIN должен содержать 4 цифры' : 'PIN must be 4 digits');
                  return;
                }
                if (pinValue !== pinConfirm) {
                  toast.error(locale === 'ru' ? 'PIN-коды не совпадают' : 'PIN codes do not match');
                  return;
                }
                const success = await setPin(pinValue);
                if (success) {
                  setAppLockEnabled(true);
                  setShowPinModal(false);
                  setPinValue('');
                  setPinConfirm('');
                  toast.success(locale === 'ru' ? 'PIN-код установлен' : 'PIN code set');
                } else {
                  toast.error(locale === 'ru' ? 'Ошибка установки PIN' : 'Failed to set PIN');
                }
              }}
              fullWidth
              disabled={pinValue.length !== 4 || pinValue !== pinConfirm}
            >
              {locale === 'ru' ? 'Установить' : 'Set'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change PIN Modal */}
      <Modal
        isOpen={showChangePinModal}
        onClose={() => {
          setShowChangePinModal(false);
          setCurrentPinForChange('');
          setPinValue('');
          setPinConfirm('');
        }}
        title={locale === 'ru' ? 'Изменить PIN-код' : 'Change PIN Code'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">
              {locale === 'ru' ? 'Текущий PIN-код' : 'Current PIN Code'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={currentPinForChange}
              onChange={(e) => setCurrentPinForChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-2 border border-[var(--border)] text-center text-2xl tracking-widest"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">
              {locale === 'ru' ? 'Новый PIN-код' : 'New PIN Code'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-2 border border-[var(--border)] text-center text-2xl tracking-widest"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">
              {locale === 'ru' ? 'Подтвердите новый PIN' : 'Confirm New PIN'}
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pinConfirm}
              onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="w-full bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-2 border border-[var(--border)] text-center text-2xl tracking-widest"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowChangePinModal(false);
                setCurrentPinForChange('');
                setPinValue('');
                setPinConfirm('');
              }}
              fullWidth
            >
              {locale === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (currentPinForChange.length !== 4 || pinValue.length !== 4) {
                  toast.error(locale === 'ru' ? 'PIN должен содержать 4 цифры' : 'PIN must be 4 digits');
                  return;
                }
                if (pinValue !== pinConfirm) {
                  toast.error(locale === 'ru' ? 'PIN-коды не совпадают' : 'PIN codes do not match');
                  return;
                }
                // Verify current PIN first
                const isValid = await verifyPin(currentPinForChange);
                if (!isValid) {
                  toast.error(locale === 'ru' ? 'Неверный текущий PIN' : 'Incorrect current PIN');
                  return;
                }
                // Remove old PIN and set new one
                await removePin(currentPinForChange);
                const success = await setPin(pinValue);
                if (success) {
                  setShowChangePinModal(false);
                  setCurrentPinForChange('');
                  setPinValue('');
                  setPinConfirm('');
                  toast.success(locale === 'ru' ? 'PIN-код изменен' : 'PIN code changed');
                } else {
                  toast.error(locale === 'ru' ? 'Ошибка изменения PIN' : 'Failed to change PIN');
                }
              }}
              fullWidth
              disabled={currentPinForChange.length !== 4 || pinValue.length !== 4 || pinValue !== pinConfirm}
            >
              {locale === 'ru' ? 'Изменить' : 'Change'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

