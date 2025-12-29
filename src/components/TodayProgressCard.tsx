import { useNavigate } from 'react-router-dom';
import { BarChart3, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from './shared/Card';
import { useI18n } from '../hooks/useI18n';

interface TodayProgressCardProps {
  totalDoses: number;
  taken: number;
  missed: number;
  snoozed: number;
  remaining: number;
}

export function TodayProgressCard({ totalDoses, taken, missed, snoozed, remaining }: TodayProgressCardProps) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();

  if (totalDoses === 0) {
    return (
      <Card>
        <div className="text-center py-6">
          <p className="text-sm text-[var(--muted2)]">{t('today.noDoses')}</p>
        </div>
      </Card>
    );
  }

  const adherence = totalDoses > 0 ? Math.round((taken / totalDoses) * 100) : 0;

  // Primary KPI: "3 из 4 принято" / "3 of 4 taken"
  const primaryKPI = locale === 'ru' 
    ? `${taken} из ${totalDoses} принято`
    : `${taken} of ${totalDoses} taken`;

  // Secondary line: "Адгеранс 75%" / "Adherence 75%"
  const secondaryLine = locale === 'ru'
    ? `Адгеранс ${adherence}%`
    : `Adherence ${adherence}%`;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-black text-[var(--text)] mb-0.5">
            {t('common.today')}
          </h2>
          <p className="text-sm text-[var(--muted2)]">
            {format(new Date(), 'd MMM')}
          </p>
        </div>
        <button
          onClick={() => navigate('/insights')}
          className="p-2 rounded-lg hover:bg-[var(--surface2)] transition-colors"
          aria-label="View insights"
        >
          <BarChart3 size={20} className="text-[var(--acc2)]" />
        </button>
      </div>

      {/* Primary KPI */}
      <div className="mb-2">
        <p className="text-2xl font-black text-[var(--text)]">{primaryKPI}</p>
      </div>

      {/* Secondary line */}
      <div className="mb-4">
        <p className="text-sm text-[var(--muted2)]">{secondaryLine}</p>
      </div>

      {/* Segmented dose status row - rounded pills */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {Array.from({ length: totalDoses }).map((_, index) => {
          let Icon = Clock;
          let bgColor = 'bg-gray-300';
          let borderColor = 'border-gray-300';
          
          if (index < taken) {
            // Taken - Green
            Icon = CheckCircle2;
            bgColor = 'bg-green-500';
            borderColor = 'border-green-500';
          } else if (index < taken + missed) {
            // Skipped - Red
            Icon = XCircle;
            bgColor = 'bg-red-500';
            borderColor = 'border-red-500';
          } else if (index < taken + missed + snoozed) {
            // Snoozed - Blue
            Icon = Clock;
            bgColor = 'bg-blue-500';
            borderColor = 'border-blue-500';
          } else {
            // Remaining - Gray
            Icon = Clock;
            bgColor = 'bg-gray-300';
            borderColor = 'border-gray-300';
          }

          return (
            <div
              key={index}
              className={`w-10 h-10 rounded-full ${bgColor} ${borderColor} border-2 flex items-center justify-center flex-shrink-0`}
            >
              <Icon size={18} className="text-white" strokeWidth={2.5} />
            </div>
          );
        })}
      </div>

      {/* Bottom stats row */}
      <div className="flex items-center justify-between text-sm pt-3 border-t border-[var(--stroke)]">
        <div className="flex items-center gap-4">
          {remaining > 0 && (
            <div>
              <span className="text-[var(--muted2)]">{t('today.remaining')}: </span>
              <span className="font-black text-[var(--text)]">{remaining}</span>
            </div>
          )}
          <div>
            <span className="text-[var(--muted2)]">{t('today.taken')}: </span>
            <span className="font-black text-[var(--acc)]">{taken}</span>
          </div>
          {missed > 0 && (
            <div>
              <span className="text-[var(--muted2)]">{t('today.missed')}: </span>
              <span className="font-black text-[var(--danger)]">{missed}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
