/**
 * Event log engine - single source of truth for all state changes
 */

import type { Event, Schedule } from './storage';
import { loadAppState, saveAppState, appendEvent } from './storage';

export interface DoseInstance {
  id: string;
  profileId: string;
  scheduleId: string;
  medicationId: string;
  plannedTime: string; // ISO
  status: 'pending' | 'taken' | 'skipped' | 'postponed';
  lastEventId?: string;
  actualTime?: string; // ISO
  isLate?: boolean;
  amount?: string;
  unit?: string;
}

export function getTodayDoses(profileId: string, date: Date = new Date()): DoseInstance[] {
  const state = loadAppState();
  const profile = state.profiles.find(p => p.id === profileId);
  if (!profile) return [];

  const today = new Date(date);
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const activeSchedules = state.schedules.filter(
    s => s.profileId === profileId && !s.isPaused
  );

  const instances: DoseInstance[] = [];

  for (const schedule of activeSchedules) {
    const medication = state.medications.find(m => m.id === schedule.medicationId);
    if (!medication) continue;

    // Get planned times for today based on schedule scheme
    const plannedTimes = getPlannedTimesForDate(schedule, today);
    
    for (const plannedTime of plannedTimes) {
      const instanceId = `${schedule.id}-${plannedTime.toISOString()}`;
      
      // Find relevant events
      const events = state.events.filter(
        e => e.profileId === profileId && 
        e.entityId === schedule.id &&
        e.ts.startsWith(todayStr)
      );

      // Determine status from events
      const takenEvent = events.find(e => 
        e.type === 'DOSE_TAKEN' && 
        e.metadata.scheduledFor === plannedTime.toISOString()
      );

      const skippedEvent = events.find(e => 
        e.type === 'DOSE_SKIPPED' && 
        e.metadata.scheduledFor === plannedTime.toISOString()
      );

      const postponedEvent = events.find(e => 
        e.type === 'DOSE_POSTPONED' && 
        e.metadata.fromTime === plannedTime.toISOString()
      );

      let status: DoseInstance['status'] = 'pending';
      let lastEventId: string | undefined;
      let actualTime: string | undefined;
      let isLate: boolean | undefined;
      let finalPlannedTime = plannedTime;

      if (takenEvent) {
        status = 'taken';
        lastEventId = takenEvent.id;
        actualTime = takenEvent.ts;
        isLate = new Date(actualTime) > plannedTime;
      } else if (skippedEvent) {
        status = 'skipped';
        lastEventId = skippedEvent.id;
      } else if (postponedEvent) {
        status = 'postponed';
        lastEventId = postponedEvent.id;
        // Update planned time to postponed time
        const toTime = postponedEvent.metadata.toTime as string;
        if (toTime) {
          finalPlannedTime = new Date(toTime);
        }
      }

      instances.push({
        id: instanceId,
        profileId,
        scheduleId: schedule.id,
        medicationId: medication.id,
        plannedTime: finalPlannedTime.toISOString(),
        status,
        lastEventId,
        actualTime,
        isLate,
        amount: schedule.dose,
        unit: medication.unit,
      });
    }
  }

  // Sort by planned time
  instances.sort((a, b) => 
    new Date(a.plannedTime).getTime() - new Date(b.plannedTime).getTime()
  );

  return instances;
}

function getPlannedTimesForDate(schedule: Schedule, date: Date): Date[] {
  const times: Date[] = [];
  const dayOfWeek = date.getDay();

  switch (schedule.scheme.type) {
    case 'daily':
      for (const timeStr of schedule.scheme.times) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const time = new Date(date);
        time.setHours(hours, minutes, 0, 0);
        times.push(time);
      }
      break;

    case 'weekly':
      if (schedule.scheme.weekdays.includes(dayOfWeek)) {
        for (const timeStr of schedule.scheme.times) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const time = new Date(date);
          time.setHours(hours, minutes, 0, 0);
          times.push(time);
        }
      }
      break;

    case 'intervalDays':
      // Check if this date matches the interval
      const startDate = new Date(schedule.startDate);
      const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 0 && daysDiff % schedule.scheme.interval === 0) {
        for (const timeStr of schedule.scheme.times) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const time = new Date(date);
          time.setHours(hours, minutes, 0, 0);
          times.push(time);
        }
      }
      break;

    case 'courseDays':
      const courseStart = new Date(schedule.startDate);
      const courseDays = Math.floor((date.getTime() - courseStart.getTime()) / (1000 * 60 * 60 * 24));
      if (courseDays >= 0 && courseDays < schedule.scheme.days) {
        for (const timeStr of schedule.scheme.times) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const time = new Date(date);
          time.setHours(hours, minutes, 0, 0);
          times.push(time);
        }
      }
      break;

    case 'intervalHours':
      // For interval hours, calculate times throughout the day
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      
      let current = new Date(start);
      while (current <= end) {
        times.push(new Date(current));
        current = new Date(current.getTime() + schedule.scheme.interval * 60 * 60 * 1000);
      }
      break;
  }

  // Filter by start/end date
  if (schedule.startDate) {
    const start = new Date(schedule.startDate);
    start.setHours(0, 0, 0, 0);
    times.forEach((t, i) => {
      if (t < start) times.splice(i, 1);
    });
  }

  if (schedule.endDate) {
    const end = new Date(schedule.endDate);
    end.setHours(23, 59, 59, 999);
    times.forEach((t, i) => {
      if (t > end) times.splice(i, 1);
    });
  }

  return times;
}

