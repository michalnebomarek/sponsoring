import courseData from 'virtual:course';
import type { Course, Lesson, Week, Term } from '../build/content.ts';

export type { Course, Lesson, Week, Term, Section, Prompt, SourceLink } from '../build/content.ts';

export const course: Course = courseData;
export const LESSONS_PER_WEEK = 5;
export const TOTAL_LESSONS = course.totalWeeks * LESSONS_PER_WEEK;

/** Všechny dostupné lekce v pořadí kurzu. */
export const allLessons: Lesson[] = course.weeks.flatMap((w) => w.lessons);

export const lessonById = new Map<string, Lesson>(allLessons.map((l) => [l.id, l]));

export function weekByN(n: number): Week | undefined {
  return course.weeks.find((w) => w.n === n);
}

/** Pořadí lekce v celém kurzu (0–39) – pozice kilometrovníku na profilu. */
export function lessonSlot(l: Lesson): number {
  return (l.week - 1) * LESSONS_PER_WEEK + (l.n - 1);
}

const collator = new Intl.Collator('cs', { sensitivity: 'base' });

export const glossary: Term[] = allLessons
  .flatMap((l) => l.terms)
  .sort((a, b) => collator.compare(a.term, b.term));

export function plain(html: string): string {
  const d = document.createElement('div');
  d.innerHTML = html.replace(/<\/(p|li|h\d)>/g, '</$1>\n');
  d.querySelectorAll('svg').forEach((s) => s.remove());
  return (d.textContent ?? '').replace(/⁠/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

/** Klíče všech polí na odpověď v lekci (v pořadí). */
export function noteFields(l: Lesson): { id: string; label: string; questionHtml: string }[] {
  if (l.task) return l.task.prompts.map((p, i) => ({ id: p.id, label: `${i + 1}. ${p.title}`, questionHtml: p.html }));
  return l.sections
    .filter((s) => s.kind === 'apply' && s.noteId)
    .map((s) => ({ id: s.noteId!, label: s.title, questionHtml: s.html }));
}
