/**
 * Interaktivní cvičení. Všechno se ovládá klepnutím palcem, žádné přetahování.
 * Odpovědi se ukládají pod stabilním id cvičení.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import type { ExKroky, ExOdpoved, ExRozrad, ExSkala, ExVolba, Exercise } from '../course';
import { getState, setEx, useStore, type ExAnswer } from '../store';
import { krokySummary, krokyText, rozradScore } from '../exlogic';
import { toast } from '../toast';
import { reducedMotion } from '../router';
import { IconCheck } from './Icons';

// ——————————————————————————————————————————————
// Klávesnice: pole a tlačítka pod ním musí zůstat vidět.
// Na iOS klávesnice zmenší jen „visual viewport“, stránka zůstane stejně vysoká.
// ——————————————————————————————————————————————

/** Posune stránku tak, aby byl prvek celý nad klávesnicí. */
export function keepVisible(el: Element | null, margin = 12) {
  if (!el) return;
  const vv = window.visualViewport;
  const r = el.getBoundingClientRect();
  const top = (vv?.offsetTop ?? 0) + 64; // pod horní lištou
  const bottom = (vv ? vv.offsetTop + vv.height : window.innerHeight) - margin;
  if (r.bottom > bottom) window.scrollBy({ top: Math.min(r.bottom - bottom, r.top - top), behavior: 'auto' });
  else if (r.top < top) window.scrollBy({ top: r.top - top, behavior: 'auto' });
}

/** Výška a posun viditelné části obrazovky (mění se s klávesnicí). */
export function useVisualViewport() {
  const get = () => {
    const vv = window.visualViewport;
    return { height: vv?.height ?? window.innerHeight, top: vv?.offsetTop ?? 0 };
  };
  const [v, setV] = useState(get);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const on = () => setV(get());
    vv.addEventListener('resize', on);
    vv.addEventListener('scroll', on);
    return () => {
      vv.removeEventListener('resize', on);
      vv.removeEventListener('scroll', on);
    };
  }, []);
  return { ...v, keyboard: v.height < window.innerHeight - 120 };
}

/**
 * Textové pole, které roste s textem, ukládá se samo a při psaní drží
 * sebe i tlačítko „Hotovo“ nad klávesnicí.
 */
export function TextAnswer({
  id,
  initial,
  placeholder,
  label,
  onSave,
}: {
  id: string;
  initial: string;
  placeholder?: string;
  label: string;
  onSave: (text: string) => void;
}) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>(initial.trim() ? 'saved' : 'idle');
  const [focused, setFocused] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;
  // poslední hodnota pole – při zavírání lekce už pole v DOM není
  const value = useRef(initial);
  const saved = useRef(initial);

  const grow = () => {
    const el = ta.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  };
  useLayoutEffect(grow, []);

  const save = () => {
    clearTimeout(timer.current);
    const v = ta.current ? ta.current.value : value.current;
    if (v === saved.current) return;
    saved.current = v;
    saveRef.current(v);
    if (ta.current) setStatus(v.trim() ? 'saved' : 'idle');
  };

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

  // při otevřené klávesnici držet pole + „Hotovo“ v zorném poli
  useEffect(() => {
    if (!focused) return;
    const vv = window.visualViewport;
    const fit = () => keepVisible(wrap.current);
    const t = window.setTimeout(fit, 320); // po vysunutí klávesnice
    vv?.addEventListener('resize', fit);
    return () => {
      clearTimeout(t);
      vv?.removeEventListener('resize', fit);
    };
  }, [focused]);

  return (
    <div class="answer" ref={wrap}>
      <label class="sr-only" for={`ta-${id}`}>
        {label}
      </label>
      <textarea
        id={`ta-${id}`}
        ref={ta}
        class="note-input"
        rows={3}
        placeholder={placeholder || 'Tvoje odpověď…'}
        defaultValue={initial}
        enterkeyhint="done"
        onFocus={() => setFocused(true)}
        onInput={() => {
          grow();
          value.current = ta.current?.value ?? '';
          setStatus('saving');
          clearTimeout(timer.current);
          timer.current = window.setTimeout(save, 500);
          if (focused) keepVisible(wrap.current);
        }}
        onBlur={() => {
          setFocused(false);
          save();
        }}
      />
      <div class="answer-bar">
        <p class="note-status" aria-live="polite">
          {status === 'saving' ? 'Ukládám…' : status === 'saved' ? 'Uloženo' : ' '}
        </p>
        {focused && (
          <button
            class="btn btn--secondary btn--small"
            // mousedown by jinak nejdřív zrušil focus a tlačítko by zmizelo
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => ta.current?.blur()}
          >
            Hotovo
          </button>
        )}
      </div>
    </div>
  );
}

