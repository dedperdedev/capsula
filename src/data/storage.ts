/**
 * Versioned storage layer with migrations
 * This is the single source of truth for all app data
 */

export const CURRENT_SCHEMA_VERSION = 4;

export interface AppState {
  schemaVersion: number;
  profiles: Profile[];
  activeProfileId: string | null;
  medications: Medication[];
  schedules: Schedule[];
  inventory: InventoryItem[];
  events: Event[];
  settings: AppSettings;
  // New in v3
  guardianContacts: GuardianContact[];
  symptomEntries: SymptomEntry[];
  measurementEntries: MeasurementEntry[];
  pinHash?: string; // PBKDF2 hash of PIN
  pinSalt?: string; // Salt for PIN
  // New in v4
  shoppingList: ShoppingItem[];
  routineAnchors: RoutineAnchor[];
  sharePackages: SharePackage[];
}

export interface Profile {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  // Guardian mode
  guardianModeEnabled?: boolean;
  guardianFollowUpWindow?: number; // minutes after grace window to consider "missed"
}

export interface Medication {
  id: string;
  name: string;
  form: string;
  strength?: string;
  unit?: string;
  notes?: string;
  defaultWithFood?: 'before' | 'after' | 'none';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  medicationId: string;
  profileId: string;
  startDate: string;
  endDate?: string;
  timezone?: string;
  scheme: ScheduleScheme;
  dose: string;
  withFood?: 'before' | 'after' | 'none';
  createdAt: string;
  updatedAt: string;
  isPaused?: boolean;
}

export type ScheduleScheme = 
  | { type: 'daily'; timesPerDay: number; times: string[] }
  | { type: 'weekly'; weekdays: number[]; times: string[] }
  | { type: 'intervalDays'; interval: number; times: string[] }
  | { type: 'intervalHours'; interval: number }
  | { type: 'courseDays'; days: number; times: string[] }
  | { type: 'prn'; minIntervalHours?: number; maxPerDay?: number };

export interface InventoryItem {
  id: string;
  medicationId: string;
  profileId: string;
  quantity: number;
  quantityUnit: string;
  packSize?: number;
  lowStockThreshold?: number;
  createdAt: string;
  updatedAt: string;
}

export type EventType =
  | 'DOSE_SCHEDULED'
  | 'DOSE_TAKEN'
  | 'DOSE_SKIPPED'
  | 'DOSE_POSTPONED'
  | 'DOSE_UNDONE'
  | 'INVENTORY_ADJUSTED'
  | 'SCHEDULE_CREATED'
  | 'SCHEDULE_UPDATED'
  | 'SCHEDULE_PAUSED'
  | 'SCHEDULE_RESUMED'
  | 'PROFILE_CREATED'
  | 'PROFILE_UPDATED'
  | 'PROFILE_SWITCHED'
  | 'DATA_IMPORTED'
  // New event types
  | 'SYMPTOM_LOGGED'
  | 'MEASUREMENT_LOGGED'
  | 'GUARDIAN_ALERT_TRIGGERED'
  | 'GUARDIAN_ALERT_ACKNOWLEDGED'
  | 'REFILL_REMINDER_TRIGGERED'
  | 'BATCH_DOSES_MARKED'
  | 'PIN_ENABLED'
  | 'PIN_DISABLED'
  | 'EXPORT_CREATED';

