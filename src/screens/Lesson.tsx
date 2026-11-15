import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { allLessons, lessonById, TOTAL_LESSONS, weekByN, type Lesson } from '../course';
import { doneCount, setDone, setNote, useStore, weekComplete, getState } from '../store';
import { href, reducedMotion } from '../router';
import { toast } from '../toast';
import { CourseProfile } from '../components/CourseProfile';
import { Jersey } from '../components/Jersey';
import { IconBack, IconCheck } from '../components/Icons';
import { lekci } from './Today';

/** Tenký ukazatel postupu čtení ve stylu čáry trasy. Mění jen transform. */
function ReadProgress() {
  const bar = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const upd = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      if (dot.current) dot.current.style.transform = `translateX(${p * (dot.current.parentElement!.clientWidth - 6)}px)`;
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(upd);
    };
    upd();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div class="read-progress" aria-hidden="true">
      <div class="read-progress-track">
        <div class="read-progress-bar" ref={bar} />
        <div class="read-progress-dot" ref={dot} />
      </div>
    </div>
  );
}

function NoteField({ id, label }: { id: string; label: string }) {
  const initial = getState().notes[id]?.text ?? '';
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>(initial ? 'saved' : 'idle');
  const ta = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<number | undefined>(undefined);

  const grow = () => {
    const el = ta.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  };
  useLayoutEffect(grow, []);

  const save = () => {
    clearTimeout(timer.current);
    if (ta.current) setNote(id, ta.current.value);
    setStatus(ta.current?.value.trim() ? 'saved' : 'idle');
  };
  // uložit i při odchodu ze stránky
  useEffect(() => {
    const on = () => save();
    window.addEventListener('pagehide', on);
    document.addEventListener('visibilitychange', on);
    return () => {
      save();
      window.removeEventListener('pagehide', on);
      document.removeEventListener('visibilitychange', on);
    };
  }, []);

  return (
    <div class="note">
      <label class="sr-only" for={`note-${id}`}>
        {label}
      </label>
      <textarea
        id={`note-${id}`}
        ref={ta}
        class="note-input"
        rows={4}
        placeholder="Tvoje odpověď…"
        defaultValue={initial}
        onInput={() => {
          grow();
          setStatus('saving');
          clearTimeout(timer.current);
          timer.current = window.setTimeout(save, 500);
        }}
        onBlur={save}
      />
      <p class="note-status" aria-live="polite">
        {status === 'saving' ? 'Ukládám…' : status === 'saved' ? 'Uloženo. Najdeš to i v Poznámkách.' : ' '}
      </p>
    </div>
  );
}

function Html({ html, class: cls = 'prose' }: { html: string; class?: string }) {
  if (!html) return null;
  return <div class={cls} dangerouslySetInnerHTML={{ __html: html }} />;
}

function Sections({ lesson }: { lesson: Lesson }) {
  return (
    <>
      {lesson.sections.map((sec, i) => {
        if (sec.kind === 'apply') {
          return (
            <section key={i} class="apply" aria-labelledby={`sec-${i}`}>
              <h2 id={`sec-${i}`} class="section-title">
                {sec.title}
              </h2>
              <Html html={sec.html} />
              <NoteField id={sec.noteId!} label={sec.title} />
            </section>
          );
        }
        if (sec.kind === 'terms') {
          return (
            <section key={i} class="terms" id="pojmy" aria-labelledby={`sec-${i}`}>
              <h2 id={`sec-${i}`} class="section-title">
                {sec.title}
              </h2>
              {lesson.terms.length > 0 && (
                <dl class="term-list">
                  {lesson.terms.map((t) => (
                    <div class="term" key={t.term}>
                      <dt>{t.term}</dt>
                      <dd dangerouslySetInnerHTML={{ __html: t.html }} />
                    </div>
                  ))}
                </dl>
              )}
              <Html html={sec.html} />
            </section>
          );
        }
        return (
          <section key={i} class={`sec sec--${sec.kind}`} aria-labelledby={`sec-${i}`}>
            <h2 id={`sec-${i}`} class="section-title">
              {sec.title}
            </h2>
            <Html html={sec.html} />
          </section>
        );
      })}
    </>
  );
}

function Task({ lesson }: { lesson: Lesson }) {
  const t = lesson.task!;
  return (
    <>
      <Html html={t.beforeHtml} />
      <ol class="prompts">
        {t.prompts.map((p, i) => (
          <li key={p.id} class="prompt">
            <span class="prompt-n" aria-hidden="true">
              {i + 1}
            </span>
            <div class="prompt-body">
              <Html html={p.html} />
              <NoteField id={p.id} label={p.title} />
            </div>
          </li>
        ))}
      </ol>
      <Html html={t.afterHtml} />
    </>
  );
}