// ——————————————————————————————————————————————

function ExHead({ kind, children }: { kind: string; children: preact.ComponentChildren }) {
  return (
    <header class="ex-head">
      <span class="ex-kind">{kind}</span>
      <p class="ex-q">{children}</p>
    </header>
  );
}

// ——— rozrad: třídění do kategorií, položka po položce ———
function Rozrad({ ex, a }: { ex: ExRozrad; a?: ExAnswer }) {
  const st = a?.typ === 'rozrad' ? a : { typ: 'rozrad' as const, picks: [] as (string | null)[], idx: 0 };
  const idx = Math.min(st.idx, ex.polozky.length);
  const finished = idx >= ex.polozky.length;
  const item = ex.polozky[idx];
  const pick = item ? st.picks[idx] : null;
  const save = (next: Partial<typeof st>) => setEx(ex.id, { ...st, ...next });

  if (finished) {
    const { correct, total } = rozradScore(ex, a);
    return (
      <div class="ex ex--rozrad">
        <ExHead kind="Třídění">{ex.zadani}</ExHead>
        <div class="ex-result">
          <p class="ex-score">
            <strong>{correct}</strong> ze {total}
          </p>
          <p class="muted">
            {correct === total
              ? 'Všechno sedí.'
              : 'U položek, které nesedí, si projdi vysvětlení. Rozdíly bývají jemné.'}
          </p>
          <ul class="ex-review">
            {ex.polozky.map((p, i) => (
              <li key={i} class={st.picks[i] === p.spravne ? 'is-right' : 'is-off'}>
                <span class="ex-review-mark" aria-hidden="true">
                  {st.picks[i] === p.spravne ? <IconCheck size={16} /> : '·'}
                </span>
                <span>
                  {p.text}
                  <span class="ex-review-cat">{p.spravne}</span>
                </span>
              </li>
            ))}
          </ul>
          <button class="btn btn--secondary" onClick={() => setEx(ex.id, { typ: 'rozrad', picks: [], idx: 0 })}>
            Zkusit znovu
          </button>
        </div>
      </div>
    );
  }

  const right = pick === item.spravne;
  return (
    <div class="ex ex--rozrad">
      <ExHead kind="Třídění">{ex.zadani}</ExHead>
      <div class={`sort-card${pick ? ' is-revealed' : ''}`} key={`${idx}-${pick ? 1 : 0}`}>
        <p class="sort-count">
          {idx + 1} / {ex.polozky.length}
        </p>
        <p class="sort-text">{item.text}</p>
        {pick && (
          <div class="sort-verdict">
            <p class={`verdict ${right ? 'verdict--right' : 'verdict--off'}`}>
              {right ? (
                <>
                  <IconCheck size={18} /> Sedí.
                </>
              ) : (
                <>Patří spíš do: {item.spravne}</>
              )}
            </p>
            {item.vysvetleni && <p class="sort-why">{item.vysvetleni}</p>}
          </div>
        )}
      </div>
      <div class="sort-cats" role="group" aria-label="Kategorie">
        {ex.kategorie.map((k) => {
          const cls = !pick ? '' : k === item.spravne ? ' is-right' : k === pick ? ' is-picked' : ' is-dim';
          return (
            <button
              key={k}
              class={`choice${cls}`}
              disabled={!!pick}
              aria-pressed={pick === k}
              onClick={() => {
                const picks = [...st.picks];
                picks[idx] = k;
                save({ picks });
              }}
            >
              {k}
            </button>
          );
        })}
      </div>
      {pick && (
        <button class="btn btn--primary btn--wide" onClick={() => save({ idx: idx + 1 })}>
          {idx + 1 < ex.polozky.length ? 'Další' : 'Zobrazit výsledek'}
        </button>
      )}
    </div>
  );
}

