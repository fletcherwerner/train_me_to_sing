import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NowSinging } from './NowSinging';

const notes = ['Twin', 'kle', 'twin', 'kle'].map((lyric, index) => ({ index, midi: 60, startSec: index, durationSec: 1, lyric }));

describe('NowSinging', () => {
  it('shows current bold with previous and next two', () => {
    const { container } = render(<NowSinging notes={notes} currentIndex={1} />);
    expect(screen.getByTestId('now-prev').textContent).toBe('Twin');
    expect(screen.getByTestId('now-current').textContent).toBe('kle');
    expect([...container.querySelectorAll('.now-singing__next')].map((e) => e.textContent)).toEqual(['twin', 'kle']);
  });
  it('before the first note shows the upcoming syllables', () => {
    const { container } = render(<NowSinging notes={notes} currentIndex={null} />);
    expect(screen.getByTestId('now-current').textContent).toBe('');
    expect([...container.querySelectorAll('.now-singing__next')].map((e) => e.textContent)).toEqual(['Twin', 'kle']);
  });
});
