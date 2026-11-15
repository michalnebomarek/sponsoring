/**
 * Lokální data v telefonu: postup, poznámky, nastavení, pozice čtení.
 * Ukládá se do localStorage pod jedním klíčem. Lekce jsou klíčované
 * stabilním ID (t1-l3), takže úprava textu lekce postup nesmaže.
 */
import { useEffect, useState } from 'preact/hooks';
import { course, allLessons } from './course';

export type Note = { text: string; updated: string };

/** Odpověď na cvičení, ukládaná pod jeho stabilním id. */
export type ExAnswer = (
  | { typ: 'rozrad'; picks: (string | null)[]; idx: number }
  | { typ: 'volba'; pick: number }
  | { typ: 'skala'; values: Record<string, number> }
  | { typ: 'odpoved'; text: string }
  | { typ: 'kroky'; answers: string[]; step: number; done: boolean }
) & { updated?: string };

export type State = {
  v: 1;
  /** lessonId → čas dokončení (ISO) */
  done: Record<string, string>;
  /** id pole → odpověď (starší formát „Na tvoje závody“) */
  notes: Record<string, Note>;
  /** id cvičení → odpověď */
  ex: Record<string, ExAnswer>;
  settings: { chrome: boolean };
  /** kolik týdnů aplikace znala minule – kvůli pruhu „Přibyl nový týden“ */
  knownWeeks: number;
  /** pozice čtení v lekcích: lessonId → scrollY */
  readPos: Record<string, number>;
  /** poslední obrazovka – obnoví se, když iOS aplikaci mezitím ukončí */
  last: { route: string; y: number; t: number } | null;
};

const KEY = 'etapa:v1';

function fresh(): State {
  return {
    v: 1,
    done: {},
    notes: {},
    ex: {},
    settings: { chrome: true },
    knownWeeks: course.weeks.length,
    readPos: {},
    last: null,
  };
}

function normalize(raw: unknown): State {
  const base = fresh();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<State>;
  return {
    v: 1,
    done: typeof r.done === 'object' && r.done ? { ...r.done } : {},
    notes: typeof r.notes === 'object' && r.notes ? { ...r.notes } : {},
    ex: typeof r.ex === 'object' && r.ex ? { ...r.ex } : {},
    settings: { chrome: r.settings?.chrome ?? true },
    knownWeeks: typeof r.knownWeeks === 'number' ? r.knownWeeks : base.knownWeeks,
    readPos: typeof r.readPos === 'object' && r.readPos ? { ...r.readPos } : {},
    last: r.last && typeof r.last.route === 'string' ? r.last : null,
  };
}

function load(): State {
  try {
    const s = localStorage.getItem(KEY);
    return s ? normalize(JSON.parse(s)) : fresh();
  } catch {
    return fresh();
  }
}

let state: State = load();
const subs = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* plné úložiště nebo soukromý režim – aplikace jede dál */
  }
}

export function getState(): State {
  return state;
}

export function update(fn: (s: State) => State, notify = true) {
  state = fn(state);
  persist();
  if (notify) subs.forEach((f) => f());
}

export function useStore(): State {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    subs.add(f);
    return () => void subs.delete(f);
  }, []);
  return state;
}

// ——— akce ———

export function setDone(id: string, done: boolean) {
  update((s) => {
    const d = { ...s.done };
    if (done) d[id] = new Date().toISOString();
    else delete d[id];
    return { ...s, done: d };
  });
}

export function setNote(id: string, text: string) {
  update((s) => {
    const notes = { ...s.notes };
    if (text.trim()) notes[id] = { text, updated: new Date().toISOString() };
    else delete notes[id];
    return { ...s, notes };
  }, false);
  // poznámky se píšou průběžně – překreslení ostatních obrazovek stačí odložit
  scheduleNotify();
}

let notifyTimer: number | undefined;
function scheduleNotify() {
  clearTimeout(notifyTimer);
  notifyTimer = window.setTimeout(() => subs.forEach((f) => f()), 400);
}

export function setEx(id: string, a: ExAnswer | null, notify = true) {
  update((s) => {
    const ex = { ...s.ex };
    if (a) ex[id] = { ...a, updated: new Date().toISOString() };
    else delete ex[id];
    return { ...s, ex };
  }, false);
  if (notify) subs.forEach((f) => f());
  else scheduleNotify();
}

export function setChrome(on: boolean) {
  update((s) => ({ ...s, settings: { ...s.settings, chrome: on } }));
}

export function ackWeeks() {
  update((s) => ({ ...s, knownWeeks: course.weeks.length }));
}

export function saveReadPos(lessonId: string, y: number) {
  update((s) => ({ ...s, readPos: { ...s.readPos, [lessonId]: Math.round(y) } }), false);
}

export function saveLast(route: string, y: number) {
  update((s) => ({ ...s, last: { route, y: Math.round(y), t: Date.now() } }), false);
}

// ——— záloha ———

export function exportBackup(): string {
  const { done, notes, ex, settings } = state;
  return JSON.stringify({ app: 'etapa', v: 2, exported: new Date().toISOString(), done, notes, ex, settings }, null, 2);
}

export function importBackup(json: string): { ok: true } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Soubor není platná záloha (nejde přečíst JSON).' };
  }
  const d = data as { app?: string; done?: unknown; notes?: unknown };
  if (d?.app !== 'etapa' || typeof d.done !== 'object' || typeof d.notes !== 'object') {
    return { ok: false, error: 'Tohle nevypadá jako záloha z Etapy.' };
  }
  const restored = normalize({ ...state, ...d, knownWeeks: state.knownWeeks, readPos: {}, last: null });
  update(() => restored);
  return { ok: true };
}

// ——— odvozené hodnoty ———

export function isDone(id: string): boolean {
  return !!state.done[id];
}

export function doneCount(s: State = state): number {
  return allLessons.filter((l) => s.done[l.id]).length;
}

/** Dnešní lekce = první neodškrtnutá v pořadí kurzu. */
export function todayLesson(s: State = state) {
  return allLessons.find((l) => !s.done[l.id]);
}

export function weekComplete(n: number, s: State = state): boolean {
  const w = course.weeks.find((x) => x.n === n);
  return !!w && w.lessons.length > 0 && w.lessons.every((l) => s.done[l.id]);
}

export function localDay(d: Date): string {
  const p = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * „Dny v sedle“: počet dní v řadě s alespoň jednou dokončenou lekcí.
 * Víkend sérii nepřerušuje (ale když se v sobotu jede, počítá se).
 * Dnešek bez lekce sérii ještě nepřeruší – den ještě neskončil.
 */
export function streak(s: State = state, now = new Date()): number {
  const days = new Set(Object.values(s.done).map((iso) => localDay(new Date(iso))));
  if (!days.size) return 0;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(localDay(d))) d.setDate(d.getDate() - 1);
  let count = 0;
  for (let i = 0; i < 400; i++) {
    const key = localDay(d);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    if (days.has(key)) count++;
    else if (!weekend) break;
    d.setDate(d.getDate() - 1);
  }
  return count;
}
