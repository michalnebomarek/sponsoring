import { course, noteFields, plain, type Week } from '../course';
import { useStore, type State } from '../store';
import { href } from '../router';
import { toast } from '../toast';
import { IconShare } from '../components/Icons';

function weekText(w: Week, s: State): string {
  const out: string[] = [`Týden ${w.n} – ${w.title}`];
  for (const l of w.lessons) {
    const fields = noteFields(l).filter((f) => s.notes[f.id]?.text.trim());
    if (!fields.length) continue;
    out.push('', `${l.kind === 'task' ? 'Úkol' : `Lekce ${l.n}`} – ${l.title}`);
    for (const f of fields) {
      if (l.task) out.push('', f.label);
      else out.push(`Otázka: ${plain(f.questionHtml)}`);
      out.push('', s.notes[f.id].text.trim());
    }
  }
  return out.join('\n');
}

async function share(w: Week, s: State) {
  const text = weekText(w, s);
  const title = `Etapa ${w.n} – poznámky`;
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return;
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast('Poznámky jsou ve schránce.');
  } catch {
    toast('Sdílení se nepovedlo. Zkus to znovu.');
  }
}

export function Notes() {
  const s = useStore();
  const groups = course.weeks
    .map((w) => ({
      w,
      lessons: w.lessons
        .map((l) => ({ l, fields: noteFields(l).filter((f) => s.notes[f.id]?.text.trim()) }))
        .filter((x) => x.fields.length),
    }))
    .filter((g) => g.lessons.length);

  return (
    <div class="screen notes">
      <header class="page-head">
        <h1>Poznámky</h1>
        <p class="lede">Tvoje odpovědi z částí „Na tvoje závody“.</p>
      </header>

      {!groups.length && <p class="empty">Zatím nic. Odpovědi z lekcí se objeví tady.</p>}

      {groups.map(({ w, lessons }) => (
        <section class="note-week" key={w.n} aria-labelledby={`nw-${w.n}`}>
          <div class="note-week-head">
            <h2 id={`nw-${w.n}`} class="section-title">
              <span class="eyebrow">Etapa {w.n}</span>
              {w.title}
            </h2>
            <button class="btn btn--secondary btn--small" onClick={() => share(w, s)}>
              <IconShare size={18} /> Sdílet týden
            </button>
          </div>
          {lessons.map(({ l, fields }) => (
            <article class="note-card" key={l.id}>
              <header class="note-card-head">
                <h3>
                  {l.kind === 'task' ? 'Úkol' : `Lekce ${l.n}`} · {l.title}
                </h3>
                <a class="btn-text" href={href({ name: 'lesson', id: l.id })}>
                  Upravit
                </a>
              </header>
              {fields.map((f) => (
                <div class="note-item" key={f.id}>
                  {l.task ? (
                    <p class="note-q">{f.label}</p>
                  ) : (
                    <p class="note-q">{plain(f.questionHtml)}</p>
                  )}
                  <p class="note-a">{s.notes[f.id].text}</p>
                </div>
              ))}
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
