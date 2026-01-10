/**
 * Dose Action Handlers
 * Reusable functions for dose actions extracted from DoseDueModal
 */

import { startOfDay } from 'date-fns';
import { doseLogsStore, inventoryStore } from '../../data/store';
import { toast } from '../shared/Toast';
import type { DoseInstance } from '../../data/todayDoses';

/**
 * Extract date from dose ID (format: scheduleId-YYYY-MM-DD-time)
 */
function getDateFromDoseId(doseId: string): Date {
  const parts = doseId.split('-');
  if (parts.length >= 4) {
    const year = parseInt(parts[parts.length - 3], 10);
    const month = parseInt(parts[parts.length - 2], 10) - 1;
    const day = parseInt(parts[parts.length - 1].split('-')[0] || parts[parts.length - 1], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return startOfDay(new Date(year, month, day));
    }
  }
  return startOfDay(new Date());
}

/**
 * Handle "Taken" action
 */
export function handleTaken(
  dose: DoseInstance,
  selectedDate: Date,
  t: (key: string, params?: Record<string, string | number>) => string,
  onActionComplete: () => void
) {
  const doseDate = selectedDate ? startOfDay(selectedDate) : getDateFromDoseId(dose.id);
  const [hours, minutes] = dose.originalTime.split(':').map(Number);
  const scheduledFor = new Date(doseDate);
  scheduledFor.setHours(hours, minutes, 0, 0);
  const scheduledForISO = scheduledFor.toISOString();

  doseLogsStore.create({
    itemId: dose.itemId,
    scheduledFor: scheduledForISO,
    action: 'taken',
  });

  // Decrement inventory if available
  const inventory = inventoryStore.getByItemId(dose.itemId);
  if (inventory && inventory.remainingUnits > 0) {
    inventoryStore.decrement(dose.itemId, 1);
    toast.success(t('dose.inventoryDecremented'));
  }

  toast.success(t('dose.markedAsTaken'));
  onActionComplete();
}

/**
 * Handle "Postpone/Snooze" action
 */
export function handlePostpone(
  dose: DoseInstance,
  selectedDate: Date,
  minutes: number,
  t: (key: string, params?: Record<string, string | number>) => string,
  onActionComplete: () => void
) {
  if (minutes < 5 || minutes > 240) {
    toast.error(t('dose.snoozeDurationError'));
    return;
  }

  const doseDate = selectedDate ? startOfDay(selectedDate) : getDateFromDoseId(dose.id);

  // Get original scheduled time - check if there's an existing snooze log for this date
  const allLogs = doseLogsStore.getAll();
  const doseDateStr = doseDate.toISOString().split('T')[0];
  const existingSnoozeLog = allLogs.find(log => {
    if (log.itemId !== dose.itemId || log.action !== 'snoozed' || !log.snoozeUntil) return false;
    const logDate = log.scheduledFor ? new Date(log.scheduledFor).toISOString().split('T')[0] : null;
    return logDate === doseDateStr && new Date(log.snoozeUntil) > new Date();
  });

  let originalScheduledFor: Date;

  if (existingSnoozeLog && existingSnoozeLog.scheduledFor) {
    originalScheduledFor = new Date(existingSnoozeLog.scheduledFor);
  } else {
    const [hours, minutesTime] = dose.originalTime.split(':').map(Number);
    originalScheduledFor = new Date(doseDate);
    originalScheduledFor.setHours(hours, minutesTime, 0, 0);
  }

  const originalScheduledForISO = originalScheduledFor.toISOString();
  const snoozeUntil = new Date(originalScheduledFor);
  snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);

  // Delete existing snooze log if exists
  if (existingSnoozeLog) {
    doseLogsStore.delete(existingSnoozeLog.id);
  }

  doseLogsStore.create({
    itemId: dose.itemId,
    scheduledFor: originalScheduledForISO,
    action: 'snoozed',
    snoozeUntil: snoozeUntil.toISOString(),
  });

  toast.success(t('dose.snoozedUntil') + ' ' + snoozeUntil.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
  onActionComplete();
}

/**
 * Handle "Skip" action
 */
export function handleSkip(
  dose: DoseInstance,
  selectedDate: Date,
  reason: string,
  note: string | undefined,
  t: (key: string, params?: Record<string, string | number>) => string,
  onActionComplete: () => void
) {
  const doseDate = selectedDate ? startOfDay(selectedDate) : getDateFromDoseId(dose.id);
  const [hours, minutes] = dose.originalTime.split(':').map(Number);
  const scheduledFor = new Date(doseDate);
  scheduledFor.setHours(hours, minutes, 0, 0);
  const scheduledForISO = scheduledFor.toISOString();

  doseLogsStore.create({
    itemId: dose.itemId,
    scheduledFor: scheduledForISO,
    action: 'skipped',
    reason,
    ...(note && { note }),
  });

  toast.success(t('dose.markedAsSkipped'));
  onActionComplete();
}
