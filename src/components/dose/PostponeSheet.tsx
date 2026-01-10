/**
 * Postpone Sheet
 * Second-step sheet for selecting postpone time
 */

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';

interface PostponeSheetProps {
  onSelect: (minutes: number) => void;
  onCancel: () => void;
}

const PRESETS = [
  { minutes: 10, label: { ru: '+10 мин', en: '+10 min' } },
  { minutes: 30, label: { ru: '+30 мин', en: '+30 min' } },
  { minutes: 60, label: { ru: '+1 час', en: '+1 hour' } },
  { minutes: 120, label: { ru: '+2 часа', en: '+2 hours' } },
];

export function PostponeSheet({ onSelect, onCancel }: PostponeSheetProps) {
  const { locale } = useI18n();
  const [customMinutes, setCustomMinutes] = useState<number>(15);
  const [showCustom, setShowCustom] = useState(false);

  const handlePreset = (minutes: number) => {
    onSelect(minutes);
  };

  const handleCustom = () => {
    if (customMinutes >= 5 && customMinutes <= 240) {
      onSelect(customMinutes);
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
          <Clock size={20} className="text-blue-500" />
          {locale === 'ru' ? 'Перенести на' : 'Postpone by'}
        </h3>
      </div>

      {/* Presets */}
      {!showCustom && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.minutes}
                onClick={() => handlePreset(preset.minutes)}
                className="px-4 py-3 rounded-[18px] bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold transition-colors text-center"
              >
                {preset.label[locale]}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCustom(true)}
            className="w-full text-sm text-[var(--muted2)] hover:text-[var(--text)] transition-colors text-center py-2"
          >
            {locale === 'ru' ? 'Другое время...' : 'Custom time...'}
          </button>
        </div>
      )}

      {/* Custom input */}
      {showCustom && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--muted2)] mb-2">
              {locale === 'ru' ? 'Минут' : 'Minutes'}
            </label>
            <input
              type="number"
              min="5"
              max="240"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(parseInt(e.target.value, 10) || 15)}
              className="w-full px-4 py-3 rounded-[18px] border border-[var(--stroke)] bg-[var(--surface2)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-[18px] border border-[var(--stroke)] bg-[var(--surface2)] text-[var(--text)] font-semibold transition-colors hover:bg-[var(--stroke)]"
            >
              {locale === 'ru' ? 'Отмена' : 'Cancel'}
            </button>
            <button
              onClick={handleCustom}
              className="flex-1 px-4 py-3 rounded-[18px] bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
