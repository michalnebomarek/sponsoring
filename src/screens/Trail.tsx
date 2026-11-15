import { course, weekByN } from '../course';
import { useStore, weekComplete } from '../store';
import { href } from '../router';
import { CourseProfile } from '../components/CourseProfile';
import { Jersey } from '../components/Jersey';
import { IconChevron, IconLock } from '../components/Icons';

export function Trail() {
  const s = useStore();
  const weeks = Array.from({ length: course.totalWeeks }, (_, i) => i + 1);
  const earned = weeks.filter((n) => weekComplete(n, s)).length;

  return (
    <div class="screen trail">
      <header class="page-head">
        <h1>Trasa</h1>
        <p class="lede">Osm etap, čtyřicet kilometrovníků. Klepni na etapu.</p>
      </header>

      <div class="trail-profile">
        <CourseProfile clickable />
      </div>

      <section class="jerseys" aria-label="Dresy">
        <div class="jersey-row">
          {weeks.map((n) => (
            <Jersey key={n} week={n} earned={weekComplete(n, s)} />
          ))}
        </div>
        <p class="muted small">
          {earned === 0
            ? 'Za každou dokončenou etapu dostaneš dres.'
            : `${earned} ${earned === 1 ? 'dres' : earned < 5 ? 'dresy' : 'dresů'} z osmi.`}
        </p>
      </section>

      <ol class="stage-list">
        {weeks.map((n) => {
          const w = weekByN(n);
          if (!w || !w.lessons.length) {
            return (
              <li key={n} class="stage stage--locked">
                <span class="stage-n">{n}</span>
                <span class="stage-body">
                  <span class="stage-title">Etapa {n}</span>
                  <span class="stage-meta">Připravuje se</span>
                </span>
                <span class="stage-end" aria-hidden="true">
                  <IconLock size={20} />
                </span>
              </li>
            );
          }
          const doneN = w.lessons.filter((l) => s.done[l.id]).length;
          return (
            <li key={n} class="stage">
              <a class="stage-link" href={href({ name: 'week', n })}>
                <span class={`stage-n${doneN === w.lessons.length ? ' stage-n--done' : ''}`}>{n}</span>
                <span class="stage-body">
                  <span class="stage-title">{w.title}</span>
                  <span class="stage-meta">
                    {doneN} z {w.lessons.length} hotovo
                  </span>
                </span>
                <span class="stage-end" aria-hidden="true">
                  <IconChevron size={20} />
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
