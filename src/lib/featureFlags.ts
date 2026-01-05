/**
 * Feature Flags Module
 * Local configuration to gate optional/experimental features
 */

// Feature flags are stored separately in localStorage

export interface FeatureFlags {
  // Sharing & collaboration
  shareByLink: boolean;
  shareByCode: boolean;
  familyOverview: boolean;
  
  // Advanced features
  swipeGestures: boolean;
  routineAnchors: boolean;
  travelMode: boolean;
  privateMode: boolean;
  
  // Commerce
  shoppingList: boolean;
  partnerLinks: boolean;
  
  // Platform
  nativeShells: boolean;
  notificationDiagnostics: boolean;
  
  // Experimental
  advancedAnalytics: boolean;
  aiInsights: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  shareByLink: false,
  shareByCode: false,
  familyOverview: true,
  swipeGestures: true,
  routineAnchors: true,
  travelMode: true,
  privateMode: true,
  shoppingList: true,
  partnerLinks: false,
  nativeShells: false,
  notificationDiagnostics: false,
  advancedAnalytics: false,
  aiInsights: false,
};

const STORAGE_KEY = 'capsula_feature_flags';

/**
 * Get all feature flags
 */
export function getFeatureFlags(): FeatureFlags {
  if (typeof window === 'undefined') return DEFAULT_FLAGS;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_FLAGS;
    
    const parsed = JSON.parse(stored) as Partial<FeatureFlags>;
    return { ...DEFAULT_FLAGS, ...parsed };
  } catch {
    return DEFAULT_FLAGS;
  }
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[flag] ?? false;
}

/**
 * Set a feature flag
 */
export function setFeatureFlag(flag: keyof FeatureFlags, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  
  const flags = getFeatureFlags();
  flags[flag] = enabled;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch (error) {
    console.error('Failed to save feature flags:', error);
  }
}

/**
 * Reset all flags to defaults
 */
export function resetFeatureFlags(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to reset feature flags:', error);
  }
}

/**
 * Get feature flags for display in settings
 */
export function getFeatureFlagsForSettings(): Array<{ key: keyof FeatureFlags; label: { ru: string; en: string }; description: { ru: string; en: string }; category: string }> {
  return [
    {
      key: 'swipeGestures',
      label: { ru: 'Жесты свайпа', en: 'Swipe Gestures' },
      description: { ru: 'Свайп для быстрых действий с дозами', en: 'Swipe for quick dose actions' },
      category: 'UX',
    },
    {
      key: 'routineAnchors',
      label: { ru: 'Якоря распорядка', en: 'Routine Anchors' },
      description: { ru: 'Привязка к времени пробуждения/еды/сна', en: 'Anchor to wake/meal/bed times' },
      category: 'UX',
    },
    {
      key: 'familyOverview',
      label: { ru: 'Обзор семьи', en: 'Family Overview' },
      description: { ru: 'Экран общего статуса всех профилей', en: 'Screen showing all profiles status' },
      category: 'Caregiver',
    },
    {
      key: 'shareByLink',
      label: { ru: 'Поделиться ссылкой', en: 'Share by Link' },
      description: { ru: 'Генерация ссылки для просмотра данных', en: 'Generate link to share data view' },
      category: 'Sharing',
    },
    {
      key: 'shareByCode',
      label: { ru: 'Поделиться кодом', en: 'Share by Code' },
      description: { ru: 'Генерация QR-кода для импорта', en: 'Generate QR code for import' },
      category: 'Sharing',
    },
    {
      key: 'travelMode',
      label: { ru: 'Режим путешествий', en: 'Travel Mode' },
      description: { ru: 'Управление временными зонами', en: 'Timezone management' },
      category: 'UX',
    },
    {
      key: 'privateMode',
      label: { ru: 'Приватный режим', en: 'Private Mode' },
      description: { ru: 'Скрывать названия препаратов до разблокировки', en: 'Hide medication names until unlock' },
      category: 'Privacy',
    },
    {
      key: 'shoppingList',
      label: { ru: 'Список покупок', en: 'Shopping List' },
      description: { ru: 'Автоматический список для пополнения', en: 'Auto-generated refill shopping list' },
      category: 'Commerce',
    },
    {
      key: 'partnerLinks',
      label: { ru: 'Партнерские ссылки', en: 'Partner Links' },
      description: { ru: 'Интеграция с партнерскими аптеками', en: 'Integration with partner pharmacies' },
      category: 'Commerce',
    },
    {
      key: 'notificationDiagnostics',
      label: { ru: 'Диагностика уведомлений', en: 'Notification Diagnostics' },
      description: { ru: 'Панель тестирования уведомлений', en: 'Panel to test notifications' },
      category: 'Platform',
    },
  ];
}

