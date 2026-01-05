/**
 * Batch Mark Modal
 * Allows marking multiple doses at once with undo capability
 */

import { useState } from 'react';
import { Check, X, Undo2 } from 'lucide-react';
import { Modal } from './shared/Modal';
import { Button } from './shared/Button';
import { batchMarkTaken, batchMarkSkipped, undoBatchMark, type BatchMarkResult, type DoseInstance } from '../data/todayDoses';
import { useI18n } from '../hooks/useI18n';

interface BatchMarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  doses: DoseInstance[];
  timeLabel: string;
  onComplete: () => void;
}

export function BatchMarkModal({ isOpen, onClose, doses, timeLabel, onComplete }: BatchMarkModalProps) {
  const { locale } = useI18n();
  const [lastResult, setLastResult] = useState<BatchMarkResult | null>(null);
  const [showUndo, setShowUndo] = useState(false);

  const pendingDoses = doses.filter(d => !d.isTaken && !d.isSkipped);
  const doseIds = pendingDoses.map(d => d.id);

  const handleMarkAllTaken = () => {
    const result = batchMarkTaken(doseIds);
    setLastResult(result);
    setShowUndo(true);
    onComplete();
    
    // Hide undo after 5 seconds
    setTimeout(() => setShowUndo(false), 5000);
  };

  const handleMarkAllSkipped = () => {
    const result = batchMarkSkipped(doseIds, 'batch_skipped');
    setLastResult(result);
    setShowUndo(true);
    onComplete();
    
    setTimeout(() => setShowUndo(false), 5000);
  };

  const handleUndo = () => {
    if (lastResult?.undoData) {
      undoBatchMark(lastResult.undoData);
      setShowUndo(false);
      setLastResult(null);
      onComplete();
    }
  };

  const handleClose = () => {
    setShowUndo(false);
    setLastResult(null);
    onClose();
  };

  if (pendingDoses.length === 0) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-[var(--text)] mb-2">
          {locale === 'ru' ? 'Отметить группу' : 'Mark Group'}
        </h2>
        <p className="text-[var(--muted)] mb-4">
          {locale === 'ru' 
            ? `${pendingDoses.length} препаратов в ${timeLabel}`
            : `${pendingDoses.length} medications at ${timeLabel}`
          }
        </p>

        {/* Dose list */}
        <div className="bg-[var(--surface2)] rounded-lg p-3 mb-4 max-h-48 overflow-y-auto">
          {pendingDoses.map(dose => (
            <div key={dose.id} className="flex items-center gap-2 py-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[var(--text)]">{dose.name}</span>
              <span className="text-xs text-[var(--muted2)]">{dose.doseText}</span>
            </div>
          ))}
        </div>

        {/* Undo toast */}
        {showUndo && lastResult && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-green-400 text-sm">
              {locale === 'ru' 
                ? `✓ Отмечено ${lastResult.markedCount} препаратов`
                : `✓ Marked ${lastResult.markedCount} medications`
              }
            </span>
            <Button variant="ghost" size="sm" onClick={handleUndo}>
              <Undo2 size={14} className="mr-1" />
              {locale === 'ru' ? 'Отменить' : 'Undo'}
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="primary"
            fullWidth
            onClick={handleMarkAllTaken}
            disabled={showUndo}
          >
            <Check size={16} className="mr-2" />
            {locale === 'ru' ? 'Принять все' : 'Take All'}
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={handleMarkAllSkipped}
            disabled={showUndo}
          >
            <X size={16} className="mr-2" />
            {locale === 'ru' ? 'Пропустить все' : 'Skip All'}
          </Button>
        </div>

        <Button
          variant="ghost"
          fullWidth
          onClick={handleClose}
          className="mt-3"
        >
          {locale === 'ru' ? 'Закрыть' : 'Close'}
        </Button>
      </div>
    </Modal>
  );
}

