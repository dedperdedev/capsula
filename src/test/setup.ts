/**
 * Test setup file
 */

import { vi, afterEach, afterAll } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock crypto.randomUUID
Object.defineProperty(crypto, 'randomUUID', {
  value: () => 'test-uuid-' + Math.random().toString(36).substring(2, 15),
});

// Reset mocks between tests
afterEach(() => {
  localStorageMock.getItem.mockReset();
  localStorageMock.setItem.mockReset();
  localStorageMock.removeItem.mockReset();
  localStorageMock.clear.mockReset();
});

// Cleanup
afterAll(() => {
  vi.clearAllMocks();
});

