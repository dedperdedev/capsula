import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Clock, Pill, Syringe, Droplet, Wind } from 'lucide-react';
import { clsx } from 'clsx';
import type { DoseInstance } from '../data/todayDoses';
import { useI18n } from '../hooks/useI18n';
import { useSwipe } from '../hooks/useSwipe';
import { addMinutes } from 'date-fns';
import { doseLogsStore } from '../data/store';
import { formatInCountdown } from '../utils/date';
import { DoseActionStrip } from './dose/DoseActionStrip';

interface DoseCardProps {
  dose: DoseInstance;
  onToggle: (dose: DoseInstance) => void;
  onClick?: (dose: DoseInstance) => void;
  onSwipeAction?: (action: 'taken' | 'postpone' | 'skip') => void;
  isNextDose?: boolean;
  countdownMs?: number | null;
  isExpanded?: boolean;
  selectedDate?: Date;
  onActionComplete?: () => void;
  onEdit?: () => void;
  onExpandChange?: (expanded: boolean) => void;
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

export function DoseCard({ 
  dose, 
  onToggle, 
  onClick, 
  onSwipeAction, 
  isNextDose, 
  countdownMs, 
  isExpanded = false,
  selectedDate,
  onActionComplete,
  onEdit,
  onExpandChange,
}: DoseCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll when expanded
  useEffect(() => {
    if (isExpanded && cardRef.current && onExpandChange) {
      // Wait for animation to start, then scroll
      const timeout = setTimeout(() => {
        cardRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isExpanded, onExpandChange]);
  const { locale } = useI18n();
  const Icon = getFormIcon(dose.form);
  const foodText = getFoodRelationText(dose.foodRelation, locale);
  const daysLabel = getDaysLabel(locale, dose.daysRemaining, dose.durationDaysTotal);
  
  // Local time state for snoozed dose countdown
  const [now, setNow] = useState(() => new Date());
  
  // Update time every 60s if dose is snoozed
  useEffect(() => {
    if (!dose.isSnoozed) return;
    
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    
    return () => clearInterval(interval);
  }, [dose.isSnoozed]);
  
  // Format countdown for next dose or snoozed dose
  const countdownText = (() => {
    // For next dose (if provided)
    if (isNextDose && countdownMs !== null && countdownMs !== undefined) {
      return formatInCountdown(countdownMs, locale);
    }
    
    // For snoozed doses: calculate time until new scheduled time
    if (dose.isSnoozed && dose.time) {
      const [hours, minutes] = dose.time.split(':').map(Number);
      const snoozeTime = new Date(now);
      snoozeTime.setHours(hours, minutes, 0, 0);
      
      // If time has passed today, assume it's for today and calculate
      if (snoozeTime < now) {
        // Time passed, might be overdue - show "now"
        return formatInCountdown(0, locale);
      }
      
      const msUntil = snoozeTime.getTime() - now.getTime();
      return formatInCountdown(msUntil, locale);
    }
    
    return null;
  })();

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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on action buttons
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    if (onClick) {
      onClick(dose);
    }
  };

  // Swipe visual feedback
  const swipeBg = swipeDirection === 'left' ? 'bg-green-500/20' :
                   swipeDirection === 'right' ? 'bg-blue-500/20' :
                   swipeDirection === 'down' ? 'bg-red-500/20' : '';

  // Status accent color for left vertical bar
  const getStatusAccentColor = () => {
    if (dose.isTaken) {
      return 'bg-green-500';
    } else if (dose.isSkipped) {
      return 'bg-red-500';
    } else if (dose.isSnoozed) {
      return 'bg-blue-500';
    }
    return 'bg-zinc-200 dark:bg-zinc-700';
  };

  // Icon styling
  const getIconStyle = () => {
    if (dose.isTaken) {
      return {
        iconBg: 'bg-green-100 dark:bg-green-900/30',
        iconColor: 'text-green-600 dark:text-green-400',
      };
    } else if (dose.isSkipped) {
      return {
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-400',
      };
    } else if (dose.isSnoozed) {
      return {
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
      };
    }
    return {
      iconBg: 'bg-[var(--surface2)]',
      iconColor: 'text-[var(--muted)]',
    };
  };

  const iconStyle = getIconStyle();
  const accentColor = getStatusAccentColor();
  const isMarked = dose.isTaken || dose.isSkipped;

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
      <div 
        ref={cardRef}
        className={clsx(
          "rounded-[20px] border overflow-hidden transition-all duration-250 ease-out shadow-sm",
          "hover:shadow-md active:scale-[0.98]",
          isMarked && "opacity-90",
          isExpanded
            ? "border-blue-500 bg-[var(--surface)] shadow-md" 
            : "border-[var(--stroke)] bg-[var(--surface)]"
        )}
      >
        {/* Main content area - always visible */}
        <div 
          className="p-4 cursor-pointer"
          onClick={handleCardClick}
        >
          <div className="flex items-center gap-4">
            {/* Left status accent bar */}
            <div className={clsx(
              "w-1 rounded-full flex-shrink-0",
              accentColor
            )} style={{ minHeight: '56px' }} />

            {/* Larger Icon as Primary Visual Anchor */}
            <div className={clsx(
              "w-14 h-14 rounded-[20px] flex items-center justify-center flex-shrink-0 transition-colors",
              iconStyle.iconBg
            )}>
              <Icon size={24} className={iconStyle.iconColor} />
            </div>

            {/* Content */}
            <div className={clsx("flex-1 min-w-0", isMarked && "opacity-90")}>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-[var(--text)] leading-tight">
                  {dose.name}
                </h3>
                {countdownText && (
                  <span className="text-xs text-[var(--muted2)]">
                    • {countdownText}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm text-[var(--muted2)]">
                  {dose.doseText}
                </p>
                {foodText && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface2)] text-[var(--muted2)]">
                    {foodText}
                  </span>
                )}
              </div>
              {daysLabel && (
                <p className="text-xs text-[var(--muted2)] mt-1">
                  {daysLabel}
                </p>
              )}
            </div>

            {/* Status Checkbox - Larger for better tap target */}
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
                'w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all cursor-pointer',
                'active:scale-95',
                dose.isTaken
                  ? `${statusBorder} ${statusBg}`
                  : dose.isSkipped
                  ? `${statusBorder} ${statusBg}`
                  : dose.isSnoozed
                  ? `${statusBorder} ${statusBg}`
                  : 'border-2 border-[var(--stroke2)] bg-transparent hover:border-[var(--acc2)] hover:bg-[var(--acc2)]/5'
              )}
              aria-label={dose.isTaken ? 'Taken' : dose.isSkipped ? 'Skipped' : dose.isSnoozed ? 'Postponed' : 'Mark as taken'}
            >
              {StatusIcon && (
                <StatusIcon size={20} className="text-white" strokeWidth={2.5} />
              )}
              {!StatusIcon && !dose.isTaken && !dose.isSkipped && !dose.isSnoozed && (
                <div className="w-3 h-3 rounded-full border-2 border-[var(--stroke)]" />
              )}
            </button>
          </div>
        </div>

        {/* Actions area - expands/collapses */}
        {selectedDate && onActionComplete && onEdit && (
          <div 
            className={clsx(
              "overflow-hidden transition-all duration-250 ease-out",
              isExpanded ? "max-h-[100px] opacity-100" : "max-h-0 opacity-0"
            )}
          >
            {/* Subtle divider line */}
            <div className="border-t border-[var(--stroke)] mx-4" />
            
            {/* Actions container */}
            <div className="px-4 py-3">
              <DoseActionStrip
                dose={dose}
                selectedDate={selectedDate}
                onActionComplete={onActionComplete}
                onEdit={onEdit}
                onClose={() => onExpandChange?.(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
