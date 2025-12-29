import { DoseCard } from './DoseCard';
import type { DoseInstance } from '../data/todayDoses';

interface TimeGroupProps {
  time: string;
  doses: DoseInstance[];
  onToggleDose: (dose: DoseInstance) => void;
  onDoseClick?: (dose: DoseInstance) => void;
}

export function TimeGroup({ time, doses, onToggleDose, onDoseClick }: TimeGroupProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-2xl font-black text-[var(--text)]">{time}</h2>
        <div className="w-2 h-2 rounded-full bg-[var(--acc2)]" />
      </div>
      
      <div className="space-y-2">
        {doses.map((dose) => (
          <DoseCard 
            key={dose.id} 
            dose={dose} 
            onToggle={onToggleDose}
            onClick={onDoseClick ? () => onDoseClick(dose) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
