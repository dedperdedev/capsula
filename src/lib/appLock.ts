/**
 * App Lock Module
 * PIN-based security using Web Crypto (PBKDF2)
 */

import { loadAppState, saveAppState, appendEvent } from '../data/storage';

const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 256;
const LOCK_TIMEOUT_KEY = 'capsula_lock_timestamp';

// ============ PIN MANAGEMENT ============

/**
 * Set or change PIN
 */
export async function setPin(pin: string): Promise<boolean> {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const hash = await hashPin(pin, salt);
    
    const state = loadAppState();
    state.pinHash = hash;
    state.pinSalt = arrayBufferToBase64(salt);
    state.settings.appLockEnabled = true;
    saveAppState(state);

    appendEvent({
      profileId: state.activeProfileId || 'system',
      ts: new Date().toISOString(),
      type: 'PIN_ENABLED',
      metadata: {},
    });

    return true;
  } catch (error) {
    console.error('Failed to set PIN:', error);
    return false;
  }
}

/**
 * Verify PIN
 */
export async function verifyPin(pin: string): Promise<boolean> {
  const state = loadAppState();
  
  if (!state.pinHash || !state.pinSalt) {
    return true; // No PIN set
  }

  try {
    const salt = base64ToArrayBuffer(state.pinSalt);
    const hash = await hashPin(pin, new Uint8Array(salt));
    return hash === state.pinHash;
  } catch {
    return false;
  }
}

/**
 * Remove PIN
 */
export async function removePin(currentPin: string): Promise<boolean> {
  const isValid = await verifyPin(currentPin);
  if (!isValid) return false;

  const state = loadAppState();
  delete state.pinHash;
  delete state.pinSalt;
  state.settings.appLockEnabled = false;
  saveAppState(state);

  appendEvent({
    profileId: state.activeProfileId || 'system',
    ts: new Date().toISOString(),
    type: 'PIN_DISABLED',
    metadata: {},
  });

  return true;
}

/**
 * Check if PIN is enabled
 */
export function isPinEnabled(): boolean {
  const state = loadAppState();
  return state.settings.appLockEnabled && !!state.pinHash;
}

// ============ LOCK STATE ============

/**
 * Check if app should be locked
 */
export function shouldLock(): boolean {
  if (!isPinEnabled()) return false;

  const state = loadAppState();
  const timeoutMinutes = state.settings.appLockTimeoutMinutes || 0;
  
  // Check if we have a recent unlock timestamp
  const lastUnlock = localStorage.getItem(LOCK_TIMEOUT_KEY);
  if (!lastUnlock) return true;

  const lastUnlockTime = parseInt(lastUnlock, 10);
  if (isNaN(lastUnlockTime)) return true;

  // If timeout is 0, lock immediately on any background
  if (timeoutMinutes === 0) {
    // Check document visibility
    if (document.hidden) return true;
  }

  const elapsed = (Date.now() - lastUnlockTime) / (1000 * 60);
  return elapsed > timeoutMinutes;
}

/**
 * Record successful unlock
 */
export function recordUnlock(): void {
  localStorage.setItem(LOCK_TIMEOUT_KEY, Date.now().toString());
}

/**
 * Force lock the app
 */
export function forceLock(): void {
  localStorage.removeItem(LOCK_TIMEOUT_KEY);
}

/**
 * Handle visibility change (lock on background if configured)
 */
export function handleVisibilityChange(): boolean {
  if (document.hidden) {
    const state = loadAppState();
    if (state.settings.appLockTimeoutMinutes === 0) {
      forceLock();
      return true;
    }
  }
  return false;
}

// ============ CRYPTO HELPERS ============

async function hashPin(pin: string, salt: Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH
  );

  return arrayBufferToBase64(derivedBits);
}

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

