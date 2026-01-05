import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { addSymptomEntry, getSymptomEntries, addMeasurementEntry, getMeasurementEntries, getSymptomsAfterDoses, SYMPTOM_LABELS, MEASUREMENT_LABELS } from '../diary';
import { saveAppState } from '../../data/storage';

describe('Symptom Diary', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = value;
    });

    // Initialize test state
    const testState = {
      schemaVersion: 3,
      profiles: [{ id: 'p1', name: 'Test', createdAt: new Date().toISOString() }],
      activeProfileId: 'p1',
      medications: [],
      schedules: [],
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

  it('should add a symptom entry', () => {
    const entry = addSymptomEntry({
      symptomType: 'headache',
      severity: 7,
      note: 'After lunch',
    });

    expect(entry).toBeDefined();
    expect(entry.symptomType).toBe('headache');
    expect(entry.severity).toBe(7);
    expect(entry.note).toBe('After lunch');
  });

  it('should retrieve symptom entries', () => {
    addSymptomEntry({ symptomType: 'nausea', severity: 5 });
    addSymptomEntry({ symptomType: 'dizziness', severity: 3 });

    const entries = getSymptomEntries();
    
    expect(entries.length).toBe(2);
  });

  it('should clamp severity to 1-10 range', () => {
    const entry1 = addSymptomEntry({ symptomType: 'fatigue', severity: 15 });
    const entry2 = addSymptomEntry({ symptomType: 'fatigue', severity: -5 });

    expect(entry1.severity).toBe(10);
    expect(entry2.severity).toBe(1);
  });

  it('should have labels for all symptom types', () => {
    expect(SYMPTOM_LABELS.headache.ru).toBeDefined();
    expect(SYMPTOM_LABELS.headache.en).toBeDefined();
    expect(SYMPTOM_LABELS.headache.emoji).toBeDefined();
  });
});

describe('Measurements', () => {
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
      medications: [],
      schedules: [],
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

  it('should add a measurement entry', () => {
    const entry = addMeasurementEntry({
      type: 'BP',
      value: '120/80',
      unit: 'mmHg',
    });

    expect(entry).toBeDefined();
    expect(entry.type).toBe('BP');
    expect(entry.value).toBe('120/80');
  });

  it('should retrieve measurement entries', () => {
    addMeasurementEntry({ type: 'WEIGHT', value: '70', unit: 'kg' });
    addMeasurementEntry({ type: 'TEMP', value: '36.6', unit: '°C' });

    const entries = getMeasurementEntries();
    
    expect(entries.length).toBe(2);
  });

  it('should have labels for all measurement types', () => {
    expect(MEASUREMENT_LABELS.BP.ru).toBeDefined();
    expect(MEASUREMENT_LABELS.BP.defaultUnit).toBe('mmHg');
    expect(MEASUREMENT_LABELS.GLUCOSE.defaultUnit).toBe('mg/dL');
  });
});

describe('Symptom-Dose Correlations', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = value;
    });

    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const testState = {
      schemaVersion: 3,
      profiles: [{ id: 'p1', name: 'Test', createdAt: new Date().toISOString() }],
      activeProfileId: 'p1',
      medications: [{ id: 'm1', name: 'TestMed', form: 'tablet', createdAt: now.toISOString(), updatedAt: now.toISOString() }],
      schedules: [],
      inventory: [],
      events: [
        {
          id: 'e1',
          profileId: 'p1',
          ts: twoHoursAgo.toISOString(),
          type: 'DOSE_TAKEN',
          entityId: 'm1',
          metadata: {},
          createdAt: twoHoursAgo.toISOString(),
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
      symptomEntries: [
        {
          id: 's1',
          profileId: 'p1',
          ts: now.toISOString(),
          symptomType: 'nausea',
          severity: 5,
          createdAt: now.toISOString(),
        }
      ],
      measurementEntries: [],
    };

    saveAppState(testState as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should find symptoms after doses', () => {
    const correlations = getSymptomsAfterDoses(24, 7);
    
    expect(correlations.length).toBe(1);
    expect(correlations[0].symptom.symptomType).toBe('nausea');
    expect(correlations[0].dose.medicationName).toBe('TestMed');
    expect(correlations[0].hoursAfter).toBeCloseTo(2, 0);
  });
});

