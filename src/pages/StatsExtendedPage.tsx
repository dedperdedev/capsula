/**
 * Expanded Statistics Page
 * Extended view with more detailed statistics
 */

import { TopBar } from '../components/shared/TopBar';
import { Card } from '../components/shared/Card';
import { BarChart3 } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import { useNavigate } from 'react-router-dom';

export function StatsExtendedPage() {
  const { locale } = useI18n();
  const navigate = useNavigate();

  return (
    <div>
      <TopBar title={locale === 'ru' ? 'Расширенная статистика' : 'Expanded Statistics'} />
      
      <div className="px-4 py-4 space-y-4">
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <BarChart3 size={24} className="text-[var(--acc)] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-base font-semibold text-[var(--text)] mb-2">
                {locale === 'ru' ? 'Расширенная статистика' : 'Expanded Statistics'}
              </p>
              <p className="text-sm text-[var(--muted2)] mb-4">
                {locale === 'ru' 
                  ? 'Здесь будет расширенная статистика и аналитика. Расширенные возможности будут добавлены в будущих обновлениях.'
                  : 'Extended statistics and analytics will appear here. Enhanced features will be added in future updates.'}
              </p>
              <button
                onClick={() => navigate('/insights')}
                className="text-sm font-semibold text-[var(--acc)]"
              >
                {locale === 'ru' ? '→ Открыть базовую статистику' : '→ View basic statistics'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
