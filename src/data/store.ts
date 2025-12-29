import type { Item, Schedule, DoseLog, Inventory } from './types';

const STORAGE_KEYS = {
  items: 'capsula_items',
  schedules: 'capsula_schedules',
  doseLogs: 'capsula_dose_logs',
  inventory: 'capsula_inventory',
} as const;

function loadJSON<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
}

function saveJSON<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export const itemsStore = {
  getAll(): Item[] {
    return loadJSON<Item[]>(STORAGE_KEYS.items, []);
  },
  get(id: string): Item | undefined {
    return this.getAll().find(item => item.id === id);
  },
  create(item: Omit<Item, 'id'>): Item {
    const items = this.getAll();
    const newItem: Item = {
      ...item,
      id: crypto.randomUUID(),
    };
    items.push(newItem);
    saveJSON(STORAGE_KEYS.items, items);
    return newItem;
  },
  update(id: string, updates: Partial<Omit<Item, 'id'>>): boolean {
    const items = this.getAll();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return false;
    items[index] = { ...items[index], ...updates };
    saveJSON(STORAGE_KEYS.items, items);
    return true;
  },
  delete(id: string): boolean {
    const items = this.getAll();
    const filtered = items.filter(item => item.id !== id);
    if (filtered.length === items.length) return false;
    saveJSON(STORAGE_KEYS.items, filtered);
    return true;
  },
};

export const schedulesStore = {
  getAll(): Schedule[] {
    return loadJSON<Schedule[]>(STORAGE_KEYS.schedules, []);
  },
  get(id: string): Schedule | undefined {
    return this.getAll().find(schedule => schedule.id === id);
  },
  getByItemId(itemId: string): Schedule[] {
    return this.getAll().filter(schedule => schedule.itemId === itemId);
  },
  getEnabled(): Schedule[] {
    return this.getAll().filter(schedule => schedule.enabled);
  },
  create(schedule: Omit<Schedule, 'id'>): Schedule {
    const schedules = this.getAll();
    const newSchedule: Schedule = {
      ...schedule,
      id: crypto.randomUUID(),
    };
    schedules.push(newSchedule);
    saveJSON(STORAGE_KEYS.schedules, schedules);
    return newSchedule;
  },
  update(id: string, updates: Partial<Omit<Schedule, 'id'>>): boolean {
    const schedules = this.getAll();
    const index = schedules.findIndex(schedule => schedule.id === id);
    if (index === -1) return false;
    schedules[index] = { ...schedules[index], ...updates };
    saveJSON(STORAGE_KEYS.schedules, schedules);
    return true;
  },
  delete(id: string): boolean {
    const schedules = this.getAll();
    const filtered = schedules.filter(schedule => schedule.id !== id);
    if (filtered.length === schedules.length) return false;
    saveJSON(STORAGE_KEYS.schedules, filtered);
    return true;
  },
};

export const doseLogsStore = {
  getAll(): DoseLog[] {
    return loadJSON<DoseLog[]>(STORAGE_KEYS.doseLogs, []);
  },
  get(id: string): DoseLog | undefined {
    return this.getAll().find(log => log.id === id);
  },
  getByItemId(itemId: string): DoseLog[] {
    return this.getAll().filter(log => log.itemId === itemId);
  },
  create(log: Omit<DoseLog, 'id' | 'createdAt'>): DoseLog {
    const logs = this.getAll();
    const newLog: DoseLog = {
      ...log,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    logs.push(newLog);
    saveJSON(STORAGE_KEYS.doseLogs, logs);
    return newLog;
  },
  delete(id: string): boolean {
    const logs = this.getAll();
    const filtered = logs.filter(log => log.id !== id);
    if (filtered.length === logs.length) return false;
    saveJSON(STORAGE_KEYS.doseLogs, filtered);
    return true;
  },
};

export const inventoryStore = {
  getAll(): Inventory[] {
    return loadJSON<Inventory[]>(STORAGE_KEYS.inventory, []);
  },
  getByItemId(itemId: string): Inventory | undefined {
    return this.getAll().find(inv => inv.itemId === itemId);
  },
  getLowStock(): Inventory[] {
    return this.getAll().filter(inv => inv.remainingUnits <= inv.lowThreshold && inv.remainingUnits > 0);
  },
  create(inventory: Inventory): void {
    const all = this.getAll();
    const existing = all.findIndex(inv => inv.itemId === inventory.itemId);
    if (existing !== -1) {
      all[existing] = inventory;
    } else {
      all.push(inventory);
    }
    saveJSON(STORAGE_KEYS.inventory, all);
  },
  update(itemId: string, updates: Partial<Omit<Inventory, 'itemId'>>): boolean {
    const all = this.getAll();
    const index = all.findIndex(inv => inv.itemId === itemId);
    if (index === -1) return false;
    all[index] = { ...all[index], ...updates };
    saveJSON(STORAGE_KEYS.inventory, all);
    return true;
  },
  decrement(itemId: string, amount: number): boolean {
    const all = this.getAll();
    const index = all.findIndex(inv => inv.itemId === itemId);
    if (index === -1) return false;
    all[index].remainingUnits = Math.max(0, all[index].remainingUnits - amount);
    saveJSON(STORAGE_KEYS.inventory, all);
    return true;
  },
};



