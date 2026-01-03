/**
 * Notification Hook
 * Handles browser notification permissions and scheduling
 */

import { useState, useEffect, useCallback } from 'react';

export type NotificationPermission = 'default' | 'granted' | 'denied';

export interface NotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  isServiceWorkerReady: boolean;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: Date;
  doseId: string;
  itemId: string;
}

const NOTIFICATION_SETTINGS_KEY = 'capsula_notification_settings';

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  reminderBeforeMinutes: number; // 0 = at scheduled time, 5 = 5 min before, etc.
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  sound: true,
  vibration: true,
  reminderBeforeMinutes: 0,
};

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    permission: 'default',
    isSupported: false,
    isServiceWorkerReady: false,
  });
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    // Check support
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    
    // Load settings
    try {
      const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {}

    if (isSupported) {
      setState(prev => ({
        ...prev,
        isSupported: true,
        permission: Notification.permission as NotificationPermission,
      }));

      // Register service worker
      navigator.serviceWorker.register('/capsula/sw.js')
        .then(() => {
          setState(prev => ({ ...prev, isServiceWorkerReady: true }));
        })
        .catch(err => {
          console.warn('Service worker registration failed:', err);
        });
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission: permission as NotificationPermission }));
      return permission === 'granted';
    } catch (err) {
      console.error('Failed to request notification permission:', err);
      return false;
    }
  }, [state.isSupported]);

  const updateSettings = useCallback((updates: Partial<NotificationSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(newSettings));
  }, [settings]);

  const scheduleNotification = useCallback(async (notification: ScheduledNotification) => {
    if (!state.isSupported || state.permission !== 'granted' || !settings.enabled) {
      return false;
    }

    const delay = notification.scheduledTime.getTime() - Date.now() - (settings.reminderBeforeMinutes * 60 * 1000);
    
    if (delay <= 0) {
      // Time has passed, show immediately
      showNotification(notification.title, notification.body, notification.doseId, notification.itemId);
      return true;
    }

    // Use service worker for scheduled notifications
    if (state.isServiceWorkerReady) {
      const registration = await navigator.serviceWorker.ready;
      registration.active?.postMessage({
        type: 'SCHEDULE_NOTIFICATION',
        delay,
        title: notification.title,
        body: notification.body,
        doseId: notification.doseId,
        itemId: notification.itemId,
      });
      return true;
    }

    // Fallback: use setTimeout (won't work if tab is closed)
    setTimeout(() => {
      showNotification(notification.title, notification.body, notification.doseId, notification.itemId);
    }, delay);
    
    return true;
  }, [state, settings]);

  const showNotification = useCallback((
    title: string,
    body: string,
    doseId: string,
    _itemId?: string
  ) => {
    if (!state.isSupported || state.permission !== 'granted') return;

    const notification = new Notification(title, {
      body,
      icon: '/capsula/icons/icon-192x192.png',
      badge: '/capsula/icons/icon-72x72.png',
      tag: `dose-${doseId}`,
      requireInteraction: true,
      silent: !settings.sound,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      // Navigate to today page if not already there
      if (!window.location.pathname.includes('/today')) {
        window.location.href = '/capsula/today';
      }
    };
  }, [state, settings]);

  const cancelAllNotifications = useCallback(async () => {
    if (state.isServiceWorkerReady) {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications();
      notifications.forEach(n => n.close());
    }
  }, [state.isServiceWorkerReady]);

  const getNotificationStatus = useCallback(() => {
    if (!state.isSupported) {
      return {
        available: false,
        reason: 'not_supported' as const,
        message: 'Уведомления не поддерживаются в этом браузере',
      };
    }

    if (state.permission === 'denied') {
      return {
        available: false,
        reason: 'denied' as const,
        message: 'Уведомления заблокированы. Разрешите в настройках браузера.',
      };
    }

    if (state.permission === 'default') {
      return {
        available: false,
        reason: 'not_requested' as const,
        message: 'Разрешите уведомления для напоминаний о приеме',
      };
    }

    if (!settings.enabled) {
      return {
        available: false,
        reason: 'disabled' as const,
        message: 'Уведомления отключены в настройках',
      };
    }

    return {
      available: true,
      reason: 'ready' as const,
      message: 'Уведомления включены',
    };
  }, [state, settings]);

  return {
    ...state,
    settings,
    updateSettings,
    requestPermission,
    scheduleNotification,
    showNotification,
    cancelAllNotifications,
    getNotificationStatus,
  };
}

