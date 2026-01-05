import { CheckCircle2, XCircle, Clock, Pill, Syringe, Droplet, Wind } from 'lucide-react';
import { Card } from './shared/Card';
import { clsx } from 'clsx';
import type { DoseInstance } from '../data/todayDoses';
import { useI18n } from '../hooks/useI18n';
import { useSwipe } from '../hooks/useSwipe';
import { addMinutes } from 'date-fns';
import { doseLogsStore } from '../data/store';

interface DoseCardProps {
  dose: DoseInstance;
  onToggle: (dose: DoseInstance) => void;
  onClick?: (dose: DoseInstance) => void;
  onSwipeAction?: (action: 'taken' | 'postpone' | 'skip') => void;
}

function getFormIcon(form: string) {
  switch (form) {
    case 'injection':
      return Syringe;
    case 'drops':
    case 'syrup':
      return Droplet;
    case 'spray':
      return Wind;
    default:
      return Pill;
  }
}

function getFoodRelationText(foodRelation: string, locale: string): string {
  if (locale === 'ru') {
    switch (foodRelation) {
      case 'with_meals':
        return 'с едой';
      case 'after_meals':
        return 'после еды';
      case 'any_time':
        return 'в любое время';
      default:
        return '';
    }
  } else {
    switch (foodRelation) {
      case 'with_meals':
        return 'with meals';
      case 'after_meals':
        return 'after meals';
      case 'any_time':
        return 'any time';
      default:
        return '';
    }
  }
}

function getDaysLabel(locale: string, daysRemaining?: number, durationDaysTotal?: number): string {
  if (daysRemaining !== undefined && daysRemaining > 0) {
    if (locale === 'ru') {
      const lastDigit = daysRemaining % 10;
      const lastTwoDigits = daysRemaining % 100;
      let word = 'дней';
      if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        word = 'дней';
      } else if (lastDigit === 1) {
        word = 'день';
      } else if (lastDigit >= 2 && lastDigit <= 4) {
        word = 'дня';
      }
      return `${daysRemaining} ${word} осталось`;
    } else {
      return `${daysRemaining} days remaining`;
    }
  } else if (durationDaysTotal !== undefined) {
    if (locale === 'ru') {
      const lastDigit = durationDaysTotal % 10;
      const lastTwoDigits = durationDaysTotal % 100;
      let word = 'дней';
      if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        word = 'дней';
      } else if (lastDigit === 1) {
        word = 'день';
      } else if (lastDigit >= 2 && lastDigit <= 4) {
        word = 'дня';
      }
      return `${durationDaysTotal} ${word}`;
    } else {
      return `${durationDaysTotal} days`;
    }
  }
  return '';
}

