/**
 * Family Overview Page
 * Shows quick status for all profiles (caregiver view)
 */

import { useState, useEffect } from 'react';
import { Users, AlertTriangle } from 'lucide-react';
import { TopBar } from '../components/shared/TopBar';
import { Card } from '../components/shared/Card';
import { useI18n } from '../hooks/useI18n';
import { loadAppState, type Profile } from '../data/storage';
import { getTodayDoses } from '../data/eventLog';
import { getPendingMissedAlerts } from '../lib/alerts/missedDose';

interface ProfileStatus {
  profile: Profile;
  totalDoses: number;
  taken: number;
  skipped: number;
  missed: number;
  adherence: number;
  missedAlerts: number;
}

export function FamilyOverviewPage() {
  const { locale } = useI18n();
  const [statuses, setStatuses] = useState<ProfileStatus[]>([]);

  useEffect(() => {
    loadStatuses();
    const interval = setInterval(loadStatuses, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadStatuses = () => {
    const state = loadAppState();
    const today = new Date();

    const profileStatuses: ProfileStatus[] = state.profiles.map(profile => {
      const doses = getTodayDoses(profile.id, today);
      const taken = doses.filter(d => d.status === 'taken').length;
      const skipped = doses.filter(d => d.status === 'skipped').length;
      const total = doses.length;
      const adherence = total > 0 ? Math.round((taken / total) * 100) : 0;

      // Get missed alerts if guardian mode enabled
      const missedAlerts = profile.guardianModeEnabled
        ? getPendingMissedAlerts().filter(a => a.profileId === profile.id).length
        : 0;

      return {
        profile,
        totalDoses: total,
        taken,
        skipped,
        missed: missedAlerts,
        adherence,
        missedAlerts,
      };
    });

    setStatuses(profileStatuses);
  };

  if (statuses.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--bg)] pb-24">
        <TopBar title={locale === 'ru' ? 'Обзор семьи' : 'Family Overview'} />
        <div className="px-4">
          <Card>
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-[var(--muted2)] mb-3" />
              <p className="text-[var(--muted)]">
                {locale === 'ru' ? 'Нет профилей' : 'No profiles'}
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24">
      <TopBar title={locale === 'ru' ? 'Обзор семьи' : 'Family Overview'} />
      
      <div className="px-4 pt-2 space-y-4">
        {statuses.map(status => (
          <Card 
            key={status.profile.id}
            className={status.missedAlerts > 0 ? 'border-red-500/30 bg-red-500/5' : ''}
          >
            <div className="flex items-start gap-3">
              {/* Profile indicator */}
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: status.profile.color || 'var(--primary)' }}
              >
                <span className="text-white font-bold text-lg">
                  {status.profile.name.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-[var(--text)]">
                    {status.profile.name}
                  </h3>
                  {status.missedAlerts > 0 && (
                    <div className="flex items-center gap-1 text-red-500">
                      <AlertTriangle size={16} />
                      <span className="text-sm font-semibold">
                        {status.missedAlerts}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="text-center">
                    <p className="text-xs text-[var(--muted2)] mb-1">
                      {locale === 'ru' ? 'Всего' : 'Total'}
                    </p>
                    <p className="text-lg font-bold text-[var(--text)]">
                      {status.totalDoses}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[var(--muted2)] mb-1">
                      {locale === 'ru' ? 'Принято' : 'Taken'}
                    </p>
                    <p className="text-lg font-bold text-green-500">
                      {status.taken}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[var(--muted2)] mb-1">
                      {locale === 'ru' ? 'Соблюдение' : 'Adherence'}
                    </p>
                    <p className={`text-lg font-bold ${
                      status.adherence >= 80 ? 'text-green-500' :
                      status.adherence >= 50 ? 'text-amber-500' :
                      'text-red-500'
                    }`}>
                      {status.adherence}%
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                {status.totalDoses > 0 && (
                  <div className="w-full h-2 bg-[var(--surface2)] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        status.adherence >= 80 ? 'bg-green-500' :
                        status.adherence >= 50 ? 'bg-amber-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${status.adherence}%` }}
                    />
                  </div>
                )}

                {/* Missed alerts detail */}
                {status.missedAlerts > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--stroke)]">
                    <p className="text-sm text-red-500 font-medium">
                      ⚠️ {status.missedAlerts} {locale === 'ru' ? 'пропущенных приема' : 'missed doses'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {/* Summary card */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Users size={20} className="text-blue-400" />
            <h3 className="font-semibold text-blue-400">
              {locale === 'ru' ? 'Сводка' : 'Summary'}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[var(--muted2)] mb-1">
                {locale === 'ru' ? 'Всего профилей' : 'Total Profiles'}
              </p>
              <p className="text-2xl font-bold text-[var(--text)]">
                {statuses.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted2)] mb-1">
                {locale === 'ru' ? 'Всего приемов сегодня' : 'Total Doses Today'}
              </p>
              <p className="text-2xl font-bold text-[var(--text)]">
                {statuses.reduce((sum, s) => sum + s.totalDoses, 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted2)] mb-1">
                {locale === 'ru' ? 'Принято' : 'Taken'}
              </p>
              <p className="text-2xl font-bold text-green-500">
                {statuses.reduce((sum, s) => sum + s.taken, 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted2)] mb-1">
                {locale === 'ru' ? 'Пропущено' : 'Missed'}
              </p>
              <p className="text-2xl font-bold text-red-500">
                {statuses.reduce((sum, s) => sum + s.missedAlerts, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

