/**
 * Medication Details Page
 * Blue hero design with medication information cards
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Pill, Clock, Calendar, RotateCcw, ChevronRight } from 'lucide-react';
import { itemsStore, schedulesStore, inventoryStore, doseLogsStore } from '../data/store';
import { toast } from '../components/shared/Toast';
import { useI18n } from '../hooks/useI18n';
import type { Item, Schedule } from '../data/types';
import { format, parse, differenceInDays, startOfDay } from 'date-fns';
import { Modal } from '../components/shared/Modal';

export function MedicationDetailsPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const [item, setItem] = useState<Item | null>(null);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!itemId) {
      navigate('/today');
      return;
    }

    // Load item
    const loadedItem = itemsStore.get(itemId);
    if (!loadedItem) {
      toast.error(locale === 'ru' ? 'Препарат не найден' : 'Medication not found');
      navigate('/today');
      return;
    }

    setItem(loadedItem);

    // Load first schedule for this item
    const schedules = schedulesStore.getByItemId(itemId);
    if (schedules.length > 0) {
      setSchedule(schedules[0]);
    }

    setLoading(false);
  }, [itemId, navigate, locale]);

  const inventory = item ? inventoryStore.getByItemId(item.id) : null;

  // Calculate course progress - use adherence if available, otherwise time-based
  const getCourseProgress = () => {
    if (!schedule || !schedule.startDate) return null;
    
    const start = parse(schedule.startDate, 'yyyy-MM-dd', new Date());
    const end = schedule.endDate 
      ? parse(schedule.endDate, 'yyyy-MM-dd', new Date())
      : null;
    
    if (!end) return null;
    
    const today = startOfDay(new Date());
    const total = differenceInDays(end, start) + 1;
    const elapsed = Math.max(0, differenceInDays(today, start) + 1);
    
    // Try to calculate adherence-based progress
    if (item) {
      const logs = doseLogsStore.getAll().filter(log => 
        log.itemId === item.id && 
        new Date(log.scheduledFor) >= start &&
        (!end || new Date(log.scheduledFor) <= end)
      );
      const taken = logs.filter(log => log.action === 'taken').length;
      const totalScheduled = logs.length;
      
      if (totalScheduled > 0) {
        const adherenceProgress = Math.round((taken / totalScheduled) * 100);
        return { progress: adherenceProgress, total, elapsed, isAdherence: true };
      }
    }
    
    // Fallback to time-based progress
    const timeProgress = Math.min(100, Math.round((elapsed / total) * 100));
    return { progress: timeProgress, total, elapsed, isAdherence: false };
  };

  const courseProgress = getCourseProgress();

  // Get main time (first time or formatted)
  const mainTime = schedule && schedule.times.length > 0 ? schedule.times[0] : '—';

  // Calculate frequency text
  const frequencyText = schedule 
    ? schedule.times.length === 1 
      ? locale === 'ru' ? '1 раз в день' : '1 time a day'
      : locale === 'ru' ? `${schedule.times.length} раза в день` : `${schedule.times.length} times a day`
    : '—';

  const handleDelete = () => {
    if (!item) return;
    
    // Delete schedules
    const schedules = schedulesStore.getByItemId(item.id);
    schedules.forEach(s => schedulesStore.delete(s.id));
    
    // Delete inventory
    if (inventory) {
      // Inventory doesn't have delete, so we set to 0
      inventoryStore.update(item.id, { remainingUnits: 0 });
    }
    
    // Delete item
    itemsStore.delete(item.id);
    
    toast.success(locale === 'ru' ? 'Препарат удален' : 'Medication deleted');
    navigate(-1);
  };

  const handleAddDose = () => {
    // Stub for now - can wire to existing add dose logic
    toast.info(locale === 'ru' ? 'Добавление дозы (заглушка)' : 'Add dose (stub)');
  };

  if (loading || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--muted2)]">{locale === 'ru' ? 'Загрузка...' : 'Loading...'}</p>
      </div>
    );
  }

  // Format display name
  const displayName = `${item.name}${item.doseText ? ` - ${item.doseText}` : ''}`;

  // Description placeholder
  const description = item.notes || (locale === 'ru' 
    ? 'Описание отсутствует' 
    : 'No description available');

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 text-white pt-12 pb-8 px-5">
        {/* Top buttons */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
            aria-label={locale === 'ru' ? 'Назад' : 'Back'}
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/medications/${item.id}${schedule ? `/${schedule.id}` : ''}/edit`)}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label={locale === 'ru' ? 'Редактировать' : 'Edit'}
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
              aria-label={locale === 'ru' ? 'Удалить' : 'Delete'}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Drug icon + title */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-[20px] bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
            <Pill size={28} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold mb-2 leading-tight">
              {displayName}
            </h1>
            <p className="text-sm text-white/90 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* White content area */}
      <div className="px-5 -mt-6 relative z-10 space-y-4">
        {/* Reminders Card */}
        <div className="bg-[var(--surface)] rounded-[20px] p-4 shadow-sm border border-[var(--stroke)]">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-[var(--text)]">
              {locale === 'ru' ? 'Напоминания' : 'Reminders'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={schedule?.enabled ?? false}
                onChange={(e) => {
                  if (schedule) {
                    schedulesStore.update(schedule.id, { enabled: e.target.checked });
                    setSchedule({ ...schedule, enabled: e.target.checked });
                    toast.success(
                      e.target.checked 
                        ? (locale === 'ru' ? 'Напоминания включены' : 'Reminders enabled')
                        : (locale === 'ru' ? 'Напоминания выключены' : 'Reminders disabled')
                    );
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[var(--stroke)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>

        {/* Refill Card */}
        {inventory && (
          <div className="bg-[var(--surface)] rounded-[20px] p-4 shadow-sm border border-[var(--stroke)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold text-[var(--text)] mb-1">
                  {locale === 'ru' ? 'Пополнение рецепта' : 'Refill prescription'}
                </div>
                <div className="text-sm text-[var(--muted2)]">
                  {locale === 'ru' ? 'Осталось' : 'Remaining'} {inventory.remainingUnits} {inventory.unitLabel || (locale === 'ru' ? 'таблеток' : 'units')}
                </div>
              </div>
              <button className="flex items-center gap-1 text-blue-500 text-sm font-medium">
                {locale === 'ru' ? 'Рецепт' : 'Prescription'}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Course/Progress Card */}
        {schedule && schedule.startDate && (
          <div className="bg-[var(--surface)] rounded-[20px] p-4 shadow-sm border border-[var(--stroke)]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-base font-semibold text-[var(--text)] mb-3">
                  {locale === 'ru' ? 'Курс начался' : 'Course started'} {format(parse(schedule.startDate, 'yyyy-MM-dd', new Date()), locale === 'ru' ? 'd MMMM yyyy' : 'MMM d, yyyy')}
                </div>
                
                <div className="space-y-2">
                  {schedule.endDate && (
                    <div className="flex items-center gap-2 text-sm text-[var(--muted2)]">
                      <Calendar size={16} />
                      <span>{locale === 'ru' ? 'Продолж.' : 'Duration'}. {courseProgress?.total || 0} {locale === 'ru' ? 'дн.' : 'days'}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-[var(--muted2)]">
                    <Clock size={16} />
                    <span>{locale === 'ru' ? 'Время' : 'Time'} {mainTime}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--muted2)]">
                    <RotateCcw size={16} />
                    <span>{locale === 'ru' ? 'Частота' : 'Frequency'} {frequencyText}</span>
                  </div>
                </div>
              </div>

              {courseProgress && (
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg className="transform -rotate-90 w-20 h-20">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="var(--stroke)"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="rgb(34, 197, 94)"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - courseProgress.progress / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-[var(--text)] leading-tight">
                      {locale === 'ru' ? 'Пройдено' : 'Completed'}
                    </span>
                    <span className="text-xs font-bold text-[var(--text)]">
                      {courseProgress.progress}%
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {courseProgress && (
              <div className="flex items-center justify-end mt-2">
                <button className="flex items-center gap-1 text-blue-500 text-xs font-medium">
                  {locale === 'ru' ? 'Карта' : 'Card'}
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Where to buy (stub) */}
        <div className="bg-[var(--surface)] rounded-[20px] p-4 shadow-sm border border-[var(--stroke)]">
          <div className="text-base font-semibold text-[var(--text)]">
            {locale === 'ru' ? 'Где можно купить' : 'Where to buy'}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg)] pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-4 px-5 border-t border-[var(--stroke)]">
        <button
          onClick={handleAddDose}
          className="w-full py-4 rounded-[18px] bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-base transition-colors shadow-sm"
        >
          {locale === 'ru' ? 'Добавить дозу' : 'Add dose'}
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={locale === 'ru' ? 'Удалить препарат?' : 'Delete medication?'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted2)]">
            {locale === 'ru' 
              ? 'Вы уверены, что хотите удалить этот препарат? Это действие нельзя отменить.'
              : 'Are you sure you want to delete this medication? This action cannot be undone.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--stroke)] text-[var(--text)] hover:bg-[var(--surface2)] transition-colors"
            >
              {locale === 'ru' ? 'Отмена' : 'Cancel'}
            </button>
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                handleDelete();
              }}
              className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              {locale === 'ru' ? 'Удалить' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
