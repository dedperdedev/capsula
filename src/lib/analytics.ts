/**
 * Analytics Module
 * Advanced insights: on-time rate, late rate, skip reasons, heatmap, problem times
 */

import { loadAppState } from '../data/storage';
import { format, subDays, eachDayOfInterval, startOfDay, getDay, getHours } from 'date-fns';

// ============ TYPES ============

export interface AdherenceBreakdown {
  totalDoses: number;
  taken: number;
  skipped: number;
  postponed: number;
  takenRate: number; // percentage
  onTimeRate: number; // percentage of taken that were on time
  lateRate: number; // percentage of taken that were late
}

export interface SkipReasonBreakdown {
  reason: string;
  count: number;
  percentage: number;
}

export interface HeatmapCell {
  day: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  total: number;
  missed: number;
  late: number;
  onTime: number;
  score: number; // 0-1, lower is worse (more missed/late)
}

export interface ProblemTime {
  dayLabel: string;
  hourLabel: string;
  missedCount: number;
  lateCount: number;
  totalIssues: number;
}

// ============ CORE ANALYTICS ============

export function getAdherenceBreakdown(days: number = 30): AdherenceBreakdown {
  const state = loadAppState();
  const cutoff = subDays(new Date(), days);

  const relevantEvents = state.events.filter(e =>
    ['DOSE_TAKEN', 'DOSE_SKIPPED', 'DOSE_POSTPONED'].includes(e.type) &&
    e.profileId === state.activeProfileId &&
    new Date(e.ts) >= cutoff
  );

  const taken = relevantEvents.filter(e => e.type === 'DOSE_TAKEN').length;
  const skipped = relevantEvents.filter(e => e.type === 'DOSE_SKIPPED').length;
  const postponed = relevantEvents.filter(e => e.type === 'DOSE_POSTPONED').length;
  const totalDoses = taken + skipped + postponed;

  // Calculate on-time vs late for taken doses
  const takenEvents = relevantEvents.filter(e => e.type === 'DOSE_TAKEN');
  let onTimeCount = 0;
  let lateCount = 0;

  for (const event of takenEvents) {
    const meta = event.metadata as Record<string, any>;
    const graceWindow = meta.graceWindowMinutes || 60;
    
    if (meta.scheduledFor) {
      const scheduled = new Date(meta.scheduledFor).getTime();
      const actual = new Date(event.ts).getTime();
      const diffMinutes = (actual - scheduled) / (1000 * 60);
      
      if (diffMinutes <= graceWindow) {
        onTimeCount++;
      } else {
        lateCount++;
      }
    } else {
      // Assume on-time if no scheduled time recorded
      onTimeCount++;
    }
  }

  return {
    totalDoses,
    taken,
    skipped,
    postponed,
    takenRate: totalDoses > 0 ? Math.round((taken / totalDoses) * 100) : 0,
    onTimeRate: taken > 0 ? Math.round((onTimeCount / taken) * 100) : 0,
    lateRate: taken > 0 ? Math.round((lateCount / taken) * 100) : 0,
  };
}

export function getSkipReasonsBreakdown(days: number = 30): SkipReasonBreakdown[] {
  const state = loadAppState();
  const cutoff = subDays(new Date(), days);

  const skippedEvents = state.events.filter(e =>
    e.type === 'DOSE_SKIPPED' &&
    e.profileId === state.activeProfileId &&
    new Date(e.ts) >= cutoff
  );

  const reasonCounts: Record<string, number> = {};
  
  for (const event of skippedEvents) {
    const reason = (event.metadata.reason as string) || 'unknown';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
  }

  const total = skippedEvents.length;
  
  return Object.entries(reasonCounts)
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

// ============ HEATMAP ============

const DAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const DAY_LABELS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getHeatmapData(days: number = 30): HeatmapCell[] {
  const state = loadAppState();
  const cutoff = subDays(new Date(), days);

  // Initialize heatmap grid: 7 days x 24 hours
  const grid: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      grid.push({
        day,
        hour,
        total: 0,
        missed: 0,
        late: 0,
        onTime: 0,
        score: 1,
      });
    }
  }

  const relevantEvents = state.events.filter(e =>
    ['DOSE_TAKEN', 'DOSE_SKIPPED'].includes(e.type) &&
    e.profileId === state.activeProfileId &&
    new Date(e.ts) >= cutoff
  );

  for (const event of relevantEvents) {
    const eventDate = new Date(event.ts);
    const day = getDay(eventDate);
    const hour = getHours(eventDate);
    
    const cellIndex = day * 24 + hour;
    const cell = grid[cellIndex];
    
    cell.total++;
    
    if (event.type === 'DOSE_SKIPPED') {
      cell.missed++;
    } else {
      const meta = event.metadata as Record<string, any>;
      const graceWindow = meta.graceWindowMinutes || 60;
      
      if (meta.scheduledFor) {
        const scheduled = new Date(meta.scheduledFor).getTime();
        const actual = new Date(event.ts).getTime();
        const diffMinutes = (actual - scheduled) / (1000 * 60);
        
        if (diffMinutes > graceWindow) {
          cell.late++;
        } else {
          cell.onTime++;
        }
      } else {
        cell.onTime++;
      }
    }
  }

  // Calculate scores
  for (const cell of grid) {
    if (cell.total > 0) {
      cell.score = cell.onTime / cell.total;
    }
  }

  return grid;
}

