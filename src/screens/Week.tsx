import { weekByN, course } from '../course';
import { useStore, weekComplete } from '../store';
import { href } from '../router';
import { Jersey } from '../components/Jersey';
import { IconBack, IconCheck, IconChevron } from '../components/Icons';

export function WeekScreen({ n }: { n: number }) {
  const s = useStore();
  const w = weekByN(n);

  if (!w || !w.lessons.length) {
    return (
      <div class="screen">
        <header class="navbar">
          <a class="icon-btn" href={href({ name: 'trail' })} aria-label="Zpět na trasu">
            <IconBack />
          </a>
        </header>
        <h1 class="week-title">Etapa {n}</h1>
        <p class="lede">Připravuje se. {n <= course.totalWeeks ? 'Objeví se tu, až bude hotová.' : ''}</p>
      </div>
    );
  }

  const anyDone = w.lessons.some((l) => s.done[l.id]);
  const complete = weekComplete(n, s);

  return (
    <div class="screen week">
      <header class="navbar">
        <a class="icon-btn" href={href({ name: 'trail' })} aria-label="Zpět na trasu">
          <IconBack />
        </a>
        <span class="eyebrow">Etapa {w.n}</span>
        <span class="navbar-end">{complete && <Jersey week={n} earned size={32} />}</span>
      </header>
      <h1 class="week-title">{w.title}</h1>

      {w.introHtml && (
        <details class="card intro" open={!anyDone}>
          <summary>{w.introTitle}</summary>
          <div class="prose" dangerouslySetInnerHTML={{ __html: w.introHtml }} />
        </details>
      )}

      <ol class="lesson-list">
        {w.lessons.map((l) => {
          const done = !!s.done[l.id];
          return (
            <li key={l.id}>
              <a class={`lesson-row${done ? ' lesson-row--done' : ''}`} href={href({ name: 'lesson', id: l.id })}>
                <span class="km-badge" aria-hidden="true">
                  {done ? <IconCheck size={18} /> : l.n}
                </span>
                <span class="lesson-row-body">
                  <span class="lesson-row-title">{l.title}</span>
                  <span class="lesson-row-meta">
                    {l.kind === 'task' ? 'Úkol' : `Lekce ${l.n}`} · ≈ {l.minutes} min{done ? ' · v cíli' : ''}
                  </span>
                </span>
                <IconChevron size={20} />
              </a>
            </li>
          );
        })}
      </ol>

      {w.extras.map((x) => (
        <section class="card" key={x.title}>
          <h2 class="card-title">{x.title}</h2>
          <div class="prose" dangerouslySetInnerHTML={{ __html: x.html }} />
        </section>
      ))}

      {w.literatureHtml && (
        <section class="literature" aria-labelledby="lit">
          <h2 id="lit" class="section-title">
            {w.literatureTitle}
          </h2>
          <div class="prose prose--lit" dangerouslySetInnerHTML={{ __html: w.literatureHtml }} />
        </section>
      )}
    </div>
  );
}
