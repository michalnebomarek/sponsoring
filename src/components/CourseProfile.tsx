import { allLessons, course, lessonSlot } from '../course';
import { doneCount, useStore } from '../store';
import { Profile } from './Profile';
import { navigate } from '../router';

/** Profil kurzu napojený na postup. */
export function CourseProfile({ compact, clickable }: { compact?: boolean; clickable?: boolean }) {
  const s = useStore();
  const doneSlots = new Set(allLessons.filter((l) => s.done[l.id]).map(lessonSlot));
  const available = new Set(course.weeks.filter((w) => w.lessons.length).map((w) => w.n));
  return (
    <Profile
      totalWeeks={course.totalWeeks}
      doneSlots={doneSlots}
      rider={doneCount(s)}
      availableWeeks={available}
      compact={compact}
      onStage={clickable ? (n) => navigate({ name: 'week', n }) : undefined}
    />
  );
}
