import { startOfDay, parse, getDay, differenceInDays, format, differenceInMinutes } from 'date-fns';
import type { Schedule, Item, DoseTimingStatus, ScheduleMode } from './types';
import { schedulesStore, itemsStore, doseLogsStore } from './store';

export type FoodRelation = 'with_meals' | 'after_meals' | 'any_time';

export interface DoseInstance {
  id: string;
  scheduleId: string;
  itemId: string;
  name: string;
  time: string;
  originalTime: string; // Original scheduled time before snooze
  doseText: string;
  foodRelation: FoodRelation;
  durationDaysTotal?: number;
  daysRemaining?: number;
  isTaken: boolean;
  isSkipped?: boolean;
  isSnoozed?: boolean;
  form: string;
  // Quality layer additions
  timingStatus: DoseTimingStatus;
  graceWindowMinutes: number;
  takenAt?: string; // ISO string of when dose was taken
  minutesFromPlanned?: number; // Difference from planned time (positive = late)
  mode: ScheduleMode;
}

const DEFAULT_GRACE_WINDOW = 60; // minutes

function mapFoodRelation(withFood?: 'before' | 'after' | 'none'): FoodRelation {
  if (withFood === 'after') return 'after_meals';
  if (withFood === 'before') return 'with_meals';
  return 'any_time';
}

function getDoseText(item: Item): string {
  const formMap: Record<string, string> = {
    tablet: '1 таблетка',
    capsule: '1 капсула',
    syrup: '5 мл',
    injection: '1 инъекция',
    powder: '1 пакетик',
    drops: '5 капель',
    spray: '1 впрыск',
    patch: '1 пластырь',
    other: '1 доза',
  };
  return item.doseText || formMap[item.form] || '1 доза';
}

function calculateDuration(schedule: Schedule): { total?: number; remaining?: number } {
  if (!schedule.startDate) return {};
  
  const start = parse(schedule.startDate, 'yyyy-MM-dd', new Date());
  const today = startOfDay(new Date());
  
  if (schedule.endDate) {
    const end = parse(schedule.endDate, 'yyyy-MM-dd', new Date());
    const total = differenceInDays(end, start) + 1;
    const remaining = Math.max(0, differenceInDays(end, today) + 1);
    return { total, remaining };
  }
  
  return {};
}

function isScheduleActiveToday(schedule: Schedule, today: Date): boolean {
  const dayOfWeek = getDay(today);
  
  if (!schedule.daysOfWeek.includes(dayOfWeek)) return false;
  
  if (schedule.startDate) {
    const start = startOfDay(parse(schedule.startDate, 'yyyy-MM-dd', new Date()));
    if (today < start) return false;
  }
  
  if (schedule.endDate) {
    const end = startOfDay(parse(schedule.endDate, 'yyyy-MM-dd', new Date()));
    if (today > end) return false;
  }
  
  return true;
}

/**
 * Get PRN (as-needed) medications
 */
export function getPRNMedications(): { item: Item; schedule: Schedule; todayCount: number; canTake: boolean; warning?: string }[] {
  const today = startOfDay(new Date());
  const todayStr = today.toISOString().split('T')[0];
  const schedules = schedulesStore.getEnabled().filter(s => s.mode === 'prn');
  const items = itemsStore.getAll();
  const logs = doseLogsStore.getAll();

  return schedules.map(schedule => {
    const item = items.find(i => i.id === schedule.itemId);
    if (!item) return null;

    // Count today's PRN doses
    const todayLogs = logs.filter(l => 
      l.itemId === schedule.itemId &&
      l.action === 'taken' &&
      l.createdAt.startsWith(todayStr)
    );
    const todayCount = todayLogs.length;

    // Check constraints
    let canTake = true;
    let warning: string | undefined;

    // Check max per day
    if (schedule.prnMaxPerDay && todayCount >= schedule.prnMaxPerDay) {
      canTake = false;
      warning = `Достигнут лимит ${schedule.prnMaxPerDay} доз в день`;
    }

    // Check minimum interval
    if (canTake && schedule.prnMinIntervalHours && todayLogs.length > 0) {
      const lastDose = todayLogs.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      const lastDoseTime = new Date(lastDose.createdAt);
      const hoursSinceLast = differenceInMinutes(new Date(), lastDoseTime) / 60;
      
      if (hoursSinceLast < schedule.prnMinIntervalHours) {
        const remainingMinutes = Math.ceil((schedule.prnMinIntervalHours - hoursSinceLast) * 60);
        warning = `Подождите ${remainingMinutes} мин до следующего приема`;
      }
    }

    return { item, schedule, todayCount, canTake, warning };
  }).filter(Boolean) as { item: Item; schedule: Schedule; todayCount: number; canTake: boolean; warning?: string }[];
}

