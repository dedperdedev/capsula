/**
 * Date utility helpers
 */

import { format, startOfDay, isToday } from 'date-fns';
import ru from 'date-fns/locale/ru';

/**
 * Get date key (YYYY-MM-DD) for a date
 */
export function getDateKey(date: Date): string {
  return format(startOfDay(date), 'yyyy-MM-dd');
}

/**
 * Get today's date key
 */
export function getTodayKey(): string {
  return getDateKey(new Date());
}

/**
 * Check if a date is today
 */
export function isDateToday(date: Date): boolean {
  return isToday(date);
}

/**
 * Format date label for hero header
 * Shows "Сегодня 21 октября" / "Today, Oct 21" if today, otherwise formatted date
 */
export function formatHeroDateLabel(date: Date, locale: 'ru' | 'en'): string {
  const dateKey = getDateKey(date);
  const todayKey = getTodayKey();
  
  if (dateKey === todayKey) {
    // Today - show "Сегодня 21 октября" / "Today, Oct 21"
    if (locale === 'ru') {
      return `Сегодня ${format(date, 'd MMMM', { locale: ru })}`;
    } else {
      return `Today, ${format(date, 'MMM d')}`;
    }
  } else {
    // Other date - show formatted date without "Today"
    if (locale === 'ru') {
      return format(date, 'd MMMM', { locale: ru });
    } else {
      return format(date, 'MMM d');
    }
  }
}

/**
 * Format countdown "in X" for next dose
 * @param ms - milliseconds until the dose time
 * @param locale - 'ru' or 'en'
 * @returns Formatted string like "через 2 ч 5 мин" or "in 2h 5m"
 */
export function formatInCountdown(ms: number, locale: 'ru' | 'en'): string {
  const clamped = Math.max(0, ms);
  
  if (clamped <= 0) {
    return locale === 'ru' ? 'сейчас' : 'now';
  }
  
  const hours = Math.floor(clamped / 3600000);
  const minutes = Math.floor((clamped % 3600000) / 60000);
  
  if (locale === 'ru') {
    if (hours > 0 && minutes > 0) {
      return `через ${hours} ч ${minutes} мин`;
    } else if (hours > 0) {
      return `через ${hours} ч`;
    } else {
      return `через ${minutes} мин`;
    }
  } else {
    if (hours > 0 && minutes > 0) {
      return `in ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `in ${hours}h`;
    } else {
      return `in ${minutes}m`;
    }
  }
}
