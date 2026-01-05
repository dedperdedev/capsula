/**
 * Timezone & Travel Mode Module
 * Handles timezone changes, DST transitions, and travel mode
 */

import { loadAppState, saveAppState, appendEvent } from '../data/storage';
import { format } from 'date-fns';

export interface TimezoneInfo {
  timezone: string; // IANA timezone (e.g., "Europe/Moscow")
  offset: string; // e.g., "+03:00"
  isDST: boolean;
  abbreviation: string; // e.g., "MSK"
}

/**
 * Get current timezone info
 */
export function getCurrentTimezone(): TimezoneInfo {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const offset = format(now, 'xxx'); // e.g., "+03:00"
  // Get abbreviation using Intl
  const formatter = new Intl.DateTimeFormat('en', { 
    timeZone: tz, 
    timeZoneName: 'short' 
  });
  const parts = formatter.formatToParts(now);
  const abbreviation = parts.find(p => p.type === 'timeZoneName')?.value || '';
  
  // Check if DST is active (simplified check)
  const jan = new Date(now.getFullYear(), 0, 1);
  const jul = new Date(now.getFullYear(), 6, 1);
  const stdOffset = Math.max(
    jan.getTimezoneOffset(),
    jul.getTimezoneOffset()
  );
  const isDST = now.getTimezoneOffset() < stdOffset;

  return {
    timezone: tz,
    offset,
    isDST,
    abbreviation,
  };
}

/**
 * Detect timezone change
 */
export function detectTimezoneChange(_profileId: string): {
  changed: boolean;
  oldTimezone?: string;
  newTimezone: string;
  message: { ru: string; en: string };
} {
  const state = loadAppState();
  const currentTz = getCurrentTimezone().timezone;
  const storedTz = state.settings.timezone || currentTz;

  if (storedTz !== currentTz) {
    return {
      changed: true,
      oldTimezone: storedTz,
      newTimezone: currentTz,
      message: {
        ru: `Обнаружено изменение часового пояса: ${storedTz} → ${currentTz}`,
        en: `Timezone change detected: ${storedTz} → ${currentTz}`,
      },
    };
  }

  return {
    changed: false,
    newTimezone: currentTz,
    message: { ru: '', en: '' },
  };
}

/**
 * Handle timezone change with user choice
 */
export function handleTimezoneChange(
  profileId: string,
  choice: 'keep_local' | 'update_to_new' | 'travel_mode'
): void {
  const state = loadAppState();
  const detection = detectTimezoneChange(profileId);
  
  if (!detection.changed) return;

  const now = new Date().toISOString();

  switch (choice) {
    case 'keep_local':
      // Keep using old timezone (travel mode)
      state.settings.travelModeEnabled = true;
      break;
    
    case 'update_to_new':
      // Update to new timezone
      state.settings.timezone = detection.newTimezone;
      state.settings.travelModeEnabled = false;
      
      // Log timezone change event
      appendEvent({
        profileId,
        ts: now,
        type: 'PROFILE_UPDATED',
        entityId: profileId,
        metadata: {
          timezoneChange: {
            from: detection.oldTimezone,
            to: detection.newTimezone,
            choice: 'update',
          },
        },
      });
      break;
    
    case 'travel_mode':
      // Enable travel mode (keep original timezone)
      state.settings.travelModeEnabled = true;
      
      appendEvent({
        profileId,
        ts: now,
        type: 'PROFILE_UPDATED',
        entityId: profileId,
        metadata: {
          timezoneChange: {
            from: detection.oldTimezone,
            to: detection.newTimezone,
            choice: 'travel_mode',
          },
        },
      });
      break;
  }

  saveAppState(state);
}

/**
 * Format time in profile's timezone
 */
export function formatInProfileTimezone(
  date: Date,
  _profileId: string,
  formatStr: string = 'HH:mm'
): string {
  // If travel mode is enabled, use stored timezone for display
  // For MVP, we'll just format in current timezone
  // Full timezone conversion would require date-fns-tz or manual offset calculation
  return format(date, formatStr);
}

/**
 * Get timezone options for selection
 */
export function getTimezoneOptions(): Array<{ value: string; label: string; offset: string }> {
  const commonTimezones = [
    { value: 'Europe/Moscow', label: 'Moscow (MSK)', offset: '+03:00' },
    { value: 'Europe/Kiev', label: 'Kyiv (EET)', offset: '+02:00' },
    { value: 'Europe/London', label: 'London (GMT)', offset: '+00:00' },
    { value: 'America/New_York', label: 'New York (EST)', offset: '-05:00' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST)', offset: '-08:00' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: '+09:00' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)', offset: '+08:00' },
  ];

  return commonTimezones;
}

