/**
 * Skip Reason Sheet
 * Second-step sheet for selecting skip reason and optional note
 */

import { useState } from 'react';
import { XCircle } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';

interface SkipReasonSheetProps {
  onSelect: (reason: string, note?: string) => void;
  onCancel: () => void;
}

const REASONS = [
  { id: 'forgot', key: 'dose.skipForgot' },
  { id: 'not_available', key: 'dose.skipNotAvailable' },
  { id: 'felt_unwell', key: 'dose.skipFeltUnwell' },
  { id: 'other', key: 'dose.skipOther' },
];

export function SkipReasonSheet({ onSelect, onCancel }: SkipReasonSheetProps) {
  const { t, locale } = useI18n();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [showNote, setShowNote] = useState(false);

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
    <div className="px-5 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onCancel}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--surface2)] transition-colors"
          aria-label={locale === 'ru' ? 'Назад' : 'Back'}
        >
          <span className="text-lg">←</span>
        </button>
        <h3 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2">
          <XCircle size={20} className="text-red-500" />
          {t('dose.skipReason')}
        </h3>
      </div>

      {/* Reason chips */}
      {!showNote && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {REASONS.map((reason) => (
              <button
                key={reason.id}
                onClick={() => handleReasonSelect(reason.id)}
                className="px-4 py-3 rounded-[18px] border border-[var(--stroke)] bg-[var(--surface2)] hover:bg-[var(--stroke)] transition-colors text-[var(--text)] font-medium text-center"
              >
                {t(reason.key)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Note input for "Other" */}
      {showNote && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--muted2)] mb-2">
              {locale === 'ru' ? 'Причина (необязательно)' : 'Reason (optional)'}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={locale === 'ru' ? 'Укажите причину...' : 'Enter reason...'}
              className="w-full px-4 py-3 rounded-[18px] border border-[var(--stroke)] bg-[var(--surface2)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={3}
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowNote(false);
                setSelectedReason('');
                setNote('');
              }}
              className="flex-1 px-4 py-3 rounded-[18px] border border-[var(--stroke)] bg-[var(--surface2)] text-[var(--text)] font-semibold transition-colors hover:bg-[var(--stroke)]"
            >
              {locale === 'ru' ? 'Назад' : 'Back'}
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 rounded-[18px] bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
