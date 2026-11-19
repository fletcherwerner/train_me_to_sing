import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../storage/store';
import { getAllLessons } from '../../content/registry';
import { nextLessonAfter } from '../../core/progress/next';
import type { Lesson } from '../../content/types';

/** The lesson to offer after `currentId`, or null when there is none. Uses the same rule as Home's "Next" tag. */
export function useNextLesson(
  currentId: string,
  range: { lowMidi: number; highMidi: number },
): Lesson | null {
  const progress = useAppStore((s) => s.progress);
  const imported = useAppStore((s) => s.importedLessons);
  void imported; // the catalog changes when songs are added or removed
  return nextLessonAfter(getAllLessons(), progress, currentId, range);
}

/** "Next lesson: title". The primary button after a lesson is passed. */
export function NextLessonLink({ lesson }: { lesson: Lesson }) {
  const { search } = useLocation();
  return (
    <Link
      className="btn btn--primary"
      data-testid="next-lesson"
      to={{ pathname: `/lesson/${lesson.id}`, search }}
    >
      Next lesson: {lesson.title}
    </Link>
  );
}

/** "Back to lessons": Home, keeping the query string. Primary only when nothing else follows. */
export function BackToLessonsLink({ primary }: { primary?: boolean }) {
  const { search } = useLocation();
  return (
    <Link
      className={primary ? 'btn btn--primary' : 'btn'}
      data-testid="back-to-lessons"
      to={{ pathname: '/', search }}
    >
      Back to lessons
    </Link>
  );
}
