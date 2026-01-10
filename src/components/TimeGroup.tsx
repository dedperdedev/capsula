import { CheckCircle2 } from 'lucide-react';
import { Button } from './shared/Button';
import { DoseCard } from './DoseCard';
import { useI18n } from '../hooks/useI18n';
import type { DoseInstance } from '../data/todayDoses';

interface TimeGroupProps {
  time: string;
  doses: DoseInstance[];
  onToggleDose: (dose: DoseInstance) => void;
  onDoseClick?: (dose: DoseInstance) => void;
  onBatchMark?: () => void;
  nextDoseId?: string | null;
  countdownMs?: number | null;
  expandedDoseId?: string | null;
  selectedDate?: Date;
  onActionComplete?: () => void;
  onEdit?: (dose: DoseInstance) => void;
  onActionStripClose?: () => void;
}

export function TimeGroup({ 
  time, 
  doses, 
  onToggleDose, 
  onDoseClick, 
  onBatchMark, 
  nextDoseId, 
  countdownMs, 
  expandedDoseId = null,
  selectedDate,
  onActionComplete,
  onEdit,
  onActionStripClose,
}: TimeGroupProps) {
  const { locale } = useI18n();
  const pendingDoses = doses.filter(d => !d.isTaken && !d.isSkipped);
  const canBatchMark = pendingDoses.length > 1;
  const hasMultiple = doses.length >= 2;

  return (
    <div className="relative">
      {/* Time header - full width above */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-[var(--text)]">{time}</h2>
        </div>
        {canBatchMark && onBatchMark && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBatchMark}
            className="text-xs text-[var(--muted2)] hover:text-[var(--text)]"
          >
            <CheckCircle2 size={14} className="mr-1" />
            {locale === 'ru' ? 'Отметить все' : 'Mark All'}
          </Button>
        )}
      </div>

      {/* Cards container - with left padding when hasMultiple to reserve space for line */}
      <div className={hasMultiple ? "relative pl-5" : "relative"}>
        {/* Subtle vertical line - only when 2+ doses */}
        {hasMultiple && (
          <>
            {/* Small dot marker at top */}
            <div className="absolute left-[6px] top-2 w-2 h-2 rounded-full bg-black/20 dark:bg-white/20" />
            {/* Vertical line spanning the cards stack - positioned relative to container */}
            <div className="absolute left-[6px] top-2 bottom-0 w-px bg-black/10 dark:bg-white/10 rounded-full" />
          </>
        )}

        {/* Dose cards - full width */}
        <div className="space-y-3">
          {doses.map((dose) => {
            const isExpanded = dose.id === expandedDoseId;
            return (
              <div key={dose.id} data-dose-container>
                <DoseCard 
                  dose={dose} 
                  onToggle={onToggleDose}
                  onClick={onDoseClick ? () => onDoseClick(dose) : undefined}
                  onSwipeAction={() => {
                    // Refresh parent component after swipe action
                    setTimeout(() => window.dispatchEvent(new Event('doseUpdated')), 100);
                  }}
                  isNextDose={dose.id === nextDoseId}
                  countdownMs={dose.id === nextDoseId ? countdownMs ?? null : null}
                  isExpanded={isExpanded}
                  selectedDate={selectedDate}
                  onActionComplete={onActionComplete}
                  onEdit={onEdit ? () => onEdit(dose) : undefined}
                  onExpandChange={(expanded) => {
                    if (!expanded) {
                      onActionStripClose?.();
                    }
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
