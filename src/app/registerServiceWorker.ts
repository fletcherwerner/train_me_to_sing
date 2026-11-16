import { Capacitor } from '@capacitor/core';

/**
 * Registers the service worker (production builds only) and reports when an update has taken over.
 * The generated worker skips waiting (registerType 'autoUpdate'), so a new version becomes the
 * controller by itself; we tell the UI instead of reloading under the student mid-lesson.
 */
export function registerServiceWorker(onUpdateReady: () => void): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  // The native shell serves the app from bundled files; a service worker would only add a second cache.
  if (Capacitor.isNativePlatform()) return;
  const hadController = navigator.serviceWorker.controller !== null;
  let first = !hadController;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // The first install claiming the page is not an update.
    if (first) {
      first = false;
      return;
    }
    onUpdateReady();
  });
  const register = () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => undefined);
  };
  // This runs from a React effect, so the load event may already have fired.
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
