/**
 * Shopping List Page
 * Manage shopping list for refills
 */

import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Check, Trash2, Package } from 'lucide-react';
import { TopBar } from '../components/shared/TopBar';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { Modal } from '../components/shared/Modal';
import { useI18n } from '../hooks/useI18n';
import { 
  getShoppingList, 
  addToShoppingList, 
  updateShoppingItemStatus, 
  removeFromShoppingList,
  getSuggestedShoppingItems,
  type ShoppingItem,
} from '../lib/shoppingList';
import { loadAppState } from '../data/storage';

export function ShoppingListPage() {
  const { locale } = useI18n();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [suggestions, setSuggestions] = useState<Array<{ medicationId: string; medicationName: string; reason: string }>>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    loadItems();
    loadSuggestions();
  }, []);

  const loadItems = () => {
    const pending = getShoppingList(undefined, 'pending');
    setItems(pending);
  };

  const loadSuggestions = () => {
    const suggested = getSuggestedShoppingItems();
    setSuggestions(suggested);
  };

  const handleAdd = () => {
    if (!selectedMedication) return;

    const state = loadAppState();
    const medication = state.medications.find(m => m.id === selectedMedication);
    if (!medication) return;

    addToShoppingList(
      selectedMedication,
      medication.name,
      quantity ? parseInt(quantity, 10) : undefined,
      note || undefined
    );

    setShowAddModal(false);
    setSelectedMedication('');
    setQuantity('');
    setNote('');
    loadItems();
    loadSuggestions();
  };

  const handleMarkPurchased = (itemId: string) => {
    updateShoppingItemStatus(itemId, 'purchased');
    loadItems();
  };

  const handleRemove = (itemId: string) => {
    removeFromShoppingList(itemId);
    loadItems();
  };

  const handleAddSuggestion = (medicationId: string, medicationName: string) => {
    addToShoppingList(medicationId, medicationName);
    loadItems();
    loadSuggestions();
  };

  const state = loadAppState();
  const medications = state.medications;

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24">
      <TopBar 
        title={locale === 'ru' ? 'Список покупок' : 'Shopping List'}
        rightContent={
          <button
            onClick={() => setShowAddModal(true)}
            className="w-9 h-9 rounded-full bg-[var(--primary)] flex items-center justify-center"
          >
            <Plus size={20} className="text-white" />
          </button>
        }
      />

      <div className="px-4 pt-2 space-y-4">
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <Card className="bg-blue-500/10 border-blue-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Package size={18} className="text-blue-400" />
              <h3 className="font-semibold text-blue-400">
                {locale === 'ru' ? 'Рекомендуется добавить' : 'Suggested Items'}
              </h3>
            </div>
            <div className="space-y-2">
              {suggestions.map((suggestion) => (
                <div 
                  key={suggestion.medicationId}
                  className="flex items-center justify-between p-2 bg-[var(--surface)]/50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--text)]">
                      {suggestion.medicationName}
                    </p>
                    <p className="text-xs text-[var(--muted2)]">
                      {suggestion.reason === 'low_stock' 
                        ? (locale === 'ru' ? 'Низкий запас' : 'Low stock')
                        : (locale === 'ru' ? 'Пополнить скоро' : 'Refill soon')
                      }
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddSuggestion(suggestion.medicationId, suggestion.medicationName)}
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Shopping List */}
        {items.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <ShoppingCart size={48} className="mx-auto text-[var(--muted2)] mb-3" />
              <p className="text-[var(--muted)] mb-2 font-semibold">
                {locale === 'ru' ? 'Список пуст' : 'List is empty'}
              </p>
              <p className="text-xs text-[var(--muted2)]">
                {locale === 'ru' 
                  ? 'Добавьте препараты для пополнения'
                  : 'Add medications to refill'
                }
              </p>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="space-y-2">
              {items.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-[var(--surface2)] rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text)] truncate">
                      {item.medicationName}
                    </p>
                    {item.quantity && (
                      <p className="text-sm text-[var(--muted2)]">
                        {locale === 'ru' ? 'Количество' : 'Quantity'}: {item.quantity}
                      </p>
                    )}
                    {item.note && (
                      <p className="text-xs text-[var(--muted2)] mt-1">
                        {item.note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkPurchased(item.id)}
                    >
                      <Check size={14} className="text-green-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(item.id)}
                    >
                      <Trash2 size={14} className="text-[var(--muted2)]" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedMedication('');
          setQuantity('');
          setNote('');
        }}
        title={locale === 'ru' ? 'Добавить в список' : 'Add to List'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">
              {locale === 'ru' ? 'Препарат' : 'Medication'}
            </label>
            <select
              value={selectedMedication}
              onChange={(e) => setSelectedMedication(e.target.value)}
              className="w-full bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-2 border border-[var(--border)]"
            >
              <option value="">
                {locale === 'ru' ? 'Выберите препарат' : 'Select medication'}
              </option>
              {medications.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">
              {locale === 'ru' ? 'Количество (опционально)' : 'Quantity (optional)'}
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={locale === 'ru' ? 'Количество' : 'Quantity'}
              className="w-full bg-[var(--surface2)] text-[var(--text)] rounded-lg px-3 py-2 border border-[var(--border)]"
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">
              {locale === 'ru' ? 'Заметка (опционально)' : 'Note (optional)'}
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
            onClick={handleAdd}
            disabled={!selectedMedication}
          >
            {locale === 'ru' ? 'Добавить' : 'Add'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