// ——— volba: jedna správná odpověď ———
function Volba({ ex, a }: { ex: ExVolba; a?: ExAnswer }) {
  const pick = a?.typ === 'volba' ? a.pick : -1;
  const locked = pick >= 0;
  return (
    <div class="ex ex--volba">
      <ExHead kind="Otázka">{ex.otazka}</ExHead>
      <div class="options">
        {ex.moznosti.map((m, i) => {
          const chosen = pick === i;
          const cls = !locked ? '' : m.spravne ? ' is-right' : chosen ? ' is-picked' : ' is-dim';
          return (
            <button
              key={i}
              class={`option${cls}`}
              disabled={locked}
              aria-pressed={chosen}
              onClick={() => setEx(ex.id, { typ: 'volba', pick: i })}
            >
              <span class="option-text">{m.text}</span>
              {locked && (m.spravne || chosen) && (
                <span class="option-why">
                  <span class={`verdict ${m.spravne ? 'verdict--right' : 'verdict--off'}`}>
                    {m.spravne ? (
                      <>
                        <IconCheck size={16} /> {chosen ? 'Správně' : 'Správná odpověď'}
                      </>
                    ) : (
                      'Tvoje volba'
                    )}
                  </span>
                  {m.vysvetleni && <span class="option-expl">{m.vysvetleni}</span>}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {locked && (
        <button class="btn-text" onClick={() => setEx(ex.id, null)}>
          Zkusit znovu
        </button>
      )}
    </div>
  );
}

// ——— skala: 1–5 segmentovými tlačítky ———
function Skala({ ex, a }: { ex: ExSkala; a?: ExAnswer }) {
  const values = a?.typ === 'skala' ? a.values : {};
  const rated = ex.polozky.filter((p) => values[p]).length;
  return (
    <div class="ex ex--skala">
      <ExHead kind="Hodnocení">{ex.zadani}</ExHead>
      {(ex.min_popis || ex.max_popis) && (
        <p class="scale-legend">
          <span>
            <strong>1</strong> {ex.min_popis}
          </span>
          <span>
            <strong>5</strong> {ex.max_popis}
          </span>
        </p>
      )}
      <ul class="scale-list">
        {ex.polozky.map((p) => (
          <li key={p} class="scale-item">
            <p class="scale-name" id={`sk-${ex.id}-${p}`}>
              {p}
            </p>
            <div class="segments" role="radiogroup" aria-labelledby={`sk-${ex.id}-${p}`}>
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  role="radio"
                  aria-checked={values[p] === v}
                  class={`segment${values[p] === v ? ' is-on' : ''}`}
                  onClick={() => setEx(ex.id, { typ: 'skala', values: { ...values, [p]: v } })}
                >
                  {v}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <p class="note-status">
        {rated === ex.polozky.length ? 'Uloženo' : `Ohodnoceno ${rated} z ${ex.polozky.length}`}
      </p>
    </div>
  );
}

// ——— odpoved: krátký text ———
function Odpoved({ ex }: { ex: ExOdpoved }) {
  const a = getState().ex[ex.id];
  return (
    <div class="ex ex--odpoved">
      <ExHead kind="Tvoje odpověď">{ex.zadani}</ExHead>
      <TextAnswer
        id={ex.id}
        label={ex.zadani}
        initial={a?.typ === 'odpoved' ? a.text : ''}
        placeholder={ex.napoveda}
        onSave={(text) => setEx(ex.id, text.trim() ? { typ: 'odpoved', text } : null, false)}
      />
    </div>
  );
}

// ——— kroky: průvodce přes celou obrazovku ———

async function shareText(title: string, text: string) {
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
    toast('Zkopírováno do schránky.');
  } catch {
    toast('Sdílení se nepovedlo. Zkus to znovu.');
  }
}

function SummaryCard({ ex, a, onEdit }: { ex: ExKroky; a?: ExAnswer; onEdit: () => void }) {
  return (
    <div class="summary">
      <h3 class="summary-title">{ex.nazev}</h3>
      <dl class="summary-list">
        {krokySummary(ex, a).map((x, i) => (
          <div key={i} class="summary-row">
            <dt>{x.q}</dt>
            <dd class={x.a ? '' : 'is-empty'}>{x.a || 'Bez odpovědi'}</dd>
          </div>
        ))}
      </dl>
      <div class="summary-actions">
        <button class="btn btn--primary" onClick={() => shareText(ex.nazev, krokyText(ex, getState().ex[ex.id]))}>
          Sdílet
        </button>
        <button class="btn btn--secondary" onClick={onEdit}>
          Upravit
        </button>
      </div>
    </div>
  );
}

function Wizard({ ex, onClose, startAt }: { ex: ExKroky; onClose: () => void; startAt?: number }) {
  const s = useStore();
  const a = s.ex[ex.id];
  const st = a?.typ === 'kroky' ? a : { typ: 'kroky' as const, answers: [] as string[], step: 0, done: false };
  const total = ex.kroky.length;
  const [step, setStep] = useState(() => startAt ?? (st.done ? total : Math.min(st.step, total - 1)));
  const [, bump] = useState(0);
  const vv = useVisualViewport();
  const ta = useRef<HTMLTextAreaElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const k = ex.kroky[step];
  const answers = useRef<string[]>([...st.answers]);

  const persist = (patch: Partial<typeof st> = {}, notify = false) =>
    setEx(ex.id, { typ: 'kroky', answers: [...answers.current], step, done: st.done, ...patch }, notify);

  // zamknout stránku pod průvodcem
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prev;
    };
  }, []);

  // pole roste s textem; při změně kroku dostane novou hodnotu
  const grow = () => {
    const el = ta.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight + 2, 120)}px`;
  };
  useLayoutEffect(() => {
    if (ta.current && k?.typ === 'text') {
      ta.current.value = answers.current[step] ?? '';
      grow();
    }
    body.current?.scrollTo(0, 0);
  }, [step]);

  const go = (to: number) => {
    if (ta.current && k?.typ === 'text') answers.current[step] = ta.current.value;
    if (to >= total) {
      persist({ step: 0, done: true }, true);
      setStep(total);
      ta.current?.blur();
      return;
    }
    persist({ step: Math.max(0, to) });
    setStep(Math.max(0, to));
  };

  const close = () => {
    if (step < total) {
      if (ta.current && k?.typ === 'text') answers.current[step] = ta.current.value;
      persist({ step }, true);
    }
    onClose();
  };

  const progress = Math.min(step, total) / total;
  const showSummary = step >= total;
  // tlačítka nemají při stisku brát fokus z pole, jinak by klávesnice mezi kroky zajela a vyjela
  const keepFocus = (e: PointerEvent) => e.preventDefault();

  return createPortal(
    <div
      class={`wizard${vv.keyboard ? ' wizard--kb' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={ex.nazev}
      style={{ top: `${vv.top}px`, height: `${vv.height}px` }}
    >
      <header class="wizard-head">
        <div class="wizard-bar">
          <button class="icon-btn" onClick={close} aria-label="Zavřít průvodce">
            <span aria-hidden="true" class="wizard-x">
              ×
            </span>
          </button>
          <span class="eyebrow">{ex.nazev}</span>
          <span class="wizard-count">{showSummary ? 'Hotovo' : `${step + 1} / ${total}`}</span>
        </div>
        <div class="read-progress-track wizard-track" aria-hidden="true">
          <div class="read-progress-bar" style={{ transform: `scaleX(${showSummary ? 1 : progress})` }} />
          <div class="read-progress-dot" style={{ left: `calc(${(showSummary ? 1 : progress) * 100}% - 3px)` }} />
        </div>
      </header>

      <div class="wizard-body" ref={body}>
        {showSummary ? (
          <SummaryCard ex={ex} a={a} onEdit={() => go(0)} />
        ) : (
          <div class="wizard-step" key={step}>
            <h2 class="wizard-q">{k.otazka}</h2>
            {k.typ === 'volba' ? (
              <div class="options">
                {k.moznosti.map((m) => (
                  <button
                    key={m}
                    class={`option option--pick${answers.current[step] === m ? ' is-on' : ''}`}
                    aria-pressed={answers.current[step] === m}
                    onClick={() => {
                      answers.current[step] = m;
                      persist({ step });
                      bump((n) => n + 1);
                    }}
                  >
                    <span class="option-text">{m}</span>
                    {answers.current[step] === m && <IconCheck size={20} />}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )}
        {/* jedno pole pro všechny textové kroky – při přechodu zůstane klávesnice otevřená */}
        <textarea
          ref={ta}
          class="note-input wizard-input"
          style={{ display: !showSummary && k?.typ === 'text' ? 'block' : 'none' }}
          placeholder={k?.napoveda || 'Tvoje odpověď…'}
          aria-label={k?.otazka}
          onInput={() => {
            grow();
            answers.current[step] = ta.current!.value;
            persist({ step });
          }}
        />
      </div>

      <footer class="wizard-foot">
        {showSummary ? (
          <button class="btn btn--secondary btn--wide" onClick={onClose}>
            Zavřít
          </button>
        ) : (
          <>
            <button class="btn btn--secondary" onPointerDown={keepFocus} onClick={() => go(step - 1)} disabled={step === 0}>
              Zpět
            </button>
            <button class="btn btn--primary" onPointerDown={keepFocus} onClick={() => go(step + 1)}>
              {step + 1 < total ? 'Další' : 'Dokončit'}
            </button>
          </>
        )}
      </footer>
    </div>,
    document.body,
  );
}

function Kroky({ ex, a }: { ex: ExKroky; a?: ExAnswer }) {
  const [open, setOpen] = useState<false | { at?: number }>(false);
  const st = a?.typ === 'kroky' ? a : undefined;
  const started = !!st && st.answers.some((x) => x?.trim());
  const reopen = () => setOpen({ at: 0 }); // „Upravit“ → první krok
  return (
    <div class="ex ex--kroky">
      {st?.done ? (
        <SummaryCard ex={ex} a={a} onEdit={reopen} />
      ) : (
        <div class="kroky-start">
          <span class="ex-kind">Průvodce</span>
          <h3 class="kroky-title">{ex.nazev}</h3>
          <p class="muted">
            {ex.kroky.length} {ex.kroky.length < 5 ? 'otázky' : 'otázek'}, jedna na obrazovku. Odpovědi se průběžně
            ukládají.
          </p>
          <button class="btn btn--primary btn--wide" onClick={() => setOpen({})}>
            {started ? `Pokračovat (krok ${(st?.step ?? 0) + 1} z ${ex.kroky.length})` : 'Začít'}
          </button>
        </div>
      )}
      {open && <Wizard ex={ex} startAt={open.at} onClose={() => setOpen(false)} />}
    </div>
  );
}

export function ExerciseView({ ex }: { ex: Exercise }) {
  const s = useStore();
  const a = s.ex[ex.id];
  return (
    <section class="ex-wrap" id={`ex-${ex.id}`} data-ex={ex.typ}>
      {ex.typ === 'rozrad' && <Rozrad ex={ex} a={a} />}
      {ex.typ === 'volba' && <Volba ex={ex} a={a} />}
      {ex.typ === 'skala' && <Skala ex={ex} a={a} />}
      {ex.typ === 'odpoved' && <Odpoved ex={ex} />}
      {ex.typ === 'kroky' && <Kroky ex={ex} a={a} />}
    </section>
  );
}

export { reducedMotion };
