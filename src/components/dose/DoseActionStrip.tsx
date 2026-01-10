/**
 * Dose Action Strip
 * Compact action strip that appears under the dose card
 */

import { useState } from 'react';
import { CheckCircle2, Clock, XCircle, Edit } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { PostponePopover } from './PostponePopover';
import { SkipReasonPopover } from './SkipReasonPopover';
import { handleTaken, handlePostpone, handleSkip } from './doseActions';
import type { DoseInstance } from '../../data/todayDoses';

interface DoseActionStripProps {
  dose: DoseInstance;
  selectedDate: Date;
  onActionComplete: () => void;
  onEdit: () => void;
  onClose: () => void;
}

type ActionMode = 'actions' | 'postpone' | 'skip';

export function DoseActionStrip({
  dose,
  selectedDate,
  onActionComplete,
  onEdit,
  onClose,
}: DoseActionStripProps) {
  const { t, locale } = useI18n();
  const [mode, setMode] = useState<ActionMode>('actions');

  const handleTakenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleTaken(dose, selectedDate, t, () => {
      onActionComplete();
      onClose();
    });
  };

  const handlePostponeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMode('postpone');
  };

  const handleSkipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMode('skip');
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
    onClose();
  };

  const handlePostponeComplete = (minutes: number) => {
    handlePostpone(dose, selectedDate, minutes, t, () => {
      onActionComplete();
      onClose();
    });
  };

  const handleSkipComplete = (reason: string, note?: string) => {
    handleSkip(dose, selectedDate, reason, note, t, () => {
      onActionComplete();
      onClose();
    });
  };

  if (mode === 'postpone') {
    return (
      <PostponePopover
        onSelect={handlePostponeComplete}
        onCancel={() => setMode('actions')}
      />
    );
  }

  if (mode === 'skip') {
    return (
      <SkipReasonPopover
        onSelect={handleSkipComplete}
        onCancel={() => setMode('actions')}
      />
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3 px-1 py-2">
      {/* Taken */}
      <button
        onClick={handleTakenClick}
        className="flex flex-col items-center gap-1 py-1.5 transition-all active:scale-95"
        aria-label={t('dose.taken')}
      >
        <div className="w-11 h-11 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
          <CheckCircle2 size={22} className="text-white" strokeWidth={2} />
        </div>
        <span className="text-[10px] font-medium text-[var(--text)] leading-tight">
          {t('dose.taken')}
        </span>
      </button>

      {/* Postpone */}
      <button
        onClick={handlePostponeClick}
        className="flex flex-col items-center gap-1 py-1.5 transition-all active:scale-95"
        aria-label={t('dose.snooze')}
      >
        <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
          <Clock size={22} className="text-white" strokeWidth={2} />
        </div>
        <span className="text-[10px] font-medium text-[var(--text)] leading-tight">
          {t('dose.snooze')}
        </span>
      </button>

      {/* Skip */}
      <button
        onClick={handleSkipClick}
        className="flex flex-col items-center gap-1 py-1.5 transition-all active:scale-95"
        aria-label={t('dose.skipped')}
      >
        <div className="w-11 h-11 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
          <XCircle size={22} className="text-white" strokeWidth={2} />
        </div>
        <span className="text-[10px] font-medium text-[var(--text)] leading-tight">
          {t('dose.skipped')}
        </span>
      </button>

      {/* Edit */}
      <button
        onClick={handleEditClick}
        className="flex flex-col items-center gap-1 py-1.5 transition-all active:scale-95"
        aria-label={locale === 'ru' ? 'Редактировать' : 'Edit'}
      >
        <div className="w-11 h-11 rounded-full bg-[var(--surface2)] border border-[var(--stroke)] flex items-center justify-center shadow-sm">
          <Edit size={22} className="text-[var(--muted)]" strokeWidth={2} />
        </div>
        <span className="text-[10px] font-medium text-[var(--text)] leading-tight">
          {locale === 'ru' ? 'Редактировать' : 'Edit'}
        </span>
      </button>
    </div>
  );
}
