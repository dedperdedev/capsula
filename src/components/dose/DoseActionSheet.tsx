/**
 * Dose Action Sheet
 * Compact bottom action sheet for dose actions
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';
import { CheckCircle2, Clock, XCircle, Edit } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';
import { PostponeSheet } from './PostponeSheet';
import { SkipReasonSheet } from './SkipReasonSheet';
import { handleTaken, handlePostpone, handleSkip } from './doseActions';
import type { DoseInstance } from '../../data/todayDoses';

interface DoseActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  dose: DoseInstance | null;
  selectedDate: Date;
  onActionComplete: () => void;
  onEdit?: () => void;
}

type SheetMode = 'actions' | 'postpone' | 'skip';

export function DoseActionSheet({
  isOpen,
  onClose,
  dose,
  selectedDate,
  onActionComplete,
  onEdit,
}: DoseActionSheetProps) {
  const { t, locale } = useI18n();
  const [mode, setMode] = useState<SheetMode>('actions');
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Focus trap
      const firstFocusable = sheetRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    } else {
      document.body.style.overflow = '';
      setMode('actions');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mode === 'actions') {
          onClose();
        } else {
          setMode('actions');
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, mode, onClose]);

  if (!isOpen || !dose) return null;

  const handleTakenClick = () => {
    handleTaken(dose, selectedDate, t, onActionComplete);
    onClose();
  };

  const handlePostponeClick = () => {
    setMode('postpone');
  };

  const handleSkipClick = () => {
    setMode('skip');
  };

  const handleEditClick = () => {
    onClose();
    if (onEdit) {
      onEdit();
    }
  };

  const handlePostponeComplete = (minutes: number) => {
    handlePostpone(dose, selectedDate, minutes, t, onActionComplete);
    onClose();
  };

  const handleSkipComplete = (reason: string, note?: string) => {
    handleSkip(dose, selectedDate, reason, note, t, onActionComplete);
    onClose();
  };

  const content = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/10 dark:bg-black/50 z-[150] animate-in fade-in"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-[151] bg-white dark:bg-zinc-900 rounded-t-[28px] shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300"
        style={{
          maxWidth: '430px',
          margin: '0 auto',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Content */}
        {mode === 'actions' && (
          <div className="px-5 pb-6">
            {/* Action buttons row */}
            <div className="grid grid-cols-4 gap-4 py-4">
              {/* Taken */}
              <button
                onClick={handleTakenClick}
                className="flex flex-col items-center gap-2 py-2 transition-all active:scale-95"
                aria-label={t('dose.taken')}
              >
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                  <CheckCircle2 size={24} className="text-white" strokeWidth={2} />
                </div>
                <span className="text-xs font-medium text-[var(--text)]">
                  {t('dose.taken')}
                </span>
              </button>

              {/* Postpone */}
              <button
                onClick={handlePostponeClick}
                className="flex flex-col items-center gap-2 py-2 transition-all active:scale-95"
                aria-label={t('dose.snooze')}
              >
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                  <Clock size={24} className="text-white" strokeWidth={2} />
                </div>
                <span className="text-xs font-medium text-[var(--text)]">
                  {t('dose.snooze')}
                </span>
              </button>

              {/* Skip */}
              <button
                onClick={handleSkipClick}
                className="flex flex-col items-center gap-2 py-2 transition-all active:scale-95"
                aria-label={t('dose.skipped')}
              >
                <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
                  <XCircle size={24} className="text-white" strokeWidth={2} />
                </div>
                <span className="text-xs font-medium text-[var(--text)]">
                  {t('dose.skipped')}
                </span>
              </button>

              {/* Edit */}
              <button
                onClick={handleEditClick}
                className="flex flex-col items-center gap-2 py-2 transition-all active:scale-95"
                aria-label={locale === 'ru' ? 'Редактировать' : 'Edit'}
              >
                <div className="w-12 h-12 rounded-full bg-[var(--surface2)] border border-[var(--stroke)] flex items-center justify-center shadow-sm">
                  <Edit size={24} className="text-[var(--muted)]" strokeWidth={2} />
                </div>
                <span className="text-xs font-medium text-[var(--text)]">
                  {locale === 'ru' ? 'Редактировать' : 'Edit'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Postpone sub-sheet */}
        {mode === 'postpone' && (
          <PostponeSheet
            onSelect={(minutes) => {
              handlePostponeComplete(minutes);
              setMode('actions');
            }}
            onCancel={() => setMode('actions')}
          />
        )}

        {/* Skip sub-sheet */}
        {mode === 'skip' && (
          <SkipReasonSheet
            onSelect={(reason, note) => {
              handleSkipComplete(reason, note);
              setMode('actions');
            }}
            onCancel={() => setMode('actions')}
          />
        )}
      </div>
    </>
  );

  return createPortal(content, document.body);
}
