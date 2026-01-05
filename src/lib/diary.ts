/**
 * Symptom Diary and Measurements Module
 * Handles logging, retrieval, and analysis of symptoms and measurements
 */

import { 
  loadAppState, 
  saveAppState, 
  appendEvent,
  type SymptomType,
  type MeasurementType,
  type SymptomEntry,
  type MeasurementEntry,
} from '../data/storage';

// Re-export types for convenience
export type { SymptomEntry, MeasurementEntry, SymptomType, MeasurementType } from '../data/storage';

// ============ SYMPTOM OPERATIONS ============

export interface AddSymptomParams {
  symptomType: SymptomType;
  severity: number;
  note?: string;
  relatedMedicationId?: string;
  relatedDoseId?: string;
  ts?: string; // Default: now
}

export function addSymptomEntry(params: AddSymptomParams): SymptomEntry {
  const state = loadAppState();
  const now = new Date().toISOString();

  const entry: SymptomEntry = {
    id: crypto.randomUUID(),
    profileId: state.activeProfileId || '',
    ts: params.ts || now,
    symptomType: params.symptomType,
    severity: Math.min(10, Math.max(1, params.severity)),
    note: params.note,
    relatedMedicationId: params.relatedMedicationId,
    relatedDoseId: params.relatedDoseId,
    createdAt: now,
  };

  state.symptomEntries.push(entry);
  saveAppState(state);

  appendEvent({
    profileId: entry.profileId,
    ts: entry.ts,
    type: 'SYMPTOM_LOGGED',
    entityId: entry.id,
    metadata: {
      symptomType: entry.symptomType,
      severity: entry.severity,
      relatedMedicationId: entry.relatedMedicationId,
    },
  });

  return entry;
}

export function getSymptomEntries(profileId?: string, days: number = 30): SymptomEntry[] {
  const state = loadAppState();
  const targetProfileId = profileId || state.activeProfileId;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return state.symptomEntries
    .filter(e => e.profileId === targetProfileId && new Date(e.ts) >= cutoff)
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
}

export function getSymptomsByMedication(medicationId: string, days: number = 30): SymptomEntry[] {
  const state = loadAppState();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return state.symptomEntries
    .filter(e => e.relatedMedicationId === medicationId && new Date(e.ts) >= cutoff)
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
}

export function deleteSymptomEntry(id: string): boolean {
  const state = loadAppState();
  const index = state.symptomEntries.findIndex(e => e.id === id);
  if (index === -1) return false;

  state.symptomEntries.splice(index, 1);
  saveAppState(state);
  return true;
}

// ============ MEASUREMENT OPERATIONS ============

export interface AddMeasurementParams {
  type: MeasurementType;
  value: string;
  unit: string;
  note?: string;
  ts?: string;
}

export function addMeasurementEntry(params: AddMeasurementParams): MeasurementEntry {
  const state = loadAppState();
  const now = new Date().toISOString();

  const entry: MeasurementEntry = {
    id: crypto.randomUUID(),
    profileId: state.activeProfileId || '',
    ts: params.ts || now,
    type: params.type,
    value: params.value,
    unit: params.unit,
    note: params.note,
    createdAt: now,
  };

  state.measurementEntries.push(entry);
  saveAppState(state);

  appendEvent({
    profileId: entry.profileId,
    ts: entry.ts,
    type: 'MEASUREMENT_LOGGED',
    entityId: entry.id,
    metadata: {
      type: entry.type,
      value: entry.value,
      unit: entry.unit,
    },
  });

  return entry;
}

export function getMeasurementEntries(profileId?: string, days: number = 30): MeasurementEntry[] {
  const state = loadAppState();
  const targetProfileId = profileId || state.activeProfileId;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return state.measurementEntries
    .filter(e => e.profileId === targetProfileId && new Date(e.ts) >= cutoff)
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
}

export function getMeasurementsByType(type: MeasurementType, days: number = 30): MeasurementEntry[] {
  const state = loadAppState();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return state.measurementEntries
    .filter(e => 
      e.profileId === state.activeProfileId && 
      e.type === type && 
      new Date(e.ts) >= cutoff
    )
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
}