export function DoseCard({ dose, onToggle, onClick, onSwipeAction }: DoseCardProps) {
  const { locale } = useI18n();
  const Icon = getFormIcon(dose.form);
  const foodText = getFoodRelationText(dose.foodRelation, locale);
  const daysLabel = getDaysLabel(locale, dose.daysRemaining, dose.durationDaysTotal);

  // Swipe handlers
  const handleSwipeLeft = () => {
    if (dose.isTaken || dose.isSkipped) return;
    // Taken
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [hours, minutes] = dose.originalTime.split(':').map(Number);
    const scheduledFor = new Date(today);
    scheduledFor.setHours(hours, minutes, 0, 0);
    
    doseLogsStore.create({
      itemId: dose.itemId,
      scheduledFor: scheduledFor.toISOString(),
      action: 'taken',
    });
    onSwipeAction?.('taken');
  };

  const handleSwipeRight = () => {
    if (dose.isTaken || dose.isSkipped) return;
    // Postpone +30min default
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [hours, minutes] = dose.originalTime.split(':').map(Number);
    const scheduledFor = new Date(today);
    scheduledFor.setHours(hours, minutes, 0, 0);
    const snoozeUntil = addMinutes(scheduledFor, 30);
    
    doseLogsStore.create({
      itemId: dose.itemId,
      scheduledFor: scheduledFor.toISOString(),
      action: 'snoozed',
      snoozeUntil: snoozeUntil.toISOString(),
    });
    onSwipeAction?.('postpone');
  };

  const handleSwipeDown = () => {
    if (dose.isTaken || dose.isSkipped) return;
    // Skip
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [hours, minutes] = dose.originalTime.split(':').map(Number);
    const scheduledFor = new Date(today);
    scheduledFor.setHours(hours, minutes, 0, 0);
    
    doseLogsStore.create({
      itemId: dose.itemId,
      scheduledFor: scheduledFor.toISOString(),
      action: 'skipped',
      reason: 'swipe_skip',
    });
    onSwipeAction?.('skip');
  };

  const { ref, transform, swipeDirection, isSwiping } = useSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    onSwipeDown: handleSwipeDown,
    enabled: !dose.isTaken && !dose.isSkipped,
  });

  // Определяем статус и стили
  let statusIcon = null;
  let statusBg = '';
  let statusBorder = '';

  if (dose.isTaken) {
    statusIcon = CheckCircle2;
    statusBg = 'bg-green-500';
    statusBorder = 'border-green-500';
  } else if (dose.isSkipped) {
    statusIcon = XCircle;
    statusBg = 'bg-red-500';
    statusBorder = 'border-red-500';
  } else if (dose.isSnoozed) {
    statusIcon = Clock;
    statusBg = 'bg-blue-500';
    statusBorder = 'border-blue-500';
  } else {
    statusIcon = null;
    statusBg = '';
    statusBorder = 'border-[var(--stroke2)]';
  }

  const StatusIcon = statusIcon;

  const handleCardClick = () => {
    if (onClick) {
      onClick(dose);
    }
  };

  // Swipe visual feedback
  const swipeBg = swipeDirection === 'left' ? 'bg-green-500/20' :
                   swipeDirection === 'right' ? 'bg-blue-500/20' :
                   swipeDirection === 'down' ? 'bg-red-500/20' : '';

  return (
    <div
      ref={ref as any}
      className={clsx(
        "transition-transform",
        isSwiping && swipeBg,
        isSwiping && "shadow-lg"
      )}
      style={{
        transform: isSwiping ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
      }}
    >
      <Card className="cursor-pointer" onClick={handleCardClick}>
        <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-[18px] border border-[var(--stroke)] bg-[var(--surface2)] flex items-center justify-center flex-shrink-0">
          <Icon size={20} className="text-[var(--muted)]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-black text-[var(--text)]">{dose.name}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--acc2)]/10 border border-[var(--acc2)]/25 text-[var(--acc2)] font-semibold">
              {dose.time}
            </span>
          </div>
          <p className="text-sm text-[var(--muted2)]">
            {dose.doseText} {foodText}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onClick) {
                onClick(dose);
              } else {
                onToggle(dose);
              }
            }}
            className={clsx(
              'w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer',
              dose.isTaken
                ? `${statusBorder} ${statusBg}`
                : dose.isSkipped
                ? `${statusBorder} ${statusBg}`
                : dose.isSnoozed
                ? `${statusBorder} ${statusBg}`
                : `${statusBorder} bg-transparent hover:border-[var(--acc2)]`
            )}
          >
            {StatusIcon && (
              <StatusIcon size={14} className="text-white" strokeWidth={2.5} />
            )}
            {!StatusIcon && !dose.isTaken && !dose.isSkipped && !dose.isSnoozed && (
              <div className="w-2 h-2 rounded-full bg-transparent" />
            )}
          </button>
          
          {daysLabel && (
            <p className="text-xs text-[var(--muted2)] text-right whitespace-nowrap">
              {daysLabel}
            </p>
          )}
        </div>
      </div>
      </Card>
    </div>
  );
}
