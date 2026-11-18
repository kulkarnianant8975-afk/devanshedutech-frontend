import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { ToastProvider } from './lib/toast';
import './index.css';
import { captureAttribution } from './lib/attribution';

// Read the campaign tags before the router rewrites the URL.
captureAttribution();

/**
 * Offline caching for the public website only.
 *
 * The CRM is deliberately excluded. A cached copy of the admin app is a liability rather than a
 * feature: it serves an index.html that points at asset files a later build has removed, and an
 * offline CRM would show a counsellor stale leads while letting them believe the data is live.
 *
 * Any service worker already registered on /admin from an earlier build is removed here, so a
 * browser that picked one up stops being controlled by it rather than waiting for it to expire.
 */
if ('serviceWorker' in navigator) {
  const isAdmin = window.location.pathname.startsWith('/admin');
  const isStaticLanding = /^\/(dien|dima|pyen|pyma|aimlen|aimlma|dsen|dsma|daen|dama|aiengen|aiengma|englishlandingpage|marathilandingpage)(\/|$)/.test(window.location.pathname);

  if (isStaticLanding) {
    // A stale service worker from an earlier build intercepted a static landing page
    // and served the React SPA shell instead. Unregister it and reload once into the real page.
    navigator.serviceWorker.getRegistrations()
      .then(regs => Promise.all(regs.map(r => r.unregister())))
      .finally(() => {
        if (!sessionStorage.getItem('landing_sw_reloaded')) {
          sessionStorage.setItem('landing_sw_reloaded', '1');
          window.location.reload();
        }
      });
  } else if (isAdmin) {
    navigator.serviceWorker.getRegistrations()
      .then(regs => regs.forEach(r => r.unregister()))
      .catch(() => { /* nothing useful to do if the browser refuses */ });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(err => {
        console.log('SW registration failed: ', err);
      });
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
);
