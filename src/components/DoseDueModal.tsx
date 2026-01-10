import { useState } from 'react';
import { startOfDay, parse } from 'date-fns';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Modal } from './shared/Modal';
import { Button } from './shared/Button';
import { useI18n } from '../hooks/useI18n';
import { doseLogsStore, inventoryStore, schedulesStore } from '../data/store';
import { toast } from './shared/Toast';
import type { DoseInstance } from '../data/todayDoses';

interface DoseDueModalProps {
  isOpen: boolean;
  onClose: () => void;
  dose: DoseInstance | null;
  selectedDate?: Date; // Date for which the dose is being displayed
  onActionComplete: () => void;
}

/**
 * Extract date from dose ID (format: scheduleId-YYYY-MM-DD-time)
 */
function getDateFromDoseId(doseId: string): Date {
  const parts = doseId.split('-');
  if (parts.length >= 4) {
    // Format: scheduleId-YYYY-MM-DD-HH:mm
    const year = parseInt(parts[parts.length - 3], 10);
    const month = parseInt(parts[parts.length - 2], 10) - 1; // month is 0-indexed
    const day = parseInt(parts[parts.length - 1].split('-')[0] || parts[parts.length - 1], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return startOfDay(new Date(year, month, day));
    }
  }
  // Fallback: try parsing as date string from last part
  const dateStr = parts.slice(-3).join('-');
  try {
    const parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    if (!isNaN(parsed.getTime())) {
      return startOfDay(parsed);
    }
  } catch {
    // Fallback to today
  }
  return startOfDay(new Date());
}

const SKIP_REASONS = [
  { id: 'forgot', key: 'dose.skipForgot' },
  { id: 'not_available', key: 'dose.skipNotAvailable' },
  { id: 'felt_unwell', key: 'dose.skipFeltUnwell' },
  { id: 'other', key: 'dose.skipOther' },
];

const SNOOZE_PRESETS = [
  { minutes: 10, label: { ru: '+10 мин', en: '+10 min' } },
  { minutes: 30, label: { ru: '+30 мин', en: '+30 min' } },
  { minutes: 60, label: { ru: '+1 час', en: '+1 hour' } },
  { minutes: 120, label: { ru: '+2 часа', en: '+2 hours' } },
];

