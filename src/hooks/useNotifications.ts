/**
 * Push Notifications Hook
 * Manages notification permissions and scheduling
 */

import { useState, useEffect, useCallback } from 'react';
import { loadAppState } from '../data/storage';
import type { DoseInstance } from '../data/todayDoses';

export interface NotificationState {
  permission: NotificationPermission | 'unsupported';
  isSupported: boolean;
  isPWA: boolean;
  canSchedule: boolean;
}

export function useNotifications() {
  const [state, setState] = useState<NotificationState>({
    permission: 'default',
    isSupported: false,
    isPWA: false,
    canSchedule: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // More strict check: verify Notification actually exists
    let isSupported = false;
    try {
      isSupported = typeof window !== 'undefined' && 
                   'Notification' in window && 
                   typeof (window as any).Notification !== 'undefined' &&
                   'serviceWorker' in navigator;
    } catch {
      isSupported = false;
    }

    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  (window.navigator as any).standalone === true;
    
    let permission: NotificationPermission | 'unsupported' = 'unsupported';
    let canSchedule = false;
    
    if (isSupported) {
      try {
        const NotificationClass = (window as any).Notification;
        if (NotificationClass && typeof NotificationClass.permission !== 'undefined') {
          permission = NotificationClass.permission;
          canSchedule = 'showTrigger' in (NotificationClass.prototype as any);
        }
      } catch (error) {
        console.warn('Error accessing Notification API:', error);
        permission = 'unsupported';
        isSupported = false;
      }
    }

    setState({
      permission,
      isSupported,
      isPWA,
      canSchedule,
    });
  }, []);

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || typeof window === 'undefined') {
      console.log('Notifications not supported');
      return false;
    }

    try {
      const NotificationClass = (window as any).Notification;
      if (!NotificationClass || typeof NotificationClass.requestPermission !== 'function') {
        return false;
      }
      const permission = await NotificationClass.requestPermission();
      setState(prev => ({ ...prev, permission }));
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [state.isSupported]);

  /**
   * Show an immediate notification
   */
  const showNotification = useCallback(async (
    title: string,
    options?: NotificationOptions & { data?: Record<string, unknown>; actions?: { action: string; title: string }[] }
  ): Promise<boolean> => {
    if (!state.isSupported || state.permission !== 'granted') {
      console.log('Cannot show notification: not permitted');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/capsula/icon-192.png',
        badge: '/capsula/icon-192.png',
        requireInteraction: true,
        ...options,
      } as NotificationOptions);
      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }, [state.isSupported, state.permission]);

  /**
   * Schedule a dose reminder notification
   */
  const scheduleDoseReminder = useCallback(async (
    dose: DoseInstance,
    minutesBefore: number = 0
  ): Promise<boolean> => {
    if (!state.isSupported || state.permission !== 'granted') {
      return false;
    }

    const appState = loadAppState();
    const settings = appState.settings;

    // Check quiet hours
    if (settings.quietHoursStart && settings.quietHoursEnd) {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = settings.quietHoursStart.split(':').map(Number);
      const [endH, endM] = settings.quietHoursEnd.split(':').map(Number);
      const quietStart = startH * 60 + startM;
      const quietEnd = endH * 60 + endM;

      if (quietStart <= currentTime && currentTime <= quietEnd) {
        console.log('In quiet hours, skipping notification');
        return false;
      }
    }

    const [hours, minutes] = dose.time.split(':').map(Number);
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes - minutesBefore, 0, 0);

    // If time is in the past, don't schedule
    if (scheduledTime <= new Date()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Use scheduled notifications if supported (Chrome only for now)
      if (state.canSchedule) {
        await registration.showNotification(`Время принять ${dose.name}`, {
          body: `${dose.doseText}${minutesBefore > 0 ? ` (через ${minutesBefore} мин)` : ''}`,
          icon: '/capsula/icon-192.png',
          badge: '/capsula/icon-192.png',
          tag: `dose-${dose.id}`,
          requireInteraction: true,
          data: {
            doseId: dose.id,
            itemId: dose.itemId,
            scheduleId: dose.scheduleId,
            scheduledTime: scheduledTime.toISOString(),
          },
          // @ts-expect-error - showTrigger is experimental
          showTrigger: new TimestampTrigger(scheduledTime.getTime()),
        } as NotificationOptions);
        return true;
      }

      // Fallback: use setTimeout for scheduling (only works while app is open)
      const delay = scheduledTime.getTime() - Date.now();
      if (delay > 0) {
        setTimeout(() => {
          showNotification(`Время принять ${dose.name}`, {
            body: dose.doseText,
            tag: `dose-${dose.id}`,
            data: {
              doseId: dose.id,
              itemId: dose.itemId,
              scheduleId: dose.scheduleId,
            },
          });
        }, delay);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return false;
    }
  }, [state.isSupported, state.permission, state.canSchedule, showNotification]);

  /**
   * Cancel all pending notifications for a dose
   */
  const cancelDoseReminder = useCallback(async (doseId: string): Promise<void> => {
    if (!state.isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications({ tag: `dose-${doseId}` });
      notifications.forEach(n => n.close());
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }, [state.isSupported]);

  /**
   * Get pending notifications
   */
  const getPendingNotifications = useCallback(async (): Promise<Notification[]> => {
    if (!state.isSupported) return [];

    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.getNotifications();
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }, [state.isSupported]);

  return {
    ...state,
    requestPermission,
    showNotification,
    scheduleDoseReminder,
    cancelDoseReminder,
    getPendingNotifications,
  };
}

/**
 * Helper to check if we're running as PWA
 */
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}

/**
 * Helper to check notification support limitations
 */
export function getNotificationLimitations(): string[] {
  const limitations: string[] = [];

  if (typeof window === 'undefined' || !('Notification' in window) || typeof Notification === 'undefined') {
    limitations.push('Уведомления не поддерживаются в этом браузере');
  }

  if (!('serviceWorker' in navigator)) {
    limitations.push('Service Worker не поддерживается');
  }

  if (!isPWA()) {
    limitations.push('Для надежных уведомлений установите приложение на главный экран');
  }

  if (typeof Notification === 'undefined' || !('showTrigger' in (Notification.prototype as any))) {
    limitations.push('Запланированные уведомления не поддерживаются - уведомления работают только при открытом приложении');
  }

  return limitations;
}
