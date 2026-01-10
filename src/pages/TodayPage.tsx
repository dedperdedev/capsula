import { useState, useEffect, useMemo } from 'react';
import { startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Pill } from 'lucide-react';
import { Card } from '../components/shared/Card';
import { TodayProgressCard } from '../components/TodayProgressCard';
import { TodayHeaderV2 } from '../components/today/TodayHeaderV2';
import { TimeGroup } from '../components/TimeGroup';
import { NextDoseCard } from '../components/NextDoseCard';
import { CareAlertBanner } from '../components/CareAlertBanner';
import { RefillBanner } from '../components/RefillBanner';
import { BatchMarkModal } from '../components/BatchMarkModal';
import { QuickAddWizard } from '../components/QuickAddWizard';
import { getTodayDoses } from '../data/todayDoses';
import { doseLogsStore } from '../data/store';
import { useI18n } from '../hooks/useI18n';
import { isFeatureEnabled } from '../lib/featureFlags';
import { isDateToday } from '../utils/date';
import type { DoseInstance } from '../data/todayDoses';

export function TodayPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  // Selected date state - defaults to today
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()));
  const [doses, setDoses] = useState<DoseInstance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedDoseId, setExpandedDoseId] = useState<string | null>(null);
  const [batchMarkTime, setBatchMarkTime] = useState<string | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());

  const refreshData = (date?: Date) => {
    try {
      setError(null);
      const targetDate = date || selectedDate;
      const todayDoses = getTodayDoses(targetDate);
      setDoses(todayDoses || []);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setDoses([]);
    }
  };

  useEffect(() => {
    refreshData(selectedDate);
    const interval = setInterval(() => refreshData(selectedDate), 60000);
    
    // Listen for swipe action updates
    const handleDoseUpdate = () => {
      refreshData(selectedDate);
    };
    window.addEventListener('doseUpdated', handleDoseUpdate);
    
    // Listen for QuickAddWizard event
    const handleOpenQuickAdd = () => {
      setIsQuickAddOpen(true);
    };
    window.addEventListener('openQuickAddWizard', handleOpenQuickAdd);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('doseUpdated', handleDoseUpdate);
      window.removeEventListener('openQuickAddWizard', handleOpenQuickAdd);
    };
  }, [selectedDate]);

  // Update now timestamp for countdown (every 60s)
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(countdownInterval);
  }, []);

  const handleDateChange = (date: Date) => {
    const normalizedDate = startOfDay(date);
    setSelectedDate(normalizedDate);
    // refreshData will be called by useEffect when selectedDate changes
  };

  // Stable sort helper: rank doses by status (pending/snoozed=0, taken=1, skipped=2)
  const getDoseStatusRank = (dose: DoseInstance): number => {
    if (dose.isTaken) return 1;
    if (dose.isSkipped) return 2;
    return 0; // pending, snoozed, or any actionable status
  };

  const groupedDoses = useMemo(() => {
    const groups: Record<string, DoseInstance[]> = {};
    
    // First, group by time
    for (const dose of doses) {
      if (!groups[dose.time]) {
        groups[dose.time] = [];
      }
      groups[dose.time].push(dose);
    }
    
    // Then, sort each group: marked doses (taken/skipped) to bottom
    for (const time in groups) {
      groups[time] = groups[time].sort((a, b) => {
        const rankA = getDoseStatusRank(a);
        const rankB = getDoseStatusRank(b);
        if (rankA !== rankB) {
          return rankA - rankB;
        }
        // Stable sort: preserve original order within same rank
        return 0;
      });
    }
    
    return groups;
  }, [doses]);

  const sortedTimes = useMemo(() => {
    return Object.keys(groupedDoses).sort((a, b) => a.localeCompare(b));
  }, [groupedDoses]);

  // Calculate next dose and countdown (only when selected date is today)
  const { nextDoseId, countdownMs } = useMemo(() => {
    const isToday = isDateToday(selectedDate);
    if (!isToday) {
      return { nextDoseId: null, countdownMs: null };
    }

    // Find next actionable dose (pending, not taken/skipped)
    const pendingDoses = doses.filter(d => !d.isTaken && !d.isSkipped);
    if (pendingDoses.length === 0) {
      return { nextDoseId: null, countdownMs: null };
    }

    // Sort by time
    const sorted = [...pendingDoses].sort((a, b) => {
      const [aH, aM] = a.time.split(':').map(Number);
      const [bH, bM] = b.time.split(':').map(Number);
      return (aH * 60 + aM) - (bH * 60 + bM);
    });

    // Get the first pending dose
    const nextDose = sorted[0];
    if (!nextDose) {
      return { nextDoseId: null, countdownMs: null };
    }

    // Calculate milliseconds until dose time
    const [hours, minutes] = nextDose.time.split(':').map(Number);
    const doseTime = new Date(now);
    doseTime.setHours(hours, minutes, 0, 0);
    
    // If time has passed today, it might be overdue but still count it
    const msUntil = doseTime.getTime() - now.getTime();
    
    return {
      nextDoseId: nextDose.id,
      countdownMs: msUntil,
    };
  }, [doses, selectedDate, now]);

  const handleDoseClick = (dose: DoseInstance) => {
    // Toggle expanded state: if same dose, close; otherwise switch to new dose
    if (expandedDoseId === dose.id) {
      setExpandedDoseId(null);
    } else {
      setExpandedDoseId(dose.id);
    }
  };

  const handleToggleDose = (dose: DoseInstance) => {
    // Right-side button: quick mark as taken (existing behavior)
    // Don't toggle the action strip for this
    if (!dose.isTaken && !dose.isSkipped) {
      // Quick toggle - mark as taken
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [hours, minutes] = dose.originalTime.split(':').map(Number);
      const scheduledFor = new Date(today);
      scheduledFor.setHours(hours, minutes, 0, 0);
      
      doseLogsStore.create({
        itemId: dose.itemId,
        scheduledFor: scheduledFor.toISOString(),
        action: 'taken',
      });
      refreshData();
    }
  };

  const handleActionStripClose = () => {
    setExpandedDoseId(null);
  };

  const handleEdit = (dose: DoseInstance) => {
    // Navigate to medication details page first (user can then tap Edit)
    navigate(`/medications/${dose.itemId}`);
    setExpandedDoseId(null);
  };

  // Close action strip when clicking outside
  useEffect(() => {
    if (!expandedDoseId) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking inside a dose card container
      if (target.closest('[data-dose-container]')) {
        return;
      }
      setExpandedDoseId(null);
    };

    // Use setTimeout to avoid immediate closure on the click that opened it
    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedDoseId]);

  // Close action strip on ESC key
  useEffect(() => {
    if (!expandedDoseId) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpandedDoseId(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [expandedDoseId]);

  // Close action strip on scroll
  useEffect(() => {
    if (!expandedDoseId) return;

    const handleScroll = () => {
      setExpandedDoseId(null);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [expandedDoseId]);

  const handleActionComplete = () => {
    refreshData();
  };

  // Calculate stats including skipped and snoozed
  const stats = useMemo(() => {
    const taken = doses.filter(d => d.isTaken).length;
    const skipped = doses.filter(d => d.isSkipped).length;
    const snoozed = doses.filter(d => d.isSnoozed).length;
    const remaining = doses.filter(d => !d.isTaken && !d.isSkipped && !d.isSnoozed).length;
    return { taken, skipped, snoozed, remaining };
  }, [doses]);

  const total = doses.length;

  if (error) {
    return (
      <div>
        <Card>
          <div className="text-center py-12">
            <p className="text-[var(--danger)] mb-2 font-semibold">Error loading data</p>
            <p className="text-xs text-[var(--muted2)]">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  const useNewHeader = isFeatureEnabled('uiRefreshV1');

  return (
    <div className={useNewHeader ? '-mx-[18px] relative min-h-full' : 'min-h-screen'}>
      {/* Calm Header V2 (if enabled) */}
      {useNewHeader && (
        <TodayHeaderV2
          totalDoses={total}
          taken={stats.taken}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          onProfileChange={refreshData}
        />
      )}

      {/* Content Surface - White rounded container that overlaps hero */}
      <div 
        className={`${
          useNewHeader 
            ? 'bg-white rounded-t-[28px] -mt-8 pt-6 px-5 pb-8 shadow-lg relative z-10' 
            : 'space-y-4'
        }`}
        style={useNewHeader ? {
          minHeight: 'calc(100vh - 240px + 32px)',
        } : undefined}
      >
        {/* Next Dose Card */}
        {!useNewHeader && (
          <NextDoseCard 
            onDoseClick={handleDoseClick}
            onRefresh={refreshData}
          />
        )}

        {/* Care Alert Banner (Guardian Mode) */}
        <CareAlertBanner />

        {/* Refill Reminders */}
        <RefillBanner />

        {/* Progress Card (only if old header) */}
        {!useNewHeader && (
          <TodayProgressCard
            totalDoses={total}
            taken={stats.taken}
            missed={stats.skipped}
            snoozed={stats.snoozed}
            remaining={stats.remaining}
          />
        )}

        {/* Time Groups */}
        {sortedTimes.length > 0 ? (
          <div className="space-y-6">
            {sortedTimes.map((time) => (
              <TimeGroup
                key={time}
                time={time}
                doses={groupedDoses[time]}
                onToggleDose={handleToggleDose}
                onDoseClick={handleDoseClick}
                expandedDoseId={expandedDoseId}
                selectedDate={selectedDate}
                onActionComplete={handleActionComplete}
                onEdit={handleEdit}
                onActionStripClose={handleActionStripClose}
                onBatchMark={() => setBatchMarkTime(time)}
                nextDoseId={nextDoseId}
                countdownMs={countdownMs}
              />
            ))}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <Pill size={48} className="mx-auto text-[var(--muted2)] mb-3" />
              <p className="text-[var(--muted)] mb-2 font-semibold">{t('today.noDoses')}</p>
              <p className="text-xs text-[var(--muted2)]">
                {t('today.addItems')}
              </p>
            </div>
          </Card>
        )}
      </div>


      {/* Batch Mark Modal */}
      {batchMarkTime && (
        <BatchMarkModal
          isOpen={!!batchMarkTime}
          onClose={() => setBatchMarkTime(null)}
          doses={groupedDoses[batchMarkTime] || []}
          timeLabel={batchMarkTime}
          onComplete={() => {
            refreshData();
            setBatchMarkTime(null);
          }}
        />
      )}

      {/* Quick Add Wizard */}
      <QuickAddWizard
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onComplete={() => {
          refreshData();
          setIsQuickAddOpen(false);
        }}
      />
    </div>
  );
}
