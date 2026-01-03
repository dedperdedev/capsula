/**
 * Quick Add Medication Wizard
 * Step-by-step wizard for quickly adding a new medication with schedule
 */

import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Pill, Clock, Package } from 'lucide-react';
import { Modal } from './shared/Modal';
import { Button } from './shared/Button';
import { Card } from './shared/Card';
import { itemsStore, schedulesStore, inventoryStore } from '../data/store';
import { toast } from './shared/Toast';
import { useI18n } from '../hooks/useI18n';
import type { ItemForm, ItemType } from '../data/types';

interface QuickAddWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const FORM_OPTIONS: { value: ItemForm; label: { ru: string; en: string }; icon: string }[] = [
  { value: 'tablet', label: { ru: 'Таблетки', en: 'Tablets' }, icon: '💊' },
  { value: 'capsule', label: { ru: 'Капсулы', en: 'Capsules' }, icon: '💊' },
  { value: 'syrup', label: { ru: 'Сироп', en: 'Syrup' }, icon: '🧴' },
  { value: 'drops', label: { ru: 'Капли', en: 'Drops' }, icon: '💧' },
  { value: 'injection', label: { ru: 'Инъекции', en: 'Injections' }, icon: '💉' },
  { value: 'spray', label: { ru: 'Спрей', en: 'Spray' }, icon: '🌫️' },
  { value: 'patch', label: { ru: 'Пластырь', en: 'Patch' }, icon: '🩹' },
  { value: 'powder', label: { ru: 'Порошок', en: 'Powder' }, icon: '🥄' },
];

const FREQUENCY_OPTIONS = [
  { id: 'once', label: { ru: '1 раз в день', en: 'Once daily' }, times: 1 },
  { id: 'twice', label: { ru: '2 раза в день', en: 'Twice daily' }, times: 2 },
  { id: 'three', label: { ru: '3 раза в день', en: 'Three times daily' }, times: 3 },
  { id: 'four', label: { ru: '4 раза в день', en: 'Four times daily' }, times: 4 },
  { id: 'weekly', label: { ru: '1 раз в неделю', en: 'Once weekly' }, times: 1, weekly: true },
];

const TIME_PRESETS = [
  { id: 'morning', time: '08:00', label: { ru: 'Утром', en: 'Morning' }, icon: '🌅' },
  { id: 'noon', time: '12:00', label: { ru: 'В обед', en: 'Noon' }, icon: '☀️' },
  { id: 'evening', time: '18:00', label: { ru: 'Вечером', en: 'Evening' }, icon: '🌆' },
  { id: 'night', time: '22:00', label: { ru: 'На ночь', en: 'Night' }, icon: '🌙' },
];

type WizardStep = 'name' | 'form' | 'frequency' | 'times' | 'inventory' | 'confirm';

