import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { exportDoseHistoryCSV, exportScheduleICS } from '../exports';
import { saveAppState } from '../../data/storage';

describe('CSV Export', () => {
  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = value;
    });
    
    // Setup test data
    const testState = {
      schemaVersion: 3,
      profiles: [{ id: 'p1', name: 'Test', createdAt: new Date().toISOString() }],
      activeProfileId: 'p1',
      medications: [
        { id: 'm1', name: 'Aspirin', form: 'tablet', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ],
      schedules: [
        { id: 's1', medicationId: 'm1', profileId: 'p1', startDate: '2024-01-01', scheme: { type: 'daily', timesPerDay: 1, times: ['08:00'] }, dose: '1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ],
      inventory: [],
      events: [
        {
          id: 'e1',
          profileId: 'p1',
          ts: new Date().toISOString(),
          type: 'DOSE_TAKEN',
          entityId: 'm1',
          metadata: { scheduledFor: new Date().toISOString() },
          createdAt: new Date().toISOString()
        }
      ],
      settings: {
        remindersEnabled: true,
        reminderOffsets: [0],
        autoDecrementInventory: true,
        theme: 'light',
        locale: 'en',
        guardianFollowUpMinutes: [10, 30, 60],
        guardianMaxRepeats: 3,
        refillRemindersEnabled: true,
        refillThresholdDays: 3,
        appLockEnabled: false,
        appLockTimeoutMinutes: 0,
      },
      guardianContacts: [],
      symptomEntries: [],
      measurementEntries: [],
    };
    
    saveAppState(testState as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate CSV with correct headers', () => {
    const csv = exportDoseHistoryCSV();
    const lines = csv.split('\n');
    
    expect(lines[0]).toBe('date,planned_time,actual_time,medication,amount,unit,status,reason,profile');
  });

  it('should include dose events in CSV', () => {
    const csv = exportDoseHistoryCSV();
    const lines = csv.split('\n');
    
    expect(lines.length).toBeGreaterThan(1);
    expect(csv).toContain('Aspirin');
    expect(csv).toContain('taken');
  });

  it('should respect days filter', () => {
    const csv = exportDoseHistoryCSV({ days: 1 });
    expect(csv).toBeDefined();
  });
});

describe('ICS Export', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = value;
    });
    
    const testState = {
      schemaVersion: 3,
      profiles: [{ id: 'p1', name: 'Test', createdAt: new Date().toISOString() }],
      activeProfileId: 'p1',
      medications: [
        { id: 'm1', name: 'VitaminD', form: 'capsule', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ],
      schedules: [
        { id: 's1', medicationId: 'm1', profileId: 'p1', startDate: '2024-01-01', scheme: { type: 'daily', timesPerDay: 1, times: ['09:00'] }, dose: '1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ],
      inventory: [],
      events: [],
      settings: {
        remindersEnabled: true,
        reminderOffsets: [0],
        autoDecrementInventory: true,
        theme: 'light',
        locale: 'en',
        guardianFollowUpMinutes: [10, 30, 60],
        guardianMaxRepeats: 3,
        refillRemindersEnabled: true,
        refillThresholdDays: 3,
        appLockEnabled: false,
        appLockTimeoutMinutes: 0,
      },
      guardianContacts: [],
      symptomEntries: [],
      measurementEntries: [],
    };
    
    saveAppState(testState as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate valid ICS format', () => {
    const ics = exportScheduleICS({ days: 7 });
    
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('PRODID:-//Capsula//Medication Tracker//EN');
  });

  it('should include medication events', () => {
    const ics = exportScheduleICS({ days: 7 });
    
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('VitaminD');
  });

  it('should include alarm reminders', () => {
    const ics = exportScheduleICS({ days: 7 });
    
    expect(ics).toContain('BEGIN:VALARM');
    expect(ics).toContain('TRIGGER:-PT10M');
  });
});

