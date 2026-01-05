/**
 * Shopping List Module
 * Manages shopping list items for refills
 */

import { loadAppState, saveAppState, appendEvent, type ShoppingItem } from '../data/storage';

export type { ShoppingItem } from '../data/storage';

/**
 * Add item to shopping list
 */
export function addToShoppingList(
  medicationId: string,
  medicationName: string,
  quantity?: number,
  note?: string
): ShoppingItem {
  const state = loadAppState();
  const profileId = state.activeProfileId || '';
  const now = new Date().toISOString();

  const item: ShoppingItem = {
    id: crypto.randomUUID(),
    profileId,
    medicationId,
    medicationName,
    quantity,
    note,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  state.shoppingList.push(item);
  saveAppState(state);

  appendEvent({
    profileId,
    ts: now,
    type: 'INVENTORY_ADJUSTED',
    entityId: medicationId,
    metadata: {
      action: 'shopping_list_added',
      medicationName,
      quantity,
    },
  });

  return item;
}

/**
 * Get shopping list items
 */
export function getShoppingList(profileId?: string, status?: ShoppingItem['status']): ShoppingItem[] {
  const state = loadAppState();
  const targetProfileId = profileId || state.activeProfileId;
  
  let items = state.shoppingList.filter(item => item.profileId === targetProfileId);
  
  if (status) {
    items = items.filter(item => item.status === status);
  }

  return items.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Update shopping list item status
 */
export function updateShoppingItemStatus(
  itemId: string,
  status: ShoppingItem['status']
): boolean {
  const state = loadAppState();
  const item = state.shoppingList.find(i => i.id === itemId);
  
  if (!item) return false;

  item.status = status;
  item.updatedAt = new Date().toISOString();
  saveAppState(state);

  appendEvent({
    profileId: item.profileId,
    ts: new Date().toISOString(),
    type: 'INVENTORY_ADJUSTED',
    entityId: item.medicationId,
    metadata: {
      action: 'shopping_list_updated',
      itemId,
      status,
    },
  });

  return true;
}

/**
 * Remove item from shopping list
 */
export function removeFromShoppingList(itemId: string): boolean {
  const state = loadAppState();
  const index = state.shoppingList.findIndex(i => i.id === itemId);
  
  if (index === -1) return false;

  const item = state.shoppingList[index];
  state.shoppingList.splice(index, 1);
  saveAppState(state);

  appendEvent({
    profileId: item.profileId,
    ts: new Date().toISOString(),
    type: 'INVENTORY_ADJUSTED',
    entityId: item.medicationId,
    metadata: {
      action: 'shopping_list_removed',
      itemId,
    },
  });

  return true;
}

/**
 * Auto-suggest items from low stock and refills
 */
export function getSuggestedShoppingItems(): Array<{ medicationId: string; medicationName: string; reason: string }> {
  const state = loadAppState();
  const profileId = state.activeProfileId;
  if (!profileId) return [];

  const suggestions: Array<{ medicationId: string; medicationName: string; reason: string }> = [];
  const existingIds = new Set(
    state.shoppingList
      .filter(i => i.profileId === profileId && i.status === 'pending')
      .map(i => i.medicationId)
  );

  // Check low stock
  for (const inv of state.inventory) {
    if (inv.profileId !== profileId) continue;
    if (existingIds.has(inv.medicationId)) continue;

    const medication = state.medications.find(m => m.id === inv.medicationId);
    if (!medication) continue;

    if (inv.lowStockThreshold && inv.quantity <= inv.lowStockThreshold) {
      suggestions.push({
        medicationId: inv.medicationId,
        medicationName: medication.name,
        reason: 'low_stock',
      });
    }
  }

  // Check refill reminders - simple check for very low inventory
  for (const inv of state.inventory) {
    if (inv.profileId !== profileId) continue;
    if (existingIds.has(inv.medicationId)) continue;

    const medication = state.medications.find(m => m.id === inv.medicationId);
    if (!medication) continue;

    // Simple check: if quantity is very low, suggest refill
    if (inv.quantity <= 5) {
      const alreadySuggested = suggestions.some(s => s.medicationId === inv.medicationId);
      if (!alreadySuggested) {
        suggestions.push({
          medicationId: inv.medicationId,
          medicationName: medication.name,
          reason: 'refill_soon',
        });
      }
    }
  }

  return suggestions;
}

