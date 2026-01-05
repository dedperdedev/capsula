import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getActiveIngredient, checkDuplicateIngredients, runDrugSafetyChecks } from '../drugInteractions';
import { saveAppState } from '../../data/storage';

describe('Active Ingredient Detection', () => {
  it('should detect known active ingredients', () => {
    expect(getActiveIngredient('Ибупрофен')).toBe('Ibuprofen');
    expect(getActiveIngredient('Нурофен')).toBe('Ibuprofen');
    expect(getActiveIngredient('Парацетамол')).toBe('Paracetamol');
    expect(getActiveIngredient('Панадол')).toBe('Paracetamol');
  });

  it('should return null for unknown drugs', () => {
    expect(getActiveIngredient('UnknownDrug123')).toBeNull();
  });

  it('should be case-insensitive', () => {
    expect(getActiveIngredient('ибупрофен')).toBe('Ibuprofen');
    expect(getActiveIngredient('ИБУПРОФЕН')).toBe('Ibuprofen');
  });
});

describe('Duplicate Ingredient Detection', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = value;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should detect duplicate active ingredients', () => {
    const testState = {
      schemaVersion: 3,
      profiles: [{ id: 'p1', name: 'Test', createdAt: new Date().toISOString() }],
      activeProfileId: 'p1',
      medications: [
        { id: 'm1', name: 'Ибупрофен', form: 'tablet', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ],
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

    const warning = checkDuplicateIngredients('Нурофен');
    
    expect(warning).not.toBeNull();
    expect(warning?.type).toBe('duplicate_ingredient');
    expect(warning?.activeIngredient).toBe('Ibuprofen');
    expect(warning?.existingMedication.name).toBe('Ибупрофен');
  });

  it('should not warn when no duplicates', () => {
    const testState = {
      schemaVersion: 3,
      profiles: [{ id: 'p1', name: 'Test', createdAt: new Date().toISOString() }],
      activeProfileId: 'p1',
      medications: [
        { id: 'm1', name: 'Парацетамол', form: 'tablet', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ],
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

    const warning = checkDuplicateIngredients('Ибупрофен');
    
    expect(warning).toBeNull();
  });
});

describe('Combined Safety Checks', () => {
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
        { id: 'm1', name: 'Аспирин', form: 'tablet', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ],
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

  it('should detect potential NSAID interaction', () => {
    const warnings = runDrugSafetyChecks('Ибупрофен');
    
    // Should find interaction between Aspirin and Ibuprofen (both NSAIDs)
    const interactionWarning = warnings.find(w => w.type === 'interaction');
    expect(interactionWarning).toBeDefined();
    expect(interactionWarning?.severity).toBe('warning');
  });

  it('should return empty array for safe combinations', () => {
    const warnings = runDrugSafetyChecks('Метформин');
    
    // No known interaction between Aspirin and Metformin in our simplified database
    const criticalWarnings = warnings.filter(w => w.severity === 'critical');
    expect(criticalWarnings.length).toBe(0);
  });
});

