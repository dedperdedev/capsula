/**
 * Unit tests for doseStatus module
 */

import { describe, it, expect } from 'vitest';
import { 
  calculateDoseStatus, 
  formatDelay, 
  validatePRNDose,
  checkPostponeCollision,
} from '../doseStatus';
import type { Schedule } from '../types';

describe('calculateDoseStatus', () => {
  const baseSchedule: Schedule = {
    id: 'test-schedule',
    itemId: 'test-item',
    times: ['08:00'],
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    graceWindowMinutes: 60,
  };

  it('returns pending for future doses', () => {
    const plannedTime = new Date();
    plannedTime.setHours(plannedTime.getHours() + 2); // 2 hours from now
    
    const result = calculateDoseStatus(plannedTime, null, baseSchedule);
    
    expect(result.status).toBe('pending');
    expect(result.isWithinGrace).toBe(true);
  });

  it('returns pending within grace window', () => {
    const plannedTime = new Date();
    plannedTime.setMinutes(plannedTime.getMinutes() - 30); // 30 min ago
    
    const result = calculateDoseStatus(plannedTime, null, baseSchedule);
    
    expect(result.status).toBe('pending');
    expect(result.isWithinGrace).toBe(true);
  });

  it('returns missed after grace window', () => {
    const plannedTime = new Date();
    plannedTime.setMinutes(plannedTime.getMinutes() - 90); // 90 min ago (> 60 min grace)
    
    const result = calculateDoseStatus(plannedTime, null, baseSchedule);
    
    expect(result.status).toBe('missed');
    expect(result.isWithinGrace).toBe(false);
  });

  it('returns on_time when taken within grace window', () => {
    const plannedTime = new Date();
    plannedTime.setMinutes(plannedTime.getMinutes() - 30);
    
    const actualTime = new Date(); // Now
    
    const result = calculateDoseStatus(plannedTime, actualTime, baseSchedule);
    
    expect(result.status).toBe('on_time');
    expect(result.isWithinGrace).toBe(true);
  });

  it('returns late when taken after grace window', () => {
    const plannedTime = new Date();
    const actualTime = new Date();
    actualTime.setMinutes(actualTime.getMinutes() + 90); // 90 min later
    
    const result = calculateDoseStatus(plannedTime, actualTime, baseSchedule);
    
    expect(result.status).toBe('late');
    expect(result.isWithinGrace).toBe(false);
    expect(result.delayMinutes).toBe(90);
  });

  it('respects custom grace window', () => {
    const customSchedule = { ...baseSchedule, graceWindowMinutes: 15 };
    const plannedTime = new Date();
    plannedTime.setMinutes(plannedTime.getMinutes() - 20); // 20 min ago
    
    const result = calculateDoseStatus(plannedTime, null, customSchedule);
    
    expect(result.status).toBe('missed');
    expect(result.isWithinGrace).toBe(false);
  });
});

describe('formatDelay', () => {
  it('returns empty string for 0 minutes', () => {
    expect(formatDelay(0, 'ru')).toBe('');
    expect(formatDelay(0, 'en')).toBe('');
  });

  it('formats minutes correctly', () => {
    expect(formatDelay(30, 'ru')).toBe('+30 мин');
    expect(formatDelay(30, 'en')).toBe('+30 min');
    expect(formatDelay(-15, 'ru')).toBe('-15 мин');
  });

  it('formats hours correctly', () => {
    expect(formatDelay(60, 'ru')).toBe('+1 ч');
    expect(formatDelay(60, 'en')).toBe('+1 h');
    expect(formatDelay(120, 'ru')).toBe('+2 ч');
  });

  it('formats hours and minutes correctly', () => {
    expect(formatDelay(90, 'ru')).toBe('+1ч 30м');
    expect(formatDelay(90, 'en')).toBe('+1h 30m');
  });
});

describe('validatePRNDose', () => {
  const prnSchedule: Schedule = {
    id: 'prn-schedule',
    itemId: 'test-item',
    times: [],
    daysOfWeek: [],
    enabled: true,
    mode: 'prn',
    prnMinIntervalHours: 4,
    prnMaxPerDay: 3,
  };

  it('allows PRN dose when limits not reached', () => {
    const result = validatePRNDose(prnSchedule, 0, null, 'ru');
    
    expect(result.canTake).toBe(true);
    expect(result.dosesToday).toBe(0);
  });

  it('blocks when max per day reached', () => {
    const result = validatePRNDose(prnSchedule, 3, null, 'ru');
    
    expect(result.canTake).toBe(false);
    expect(result.reason).toContain('3');
  });

  it('blocks when minimum interval not met', () => {
    const lastDoseTime = new Date();
    lastDoseTime.setHours(lastDoseTime.getHours() - 2); // 2 hours ago
    
    const result = validatePRNDose(prnSchedule, 1, lastDoseTime, 'ru');
    
    expect(result.canTake).toBe(false);
    expect(result.nextAvailableTime).toBeDefined();
  });

  it('allows when minimum interval is met', () => {
    const lastDoseTime = new Date();
    lastDoseTime.setHours(lastDoseTime.getHours() - 5); // 5 hours ago
    
    const result = validatePRNDose(prnSchedule, 1, lastDoseTime, 'ru');
    
    expect(result.canTake).toBe(true);
  });
});

describe('checkPostponeCollision', () => {
  it('detects collision within window', () => {
    const newTime = new Date();
    const existingDoses = [
      { time: new Date(newTime.getTime() + 15 * 60000), itemName: 'Aspirin' }, // 15 min later
    ];
    
    const result = checkPostponeCollision(newTime, existingDoses, 30);
    
    expect(result.hasCollision).toBe(true);
    expect(result.collidingDose?.itemName).toBe('Aspirin');
  });

  it('returns no collision outside window', () => {
    const newTime = new Date();
    const existingDoses = [
      { time: new Date(newTime.getTime() + 60 * 60000), itemName: 'Aspirin' }, // 60 min later
    ];
    
    const result = checkPostponeCollision(newTime, existingDoses, 30);
    
    expect(result.hasCollision).toBe(false);
  });

  it('returns no collision for empty list', () => {
    const newTime = new Date();
    
    const result = checkPostponeCollision(newTime, [], 30);
    
    expect(result.hasCollision).toBe(false);
  });
});

