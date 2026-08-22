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

/**
 * jsdom has no IntersectionObserver, and framer-motion's `whileInView` needs one.
 *
 * Without this, any element that animates into view throws while rendering and simply never
 * appears — which reads in a test as "the component is broken" rather than "the environment
 * cannot see". Reporting everything as visible matches what a real browser does for content
 * that is on screen, which is the case these tests are describing.
 */
class ImmediateIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) { this.callback = callback; }

  observe(target: Element): void {
    this.callback(
      [{ isIntersecting: true, target, intersectionRatio: 1 } as IntersectionObserverEntry],
      this,
    );
  }
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

window.IntersectionObserver = ImmediateIntersectionObserver as unknown as typeof IntersectionObserver;
globalThis.IntersectionObserver = window.IntersectionObserver;
