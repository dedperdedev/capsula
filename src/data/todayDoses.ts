import { startOfDay, parse, getDay, differenceInDays, format } from 'date-fns';
import type { Schedule, Item } from './types';
import { schedulesStore, itemsStore, doseLogsStore } from './store';

export type FoodRelation = 'with_meals' | 'after_meals' | 'any_time';

export interface DoseInstance {
  id: string;
  scheduleId: string;
  itemId: string;
  name: string;
  time: string;
  doseText: string;
  foodRelation: FoodRelation;
  durationDaysTotal?: number;
  daysRemaining?: number;
  isTaken: boolean;
  isSkipped?: boolean;
  isSnoozed?: boolean;
  form: string;
}

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

          const dateStr = today.toISOString().split('T')[0];
          const id = `${schedule.id}-${dateStr}-${timeStr}`;

          instances.push({
            id,
            scheduleId: schedule.id,
            itemId: item.id,
            name: item.name,
            time: format(scheduledFor, 'HH:mm'),
            doseText,
            foodRelation,
            durationDaysTotal: duration.total,
            daysRemaining: duration.remaining,
            isTaken,
            isSkipped,
            isSnoozed: isSnoozed,
            form: item.form,
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

