/**
 * Share Page
 * View-only page for shared data (accessed via code/link)
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, Download, ArrowLeft } from 'lucide-react';
import { TopBar } from '../components/shared/TopBar';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { Modal } from '../components/shared/Modal';
import { useI18n } from '../hooks/useI18n';
import { getSharePackage, type SharePackage } from '../lib/share';
import { format } from 'date-fns';

export function SharePage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const [sharePackage, setSharePackage] = useState<SharePackage | null>(null);
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [decryptedData, setDecryptedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (code) {
      const pkg = getSharePackage(code);
      if (pkg) {
        setSharePackage(pkg);
        setShowPasswordModal(true);
      } else {
        setError(locale === 'ru' ? 'Код не найден или истек' : 'Code not found or expired');
      }
    }
  }, [code, locale]);

  const handleDecrypt = async () => {
    if (!sharePackage) return;

    try {
      // For MVP, data is stored as JSON (encryption to be added)
      const decrypted = JSON.parse(sharePackage.encryptedData || '{}');
      setDecryptedData(decrypted);
      setShowPasswordModal(false);
      setError(null);
    } catch (err) {
      setError(locale === 'ru' ? 'Ошибка загрузки данных' : 'Failed to load data');
    }
  };

  if (error && !sharePackage) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <Card>
          <div className="text-center py-8">
            <Lock size={48} className="mx-auto text-[var(--muted2)] mb-3" />
            <p className="text-[var(--danger)] font-semibold mb-2">{error}</p>
            <Button variant="primary" onClick={() => navigate('/')}>
              <ArrowLeft size={16} className="mr-2" />
              {locale === 'ru' ? 'На главную' : 'Go Home'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!decryptedData) {
    return (
      <>
        <Modal isOpen={showPasswordModal} onClose={() => navigate('/')}>
          <div className="p-6">
            <h2 className="text-xl font-bold text-[var(--text)] mb-4">
              {locale === 'ru' ? 'Введите пароль' : 'Enter Password'}
            </h2>
            {error && (
              <p className="text-red-500 text-sm mb-4">{error}</p>
            )}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={locale === 'ru' ? 'Пароль' : 'Password'}
              className="w-full bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-2 border border-[var(--border)] mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleDecrypt()}
            />
            <div className="flex gap-2">
              <Button variant="ghost" fullWidth onClick={() => navigate('/')}>
                {locale === 'ru' ? 'Отмена' : 'Cancel'}
              </Button>
              <Button variant="primary" fullWidth onClick={handleDecrypt}>
                {locale === 'ru' ? 'Открыть' : 'Open'}
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24">
      <TopBar 
        title={locale === 'ru' ? 'Просмотр данных' : 'View Data'}
        subtitle={sharePackage?.viewOnly ? (locale === 'ru' ? 'Только просмотр' : 'View Only') : undefined}
      />

      <div className="px-4 pt-2 space-y-4">
        <Card className="bg-blue-500/10 border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Lock size={18} className="text-blue-400" />
            <p className="text-sm text-blue-400 font-medium">
              {locale === 'ru' 
                ? 'Это представление только для чтения'
                : 'This is a read-only view'
              }
            </p>
          </div>
          <p className="text-xs text-blue-400/70">
            {sharePackage && (
              <>
                {locale === 'ru' ? 'Экспортировано' : 'Exported'}: {format(new Date(sharePackage.createdAt), 'd MMM yyyy')}
                {sharePackage.expiresAt && (
                  <> • {locale === 'ru' ? 'Истекает' : 'Expires'}: {format(new Date(sharePackage.expiresAt), 'd MMM yyyy')}</>
                )}
              </>
            )}
          </p>
        </Card>

        {/* Display shared data */}
        {decryptedData.profile && (
          <Card>
            <h3 className="font-semibold text-[var(--text)] mb-3">
              {locale === 'ru' ? 'Профиль' : 'Profile'}: {decryptedData.profile.name}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[var(--muted2)] mb-1">
                  {locale === 'ru' ? 'Препаратов' : 'Medications'}
                </p>
                <p className="font-bold text-[var(--text)]">
                  {decryptedData.medications?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-[var(--muted2)] mb-1">
                  {locale === 'ru' ? 'Расписаний' : 'Schedules'}
                </p>
                <p className="font-bold text-[var(--text)]">
                  {decryptedData.schedules?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-[var(--muted2)] mb-1">
                  {locale === 'ru' ? 'Событий' : 'Events'}
                </p>
                <p className="font-bold text-[var(--text)]">
                  {decryptedData.events?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-[var(--muted2)] mb-1">
                  {locale === 'ru' ? 'Записей дневника' : 'Diary Entries'}
                </p>
                <p className="font-bold text-[var(--text)]">
                  {(decryptedData.symptomEntries?.length || 0) + (decryptedData.measurementEntries?.length || 0)}
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              const blob = new Blob([JSON.stringify(decryptedData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `capsula-share-${code}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download size={16} className="mr-2" />
            {locale === 'ru' ? 'Скачать данные' : 'Download Data'}
          </Button>
        </Card>
      </div>
    </div>
  );
}

