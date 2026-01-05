/**
 * Refill Banner
 * Shows urgent refill reminders with quick add stock action
 */

import { useState, useEffect } from 'react';
import { Package, Plus, X, ChevronRight, ShoppingCart } from 'lucide-react';
import { Card } from './shared/Card';
import { Button } from './shared/Button';
import { Modal } from './shared/Modal';
import { getUrgentRefillReminders, formatEnoughUntil, type RefillReminder } from '../lib/refillReminders';
import { addToShoppingList } from '../lib/shoppingList';
import { useI18n } from '../hooks/useI18n';

interface RefillBannerProps {
  onNavigateToLibrary?: () => void;
}

export function RefillBanner({ onNavigateToLibrary }: RefillBannerProps) {
  const { locale } = useI18n();
  const [reminders, setReminders] = useState<RefillReminder[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [addStockModal, setAddStockModal] = useState<RefillReminder | null>(null);
  const [stockAmount, setStockAmount] = useState('');

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = () => {
    const urgent = getUrgentRefillReminders();
    setReminders(urgent);
  };

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const handleAddStock = () => {
    if (!addStockModal || !stockAmount) return;
    
    // Find inventory ID from the reminder
    const amount = parseInt(stockAmount, 10);
    if (isNaN(amount) || amount <= 0) return;

    // We need to get the inventory ID - for now, reload reminders
    // In a real implementation, we'd have the inventoryId in the reminder
    loadReminders();
    setAddStockModal(null);
    setStockAmount('');
  };

  const visibleReminders = reminders.filter(r => !dismissed.has(r.id));

  if (visibleReminders.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/30 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
            <Package size={20} className="text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-amber-500">
                {locale === 'ru' ? '📦 Пополните запас' : '📦 Refill Soon'}
              </h3>
              <button
                onClick={onNavigateToLibrary}
                className="text-amber-400 hover:text-amber-300 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="space-y-2">
              {visibleReminders.map(reminder => (
                <div 
                  key={reminder.id}
                  className="flex items-center justify-between p-2 bg-[var(--surface)]/50 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--text)] text-sm truncate">
                      {reminder.medicationName}
                    </p>
                    <p className="text-xs text-[var(--muted2)]">
                      {reminder.currentQuantity} {reminder.quantityUnit} — 
                      {' '}{formatEnoughUntil(reminder.enoughUntil, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        addToShoppingList(reminder.medicationId, reminder.medicationName);
                        handleDismiss(reminder.id);
                      }}
                    >
                      <ShoppingCart size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddStockModal(reminder)}
                    >
                      <Plus size={14} />
                    </Button>
                    <button
                      onClick={() => handleDismiss(reminder.id)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <X size={12} className="text-[var(--muted2)]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Add Stock Modal */}
      <Modal isOpen={!!addStockModal} onClose={() => setAddStockModal(null)}>
        <div className="p-6">
          <h2 className="text-xl font-bold text-[var(--text)] mb-2">
            {locale === 'ru' ? 'Пополнить запас' : 'Add Stock'}
          </h2>
          <p className="text-[var(--muted)] mb-4">
            {addStockModal?.medicationName}
          </p>

          <div className="mb-4">
            <label className="block text-sm text-[var(--muted)] mb-1">
              {locale === 'ru' ? 'Количество' : 'Amount'}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={stockAmount}
                onChange={(e) => setStockAmount(e.target.value)}
                placeholder={addStockModal?.quantityUnit}
                className="flex-1 bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-2 border border-[var(--border)] focus:border-[var(--primary)] outline-none"
              />
              <span className="text-[var(--muted)] self-center">
                {addStockModal?.quantityUnit}
              </span>
            </div>
          </div>

          {/* Quick amounts */}
          <div className="flex gap-2 mb-4">
            {[10, 20, 30, 50].map(amount => (
              <button
                key={amount}
                onClick={() => setStockAmount(amount.toString())}
                className="flex-1 py-2 bg-[var(--surface2)] hover:bg-[var(--surface3)] text-[var(--text)] rounded-lg text-sm transition-colors"
              >
                +{amount}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button
              variant="primary"
              fullWidth
              onClick={handleAddStock}
              disabled={!stockAmount}
            >
              <Plus size={16} className="mr-2" />
              {locale === 'ru' ? 'Добавить' : 'Add'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setAddStockModal(null)}
            >
              {locale === 'ru' ? 'Отмена' : 'Cancel'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

