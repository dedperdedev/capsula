import { useState, useEffect, useMemo } from 'react';
import { Pill } from 'lucide-react';
import { Card } from '../components/shared/Card';
import { TodayProgressCard } from '../components/TodayProgressCard';
import { TimeGroup } from '../components/TimeGroup';
import { DoseDueModal } from '../components/DoseDueModal';
import { NextDoseCard } from '../components/NextDoseCard';
import { CareAlertBanner } from '../components/CareAlertBanner';
import { RefillBanner } from '../components/RefillBanner';
import { BatchMarkModal } from '../components/BatchMarkModal';
import { getTodayDoses } from '../data/todayDoses';
import { useI18n } from '../hooks/useI18n';
import type { DoseInstance } from '../data/todayDoses';

export function TodayPage() {
  const { t } = useI18n();
  const [doses, setDoses] = useState<DoseInstance[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDose, setSelectedDose] = useState<DoseInstance | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [batchMarkTime, setBatchMarkTime] = useState<string | null>(null);

  const refreshData = () => {
    try {
      setError(null);
      const todayDoses = getTodayDoses();
      setDoses(todayDoses || []);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setDoses([]);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 60000);
    
    // Listen for swipe action updates
    const handleDoseUpdate = () => {
      refreshData();
    };
    window.addEventListener('doseUpdated', handleDoseUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('doseUpdated', handleDoseUpdate);
    };
  }, []);

  const groupedDoses = useMemo(() => {
    const groups: Record<string, DoseInstance[]> = {};
    for (const dose of doses) {
      if (!groups[dose.time]) {
        groups[dose.time] = [];
      }
      groups[dose.time].push(dose);
    }
    return groups;
  }, [doses]);

  const sortedTimes = useMemo(() => {
    return Object.keys(groupedDoses).sort((a, b) => a.localeCompare(b));
  }, [groupedDoses]);

  const handleDoseClick = (dose: DoseInstance) => {
    setSelectedDose(dose);
    setIsModalOpen(true);
  };

  const handleToggleDose = (dose: DoseInstance) => {
    // Open modal instead of quick toggle
    handleDoseClick(dose);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDose(null);
  };

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

  return (
    <div>
      <div className="space-y-4">
        {/* Next Dose Card */}
        <NextDoseCard 
          onDoseClick={handleDoseClick}
          onRefresh={refreshData}
        />

        {/* Care Alert Banner (Guardian Mode) */}
        <CareAlertBanner />

        {/* Refill Reminders */}
        <RefillBanner />

        {/* Progress Card */}
        <TodayProgressCard
          totalDoses={total}
          taken={stats.taken}
          missed={stats.skipped}
          snoozed={stats.snoozed}
          remaining={stats.remaining}
        />

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
                onBatchMark={() => setBatchMarkTime(time)}
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

      <DoseDueModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        dose={selectedDose}
        onActionComplete={handleActionComplete}
      />

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
    </div>
  );
}
