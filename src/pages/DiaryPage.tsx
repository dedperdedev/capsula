/**
 * Diary Page
 * Symptom diary and measurements tracking
 */

import { useState, useEffect, useMemo } from 'react';
import { Plus, Heart, Trash2, Link2 } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { TopBar } from '../components/shared/TopBar';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { Modal } from '../components/shared/Modal';
import { useI18n } from '../hooks/useI18n';
import { loadAppState, type SymptomType, type MeasurementType, type SymptomEntry, type MeasurementEntry } from '../data/storage';
import { 
  getSymptomEntries, 
  getMeasurementEntries,
  addSymptomEntry,
  addMeasurementEntry,
  deleteSymptomEntry,
  deleteMeasurementEntry,
  getSymptomsAfterDoses,
  SYMPTOM_LABELS,
  MEASUREMENT_LABELS,
} from '../lib/diary';

type ViewMode = 'timeline' | 'symptoms' | 'measurements' | 'correlations';
type EntryType = 'symptom' | 'measurement';

export function DiaryPage() {
  const { locale } = useI18n();
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<EntryType>('symptom');
  const [filterMedication, setFilterMedication] = useState<string | null>(null);
  const days = 30;

  // Form state
  const [symptomType, setSymptomType] = useState<SymptomType>('headache');
  const [severity, setSeverity] = useState(5);
  const [measurementType, setMeasurementType] = useState<MeasurementType>('BP');
  const [measurementValue, setMeasurementValue] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    loadData();
  }, [days, filterMedication]);

  const loadData = () => {
    setSymptoms(getSymptomEntries(undefined, days));
    setMeasurements(getMeasurementEntries(undefined, days));
  };

  const state = loadAppState();
  const medications = state.medications;

  // Combined timeline
  type TimelineItem = 
    | { type: 'symptom'; entry: SymptomEntry; ts: Date }
    | { type: 'measurement'; entry: MeasurementEntry; ts: Date };

  const timeline = useMemo(() => {
    const items: TimelineItem[] = [];
    
    for (const s of symptoms) {
      if (filterMedication && s.relatedMedicationId !== filterMedication) continue;
      items.push({ type: 'symptom', entry: s, ts: new Date(s.ts) });
    }
    
    for (const m of measurements) {
      items.push({ type: 'measurement', entry: m, ts: new Date(m.ts) });
    }

    return items.sort((a, b) => b.ts.getTime() - a.ts.getTime());
  }, [symptoms, measurements, filterMedication]);

  // Group by day
  const groupedTimeline = useMemo(() => {
    const groups: Map<string, typeof timeline> = new Map();
    
    for (const item of timeline) {
      const dateKey = format(item.ts, 'yyyy-MM-dd');
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(item);
    }

    return Array.from(groups.entries()).map(([date, items]) => ({
      date,
      dateLabel: format(new Date(date), 'd MMMM'),
      items,
      isToday: isSameDay(new Date(date), new Date()),
    }));
  }, [timeline]);

  // Correlations
  const correlations = useMemo(() => {
    return getSymptomsAfterDoses(24, days);
  }, [days]);

  const handleAddSymptom = () => {
    addSymptomEntry({
      symptomType,
      severity,
      note: note || undefined,
      relatedMedicationId: filterMedication || undefined,
    });
    setShowAddModal(false);
    resetForm();
    loadData();
  };

  const handleAddMeasurement = () => {
    const info = MEASUREMENT_LABELS[measurementType];
    addMeasurementEntry({
      type: measurementType,
      value: measurementValue,
      unit: info.defaultUnit,
      note: note || undefined,
    });
    setShowAddModal(false);
    resetForm();
    loadData();
  };

  const resetForm = () => {
    setSymptomType('headache');
    setSeverity(5);
    setMeasurementType('BP');
    setMeasurementValue('');
    setNote('');
  };

  const handleDelete = (type: 'symptom' | 'measurement', id: string) => {
    if (type === 'symptom') {
      deleteSymptomEntry(id);
    } else {
      deleteMeasurementEntry(id);
    }
    loadData();
  };

  const openAddModal = (type: EntryType) => {
    setAddType(type);
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24">
      <TopBar 
        title={locale === 'ru' ? 'Дневник' : 'Diary'}
        rightContent={
          <button
            onClick={() => openAddModal('symptom')}
            className="w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center"
          >
            <Plus size={20} className="text-white" />
          </button>
        }
      />

      <div className="px-4 pt-2">
        {/* View mode tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {(['timeline', 'symptoms', 'measurements', 'correlations'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface2)] text-[var(--muted)]'
              }`}
            >
              {mode === 'timeline' && (locale === 'ru' ? 'Хронология' : 'Timeline')}
              {mode === 'symptoms' && (locale === 'ru' ? 'Симптомы' : 'Symptoms')}
              {mode === 'measurements' && (locale === 'ru' ? 'Измерения' : 'Measurements')}
              {mode === 'correlations' && (locale === 'ru' ? 'Связи' : 'Correlations')}
            </button>
          ))}
        </div>

        {/* Quick add buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openAddModal('symptom')}
          >
            <Plus size={14} className="mr-1" />
            {locale === 'ru' ? 'Симптом' : 'Symptom'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openAddModal('measurement')}
          >
            <Heart size={14} className="mr-1" />
            {locale === 'ru' ? 'Измерение' : 'Measurement'}
          </Button>

          {/* Filter by medication */}
          <div className="ml-auto">
            <select
              value={filterMedication || ''}
              onChange={(e) => setFilterMedication(e.target.value || null)}
              className="bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-1.5 text-sm border border-[var(--border)]"
            >
              <option value="">{locale === 'ru' ? 'Все препараты' : 'All medications'}</option>
              {medications.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Timeline view */}
        {viewMode === 'timeline' && (
          <div className="space-y-4">
            {groupedTimeline.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-[var(--muted)]">
                  {locale === 'ru' ? 'Нет записей' : 'No entries'}
                </p>
              </Card>
            ) : (
              groupedTimeline.map(group => (
                <div key={group.date}>
                  <h3 className="text-sm font-medium text-[var(--muted)] mb-2">
                    {group.isToday ? (locale === 'ru' ? 'Сегодня' : 'Today') : group.dateLabel}
                  </h3>
                  <Card>
                    <div className="space-y-3">
                      {group.items.map(item => {
                        if (item.type === 'symptom') {
                          const symptomEntry = item.entry;
                          return (
                            <div 
                              key={symptomEntry.id}
                              className="flex items-start gap-3 p-2 hover:bg-[var(--surface2)] rounded-lg transition-colors"
                            >
                              <span className="text-2xl">
                                {SYMPTOM_LABELS[symptomEntry.symptomType].emoji}
                              </span>
                              <div className="flex-1">
                                <p className="font-medium text-[var(--text)]">
                                  {SYMPTOM_LABELS[symptomEntry.symptomType][locale]}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-[var(--muted)]">
                                    {format(item.ts, 'HH:mm')}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-[var(--muted)]">
                                      {locale === 'ru' ? 'Сила' : 'Severity'}:
                                    </span>
                                    <span className={`text-xs font-medium ${
                                      symptomEntry.severity >= 7 ? 'text-red-400' :
                                      symptomEntry.severity >= 4 ? 'text-yellow-400' :
                                      'text-green-400'
                                    }`}>
                                      {symptomEntry.severity}/10
                                    </span>
                                  </div>
                                </div>
                                {symptomEntry.note && (
                                  <p className="text-xs text-[var(--muted2)] mt-1">
                                    {symptomEntry.note}
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleDelete('symptom', symptomEntry.id)}
                                className="p-1 hover:bg-red-500/20 rounded transition-colors"
                              >
                                <Trash2 size={14} className="text-[var(--muted2)]" />
                              </button>
                            </div>
                          );
                        } else {
                          const measurementEntry = item.entry;
                          return (
                            <div 
                              key={measurementEntry.id}
                              className="flex items-start gap-3 p-2 hover:bg-[var(--surface2)] rounded-lg transition-colors"
                            >
                              <span className="text-2xl">
                                {MEASUREMENT_LABELS[measurementEntry.type].emoji}
                              </span>
                              <div className="flex-1">
                                <p className="font-medium text-[var(--text)]">
                                  {MEASUREMENT_LABELS[measurementEntry.type][locale]}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-[var(--muted)]">
                                    {format(item.ts, 'HH:mm')}
                                  </span>
                                  <span className="font-mono text-sm text-[var(--primary)]">
                                    {measurementEntry.value} {measurementEntry.unit}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDelete('measurement', measurementEntry.id)}
                                className="p-1 hover:bg-red-500/20 rounded transition-colors"
                              >
                                <Trash2 size={14} className="text-[var(--muted2)]" />
                              </button>
                            </div>
                          );
                        }
                      })}
                    </div>
                  </Card>
                </div>
              ))
            )}
          </div>
        )}

        {/* Correlations view */}
        {viewMode === 'correlations' && (
          <div className="space-y-4">
            <Card className="bg-blue-500/10 border-blue-500/20">
              <div className="flex items-start gap-3">
                <Link2 size={20} className="text-blue-400 mt-1" />
                <div>
                  <p className="text-sm text-blue-400">
                    {locale === 'ru' 
                      ? 'Симптомы, зафиксированные в течение 24ч после приема препарата'
                      : 'Symptoms recorded within 24h after taking medication'
                    }
                  </p>
                  <p className="text-xs text-blue-400/70 mt-1">
                    {locale === 'ru'
                      ? 'Информационно. Не является медицинским советом.'
                      : 'Informational only. Not medical advice.'
                    }
                  </p>
                </div>
              </div>
            </Card>

            {correlations.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-[var(--muted)]">
                  {locale === 'ru' ? 'Нет связей' : 'No correlations found'}
                </p>
              </Card>
            ) : (
              <Card>
                <div className="space-y-3">
                  {correlations.map((corr, i) => {
                    const symptomTypeKey = corr.symptom.symptomType as SymptomType;
                    return (
                    <div key={i} className="p-3 bg-[var(--surface2)] rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">
                          {SYMPTOM_LABELS[symptomTypeKey].emoji}
                        </span>
                        <span className="font-medium text-[var(--text)]">
                          {SYMPTOM_LABELS[symptomTypeKey][locale]}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          corr.symptom.severity >= 7 ? 'bg-red-500/20 text-red-400' :
                          corr.symptom.severity >= 4 ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {corr.symptom.severity}/10
                        </span>
                      </div>
                      <p className="text-sm text-[var(--muted)]">
                        {corr.hoursAfter}h {locale === 'ru' ? 'после' : 'after'} <span className="text-[var(--primary)]">{corr.dose.medicationName}</span>
                      </p>
                      <p className="text-xs text-[var(--muted2)]">
                        {format(new Date(corr.symptom.ts), 'd MMM, HH:mm')}
                      </p>
                    </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <div className="p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setAddType('symptom')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                addType === 'symptom'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface2)] text-[var(--muted)]'
              }`}
            >
              {locale === 'ru' ? 'Симптом' : 'Symptom'}
            </button>
            <button
              onClick={() => setAddType('measurement')}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                addType === 'measurement'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface2)] text-[var(--muted)]'
              }`}
            >
              {locale === 'ru' ? 'Измерение' : 'Measurement'}
            </button>
          </div>

          {addType === 'symptom' ? (
            <>
              <h2 className="text-xl font-bold text-[var(--text)] mb-4">
                {locale === 'ru' ? 'Добавить симптом' : 'Add Symptom'}
              </h2>

              {/* Symptom type grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(Object.keys(SYMPTOM_LABELS) as SymptomType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setSymptomType(type)}
                    className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                      symptomType === type
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--surface2)] text-[var(--text)]'
                    }`}
                  >
                    <span className="text-2xl">{SYMPTOM_LABELS[type].emoji}</span>
                    <span className="text-xs">{SYMPTOM_LABELS[type][locale]}</span>
                  </button>
                ))}
              </div>

              {/* Severity slider */}
              <div className="mb-4">
                <label className="block text-sm text-[var(--muted)] mb-2">
                  {locale === 'ru' ? 'Интенсивность' : 'Severity'}: {severity}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={severity}
                  onChange={(e) => setSeverity(parseInt(e.target.value))}
                  className="w-full accent-[var(--primary)]"
                />
                <div className="flex justify-between text-xs text-[var(--muted2)]">
                  <span>{locale === 'ru' ? 'Слабая' : 'Mild'}</span>
                  <span>{locale === 'ru' ? 'Сильная' : 'Severe'}</span>
                </div>
              </div>

              {/* Note */}
              <div className="mb-4">
                <label className="block text-sm text-[var(--muted)] mb-1">
                  {locale === 'ru' ? 'Заметка' : 'Note'}
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={locale === 'ru' ? 'Дополнительная информация...' : 'Additional info...'}
                  className="w-full bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-2 border border-[var(--border)] min-h-[80px]"
                />
              </div>

              <Button variant="primary" fullWidth onClick={handleAddSymptom}>
                {locale === 'ru' ? 'Добавить' : 'Add'}
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-[var(--text)] mb-4">
                {locale === 'ru' ? 'Добавить измерение' : 'Add Measurement'}
              </h2>

              {/* Measurement type */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(Object.keys(MEASUREMENT_LABELS) as MeasurementType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setMeasurementType(type)}
                    className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-colors ${
                      measurementType === type
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--surface2)] text-[var(--text)]'
                    }`}
                  >
                    <span className="text-2xl">{MEASUREMENT_LABELS[type].emoji}</span>
                    <span className="text-xs">{MEASUREMENT_LABELS[type][locale]}</span>
                  </button>
                ))}
              </div>

              {/* Value input */}
              <div className="mb-4">
                <label className="block text-sm text-[var(--muted)] mb-1">
                  {locale === 'ru' ? 'Значение' : 'Value'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={measurementValue}
                    onChange={(e) => setMeasurementValue(e.target.value)}
                    placeholder={measurementType === 'BP' ? '120/80' : '0'}
                    className="flex-1 bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-2 border border-[var(--border)]"
                  />
                  <span className="text-[var(--muted)] self-center">
                    {MEASUREMENT_LABELS[measurementType].defaultUnit}
                  </span>
                </div>
              </div>

              {/* Note */}
              <div className="mb-4">
                <label className="block text-sm text-[var(--muted)] mb-1">
                  {locale === 'ru' ? 'Заметка' : 'Note'}
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={locale === 'ru' ? 'Дополнительная информация...' : 'Additional info...'}
                  className="w-full bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-2 border border-[var(--border)] min-h-[80px]"
                />
              </div>

              <Button 
                variant="primary" 
                fullWidth 
                onClick={handleAddMeasurement}
                disabled={!measurementValue}
              >
                {locale === 'ru' ? 'Добавить' : 'Add'}
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

