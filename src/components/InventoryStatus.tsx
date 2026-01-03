/**
 * Inventory Status Component
 * Displays stock level, low stock warning, and "enough until" prediction
 */

import { useMemo } from 'react';
import { Package, AlertTriangle, TrendingDown, Calendar } from 'lucide-react';
import { Card } from './shared/Card';
import { Button } from './shared/Button';
import { inventoryStore, itemsStore } from '../data/store';
import { useI18n } from '../hooks/useI18n';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

interface InventoryStatusProps {
  compact?: boolean;
  showRefill?: boolean;
  onRefill?: (itemId: string) => void;
}

export function InventoryStatus({ compact = false, showRefill = true, onRefill }: InventoryStatusProps) {
  const { locale } = useI18n();
  const dateLocale = locale === 'ru' ? ru : enUS;

  const inventoryData = useMemo(() => {
    const items = itemsStore.getAll();
    const inventory = inventoryStore.getAll();

    return items.map(item => {
      const inv = inventory.find(i => i.itemId === item.id);
      const enoughUntil = inv ? inventoryStore.getEnoughUntil(item.id) : null;

      let status: 'ok' | 'low' | 'critical' | 'empty' = 'ok';
      if (!inv || inv.remainingUnits === 0) {
        status = 'empty';
      } else if (inv.remainingUnits <= inv.lowThreshold / 2) {
        status = 'critical';
      } else if (inv.remainingUnits <= inv.lowThreshold) {
        status = 'low';
      }

      return {
        item,
        inventory: inv,
        enoughUntil,
        status,
        daysRemaining: enoughUntil ? differenceInDays(enoughUntil, new Date()) : null,
      };
    }).filter(d => d.inventory).sort((a, b) => {
      // Sort by status priority
      const priority = { empty: 0, critical: 1, low: 2, ok: 3 };
      return priority[a.status] - priority[b.status];
    });
  }, []);

  const urgentItems = inventoryData.filter(d => d.status === 'critical' || d.status === 'empty');
  const lowItems = inventoryData.filter(d => d.status === 'low');

  const formatEnoughUntil = (date: Date | null, days: number | null) => {
    if (!date || days === null) return null;
    
    if (isToday(date)) {
      return locale === 'ru' ? 'Закончится сегодня!' : 'Runs out today!';
    }
    if (isTomorrow(date)) {
      return locale === 'ru' ? 'Закончится завтра' : 'Runs out tomorrow';
    }
    if (days <= 7) {
      return locale === 'ru' 
        ? `Хватит на ${days} ${getDaysWord(days)}`
        : `Enough for ${days} days`;
    }
    return locale === 'ru'
      ? `До ${format(date, 'd MMMM', { locale: dateLocale })}`
      : `Until ${format(date, 'MMM d', { locale: dateLocale })}`;
  };

  const getDaysWord = (days: number) => {
    if (days === 1) return 'день';
    if (days >= 2 && days <= 4) return 'дня';
    return 'дней';
  };

  if (inventoryData.length === 0) {
    return null;
  }

  if (compact) {
    // Compact mode - just show alert if there are urgent items
    if (urgentItems.length === 0 && lowItems.length === 0) return null;

    return (
      <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[var(--text)] text-sm">
              {locale === 'ru' 
                ? `${urgentItems.length + lowItems.length} препаратов заканчиваются`
                : `${urgentItems.length + lowItems.length} medications running low`}
            </p>
            <p className="text-xs text-[var(--muted2)] truncate">
              {urgentItems.slice(0, 2).map(d => d.item.name).join(', ')}
              {urgentItems.length > 2 && ` +${urgentItems.length - 2}`}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Full mode - show all inventory with details
  return (
    <div className="space-y-4">
      {/* Urgent Alert */}
      {urgentItems.length > 0 && (
        <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle size={20} className="text-red-500" />
            <h3 className="font-bold text-red-500">
              {locale === 'ru' ? 'Срочно пополнить!' : 'Urgent: Refill Needed!'}
            </h3>
          </div>
          <div className="space-y-2">
            {urgentItems.map(d => (
              <div key={d.item.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[var(--text)]">{d.item.name}</p>
                  <p className="text-xs text-red-500">
                    {d.status === 'empty' 
                      ? (locale === 'ru' ? 'Закончился' : 'Out of stock')
                      : `${d.inventory?.remainingUnits} ${d.inventory?.unitLabel}`}
                  </p>
                </div>
                {showRefill && onRefill && (
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => onRefill(d.item.id)}
                  >
                    {locale === 'ru' ? 'Пополнить' : 'Refill'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Low Stock Warning */}
      {lowItems.length > 0 && (
        <Card className="border-amber-500/30">
          <div className="flex items-center gap-3 mb-3">
            <TrendingDown size={20} className="text-amber-500" />
            <h3 className="font-semibold text-amber-500">
              {locale === 'ru' ? 'Заканчиваются' : 'Running Low'}
            </h3>
          </div>
          <div className="space-y-2">
            {lowItems.map(d => (
              <div key={d.item.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[var(--text)]">{d.item.name}</p>
                  <p className="text-xs text-[var(--muted2)]">
                    {d.inventory?.remainingUnits} {d.inventory?.unitLabel}
                    {d.enoughUntil && (
                      <span className="ml-2 text-amber-500">
                        • {formatEnoughUntil(d.enoughUntil, d.daysRemaining)}
                      </span>
                    )}
                  </p>
                </div>
                {showRefill && onRefill && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onRefill(d.item.id)}
                  >
                    {locale === 'ru' ? 'Пополнить' : 'Refill'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All Inventory */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Package size={20} className="text-[var(--muted)]" />
          <h3 className="font-bold text-[var(--text)]">
            {locale === 'ru' ? 'Запасы' : 'Inventory'}
          </h3>
        </div>
        <div className="space-y-3">
          {inventoryData.map(d => {
            const percentage = d.inventory 
              ? Math.min(100, (d.inventory.remainingUnits / (d.inventory.lowThreshold * 5)) * 100)
              : 0;
            const barColor = d.status === 'ok' ? 'bg-green-500' 
              : d.status === 'low' ? 'bg-amber-500' 
              : 'bg-red-500';

            return (
              <div key={d.item.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[var(--text)]">{d.item.name}</span>
                  <span className="text-sm text-[var(--muted2)]">
                    {d.inventory?.remainingUnits || 0} {d.inventory?.unitLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-[var(--surface2)] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {d.enoughUntil && d.daysRemaining !== null && d.daysRemaining <= 14 && (
                    <div className="flex items-center gap-1 text-xs text-[var(--muted2)]">
                      <Calendar size={12} />
                      <span>{d.daysRemaining}d</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

