import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { allLessons, lessonById, TOTAL_LESSONS, weekByN, type Lesson } from '../course';
import { doneCount, setDone, setNote, useStore, weekComplete, getState } from '../store';
import type { Part } from '../course';
import { TextAnswer, ExerciseView } from '../components/Exercises';
import { remainingExercises, cviceni } from '../exlogic';
import { href, reducedMotion } from '../router';
import { toast } from '../toast';
import { CourseProfile } from '../components/CourseProfile';
import { Jersey } from '../components/Jersey';
import { IconBack, IconCheck, IconUp } from '../components/Icons';
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

/** Pole na odpověď ve starém formátu („Na tvoje závody“, otázky úkolu). */
function NoteField({ id, label }: { id: string; label: string }) {
  return (
    <TextAnswer id={id} label={label} initial={getState().notes[id]?.text ?? ''} onSave={(t) => setNote(id, t)} />
  );
}

function Html({ html, class: cls = 'prose' }: { html: string; class?: string }) {
  if (!html) return null;
  return <div class={cls} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Obsah složený z textu a cvičení. */
function Parts({ parts, class: cls = 'prose' }: { parts: Part[]; class?: string }) {
  return (
    <>
      {parts.map((p, i) =>
        p.t === 'html' ? <Html key={i} html={p.html} class={cls} /> : <ExerciseView key={p.ex.id} ex={p.ex} />,
      )}
    </>
  );
}

const CHIP_LABEL: Record<string, string> = {
  vyklad: 'Výklad',
  pripady: 'Případy',
  'v-praxi': 'V praxi',
  'primarni-zdroj': 'Zdroj',
  cviceni: 'Cvičení',
  pojmy: 'Pojmy',
};

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
}

/** Štítky pod nadpisem: skok na sekce, které lekce opravdu má. */
function SectionChips({ lesson }: { lesson: Lesson }) {
  const chips = lesson.sections
    .filter((s) => s.anchor)
    .map((s) => {
      let label = CHIP_LABEL[s.anchor!] ?? s.title;
      if (s.anchor === 'vyklad' && /^teorie/i.test(s.title)) label = 'Teorie';
      if (s.anchor === 'pripady' && lesson.sections.filter((x) => x.kind === 'case').length === 1) label = 'Případ';
      return { id: s.anchor!, label };
    });
  if (chips.length < 2) return null;
  return (
    <nav class="chips" aria-label="Části lekce">
      {chips.map((c) => (
        <button key={c.id} class="chip" onClick={() => scrollToId(c.id)}>
          {c.label}
        </button>
      ))}
    </nav>
  );
}

/** Nenápadné tlačítko „nahoru“, když je čtenář hlouběji v lekci. */
function ToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let raf = 0;
    const upd = () => {
      raf = 0;
      const typing = document.activeElement instanceof HTMLTextAreaElement || document.activeElement instanceof HTMLInputElement;
      // u konce lekce by zakrývalo tlačítko „Dojel jsem do cíle“
      const nearEnd = window.scrollY + window.innerHeight > document.documentElement.scrollHeight - 260;
      setShow(window.scrollY > 900 && !typing && !nearEnd);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(upd);
    };
    window.addEventListener('scroll', on, { passive: true });
    document.addEventListener('focusin', on);
    document.addEventListener('focusout', on);
    return () => {
      window.removeEventListener('scroll', on);
      document.removeEventListener('focusin', on);
      document.removeEventListener('focusout', on);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <button
      class={`to-top${show ? ' is-on' : ''}`}
      aria-label="Nahoru"
      tabIndex={show ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })}
    >
      <IconUp size={20} />
    </button>
  );
}

function Sections({ lesson }: { lesson: Lesson }) {
  return (
    <>
      {lesson.sections.map((sec, i) => {
        const id = sec.anchor;
        if (sec.kind === 'apply') {
          return (
            <section key={i} class="apply" aria-labelledby={`sec-${i}`}>
              <h2 id={`sec-${i}`} class="section-title">
                {sec.title}
              </h2>
              <Parts parts={sec.parts} />
              <NoteField id={sec.noteId!} label={sec.title} />
            </section>
          );
        }
        if (sec.kind === 'terms') {
          return (
            <section key={i} class="terms" id={id ?? undefined} aria-labelledby={`sec-${i}`}>
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
              <Parts parts={sec.parts} />
            </section>
          );
        }
        return (
          <section key={i} class={`sec sec--${sec.kind}`} id={id ?? undefined} aria-labelledby={`sec-${i}`}>
            <h2 id={`sec-${i}`} class="section-title">
              {sec.title}
            </h2>
            <Parts parts={sec.parts} />
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
  const left = remainingExercises(lesson, s);

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
        <>
          {left > 0 && <p class="finish-left">{cviceni(left)}. Dokončit lekci můžeš i tak.</p>}
        <button class="btn btn--primary btn--big" onClick={finish}>
          Dojel jsem do cíle
        </button>
        </>
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
          Etapa {week.n} · {lesson.kind === 'task' ? 'Úkol' : `Lekce ${lesson.n}`} · ≈ {lesson.minutes} min
        </span>
        <span class="navbar-end" />
      </header>
      <article class="lesson-body">
        <h1 class="lesson-title">{lesson.title}</h1>
        <SectionChips lesson={lesson} />
        <Parts parts={lesson.leadParts} class={lesson.sections.length ? 'prose lead' : 'prose'} />
        {lesson.task ? <Task lesson={lesson} /> : <Sections lesson={lesson} />}
        <Sources lesson={lesson} />
      </article>
      <Finish lesson={lesson} />
      <ToTop />
    </div>
  );
}
