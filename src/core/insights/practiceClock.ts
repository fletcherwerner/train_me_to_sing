/** After this long with no run in progress and no input, time stops counting. */
export const IDLE_LIMIT_SEC = 120;
/** Periodic saves wait until this much has built up. Leaving, hiding and run ends save whatever is there. */
export const MIN_CHUNK_SEC = 15;

export interface PracticeClock {
  /** A practice screen opened (several can be open at once, such as a lesson inside Today's practice). */
  open(t: number): void;
  close(t: number): void;
  setVisible(visible: boolean, t: number): void;
  /** A run is in progress (its time always counts). */
  setRunning(running: boolean, t: number): void;
  /** The student touched the screen or a key. */
  input(t: number): void;
  /** Saves built-up time. `force` saves any whole seconds, however few. */
  flush(t: number, force: boolean): void;
  /** Seconds waiting to be saved (for tests). */
  pending(): number;
}

/**
 * Counts practice time. Pure apart from `onSave`; times are seconds on any one clock.
 * Counts while a screen is open and the page is visible. With a run in progress it always counts; otherwise
 * only up to `IDLE_LIMIT_SEC` after the last input, so a phone left on the results screen stops counting.
 */
export function createPracticeClock(onSave: (seconds: number) => void): PracticeClock {
  let screens = 0;
  let visible = true;
  let running = false;
  let lastT: number | null = null;
  let lastActive = 0;
  let pending = 0;

  const advance = (t: number) => {
    if (lastT === null) {
      lastT = t;
      return;
    }
    const dt = Math.max(0, t - lastT);
    if (screens > 0 && visible) {
      if (running) {
        pending += dt;
        lastActive = t;
      } else {
        pending += Math.min(dt, Math.max(0, lastActive + IDLE_LIMIT_SEC - lastT));
      }
    }
    lastT = t;
  };
  const save = (force: boolean) => {
    const whole = Math.floor(pending);
    if (whole >= (force ? 1 : MIN_CHUNK_SEC)) {
      pending -= whole;
      onSave(whole);
    }
  };
  return {
    open(t) {
      advance(t);
      if (screens === 0) lastActive = t;
      screens++;
    },
    close(t) {
      advance(t);
      screens = Math.max(0, screens - 1);
      save(true);
    },
    setVisible(v, t) {
      advance(t);
      if (v && !visible) lastActive = t;
      visible = v;
      if (!v) save(true);
    },
    setRunning(r, t) {
      advance(t);
      running = r;
      lastActive = t;
    },
    input(t) {
      advance(t);
      lastActive = t;
    },
    flush(t, force) {
      advance(t);
      save(force);
    },
    pending: () => pending,
  };
}
