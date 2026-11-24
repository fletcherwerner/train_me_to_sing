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

  it('text matches the state, and aria-live text changes only when kind or direction does', () => {
    const { rerender } = render(<NoteGuide target="E4" cents={-35} toleranceCents={20} />);
    const text = screen.getByTestId('note-guide-text');
    expect(text.getAttribute('aria-live')).toBe('polite');
    expect(text.textContent).toBe('A little low: go up (−35 cents)');
    rerender(<NoteGuide target="E4" cents={-40} toleranceCents={20} />);
    act(() => void vi.advanceTimersByTime(2000));
    expect(text.textContent).toBe('A little low: go up (−35 cents)');
    rerender(<NoteGuide target="E4" cents={-300} toleranceCents={20} />);
    act(() => void vi.advanceTimersByTime(1100));
    expect(text.textContent).toBe('About 3 notes too low: go up');
    expect(screen.getByRole('img').getAttribute('aria-label')).toBe(text.textContent);
  });
});
