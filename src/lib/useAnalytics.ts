import { useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * A mock analytics hook serving as a drop-in adapter for product telemetry
 * like PostHog, Google Analytics, or Amplitude.
 *
 * `trackEvent` is declared before the effect that uses it, and memoised. Previously it was
 * declared below and rebuilt on every render, so the page-view effect closed over the very
 * first copy — harmless while the body is a console call, and a real stale-closure bug the
 * moment it captures anything that changes, such as a signed-in user.
 */
export const useAnalytics = () => {
  const location = useLocation();

  const trackEvent = useCallback((eventName: string, payload?: Record<string, unknown>) => {
    // TODO: swap in real telemetry here.
    // e.g., posthog.capture(eventName, payload);
    // e.g., window.gtag('event', eventName, payload);
    console.log(`[Analytics] '${eventName}'`, payload ?? {});
  }, []);

  // Page views, on every route change.
  useEffect(() => {
    trackEvent('page_view', { path: location.pathname });
  }, [location.pathname, trackEvent]);

  return { trackEvent };
};
