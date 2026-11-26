import { readFileSync } from 'node:fs';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NoteGuide } from './NoteGuide';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** Vertical position as a multiple of the box height; negative = above the line. */
const dotY = () =>
  -Number(/\* (-?[\d.e-]+)\)/.exec((screen.getByTestId('note-guide-dot').parentElement as HTMLElement).style.transform)![1]) ||
  0;

describe('NoteGuide', () => {
  it('puts the dot above when high, below when low, on the line when on it', () => {
    const { rerender } = render(<NoteGuide target="E4" cents={300} toleranceCents={50} />);
    expect(dotY()).toBeGreaterThan(0);
    rerender(<NoteGuide target="E4" cents={-300} toleranceCents={50} />);
    expect(dotY()).toBeLessThan(0);
    rerender(<NoteGuide target="E4" cents={0} toleranceCents={50} />);
    expect(screen.getByTestId('note-guide').dataset.state).toBe('on');
    expect(dotY()).toBeCloseTo(0);
    expect(screen.getByTestId('note-guide-note').textContent).toBe('E4');
  });

  it('hides the dot when silent for over 250 ms, and says so', () => {
    const { rerender } = render(<NoteGuide target="E4" cents={0} toleranceCents={50} />);
    rerender(<NoteGuide target="E4" cents={null} toleranceCents={50} />);
    expect(screen.queryByTestId('note-guide-dot')).not.toBeNull();
    act(() => void vi.advanceTimersByTime(300));
    expect(screen.queryByTestId('note-guide-dot')).toBeNull();
    act(() => void vi.advanceTimersByTime(1100));
    expect(screen.getByTestId('note-guide-text').textContent).toBe('Sing to see your dot');
  });

  it('shows the target line only, with no dot, when showDot is false', () => {
    render(<NoteGuide target="E4" cents={0} toleranceCents={50} showDot={false} />);
    expect(screen.queryByTestId('note-guide-dot')).toBeNull();
    expect(screen.getByTestId('note-guide-note').textContent).toBe('E4');
  });

  it('the visible text changes after 2 frames (about 35 ms), not after a second', () => {
    const { rerender } = render(<NoteGuide target="E4" cents={-35} toleranceCents={20} />);
    const text = screen.getByTestId('note-guide-text');
    expect(text.textContent).toBe('A little low: go up (−35 cents)');
    rerender(<NoteGuide target="E4" cents={300} toleranceCents={20} />);
    // Held for less than 2 frames: still the old text.
    act(() => void vi.advanceTimersByTime(20));
    expect(text.textContent).toBe('A little low: go up (−35 cents)');
    act(() => void vi.advanceTimersByTime(25));
    expect(text.textContent).toBe('About 3 notes too high: come down');
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe(text.textContent);
  });

  it('a flicker that does not hold for 2 frames never reaches the text', () => {
    const { rerender } = render(<NoteGuide target="E4" cents={0} toleranceCents={20} />);
    const text = screen.getByTestId('note-guide-text');
    rerender(<NoteGuide target="E4" cents={-40} toleranceCents={20} />);
    act(() => void vi.advanceTimersByTime(15));
    rerender(<NoteGuide target="E4" cents={0} toleranceCents={20} />);
    act(() => void vi.advanceTimersByTime(100));
    expect(text.textContent).toBe('On it');
  });

  it('the near-case cents number is live and rounds to the nearest 5', () => {
    const { rerender } = render(<NoteGuide target="E4" cents={-37} toleranceCents={20} />);
    const text = screen.getByTestId('note-guide-text');
    expect(text.textContent).toBe('A little low: go up (−35 cents)');
    rerender(<NoteGuide target="E4" cents={-43} toleranceCents={20} />);
    expect(text.textContent).toBe('A little low: go up (−45 cents)');
    rerender(<NoteGuide target="E4" cents={-48} toleranceCents={20} />);
    expect(text.textContent).toBe('A little low: go up (−50 cents)');
  });

  it('the hidden live region announces at most once a second, and only when kind or direction changes', () => {
    const { rerender } = render(<NoteGuide target="E4" cents={-35} toleranceCents={20} />);
    const text = screen.getByTestId('note-guide-text');
    const live = screen.getByTestId('note-guide-announce');
    expect(text.getAttribute('aria-live')).toBeNull();
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toBe('A little low: go up (−35 cents)');
    // The number moves; the announcement does not.
    rerender(<NoteGuide target="E4" cents={-60} toleranceCents={20} />);
    act(() => void vi.advanceTimersByTime(2000));
    expect(live.textContent).toBe('A little low: go up (−35 cents)');
    // A new kind: more than a second since the last announcement, so it is announced as soon as it shows.
    rerender(<NoteGuide target="E4" cents={-300} toleranceCents={20} />);
    act(() => void vi.advanceTimersByTime(50));
    expect(text.textContent).toBe('About 3 notes too low: go up');
    expect(live.textContent).toBe('About 3 notes too low: go up');
    // Changing again straight away shows at once, but is announced only when the second is up.
    rerender(<NoteGuide target="E4" cents={300} toleranceCents={20} />);
    act(() => void vi.advanceTimersByTime(100));
    expect(text.textContent).toBe('About 3 notes too high: come down');
    expect(live.textContent).toBe('About 3 notes too low: go up');
    act(() => void vi.advanceTimersByTime(1100));
    expect(live.textContent).toBe('About 3 notes too high: come down');
  });

  it('the dot eases for at most 30 ms', () => {
    // jsdom does not load the CSS, so read the rule from the source.
    const css = readFileSync('src/ui/components/NoteGuide.css', 'utf8');
    const ms = Number(/note-guide__track \{[^}]*transition: transform (\d+)ms/s.exec(css)?.[1]);
    expect(ms).toBeLessThanOrEqual(30);
    expect(css).toMatch(/prefers-reduced-motion[^]*note-guide__track \{\s*transition: none/);
  });
});
