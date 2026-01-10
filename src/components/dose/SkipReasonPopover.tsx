/**
 * Skip Reason Popover
 * Small anchored popover for selecting skip reason
 */

import { useState, useRef, useEffect } from 'react';
import { XCircle, X } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';

interface SkipReasonPopoverProps {
  onSelect: (reason: string, note?: string) => void;
  onCancel: () => void;
}

const REASONS = [
  { id: 'forgot', key: 'dose.skipForgot' },
  { id: 'not_available', key: 'dose.skipNotAvailable' },
  { id: 'felt_unwell', key: 'dose.skipFeltUnwell' },
  { id: 'other', key: 'dose.skipOther' },
];

export function SkipReasonPopover({ onSelect, onCancel }: SkipReasonPopoverProps) {
  const { t, locale } = useI18n();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [showNote, setShowNote] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onCancel]);

  const handleReasonSelect = (reasonId: string) => {
    setSelectedReason(reasonId);
    if (reasonId === 'other') {
      setShowNote(true);
    } else {
      onSelect(reasonId);
    }
  };

  const handleSubmit = () => {
    if (selectedReason) {
      onSelect(selectedReason, note.trim() || undefined);
    }
  };

  return (
    <div ref={containerRef} className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <XCircle size={16} className="text-red-500" />
          <span className="text-sm font-semibold text-[var(--text)]">
            {t('dose.skipReason')}
          </span>
        </div>
        <button
          onClick={onCancel}
          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[var(--surface2)] transition-colors"
          aria-label={locale === 'ru' ? 'Закрыть' : 'Close'}
        >
          <X size={14} className="text-[var(--muted2)]" />
        </button>
      </div>

      {/* Reason chips */}
      {!showNote && (
        <div className="grid grid-cols-2 gap-2">
          {REASONS.map((reason) => (
            <button
              key={reason.id}
              onClick={() => handleReasonSelect(reason.id)}
              className="px-3 py-2 rounded-[12px] border border-[var(--stroke)] bg-[var(--surface2)] hover:bg-[var(--stroke)] transition-colors text-[var(--text)] text-sm font-medium text-center"
            >
              {t(reason.key)}
            </button>
          ))}
        </div>
      )}

      {/* Note input for "Other" */}
      {showNote && (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={locale === 'ru' ? 'Укажите причину...' : 'Enter reason...'}
            className="w-full px-3 py-2 rounded-[12px] border border-[var(--stroke)] bg-[var(--surface2)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            rows={2}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowNote(false);
                setSelectedReason('');
                setNote('');
              }}
              className="flex-1 px-3 py-2 rounded-[12px] border border-[var(--stroke)] bg-[var(--surface2)] text-[var(--text)] text-sm font-medium transition-colors hover:bg-[var(--stroke)]"
            >
              {locale === 'ru' ? 'Назад' : 'Back'}
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-3 py-2 rounded-[12px] bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