export function QuickAddWizard({ isOpen, onClose, onComplete }: QuickAddWizardProps) {
  const { locale } = useI18n();
  const [step, setStep] = useState<WizardStep>('name');
  const [data, setData] = useState({
    name: '',
    form: 'tablet' as ItemForm,
    frequency: 'once',
    times: ['08:00'],
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    quantity: 30,
    unitLabel: locale === 'ru' ? 'таб.' : 'tabs',
  });

  const steps: WizardStep[] = ['name', 'form', 'frequency', 'times', 'inventory', 'confirm'];
  const currentStepIndex = steps.indexOf(step);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const handleFrequencyChange = (frequencyId: string) => {
    const freq = FREQUENCY_OPTIONS.find(f => f.id === frequencyId);
    if (!freq) return;

    setData(prev => ({
      ...prev,
      frequency: frequencyId,
      times: generateDefaultTimes(freq.times),
      daysOfWeek: freq.weekly ? [1] : [0, 1, 2, 3, 4, 5, 6], // Monday only for weekly
    }));
  };

  const generateDefaultTimes = (count: number): string[] => {
    const presets = ['08:00', '12:00', '18:00', '22:00'];
    return presets.slice(0, count);
  };

  const handleTimeToggle = (time: string) => {
    const freq = FREQUENCY_OPTIONS.find(f => f.id === data.frequency);
    const maxTimes = freq?.times || 1;

    setData(prev => {
      const exists = prev.times.includes(time);
      if (exists) {
        // Remove time
        return { ...prev, times: prev.times.filter(t => t !== time) };
      } else if (prev.times.length < maxTimes) {
        // Add time
        return { ...prev, times: [...prev.times, time].sort() };
      }
      return prev;
    });
  };

  const handleSave = () => {
    if (!data.name.trim()) {
      toast.error(locale === 'ru' ? 'Введите название препарата' : 'Enter medication name');
      return;
    }

    // Create item
    const item = itemsStore.create({
      name: data.name.trim(),
      type: 'medication' as ItemType,
      form: data.form,
      notes: '',
    });

    // Create schedule
    schedulesStore.create({
      itemId: item.id,
      times: data.times,
      daysOfWeek: data.daysOfWeek,
      enabled: true,
      startDate: new Date().toISOString().split('T')[0],
    });

    // Create inventory
    inventoryStore.create({
      itemId: item.id,
      remainingUnits: data.quantity,
      unitLabel: data.unitLabel,
      lowThreshold: Math.max(5, Math.floor(data.quantity * 0.2)),
    });

    toast.success(locale === 'ru' ? 'Препарат добавлен!' : 'Medication added!');
    handleClose();
    onComplete();
  };

  const handleClose = () => {
    setStep('name');
    setData({
      name: '',
      form: 'tablet',
      frequency: 'once',
      times: ['08:00'],
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      quantity: 30,
      unitLabel: locale === 'ru' ? 'таб.' : 'tabs',
    });
    onClose();
  };

  const getStepTitle = () => {
    switch (step) {
      case 'name': return locale === 'ru' ? 'Название препарата' : 'Medication Name';
      case 'form': return locale === 'ru' ? 'Форма выпуска' : 'Form';
      case 'frequency': return locale === 'ru' ? 'Как часто?' : 'How Often?';
      case 'times': return locale === 'ru' ? 'Время приема' : 'When to Take';
      case 'inventory': return locale === 'ru' ? 'Количество в упаковке' : 'Package Quantity';
      case 'confirm': return locale === 'ru' ? 'Подтверждение' : 'Confirm';
      default: return '';
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'name': return data.name.trim().length > 0;
      case 'times': return data.times.length > 0;
      case 'inventory': return data.quantity > 0;
      default: return true;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getStepTitle()}
      size="md"
    >
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-[var(--surface2)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[var(--acc)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="min-h-[200px]">
          {/* Step 1: Name */}
          {step === 'name' && (
            <div className="space-y-4">
              <input
                type="text"
                value={data.name}
                onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={locale === 'ru' ? 'Например: Аспирин' : 'E.g.: Aspirin'}
                className="w-full px-4 py-3 text-lg border border-[var(--stroke)] rounded-[18px] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--acc2)]"
                autoFocus
              />
              <p className="text-sm text-[var(--muted2)]">
                {locale === 'ru' 
                  ? 'Введите торговое название или действующее вещество'
                  : 'Enter brand name or active ingredient'}
              </p>
            </div>
          )}

          {/* Step 2: Form */}
          {step === 'form' && (
            <div className="grid grid-cols-2 gap-3">
              {FORM_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setData(prev => ({ ...prev, form: option.value }))}
                  className={`flex items-center gap-3 p-4 rounded-[18px] border transition-all ${
                    data.form === option.value
                      ? 'border-[var(--acc)] bg-[var(--acc)]/10'
                      : 'border-[var(--stroke)] hover:bg-[var(--surface2)]'
                  }`}
                >
                  <span className="text-2xl">{option.icon}</span>
                  <span className={`font-medium ${data.form === option.value ? 'text-[var(--acc)]' : 'text-[var(--text)]'}`}>
                    {option.label[locale]}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Frequency */}
          {step === 'frequency' && (
            <div className="space-y-3">
              {FREQUENCY_OPTIONS.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleFrequencyChange(option.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-[18px] border transition-all ${
                    data.frequency === option.id
                      ? 'border-[var(--acc)] bg-[var(--acc)]/10'
                      : 'border-[var(--stroke)] hover:bg-[var(--surface2)]'
                  }`}
                >
                  <span className={`font-medium ${data.frequency === option.id ? 'text-[var(--acc)]' : 'text-[var(--text)]'}`}>
                    {option.label[locale]}
                  </span>
                  {data.frequency === option.id && (
                    <Check size={20} className="text-[var(--acc)]" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Times */}
          {step === 'times' && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--muted2)]">
                {locale === 'ru' 
                  ? `Выберите ${FREQUENCY_OPTIONS.find(f => f.id === data.frequency)?.times || 1} время приема`
                  : `Select ${FREQUENCY_OPTIONS.find(f => f.id === data.frequency)?.times || 1} time(s)`}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {TIME_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => handleTimeToggle(preset.time)}
                    className={`flex items-center gap-3 p-4 rounded-[18px] border transition-all ${
                      data.times.includes(preset.time)
                        ? 'border-[var(--acc)] bg-[var(--acc)]/10'
                        : 'border-[var(--stroke)] hover:bg-[var(--surface2)]'
                    }`}
                  >
                    <span className="text-2xl">{preset.icon}</span>
                    <div className="text-left">
                      <p className={`font-medium ${data.times.includes(preset.time) ? 'text-[var(--acc)]' : 'text-[var(--text)]'}`}>
                        {preset.label[locale]}
                      </p>
                      <p className="text-sm text-[var(--muted2)]">{preset.time}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--muted2)]">
                <Clock size={16} />
                <span>
                  {locale === 'ru' 
                    ? 'Выбрано: ' + data.times.join(', ')
                    : 'Selected: ' + data.times.join(', ')}
                </span>
              </div>
            </div>
          )}

          {/* Step 5: Inventory */}
          {step === 'inventory' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  {locale === 'ru' ? 'Количество' : 'Quantity'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={data.quantity}
                    onChange={(e) => setData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    className="flex-1 px-4 py-3 border border-[var(--stroke)] rounded-[18px] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--acc2)]"
                    min="0"
                  />
                  <input
                    type="text"
                    value={data.unitLabel}
                    onChange={(e) => setData(prev => ({ ...prev, unitLabel: e.target.value }))}
                    placeholder={locale === 'ru' ? 'ед.' : 'units'}
                    className="w-24 px-4 py-3 border border-[var(--stroke)] rounded-[18px] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--acc2)]"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[10, 20, 30, 50, 100].map(qty => (
                  <button
                    key={qty}
                    onClick={() => setData(prev => ({ ...prev, quantity: qty }))}
                    className={`px-4 py-2 rounded-full border transition-colors ${
                      data.quantity === qty
                        ? 'border-[var(--acc)] bg-[var(--acc)] text-white'
                        : 'border-[var(--stroke)] text-[var(--muted2)] hover:bg-[var(--surface2)]'
                    }`}
                  >
                    {qty}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Confirm */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <Card className="bg-gradient-to-r from-[var(--acc)]/10 to-[var(--acc2)]/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--acc)] flex items-center justify-center">
                    <Pill size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[var(--text)]">{data.name}</h3>
                    <p className="text-sm text-[var(--muted2)]">
                      {FORM_OPTIONS.find(f => f.value === data.form)?.label[locale]}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-[var(--surface2)] rounded-[12px]">
                  <Clock size={18} className="text-[var(--muted2)]" />
                  <div>
                    <p className="font-medium text-[var(--text)]">
                      {FREQUENCY_OPTIONS.find(f => f.id === data.frequency)?.label[locale]}
                    </p>
                    <p className="text-sm text-[var(--muted2)]">{data.times.join(', ')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-[var(--surface2)] rounded-[12px]">
                  <Package size={18} className="text-[var(--muted2)]" />
                  <div>
                    <p className="font-medium text-[var(--text)]">
                      {data.quantity} {data.unitLabel}
                    </p>
                    <p className="text-sm text-[var(--muted2)]">
                      {locale === 'ru' ? 'В упаковке' : 'In package'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStepIndex > 0 && (
            <Button variant="ghost" onClick={handleBack}>
              <ChevronLeft size={18} className="mr-1" />
              {locale === 'ru' ? 'Назад' : 'Back'}
            </Button>
          )}
          <div className="flex-1" />
          {step === 'confirm' ? (
            <Button variant="primary" onClick={handleSave}>
              <Check size={18} className="mr-1" />
              {locale === 'ru' ? 'Добавить' : 'Add'}
            </Button>
          ) : (
            <Button 
              variant="primary" 
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {locale === 'ru' ? 'Далее' : 'Next'}
              <ChevronRight size={18} className="ml-1" />
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

