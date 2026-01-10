/**
 * Postpone Popover
 * Small anchored popover for selecting postpone time
 */

import { useState, useRef, useEffect } from 'react';
import { Clock, X } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';

interface PostponePopoverProps {
  onSelect: (minutes: number) => void;
  onCancel: () => void;
}

const PRESETS = [
  { minutes: 10, label: { ru: '+10 мин', en: '+10 min' } },
  { minutes: 30, label: { ru: '+30 мин', en: '+30 min' } },
  { minutes: 60, label: { ru: '+1 час', en: '+1 hour' } },
  { minutes: 120, label: { ru: '+2 часа', en: '+2 hours' } },
];

export function PostponePopover({ onSelect, onCancel }: PostponePopoverProps) {
  const { locale } = useI18n();
  const [customMinutes, setCustomMinutes] = useState<number>(15);
  const [showCustom, setShowCustom] = useState(false);
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

  const handlePreset = (minutes: number) => {
    onSelect(minutes);
  };

  const handleCustom = () => {
    if (customMinutes >= 5 && customMinutes <= 240) {
      onSelect(customMinutes);
    }
  };

  return (
    <div ref={containerRef} className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-blue-500" />
          <span className="text-sm font-semibold text-[var(--text)]">
            {locale === 'ru' ? 'Перенести на' : 'Postpone by'}
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

      {/* Presets */}
      {!showCustom && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.minutes}
                onClick={() => handlePreset(preset.minutes)}
                className="px-3 py-2 rounded-[12px] bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-medium transition-colors text-center"
              >
                {preset.label[locale]}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCustom(true)}
            className="w-full text-xs text-[var(--muted2)] hover:text-[var(--text)] transition-colors text-center py-1.5"
          >
            {locale === 'ru' ? 'Другое время...' : 'Custom time...'}
          </button>
        </div>
      )}

      {/* Custom input */}
      {showCustom && (
        <div className="space-y-2">
          <input
            type="number"
            min="5"
            max="240"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(parseInt(e.target.value, 10) || 15)}
            className="w-full px-3 py-2 rounded-[12px] border border-[var(--stroke)] bg-[var(--surface2)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
            placeholder={locale === 'ru' ? 'Минут' : 'Minutes'}
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowCustom(false);
                setCustomMinutes(15);
              }}
              className="flex-1 px-3 py-2 rounded-[12px] border border-[var(--stroke)] bg-[var(--surface2)] text-[var(--text)] text-sm font-medium transition-colors hover:bg-[var(--stroke)]"
            >
              {locale === 'ru' ? 'Назад' : 'Back'}
            </button>
            <button
              onClick={handleCustom}
              className="flex-1 px-3 py-2 rounded-[12px] bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