/**
 * Log a PRN dose
 */
/**
 * Check for postpone collisions
 */
export function checkPostponeCollision(
  itemId: string, 
  originalTime: string, 
  newTime: Date
): { hasCollision: boolean; collidingDose?: DoseInstance } {
  const doses = getTodayDoses();
  const newTimeStr = format(newTime, 'HH:mm');
  
  // Find doses at the new time (excluding the dose being postponed)
  const collidingDose = doses.find(d => 
    d.itemId === itemId &&
    d.time === newTimeStr &&
    d.originalTime !== originalTime
  );

  return {
    hasCollision: !!collidingDose,
    collidingDose,
  };
}

/**
 * Resolve postpone collision
 */
export type CollisionResolution = 'keep_both' | 'merge' | 'cancel_new' | 'cancel_old';

export function resolvePostponeCollision(
  itemId: string,
  originalTime: string,
  newTime: Date,
  resolution: CollisionResolution
): { success: boolean; message: string } {
  const { hasCollision, collidingDose } = checkPostponeCollision(itemId, originalTime, newTime);
  
  if (!hasCollision || !collidingDose) {
    return { success: true, message: 'No collision to resolve' };
  }

  switch (resolution) {
    case 'keep_both':
      // Just proceed, both doses will be shown
      return { success: true, message: 'Both doses kept' };
    
    case 'merge':
      // Skip the original dose being postponed
      doseLogsStore.create({
        itemId,
        scheduledFor: new Date().toISOString(),
        action: 'skipped',
        reason: 'merged_with_existing',
      });
      return { success: true, message: 'Doses merged' };
    
    case 'cancel_new':
      // Don't proceed with postpone
      return { success: false, message: 'Postpone cancelled' };
    
    case 'cancel_old':
      // Skip the existing dose at new time
      const today = startOfDay(new Date());
      const [h, m] = collidingDose.originalTime.split(':').map(Number);
      const scheduledFor = new Date(today);
      scheduledFor.setHours(h, m, 0, 0);
      
      doseLogsStore.create({
        itemId,
        scheduledFor: scheduledFor.toISOString(),
        action: 'skipped',
        reason: 'replaced_by_postpone',
      });
      return { success: true, message: 'Original dose cancelled' };
    
    default:
      return { success: false, message: 'Unknown resolution' };
  }
}

export function logPRNDose(itemId: string): { success: boolean; warning?: string } {
  const prnMeds = getPRNMedications();
  const prnMed = prnMeds.find(p => p.item.id === itemId);
  
  if (!prnMed) {
    return { success: false, warning: 'Препарат не найден' };
  }

  if (!prnMed.canTake) {
    return { success: false, warning: prnMed.warning };
  }

  // Log the dose
  doseLogsStore.create({
    itemId,
    scheduledFor: new Date().toISOString(), // PRN has no scheduled time
    action: 'taken',
  });

  return { success: true, warning: prnMed.warning };
}

