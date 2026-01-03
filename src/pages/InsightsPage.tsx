import { useMemo, useState } from 'react';
import { format, startOfDay, subDays, eachDayOfInterval, isToday } from 'date-fns';
import { TopBar } from '../components/shared/TopBar';
import { Card } from '../components/shared/Card';
import { useI18n } from '../hooks/useI18n';
import { schedulesStore, itemsStore, doseLogsStore } from '../data/store';
import { getTodayDoses } from '../data/todayDoses';
import { Award, Flame, Star, Zap } from 'lucide-react';

export function InsightsPage() {
  const { t, locale } = useI18n();
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  // Get data for last 7 or 30 days
  const stats = useMemo(() => {
    const daysCount = period === 'week' ? 7 : 30;
    const today = new Date();
    const startDate = subDays(today, daysCount - 1);
    const days = eachDayOfInterval({ start: startDate, end: today });

    const dayStats = days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      // Get doses for this day
      const doses = getTodayDoses(day);
      const total = doses.length;
      const taken = doses.filter(d => d.isTaken).length;
      const skipped = doses.filter(d => d.isSkipped).length;
      const snoozed = doses.filter(d => d.isSnoozed).length;
      const adherence = total > 0 ? Math.round((taken / total) * 100) : 0;

      return {
        date: day,
        dateStr: format(day, 'd MMM'),
        total,
        taken,
        skipped,
        snoozed,
        adherence,
      };
    });

    // Overall stats
    const allDoses = dayStats.reduce((sum, day) => sum + day.total, 0);
    const allTaken = dayStats.reduce((sum, day) => sum + day.taken, 0);
    const allSkipped = dayStats.reduce((sum, day) => sum + day.skipped, 0);
    const allSnoozed = dayStats.reduce((sum, day) => sum + day.snoozed, 0);
    const overallAdherence = allDoses > 0 ? Math.round((allTaken / allDoses) * 100) : 0;

    // Get all schedules and items
    const schedules = schedulesStore.getAll();
    const items = itemsStore.getAll();
    const activeSchedules = schedules.filter(s => s.enabled).length;
    const totalItems = items.length;

    // Calculate streaks
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    // Check consecutive days with 100% adherence
    for (let i = dayStats.length - 1; i >= 0; i--) {
      if (dayStats[i].adherence === 100 && dayStats[i].total > 0) {
        if (i === dayStats.length - 1 || currentStreak > 0) {
          currentStreak++;
        }
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        if (currentStreak === 0 && i === dayStats.length - 1) {
          // Today not perfect, check yesterday
        }
        tempStreak = 0;
      }
    }

    // Calculate medication-specific stats
    const medicationStats = items.map(item => {
      const itemLogs = doseLogsStore.getAll().filter(l => l.itemId === item.id);
      const takenLogs = itemLogs.filter(l => l.action === 'taken');
      const skippedLogs = itemLogs.filter(l => l.action === 'skipped');
      const totalLogs = takenLogs.length + skippedLogs.length;
      const adherence = totalLogs > 0 ? Math.round((takenLogs.length / totalLogs) * 100) : 100;

      return {
        id: item.id,
        name: item.name,
        taken: takenLogs.length,
        skipped: skippedLogs.length,
        adherence,
      };
    }).filter(s => s.taken + s.skipped > 0).sort((a, b) => b.taken - a.taken);

    // Best and worst medications
    const bestMedication = medicationStats.reduce((best, curr) => 
      curr.adherence > (best?.adherence || 0) ? curr : best, null as typeof medicationStats[0] | null);
    const worstMedication = medicationStats.reduce((worst, curr) => 
      curr.adherence < (worst?.adherence || 100) ? curr : worst, null as typeof medicationStats[0] | null);

    // Achievements
    const achievements = [];
    if (currentStreak >= 7) achievements.push({ id: 'week_streak', icon: Flame, label: locale === 'ru' ? '7 дней подряд!' : '7 Day Streak!' });
    if (currentStreak >= 30) achievements.push({ id: 'month_streak', icon: Star, label: locale === 'ru' ? '30 дней подряд!' : '30 Day Streak!' });
    if (allTaken >= 100) achievements.push({ id: 'hundred_doses', icon: Zap, label: locale === 'ru' ? '100 доз принято!' : '100 Doses Taken!' });
    if (overallAdherence === 100 && allDoses > 0) achievements.push({ id: 'perfect', icon: Award, label: locale === 'ru' ? 'Идеальная неделя!' : 'Perfect Week!' });

    return {
      dayStats,
      overall: {
        totalDoses: allDoses,
        taken: allTaken,
        skipped: allSkipped,
        snoozed: allSnoozed,
        adherence: overallAdherence,
        activeSchedules,
        totalItems,
        currentStreak,
        bestStreak,
      },
      medicationStats,
      bestMedication,
      worstMedication,
      achievements,
    };
  }, [period, locale]);

  return (
    <div>
      <TopBar title={t('common.insights')} />

      <div className="space-y-6">
        {/* Period Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('week')}
            className={`flex-1 py-2 rounded-[18px] text-sm font-semibold transition-colors ${
              period === 'week' 
                ? 'bg-[var(--acc)] text-white' 
                : 'bg-[var(--surface2)] text-[var(--muted2)]'
            }`}
          >
            {locale === 'ru' ? '7 дней' : '7 Days'}
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`flex-1 py-2 rounded-[18px] text-sm font-semibold transition-colors ${
              period === 'month' 
                ? 'bg-[var(--acc)] text-white' 
                : 'bg-[var(--surface2)] text-[var(--muted2)]'
            }`}
          >
            {locale === 'ru' ? '30 дней' : '30 Days'}
          </button>
        </div>

        {/* Achievements */}
        {stats.achievements.length > 0 && (
          <Card className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
                <Award size={24} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-[var(--text)]">
                  {stats.achievements[0].label}
                </p>
                <p className="text-sm text-[var(--muted2)]">
                  {locale === 'ru' ? 'Достижение разблокировано' : 'Achievement Unlocked'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Overall Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-2xl font-black text-[var(--acc)] mb-1">
                {stats.overall.adherence}%
              </p>
              <p className="text-sm text-[var(--muted2)]">
                {locale === 'ru' ? 'Адгеранс' : 'Adherence'}
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-2xl font-black text-green-500 mb-1">
                {stats.overall.taken}
              </p>
              <p className="text-sm text-[var(--muted2)]">
                {locale === 'ru' ? 'Принято' : 'Taken'}
              </p>
            </div>
          </Card>
        </div>

        {/* Streak Card */}
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Flame size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-black text-[var(--text)]">
                  {stats.overall.currentStreak} {locale === 'ru' ? 'дней' : 'days'}
                </p>
                <p className="text-sm text-[var(--muted2)]">
                  {locale === 'ru' ? 'Текущая серия' : 'Current Streak'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[var(--text)]">{stats.overall.bestStreak}</p>
              <p className="text-xs text-[var(--muted2)]">
                {locale === 'ru' ? 'Рекорд' : 'Best'}
              </p>
            </div>
          </div>
        </Card>

        {/* Weekly Chart */}
        <Card>
          <h3 className="text-lg font-black text-[var(--text)] mb-4">
            {locale === 'ru' 
              ? (period === 'week' ? 'Последние 7 дней' : 'Последние 30 дней') 
              : (period === 'week' ? 'Last 7 Days' : 'Last 30 Days')}
          </h3>
          
          <div className="space-y-4">
            {stats.dayStats.map((day, index) => {
              const isCurrentDay = isToday(day.date);
              const takenHeight = day.total > 0 ? (day.taken / day.total) * 100 : 0;
              const skippedHeight = day.total > 0 ? (day.skipped / day.total) * 100 : 0;
              const snoozedHeight = day.total > 0 ? (day.snoozed / day.total) * 100 : 0;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${isCurrentDay ? 'text-[var(--acc)]' : 'text-[var(--text)]'}`}>
                        {day.dateStr}
                      </span>
                      {isCurrentDay && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--acc2)]/10 text-[var(--acc2)]">
                          {locale === 'ru' ? 'Сегодня' : 'Today'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--muted2)]">
                      {day.total > 0 && (
                        <>
                          <span className="text-green-500 font-semibold">{day.taken}</span>
                          {day.skipped > 0 && (
                            <span className="text-red-500 font-semibold">{day.skipped}</span>
                          )}
                          {day.snoozed > 0 && (
                            <span className="text-blue-500 font-semibold">{day.snoozed}</span>
                          )}
                          <span className="text-[var(--muted2)]">{day.adherence}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {day.total > 0 ? (
                    <div className="relative h-8 bg-[var(--surface2)] rounded-full overflow-hidden">
                      {/* Taken (Green) */}
                      {day.taken > 0 && (
                        <div
                          className="absolute left-0 top-0 h-full bg-green-500 rounded-l-full"
                          style={{ width: `${takenHeight}%` }}
                        />
                      )}
                      {/* Skipped (Red) */}
                      {day.skipped > 0 && (
                        <div
                          className="absolute h-full bg-red-500"
                          style={{ 
                            left: `${takenHeight}%`,
                            width: `${skippedHeight}%`
                          }}
                        />
                      )}
                      {/* Snoozed (Blue) */}
                      {day.snoozed > 0 && (
                        <div
                          className="absolute h-full bg-blue-500"
                          style={{ 
                            left: `${takenHeight + skippedHeight}%`,
                            width: `${snoozedHeight}%`
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="h-8 bg-[var(--surface2)] rounded-full flex items-center justify-center">
                      <span className="text-xs text-[var(--muted2)]">
                        {locale === 'ru' ? 'Нет доз' : 'No doses'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-2xl font-black text-[var(--text)] mb-1">
                {stats.overall.totalDoses}
              </p>
              <p className="text-sm text-[var(--muted2)]">
                {locale === 'ru' ? 'Всего доз' : 'Total Doses'}
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-2xl font-black text-[var(--text)] mb-1">
                {stats.overall.activeSchedules}
              </p>
              <p className="text-sm text-[var(--muted2)]">
                {locale === 'ru' ? 'Активных расписаний' : 'Active Schedules'}
              </p>
            </div>
          </Card>
        </div>

        {/* Medication Stats */}
        {stats.medicationStats.length > 0 && (
          <Card>
            <h3 className="text-lg font-black text-[var(--text)] mb-4">
              {locale === 'ru' ? 'По препаратам' : 'By Medication'}
            </h3>
            <div className="space-y-3">
              {stats.medicationStats.slice(0, 5).map(med => (
                <div key={med.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text)] truncate">{med.name}</p>
                    <p className="text-xs text-[var(--muted2)]">
                      {locale === 'ru' ? `${med.taken} из ${med.taken + med.skipped}` : `${med.taken} of ${med.taken + med.skipped}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-[var(--surface2)] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${med.adherence >= 80 ? 'bg-green-500' : med.adherence >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${med.adherence}%` }}
                      />
                    </div>
                    <span className={`text-sm font-bold w-12 text-right ${med.adherence >= 80 ? 'text-green-500' : med.adherence >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                      {med.adherence}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Legend */}
        <Card>
          <h3 className="text-sm font-semibold text-[var(--text)] mb-3">
            {locale === 'ru' ? 'Легенда' : 'Legend'}
          </h3>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-[var(--muted2)]">
                {locale === 'ru' ? 'Принято' : 'Taken'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-[var(--muted2)]">
                {locale === 'ru' ? 'Пропущено' : 'Skipped'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-[var(--muted2)]">
                {locale === 'ru' ? 'Перенесено' : 'Snoozed'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
