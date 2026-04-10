import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * A mock analytics hook serving as a drop-in adapter for product telemetry 
 * like PostHog, Google Analytics, or Amplitude.
 */
export const useAnalytics = () => {
  const location = useLocation();

  // Track page views automatically on route change
  useEffect(() => {
    trackEvent('page_view', { path: location.pathname });
  }, [location.pathname]);

  const trackEvent = (eventName: string, payload?: Record<string, any>) => {
    // 🚀 TODO: Swap with actual telemetry tracking token initializing here
    // e.g., posthog.capture(eventName, payload);
    // e.g., window.gtag('event', eventName, payload);
    
    console.log(`📊 [Analytics Event Tracked]: '${eventName}'`, payload || {});
  };

  return { trackEvent };
};
