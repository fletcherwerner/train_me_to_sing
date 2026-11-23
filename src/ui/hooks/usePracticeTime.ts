import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { createPracticeClock } from '../../core/insights/practiceClock';
import { useAppStore } from '../../storage/store';
import { todayString } from '../../storage/today';

/** Practice time is not musical timing, so the wall clock is fine here. */
const nowSec = () => Date.now() / 1000;

const clock = createPracticeClock((seconds) => useAppStore.getState().addPracticeSeconds(todayString(), seconds));

const INPUT_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;
const TICK_MS = 5000;

let openScreens = 0;
const running = new Set<symbol>();
let timer: ReturnType<typeof setInterval> | null = null;
let removeAppListener: (() => void) | null = null;

const onInput = () => clock.input(nowSec());
const onVisibility = () => clock.setVisible(document.visibilityState === 'visible', nowSec());

function attach() {
  for (const e of INPUT_EVENTS) window.addEventListener(e, onInput, { passive: true, capture: true });
  document.addEventListener('visibilitychange', onVisibility);
  timer = setInterval(() => clock.flush(nowSec(), false), TICK_MS);
  clock.setVisible(document.visibilityState === 'visible', nowSec());
  if (Capacitor.isNativePlatform()) {
    let cancelled = false;
    let handle: { remove: () => Promise<void> } | null = null;
    void import('@capacitor/app').then(async ({ App }) => {
      const h = await App.addListener('appStateChange', ({ isActive }) => clock.setVisible(isActive, nowSec()));
      if (cancelled) void h.remove();
      else handle = h;
    });
    removeAppListener = () => {
      cancelled = true;
      void handle?.remove();
    };
  }
}

function detach() {
  for (const e of INPUT_EVENTS) window.removeEventListener(e, onInput, { capture: true });
  document.removeEventListener('visibilitychange', onVisibility);
  if (timer) clearInterval(timer);
  timer = null;
  removeAppListener?.();
  removeAppListener = null;
}

/** Saves any built-up practice time now (at the end of a run). */
export function flushPracticeTime(): void {
  clock.flush(nowSec(), true);
}

/**
 * Counts practice time while the calling screen is open and the page is visible. Pass `runActive` as true
 * while a run is in progress. Several screens can use it at once (a lesson inside Today's practice); time counts once.
 */
export function usePracticeTime(runActive: boolean): void {
  const token = useRef(Symbol('run'));
  useEffect(() => {
    const mine = token.current;
    if (openScreens++ === 0) attach();
    clock.open(nowSec());
    return () => {
      running.delete(mine);
      clock.setRunning(running.size > 0, nowSec());
      clock.close(nowSec());
      if (--openScreens === 0) detach();
    };
  }, []);
  useEffect(() => {
    if (runActive) running.add(token.current);
    else running.delete(token.current);
    clock.setRunning(running.size > 0, nowSec());
    if (!runActive) clock.flush(nowSec(), true);
  }, [runActive]);
}
