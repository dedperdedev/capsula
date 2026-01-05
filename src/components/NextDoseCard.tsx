/**
 * Next Dose Card
 * Shows the next upcoming or overdue dose prominently
 */

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Check, SkipForward, ChevronRight } from 'lucide-react';
import { Card } from './shared/Card';
import { Button } from './shared/Button';
import { getNextDose, type NextDose, type DoseInstance } from '../data/todayDoses';
import { doseLogsStore } from '../data/store';
import { useI18n } from '../hooks/useI18n';

interface NextDoseCardProps {
  onDoseClick?: (dose: DoseInstance) => void;
  onRefresh?: () => void;
}

export function NextDoseCard({ onDoseClick, onRefresh }: NextDoseCardProps) {
  const { locale } = useI18n();
  const [nextDose, setNextDose] = useState<NextDose | null>(null);

  useEffect(() => {
    loadNextDose();
    const interval = setInterval(loadNextDose, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadNextDose = () => {
    setNextDose(getNextDose());
  };

  const handleTake = () => {
    if (!nextDose) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [hours, minutes] = nextDose.dose.originalTime.split(':').map(Number);
    const scheduledFor = new Date(today);
    scheduledFor.setHours(hours, minutes, 0, 0);

    doseLogsStore.create({
      itemId: nextDose.dose.itemId,
      scheduledFor: scheduledFor.toISOString(),
      action: 'taken',
    });

    loadNextDose();
    onRefresh?.();
  };

  const handleSkip = () => {
    if (!nextDose) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [hours, minutes] = nextDose.dose.originalTime.split(':').map(Number);
    const scheduledFor = new Date(today);
    scheduledFor.setHours(hours, minutes, 0, 0);

    doseLogsStore.create({
      itemId: nextDose.dose.itemId,
      scheduledFor: scheduledFor.toISOString(),
      action: 'skipped',
      reason: 'quick_skip',
    });

    loadNextDose();
    onRefresh?.();
  };

  if (!nextDose) {
    return (
      <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
            <Check size={24} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-green-500">
              {locale === 'ru' ? '✓ Все приемы выполнены!' : '✓ All doses complete!'}
            </h3>
            <p className="text-sm text-[var(--muted2)]">
              {locale === 'ru' ? 'На сегодня больше нет приемов' : 'No more doses for today'}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const { dose, isOverdue, minutesUntil } = nextDose;
  const absMinutes = Math.abs(minutesUntil);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;

  const timeText = hours > 0 
    ? `${hours} ${locale === 'ru' ? 'ч' : 'h'} ${mins} ${locale === 'ru' ? 'мин' : 'min'}`
    : `${mins} ${locale === 'ru' ? 'мин' : 'min'}`;

  const statusText = isOverdue
    ? locale === 'ru' ? `Просрочено на ${timeText}` : `Overdue by ${timeText}`
    : minutesUntil <= 5
    ? locale === 'ru' ? 'Сейчас' : 'Now'
    : locale === 'ru' ? `Через ${timeText}` : `In ${timeText}`;

  return (
    <Card 
      className={`mb-4 ${
        isOverdue 
          ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30' 
          : 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-blue-500/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
          isOverdue ? 'bg-red-500' : 'bg-blue-500'
        }`}>
          {isOverdue ? (
            <AlertTriangle size={24} className="text-white" />
          ) : (
            <Clock size={24} className="text-white" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`font-bold ${isOverdue ? 'text-red-500' : 'text-blue-500'}`}>
              {locale === 'ru' ? 'Следующий приём' : 'Next Dose'}
            </h3>
            <span className={`text-sm font-medium ${isOverdue ? 'text-red-400' : 'text-blue-400'}`}>
              {dose.time}
            </span>
          </div>

          <p className="font-semibold text-[var(--text)] truncate">{dose.name}</p>
          <p className="text-sm text-[var(--muted2)]">{dose.doseText}</p>
          
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isOverdue 
                ? 'bg-red-500/20 text-red-400' 
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {statusText}
            </span>
            {dose.foodRelation !== 'any_time' && (
              <span className="text-xs text-[var(--muted2)]">
                {dose.foodRelation === 'with_meals' 
                  ? (locale === 'ru' ? '🍽️ До еды' : '🍽️ Before food')
                  : (locale === 'ru' ? '🍽️ После еды' : '🍽️ After food')
                }
              </span>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              variant="primary"
              size="sm"
              onClick={handleTake}
              className="flex-1"
            >
              <Check size={14} className="mr-1" />
              {locale === 'ru' ? 'Принять' : 'Take'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
            >
              <SkipForward size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDoseClick?.(dose)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

