/**
 * Test Setup File
 * Configura o ambiente de testes com mocks e utilities globais
 */

import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup após cada teste (globals enabled in vitest.config.ts)
afterEach(() => {
  cleanup();
});

// Mock do window.matchMedia (usado para testes responsivos)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock do IntersectionObserver (usado para lazy loading)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;

// Mock do ResizeObserver (usado para componentes responsivos)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown as typeof ResizeObserver;

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn((): string | null => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
} as Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'clear'>;

global.localStorage = localStorageMock as unknown as Storage;

// Silenciar console.error durante testes (opcional)
const originalError = console.error;
beforeAll(() => {
  const mockedError = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.error = mockedError as typeof console.error;
});

afterAll(() => {
  console.error = originalError;
});
