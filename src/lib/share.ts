/**
 * Share Module
 * Generate share packages (encrypted JSON) + QR codes for import
 */

import { loadAppState, saveAppState, type SharePackage } from '../data/storage';
import { isFeatureEnabled } from './featureFlags';

export type { SharePackage } from '../data/storage';

/**
 * Generate a share package (encrypted JSON with embedded payload)
 */
export async function generateSharePackage(
  profileId: string,
  _password: string, // Reserved for future encryption
  viewOnly: boolean = true,
  expiresInDays: number = 7
): Promise<SharePackage> {
  if (!isFeatureEnabled('shareByLink') && !isFeatureEnabled('shareByCode')) {
    throw new Error('Share feature is disabled');
  }

  const state = loadAppState();
  const profile = state.profiles.find(p => p.id === profileId);
  if (!profile) throw new Error('Profile not found');

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Create shareable data (subset of state)
  const shareData = {
    profile: {
      id: profile.id,
      name: profile.name,
    },
    medications: state.medications.filter(m => 
      state.schedules.some(s => s.medicationId === m.id && s.profileId === profileId)
    ),
    schedules: state.schedules.filter(s => s.profileId === profileId),
    events: state.events.filter(e => e.profileId === profileId),
    inventory: state.inventory.filter(i => i.profileId === profileId),
    symptomEntries: state.symptomEntries.filter(e => e.profileId === profileId),
    measurementEntries: state.measurementEntries.filter(e => e.profileId === profileId),
    exportDate: new Date().toISOString(),
    viewOnly,
  };

  // Encrypt the data (for MVP, store as JSON; full encryption can be added later)
  // TODO: Implement proper encryption for share packages
  const encryptedDataStr = JSON.stringify(shareData);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const sharePackage: SharePackage = {
    id: crypto.randomUUID(),
    profileId,
    code,
    encryptedData: encryptedDataStr,
    expiresAt: expiresAt.toISOString(),
    viewOnly,
    createdAt: new Date().toISOString(),
    accessCount: 0,
  };

  // Save to state
  state.sharePackages.push(sharePackage);
  saveAppState(state);

  return sharePackage;
}

/**
 * Get share package by code
 */
export function getSharePackage(code: string): SharePackage | null {
  const state = loadAppState();
  const pkg = state.sharePackages.find(p => p.code === code);
  
  if (!pkg) return null;
  
  // Check expiration
  if (pkg.expiresAt && new Date(pkg.expiresAt) < new Date()) {
    return null;
  }

  // Update access count
  pkg.accessCount++;
  pkg.accessedAt = new Date().toISOString();
  saveAppState(state);

  return pkg;
}

/**
 * Generate share URL (for future backend integration)
 */
export function generateShareUrl(code: string): string {
  if (typeof window === 'undefined') return '';
  
  const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
  return `${baseUrl}/share/${code}`;
}

/**
 * Generate QR code data URL (using a simple library or canvas)
 * For MVP, return a data structure that can be rendered
 */
export function generateQRCodeData(code: string): string {
  // Simple QR code generation using a library would go here
  // For now, return a placeholder
  // In production, use a library like 'qrcode' or 'qrcode.react'
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(generateShareUrl(code))}`;
}

/**
 * Delete a share package
 */
export function deleteSharePackage(packageId: string): boolean {
  const state = loadAppState();
  const index = state.sharePackages.findIndex(p => p.id === packageId);
  
  if (index === -1) return false;

  state.sharePackages.splice(index, 1);
  saveAppState(state);
  return true;
}

/**
 * Get all share packages for a profile
 */
export function getSharePackages(profileId: string): SharePackage[] {
  const state = loadAppState();
  return state.sharePackages
    .filter(p => p.profileId === profileId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

