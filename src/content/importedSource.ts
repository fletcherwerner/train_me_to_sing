import { z } from 'zod';
import { useAppStore } from '../storage/store';
import type { Lesson, LessonSource } from './types';
import type { ExerciseTemplate } from '../core/exercise/types';

const lessonSchema = z.object({
  id: z.string(),
  stage: z.literal(3),
  order: z.number(),
  title: z.string(),
  goal: z.string(),
  exercise: z.object({
    id: z.string(),
    title: z.string(),
    tempoBpm: z.number().positive(),
    beatsPerBar: z.number().int().positive(),
    notes: z
      .array(z.object({ offset: z.number(), startBeat: z.number(), durationBeats: z.number().positive(), lyric: z.string().optional() }))
      .min(1),
  }),
  toleranceId: z.string(),
  passScore: z.number(),
  source: z.literal('imported'),
});

/** Imported lessons from storage; anything that fails validation is skipped. */
export const importedSource: LessonSource = {
  list(): Lesson[] {
    const out: Lesson[] = [];
    for (const raw of useAppStore.getState().importedLessons) {
      const p = lessonSchema.safeParse(raw);
      if (p.success) out.push(p.data as Lesson);
    }
    return out;
  },
};

export function makeImportedLesson(template: ExerciseTemplate, title: string, order: number, timestamp = Date.now()): Lesson {
  const id = `imp-${timestamp}`;
  return {
    id,
    stage: 3,
    order,
    title,
    goal: `Sing "${title}" from your imported MIDI file.`,
    exercise: { ...template, id, title },
    toleranceId: 't3',
    passScore: 0.8,
    source: 'imported',
  };
}
