import type { TemplateNote } from './types';

/** Parse a notation string such as "0 2 4:2 r 4" into template notes. */
export function parseNotation(text: string, lyrics?: string[]): TemplateNote[] {
  const tokens = text
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  const notes: TemplateNote[] = [];
  let beat = 0;
  for (const token of tokens) {
    const parts = token.split(':');
    if (parts.length > 2) throw new Error(`Invalid token "${token}": too many ":"`);
    const [offsetText, beatsText] = parts;
    let beats = 1;
    if (beatsText !== undefined) {
      if (!/^(\d+\.?\d*|\.\d+)$/.test(beatsText)) {
        throw new Error(`Invalid token "${token}": beats must be a positive number`);
      }
      beats = Number(beatsText);
      if (!(beats > 0)) throw new Error(`Invalid token "${token}": beats must be greater than 0`);
    }
    if (offsetText === 'r') {
      beat += beats;
      continue;
    }
    if (!/^-?\d+$/.test(offsetText)) {
      throw new Error(`Invalid token "${token}": offset must be an integer or "r"`);
    }
    notes.push({ offset: Number(offsetText), startBeat: beat, durationBeats: beats });
    beat += beats;
  }
  if (lyrics) {
    if (lyrics.length !== notes.length) {
      throw new Error(`Lyric count ${lyrics.length} does not match note count ${notes.length}`);
    }
    notes.forEach((n, i) => {
      n.lyric = lyrics[i];
    });
  }
  return notes;
}
