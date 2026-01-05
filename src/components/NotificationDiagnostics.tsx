/**
 * Notification Diagnostics Panel
 * Test notification permissions, delivery, and action buttons
 */

import { useState } from 'react';
import { Bell, CheckCircle2, XCircle, AlertCircle, Play } from 'lucide-react';
import { Card } from './shared/Card';
import { Button } from './shared/Button';
import { format } from 'date-fns';
import { useI18n } from '../hooks/useI18n';
import { useNotifications } from '../hooks/useNotifications';
import { isFeatureEnabled } from '../lib/featureFlags';

export function NotificationDiagnostics() {
  const { locale } = useI18n();
  const {
    permission,
    isSupported,
    canSchedule,
    requestPermission,
    showNotification,
  } = useNotifications();

  const [testResult, setTestResult] = useState<string | null>(null);
  const [testTime, setTestTime] = useState<Date | null>(null);

  if (!isFeatureEnabled('notificationDiagnostics')) {
    return null;
  }

  const handleTestNotification = async () => {
    try {
      await showNotification('Тест уведомления', {
        body: locale === 'ru' 
          ? 'Если вы видите это, уведомления работают!'
          : 'If you see this, notifications are working!',
        icon: '/capsula/icon-192.png',
        tag: 'test-notification',
        requireInteraction: true,
        actions: [
          {
            action: 'test-action',
            title: locale === 'ru' ? 'Тест' : 'Test',
          },
        ],
      });
      setTestResult('success');
      setTestTime(new Date());
    } catch (error) {
      setTestResult('error');
      setTestTime(new Date());
      console.error('Notification test failed:', error);
    }
  };

  const getStatusIcon = () => {
    if (!isSupported) return <XCircle size={20} className="text-red-500" />;
    if (permission === 'granted') return <CheckCircle2 size={20} className="text-green-500" />;
    if (permission === 'denied') return <XCircle size={20} className="text-red-500" />;
    return <AlertCircle size={20} className="text-amber-500" />;
  };

  const getStatusText = () => {
    if (!isSupported) {
      return locale === 'ru' ? 'Не поддерживается' : 'Not supported';
    }
    switch (permission) {
      case 'granted':
        return locale === 'ru' ? 'Разрешено' : 'Granted';
      case 'denied':
        return locale === 'ru' ? 'Заблокировано' : 'Denied';
      default:
        return locale === 'ru' ? 'Не запрошено' : 'Not requested';
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Bell size={20} className="text-[var(--primary)]" />
        <h3 className="text-lg font-bold text-[var(--text)]">
          {locale === 'ru' ? 'Диагностика уведомлений' : 'Notification Diagnostics'}
        </h3>
      </div>

      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between p-3 bg-[var(--surface2)] rounded-lg">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium text-[var(--text)]">
              {getStatusText()}
            </span>
          </div>
          {permission === 'default' && (
            <Button
              variant="primary"
              size="sm"
              onClick={requestPermission}
            >
              {locale === 'ru' ? 'Запросить' : 'Request'}
            </Button>
          )}
        </div>

        {/* Capabilities */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--muted)]">
              {locale === 'ru' ? 'Поддержка браузера' : 'Browser support'}
            </span>
            <span className={isSupported ? 'text-green-500' : 'text-red-500'}>
              {isSupported ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--muted)]">
              {locale === 'ru' ? 'Планирование' : 'Scheduling'}
            </span>
            <span className={canSchedule ? 'text-green-500' : 'text-amber-500'}>
              {canSchedule ? '✓' : '⚠'}
            </span>
          </div>
        </div>

        {/* Test button */}
        {permission === 'granted' && (
          <div>
            <Button
              variant="primary"
              fullWidth
              onClick={handleTestNotification}
            >
              <Play size={16} className="mr-2" />
              {locale === 'ru' ? 'Отправить тестовое уведомление' : 'Send Test Notification'}
            </Button>
            {testResult && testTime && (
              <p className={`text-sm mt-2 text-center ${
                testResult === 'success' ? 'text-green-500' : 'text-red-500'
              }`}>
                {testResult === 'success' 
                  ? (locale === 'ru' ? '✓ Успешно отправлено' : '✓ Sent successfully')
                  : (locale === 'ru' ? '✗ Ошибка отправки' : '✗ Send failed')
                } ({format(testTime, 'HH:mm:ss')})
              </p>
            )}
          </div>
        )}

        {/* Limitations */}
        <div className="pt-3 border-t border-[var(--stroke)]">
          <p className="text-xs text-[var(--muted2)] mb-2">
            {locale === 'ru' ? 'Ограничения:' : 'Limitations:'}
          </p>
          <ul className="text-xs text-amber-500 space-y-1">
            <li>• {locale === 'ru' ? 'Нет гарантированной доставки в фоне' : 'No guaranteed background delivery'}</li>
            <li>• {locale === 'ru' ? 'Браузер должен быть запущен' : 'Browser must be running'}</li>
            <li>• {locale === 'ru' ? 'iOS Safari имеет ограниченную поддержку' : 'iOS Safari has limited support'}</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}

