/**
 * Drug Search Page
 * Full-screen search page for discovering drugs
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DrugSearch } from '../components/DrugSearch';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { QuickAddWizard } from '../components/QuickAddWizard';
import { BlueHeroHeader } from '../components/shared/BlueHeroHeader';
import { FilePlus } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';

export function SearchPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  useEffect(() => {
    const handleOpenQuickAdd = () => {
      setIsQuickAddOpen(true);
    };
    window.addEventListener('openQuickAddWizard', handleOpenQuickAdd);
    return () => {
      window.removeEventListener('openQuickAddWizard', handleOpenQuickAdd);
    };
  }, []);

  return (
    <div className="min-h-full">
      <BlueHeroHeader
        variant="compact"
        title={locale === 'ru' ? 'Поиск препаратов' : 'Search Drugs'}
        subtitle={locale === 'ru' 
          ? 'Ищите по названию препарата, производителю или активному веществу'
          : 'Search by drug name, manufacturer, or active ingredient'}
      />
      
      <div className="px-4 pt-6 pb-2">
        <DrugSearch 
          showScanButton={true}
          onScan={() => {
            // Placeholder for barcode scanning
            if (locale === 'ru') {
              alert('Функция сканирования будет реализована в ближайшее время');
            } else {
              alert('Barcode scanning will be implemented soon');
            }
          }}
          autoFocus={true}
        />
      </div>
      
      <div className="px-4 py-4 space-y-4">

        {/* Manual Add Fallback */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--acc)]/10 flex items-center justify-center flex-shrink-0">
              <FilePlus size={20} className="text-[var(--acc)]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--text)] mb-1">
                {locale === 'ru' ? 'Не нашли препарат?' : "Can't find it?"}
              </p>
              <p className="text-xs text-[var(--muted2)] mb-3">
                {locale === 'ru' 
                  ? 'Добавьте препарат вручную без поиска в каталоге' 
                  : 'Add medication manually without catalog search'}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsQuickAddOpen(true)}
                className="w-full"
              >
                <FilePlus size={16} className="mr-2" />
                {locale === 'ru' ? 'Добавить вручную' : 'Add manually'}
              </Button>
            </div>
          </div>
        </Card>

      </div>

      {/* Quick Add Wizard */}
      <QuickAddWizard
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onComplete={() => {
          setIsQuickAddOpen(false);
          navigate('/today');
        }}
      />
    </div>
  );
}
