/**
 * Routine Anchors Module
 * Maps anchor types (after_wake, after_breakfast, etc.) to actual times
 */

import { loadAppState, saveAppState, type RoutineAnchor, type AnchorType } from '../data/storage';
import { addMinutes, format } from 'date-fns';

/**
 * Get actual time for an anchor type based on user settings
 */
export function getAnchorTime(anchorType: AnchorType, date: Date = new Date()): Date | null {
  const state = loadAppState();
  const settings = state.settings;
  
  let baseTime: string | undefined;
  
  switch (anchorType) {
    case 'after_wake':
      baseTime = settings.wakeTime;
      break;
    case 'after_breakfast':
      baseTime = settings.breakfastTime;
      break;
    case 'after_lunch':
      baseTime = settings.lunchTime;
      break;
    case 'after_dinner':
      baseTime = settings.dinnerTime;
      break;
    case 'before_sleep':
      baseTime = settings.bedTime;
      break;
  }
  
  if (!baseTime) return null;
  
  const [hours, minutes] = baseTime.split(':').map(Number);
  const anchorDate = new Date(date);
  anchorDate.setHours(hours, minutes, 0, 0);
  
  return anchorDate;
}

/**
 * Get planned time for a schedule that uses an anchor
 */
export function getPlannedTimeFromAnchor(
  anchor: RoutineAnchor,
  date: Date = new Date()
): Date | null {
  const anchorTime = getAnchorTime(anchor.anchorType, date);
  if (!anchorTime) return null;
  
  return addMinutes(anchorTime, anchor.offsetMinutes);
}

/**
 * Get all anchors for a schedule
 */
export function getAnchorsForSchedule(scheduleId: string): RoutineAnchor[] {
  const state = loadAppState();
  return state.routineAnchors.filter(a => a.scheduleId === scheduleId);
}

/**
 * Create or update a routine anchor
 */
export function setRoutineAnchor(
  scheduleId: string,
  anchorType: AnchorType,
  offsetMinutes: number
): RoutineAnchor {
  const state = loadAppState();
  const profileId = state.activeProfileId || '';
  
  // Check if anchor already exists
  const existing = state.routineAnchors.find(
    a => a.scheduleId === scheduleId && a.anchorType === anchorType
  );
  
  const now = new Date().toISOString();
  
  if (existing) {
    existing.offsetMinutes = offsetMinutes;
    existing.updatedAt = now;
    return existing;
  }
  
  const newAnchor: RoutineAnchor = {
    id: crypto.randomUUID(),
    profileId,
    scheduleId,
    anchorType,
    offsetMinutes,
    createdAt: now,
    updatedAt: now,
  };
  
  state.routineAnchors.push(newAnchor);
  saveAppState(state);
  
  return newAnchor;
}

/**
 * Remove a routine anchor
 */
export function removeRoutineAnchor(anchorId: string): boolean {
  const state = loadAppState();
  const index = state.routineAnchors.findIndex(a => a.id === anchorId);
  
  if (index === -1) return false;
  
  state.routineAnchors.splice(index, 1);
  saveAppState(state);
  
  return true;
}

/**
 * Get anchor label for display
 */
export function getAnchorLabel(anchorType: AnchorType, locale: 'ru' | 'en' = 'ru'): string {
  const labels: Record<AnchorType, { ru: string; en: string }> = {
    after_wake: { ru: 'После пробуждения', en: 'After Wake' },
    after_breakfast: { ru: 'После завтрака', en: 'After Breakfast' },
    after_lunch: { ru: 'После обеда', en: 'After Lunch' },
    after_dinner: { ru: 'После ужина', en: 'After Dinner' },
    before_sleep: { ru: 'Перед сном', en: 'Before Sleep' },
  };
  
  return labels[anchorType][locale];
}

/**
 * Format anchor time with offset for display
 */
export function formatAnchorTime(
  anchorType: AnchorType,
  offsetMinutes: number,
  locale: 'ru' | 'en' = 'ru'
): string {
  const anchorTime = getAnchorTime(anchorType);
  if (!anchorTime) return getAnchorLabel(anchorType, locale);
  
  const plannedTime = addMinutes(anchorTime, offsetMinutes);
  const timeStr = format(plannedTime, 'HH:mm');
  
  if (offsetMinutes === 0) {
    return `${getAnchorLabel(anchorType, locale)} (${timeStr})`;
  }
  
  const offsetStr = offsetMinutes > 0 
    ? `+${offsetMinutes} ${locale === 'ru' ? 'мин' : 'min'}`
    : `${offsetMinutes} ${locale === 'ru' ? 'мин' : 'min'}`;
  
  return `${getAnchorLabel(anchorType, locale)} ${offsetStr} (${timeStr})`;
}

