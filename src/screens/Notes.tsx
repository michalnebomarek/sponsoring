import { course, lessonById, noteFields, plain, type Exercise, type Lesson } from '../course';
import { useStore, type State } from '../store';
import { href } from '../router';
import { toast } from '../toast';
import { IconShare } from '../components/Icons';
import { exAnswerText, exStarted, exTitle, krokySummary, rozradScore } from '../exlogic';

type Entry =
  | { kind: 'note'; id: string; q: string; a: string }
  | { kind: 'ex'; ex: Exercise };

type LessonGroup = { l: Lesson; entries: Entry[] };
type Legacy = { id: string; label: string; text: string; lessonId?: string };
type WeekGroup = { n: number; title: string; lessons: LessonGroup[]; legacy: Legacy[] };

const lessonLabel = (l: Lesson) => `${l.kind === 'task' ? 'Úkol' : `Lekce ${l.n}`} · ${l.title}`;

/** Popisek staré odpovědi podle klíče: t1-l3, t1-l3-2, t1-l5-q2. */
function legacyLabel(id: string): { label: string; week: number; lessonId?: string } {
  const m = id.match(/^t(\d+)-l(\d+)(?:-q(\d+)|-(\d+))?$/);
  if (!m) return { label: id, week: 0 };
  const lessonId = `t${m[1]}-l${m[2]}`;
  const l = lessonById.get(lessonId);
  let label = l ? `Lekce ${l.n} · ${l.title}` : `Lekce ${m[2]}`;
  if (m[3]) label += `, otázka ${m[3]}`;
  return { label, week: Number(m[1]), lessonId: l ? lessonId : undefined };
}

function collect(s: State): WeekGroup[] {
  const current = new Set<string>();
  const groups: WeekGroup[] = course.weeks.map((w) => ({
    n: w.n,
    title: w.title,
    legacy: [],
    lessons: w.lessons
      .map((l) => {
        const entries: Entry[] = [];
        for (const f of noteFields(l)) {
          current.add(f.id);
          const a = s.notes[f.id]?.text.trim();
          if (a) entries.push({ kind: 'note', id: f.id, q: l.task ? f.label : plain(f.questionHtml), a });
        }
        for (const ex of l.exercises) if (exStarted(ex, s.ex[ex.id])) entries.push({ kind: 'ex', ex });
        return { l, entries };
      })
      .filter((g) => g.entries.length),
  }));

  // starší odpovědi: klíče, ke kterým v aktuálním obsahu už žádné pole není
  for (const [id, note] of Object.entries(s.notes)) {
    if (current.has(id) || !note.text.trim()) continue;
    const { label, week, lessonId } = legacyLabel(id);
    let g = groups.find((x) => x.n === week);
    if (!g) {
      g = { n: week, title: week ? `Týden ${week}` : 'Ostatní', lessons: [], legacy: [] };
      groups.push(g);
    }
    g.legacy.push({ id, label, text: note.text.trim(), lessonId });
  }
  for (const g of groups) g.legacy.sort((a, b) => a.id.localeCompare(b.id, 'cs', { numeric: true }));
  return groups.filter((g) => g.lessons.length || g.legacy.length).sort((a, b) => a.n - b.n);
}

function weekText(g: WeekGroup, s: State): string {
  const out: string[] = [g.n ? `Týden ${g.n} – ${g.title}` : g.title];
  for (const { l, entries } of g.lessons) {
    out.push('', lessonLabel(l).replace(' · ', ' – '));
    for (const e of entries) {
      if (e.kind === 'note') out.push('', e.q, e.a);
      else out.push('', exTitle(e.ex), exAnswerText(e.ex, s.ex[e.ex.id]));
    }
  }
  if (g.legacy.length) {
    out.push('', 'Starší odpovědi');
    for (const x of g.legacy) out.push('', x.label, x.text);
  }
  return out.join('\n');
}

