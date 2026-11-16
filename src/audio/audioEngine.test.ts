import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

interface FakeCtx {
  state: string;
  currentTime: number;
  resume: () => Promise<void>;
  suspend: () => Promise<void>;
}

function installContext(ctx: FakeCtx) {
  vi.stubGlobal('AudioContext', function () {
    return ctx;
  });
  window.AudioContext = function () {
    return ctx;
  } as unknown as typeof AudioContext;
}

describe('ensureAudioRunning', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('resolves true when the context runs and its clock advances', async () => {
    const ctx: FakeCtx = {
      state: 'suspended',
      currentTime: 0,
      resume: async () => {
        ctx.state = 'running';
      },
      suspend: async () => undefined,
    };
    installContext(ctx);
    const timer = setInterval(() => (ctx.currentTime += 0.05), 10);
    const { ensureAudioRunning } = await import('./audioEngine');
    expect(await ensureAudioRunning()).toBe(true);
    clearInterval(timer);
  });

  it('is false when resume() never settles', async () => {
    vi.useFakeTimers();
    const ctx: FakeCtx = {
      state: 'suspended',
      currentTime: 0,
      resume: () => new Promise<void>(() => undefined),
      suspend: async () => undefined,
    };
    installContext(ctx);
    const { ensureAudioRunning } = await import('./audioEngine');
    const p = ensureAudioRunning(1500);
    await vi.advanceTimersByTimeAsync(1600);
    expect(await p).toBe(false);
  });

  it('is false when resume() rejects', async () => {
    const ctx: FakeCtx = {
      state: 'suspended',
      currentTime: 0,
      resume: () => Promise.reject(new Error('nope')),
      suspend: async () => undefined,
    };
    installContext(ctx);
    const { ensureAudioRunning } = await import('./audioEngine');
    expect(await ensureAudioRunning()).toBe(false);
  });

  it('is false when the state stays suspended', async () => {
    const ctx: FakeCtx = {
      state: 'suspended',
      currentTime: 0,
      resume: async () => undefined,
      suspend: async () => undefined,
    };
    installContext(ctx);
    const { ensureAudioRunning } = await import('./audioEngine');
    expect(await ensureAudioRunning()).toBe(false);
  });

  it('is false when the context runs but the clock does not advance', async () => {
    const ctx: FakeCtx = {
      state: 'running',
      currentTime: 5,
      resume: async () => undefined,
      suspend: async () => undefined,
    };
    installContext(ctx);
    const { ensureAudioRunning } = await import('./audioEngine');
    expect(await ensureAudioRunning()).toBe(false);
  });
});

describe('watchAudioClock', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('calls onStall once when the clock freezes', async () => {
    vi.resetModules();
    vi.useFakeTimers();
    const ctx: FakeCtx = { state: 'running', currentTime: 0, resume: async () => undefined, suspend: async () => undefined };
    installContext(ctx);
    const { watchAudioClock } = await import('./audioEngine');
    const onStall = vi.fn();
    watchAudioClock(onStall);
    for (let i = 0; i < 4; i++) {
      ctx.currentTime += 0.25;
      await vi.advanceTimersByTimeAsync(250);
    }
    expect(onStall).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1500);
    expect(onStall).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(3000);
    expect(onStall).toHaveBeenCalledTimes(1);
  });

  it('stalls at once when the context is no longer running', async () => {
    vi.resetModules();
    vi.useFakeTimers();
    const ctx: FakeCtx = { state: 'running', currentTime: 0, resume: async () => undefined, suspend: async () => undefined };
    installContext(ctx);
    const { watchAudioClock } = await import('./audioEngine');
    const onStall = vi.fn();
    watchAudioClock(onStall);
    ctx.state = 'suspended';
    await vi.advanceTimersByTimeAsync(300);
    expect(onStall).toHaveBeenCalledTimes(1);
  });
});
