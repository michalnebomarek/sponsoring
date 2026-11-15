/** Vyhodnocení cvičení: hotovo, skóre, textové shrnutí pro Poznámky a sdílení. */
import type { Exercise, ExKroky, Lesson } from '../build/content.ts';
import type { ExAnswer, State } from './store';

export function rozradScore(ex: Extract<Exercise, { typ: 'rozrad' }>, a?: ExAnswer) {
  const picks = a?.typ === 'rozrad' ? a.picks : [];
  const correct = ex.polozky.filter((p, i) => picks[i] === p.spravne).length;
  return { correct, total: ex.polozky.length };
}

export function exDone(ex: Exercise, a?: ExAnswer): boolean {
  if (!a || a.typ !== ex.typ) return false;
  switch (ex.typ) {
    case 'rozrad':
      return a.typ === 'rozrad' && ex.polozky.every((_, i) => a.picks[i]);
    case 'volba':
      return a.typ === 'volba' && a.pick >= 0;
    case 'skala':
      return a.typ === 'skala' && ex.polozky.every((p) => a.values[p]);
    case 'odpoved':
      return a.typ === 'odpoved' && !!a.text.trim();
    case 'kroky':
      return a.typ === 'kroky' && a.done;
  }
}

/** Má cvičení nějakou odpověď, kterou stojí za to ukázat v Poznámkách? */
export function exStarted(ex: Exercise, a?: ExAnswer): boolean {
  if (!a || a.typ !== ex.typ) return false;
  switch (a.typ) {
    case 'rozrad':
      return a.picks.some(Boolean);
    case 'volba':
      return a.pick >= 0;
    case 'skala':
      return Object.keys(a.values).length > 0;
    case 'odpoved':
      return !!a.text.trim();
    case 'kroky':
      return a.answers.some((x) => x?.trim());
  }
}

export function remainingExercises(l: Lesson, s: State): number {
  return l.exercises.filter((e) => !exDone(e, s.ex[e.id])).length;
}

export function krokySummary(ex: ExKroky, a?: ExAnswer): { q: string; a: string }[] {
  const answers = a?.typ === 'kroky' ? a.answers : [];
  return ex.kroky.map((k, i) => ({ q: k.otazka, a: answers[i]?.trim() ?? '' }));
}

export function krokyText(ex: ExKroky, a?: ExAnswer): string {
  return [ex.nazev, ...krokySummary(ex, a).map((x) => `\n${x.q}\n${x.a || '–'}`)].join('\n');
}

/** Krátký nadpis cvičení (pro Poznámky). */
export function exTitle(ex: Exercise): string {
  switch (ex.typ) {
    case 'rozrad':
    case 'skala':
    case 'odpoved':
      return ex.zadani;
    case 'volba':
      return ex.otazka;
    case 'kroky':
      return ex.nazev;
  }
}

/** Odpověď jako čistý text (pro Poznámky a sdílení). */
export function exAnswerText(ex: Exercise, a?: ExAnswer): string {
  if (!a || a.typ !== ex.typ) return '';
  switch (ex.typ) {
    case 'rozrad': {
      const { correct, total } = rozradScore(ex, a);
      return `${correct} ze ${total}`;
    }
    case 'volba': {
      if (a.typ !== 'volba' || a.pick < 0) return '';
      const m = ex.moznosti[a.pick];
      return `${m?.spravne ? 'Správně' : 'Vedle'}: ${m?.text ?? ''}`;
    }
    case 'skala':
      if (a.typ !== 'skala') return '';
      return ex.polozky.map((p) => `${p}: ${a.values[p] ?? '–'}`).join('\n');
    case 'odpoved':
      return a.typ === 'odpoved' ? a.text.trim() : '';
    case 'kroky':
      return krokySummary(ex, a)
        .map((x) => `${x.q}\n${x.a || '–'}`)
        .join('\n\n');
  }
}

export function cviceni(n: number): string {
  if (n === 1) return 'Zbývá 1 cvičení';
  if (n >= 2 && n <= 4) return `Zbývají ${n} cvičení`;
  return `Zbývá ${n} cvičení`;
}
