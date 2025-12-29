import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, Baby, Car, Droplet, Milk, 
  CheckCircle2, XCircle, AlertTriangle,
  Star, ChevronRight, ExternalLink, Pill, Package, Building2, FileText, Clock, ChevronDown, ChevronUp, ShoppingCart,
  Lightbulb, AlertCircle, Shield
} from 'lucide-react';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { useCabinet } from '../hooks/useCabinet';
import { toast } from '../components/shared/Toast';
import { getDrugById } from '../mocks/drugs';
import type { Drug, EligibilityCategory, EligibilityStatus } from '../data/drugTypes';
import { useI18n } from '../hooks/useI18n';

const ELIGIBILITY_ICONS: Record<EligibilityCategory, typeof ShieldAlert> = {
  allergies: ShieldAlert,
  pregnant: Baby,
  driving: Car,
  children: Baby,
  diabetics: Droplet,
  nursing: Milk,
};

const STATUS_ICONS: Record<EligibilityStatus, typeof CheckCircle2> = {
  can: CheckCircle2,
  cannot: XCircle,
  caution: AlertTriangle,
};

const STATUS_COLORS: Record<EligibilityStatus, string> = {
  can: 'text-green-600 dark:text-green-400',
  cannot: 'text-red-600 dark:text-red-400',
  caution: 'text-yellow-600 dark:text-yellow-400',
};


const STATUS_LABELS: Record<EligibilityStatus, { ru: string; en: string }> = {
  can: { ru: 'Можно', en: 'Can' },
  cannot: { ru: 'Нельзя', en: 'Cannot' },
  caution: { ru: 'С осторожностью', en: 'Caution' },
};

const CATEGORY_LABELS: Record<EligibilityCategory, { ru: string; en: string }> = {
  allergies: { ru: 'Аллергии', en: 'Allergies' },
  pregnant: { ru: 'Беременность', en: 'Pregnancy' },
  driving: { ru: 'Вождение', en: 'Driving' },
  children: { ru: 'Дети', en: 'Children' },
  diabetics: { ru: 'Диабет', en: 'Diabetics' },
  nursing: { ru: 'Грудное вскармливание', en: 'Nursing' },
};

// Порядок секций по важности: от критичной информации к деталям
const SECTIONS = [
  { id: 'at-a-glance', label: { ru: 'Обзор', en: 'Overview' } }, // 1. Что это за препарат
  { id: 'eligibility', label: { ru: 'Кому можно', en: 'Eligibility' } }, // 2. Безопасность - критично
  { id: 'how-to-take', label: { ru: 'Применение', en: 'How to take' } }, // 3. Как принимать
  { id: 'recommendations', label: { ru: 'Рекомендации', en: 'Recommendations' } }, // 4. Важные советы
  { id: 'characteristics', label: { ru: 'Характеристики', en: 'Characteristics' } }, // 5. Детали препарата
  { id: 'instruction', label: { ru: 'Инструкция', en: 'Instruction' } }, // 6. Официальная инструкция
  { id: 'reviews', label: { ru: 'Отзывы', en: 'Reviews' } }, // 7. Социальное доказательство
  { id: 'description', label: { ru: 'Описание', en: 'Description' } }, // 8. Подробное описание
  { id: 'analogs', label: { ru: 'Аналоги', en: 'Analogs' } }, // 9. Альтернативы
];


function groupCharacteristics(chars: Drug['characteristics']) {
  const main: typeof chars = [];
  const storage: typeof chars = [];
  const registration: typeof chars = [];
  const other: typeof chars = [];

  const mainKeys = ['Количество в упаковке', 'Форма выпуска', 'Дозировка', 'Действующие вещества', 'Фармакотерапевтическая группа', 'Код АТХ'];
  const storageKeys = ['Срок годности', 'Условия хранения'];
  const registrationKeys = ['Регистрационный номер', 'Дата регистрации', 'Условие отпуска', 'Производитель'];

  chars.forEach(char => {
    if (mainKeys.some(k => char.key.includes(k))) {
      main.push(char);
    } else if (storageKeys.some(k => char.key.includes(k))) {
      storage.push(char);
    } else if (registrationKeys.some(k => char.key.includes(k))) {
      registration.push(char);
    } else {
      other.push(char);
    }
  });

  return { main, storage, registration, other };
}