async function share(g: WeekGroup, s: State) {
  const text = weekText(g, s);
  const title = `Etapa ${g.n} – poznámky`;
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

function ExEntry({ ex, s }: { ex: Exercise; s: State }) {
  const a = s.ex[ex.id];
  switch (ex.typ) {
    case 'kroky':
      return (
        <div class="note-item">
          <p class="note-q note-q--title">{ex.nazev}</p>
          <dl class="summary-list summary-list--compact">
            {krokySummary(ex, a).map((x, i) => (
              <div key={i} class="summary-row">
                <dt>{x.q}</dt>
                <dd class={x.a ? '' : 'is-empty'}>{x.a || 'Bez odpovědi'}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case 'skala': {
      const values = a?.typ === 'skala' ? a.values : {};
      return (
        <div class="note-item">
          <p class="note-q">{ex.zadani}</p>
          <ul class="note-scale">
            {ex.polozky.map((p) => (
              <li key={p}>
                <span>{p}</span>
                <span class="note-scale-v">{values[p] ?? '–'}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case 'rozrad': {
      const { correct, total } = rozradScore(ex, a);
      const picked = a?.typ === 'rozrad' ? a.picks.filter(Boolean).length : 0;
      return (
        <div class="note-item">
          <p class="note-q">{ex.zadani}</p>
          <p class="note-result">
            {picked < total ? `Rozpracováno: ${picked} z ${total}` : `${correct} ze ${total}`}
          </p>
        </div>
      );
    }
    case 'volba': {
      const pick = a?.typ === 'volba' ? a.pick : -1;
      return (
        <div class="note-item">
          <p class="note-q">{ex.otazka}</p>
          <p class="note-result">{ex.moznosti[pick]?.spravne ? 'Správně' : 'Vedle, viz vysvětlení v lekci'}</p>
        </div>
      );
    }
    case 'odpoved':
      return (
        <div class="note-item">
          <p class="note-q">{ex.zadani}</p>
          <p class="note-a">{a?.typ === 'odpoved' ? a.text : ''}</p>
        </div>
      );
  }
}

export function Notes() {
  const s = useStore();
  const groups = collect(s);

  return (
    <div class="screen notes">
      <header class="page-head">
        <h1>Poznámky</h1>
        <p class="lede">Tvoje odpovědi ze cvičení, po týdnech a lekcích.</p>
      </header>

      {!groups.length && <p class="empty">Zatím nic. Odpovědi z lekcí se objeví tady.</p>}

      {groups.map((g) => (
        <section class="note-week" key={g.n} aria-labelledby={`nw-${g.n}`}>
          <div class="note-week-head">
            <h2 id={`nw-${g.n}`} class="section-title">
              <span class="eyebrow">Etapa {g.n}</span>
              {g.title}
            </h2>
            <button class="btn btn--secondary btn--small" onClick={() => share(g, s)}>
              <IconShare size={18} /> Sdílet týden
            </button>
          </div>
          {g.lessons.map(({ l, entries }) => (
            <article class="note-card" key={l.id}>
              <header class="note-card-head">
                <h3>{lessonLabel(l)}</h3>
                <a class="btn-text" href={href({ name: 'lesson', id: l.id })}>
                  Otevřít
                </a>
              </header>
              {entries.map((e) =>
                e.kind === 'note' ? (
                  <div class="note-item" key={e.id}>
                    <p class="note-q">{e.q}</p>
                    <p class="note-a">{e.a}</p>
                  </div>
                ) : (
                  <ExEntry key={e.ex.id} ex={e.ex} s={s} />
                ),
              )}
            </article>
          ))}
          {g.legacy.length > 0 && (
            <article class="note-card note-card--legacy">
              <header class="note-card-head">
                <h3>Starší odpovědi</h3>
              </header>
              <p class="muted small legacy-note">Z původní verze lekcí („Na tvoje závody“).</p>
              {g.legacy.map((x) => (
                <div class="note-item" key={x.id}>
                  <p class="note-q">{x.label}</p>
                  <p class="note-a">{x.text}</p>
                </div>
              ))}
            </article>
          )}
        </section>
      ))}
    </div>
  );
}
