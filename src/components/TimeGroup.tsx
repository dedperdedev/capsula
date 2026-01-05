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
}

export function TimeGroup({ time, doses, onToggleDose, onDoseClick, onBatchMark }: TimeGroupProps) {
  const { locale } = useI18n();
  const pendingDoses = doses.filter(d => !d.isTaken && !d.isSkipped);
  const canBatchMark = pendingDoses.length > 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-[var(--text)]">{time}</h2>
          <div className="w-2 h-2 rounded-full bg-[var(--acc2)]" />
        </div>
        {canBatchMark && onBatchMark && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBatchMark}
            className="text-xs"
          >
            <CheckCircle2 size={14} className="mr-1" />
            {locale === 'ru' ? 'Отметить все' : 'Mark All'}
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        {doses.map((dose) => (
          <DoseCard 
            key={dose.id} 
            dose={dose} 
            onToggle={onToggleDose}
            onClick={onDoseClick ? () => onDoseClick(dose) : undefined}
            onSwipeAction={() => {
              // Refresh parent component after swipe action
              setTimeout(() => window.dispatchEvent(new Event('doseUpdated')), 100);
            }}
          />
        ))}
      </div>
    </div>
  );
}
