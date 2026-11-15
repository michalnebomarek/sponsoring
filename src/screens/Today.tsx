import { TOTAL_LESSONS, weekByN, course } from '../course';
import { doneCount, streak, todayLesson, useStore } from '../store';
import { href } from '../router';
import { CourseProfile } from '../components/CourseProfile';
import { IconSettings } from '../components/Icons';

function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h >= 4 && h < 10) return 'Dobré ráno, Michale';
  if (h >= 10 && h < 12) return 'Dobré dopoledne, Michale';
  if (h >= 12 && h < 18) return 'Dobré odpoledne, Michale';
  if (h >= 18 && h < 23) return 'Dobrý večer, Michale';
  return 'Dobrou noc, Michale';
}

function today(d = new Date()): string {
  const s = d.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function dny(n: number): string {
  if (n === 1) return 'den';
  if (n >= 2 && n <= 4) return 'dny';
  return 'dní';
}

export function lekci(n: number): string {
  if (n === 1) return 'lekce';
  if (n >= 2 && n <= 4) return 'lekce';
  return 'lekcí';
}

export function Today() {
  const s = useStore();
  const lesson = todayLesson(s);
  const done = doneCount(s);
  const days = streak(s);
  const week = lesson ? weekByN(lesson.week) : undefined;
  const nextLocked = course.weeks.length < course.totalWeeks ? course.weeks.length + 1 : null;

  return (
    <div class="screen today">
      <header class="topbar">
        <span class="eyebrow">{today()}</span>
        <a class="icon-btn" href={href({ name: 'settings' })} aria-label="Nastavení">
          <IconSettings />
        </a>
      </header>
      <h1 class="greeting">{greeting()}</h1>

      <a class="today-profile" href={href({ name: 'trail' })} aria-label="Otevřít trasu">
        <CourseProfile compact />
      </a>
      <p class="stats">
        <span>
          <strong class="num">{done}</strong> z {TOTAL_LESSONS} {lekci(TOTAL_LESSONS)} hotovo
        </span>
        <span aria-hidden="true">·</span>
        <span>
          <strong class="num">{days}</strong> {dny(days)} v sedle
        </span>
      </p>

      <div class="spacer" />

      {lesson && week ? (
        <section class="today-card" aria-labelledby="today-title">
          <p class="eyebrow">
            Etapa {week.n} · {lesson.kind === 'task' ? 'Úkol' : `Lekce ${lesson.n}`}
          </p>
          <h2 id="today-title" class="today-title">
            {lesson.title}
          </h2>
          <p class="today-line">
            {lesson.kind === 'task'
              ? `Dnes tě čeká úkol na tvoje závody. ≈ ${lesson.minutes} min.`
              : `Dnes tě čeká lekce ${lesson.n}. ≈ ${lesson.minutes} min.`}
          </p>
          <a class="btn btn--primary btn--big" href={href({ name: 'lesson', id: lesson.id })}>
            Začít
          </a>
        </section>
      ) : (
        <section class="today-card">
          <p class="eyebrow">Všechno projeté</p>
          <h2 class="today-title">
            {nextLocked ? `Etapa ${nextLocked} se připravuje.` : 'Dojel jsi celý závod.'}
          </h2>
          <p class="today-line">
            {nextLocked
              ? 'Mezitím si můžeš projít poznámky nebo slovníček.'
              : 'Všech osm etap máš za sebou.'}
          </p>
          <a class="btn btn--secondary btn--big" href={href({ name: 'notes' })}>
            Otevřít poznámky
          </a>
        </section>
      )}
    </div>
  );
}
