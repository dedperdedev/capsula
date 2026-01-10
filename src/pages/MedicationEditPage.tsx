/**
 * Medication Edit Page
 * iOS-style edit screen with chips and form cards
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ChipGroup } from '../components/shared/ChipGroup';
import { FormCard } from '../components/shared/FormCard';
import { BlueHeroHeader } from '../components/shared/BlueHeroHeader';
import { itemsStore, schedulesStore } from '../data/store';
import { toast } from '../components/shared/Toast';
import { useI18n } from '../hooks/useI18n';
import type { Item, ItemForm } from '../data/types';
import { Droplet, Syringe, Wind } from 'lucide-react';

const TIME_PRESETS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00',
];

const FOOD_TIMING_OPTIONS = [
  { id: 'any', label: { ru: 'В любое время', en: 'Any time' } },
  { id: 'before', label: { ru: 'До еды', en: 'Before food' } },
  { id: 'after', label: { ru: 'Во время еды', en: 'With food' } },
];

const FREQUENCY_OPTIONS = [
  { id: '1', label: { ru: '1 раз в день', en: '1 time a day' } },
  { id: '2', label: { ru: '2 раза в день', en: '2 times a day' } },
  { id: '3', label: { ru: '3 раза в день', en: '3 times a day' } },
];

const SCHEDULE_OPTIONS = [
  { id: 'daily', label: { ru: 'Каждый день', en: 'Every day' } },
  { id: '0', label: { ru: 'Воскресенье', en: 'Sunday' } },
  { id: '1', label: { ru: 'Понедельник', en: 'Monday' } },
  { id: '2', label: { ru: 'Вторник', en: 'Tuesday' } },
  { id: '3', label: { ru: 'Среда', en: 'Wednesday' } },
  { id: '4', label: { ru: 'Четверг', en: 'Thursday' } },
  { id: '5', label: { ru: 'Пятница', en: 'Friday' } },
  { id: '6', label: { ru: 'Суббота', en: 'Saturday' } },
];

const FORM_OPTIONS: Array<{ id: ItemForm; label: { ru: string; en: string }; icon: string | React.ReactNode }> = [
  { id: 'tablet', label: { ru: 'Таблетка', en: 'Tablet' }, icon: '💊' },
  { id: 'capsule', label: { ru: 'Капсула', en: 'Capsule' }, icon: '💊' },
  { id: 'drops', label: { ru: 'Капли', en: 'Drops' }, icon: <Droplet size={24} /> },
  { id: 'syrup', label: { ru: 'Сироп', en: 'Syrup' }, icon: '🧴' },
  { id: 'injection', label: { ru: 'Инъекция', en: 'Injection' }, icon: <Syringe size={24} /> },
  { id: 'spray', label: { ru: 'Спрей', en: 'Spray' }, icon: <Wind size={24} /> },
  { id: 'powder', label: { ru: 'Порошок', en: 'Powder' }, icon: '🥄' },
  { id: 'patch', label: { ru: 'Пластырь', en: 'Patch' }, icon: '🩹' },
];

export function MedicationEditPage() {
  const { itemId, scheduleId } = useParams<{ itemId: string; scheduleId?: string }>();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const [item, setItem] = useState<Item | null>(null);
  const [schedule, setSchedule] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [foodTiming, setFoodTiming] = useState<string>('any');
  const [frequency, setFrequency] = useState<string>('1');
  const [scheduleDays, setScheduleDays] = useState<string[]>(['daily']);
  const [selectedForm, setSelectedForm] = useState<ItemForm>('tablet');

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
    setName(loadedItem.name);
    setSelectedForm(loadedItem.form);

    // Load schedule (use first schedule if scheduleId not provided)
    const schedules = schedulesStore.getByItemId(itemId);
    const targetSchedule = scheduleId 
      ? schedules.find(s => s.id === scheduleId) 
      : schedules[0];

    if (targetSchedule) {
      setSchedule(targetSchedule);
      setSelectedTimes(targetSchedule.times || []);
      setFoodTiming(
        targetSchedule.withFood === 'before' ? 'before' :
        targetSchedule.withFood === 'after' ? 'after' : 'any'
      );
      
      // Calculate frequency from times
      const timesCount = targetSchedule.times?.length || 1;
      setFrequency(String(timesCount));

      // Set schedule days
      if (targetSchedule.daysOfWeek && targetSchedule.daysOfWeek.length === 7) {
        setScheduleDays(['daily']);
      } else if (targetSchedule.daysOfWeek && targetSchedule.daysOfWeek.length > 0) {
        setScheduleDays(targetSchedule.daysOfWeek.map(d => String(d)));
      } else {
        setScheduleDays(['daily']);
      }
    } else {
      // No schedule - create defaults
      setSelectedTimes(['08:00']);
      setScheduleDays(['daily']);
    }

    setLoading(false);
  }, [itemId, scheduleId, navigate, locale]);

  const handleTimeToggle = (time: string) => {
    setSelectedTimes(prev => {
      if (prev.includes(time)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter(t => t !== time);
      }
      const maxTimes = parseInt(frequency) || 1;
      if (prev.length >= maxTimes) {
        // Replace oldest with new
        return [...prev.slice(1), time].sort();
      }
      return [...prev, time].sort();
    });
  };

  const handleFrequencyChange = (freqId: string) => {
    const newFreq = parseInt(freqId) || 1;
    setFrequency(freqId);
    
    // Adjust times to match frequency
    if (selectedTimes.length > newFreq) {
      setSelectedTimes(prev => prev.slice(0, newFreq));
    } else if (selectedTimes.length < newFreq) {
      // Add default times
      const defaults = TIME_PRESETS.filter(t => !selectedTimes.includes(t)).slice(0, newFreq - selectedTimes.length);
      setSelectedTimes(prev => [...prev, ...defaults].sort());
    }
  };

  const handleScheduleDayToggle = (dayId: string) => {
    setScheduleDays(prev => {
      if (dayId === 'daily') {
        return ['daily'];
      }
      // Remove 'daily' if selecting specific days
      const withoutDaily = prev.filter(d => d !== 'daily');
      if (withoutDaily.includes(dayId)) {
        if (withoutDaily.length <= 1) return ['daily']; // Keep at least one day
        return withoutDaily.filter(d => d !== dayId);
      }
      return [...withoutDaily, dayId];
    });
  };

  const handleSave = () => {
    if (!item || !name.trim()) {
      toast.error(locale === 'ru' ? 'Введите название препарата' : 'Enter medication name');
      return;
    }

    if (selectedTimes.length === 0) {
      toast.error(locale === 'ru' ? 'Выберите время приема' : 'Select intake time');
      return;
    }

    // Update item
    itemsStore.update(item.id, {
      name: name.trim(),
      form: selectedForm,
    });

    // Update or create schedule
    const daysOfWeek = scheduleDays.includes('daily')
      ? [0, 1, 2, 3, 4, 5, 6]
      : scheduleDays.map(d => parseInt(d));

    const withFood = 
      foodTiming === 'before' ? 'before' :
      foodTiming === 'after' ? 'after' : 'none';

    if (schedule) {
      schedulesStore.update(schedule.id, {
        times: selectedTimes,
        daysOfWeek,
        withFood,
      });
    } else if (item) {
      schedulesStore.create({
        itemId: item.id,
        times: selectedTimes,
        daysOfWeek,
        withFood,
        enabled: true,
        startDate: new Date().toISOString().split('T')[0],
      });
    }

    toast.success(locale === 'ru' ? 'Изменения сохранены' : 'Changes saved');
    navigate(-1); // Go back
  };

  if (loading || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--muted2)]">{locale === 'ru' ? 'Загрузка...' : 'Loading...'}</p>
      </div>
    );
  }

  const timeOptions = TIME_PRESETS.map(time => ({ id: time, label: time }));
  const selectedTimeIds = selectedTimes;

  const leftAction = (
    <button
      onClick={() => navigate(-1)}
      className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
      aria-label={locale === 'ru' ? 'Назад' : 'Back'}
    >
      <ArrowLeft size={20} />
    </button>
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24">
      <BlueHeroHeader
        variant="compact"
        title={locale === 'ru' ? 'Изменить лекарство' : 'Edit medication'}
        leftAction={leftAction}
      />

      {/* White content sheet with rounded top corners */}
      <div className="bg-[var(--surface)] rounded-t-[24px] -mt-4 relative z-10 px-5 py-6 space-y-6">
        {/* Name Input */}
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-2">
            {locale === 'ru' ? 'Название лекарства' : 'Medication name'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-[18px] border border-[var(--stroke)] bg-[var(--surface)] text-[var(--text)] text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={locale === 'ru' ? 'Название лекарства' : 'Medication name'}
              autoFocus
            />
            {name && (
              <button
                onClick={() => setName('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-[var(--surface2)] text-[var(--muted2)]"
                aria-label={locale === 'ru' ? 'Очистить' : 'Clear'}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Time Chips */}
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-3">
            {locale === 'ru' ? 'Время приёма' : 'Intake time'}
          </label>
          <ChipGroup
            options={timeOptions}
            selectedIds={selectedTimeIds}
            onSelect={handleTimeToggle}
          />
        </div>

        {/* Food Timing */}
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-3">
            {locale === 'ru' ? 'Когда принимать' : 'When to take'}
          </label>
          <ChipGroup
            options={FOOD_TIMING_OPTIONS.map(opt => ({ 
              id: opt.id, 
              label: opt.label[locale] 
            }))}
            selectedIds={[foodTiming]}
            onSelect={(id) => setFoodTiming(id)}
          />
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-3">
            {locale === 'ru' ? 'Частота приёма' : 'Frequency of intake'}
          </label>
          <ChipGroup
            options={FREQUENCY_OPTIONS.map(opt => ({ 
              id: opt.id, 
              label: opt.label[locale] 
            }))}
            selectedIds={[frequency]}
            onSelect={handleFrequencyChange}
          />
        </div>

        {/* Schedule Days */}
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-3">
            {locale === 'ru' ? 'Расписание' : 'Schedule'}
          </label>
          <ChipGroup
            options={SCHEDULE_OPTIONS.map(opt => ({ 
              id: opt.id, 
              label: opt.label[locale] 
            }))}
            selectedIds={scheduleDays}
            onSelect={handleScheduleDayToggle}
          />
        </div>

        {/* Dosage Form Cards */}
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-3">
            {locale === 'ru' ? 'Форма выпуска' : 'Release form'}
          </label>
          <div className="overflow-x-auto -mx-1 px-1">
            <div className="flex gap-3 pb-2" style={{ minWidth: 'max-content' }}>
              {FORM_OPTIONS.map((form) => (
                <div key={form.id} className="w-[100px] flex-shrink-0">
                  <FormCard
                    icon={typeof form.icon === 'string' ? <span>{form.icon}</span> : form.icon}
                    label={form.label[locale]}
                    selected={selectedForm === form.id}
                    onClick={() => setSelectedForm(form.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg)] pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-4 px-5 border-t border-[var(--stroke)]">
        <button
          onClick={handleSave}
          className="w-full py-4 rounded-[18px] bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-base transition-colors shadow-sm"
        >
          {locale === 'ru' ? 'Готово' : 'Done'}
        </button>
      </div>
    </div>
  );
}