export interface Event {
  id: string;
  profileId: string;
  ts: string; // ISO timestamp
  type: EventType;
  entityId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AppSettings {
  remindersEnabled: boolean;
  reminderOffsets: number[]; // minutes before
  quietHoursStart?: string; // HH:mm
  quietHoursEnd?: string; // HH:mm
  quietWeekdays?: number[]; // 0-6
  autoDecrementInventory: boolean;
  theme: 'light' | 'dark';
  locale: 'ru' | 'en';
  // Caregiver settings
  guardianFollowUpMinutes: number[]; // e.g. [10, 30, 60]
  guardianMaxRepeats: number;
  // Refill reminder settings
  refillRemindersEnabled: boolean;
  refillThresholdDays: number; // default 3
  // App lock settings
  appLockEnabled: boolean;
  appLockTimeoutMinutes: number; // 0 = lock immediately on background
  // Routine anchor settings (v4)
  wakeTime?: string; // HH:mm
  breakfastTime?: string; // HH:mm
  lunchTime?: string; // HH:mm
  dinnerTime?: string; // HH:mm
  bedTime?: string; // HH:mm
  // Travel/timezone settings (v4)
  timezone?: string; // IANA timezone (e.g., "Europe/Moscow")
  travelModeEnabled?: boolean;
}

// ============ GUARDIAN MODE ============

export interface GuardianContact {
  id: string;
  profileId: string;
  name: string;
  relation?: string; // e.g. "Caregiver", "Family", "Doctor"
  notifyMode: 'IN_APP' | 'PUSH';
  enabled: boolean;
  createdAt: string;
}

export interface MissedDoseAlert {
  id: string;
  profileId: string;
  medicationId: string;
  medicationName: string;
  scheduledTime: string; // ISO
  missedAt: string; // ISO when detected as missed
  acknowledged: boolean;
}

// ============ SYMPTOM DIARY ============

export type SymptomType = 
  | 'headache' | 'nausea' | 'dizziness' | 'fatigue' | 'insomnia'
  | 'stomach_pain' | 'rash' | 'anxiety' | 'other';

export interface SymptomEntry {
  id: string;
  profileId: string;
  ts: string; // ISO timestamp
  symptomType: SymptomType;
  severity: number; // 1-10
  note?: string;
  relatedMedicationId?: string;
  relatedDoseId?: string;
  createdAt: string;
}

// ============ MEASUREMENTS ============

export type MeasurementType = 
  | 'BP' | 'GLUCOSE' | 'WEIGHT' | 'TEMP' | 'HR' | 'SPO2' | 'CUSTOM';

export interface MeasurementEntry {
  id: string;
  profileId: string;
  ts: string; // ISO timestamp
  type: MeasurementType;
  value: string; // Can be "120/80" for BP or single number
  unit: string; // "mmHg", "mg/dL", "kg", "°C", "bpm", "%"
  note?: string;
  createdAt: string;
}

// ============ SHOPPING LIST (v4) ============

export interface ShoppingItem {
  id: string;
  profileId: string;
  medicationId: string;
  medicationName: string;
  quantity?: number;
  note?: string;
  status: 'pending' | 'purchased' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// ============ ROUTINE ANCHORS (v4) ============

export type AnchorType = 'after_wake' | 'after_breakfast' | 'after_lunch' | 'after_dinner' | 'before_sleep';

export interface RoutineAnchor {
  id: string;
  profileId: string;
  scheduleId: string;
  anchorType: AnchorType;
  offsetMinutes: number; // Offset from anchor time (e.g., +30 min after breakfast)
  createdAt: string;
  updatedAt: string;
}

// ============ SHARE PACKAGES (v4) ============

export interface SharePackage {
  id: string;
  profileId: string;
  code: string; // 6-digit code or UUID
  encryptedData?: string; // Encrypted JSON payload
  expiresAt?: string; // ISO timestamp
  viewOnly: boolean;
  createdAt: string;
  accessedAt?: string;
  accessCount: number;
}

const STORAGE_KEY = 'capsula_app_state';
const BACKUP_KEY = 'capsula_app_state_backup';
const CHECKSUM_KEY = 'capsula_checksum';

interface StorageSnapshot {
  data: AppState;
  checksum: string;
  timestamp: string;
}

/**
 * Simple hash function for checksum (djb2 algorithm)
 */
function calculateChecksum(data: string): string {
  let hash = 5381;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) + hash) + data.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

/**
 * Verify data integrity using checksum
 */
function verifyChecksum(data: string, expectedChecksum: string): boolean {
  return calculateChecksum(data) === expectedChecksum;
}

function loadState(): AppState | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const checksum = localStorage.getItem(CHECKSUM_KEY);
    
    if (!stored) return null;
    
    // Verify checksum if available
    if (checksum && !verifyChecksum(stored, checksum)) {
      console.warn('Storage corruption detected! Attempting recovery from backup...');
      return loadFromBackup();
    }
    
    return JSON.parse(stored) as AppState;
  } catch (error) {
    console.error('Failed to load state:', error);
    console.log('Attempting recovery from backup...');
    return loadFromBackup();
  }
}

function loadFromBackup(): AppState | null {
  try {
    const backup = localStorage.getItem(BACKUP_KEY);
    if (!backup) {
      console.warn('No backup available');
      return null;
    }
    
    const snapshot: StorageSnapshot = JSON.parse(backup);
    
    // Verify backup checksum
    const dataStr = JSON.stringify(snapshot.data);
    if (!verifyChecksum(dataStr, snapshot.checksum)) {
      console.error('Backup is also corrupted!');
      return null;
    }
    
    console.log(`Recovered from backup dated ${snapshot.timestamp}`);
    
    // Restore from backup
    localStorage.setItem(STORAGE_KEY, dataStr);
    localStorage.setItem(CHECKSUM_KEY, snapshot.checksum);
    
    return snapshot.data;
  } catch (error) {
    console.error('Failed to recover from backup:', error);
    return null;
  }
}

