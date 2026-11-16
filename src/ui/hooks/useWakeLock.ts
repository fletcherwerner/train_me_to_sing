import { useEffect } from 'react';

interface WakeLockSentinelLike {
  release(): Promise<void>;
}

/** Holds a screen wake lock while `active`. Silently does nothing where unsupported or refused. */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const wakeLock = (navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> } })
      .wakeLock;
    if (!wakeLock) return;
    let cancelled = false;
    let sentinel: WakeLockSentinelLike | null = null;
    wakeLock
      .request('screen')
      .then((s) => {
        if (cancelled) void s.release().catch(() => undefined);
        else sentinel = s;
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      void sentinel?.release().catch(() => undefined);
    };
  }, [active]);
}
