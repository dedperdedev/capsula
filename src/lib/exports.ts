/**
 * Export Module
 * Generates CSV history, ICS calendar, and encrypted JSON exports
 */

import { loadAppState, appendEvent } from '../data/storage';
import { format, addDays, eachDayOfInterval, getDay } from 'date-fns';

// ============ CSV EXPORT ============

export interface CSVExportOptions {
  days?: number;
  profileId?: string;
}

export function exportDoseHistoryCSV(options: CSVExportOptions = {}): string {
  const { days = 90, profileId } = options;
  const state = loadAppState();
  const targetProfileId = profileId || state.activeProfileId;
  
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  // Get relevant events
  const doseEvents = state.events
    .filter(e => 
      ['DOSE_TAKEN', 'DOSE_SKIPPED', 'DOSE_POSTPONED'].includes(e.type) &&
      e.profileId === targetProfileId &&
      new Date(e.ts) >= cutoff
    )
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

  // Build CSV
  const headers = ['date', 'planned_time', 'actual_time', 'medication', 'amount', 'unit', 'status', 'reason', 'profile'];
  const rows: string[][] = [];

  for (const event of doseEvents) {
    const medication = state.medications.find(m => m.id === event.entityId);
    const schedule = state.schedules.find(s => s.medicationId === event.entityId);
    const profile = state.profiles.find(p => p.id === event.profileId);
    const meta = event.metadata as Record<string, string>;

    const status = event.type === 'DOSE_TAKEN' ? 'taken' 
                 : event.type === 'DOSE_SKIPPED' ? 'skipped' 
                 : 'postponed';

    rows.push([
      format(new Date(event.ts), 'yyyy-MM-dd'),
      meta.scheduledFor ? format(new Date(meta.scheduledFor), 'HH:mm') : '',
      format(new Date(event.ts), 'HH:mm'),
      medication?.name || 'Unknown',
      schedule?.dose || '1',
      medication?.unit || 'dose',
      status,
      meta.reason || '',
      profile?.name || 'Default',
    ]);
  }

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

export function downloadCSV(filename: string = 'capsula-history.csv'): void {
  const csv = exportDoseHistoryCSV();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  appendEvent({
    profileId: loadAppState().activeProfileId || 'system',
    ts: new Date().toISOString(),
    type: 'EXPORT_CREATED',
    metadata: { format: 'csv', filename },
  });
}

// ============ ICS CALENDAR EXPORT ============

export interface ICSExportOptions {
  days?: number;
  profileId?: string;
}

/**
 * Generate ICS calendar file for upcoming scheduled doses
 */
export function exportScheduleICS(options: ICSExportOptions = {}): string {
  const { days = 30, profileId } = options;
  const state = loadAppState();
  const targetProfileId = profileId || state.activeProfileId;
  
  const startDate = new Date();
  const endDate = addDays(startDate, days);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  const events: string[] = [];

  // Generate events for each schedule
  for (const schedule of state.schedules) {
    if (schedule.profileId !== targetProfileId) continue;
    if (schedule.isPaused) continue;

    const medication = state.medications.find(m => m.id === schedule.medicationId);
    if (!medication) continue;

    // Get times from scheme
    let times: string[] = [];
    let weekdays: number[] | null = null;

    const scheme = schedule.scheme;
    if (scheme.type === 'daily' || scheme.type === 'courseDays') {
      times = scheme.times;
    } else if (scheme.type === 'weekly') {
      times = scheme.times;
      weekdays = scheme.weekdays;
    } else if (scheme.type === 'intervalDays') {
      times = scheme.times;
    }
    // Skip PRN and intervalHours for calendar

    if (times.length === 0) continue;

    for (const date of dateRange) {
      // Check if schedule is active on this date
      if (schedule.startDate && date < new Date(schedule.startDate)) continue;
      if (schedule.endDate && date > new Date(schedule.endDate)) continue;

      // Check weekday filter
      if (weekdays && !weekdays.includes(getDay(date))) continue;

      for (const time of times) {
        const [hours, minutes] = time.split(':').map(Number);
        const eventDate = new Date(date);
        eventDate.setHours(hours, minutes, 0, 0);

        if (eventDate < startDate) continue;

        const uid = `${schedule.id}-${format(eventDate, 'yyyyMMddHHmm')}@capsula`;
        const dtStart = formatICSDate(eventDate);
        const dtEnd = formatICSDate(new Date(eventDate.getTime() + 15 * 60 * 1000)); // 15 min duration

        const summary = `💊 ${medication.name} ${schedule.dose}`;
        const description = formatEventDescription(medication, schedule);

        events.push(
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${formatICSDate(new Date())}`,
          `DTSTART:${dtStart}`,
          `DTEND:${dtEnd}`,
          `SUMMARY:${escapeICS(summary)}`,
          `DESCRIPTION:${escapeICS(description)}`,
          'STATUS:CONFIRMED',
          'BEGIN:VALARM',
          'TRIGGER:-PT10M',
          'ACTION:DISPLAY',
          'DESCRIPTION:Reminder',
          'END:VALARM',
          'END:VEVENT'
        );
      }
    }
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Capsula//Medication Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Capsula Medications',
    'X-WR-TIMEZONE:UTC',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  return icsContent;
}

function formatICSDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss'Z'");
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function formatEventDescription(medication: any, schedule: any): string {
  const parts = [
    `Medication: ${medication.name}`,
    `Dose: ${schedule.dose}`,
  ];
  
  if (schedule.withFood) {
    parts.push(`With food: ${schedule.withFood}`);
  }
  
  if (medication.notes) {
    parts.push(`Notes: ${medication.notes}`);
  }

  return parts.join('\\n');
}

export function downloadICS(filename: string = 'capsula-schedule.ics', days: number = 30): void {
  const ics = exportScheduleICS({ days });
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  appendEvent({
    profileId: loadAppState().activeProfileId || 'system',
    ts: new Date().toISOString(),
    type: 'EXPORT_CREATED',
    metadata: { format: 'ics', filename, days },
  });
}

// ============ ENCRYPTED JSON EXPORT ============

export interface EncryptedBackup {
  version: number;
  salt: string;
  iv: string;
  data: string; // Base64 encoded encrypted data
}

/**
 * Encrypt data using AES-GCM with PBKDF2-derived key
 */
export async function encryptBackup(password: string): Promise<EncryptedBackup> {
  const state = loadAppState();
  const dataStr = JSON.stringify(state);
  
  // Generate salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Derive key from password
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Encrypt data
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(dataStr)
  );
  
  return {
    version: 1,
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    data: arrayBufferToBase64(encrypted),
  };
}

/**
 * Decrypt encrypted backup
 */
export async function decryptBackup(backup: EncryptedBackup, password: string): Promise<unknown> {
  const salt = base64ToArrayBuffer(backup.salt);
  const iv = base64ToArrayBuffer(backup.iv);
  const data = base64ToArrayBuffer(backup.data);
  
  // Derive key from password
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(salt as ArrayBuffer),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  // Decrypt data
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv as ArrayBuffer) },
    key,
    data
  );
  
  const jsonStr = new TextDecoder().decode(decrypted);
  return JSON.parse(jsonStr);
}

export async function downloadEncryptedBackup(password: string, filename: string = 'capsula-encrypted-backup.json'): Promise<void> {
  const encrypted = await encryptBackup(password);
  const blob = new Blob([JSON.stringify(encrypted, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  appendEvent({
    profileId: loadAppState().activeProfileId || 'system',
    ts: new Date().toISOString(),
    type: 'EXPORT_CREATED',
    metadata: { format: 'encrypted_json', filename },
  });
}

// ============ HELPERS ============

function arrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferLike | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as ArrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