function Sources({ lesson }: { lesson: Lesson }) {
  if (!lesson.links.length) return null;
  return (
    <section class="sources" aria-labelledby="zdroje">
      <h2 id="zdroje" class="section-title">
        Zdroje této lekce
      </h2>
      <ol class="source-list">
        {lesson.links.map((l) => (
          <li key={l.href}>
            <a class="source ext" href={l.href} target="_blank" rel="noopener noreferrer">
              <span class="source-text">{l.text}</span>
              <span class="source-domain">
                {l.domain}
                <svg class="ext-ico" viewBox="0 0 12 12" aria-hidden="true">
                  <path
                    d="M4 2.5h5.5V8M9.5 2.5 3 9"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Finish({ lesson }: { lesson: Lesson }) {
  const s = useStore();
  const done = !!s.done[lesson.id];
  const [flag, setFlag] = useState(0);
  const count = doneCount(s);
  const idx = allLessons.findIndex((l) => l.id === lesson.id);
  const next = allLessons[idx + 1];
  const weekDone = weekComplete(lesson.week, s);

  const finish = () => {
    const wasComplete = weekComplete(lesson.week);
    setDone(lesson.id, true);
    if (!reducedMotion()) setFlag((f) => f + 1);
    if (!wasComplete && weekComplete(lesson.week)) {
      window.setTimeout(() => toast(`Etapa ${lesson.week} dokončená. Dres je tvůj.`), reducedMotion() ? 0 : 650);
    }
  };

  return (
    <section class="finish" aria-label="Cíl lekce">
      <div class="finish-profile">
        <CourseProfile compact />
      </div>
      <p class="finish-count">
        <strong class="num bump" key={count}>
          {count}
        </strong>{' '}
        z {TOTAL_LESSONS} {lekci(TOTAL_LESSONS)} hotovo
        {weekDone && (
          <span class="finish-jersey">
            <Jersey week={lesson.week} earned size={28} />
          </span>
        )}
      </p>
      {done ? (
        <>
          <div class={`btn btn--done btn--big${flag ? ' flagging' : ''}`} key={`d${flag}`} role="status">
            <IconCheck size={22} /> V cíli
          </div>
          <div class="finish-actions">
            <button class="btn-text" onClick={() => setDone(lesson.id, false)}>
              Vrátit odškrtnutí
            </button>
            {next && (
              <a class="btn btn--secondary" href={href({ name: 'lesson', id: next.id })}>
                Další lekce
              </a>
            )}
          </div>
        </>
      ) : (
        <button class="btn btn--primary btn--big" onClick={finish}>
          Dojel jsem do cíle
        </button>
      )}
    </section>
  );
}

export function LessonScreen({ id, anchor }: { id: string; anchor?: string }) {
  const lesson = lessonById.get(id);

  useLayoutEffect(() => {
    if (anchor) {
      const el = document.getElementById(anchor);
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 72);
    }
  }, [id, anchor]);

  if (!lesson) {
    return (
      <div class="screen">
        <header class="navbar">
          <a class="icon-btn" href={href({ name: 'trail' })} aria-label="Zpět">
            <IconBack />
          </a>
        </header>
        <h1 class="week-title">Tahle lekce tu není</h1>
        <p class="lede">Možná byla přejmenovaná. Zkus ji najít na Trase.</p>
      </div>
    );
  }
  const week = weekByN(lesson.week)!;

  return (
    <div class="screen lesson">
      <ReadProgress />
      <header class="navbar">
        <a class="icon-btn" href={href({ name: 'week', n: lesson.week })} aria-label={`Zpět na etapu ${week.n}`}>
          <IconBack />
        </a>
        <span class="eyebrow">
          Etapa {week.n} · {lesson.kind === 'task' ? 'Úkol' : `Lekce ${lesson.n}`} · 30 min
        </span>
        <span class="navbar-end" />
      </header>
      <article class="lesson-body">
        <h1 class="lesson-title">{lesson.title}</h1>
        <Html html={lesson.leadHtml} class="prose lead" />
        {lesson.task ? <Task lesson={lesson} /> : <Sections lesson={lesson} />}
        <Sources lesson={lesson} />
      </article>
      <Finish lesson={lesson} />
    </div>
  );
}
