/**
 * Refill Reminders Module
 * Triggers alerts when inventory is running low based on "enough until" forecast
 */

import { loadAppState, appendEvent, type InventoryItem, type Schedule } from '../data/storage';
import { addDays, differenceInDays, format } from 'date-fns';

// ============ TYPES ============

export interface RefillReminder {
  id: string;
  medicationId: string;
  medicationName: string;
  currentQuantity: number;
  quantityUnit: string;
  enoughUntil: Date | null;
  daysRemaining: number | null;
  isUrgent: boolean; // Less than threshold days
}

export interface RefillReminderSettings {
  enabled: boolean;
  thresholdDays: number;
}

// ============ CORE LOGIC ============

/**
 * Calculate "enough until" date for an inventory item
 */
export function calculateEnoughUntil(
  inventory: InventoryItem,
  schedule: Schedule | undefined
): Date | null {
  if (!schedule || inventory.quantity <= 0) return null;

  // Calculate daily consumption based on schedule scheme
  let dosesPerDay = 0;
  const scheme = schedule.scheme;

  switch (scheme.type) {
    case 'daily':
      dosesPerDay = scheme.timesPerDay;
      break;
    case 'weekly':
      // Average doses per day = (weekdays count * times count) / 7
      dosesPerDay = (scheme.weekdays.length * scheme.times.length) / 7;
      break;
    case 'intervalDays':
      dosesPerDay = scheme.times.length / scheme.interval;
      break;
    case 'intervalHours':
      dosesPerDay = 24 / scheme.interval;
      break;
    case 'courseDays':
      dosesPerDay = scheme.times.length;
      break;
    case 'prn':
      // PRN is unpredictable, estimate based on maxPerDay if set
      dosesPerDay = (scheme.maxPerDay || 2) * 0.5; // Assume 50% of max
      break;
  }

  if (dosesPerDay <= 0) return null;

  // Parse dose amount from schedule (e.g., "1" or "2")
  const doseAmount = parseFloat(schedule.dose) || 1;
  const dailyConsumption = dosesPerDay * doseAmount;

  if (dailyConsumption <= 0) return null;

  const daysSupply = Math.floor(inventory.quantity / dailyConsumption);
  return addDays(new Date(), daysSupply);
}

/**
 * Get all refill reminders for active profile
 */
export function getRefillReminders(): RefillReminder[] {
  const state = loadAppState();
  const reminders: RefillReminder[] = [];
  const thresholdDays = state.settings.refillThresholdDays || 3;

  if (!state.settings.refillRemindersEnabled) {
    return [];
  }

  const profileInventory = state.inventory.filter(
    inv => inv.profileId === state.activeProfileId
  );

  for (const inv of profileInventory) {
    const medication = state.medications.find(m => m.id === inv.medicationId);
    if (!medication) continue;

    const schedule = state.schedules.find(
      s => s.medicationId === inv.medicationId && 
           s.profileId === state.activeProfileId &&
           !s.isPaused
    );

    const enoughUntil = calculateEnoughUntil(inv, schedule);
    const daysRemaining = enoughUntil 
      ? differenceInDays(enoughUntil, new Date())
      : null;

    const isUrgent = daysRemaining !== null && daysRemaining <= thresholdDays;

    // Only include if urgent or low stock
    const isLowStock = inv.lowStockThreshold && inv.quantity <= inv.lowStockThreshold;
    
    if (isUrgent || isLowStock) {
      reminders.push({
        id: `refill-${inv.id}`,
        medicationId: inv.medicationId,
        medicationName: medication.name,
        currentQuantity: inv.quantity,
        quantityUnit: inv.quantityUnit,
        enoughUntil,
        daysRemaining,
        isUrgent,
      });
    }
  }

  // Sort by urgency (most urgent first)
  return reminders.sort((a, b) => {
    if (a.daysRemaining === null) return 1;
    if (b.daysRemaining === null) return -1;
    return a.daysRemaining - b.daysRemaining;
  });
}

/**
 * Get urgent refill reminders only
 */
export function getUrgentRefillReminders(): RefillReminder[] {
  return getRefillReminders().filter(r => r.isUrgent);
}

/**
 * Check and trigger refill notifications
 */
export function checkRefillNotifications(): RefillReminder[] {
  const state = loadAppState();
  if (!state.settings.refillRemindersEnabled) return [];

  const urgentReminders = getUrgentRefillReminders();

  for (const reminder of urgentReminders) {
    // Log the reminder trigger
    appendEvent({
      profileId: state.activeProfileId || 'system',
      ts: new Date().toISOString(),
      type: 'REFILL_REMINDER_TRIGGERED',
      entityId: reminder.medicationId,
      metadata: {
        medicationName: reminder.medicationName,
        daysRemaining: reminder.daysRemaining,
        currentQuantity: reminder.currentQuantity,
      },
    });

    // Show push notification if available
    try {
      const NotificationClass = typeof window !== 'undefined' ? (window as any).Notification : null;
      if (NotificationClass && NotificationClass.permission === 'granted') {
        const daysText = reminder.daysRemaining !== null
          ? `хватит на ${reminder.daysRemaining} дн.`
          : 'заканчивается';

        new NotificationClass('💊 Пополните запас', {
          body: `${reminder.medicationName} — ${daysText}`,
          icon: '/capsula/icon-192.png',
          tag: `refill-${reminder.medicationId}`,
        });
      }
    } catch (error) {
      // Notification API not available, silently fail
      console.debug('Notification not available:', error);
    }
  }

  return urgentReminders;
}

/**
 * Add stock to an inventory item
 */
export function addStock(inventoryId: string, amount: number): boolean {
  const state = loadAppState();
  const inventory = state.inventory.find(inv => inv.id === inventoryId);
  
  if (!inventory) return false;

  inventory.quantity += amount;
  inventory.updatedAt = new Date().toISOString();
  
  appendEvent({
    profileId: state.activeProfileId || 'system',
    ts: new Date().toISOString(),
    type: 'INVENTORY_ADJUSTED',
    entityId: inventory.medicationId,
    metadata: {
      action: 'add',
      amount,
      newQuantity: inventory.quantity,
    },
  });

  // Save state is handled by appendEvent
  return true;
}

// ============ FORMATTING ============

export function formatEnoughUntil(date: Date | null, locale: 'ru' | 'en' = 'ru'): string {
  if (!date) return locale === 'ru' ? 'Неизвестно' : 'Unknown';
  
  const days = differenceInDays(date, new Date());
  
  if (days <= 0) {
    return locale === 'ru' ? 'Закончился!' : 'Run out!';
  }
  if (days === 1) {
    return locale === 'ru' ? 'Завтра' : 'Tomorrow';
  }
  if (days <= 7) {
    return locale === 'ru' ? `${days} дн.` : `${days} days`;
  }
  
  return format(date, 'd MMM');
}