export function getProblemTimes(days: number = 30, locale: 'ru' | 'en' = 'ru'): ProblemTime[] {
  const heatmap = getHeatmapData(days);
  const dayLabels = locale === 'ru' ? DAY_LABELS : DAY_LABELS_EN;
  
  // Find cells with issues
  const problemCells = heatmap
    .filter(cell => cell.missed > 0 || cell.late > 0)
    .map(cell => ({
      dayLabel: dayLabels[cell.day],
      hourLabel: `${cell.hour.toString().padStart(2, '0')}:00`,
      missedCount: cell.missed,
      lateCount: cell.late,
      totalIssues: cell.missed + cell.late,
    }))
    .sort((a, b) => b.totalIssues - a.totalIssues);

  // Return top 5 problem times
  return problemCells.slice(0, 5);
}

// ============ MEDICATION-SPECIFIC ANALYTICS ============

export interface MedicationAdherence {
  medicationId: string;
  medicationName: string;
  taken: number;
  skipped: number;
  total: number;
  adherenceRate: number;
  onTimeRate: number;
}

export function getMedicationAdherence(days: number = 30): MedicationAdherence[] {
  const state = loadAppState();
  const cutoff = subDays(new Date(), days);

  const relevantEvents = state.events.filter(e =>
    ['DOSE_TAKEN', 'DOSE_SKIPPED'].includes(e.type) &&
    e.profileId === state.activeProfileId &&
    new Date(e.ts) >= cutoff &&
    e.entityId
  );

  const medStats: Record<string, { taken: number; skipped: number; onTime: number }> = {};

  for (const event of relevantEvents) {
    const medId = event.entityId!;
    if (!medStats[medId]) {
      medStats[medId] = { taken: 0, skipped: 0, onTime: 0 };
    }

    if (event.type === 'DOSE_SKIPPED') {
      medStats[medId].skipped++;
    } else {
      medStats[medId].taken++;
      
      const meta = event.metadata as Record<string, any>;
      if (meta.scheduledFor) {
        const graceWindow = meta.graceWindowMinutes || 60;
        const scheduled = new Date(meta.scheduledFor).getTime();
        const actual = new Date(event.ts).getTime();
        const diffMinutes = (actual - scheduled) / (1000 * 60);
        
        if (diffMinutes <= graceWindow) {
          medStats[medId].onTime++;
        }
      } else {
        medStats[medId].onTime++;
      }
    }
  }

  return Object.entries(medStats).map(([medId, stats]) => {
    const medication = state.medications.find(m => m.id === medId);
    const total = stats.taken + stats.skipped;
    
    return {
      medicationId: medId,
      medicationName: medication?.name || 'Unknown',
      taken: stats.taken,
      skipped: stats.skipped,
      total,
      adherenceRate: total > 0 ? Math.round((stats.taken / total) * 100) : 0,
      onTimeRate: stats.taken > 0 ? Math.round((stats.onTime / stats.taken) * 100) : 0,
    };
  }).sort((a, b) => b.total - a.total);
}

// ============ WEEKLY TRENDS ============

export interface DailyStats {
  date: string;
  dateLabel: string;
  taken: number;
  skipped: number;
  late: number;
  onTime: number;
  total: number;
  adherenceRate: number;
}

export function getWeeklyTrends(days: number = 7): DailyStats[] {
  const state = loadAppState();
  const today = startOfDay(new Date());
  const startDate = subDays(today, days - 1);
  const dateRange = eachDayOfInterval({ start: startDate, end: today });

  return dateRange.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayEvents = state.events.filter(e =>
      ['DOSE_TAKEN', 'DOSE_SKIPPED'].includes(e.type) &&
      e.profileId === state.activeProfileId &&
      new Date(e.ts) >= dayStart &&
      new Date(e.ts) <= dayEnd
    );

    let taken = 0;
    let skipped = 0;
    let late = 0;
    let onTime = 0;

    for (const event of dayEvents) {
      if (event.type === 'DOSE_SKIPPED') {
        skipped++;
      } else {
        taken++;
        const meta = event.metadata as Record<string, any>;
        if (meta.scheduledFor) {
          const graceWindow = meta.graceWindowMinutes || 60;
          const scheduled = new Date(meta.scheduledFor).getTime();
          const actual = new Date(event.ts).getTime();
          const diffMinutes = (actual - scheduled) / (1000 * 60);
          
          if (diffMinutes > graceWindow) {
            late++;
          } else {
            onTime++;
          }
        } else {
          onTime++;
        }
      }
    }

    const total = taken + skipped;

    return {
      date: dateStr,
      dateLabel: format(date, 'd MMM'),
      taken,
      skipped,
      late,
      onTime,
      total,
      adherenceRate: total > 0 ? Math.round((taken / total) * 100) : 0,
    };
  });
}