export function DrugDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const { isInCabinet, addToCabinet } = useCabinet();
  const [drug, setDrug] = useState<Drug | null>(null);
  const [activeSection, setActiveSection] = useState<string>('at-a-glance');
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [expandedCharacteristics, setExpandedCharacteristics] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState(false);
  const [expandedAnalogs, setExpandedAnalogs] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (id) {
      const found = getDrugById(id);
      if (found) {
        setDrug(found);
      } else {
        navigate('/library');
      }
    }
  }, [id, navigate]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const options = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0,
    };

    SECTIONS.forEach(section => {
      const element = sectionRefs.current[section.id];
      if (element) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setActiveSection(section.id);
            }
          });
        }, options);
        observer.observe(element);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach(obs => obs.disconnect());
    };
  }, [drug]);

  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAddToCabinet = () => {
    if (drug) {
      addToCabinet(drug.id);
      toast.success(locale === 'ru' ? 'Добавлено в аптечку' : 'Added to cabinet');
    }
  };

  if (!drug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--muted2)]">Loading...</p>
      </div>
    );
  }

  const inCabinet = isInCabinet(drug.id);
  const charGroups = groupCharacteristics(drug.characteristics);
  const visibleCharacteristics = expandedCharacteristics 
    ? drug.characteristics 
    : charGroups.main;
  const visibleReviews = expandedReviews 
    ? drug.reviews 
    : drug.reviews.slice(0, 2);
  const visibleAnalogs = expandedAnalogs 
    ? drug.analogs 
    : drug.analogs.slice(0, 4);

  // Extract "How to take" - simple match for text after "Способ применения и дозы:"
  const howToTakeMatch = drug.descriptionFull.match(/Способ применения и дозы:\s*\n?([^\n]+)/);
  const howToTake = howToTakeMatch ? howToTakeMatch[1].trim() : null;

  // Extract active ingredient from characteristics
  const activeIngredient = drug.characteristics.find(c => 
    c.key.includes('Действующие вещества') || c.key.includes('Active ingredient')
  )?.value || null;

  return (
    <div className="pb-6">
      {/* Hero Section - Image + Title + At a Glance */}
      <div
        id="at-a-glance"
        ref={el => sectionRefs.current['at-a-glance'] = el}
        className="mb-6 scroll-mt-4"
      >
        {/* Header with Image - Enhanced Design */}
        <Card className="p-5 mb-4 bg-gradient-to-br from-[var(--surface)] to-[var(--surface2)]">
          <div className="flex gap-5 items-start">
            {/* Drug Image - Enhanced with shadow and better styling */}
            <div className="flex-shrink-0 relative">
              {drug.imageUrl ? (
                <div className="relative">
                  <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-[var(--acc2)]/20 to-transparent blur-xl"></div>
                  <img
                    src={drug.imageUrl}
                    alt={drug.name}
                    className="relative w-32 h-32 rounded-[24px] object-cover border-2 border-[var(--stroke)] bg-[var(--surface2)] shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const placeholder = target.parentElement?.parentElement?.querySelector('.image-placeholder') as HTMLElement;
                      if (placeholder) {
                        placeholder.style.display = 'flex';
                      }
                    }}
                  />
                </div>
              ) : null}
              <div 
                className={`image-placeholder w-32 h-32 rounded-[24px] border-2 border-[var(--stroke)] bg-gradient-to-br from-[var(--surface2)] to-[var(--stroke)] flex items-center justify-center shadow-lg ${drug.imageUrl ? 'hidden' : ''}`}
              >
                <Pill size={48} className="text-[var(--acc2)]" />
              </div>
            </div>
            
            {/* Title and Manufacturer - Enhanced typography */}
            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-2xl font-black text-[var(--text)] mb-2 leading-tight tracking-tight">
                {drug.name}
              </h1>
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={16} className="text-[var(--acc2)] flex-shrink-0" />
                <p className="text-sm text-[var(--muted2)] font-semibold">
                  {drug.manufacturer}
                </p>
              </div>
              {drug.country && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[var(--muted2)] font-medium">
                    {drug.country}
                  </span>
                  {drug.atc && (
                    <>
                      <span className="text-[var(--stroke)]">•</span>
                      <span className="text-xs font-mono text-[var(--acc2)] font-semibold">
                        {drug.atc}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Quick Facts Grid */}
        <Card className="mb-4">
          <h2 className="text-lg font-black text-[var(--text)] mb-4">
            {locale === 'ru' ? 'О товаре' : 'About'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Package size={20} className="text-[var(--acc2)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-[var(--muted2)] mb-1">
                  {locale === 'ru' ? 'Количество' : 'Pack count'}
                </p>
                <p className="text-sm font-semibold text-[var(--text)]">
                  {drug.packCount} {locale === 'ru' ? 'шт' : 'pcs'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Pill size={20} className="text-[var(--acc2)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-[var(--muted2)] mb-1">
                  {locale === 'ru' ? 'Форма' : 'Form'}
                </p>
                <p className="text-sm font-semibold text-[var(--text)]">{drug.form}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 size={20} className="text-[var(--acc2)] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-[var(--muted2)] mb-1">
                  {locale === 'ru' ? 'Производитель' : 'Manufacturer'}
                </p>
                <p className="text-sm font-semibold text-[var(--text)]">{drug.manufacturer}</p>
              </div>
            </div>
            {drug.atc && (
              <div className="flex items-start gap-3">
                <FileText size={20} className="text-[var(--acc2)] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-[var(--muted2)] mb-1">ATC</p>
                  <p className="text-sm font-semibold text-[var(--text)]">{drug.atc}</p>
                </div>
              </div>
            )}
          </div>
          {activeIngredient && (
            <div className="mt-4 pt-4 border-t border-[var(--stroke)]">
              <p className="text-xs text-[var(--muted2)] mb-1">
                {locale === 'ru' ? 'Действующее вещество' : 'Active ingredient'}
              </p>
              <p className="text-sm font-semibold text-[var(--text)]">{activeIngredient}</p>
            </div>
          )}
        </Card>

        {/* Add to Cabinet + Buy Buttons */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <Button
              variant={inCabinet ? "ghost" : "primary"}
              fullWidth
              onClick={handleAddToCabinet}
              disabled={inCabinet}
              size="lg"
            >
              {inCabinet 
                ? (locale === 'ru' ? '✓ Добавлено' : '✓ Added')
                : (locale === 'ru' ? '+ Добавить в аптечку' : '+ Add to cabinet')
              }
            </Button>
          </div>
          <div className="flex-1">
            <button
              onClick={() => {
                // Placeholder for buy functionality
                toast.info(locale === 'ru' ? 'Функция покупки в разработке' : 'Buy feature in development');
              }}
              className="w-full px-6 py-3 text-base rounded-[18px] font-black text-sm transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-green-500 bg-green-500 hover:bg-green-600 text-white"
            >
              <div className="flex items-center justify-center gap-2">
                <ShoppingCart size={18} />
                <span>{locale === 'ru' ? 'Купить' : 'Buy'}</span>
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* Navigation Tabs - Sticky with underline indicator */}
      <div className="sticky top-0 z-30 bg-[var(--bg)]/95 backdrop-blur-sm -mx-[18px] px-[18px] pt-2 pb-2 mb-4 border-b border-[var(--stroke)]">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {SECTIONS.map(section => (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`
                relative px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all
                ${activeSection === section.id
                  ? 'text-[var(--acc)]'
                  : 'text-[var(--muted2)] hover:text-[var(--text)]'
                }
              `}
            >
              {section.label[locale]}
              {activeSection === section.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--acc)] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Eligibility Section */}
      <div
        id="eligibility"
        ref={el => sectionRefs.current.eligibility = el}
        className="mb-6 scroll-mt-4"
      >
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-[var(--text)]">
              {SECTIONS.find(s => s.id === 'eligibility')?.label[locale]}
            </h2>
            {/* Compact Legend */}
            <div className="flex items-center gap-2 text-[10px]">
              <div className="flex items-center gap-0.5">
                <CheckCircle2 size={10} className="text-green-500" />
                <span className="text-[var(--muted2)]">{locale === 'ru' ? 'Можно' : 'Can'}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <XCircle size={10} className="text-red-500" />
                <span className="text-[var(--muted2)]">{locale === 'ru' ? 'Нельзя' : 'Cannot'}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <AlertTriangle size={10} className="text-yellow-500" />
                <span className="text-[var(--muted2)]">{locale === 'ru' ? 'Осторожно' : 'Caution'}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {drug.eligibility.map((item, index) => {
              const CategoryIcon = ELIGIBILITY_ICONS[item.category];
              const StatusIcon = STATUS_ICONS[item.status];
              const statusColor = STATUS_COLORS[item.status];
              const statusLabel = STATUS_LABELS[item.status][locale];
              const categoryLabel = CATEGORY_LABELS[item.category][locale];

              return (
                <div
                  key={index}
                  className="flex items-center justify-between py-2.5 border-b border-[var(--stroke)] last:border-0"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <CategoryIcon size={18} className="text-[var(--acc2)] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text)]">{categoryLabel}</p>
                      {item.note && (
                        <p className="text-xs text-[var(--muted2)] mt-0.5">{item.note}</p>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 ${statusColor} flex-shrink-0`}>
                    <StatusIcon size={16} />
                    <span className="text-sm font-semibold whitespace-nowrap">{statusLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* How to Take Section */}
      {howToTake && (
        <div
          id="how-to-take"
          ref={el => sectionRefs.current['how-to-take'] = el}
          className="mb-6 scroll-mt-4"
        >
          <Card className="p-4">
            <div className="flex items-start gap-2 mb-2">
              <Clock size={18} className="text-[var(--acc2)] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h2 className="text-lg font-black text-[var(--text)] mb-2">
                  {SECTIONS.find(s => s.id === 'how-to-take')?.label[locale]}
                </h2>
                <p className="text-sm text-[var(--text)] leading-relaxed">{howToTake}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Recommendations Section */}
      {drug.recommendations && drug.recommendations.length > 0 && (
        <div
          id="recommendations"
          ref={el => sectionRefs.current.recommendations = el}
          className="mb-6 scroll-mt-4"
        >
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb size={20} className="text-[var(--acc2)] flex-shrink-0" />
              <h2 className="text-lg font-black text-[var(--text)]">
                {SECTIONS.find(s => s.id === 'recommendations')?.label[locale]}
              </h2>
            </div>
            <div className="space-y-3">
              {drug.recommendations.map((rec, index) => (
                <div
                  key={rec.id}
                  className="flex items-start gap-3 p-3 rounded-[12px] bg-[var(--surface2)] border border-[var(--stroke)]"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {index === 0 && <AlertCircle size={18} className="text-[var(--acc2)]" />}
                    {index === 1 && <Shield size={18} className="text-[var(--acc2)]" />}
                    {index === 2 && <Package size={18} className="text-[var(--acc2)]" />}
                    {index >= 3 && <Lightbulb size={18} className="text-[var(--acc2)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text)] mb-1">
                      {rec.title}
                    </p>
                    <p className="text-xs text-[var(--muted2)] leading-relaxed">
                      {rec.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Key Characteristics Section */}
      <div
        id="characteristics"
        ref={el => sectionRefs.current.characteristics = el}
        className="mb-6 scroll-mt-4"
      >
        <Card className="p-4">
          <h2 className="text-lg font-black text-[var(--text)] mb-4">
            {SECTIONS.find(s => s.id === 'characteristics')?.label[locale]}
          </h2>
          <div className="grid grid-cols-1 gap-2.5">
            {visibleCharacteristics.map((char, index) => (
              <div key={index} className="flex justify-between items-start py-1.5 border-b border-[var(--stroke)] last:border-0">
                <span className="text-xs text-[var(--muted2)] pr-4">{char.key}</span>
                <span className="text-sm text-[var(--text)] font-medium text-right flex-shrink-0 max-w-[60%]">{char.value}</span>
              </div>
            ))}
          </div>
          {drug.characteristics.length > charGroups.main.length && (
            <button
              onClick={() => setExpandedCharacteristics(!expandedCharacteristics)}
              className="mt-3 flex items-center gap-1 text-sm text-[var(--acc)] font-semibold hover:underline transition-all"
            >
              {expandedCharacteristics ? (
                <>
                  <ChevronUp size={16} />
                  {locale === 'ru' ? 'Свернуть' : 'Collapse'}
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  {locale === 'ru' ? 'Смотреть все характеристики' : 'View all characteristics'}
                </>
              )}
            </button>
          )}
        </Card>
      </div>

      {/* Instruction Section - CTA */}
      <div
        id="instruction"
        ref={el => sectionRefs.current.instruction = el}
        className="mb-6 scroll-mt-4"
      >
        <Card className="p-4">
          <h2 className="text-lg font-black text-[var(--text)] mb-3">
            {SECTIONS.find(s => s.id === 'instruction')?.label[locale]}
          </h2>
          <p className="text-xs text-[var(--muted2)] mb-4">{drug.instruction.verifiedText}</p>
          {drug.instruction.officialUrl && (
            <Button
              variant="primary"
              fullWidth
              onClick={() => window.open(drug.instruction.officialUrl, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink size={16} className="mr-2" />
              {locale === 'ru' ? 'Официальная инструкция' : 'Official instruction'}
            </Button>
          )}
        </Card>
      </div>

      {/* Reviews Section */}
      <div
        id="reviews"
        ref={el => sectionRefs.current.reviews = el}
        className="mb-6 scroll-mt-4"
      >
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-[var(--text)]">
              {SECTIONS.find(s => s.id === 'reviews')?.label[locale]}
            </h2>
            <div className="flex items-center gap-1.5">
              <Star size={14} className="text-yellow-500 fill-yellow-500" />
              <span className="text-sm font-semibold text-[var(--text)]">
                {drug.reviewsSummary.avg.toFixed(1)}
              </span>
              <span className="text-xs text-[var(--muted2)]">
                ({drug.reviewsSummary.count})
              </span>
            </div>
          </div>
          <div className="space-y-3">
            {visibleReviews.map(review => (
              <div key={review.id} className="border-b border-[var(--stroke)] last:border-0 pb-3 last:pb-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">{review.author}</p>
                    <p className="text-xs text-[var(--muted2)]">
                      {new Date(review.date).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US')}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-[var(--text)] leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>
          {drug.reviews.length > 2 && (
            <button
              onClick={() => setExpandedReviews(!expandedReviews)}
              className="mt-3 flex items-center gap-1 text-sm text-[var(--acc)] font-semibold hover:underline transition-all"
            >
              {expandedReviews ? (
                <>
                  <ChevronUp size={16} />
                  {locale === 'ru' ? 'Свернуть' : 'Collapse'}
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  {locale === 'ru' ? 'Показать все отзывы' : 'Show all reviews'}
                </>
              )}
            </button>
          )}
        </Card>
      </div>

      {/* Description Section */}
      <div
        id="description"
        ref={el => sectionRefs.current.description = el}
        className="mb-6 scroll-mt-4"
      >
        <Card className="p-4">
          <h2 className="text-lg font-black text-[var(--text)] mb-3">
            {SECTIONS.find(s => s.id === 'description')?.label[locale]}
          </h2>
          <div className={`overflow-hidden transition-all duration-300 ${expandedDescription ? 'max-h-none' : 'max-h-32'}`}>
            <p className="text-sm text-[var(--text)] leading-relaxed">
              {expandedDescription ? drug.descriptionFull : drug.descriptionShort}
            </p>
          </div>
          {drug.descriptionFull.length > drug.descriptionShort.length && (
            <button
              onClick={() => setExpandedDescription(!expandedDescription)}
              className="mt-3 flex items-center gap-1 text-sm text-[var(--acc)] font-semibold hover:underline transition-all"
            >
              {expandedDescription ? (
                <>
                  <ChevronUp size={16} />
                  {locale === 'ru' ? 'Свернуть' : 'Collapse'}
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  {locale === 'ru' ? 'Читать далее' : 'Read more'}
                </>
              )}
            </button>
          )}
        </Card>
      </div>

      {/* Analogs Section */}
      <div
        id="analogs"
        ref={el => sectionRefs.current.analogs = el}
        className="mb-6 scroll-mt-4"
      >
        <Card className="p-4">
          <h2 className="text-lg font-black text-[var(--text)] mb-4">
            {SECTIONS.find(s => s.id === 'analogs')?.label[locale]}
          </h2>
          <div className="space-y-2">
            {visibleAnalogs.map(analog => (
              <button
                key={analog.id}
                onClick={() => navigate(`/drug/${analog.id}`)}
                className="w-full flex items-center justify-between p-2.5 rounded-[12px] border border-[var(--stroke)] bg-[var(--surface2)] hover:bg-[var(--stroke)] transition-all text-left active:scale-[0.98]"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <Pill size={16} className="text-[var(--acc2)] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text)] truncate">{analog.name}</p>
                    <p className="text-xs text-[var(--muted2)] truncate">{analog.meta}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-[var(--muted2)] flex-shrink-0" />
              </button>
            ))}
          </div>
          {drug.analogs.length > 4 && (
            <button
              onClick={() => setExpandedAnalogs(!expandedAnalogs)}
              className="mt-3 flex items-center gap-1 text-sm text-[var(--acc)] font-semibold hover:underline transition-all"
            >
              {expandedAnalogs ? (
                <>
                  <ChevronUp size={16} />
                  {locale === 'ru' ? 'Свернуть' : 'Collapse'}
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  {locale === 'ru' ? 'Показать все аналоги' : 'Show all analogs'}
                </>
              )}
            </button>
          )}
        </Card>
      </div>

    </div>
  );
}
