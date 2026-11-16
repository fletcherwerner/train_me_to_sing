/** Fixed wording for audio and microphone problems (E13 A2/A3). Tests match these strings. */
export const SOUND_PAUSED_MSG = 'Sound is paused on this device. Check your headphones, then tap Try again.';
export const SOUND_STOPPED_MSG = 'The sound stopped. Check your headphones and microphone, then tap Try again.';
export const MIC_MISSING_MSG =
  'No microphone was found. Plug one in or check your sound settings, then press Start again.';
export const MIC_LOST_MSG = 'The microphone disconnected. Reconnect it, then tap Reconnect microphone.';

/** True when an error thrown by a pitch source's start() means there is no microphone. */
export function isMicMissing(err: unknown): boolean {
  return err instanceof Error && err.message === 'mic-missing';
}