export function getNextDose(profileId: string, now: Date = new Date()): DoseInstance | null {
  const doses = getTodayDoses(profileId, now);
  const pending = doses.filter(d => d.status === 'pending');
  if (pending.length === 0) return null;

  // Also check tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDoses = getTodayDoses(profileId, tomorrow);
  const tomorrowPending = tomorrowDoses.filter(d => d.status === 'pending');

  const allPending = [...pending, ...tomorrowPending];
  if (allPending.length === 0) return null;

  // Find next dose after now
  const next = allPending.find(d => new Date(d.plannedTime) > now);
  return next || allPending[0];
}

export function logDoseTaken(
  profileId: string,
  scheduleId: string,
  medicationId: string,
  plannedTime: string,
  actualTime?: string
): Event {
  const actual = actualTime || new Date().toISOString();
  const planned = new Date(plannedTime);
  const isLate = new Date(actual) > planned;

  const event = appendEvent({
    profileId,
    ts: actual,
    type: 'DOSE_TAKEN',
    entityId: scheduleId,
    metadata: {
      medicationId,
      scheduledFor: plannedTime,
      actualTime: actual,
      isLate,
    },
  });

  // Auto-decrement inventory if enabled
  const state = loadAppState();
  if (state.settings.autoDecrementInventory) {
    const schedule = state.schedules.find(s => s.id === scheduleId);
    if (schedule) {
      const inventory = state.inventory.find(
        inv => inv.medicationId === medicationId && inv.profileId === profileId
      );
      if (inventory) {
        const amount = parseFloat(schedule.dose) || 1;
        inventory.quantity = Math.max(0, inventory.quantity - amount);
        inventory.updatedAt = new Date().toISOString();
        saveAppState(state);
      }
    }
  }

  return event;
}

export function logDoseSkipped(
  profileId: string,
  scheduleId: string,
  plannedTime: string,
  reasonCode: string,
  note?: string
): Event {
  return appendEvent({
    profileId,
    ts: new Date().toISOString(),
    type: 'DOSE_SKIPPED',
    entityId: scheduleId,
    metadata: {
      scheduledFor: plannedTime,
      reasonCode,
      note,
    },
  });
}

export function logDosePostponed(
  profileId: string,
  scheduleId: string,
  fromTime: string,
  toTime: string,
  postponePreset?: string
): Event {
  return appendEvent({
    profileId,
    ts: new Date().toISOString(),
    type: 'DOSE_POSTPONED',
    entityId: scheduleId,
    metadata: {
      fromTime,
      toTime,
      postponePreset,
    },
  });
}

export function logDoseUndone(
  profileId: string,
  targetEventId: string,
  reason: string
): Event {
  return appendEvent({
    profileId,
    ts: new Date().toISOString(),
    type: 'DOSE_UNDONE',
    entityId: targetEventId,
    metadata: { reason },
  });
}

export function getInventoryStatus(profileId: string, medicationId: string): {
  quantity: number;
  unit: string;
  lowStock: boolean;
} | null {
  const state = loadAppState();
  const inventory = state.inventory.find(
    inv => inv.medicationId === medicationId && inv.profileId === profileId
  );

  if (!inventory) return null;

  return {
    quantity: inventory.quantity,
    unit: inventory.quantityUnit,
    lowStock: inventory.lowStockThreshold 
      ? inventory.quantity <= inventory.lowStockThreshold 
      : false,
  };
}

export function getEnoughUntil(profileId: string, medicationId: string): Date | null {
  const state = loadAppState();
  const inventory = state.inventory.find(
    inv => inv.medicationId === medicationId && inv.profileId === profileId
  );

  if (!inventory || inventory.quantity <= 0) return null;

  // Get active schedules for this medication
  const schedules = state.schedules.filter(
    s => s.medicationId === medicationId && 
    s.profileId === profileId && 
    !s.isPaused
  );

  if (schedules.length === 0) return null;

  // Calculate daily consumption
  let dailyConsumption = 0;
  for (const schedule of schedules) {
    const dose = parseFloat(schedule.dose) || 1;
    switch (schedule.scheme.type) {
      case 'daily':
        dailyConsumption += dose * schedule.scheme.timesPerDay;
        break;
      case 'weekly':
        dailyConsumption += dose * (schedule.scheme.weekdays.length / 7) * schedule.scheme.times.length;
        break;
      case 'intervalDays':
        dailyConsumption += dose * (schedule.scheme.times.length / schedule.scheme.interval);
        break;
      case 'courseDays':
        // Only count if course is active
        const start = new Date(schedule.startDate);
        const end = schedule.endDate ? new Date(schedule.endDate) : null;
        const now = new Date();
        if (now >= start && (!end || now <= end)) {
          dailyConsumption += dose * schedule.scheme.times.length;
        }
        break;
    }
  }

  if (dailyConsumption === 0) return null;

  const daysRemaining = inventory.quantity / dailyConsumption;
  const enoughUntil = new Date();
  enoughUntil.setDate(enoughUntil.getDate() + Math.floor(daysRemaining));

  return enoughUntil;
}

