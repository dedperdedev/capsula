/**
 * Partner Links Module
 * Abstraction layer for pharmacy/commerce partner links
 */

import { isFeatureEnabled } from './featureFlags';

export interface PartnerProvider {
  id: string;
  name: string;
  country: string;
  urlTemplate: string; // e.g., "https://example.com/search?q={medication}"
  trackingParams?: Record<string, string>; // e.g., { affiliate: "capsula", source: "app" }
  enabled: boolean;
}

// Default providers (can be extended)
const DEFAULT_PROVIDERS: PartnerProvider[] = [
  {
    id: 'liki24',
    name: 'Liki24',
    country: 'UA',
    urlTemplate: 'https://liki24.com/search?q={medication}',
    trackingParams: { source: 'capsula' },
    enabled: true,
  },
  {
    id: 'apteka',
    name: 'Аптека',
    country: 'UA',
    urlTemplate: 'https://apteka.ua/search?query={medication}',
    trackingParams: { utm_source: 'capsula' },
    enabled: false,
  },
];

const STORAGE_KEY = 'capsula_partner_providers';

/**
 * Get all partner providers
 */
export function getPartnerProviders(): PartnerProvider[] {
  if (!isFeatureEnabled('partnerLinks')) {
    return [];
  }

  if (typeof window === 'undefined') return DEFAULT_PROVIDERS;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_PROVIDERS;

    const storedProviders = JSON.parse(stored) as PartnerProvider[];
    // Merge with defaults (prefer stored over defaults)
    const merged = [...DEFAULT_PROVIDERS];
    for (const stored of storedProviders) {
      const index = merged.findIndex(p => p.id === stored.id);
      if (index >= 0) {
        merged[index] = { ...merged[index], ...stored };
      } else {
        merged.push(stored);
      }
    }
    return merged.filter(p => p.enabled);
  } catch {
    return DEFAULT_PROVIDERS.filter(p => p.enabled);
  }
}

/**
 * Get buy URL for a medication
 */
export function getBuyUrl(medicationName: string, providerId?: string): string | null {
  const providers = getPartnerProviders();
  if (providers.length === 0) return null;

  const provider = providerId 
    ? providers.find(p => p.id === providerId)
    : providers[0]; // Use first enabled provider

  if (!provider) return null;

  let url = provider.urlTemplate.replace('{medication}', encodeURIComponent(medicationName));

  // Add tracking params
  if (provider.trackingParams) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(provider.trackingParams)) {
      params.append(key, value);
    }
    const separator = url.includes('?') ? '&' : '?';
    url += separator + params.toString();
  }

  return url;
}

/**
 * Update provider configuration
 */
export function updatePartnerProvider(provider: PartnerProvider): void {
  if (!isFeatureEnabled('partnerLinks')) return;
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const providers = stored ? (JSON.parse(stored) as PartnerProvider[]) : [];
    
    const index = providers.findIndex(p => p.id === provider.id);
    if (index >= 0) {
      providers[index] = provider;
    } else {
      providers.push(provider);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
  } catch (error) {
    console.error('Failed to update partner provider:', error);
  }
}

