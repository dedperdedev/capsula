/**
 * Care Alert Banner
 * Shows missed dose alerts for guardian mode
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { Card } from './shared/Card';
import { Button } from './shared/Button';
import { getPendingMissedAlerts, acknowledgeMissedAlert } from '../lib/alerts/missedDose';
import { type MissedDoseAlert } from '../data/storage';
import { useI18n } from '../hooks/useI18n';
import { format } from 'date-fns';

interface CareAlertBannerProps {
  onDismiss?: () => void;
}

export function CareAlertBanner({ onDismiss }: CareAlertBannerProps) {
  const { locale } = useI18n();
  const [alerts, setAlerts] = useState<MissedDoseAlert[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const loadAlerts = () => {
      const pending = getPendingMissedAlerts();
      setAlerts(pending);
    };

    loadAlerts();
    // Check every minute
    const interval = setInterval(loadAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = (alertId: string) => {
    acknowledgeMissedAlert(alertId);
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const handleDismissAll = () => {
    alerts.forEach(a => acknowledgeMissedAlert(a.id));
    setAlerts([]);
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed || alerts.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/50 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-red-500">
              {locale === 'ru' ? '⚠️ Пропущенные приемы' : '⚠️ Missed Doses'}
            </h3>
            <button
              onClick={handleDismissAll}
              className="p-1 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={16} className="text-[var(--muted2)]" />
            </button>
          </div>

          <div className="space-y-2">
            {alerts.map(alert => (
              <div 
                key={alert.id}
                className="flex items-center justify-between p-2 bg-[var(--surface)]/50 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-[var(--text)] text-sm">
                    {alert.medicationName}
                  </p>
                  <p className="text-xs text-[var(--muted2)]">
                    {locale === 'ru' ? 'Планировался в ' : 'Scheduled for '}
                    {format(new Date(alert.scheduledTime), 'HH:mm')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAcknowledge(alert.id)}
                >
                  <CheckCircle2 size={14} className="mr-1" />
                  OK
                </Button>
              </div>
            ))}
          </div>

          <p className="text-xs text-[var(--muted2)] mt-2">
            {locale === 'ru' 
              ? 'Режим опекуна активен. Отметьте пропущенные приемы.'
              : 'Guardian mode active. Please mark missed doses.'}
          </p>
        </div>
      </div>
    </Card>
  );
}

