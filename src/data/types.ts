export type ItemType = 'medication' | 'supplement';
export type ItemForm = 'tablet' | 'capsule' | 'syrup' | 'injection' | 'powder' | 'drops' | 'spray' | 'patch' | 'other';
export type DoseAction = 'taken' | 'skipped' | 'snoozed';
export type DoseTimingStatus = 'pending' | 'on_time' | 'late' | 'missed';
export type TimePolicy = 'LOCAL_TIME' | 'ABSOLUTE_UTC';
export type ScheduleMode = 'scheduled' | 'prn'; // prn = "as needed"

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  form: ItemForm;
  notes?: string;
  doseText?: string;
}

export interface Schedule {
  id: string;
  itemId: string;
  times: string[]; // "HH:mm"
  daysOfWeek: number[]; // 0-6, Sunday = 0
  startDate?: string; // "yyyy-MM-dd"
  endDate?: string; // "yyyy-MM-dd"
  withFood?: 'before' | 'after' | 'none';
  enabled: boolean;
  // Quality layer additions
  graceWindowMinutes?: number; // Default: 60. ON_TIME if |actual-planned| <= window
  timePolicy?: TimePolicy; // Default: LOCAL_TIME
  mode?: ScheduleMode; // Default: scheduled
  // PRN mode settings
  prnMinIntervalHours?: number; // Minimum hours between PRN doses
  prnMaxPerDay?: number; // Maximum PRN doses per day
  profileId?: string; // Profile this schedule belongs to
}

export interface DoseLog {
  id: string;
  itemId: string;
  scheduledFor: string; // ISO string
  action: DoseAction;
  reason?: string;
  snoozeUntil?: string; // ISO string
  createdAt: string; // ISO string
}

export interface Inventory {
  itemId: string;
  remainingUnits: number;
  unitLabel: string;
  lowThreshold: number;
}

export interface DoseEvent {
  itemId: string;
  itemName: string;
  scheduledFor: string; // ISO string
  withFood?: 'before' | 'after' | 'none';
}



