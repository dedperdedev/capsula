/**
 * Missed Dose Detection for Guardian Mode
 * Detects doses that are past their grace window + follow-up window and still not taken
 */

import { loadAppState, appendEvent, type Profile, type MissedDoseAlert } from '../../data/storage';
import { getTodayDoses } from '../../data/todayDoses';

export type { MissedDoseAlert };

const DEFAULT_FOLLOW_UP_WINDOW = 30; // minutes after grace window

export interface MissedDoseDetectionResult {
  alerts: MissedDoseAlert[];
  profile: Profile | null;
  isGuardianMode: boolean;
}

/**
 * Detect missed doses for the active profile
 */
export function detectMissedDoses(): MissedDoseDetectionResult {
  const state = loadAppState();
  const profile = state.profiles.find(p => p.id === state.activeProfileId) || null;
  
  if (!profile || !profile.guardianModeEnabled) {
    return { alerts: [], profile, isGuardianMode: false };
  }

  const now = new Date();
  const doses = getTodayDoses();
  const alerts: MissedDoseAlert[] = [];
  const followUpWindow = profile.guardianFollowUpWindow || DEFAULT_FOLLOW_UP_WINDOW;

  for (const dose of doses) {
    if (dose.isTaken || dose.isSkipped) continue;

    // Calculate if dose is missed
    const [hours, minutes] = dose.originalTime.split(':').map(Number);
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    const graceWindow = dose.graceWindowMinutes;
    const missedThreshold = new Date(scheduledTime.getTime() + (graceWindow + followUpWindow) * 60 * 1000);

    if (now > missedThreshold) {
      // This dose is missed
      const medication = state.medications.find(m => m.id === dose.itemId);
      
      alerts.push({
        id: `missed-${dose.id}-${now.toISOString()}`,
        profileId: profile.id,
        medicationId: dose.itemId,
        medicationName: medication?.name || dose.name,
        scheduledTime: scheduledTime.toISOString(),
        missedAt: now.toISOString(),
        acknowledged: false,
      });
    }
  }

  return { alerts, profile, isGuardianMode: true };
}

/**
 * Get pending (unacknowledged) missed dose alerts
 */
export function getPendingMissedAlerts(): MissedDoseAlert[] {
  const { alerts, isGuardianMode } = detectMissedDoses();
  
  if (!isGuardianMode) return [];
  
  // Filter out already acknowledged alerts (stored in events)
  const state = loadAppState();
  const acknowledgedIds = new Set(
    state.events
      .filter(e => e.type === 'GUARDIAN_ALERT_ACKNOWLEDGED')
      .map(e => e.metadata.alertId as string)
  );

  return alerts.filter(a => !acknowledgedIds.has(a.id));
}

/**
 * Acknowledge a missed dose alert
 */
export function acknowledgeMissedAlert(alertId: string): void {
  const state = loadAppState();
  
  appendEvent({
    profileId: state.activeProfileId || 'system',
    ts: new Date().toISOString(),
    type: 'GUARDIAN_ALERT_ACKNOWLEDGED',
    metadata: { alertId },
  });
}

/**
 * Trigger a guardian alert notification
 */
export function triggerGuardianNotification(alert: MissedDoseAlert): void {
  const state = loadAppState();
  
  // Log the alert trigger
  appendEvent({
    profileId: state.activeProfileId || 'system',
    ts: new Date().toISOString(),
    type: 'GUARDIAN_ALERT_TRIGGERED',
    entityId: alert.medicationId,
    metadata: {
      alertId: alert.id,
      medicationName: alert.medicationName,
      scheduledTime: alert.scheduledTime,
    },
  });

  // Try to show push notification
  if ('Notification' in window && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification('⚠️ Пропущенный прием', {
      body: `${alert.medicationName} не был принят вовремя`,
      icon: '/capsula/icon-192.png',
      tag: `missed-${alert.id}`,
      requireInteraction: true,
    });
  }
}

/**
 * Check and trigger alerts for guardian mode
 * Should be called periodically (e.g., every minute)
 */
export function checkAndTriggerGuardianAlerts(): MissedDoseAlert[] {
  const pendingAlerts = getPendingMissedAlerts();
  
  // Trigger notifications for new alerts
  for (const alert of pendingAlerts) {
    triggerGuardianNotification(alert);
  }
  
  return pendingAlerts;
}

