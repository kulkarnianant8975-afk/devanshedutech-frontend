import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// jsdom does not implement these, and components that use them should not have to care.
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn();
