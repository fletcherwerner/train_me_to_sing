import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let clock = 0;
vi.mock('../../audio/audioEngine', () => ({ now: () => clock }));
import { useGuideRescue } from './useGuideRescue';

beforeEach(() => {
  clock = 0;
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

const run = (ms: number) =>
  act(() => {
    for (let i = 0; i < ms / 50; i++) {
      clock += 0.05;
      vi.advanceTimersByTime(50);
    }
  });

describe('useGuideRescue', () => {
  it('shows after the threshold for the note, then hides at the next note', () => {
    const { result, rerender } = renderHook(
      ({ idx }) => useGuideRescue(true, idx, 300, 50, 2),
      { initialProps: { idx: 0 } },
    );
    run(500);
    expect(result.current.visible).toBe(false);
    run(1500);
    expect(result.current.visible).toBe(true);
    expect(result.current.helped()).toBe(1);
    rerender({ idx: 1 });
    expect(result.current.visible).toBe(false);
    expect(result.current.helped()).toBe(1);
  });

  it('does not count silence', () => {
    const { result } = renderHook(() => useGuideRescue(true, 0, null, 50, 2));
    run(3000);
    expect(result.current.visible).toBe(false);
  });
});
