export type Locale = 'ru' | 'en';

const LOCALE_KEY = 'capsula_locale';

export function getLocale(): Locale {
  if (typeof window === 'undefined') return 'ru';
  const stored = localStorage.getItem(LOCALE_KEY) as Locale | null;
  if (stored === 'ru' || stored === 'en') return stored;
  return 'ru';
}

export function setLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCALE_KEY, locale);
  window.dispatchEvent(new Event('localechange'));
}

const translations: Record<string, { ru: string; en: string }> = {
  // Common
  'common.today': { ru: 'Сегодня', en: 'Today' },
  'common.schedule': { ru: 'Расписание', en: 'Schedule' },
  'common.library': { ru: 'Аптечка', en: 'Medicine Cabinet' },
  'common.settings': { ru: 'Настройки', en: 'Settings' },
  'common.insights': { ru: 'Аналитика', en: 'Insights' },
  'common.add': { ru: 'Добавить', en: 'Add' },
  'common.edit': { ru: 'Редактировать', en: 'Edit' },
  'common.delete': { ru: 'Удалить', en: 'Delete' },
  'common.save': { ru: 'Сохранить', en: 'Save' },
  'common.cancel': { ru: 'Отмена', en: 'Cancel' },
  'common.close': { ru: 'Закрыть', en: 'Close' },
  'common.back': { ru: 'Назад', en: 'Back' },
  
  // Today page
  'today.noDoses': { ru: 'Нет доз на сегодня', en: 'No doses scheduled for today' },
  'today.addItems': { ru: 'Добавьте препараты и создайте расписание', en: 'Add items and create schedules to get started' },
  'today.remaining': { ru: 'осталось', en: 'remaining' },
  'today.taken': { ru: 'принято', en: 'taken' },
  'today.missed': { ru: 'пропуск', en: 'missed' },
  'today.ofTaken': { ru: 'из {total} принято', en: 'of {total} taken' },
  'today.adherence': { ru: 'Адгеранс', en: 'Adherence' },
  
  // Dose actions
  'dose.taken': { ru: 'Принял', en: 'Taken' },
  'dose.skipped': { ru: 'Пропустил', en: 'Skipped' },
  'dose.snooze': { ru: 'Перенести', en: 'Snooze' },
  'dose.take': { ru: 'Принять', en: 'Take' },
  'dose.markedAsTaken': { ru: 'Отмечено как принято', en: 'Marked as taken' },
  'dose.markedAsPending': { ru: 'Отмечено как ожидающее', en: 'Marked as pending' },
  'dose.due': { ru: 'Время принять', en: 'Dose Due' },
  'dose.snoozeUntil': { ru: 'Перенести до', en: 'Snooze until' },
  'dose.customSnooze': { ru: 'Свое время (5-240 мин)', en: 'Custom (5-240 min)' },
  'dose.confirmSnooze': { ru: 'Подтвердить перенос', en: 'Confirm Snooze' },
  'dose.skipReason': { ru: 'Причина пропуска', en: 'Reason for skipping' },
  'dose.confirmSkip': { ru: 'Подтвердить пропуск', en: 'Confirm Skip' },
  'dose.selectReason': { ru: 'Выберите причину', en: 'Please select a reason' },
  'dose.snoozeDuration': { ru: 'Длительность переноса', en: 'Snooze Duration' },
  'dose.snoozeDurationError': { ru: 'Длительность должна быть от 5 до 240 минут', en: 'Duration must be between 5 and 240 minutes' },
  'dose.snoozedUntil': { ru: 'Перенесено до', en: 'Snoozed until' },
  'dose.enterMinutes': { ru: 'Введите минуты', en: 'Enter minutes' },
  'dose.skipForgot': { ru: 'Забыл', en: 'Forgot' },
  'dose.skipNotAvailable': { ru: 'Недоступно', en: 'Not available' },
  'dose.skipFeltUnwell': { ru: 'Плохое самочувствие', en: 'Felt unwell' },
  'dose.skipOther': { ru: 'Другое', en: 'Other' },
  'dose.markedAsSkipped': { ru: 'Отмечено как пропущено', en: 'Marked as skipped' },
  'dose.food': { ru: 'еды', en: 'meals' },
  'dose.inventoryDecremented': { ru: 'Инвентарь обновлен', en: 'Inventory updated' },
  
  // Schedule
  'schedule.withFoodBefore': { ru: 'до еды', en: 'before meals' },
  'schedule.withFoodAfter': { ru: 'после еды', en: 'after meals' },
  'schedule.withFoodNone': { ru: 'в любое время', en: 'any time' },
  
  // Library
  'library.title': { ru: 'Аптечка', en: 'Medicine Cabinet' },
  'library.manage': { ru: 'Управление препаратами и добавками', en: 'Manage your medications and supplements' },
  'library.noItems': { ru: 'Аптечка пуста', en: 'Medicine cabinet is empty' },
  'library.addItem': { ru: 'Добавить препарат', en: 'Add Item' },
  'library.editItem': { ru: 'Редактировать препарат', en: 'Edit Item' },
  'library.name': { ru: 'Название', en: 'Name' },
  'library.type': { ru: 'Тип', en: 'Type' },
  'library.form': { ru: 'Форма', en: 'Form' },
  'library.notes': { ru: 'Заметки (необязательно)', en: 'Notes (optional)' },
  'library.medication': { ru: 'Лекарство', en: 'Medication' },
  'library.supplement': { ru: 'Добавка', en: 'Supplement' },
  'library.lowStock': { ru: 'Мало осталось', en: 'Low Stock' },
  'library.remaining': { ru: 'Осталось', en: 'Remaining' },
  'library.enterName': { ru: 'Введите название', en: 'Please enter a name' },
  'library.itemCreated': { ru: 'Препарат создан', en: 'Item created' },
  'library.itemUpdated': { ru: 'Препарат обновлен', en: 'Item updated' },
  'library.itemDeleted': { ru: 'Препарат удален', en: 'Item deleted' },
  'library.cannotDelete': { ru: 'Нельзя удалить препарат с активным расписанием', en: 'Cannot delete item with active schedules' },
  'library.deleteConfirm': { ru: 'Вы уверены, что хотите удалить этот препарат?', en: 'Are you sure you want to delete this item?' },
  'library.placeholderName': { ru: 'например, Аспирин', en: 'e.g., Aspirin' },
  'library.placeholderNotes': { ru: 'Дополнительные заметки...', en: 'Additional notes...' },
  'library.showEmpty': { ru: 'Показать закончившиеся', en: 'Show empty' },
  'library.outOfStock': { ru: 'Закончилось', en: 'Out of stock' },
  'library.quantity': { ru: 'Количество', en: 'Quantity' },
  'library.unit': { ru: 'Единица измерения', en: 'Unit' },
  'library.lowThresholdLabel': { ru: 'Порог низкого запаса', en: 'Low stock threshold' },
  'library.thresholdHint': { ru: 'Предупреждение появится, когда останется меньше этого количества', en: 'Alert will appear when remaining is below this amount' },
  'library.inStock': { ru: 'Количество в наличии', en: 'Stock' },
  'library.quantityCannotBeNegative': { ru: 'Количество не может быть отрицательным', en: 'Quantity cannot be negative' },
  'library.unitLabelRequired': { ru: 'Укажите единицу измерения', en: 'Unit label is required' },
  'library.unitLabelDefault': { ru: 'таблеток', en: 'tablets' },
  
  // Settings
  'settings.title': { ru: 'Настройки', en: 'Settings' },
  'settings.managePreferences': { ru: 'Управление настройками', en: 'Manage your preferences' },
  'settings.theme': { ru: 'Тема', en: 'Theme' },
  'settings.light': { ru: 'Светлая', en: 'Light' },
  'settings.dark': { ru: 'Темная', en: 'Dark' },
  'settings.system': { ru: 'Системная', en: 'System' },
  'settings.language': { ru: 'Язык', en: 'Language' },
  'settings.russian': { ru: 'Русский', en: 'Russian' },
  'settings.english': { ru: 'Английский', en: 'English' },
  'settings.notifications': { ru: 'Уведомления', en: 'Notifications' },
  'settings.enableNotifications': { ru: 'Включить уведомления', en: 'Enable notifications' },
  'settings.notificationsEnabled': { ru: 'Уведомления включены', en: 'Notifications enabled' },
  'settings.notificationsDisabled': { ru: 'Уведомления отключены', en: 'Notifications disabled' },
  'settings.lowStockAlert': { ru: 'Предупреждение о низком запасе', en: 'Low Stock Alert' },
  'settings.remaining': { ru: 'осталось', en: 'remaining' },
  'settings.demoData': { ru: 'Демо данные', en: 'Demo Data' },
  'settings.loadSample': { ru: 'Загрузить примеры препаратов и расписаний', en: 'Load sample items and schedules' },
  'settings.load': { ru: 'Загрузить', en: 'Load' },
  'settings.medicalDisclaimer': { ru: 'Медицинский отказ от ответственности', en: 'Medical Disclaimer' },
  'settings.disclaimerText': { ru: 'Это приложение предназначено только для планирования и отслеживания. Оно не предоставляет медицинских советов, рекомендаций по дозировке или инструкций о том, как принимать лекарства. Всегда консультируйтесь с медицинским работником относительно ваших лекарств.', en: 'This app is for scheduling and tracking purposes only. It does not provide medical advice, dosage recommendations, or instructions on how to take medications. Always consult with a healthcare professional regarding your medications.' },
  'settings.manageInventory': { ru: 'Управление инвентарем', en: 'Manage Inventory' },
  'settings.remainingUnits': { ru: 'Оставшиеся единицы', en: 'Remaining Units' },
  'settings.unitLabel': { ru: 'Метка единицы', en: 'Unit Label' },
  'settings.unitLabelPlaceholder': { ru: 'например, таблетки, капсулы, мл', en: 'e.g., tablets, capsules, ml' },
  'settings.lowStockThreshold': { ru: 'Порог низкого запаса', en: 'Low Stock Threshold' },
  'settings.inventoryUpdated': { ru: 'Инвентарь обновлен', en: 'Inventory updated' },
  'settings.switchedTheme': { ru: 'Переключено на', en: 'Switched to' },
  'settings.mode': { ru: 'режим', en: 'mode' },
  'settings.demoDataConfirm': { ru: 'Это добавит демо-препараты и расписания. Продолжить?', en: 'This will add demo items and schedules. Continue?' },
  'settings.demoDataLoaded': { ru: 'Демо-данные загружены', en: 'Demo data loaded' },
};

export function t(key: string, params?: Record<string, string | number>): string {
  const locale = getLocale();
  const translation = translations[key]?.[locale] || translations[key]?.['ru'] || key;
  
  if (params) {
    return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }
  
  return translation;
}

