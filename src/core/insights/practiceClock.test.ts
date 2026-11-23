import { describe, expect, it } from 'vitest';
import { createPracticeClock } from './practiceClock';

function setup() {
  const saved: number[] = [];
  const clock = createPracticeClock((s) => saved.push(s));
  return { clock, saved };
}

describe('practice clock', () => {
  it('counts a run in progress and saves it when the run ends', () => {
    const { clock, saved } = setup();
    clock.open(0);
    clock.setRunning(true, 0);
    clock.setRunning(false, 40);
    clock.flush(40, true);
    expect(saved).toEqual([40]);
  });
  it('saves in chunks of at least 15 s while ticking, and everything on a forced flush', () => {
    const { clock, saved } = setup();
    clock.open(0);
    clock.setRunning(true, 0);
    clock.flush(10, false);
    expect(saved).toEqual([]);
    clock.flush(16, false);
    expect(saved).toEqual([16]);
    clock.flush(20, true);
    expect(saved).toEqual([16, 4]);
  });
  it('stops counting 2 minutes after the last input when no run is in progress', () => {
    const { clock, saved } = setup();
    clock.open(0);
    clock.flush(600, true);
    expect(saved).toEqual([120]);
  });
  it('input restarts the idle window', () => {
    const { clock, saved } = setup();
    clock.open(0);
    clock.input(100);
    clock.flush(400, true);
    expect(saved).toEqual([220]);
  });
  it('does not count while the page is hidden, and saves on hiding', () => {
    const { clock, saved } = setup();
    clock.open(0);
    clock.setRunning(true, 0);
    clock.setVisible(false, 30);
    expect(saved).toEqual([30]);
    clock.setVisible(true, 500);
    clock.flush(510, true);
    expect(saved).toEqual([30, 10]);
  });
  it('does not count with no screen open, and saves on leaving', () => {
    const { clock, saved } = setup();
    clock.flush(50, true);
    expect(saved).toEqual([]);
    clock.open(100);
    clock.setRunning(true, 100);
    clock.close(130);
    expect(saved).toEqual([30]);
    clock.flush(500, true);
    expect(saved).toEqual([30]);
  });
});
