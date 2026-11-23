import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { launch } from './storage/launch';
import { getFileSync } from './storage/fileSync';
import './index.css';

/**
 * In the native app the file is read before the store exists, so the store starts from the right data.
 * The app and the store are therefore loaded after `launch()` finishes (at most 2 seconds).
 */
async function start() {
  await launch();
  const { App } = await import('./app/App');
  const { profileSync } = await import('./storage/profiles');
  void profileSync().init();

  if (Capacitor.isNativePlatform()) {
    const { App: CapApp } = await import('@capacitor/app');
    void CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) void getFileSync()?.flush();
    });
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start();
