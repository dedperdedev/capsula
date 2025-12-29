import type { Item, Schedule, Inventory } from './types';
import { itemsStore, schedulesStore, inventoryStore } from './store';

export function loadDemoData() {
  // Очистка существующих данных (опционально)
  // Можно пропустить, если нужно добавить к существующим

  // Демо препараты
  const demoItems: Omit<Item, 'id'>[] = [
    {
      name: 'Аспирин',
      type: 'medication',
      form: 'tablet',
      notes: 'Принимать при головной боли',
      doseText: '1 таблетка',
    },
    {
      name: 'Витамин D',
      type: 'supplement',
      form: 'capsule',
      notes: 'Ежедневно утром',
      doseText: '1 капсула',
    },
    {
      name: 'Омега-3',
      type: 'supplement',
      form: 'capsule',
      notes: 'С едой',
      doseText: '2 капсулы',
    },
    {
      name: 'Парацетамол',
      type: 'medication',
      form: 'tablet',
      notes: 'При температуре',
      doseText: '1 таблетка',
    },
    {
      name: 'Магний',
      type: 'supplement',
      form: 'tablet',
      notes: 'Перед сном',
      doseText: '1 таблетка',
    },
  ];

  // Создаем препараты и получаем их ID
  const createdItems = demoItems.map(item => itemsStore.create(item));

  // Демо инвентарь
  const demoInventory: Inventory[] = [
    {
      itemId: createdItems[0].id,
      remainingUnits: 20,
      unitLabel: 'таблеток',
      lowThreshold: 10,
    },
    {
      itemId: createdItems[1].id,
      remainingUnits: 30,
      unitLabel: 'капсул',
      lowThreshold: 15,
    },
    {
      itemId: createdItems[2].id,
      remainingUnits: 15,
      unitLabel: 'капсул',
      lowThreshold: 10,
    },
    {
      itemId: createdItems[3].id,
      remainingUnits: 5,
      unitLabel: 'таблеток',
      lowThreshold: 10,
    },
    {
      itemId: createdItems[4].id,
      remainingUnits: 25,
      unitLabel: 'таблеток',
      lowThreshold: 10,
    },
  ];

  // Создаем инвентарь
  demoInventory.forEach(inv => inventoryStore.create(inv));

  // Демо расписания
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 30);
  const endDateStr = endDate.toISOString().split('T')[0];

  const demoSchedules: Omit<Schedule, 'id'>[] = [
    {
      itemId: createdItems[0].id, // Аспирин
      times: ['08:00', '20:00'],
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Все дни
      startDate: startDate,
      endDate: endDateStr,
      withFood: 'after',
      enabled: true,
    },
    {
      itemId: createdItems[1].id, // Витамин D
      times: ['09:00'],
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Все дни
      startDate: startDate,
      withFood: 'none',
      enabled: true,
    },
    {
      itemId: createdItems[2].id, // Омега-3
      times: ['12:00'],
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Все дни
      startDate: startDate,
      withFood: 'before',
      enabled: true,
    },
    {
      itemId: createdItems[3].id, // Парацетамол
      times: ['18:00'],
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Все дни
      startDate: startDate,
      endDate: endDateStr,
      withFood: 'after',
      enabled: true,
    },
    {
      itemId: createdItems[4].id, // Магний
      times: ['21:00'],
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Все дни
      startDate: startDate,
      withFood: 'none',
      enabled: true,
    },
  ];

  // Создаем расписания
  demoSchedules.forEach(schedule => schedulesStore.create(schedule));

  return {
    items: createdItems.length,
    schedules: demoSchedules.length,
    inventory: demoInventory.length,
  };
}



