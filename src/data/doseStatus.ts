/**
 * Dose Status Calculator
 * Handles grace window, timing status, and PRN validation
 */

import type { Schedule, DoseTimingStatus } from './types';

const DEFAULT_GRACE_WINDOW_MINUTES = 60;

export interface DoseTimingResult {
  status: DoseTimingStatus;
  delayMinutes: number;
  isWithinGrace: boolean;
}

/**
 * Calculate dose timing status based on planned vs actual time
 */
export function calculateDoseStatus(
  plannedTime: Date,
  actualTime: Date | null,
  schedule: Schedule
): DoseTimingResult {
  const graceWindow = schedule.graceWindowMinutes ?? DEFAULT_GRACE_WINDOW_MINUTES;
  const now = new Date();

  if (!actualTime) {
    // Not taken yet
    const minutesPastDue = Math.floor((now.getTime() - plannedTime.getTime()) / 60000);
    
    if (minutesPastDue < 0) {
      // Future dose
      return { status: 'pending', delayMinutes: 0, isWithinGrace: true };
    }
    
    if (minutesPastDue <= graceWindow) {
      // Within grace window, still pending
      return { status: 'pending', delayMinutes: minutesPastDue, isWithinGrace: true };
    }
    
    // Past grace window, considered missed
    return { status: 'missed', delayMinutes: minutesPastDue, isWithinGrace: false };
  }

  // Dose was taken - calculate if on time or late
  const delayMinutes = Math.floor((actualTime.getTime() - plannedTime.getTime()) / 60000);
  const isWithinGrace = Math.abs(delayMinutes) <= graceWindow;

  if (isWithinGrace) {
    return { status: 'on_time', delayMinutes, isWithinGrace: true };
  }

  return { status: 'late', delayMinutes, isWithinGrace: false };
}

/**
 * Format delay for display
 */
export function formatDelay(minutes: number, locale: 'ru' | 'en'): string {
  if (minutes === 0) return '';
  
  const absMinutes = Math.abs(minutes);
  const sign = minutes > 0 ? '+' : '-';
  
  if (absMinutes < 60) {
    return `${sign}${absMinutes} ${locale === 'ru' ? 'мин' : 'min'}`;
  }
  
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  
  if (mins === 0) {
    return `${sign}${hours} ${locale === 'ru' ? 'ч' : 'h'}`;
  }
  
  return `${sign}${hours}${locale === 'ru' ? 'ч' : 'h'} ${mins}${locale === 'ru' ? 'м' : 'm'}`;
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: DoseTimingStatus): string {
  switch (status) {
    case 'on_time': return 'text-green-500';
    case 'late': return 'text-amber-500';
    case 'missed': return 'text-red-500';
    case 'pending': return 'text-[var(--muted2)]';
    default: return 'text-[var(--muted2)]';
  }
}

/**
 * Get status background color for badges
 */
export function getStatusBgColor(status: DoseTimingStatus): string {
  switch (status) {
    case 'on_time': return 'bg-green-500/10 text-green-500';
    case 'late': return 'bg-amber-500/10 text-amber-500';
    case 'missed': return 'bg-red-500/10 text-red-500';
    case 'pending': return 'bg-[var(--surface2)] text-[var(--muted2)]';
    default: return 'bg-[var(--surface2)] text-[var(--muted2)]';
  }
}

export interface PRNValidationResult {
  canTake: boolean;
  reason?: string;
  nextAvailableTime?: Date;
  dosesToday: number;
}

/**
 * Validate PRN dose against limits
 */
export function validatePRNDose(
  schedule: Schedule,
  existingDosesToday: number,
  lastDoseTime: Date | null,
  locale: 'ru' | 'en'
): PRNValidationResult {
  const maxPerDay = schedule.prnMaxPerDay ?? Infinity;
  const minInterval = schedule.prnMinIntervalHours ?? 0;
  const now = new Date();

  // Check max per day
  if (existingDosesToday >= maxPerDay) {
    return {
      canTake: false,
      reason: locale === 'ru' 
        ? `Достигнут лимит ${maxPerDay} доз в день`
        : `Daily limit of ${maxPerDay} doses reached`,
      dosesToday: existingDosesToday,
    };
  }

  // Check minimum interval
  if (lastDoseTime && minInterval > 0) {
    const hoursSinceLastDose = (now.getTime() - lastDoseTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastDose < minInterval) {
      const nextAvailable = new Date(lastDoseTime.getTime() + minInterval * 60 * 60 * 1000);
      return {
        canTake: false,
        reason: locale === 'ru'
          ? `Следующая доза доступна через ${formatDelay(Math.ceil((minInterval - hoursSinceLastDose) * 60), locale)}`
          : `Next dose available in ${formatDelay(Math.ceil((minInterval - hoursSinceLastDose) * 60), locale)}`,
        nextAvailableTime: nextAvailable,
        dosesToday: existingDosesToday,
      };
    }
  }

  return { canTake: true, dosesToday: existingDosesToday };
}

/**
 * Apply timezone policy to scheduled time
 */
export function applyTimePolicy(
  scheduledTime: Date,
  timePolicy: 'LOCAL_TIME' | 'ABSOLUTE_UTC' = 'LOCAL_TIME'
): Date {
  if (timePolicy === 'ABSOLUTE_UTC') {
    // Time is stored as UTC, no conversion needed
    return scheduledTime;
  }

  // LOCAL_TIME: The scheduled time represents wall-clock time
  // This is the default and handles DST automatically
  return scheduledTime;
}

/**
 * Check if a postpone would create a collision
 */
export interface PostponeCollision {
  hasCollision: boolean;
  collidingDose?: {
    itemName: string;
    time: Date;
  };
}

export function checkPostponeCollision(
  newTime: Date,
  existingDoses: Array<{ time: Date; itemName: string }>,
  collisionWindowMinutes: number = 30
): PostponeCollision {
  for (const dose of existingDoses) {
    const diff = Math.abs(newTime.getTime() - dose.time.getTime()) / 60000;
    if (diff <= collisionWindowMinutes) {
      return {
        hasCollision: true,
        collidingDose: {
          itemName: dose.itemName,
          time: dose.time,
        },
      };
    }
  }

  return { hasCollision: false };
}

