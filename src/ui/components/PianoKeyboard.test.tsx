import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PianoKeyboard } from './PianoKeyboard';

describe('PianoKeyboard', () => {
  it('renders C3-C5 as 15 white and 10 black keys', () => {
    const { container } = render(<PianoKeyboard lowMidi={48} highMidi={72} />);
    expect(container.querySelectorAll('.piano-key--white')).toHaveLength(15);
    expect(container.querySelectorAll('.piano-key--black')).toHaveLength(10);
    expect(container.textContent).toContain('C3');
    expect(container.textContent).toContain('C4');
    expect(container.textContent).toContain('C5');
  });

  it('extends outward when an end is a black key', () => {
    const { container } = render(<PianoKeyboard lowMidi={49} highMidi={70} />);
    expect(screen.getByTestId('key-48')).toBeInTheDocument();
    expect(screen.getByTestId('key-71')).toBeInTheDocument();
    expect(container.querySelectorAll('.piano-key--white').length).toBe(14);
  });

  it('marks the target key', () => {
    render(<PianoKeyboard lowMidi={48} highMidi={72} targetMidi={60} />);
    expect(screen.getByTestId('key-60')).toHaveClass('piano-key--target');
    expect(screen.getByTestId('key-62')).not.toHaveClass('piano-key--target');
  });

  it('colours the sung key by match', () => {
    const { rerender } = render(<PianoKeyboard lowMidi={48} highMidi={72} targetMidi={60} sungMidi={60.2} />);
    expect(screen.getByTestId('key-60')).toHaveClass('piano-key--sung-match');
    rerender(<PianoKeyboard lowMidi={48} highMidi={72} targetMidi={60} sungMidi={61.6} />);
    expect(screen.getByTestId('key-62')).toHaveClass('piano-key--sung-off');
    rerender(<PianoKeyboard lowMidi={48} highMidi={72} sungMidi={64} />);
    expect(screen.getByTestId('key-64')).toHaveClass('piano-key--sung-match');
  });

  it('shows an edge arrow for out-of-range sung pitch', () => {
    const { rerender } = render(<PianoKeyboard lowMidi={48} highMidi={72} sungMidi={43.2} />);
    expect(screen.getByTestId('edge-arrow')).toHaveTextContent('◀ G2');
    rerender(<PianoKeyboard lowMidi={48} highMidi={72} sungMidi={75} />);
    expect(screen.getByTestId('edge-arrow')).toHaveTextContent('D#5 ▶');
    rerender(<PianoKeyboard lowMidi={48} highMidi={72} sungMidi={60} />);
    expect(screen.queryByTestId('edge-arrow')).toBeNull();
  });

  it('shows range markers', () => {
    render(<PianoKeyboard lowMidi={48} highMidi={72} rangeMarkers={{ lowMidi: 52, highMidi: 67 }} />);
    expect(screen.getByTestId('marker-low')).toHaveTextContent('low');
    expect(screen.getByTestId('marker-high')).toHaveTextContent('high');
  });

  it('calls onKeyPress on pointer down', () => {
    const onKeyPress = vi.fn();
    render(<PianoKeyboard lowMidi={48} highMidi={72} onKeyPress={onKeyPress} />);
    fireEvent.pointerDown(screen.getByTestId('key-60'));
    fireEvent.pointerDown(screen.getByTestId('key-61'));
    expect(onKeyPress).toHaveBeenNthCalledWith(1, 60);
    expect(onKeyPress).toHaveBeenNthCalledWith(2, 61);
  });
});
