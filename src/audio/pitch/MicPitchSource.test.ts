import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMicPitchSource } from './MicPitchSource';

function failWith(name: string) {
  const err = new Error('boom');
  err.name = name;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn().mockRejectedValue(err) },
  });
}

// getAudioContext() is only reached after a successful getUserMedia, so these tests never build one.
describe('MicPitchSource start() errors', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('maps NotAllowedError to mic-denied', async () => {
    failWith('NotAllowedError');
    await expect(createMicPitchSource().start()).rejects.toThrow('mic-denied');
  });

  it('maps NotFoundError and OverconstrainedError to mic-missing', async () => {
    failWith('NotFoundError');
    await expect(createMicPitchSource().start()).rejects.toThrow('mic-missing');
    failWith('OverconstrainedError');
    await expect(createMicPitchSource().start()).rejects.toThrow('mic-missing');
  });

  it('rethrows anything else unchanged', async () => {
    failWith('AbortError');
    await expect(createMicPitchSource().start()).rejects.toThrow('boom');
  });
});
