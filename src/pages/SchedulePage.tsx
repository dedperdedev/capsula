import { TopBar } from '../components/shared/TopBar';
import { Card } from '../components/shared/Card';
import { useI18n } from '../hooks/useI18n';

export function SchedulePage() {
  const { t } = useI18n();

  return (
    <div>
      <TopBar title={t('common.schedule')} />
      <Card>
        <div className="text-center py-12">
          <p className="text-[var(--muted)] mb-2 font-semibold">Schedule page</p>
        </div>
      </Card>
    </div>
  );
}