function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  
  try {
    const dataStr = JSON.stringify(state);
    const checksum = calculateChecksum(dataStr);
    
    // Create backup of current state before overwriting
    const currentData = localStorage.getItem(STORAGE_KEY);
    const currentChecksum = localStorage.getItem(CHECKSUM_KEY);
    
    if (currentData && currentChecksum && verifyChecksum(currentData, currentChecksum)) {
      // Current state is valid, save it as backup
      const backup: StorageSnapshot = {
        data: JSON.parse(currentData),
        checksum: currentChecksum,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
    }
    
    // Atomic write: write new state and checksum
    localStorage.setItem(STORAGE_KEY, dataStr);
    localStorage.setItem(CHECKSUM_KEY, checksum);
  } catch (error) {
    console.error('Failed to save state:', error);
    throw new StorageError('Failed to save application state', error);
  }
}

/**
 * Custom error for storage failures
 */
export class StorageError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Check storage health
 */
export function checkStorageHealth(): { 
  isHealthy: boolean; 
  hasBackup: boolean; 
  corruption: boolean;
  message: string;
} {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const checksum = localStorage.getItem(CHECKSUM_KEY);
    const backup = localStorage.getItem(BACKUP_KEY);
    
    if (!stored) {
      return { isHealthy: true, hasBackup: false, corruption: false, message: 'No data stored' };
    }
    
    const isChecksumValid = checksum && verifyChecksum(stored, checksum);
    
    return {
      isHealthy: isChecksumValid || !checksum,
      hasBackup: !!backup,
      corruption: !isChecksumValid && !!checksum,
      message: isChecksumValid ? 'Storage is healthy' : 'Checksum mismatch detected',
    };
  } catch (error) {
    return {
      isHealthy: false,
      hasBackup: false,
      corruption: true,
      message: `Storage error: ${error}`,
    };
  }
}

/**
 * Force restore from backup
 */
export function forceRestoreFromBackup(): AppState | null {
  return loadFromBackup();
}

/**
 * Create manual backup
 */
export function createManualBackup(): boolean {
  try {
    const state = loadAppState();
    const dataStr = JSON.stringify(state);
    const checksum = calculateChecksum(dataStr);
    
    const backup: StorageSnapshot = {
      data: state,
      checksum,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
    return true;
  } catch {
    return false;
  }
}

function createDefaultState(): AppState {
  const defaultProfile: Profile = {
    id: crypto.randomUUID(),
    name: 'Default',
    createdAt: new Date().toISOString(),
  };

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profiles: [defaultProfile],
    activeProfileId: defaultProfile.id,
    medications: [],
    schedules: [],
    inventory: [],
    events: [],
    settings: {
      remindersEnabled: true,
      reminderOffsets: [0, 10, 30],
      autoDecrementInventory: true,
      theme: 'light',
      locale: 'ru',
      // New v3 settings
      guardianFollowUpMinutes: [10, 30, 60],
      guardianMaxRepeats: 3,
      refillRemindersEnabled: true,
      refillThresholdDays: 3,
      appLockEnabled: false,
      appLockTimeoutMinutes: 0,
    },
    // New v3 fields
    guardianContacts: [],
    symptomEntries: [],
    measurementEntries: [],
    // New v4 fields
    shoppingList: [],
    routineAnchors: [],
    sharePackages: [],
  };
}

function migrateFromV3(state: AppState): AppState {
  // Add new v4 fields
  return {
    ...state,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    shoppingList: state.shoppingList || [],
    routineAnchors: state.routineAnchors || [],
    sharePackages: state.sharePackages || [],
  };
}

function migrateFromV2(state: AppState): AppState {
  // Add new v3 fields
  return {
    ...state,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    guardianContacts: state.guardianContacts || [],
    symptomEntries: state.symptomEntries || [],
    measurementEntries: state.measurementEntries || [],
    settings: {
      ...state.settings,
      guardianFollowUpMinutes: state.settings.guardianFollowUpMinutes || [10, 30, 60],
      guardianMaxRepeats: state.settings.guardianMaxRepeats || 3,
      refillRemindersEnabled: state.settings.refillRemindersEnabled ?? true,
      refillThresholdDays: state.settings.refillThresholdDays || 3,
      appLockEnabled: state.settings.appLockEnabled || false,
      appLockTimeoutMinutes: state.settings.appLockTimeoutMinutes || 0,
    },
  };
}

