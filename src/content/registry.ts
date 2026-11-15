import { stage1Lessons } from './builtin/stage1';
import type { Lesson, LessonSource } from './types';

const sources: LessonSource[] = [];

export function registerSource(source: LessonSource): void {
  if (!sources.includes(source)) sources.push(source);
}

export function getAllLessons(): Lesson[] {
  const byId = new Map<string, Lesson>();
  for (const s of sources) for (const l of s.list()) if (!byId.has(l.id)) byId.set(l.id, l);
  return [...byId.values()].sort((a, b) => a.stage - b.stage || a.order - b.order);
}

export function getLesson(id: string): Lesson | undefined {
  return getAllLessons().find((l) => l.id === id);
}

registerSource({ list: () => stage1Lessons });
