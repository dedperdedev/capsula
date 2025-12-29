import { useMemo } from 'react';
import { format, startOfDay, subDays, eachDayOfInterval, isToday } from 'date-fns';
import { TopBar } from '../components/shared/TopBar';
import { Card } from '../components/shared/Card';
import { useI18n } from '../hooks/useI18n';
import { schedulesStore, itemsStore } from '../data/store';
import { getTodayDoses } from '../data/todayDoses';

export function InsightsPage() {
  const { t, locale } = useI18n();

  // Get data for last 7 days
  const stats = useMemo(() => {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 6);
    const days = eachDayOfInterval({ start: sevenDaysAgo, end: today });

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
      },
    };
  }, []);

  return (
    <div>
      <TopBar title={t('common.insights')} />

      <div className="space-y-6">
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
              <p className="text-2xl font-black text-[var(--text)] mb-1">
                {stats.overall.taken}
              </p>
              <p className="text-sm text-[var(--muted2)]">
                {locale === 'ru' ? 'Принято' : 'Taken'}
              </p>
            </div>
          </Card>
        </div>

        {/* Weekly Chart */}
        <Card>
          <h3 className="text-lg font-black text-[var(--text)] mb-4">
            {locale === 'ru' ? 'Последние 7 дней' : 'Last 7 Days'}
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

        {/* Legend */}
        <Card>
          <h3 className="text-sm font-semibold text-[var(--text)] mb-3">
            {locale === 'ru' ? 'Легенда' : 'Legend'}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500" />
              <span className="text-sm text-[var(--muted2)]">
                {locale === 'ru' ? 'Принято' : 'Taken'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500" />
              <span className="text-sm text-[var(--muted2)]">
                {locale === 'ru' ? 'Пропущено' : 'Skipped'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500" />
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