export function DoseDueModal({ isOpen, onClose, dose, selectedDate, onActionComplete }: DoseDueModalProps) {
  const { t, locale } = useI18n();
  const [skipReason, setSkipReason] = useState<string>('');
  const [snoozeMinutes, setSnoozeMinutes] = useState<number>(15);
  const [customSnooze, setCustomSnooze] = useState<boolean>(false);
  const [showSkipReasons, setShowSkipReasons] = useState<boolean>(false);
  const [showSnoozePresets, setShowSnoozePresets] = useState<boolean>(false);

  if (!dose) return null;

  // Determine the date for this dose: use selectedDate prop, or extract from dose ID, or default to today
  const doseDate = selectedDate 
    ? startOfDay(selectedDate) 
    : getDateFromDoseId(dose.id);

  const handleTaken = () => {
    if (!dose) return;
    
    const [hours, minutes] = dose.originalTime.split(':').map(Number);
    const scheduledFor = new Date(doseDate);
    scheduledFor.setHours(hours, minutes, 0, 0);
    const scheduledForISO = scheduledFor.toISOString();

    doseLogsStore.create({
      itemId: dose.itemId,
      scheduledFor: scheduledForISO,
      action: 'taken',
    });

    // Decrement inventory if available
    const inventory = inventoryStore.getByItemId(dose.itemId);
    if (inventory && inventory.remainingUnits > 0) {
      inventoryStore.decrement(dose.itemId, 1);
      toast.success(t('dose.inventoryDecremented'));
    }

    toast.success(t('dose.markedAsTaken'));
    onActionComplete();
    onClose();
    resetForm();
  };

  const handleSkip = () => {
    if (!dose || !skipReason) {
      toast.error(t('dose.selectReason'));
      return;
    }

    const [hours, minutes] = dose.originalTime.split(':').map(Number);
    const scheduledFor = new Date(doseDate);
    scheduledFor.setHours(hours, minutes, 0, 0);
    const scheduledForISO = scheduledFor.toISOString();

    doseLogsStore.create({
      itemId: dose.itemId,
      scheduledFor: scheduledForISO,
      action: 'skipped',
      reason: skipReason,
    });

    toast.success(t('dose.markedAsSkipped'));
    onActionComplete();
    onClose();
    resetForm();
  };

  const handleSnooze = () => {
    if (!dose) return;

    const minutes = customSnooze ? snoozeMinutes : 15;
    if (minutes < 5 || minutes > 240) {
      toast.error(t('dose.snoozeDurationError'));
      return;
    }

    // Get original scheduled time - check if there's an existing snooze log for this date
    const allLogs = doseLogsStore.getAll();
    const doseDateStr = doseDate.toISOString().split('T')[0];
    const existingSnoozeLog = allLogs.find(log => {
      if (log.itemId !== dose.itemId || log.action !== 'snoozed' || !log.snoozeUntil) return false;
      // Check if log is for the same date
      const logDate = log.scheduledFor ? new Date(log.scheduledFor).toISOString().split('T')[0] : null;
      return logDate === doseDateStr && new Date(log.snoozeUntil) > new Date();
    });
    
    let originalScheduledFor: Date;
    
    if (existingSnoozeLog && existingSnoozeLog.scheduledFor) {
      // Use the original scheduled time from existing log
      originalScheduledFor = new Date(existingSnoozeLog.scheduledFor);
    } else {
      // First time snoozing - use originalTime with doseDate
      const [hours, minutesTime] = dose.originalTime.split(':').map(Number);
      originalScheduledFor = new Date(doseDate);
      originalScheduledFor.setHours(hours, minutesTime, 0, 0);
    }
    
    const originalScheduledForISO = originalScheduledFor.toISOString();
    const snoozeUntil = new Date(originalScheduledFor);
    snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);

    // Delete existing snooze log if exists
    if (existingSnoozeLog) {
      doseLogsStore.delete(existingSnoozeLog.id);
    }

    doseLogsStore.create({
      itemId: dose.itemId,
      scheduledFor: originalScheduledForISO,
      action: 'snoozed',
      snoozeUntil: snoozeUntil.toISOString(),
    });

    toast.success(t('dose.snoozedUntil') + ' ' + snoozeUntil.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
    onActionComplete();
    onClose();
    resetForm();
  };

  const handleSnoozePreset = (minutes: number) => {
    setSnoozeMinutes(minutes);
    setTimeout(() => handleSnooze(), 100);
  };

  const resetForm = () => {
    setSkipReason('');
    setSnoozeMinutes(15);
    setCustomSnooze(false);
    setShowSkipReasons(false);
    setShowSnoozePresets(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('dose.due')}
      size="md"
    >
      <div className="space-y-6">
        {/* Dose Info */}
        <div className="bg-[var(--surface2)] rounded-[18px] p-4">
          <h3 className="text-lg font-black text-[var(--text)] mb-2">{dose.name}</h3>
          <p className="text-sm text-[var(--muted2)]">
            {dose.doseText} • {dose.time}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Taken Button - Green */}
          <button
            onClick={handleTaken}
            className="w-full px-4 py-3 rounded-[18px] bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-black text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span>{t('dose.taken')}</span>
          </button>

          {/* Skip Button - Red */}
          {!showSkipReasons ? (
            <button
              onClick={() => setShowSkipReasons(true)}
              className="w-full px-4 py-3 rounded-[18px] bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-black text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <XCircle size={16} className="text-white" strokeWidth={2.5} />
              </div>
              <span>{t('dose.skipped')}</span>
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-[var(--muted2)]">{t('dose.skipReason')}</p>
              <div className="grid grid-cols-2 gap-2">
                {SKIP_REASONS.map((reason) => (
                  <button
                    key={reason.id}
                    onClick={() => {
                      setSkipReason(reason.id);
                      setTimeout(() => handleSkip(), 100);
                    }}
                    className="px-3 py-2 text-sm rounded-[18px] border border-[var(--stroke)] bg-[var(--surface2)] hover:bg-[var(--stroke)] transition-colors text-[var(--text)]"
                  >
                    {t(reason.key)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Snooze Button - Blue */}
          <div className="space-y-2">
            {!showSnoozePresets ? (
              <button
                onClick={() => setShowSnoozePresets(true)}
                className="w-full px-4 py-3 rounded-[18px] bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-black text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Clock size={16} className="text-white" strokeWidth={2.5} />
                </div>
                <span>{t('dose.snooze')}</span>
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[var(--muted2)]">
                  {locale === 'ru' ? 'Перенести на:' : 'Postpone by:'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SNOOZE_PRESETS.map((preset) => (
                    <button
                      key={preset.minutes}
                      onClick={() => handleSnoozePreset(preset.minutes)}
                      className="px-3 py-2.5 text-sm rounded-[18px] bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors"
                    >
                      {preset.label[locale]}
                    </button>
                  ))}
                </div>
                
                {!customSnooze ? (
                  <button
                    onClick={() => setCustomSnooze(true)}
                    className="w-full text-sm text-[var(--muted2)] hover:text-[var(--text)] transition-colors text-center py-2"
                  >
                    {locale === 'ru' ? 'Другое время...' : 'Custom time...'}
                  </button>
                ) : (
                  <div className="space-y-2 mt-2">
                    <label className="block text-sm text-[var(--muted2)]">
                      {t('dose.enterMinutes')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="5"
                        max="480"
                        value={snoozeMinutes}
                        onChange={(e) => setSnoozeMinutes(parseInt(e.target.value, 10) || 15)}
                        className="flex-1 px-4 py-2 rounded-[18px] border border-[var(--stroke)] bg-[var(--surface2)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--acc2)]"
                      />
                      <Button variant="primary" onClick={handleSnooze}>
                        OK
                      </Button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowSnoozePresets(false);
                    setCustomSnooze(false);
                  }}
                  className="w-full text-xs text-[var(--muted2)] hover:text-[var(--text)] transition-colors py-1"
                >
                  {t('common.cancel')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