export function getTodayDoses(date: Date = new Date()): DoseInstance[] {
  try {
    const today = startOfDay(date);
    const enabledSchedules = schedulesStore.getEnabled();
    const items = itemsStore.getAll();
    const logs = doseLogsStore.getAll();
    const instances: DoseInstance[] = [];

    for (const schedule of enabledSchedules) {
      try {
        if (!isScheduleActiveToday(schedule, today)) continue;
        
        const item = items.find(i => i.id === schedule.itemId);
        if (!item) continue;

        const duration = calculateDuration(schedule);
        const doseText = getDoseText(item);
        const foodRelation = mapFoodRelation(schedule.withFood);

        if (!schedule.times || schedule.times.length === 0) continue;
        
        for (const timeStr of schedule.times) {
          if (!timeStr || !timeStr.includes(':')) continue;
          
          const [hours, minutes] = timeStr.split(':').map(Number);
          if (isNaN(hours) || isNaN(minutes)) continue;
          
          // Original scheduled time
          const originalScheduledFor = new Date(today);
          originalScheduledFor.setHours(hours, minutes, 0, 0);
          const originalScheduledForISO = originalScheduledFor.toISOString();

          // Check for snooze
          const snoozeLog = logs.find(
            l => l.itemId === schedule.itemId &&
            l.scheduledFor === originalScheduledForISO &&
            l.action === 'snoozed' &&
            l.snoozeUntil &&
            new Date(l.snoozeUntil) > new Date()
          );
          
          let scheduledFor = originalScheduledFor;
          let scheduledForISO = originalScheduledForISO;
          
          if (snoozeLog && snoozeLog.snoozeUntil) {
            scheduledFor = new Date(snoozeLog.snoozeUntil);
            scheduledForISO = scheduledFor.toISOString();
          }

          // Check for different actions (check both original and snoozed time)
          const takenLog = logs.find(
            l => l.itemId === schedule.itemId && 
            (l.scheduledFor === scheduledForISO || l.scheduledFor === originalScheduledForISO) &&
            l.action === 'taken'
          );

          const skippedLog = logs.find(
            l => l.itemId === schedule.itemId && 
            l.scheduledFor === originalScheduledForISO &&
            l.action === 'skipped'
          );
          
          const isTaken = !!takenLog;
          const isSkipped = !!skippedLog;
          const isSnoozed = !!snoozeLog;

          // Calculate timing status
          const graceWindow = schedule.graceWindowMinutes ?? DEFAULT_GRACE_WINDOW;
          const now = new Date();
          const mode: ScheduleMode = schedule.mode || 'scheduled';
          
          let timingStatus: DoseTimingStatus = 'pending';
          let minutesFromPlanned: number | undefined;
          let takenAt: string | undefined;

          if (isTaken && takenLog) {
            takenAt = takenLog.createdAt;
            const takenTime = new Date(takenLog.createdAt);
            minutesFromPlanned = differenceInMinutes(takenTime, originalScheduledFor);
            
            if (Math.abs(minutesFromPlanned) <= graceWindow) {
              timingStatus = 'on_time';
            } else if (minutesFromPlanned > 0) {
              timingStatus = 'late';
            } else {
              timingStatus = 'on_time'; // Early is always on time
            }
          } else if (isSkipped) {
            timingStatus = 'missed';
          } else {
            // Check if past due
            const minutesPastDue = differenceInMinutes(now, scheduledFor);
            if (minutesPastDue > graceWindow) {
              timingStatus = 'late'; // Past grace window, still pending but late
            } else {
              timingStatus = 'pending';
            }
          }

          const dateStr = today.toISOString().split('T')[0];
          const id = `${schedule.id}-${dateStr}-${timeStr}`;

          instances.push({
            id,
            scheduleId: schedule.id,
            itemId: item.id,
            name: item.name,
            time: format(scheduledFor, 'HH:mm'),
            originalTime: timeStr,
            doseText,
            foodRelation,
            durationDaysTotal: duration.total,
            daysRemaining: duration.remaining,
            isTaken,
            isSkipped,
            isSnoozed,
            form: item.form,
            timingStatus,
            graceWindowMinutes: graceWindow,
            takenAt,
            minutesFromPlanned,
            mode,
          });
        }
      } catch (error) {
        console.error('Error processing schedule:', schedule.id, error);
        continue;
      }
    }

    instances.sort((a, b) => {
      const timeCompare = a.time.localeCompare(b.time);
      if (timeCompare !== 0) return timeCompare;
      return a.name.localeCompare(b.name);
    });

    return instances;
  } catch (error) {
    console.error('Error in getTodayDoses:', error);
    return [];
  }
}