function migrateFromV1(_state: any): AppState {
  // Migrate from old localStorage structure
  const oldItems = loadJSON<any[]>('capsula_items', []);
  const oldSchedules = loadJSON<any[]>('capsula_schedules', []);
  const oldDoseLogs = loadJSON<any[]>('capsula_dose_logs', []);
  const oldInventory = loadJSON<any[]>('capsula_inventory', []);

  const defaultProfile: Profile = {
    id: crypto.randomUUID(),
    name: 'Default',
    createdAt: new Date().toISOString(),
  };

  // Convert old items to medications
  const medications: Medication[] = oldItems.map(item => ({
    id: item.id,
    name: item.name,
    form: item.form,
    notes: item.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // Convert old schedules
  const schedules: Schedule[] = oldSchedules.map(schedule => ({
    id: schedule.id,
    medicationId: schedule.itemId,
    profileId: defaultProfile.id,
    startDate: schedule.startDate || new Date().toISOString().split('T')[0],
    endDate: schedule.endDate,
    scheme: {
      type: 'weekly',
      weekdays: schedule.daysOfWeek || [],
      times: schedule.times || [],
    },
    dose: '1',
    withFood: schedule.withFood,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPaused: !schedule.enabled,
  }));

  // Convert old inventory
  const inventory: InventoryItem[] = oldInventory.map(inv => ({
    id: crypto.randomUUID(),
    medicationId: inv.itemId,
    profileId: defaultProfile.id,
    quantity: inv.remainingUnits,
    quantityUnit: inv.unitLabel,
    lowStockThreshold: inv.lowThreshold,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // Convert old dose logs to events
  const events: Event[] = oldDoseLogs.map(log => ({
    id: crypto.randomUUID(),
    profileId: defaultProfile.id,
    ts: log.scheduledFor,
    type: log.action === 'taken' ? 'DOSE_TAKEN' : 
          log.action === 'skipped' ? 'DOSE_SKIPPED' : 
          'DOSE_POSTPONED',
    entityId: log.itemId,
    metadata: {
      scheduledFor: log.scheduledFor,
      reason: log.reason,
      snoozeUntil: log.snoozeUntil,
    },
    createdAt: log.createdAt,
  }));

  return {
    schemaVersion: 2, // Return as v2, then migrateFromV2 will upgrade to v3, then v3->v4
    profiles: [defaultProfile],
    activeProfileId: defaultProfile.id,
    medications,
    schedules,
    inventory,
    events,
    settings: {
      remindersEnabled: true,
      reminderOffsets: [0, 10, 30],
      autoDecrementInventory: true,
      theme: 'light',
      locale: 'ru',
      // Will be added by v2->v3 migration
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
    // Will be added by v3->v4 migration
    shoppingList: [],
    routineAnchors: [],
    sharePackages: [],
  };
}

function loadJSON<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
}

export function loadAppState(): AppState {
  const state = loadState();
  
  if (!state) {
    // Check for old format
    const hasOldData = 
      loadJSON('capsula_items', []).length > 0 ||
      loadJSON('capsula_schedules', []).length > 0;
    
    if (hasOldData) {
      console.log('Migrating from v1 to v2...');
      const migrated = migrateFromV1(null);
      saveState(migrated);
      return migrated;
    }
    
    return createDefaultState();
  }

  // Migrate if needed
  if (state.schemaVersion < CURRENT_SCHEMA_VERSION) {
    console.log(`Migrating from v${state.schemaVersion} to v${CURRENT_SCHEMA_VERSION}...`);
    let migrated = state;
    
    if (migrated.schemaVersion === 1) {
      migrated = migrateFromV1(migrated);
    }
    if (migrated.schemaVersion === 2) {
      migrated = migrateFromV2(migrated);
    }
    if (migrated.schemaVersion === 3) {
      migrated = migrateFromV3(migrated);
    }
    
    saveState(migrated);
    return migrated;
  }

  return state;
}

export function saveAppState(state: AppState): void {
  state.schemaVersion = CURRENT_SCHEMA_VERSION;
  saveState(state);
}

export function appendEvent(event: Omit<Event, 'id' | 'createdAt'>): Event {
  const state = loadAppState();
  const newEvent: Event = {
    ...event,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  state.events.push(newEvent);
  saveAppState(state);
  return newEvent;
}