export function deleteMeasurementEntry(id: string): boolean {
  const state = loadAppState();
  const index = state.measurementEntries.findIndex(e => e.id === id);
  if (index === -1) return false;

  state.measurementEntries.splice(index, 1);
  saveAppState(state);
  return true;
}

// ============ ANALYSIS ============

export interface SymptomAfterDose {
  symptom: SymptomEntry;
  dose: {
    medicationId: string;
    medicationName: string;
    takenAt: string;
  };
  hoursAfter: number;
}

/**
 * Find symptoms that occurred within X hours after taking a dose
 * (Correlation-lite, informational only)
 */
export function getSymptomsAfterDoses(
  withinHours: number = 24,
  days: number = 30
): SymptomAfterDose[] {
  const state = loadAppState();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  // Get dose-taken events
  const doseEvents = state.events.filter(e => 
    e.type === 'DOSE_TAKEN' &&
    e.profileId === state.activeProfileId &&
    new Date(e.ts) >= cutoff
  );

  const results: SymptomAfterDose[] = [];

  for (const symptom of state.symptomEntries) {
    if (symptom.profileId !== state.activeProfileId) continue;
    if (new Date(symptom.ts) < cutoff) continue;

    const symptomTime = new Date(symptom.ts).getTime();

    for (const dose of doseEvents) {
      const doseTime = new Date(dose.ts).getTime();
      const hoursDiff = (symptomTime - doseTime) / (1000 * 60 * 60);

      if (hoursDiff > 0 && hoursDiff <= withinHours) {
        const medication = state.medications.find(m => m.id === dose.entityId);
        results.push({
          symptom,
          dose: {
            medicationId: dose.entityId || '',
            medicationName: medication?.name || 'Unknown',
            takenAt: dose.ts,
          },
          hoursAfter: Math.round(hoursDiff * 10) / 10,
        });
      }
    }
  }

  return results.sort((a, b) => 
    new Date(b.symptom.ts).getTime() - new Date(a.symptom.ts).getTime()
  );
}

// ============ SYMPTOM TYPE LABELS ============

export const SYMPTOM_LABELS: Record<SymptomType, { ru: string; en: string; emoji: string }> = {
  headache: { ru: 'Головная боль', en: 'Headache', emoji: '🤕' },
  nausea: { ru: 'Тошнота', en: 'Nausea', emoji: '🤢' },
  dizziness: { ru: 'Головокружение', en: 'Dizziness', emoji: '😵' },
  fatigue: { ru: 'Усталость', en: 'Fatigue', emoji: '😴' },
  insomnia: { ru: 'Бессонница', en: 'Insomnia', emoji: '😫' },
  stomach_pain: { ru: 'Боль в животе', en: 'Stomach pain', emoji: '🤮' },
  rash: { ru: 'Сыпь', en: 'Rash', emoji: '🔴' },
  anxiety: { ru: 'Тревожность', en: 'Anxiety', emoji: '😰' },
  other: { ru: 'Другое', en: 'Other', emoji: '📝' },
};

export const MEASUREMENT_LABELS: Record<MeasurementType, { ru: string; en: string; defaultUnit: string; emoji: string }> = {
  BP: { ru: 'Давление', en: 'Blood Pressure', defaultUnit: 'mmHg', emoji: '❤️' },
  GLUCOSE: { ru: 'Глюкоза', en: 'Blood Glucose', defaultUnit: 'mg/dL', emoji: '🩸' },
  WEIGHT: { ru: 'Вес', en: 'Weight', defaultUnit: 'kg', emoji: '⚖️' },
  TEMP: { ru: 'Температура', en: 'Temperature', defaultUnit: '°C', emoji: '🌡️' },
  HR: { ru: 'Пульс', en: 'Heart Rate', defaultUnit: 'bpm', emoji: '💓' },
  SPO2: { ru: 'Сатурация', en: 'SpO2', defaultUnit: '%', emoji: '💨' },
  CUSTOM: { ru: 'Другое', en: 'Custom', defaultUnit: '', emoji: '📊' },
};

