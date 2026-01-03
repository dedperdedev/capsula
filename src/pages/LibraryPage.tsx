import { useState, useEffect } from 'react';
import { Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import { TopBar } from '../components/shared/TopBar';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { Modal } from '../components/shared/Modal';
import { InventoryStatus } from '../components/InventoryStatus';
import { itemsStore, inventoryStore, schedulesStore } from '../data/store';
import type { Item, ItemForm, ItemType } from '../data/types';
import { toast } from '../components/shared/Toast';
import { useI18n } from '../hooks/useI18n';

const ITEM_FORMS: ItemForm[] = ['tablet', 'capsule', 'syrup', 'injection', 'powder', 'drops', 'spray', 'patch', 'other'];

export function LibraryPage() {
  const { t } = useI18n();
  const [items, setItems] = useState<Item[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'medication' as ItemType,
    form: 'tablet' as ItemForm,
    notes: '',
    remainingUnits: 0,
    unitLabel: t('library.unitLabelDefault'),
    lowThreshold: 5,
  });

  const loadItems = () => {
    const allItems = itemsStore.getAll();
    setItems(allItems);
  };

  useEffect(() => {
    loadItems();
    
    const handleFABClick = () => {
      handleOpenModal();
    };
    window.addEventListener('openAddItemModal', handleFABClick);
    return () => window.removeEventListener('openAddItemModal', handleFABClick);
  }, []);

  const handleOpenModal = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      const inventory = inventoryStore.getByItemId(item.id);
      setFormData({
        name: item.name,
        type: item.type,
        form: item.form,
        notes: item.notes || '',
        remainingUnits: inventory?.remainingUnits || 0,
        unitLabel: inventory?.unitLabel || t('library.unitLabelDefault'),
        lowThreshold: inventory?.lowThreshold || 5,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        type: 'medication',
        form: 'tablet',
        notes: '',
        remainingUnits: 0,
        unitLabel: t('library.unitLabelDefault'),
        lowThreshold: 5,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error(t('library.enterName'));
      return;
    }

    if (formData.remainingUnits < 0) {
      toast.error(t('library.quantityCannotBeNegative'));
      return;
    }

    if (!formData.unitLabel.trim()) {
      toast.error(t('library.unitLabelRequired'));
      return;
    }

    let itemId: string;
    if (editingItem) {
      itemsStore.update(editingItem.id, {
        name: formData.name,
        type: formData.type,
        form: formData.form,
        notes: formData.notes,
      });
      itemId = editingItem.id;
      toast.success(t('library.itemUpdated'));
    } else {
      const newItem = itemsStore.create({
        name: formData.name,
        type: formData.type,
        form: formData.form,
        notes: formData.notes,
      });
      itemId = newItem.id;
      toast.success(t('library.itemCreated'));
    }

    inventoryStore.create({
      itemId,
      remainingUnits: formData.remainingUnits,
      unitLabel: formData.unitLabel,
      lowThreshold: formData.lowThreshold,
    });

    setIsModalOpen(false);
    loadItems();
  };

  const handleDelete = (id: string) => {
    const schedules = schedulesStore.getByItemId(id);
    if (schedules.length > 0) {
      toast.error(t('library.cannotDelete'));
      return;
    }

    if (confirm(t('library.deleteConfirm'))) {
      itemsStore.delete(id);
      inventoryStore.update(id, { remainingUnits: 0, unitLabel: '', lowThreshold: 0 });
      toast.success(t('library.itemDeleted'));
      loadItems();
    }
  };

  const getInventory = (itemId: string) => {
    return inventoryStore.getByItemId(itemId);
  };

  const isLowStock = (itemId: string) => {
    const inv = getInventory(itemId);
    return inv && inv.remainingUnits <= inv.lowThreshold;
  };

  const filteredItems = showEmpty 
    ? items 
    : items.filter(item => {
        const inv = getInventory(item.id);
        return inv && inv.remainingUnits > 0;
      });

  return (
    <div>
      <TopBar
        title={t('library.title')}
        subtitle={t('library.manage')}
      />

      <div className="space-y-4">
        {/* Inventory Status */}
        <InventoryStatus 
          compact={false} 
          showRefill={true}
          onRefill={(itemId) => {
            const item = items.find(i => i.id === itemId);
            if (item) handleOpenModal(item);
          }}
        />

        {/* Show empty toggle */}
        {items.some(item => {
          const inv = getInventory(item.id);
          return !inv || inv.remainingUnits === 0;
        }) && (
          <Card className="p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showEmpty}
                onChange={(e) => setShowEmpty(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--stroke)]"
              />
              <span className="text-sm text-[var(--text)]">{t('library.showEmpty')}</span>
            </label>
          </Card>
        )}

        {filteredItems.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-[var(--muted2)] mb-3" />
              <p className="text-[var(--muted)] mb-4 font-semibold">{t('library.noItems')}</p>
              <Button variant="primary" onClick={() => handleOpenModal()}>
                {t('library.addItem')}
              </Button>
            </div>
          </Card>
        ) : (
          filteredItems.map((item) => {
            const inventory = getInventory(item.id);
            const lowStock = isLowStock(item.id);
            const hasStock = inventory && inventory.remainingUnits > 0;
            
            return (
              <Card key={item.id} className={!hasStock ? 'opacity-60' : ''}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-[var(--text)]">{item.name}</h3>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 rounded text-blue-700 dark:text-blue-300">
                        {item.type}
                      </span>
                      {lowStock && hasStock && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/20 rounded text-red-700 dark:text-red-300 flex items-center gap-1">
                          <AlertTriangle size={12} />
                          {t('library.lowStock')}
                        </span>
                      )}
                      {!hasStock && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">
                          {t('library.outOfStock')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--muted2)] mb-1">
                      {t('library.form')}: {item.form}
                    </p>
                    {inventory && (
                      <div className="mt-2">
                        <p className="text-base font-black text-[var(--text)]">
                          {t('library.remaining')}: <span className={hasStock ? 'text-[var(--acc)]' : 'text-[var(--muted)]'}>
                            {inventory.remainingUnits} {inventory.unitLabel}
                          </span>
                        </p>
                        {inventory.lowThreshold > 0 && (
                          <p className="text-xs text-[var(--muted2)] mt-0.5">
                            {t('library.lowThresholdLabel')}: {inventory.lowThreshold} {inventory.unitLabel}
                          </p>
                        )}
                      </div>
                    )}
                    {item.notes && (
                      <p className="text-xs text-[var(--muted2)] mt-2">{item.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      aria-label={t('common.edit')}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? t('library.editItem') : t('library.addItem')}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              {t('library.name')} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-[var(--stroke)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--acc2)]"
              placeholder={t('library.placeholderName')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              {t('library.type')} *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ItemType }))}
              className="w-full px-4 py-2 border border-[var(--stroke)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--acc2)]"
            >
              <option value="medication">{t('library.medication')}</option>
              <option value="supplement">{t('library.supplement')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              {t('library.form')} *
            </label>
            <select
              value={formData.form}
              onChange={(e) => setFormData(prev => ({ ...prev, form: e.target.value as ItemForm }))}
              className="w-full px-4 py-2 border border-[var(--stroke)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--acc2)]"
            >
              {ITEM_FORMS.map(form => (
                <option key={form} value={form}>
                  {form.charAt(0).toUpperCase() + form.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-[var(--text)] mb-3">{t('library.inStock')}</h4>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  {t('library.quantity')} *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.remainingUnits}
                  onChange={(e) => setFormData(prev => ({ ...prev, remainingUnits: parseInt(e.target.value, 10) || 0 }))}
                  className="w-full px-4 py-2 border border-[var(--stroke)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--acc2)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  {t('library.unit')} *
                </label>
                <input
                  type="text"
                  value={formData.unitLabel}
                  onChange={(e) => setFormData(prev => ({ ...prev, unitLabel: e.target.value }))}
                  className="w-full px-4 py-2 border border-[var(--stroke)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--acc2)]"
                  placeholder={t('settings.unitLabelPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">
                {t('library.lowThresholdLabel')}
              </label>
              <input
                type="number"
                min="0"
                value={formData.lowThreshold}
                onChange={(e) => setFormData(prev => ({ ...prev, lowThreshold: parseInt(e.target.value, 10) || 0 }))}
                className="w-full px-4 py-2 border border-[var(--stroke)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--acc2)]"
                placeholder="5"
              />
              <p className="text-xs text-[var(--muted2)] mt-1">
                {t('library.thresholdHint')}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">
              {t('library.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2 border border-[var(--stroke)] rounded-lg bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--acc2)]"
              placeholder={t('library.placeholderNotes')}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="ghost" fullWidth onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" fullWidth onClick={handleSave}>
              {editingItem ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

