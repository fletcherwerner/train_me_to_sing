import { useAppStore } from '../../storage/store';

/** 0..1 as a whole percent, "87%". */
export const pct = (x: number): string => `${Math.round(x * 100)}%`;

/** The stored best accuracy for a lesson, or undefined when none yet. */
export function storedBestAccuracy(lessonId: string): number | undefined {
  return useAppStore.getState().progress[lessonId]?.bestAccuracy;
}

/** "Best accuracy: 82%" or "No best yet". Reads the store, so it updates after each saved attempt. */
export function BestAccuracyLine({ lessonId }: { lessonId: string }) {
  const best = useAppStore((s) => s.progress[lessonId]?.bestAccuracy);
  return (
    <p className="lesson-best" data-testid="best-accuracy">
      {best === undefined ? 'No best yet' : `Best accuracy: ${pct(best)}`}
    </p>
  );
}

/**
 * The results line. `prevBest` is the stored best from before this attempt was saved.
 * Beaten (or a first attempt): "Accuracy: 87% — ✓ New best!" plus "(was 82%)". Otherwise "Accuracy: 74% · Best: 82%".
 */
export function AccuracyResultLine({ accuracy, prevBest }: { accuracy: number; prevBest: number | undefined }) {
  // Compare the rounded values the student sees, so "87%" never reads as not beating "87%".
  const notBeaten = prevBest !== undefined && Math.round(accuracy * 100) <= Math.round(prevBest * 100);
  return (
    <p className="lesson-accuracy" data-testid="results-accuracy">
      {!notBeaten ? (
        <>
          Accuracy: {pct(accuracy)} —{' '}
          <strong className="lesson-accuracy__best">✓ New best!</strong>
          {prevBest !== undefined ? ` (was ${pct(prevBest)})` : ''}
        </>
      ) : (
        `Accuracy: ${pct(accuracy)} · Best: ${pct(prevBest ?? 0)}`
      )}
    </p>
  );
}
