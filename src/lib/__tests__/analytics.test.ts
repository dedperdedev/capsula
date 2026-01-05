import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getAdherenceBreakdown, getSkipReasonsBreakdown, getHeatmapData, getProblemTimes } from '../analytics';
import { saveAppState } from '../../data/storage';
import { subDays } from 'date-fns';

describe('Analytics', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = value;
    });

    const now = new Date();
    const yesterday = subDays(now, 1);

    const testState = {
      schemaVersion: 3,
      profiles: [{ id: 'p1', name: 'Test', createdAt: new Date().toISOString() }],
      activeProfileId: 'p1',
      medications: [{ id: 'm1', name: 'Aspirin', form: 'tablet', createdAt: now.toISOString(), updatedAt: now.toISOString() }],
      schedules: [],
      inventory: [],
      events: [
        // 3 taken, 1 skipped, 1 postponed
        { id: 'e1', profileId: 'p1', ts: now.toISOString(), type: 'DOSE_TAKEN', entityId: 'm1', metadata: { scheduledFor: now.toISOString(), graceWindowMinutes: 60 }, createdAt: now.toISOString() },
        { id: 'e2', profileId: 'p1', ts: yesterday.toISOString(), type: 'DOSE_TAKEN', entityId: 'm1', metadata: { scheduledFor: yesterday.toISOString() }, createdAt: yesterday.toISOString() },
        { id: 'e3', profileId: 'p1', ts: subDays(now, 2).toISOString(), type: 'DOSE_TAKEN', entityId: 'm1', metadata: {}, createdAt: subDays(now, 2).toISOString() },
        { id: 'e4', profileId: 'p1', ts: subDays(now, 3).toISOString(), type: 'DOSE_SKIPPED', entityId: 'm1', metadata: { reason: 'forgot' }, createdAt: subDays(now, 3).toISOString() },
        { id: 'e5', profileId: 'p1', ts: subDays(now, 4).toISOString(), type: 'DOSE_POSTPONED', entityId: 'm1', metadata: {}, createdAt: subDays(now, 4).toISOString() },
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

  it('should calculate adherence breakdown', () => {
    const breakdown = getAdherenceBreakdown(7);

    expect(breakdown.totalDoses).toBe(5);
    expect(breakdown.taken).toBe(3);
    expect(breakdown.skipped).toBe(1);
    expect(breakdown.postponed).toBe(1);
    expect(breakdown.takenRate).toBe(60); // 3/5 = 60%
  });

  it('should calculate skip reasons', () => {
    const reasons = getSkipReasonsBreakdown(7);

    expect(reasons.length).toBe(1);
    expect(reasons[0].reason).toBe('forgot');
    expect(reasons[0].count).toBe(1);
    expect(reasons[0].percentage).toBe(100);
  });

  it('should generate heatmap data', () => {
    const heatmap = getHeatmapData(7);

    expect(heatmap.length).toBe(7 * 24); // 7 days × 24 hours
    expect(heatmap.every(cell => cell.score >= 0 && cell.score <= 1)).toBe(true);
  });

  it('should identify problem times', () => {
    // This test depends on event timestamps which are dynamic
    const problems = getProblemTimes(7, 'en');
    
    expect(Array.isArray(problems)).toBe(true);
    expect(problems.length).toBeLessThanOrEqual(5);
  });
});

describe('On-time vs Late tracking', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = value;
    });

    const now = new Date();
    const scheduledTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 min ago
    const lateTime = new Date(scheduledTime.getTime() + 90 * 60 * 1000); // 90 min after scheduled (late)

    const testState = {
      schemaVersion: 3,
      profiles: [{ id: 'p1', name: 'Test', createdAt: new Date().toISOString() }],
      activeProfileId: 'p1',
      medications: [],
      schedules: [],
      inventory: [],
      events: [
        // On-time dose (within 60 min grace)
        { 
          id: 'e1', 
          profileId: 'p1', 
          ts: now.toISOString(), 
          type: 'DOSE_TAKEN', 
          metadata: { 
            scheduledFor: scheduledTime.toISOString(), 
            graceWindowMinutes: 60 
          }, 
          createdAt: now.toISOString() 
        },
        // Late dose (beyond 60 min grace)
        { 
          id: 'e2', 
          profileId: 'p1', 
          ts: lateTime.toISOString(), 
          type: 'DOSE_TAKEN', 
          metadata: { 
            scheduledFor: scheduledTime.toISOString(), 
            graceWindowMinutes: 60 
          }, 
          createdAt: lateTime.toISOString() 
        },
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

  it('should distinguish on-time vs late doses', () => {
    const breakdown = getAdherenceBreakdown(7);

    expect(breakdown.taken).toBe(2);
    expect(breakdown.onTimeRate).toBe(50); // 1 on-time out of 2
    expect(breakdown.lateRate).toBe(50); // 1 late out of 2
  });
});

