/**
 * Převod souborů content/tyden-N.md na data pro aplikaci.
 * Běží jen při buildu (ve Vite pluginu), do prohlížeče jde hotový JSON.
 *
 * Parser je záměrně tolerantní: chybějící nebo navíc přidané podsekce
 * nevyhodí chybu, jen se zobrazí jako obecný blok textu.
 * Tvrdé kontroly (build selže) jsou dvě:
 *  - počet odkazů – žádný se nesmí ztratit,
 *  - bloky ```cviceni – musí mít platnou strukturu a jedinečné id.
 */
import MarkdownIt from 'markdown-it';
import { load as yamlLoad } from 'js-yaml';
import type { Token } from 'markdown-it';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export type SourceLink = { href: string; text: string; domain: string };

export type SectionKind = 'theory' | 'case' | 'primary' | 'exercises' | 'apply' | 'terms' | 'other';

// ——— cvičení ———
export type ExRozrad = {
  typ: 'rozrad';
  id: string;
  zadani: string;
  kategorie: string[];
  polozky: { text: string; spravne: string; vysvetleni: string }[];
};
export type ExVolba = {
  typ: 'volba';
  id: string;
  otazka: string;
  moznosti: { text: string; spravne: boolean; vysvetleni: string }[];
};
export type ExSkala = {
  typ: 'skala';
  id: string;
  zadani: string;
  min_popis: string;
  max_popis: string;
  polozky: string[];
};
export type ExOdpoved = { typ: 'odpoved'; id: string; zadani: string; napoveda: string };
export type ExKrok = { otazka: string; typ: 'text' | 'volba'; napoveda: string; moznosti: string[] };
export type ExKroky = { typ: 'kroky'; id: string; nazev: string; kroky: ExKrok[] };
export type Exercise = ExRozrad | ExVolba | ExSkala | ExOdpoved | ExKroky;

/** Kus obsahu: buď vykreslený Markdown, nebo cvičení. */
export type Part = { t: 'html'; html: string } | { t: 'ex'; ex: Exercise };

export type Section = {
  kind: SectionKind;
  title: string;
  /** kotva pro navigační štítky (vyklad, pripady, …) */
  anchor?: string;
  parts: Part[];
  /** Jen u kind === 'apply': klíč, pod kterým se ukládá odpověď. */
  noteId?: string;
};

export type Term = { term: string; html: string; lessonId: string };

export type Prompt = { id: string; title: string; html: string };

export type Lesson = {
  id: string;
  week: number;
  n: number;
  title: string;
  kind: 'lesson' | 'task';
  /** odhad času v minutách (zaokrouhleno na 5) */
  minutes: number;
  leadParts: Part[];
  /** všechna cvičení lekce v pořadí */
  exercises: Exercise[];
  sections: Section[];
  /** Jen u úkolu: text před seznamem otázek, otázky s polem na odpověď, text po nich. */
  task?: { beforeHtml: string; prompts: Prompt[]; afterHtml: string };
  terms: Term[];
  links: SourceLink[];
};

export type Week = {
  n: number;
  title: string;
  introTitle: string;
  introHtml: string;
  lessons: Lesson[];
  literatureTitle: string;
  literatureHtml: string;
  extras: { title: string; html: string }[];
};

export type Course = { totalWeeks: number; weeks: Week[] };

const DASH = '[–—-]';

const md = new MarkdownIt({ html: false, linkify: false, typographer: false });

const EXT_ICON =
  '<svg class="ext-ico" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M4 2.5h5.5V8M9.5 2.5 3 9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

md.renderer.rules.link_open = (tokens, idx, options, _env, self) => {
  const t = tokens[idx];
  const href = String(t.attrGet('href') ?? '');
  if (/^https?:/i.test(href)) {
    t.attrSet('class', 'ext');
    t.attrSet('target', '_blank');
    t.attrSet('rel', 'noopener noreferrer');
    t.attrSet('data-domain', domainOf(href));
  }
  return self.renderToken(tokens, idx, options);
};
md.renderer.rules.link_close = (tokens, idx) => {
  // najdi odpovídající link_open, ať víme, jestli jde o externí odkaz
  for (let i = idx - 1; i >= 0; i--) {
    if (tokens[i].type === 'link_open') {
      const ext = /^https?:/i.test(String(tokens[i].attrGet('href') ?? ''));
      // \u2060 (word joiner) drží ikonu na stejném řádku jako poslední slovo
      return ext ? `\u2060<span class="ext-ico-wrap">${EXT_ICON}</span></a>` : '</a>';
    }
  }
  return '</a>';
};

export function domainOf(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return href;
  }
}

/** Projde tokeny (i vnořené) a posbírá odkazy v pořadí výskytu. */
function collectLinks(tokens: Token[], out: SourceLink[]) {
  for (const t of tokens) {
    if (t.children) {
      const ch = t.children;
      for (let i = 0; i < ch.length; i++) {
        if (ch[i].type !== 'link_open') continue;
        const href = String(ch[i].attrGet('href') ?? '');
        let text = '';
        for (let j = i + 1; j < ch.length && ch[j].type !== 'link_close'; j++) {
          if (ch[j].type === 'text' || ch[j].type === 'code_inline') text += ch[j].content;
        }
        if (/^https?:/i.test(href)) out.push({ href, text: text.trim() || domainOf(href), domain: domainOf(href) });
      }
    }
  }
}

// ——— kontext pro srozumitelné chybové hlášky ———
let where = { file: '', lesson: '' };
let usedIds = new Map<string, string>();

class ContentError extends Error {}

function fail(id: string, msg: string): never {
  const at = [where.file, where.lesson, id].filter(Boolean).join(' › ');
  throw new ContentError(`Chyba ve cvičení: ${at}: ${msg}`);
}

function text(o: Record<string, unknown>, key: string, id: string, label = key, optional = false): string {
  const v = o[key];
  if (v === undefined || v === null || v === '') {
    if (optional) return '';
    fail(id, `chybí pole „${label}“.`);
  }
  if (typeof v === 'string' || typeof v === 'number') return String(v).trim();
  fail(id, `pole „${label}“ má být text.`);
}

function list(o: Record<string, unknown>, key: string, id: string, min = 1): unknown[] {
  const v = o[key];
  if (v === undefined || v === null) fail(id, `chybí seznam „${key}“.`);
  if (!Array.isArray(v)) fail(id, `„${key}“ má být seznam (položky začínající pomlčkou nebo [a, b]).`);
  if (v.length < min) fail(id, `„${key}“ musí mít aspoň ${min} ${min === 1 ? 'položku' : 'položky'}.`);
  return v;
}

function obj(v: unknown, id: string, label: string): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) fail(id, `${label} má mít tvar „klíč: hodnota“.`);
  return v as Record<string, unknown>;
}

const TYPES = ['rozrad', 'volba', 'skala', 'odpoved', 'kroky'] as const;

const TEXT_KEYS = 'text|vysvetleni|zadani|otazka|napoveda|nazev|min_popis|max_popis|spravne';

/**
 * V českém textu bývá dvojtečka („limity: jeden turnaj“), kterou by YAML
 * považoval za nový klíč. U textových polí proto hodnotu bez uvozovek
 * automaticky obalíme uvozovkami. Struktura se tím nemění.
 */
export function quoteTextValues(src: string): string {
  const re = new RegExp(`^(\\s*(?:-\\s+)?(?:${TEXT_KEYS}):[ \\t]+)(.*?)\\s*$`);
  return src
    .split(/\r?\n/)
    .map((line) => {
      const m = line.match(re);
      if (!m) return line;
      const v = m[2];
      if (!v || /^["'[{|>&*!]/.test(v) || /^(true|false)$/.test(v)) return line;
      if (!/:\s|\s#/.test(v)) return line;
      return `${m[1]}"${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    })
    .join('\n');
}

/** Načte a zkontroluje jeden blok ```cviceni. */
export function parseExercise(src: string): Exercise {
  let data: unknown;
  try {
    data = yamlLoad(quoteTextValues(src));
  } catch (e) {
    const m = (e as { reason?: string; mark?: { line: number } });
    fail('', `blok není platný YAML (${m.reason ?? String(e)}${m.mark ? `, řádek ${m.mark.line + 1} bloku` : ''}).`);
  }
  const o = obj(data, '', 'Blok cvičení');
  const id = o.id === undefined || o.id === null ? '' : String(o.id).trim();
  if (!id) fail('', `blok nemá „id“ (typ: ${o.typ ?? '?'}). Každé cvičení potřebuje stabilní id, např. t1-l2-c3.`);
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(id)) fail(id, 'id smí obsahovat jen písmena bez diakritiky, číslice a pomlčky.');
  if (!o.typ) fail(id, `chybí „typ“. Povolené typy: ${TYPES.join(', ')}.`);
  if (!TYPES.includes(o.typ as (typeof TYPES)[number])) fail(id, `neznámý typ „${o.typ}“. Povolené typy: ${TYPES.join(', ')}.`);
  const typ = o.typ as Exercise['typ'];
  const prev = usedIds.get(id);
  if (prev) fail(id, `id už používá jiné cvičení (${prev}). Id musí být jedinečné v celém kurzu.`);
  const ex = validate(o, typ, id);
  usedIds.set(id, [where.file, where.lesson].filter(Boolean).join(' › '));
  return ex;
}

function validate(o: Record<string, unknown>, typ: Exercise['typ'], id: string): Exercise {
  switch (typ) {
    case 'rozrad': {
      const kategorie = list(o, 'kategorie', id, 2).map((k, i) => {
        if (typeof k !== 'string' && typeof k !== 'number') fail(id, `kategorie ${i + 1} má být text.`);
        return String(k).trim();
      });
      const polozky = list(o, 'polozky', id).map((p, i) => {
        const po = obj(p, id, `Položka ${i + 1}`);
        const spravne = text(po, 'spravne', id, `polozky[${i + 1}].spravne`);
        if (!kategorie.includes(spravne)) {
          fail(id, `položka ${i + 1} („${po.text}“) má „spravne: ${spravne}“, ale taková kategorie není. Kategorie: ${kategorie.join(', ')}.`);
        }
        return {
          text: text(po, 'text', id, `polozky[${i + 1}].text`),
          spravne,
          vysvetleni: text(po, 'vysvetleni', id, `polozky[${i + 1}].vysvetleni`, true),
        };
      });
      return { typ, id, zadani: text(o, 'zadani', id), kategorie, polozky };
    }
    case 'volba': {
      const moznosti = list(o, 'moznosti', id, 2).map((p, i) => {
        const po = obj(p, id, `Možnost ${i + 1}`);
        if (po.spravne !== undefined && typeof po.spravne !== 'boolean') {
          fail(id, `možnost ${i + 1}: „spravne“ má být true nebo false.`);
        }
        return {
          text: text(po, 'text', id, `moznosti[${i + 1}].text`),
          spravne: po.spravne === true,
          vysvetleni: text(po, 'vysvetleni', id, `moznosti[${i + 1}].vysvetleni`, true),
        };
      });
      if (!moznosti.some((m) => m.spravne)) fail(id, 'žádná možnost nemá „spravne: true“.');
      return { typ, id, otazka: text(o, 'otazka', id), moznosti };
    }
    case 'skala': {
      const polozky = list(o, 'polozky', id).map((p, i) => {
        if (typeof p !== 'string' && typeof p !== 'number') fail(id, `položka ${i + 1} má být text.`);
        return String(p).trim();
      });
      if (new Set(polozky).size !== polozky.length) fail(id, 'položky se opakují.');
      return {
        typ,
        id,
        zadani: text(o, 'zadani', id),
        min_popis: text(o, 'min_popis', id, 'min_popis', true),
        max_popis: text(o, 'max_popis', id, 'max_popis', true),
        polozky,
      };
    }
    case 'odpoved':
      return { typ, id, zadani: text(o, 'zadani', id), napoveda: text(o, 'napoveda', id, 'napoveda', true) };
    case 'kroky': {
      const kroky = list(o, 'kroky', id).map((k, i): ExKrok => {
        const ko = obj(k, id, `Krok ${i + 1}`);
        const kt = ko.typ ?? 'text';
        if (kt !== 'text' && kt !== 'volba') fail(id, `krok ${i + 1} má typ „${kt}“. Povolené: text, volba.`);
        let moznosti: string[] = [];
        if (kt === 'volba') {
          if (!Array.isArray(ko.moznosti) || ko.moznosti.length < 2) {
            fail(id, `krok ${i + 1} má typ „volba“, ale chybí mu „moznosti“ (aspoň dvě).`);
          }
          moznosti = ko.moznosti.map((m) => String(m).trim());
        }
        return {
          otazka: text(ko, 'otazka', id, `kroky[${i + 1}].otazka`),
          typ: kt,
          napoveda: text(ko, 'napoveda', id, `kroky[${i + 1}].napoveda`, true),
          moznosti,
        };
      });
      return { typ, id, nazev: text(o, 'nazev', id), kroky };
    }
  }
  fail(id, 'neznámá chyba.');
}

/** Vykreslí Markdown a bloky ```cviceni vrátí jako samostatné díly. */
function renderParts(src: string, links: SourceLink[], exercises: Exercise[] | null): Part[] {
  const tokens = md.parse(src, {});
  collectLinks(tokens, links);
  const parts: Part[] = [];
  let buf: Token[] = [];
  const flush = () => {
    const html = md.renderer.render(buf, md.options, {}).trim();
    if (html) parts.push({ t: 'html', html });
    buf = [];
  };
  for (const t of tokens) {
    if (t.type === 'fence' && t.info.trim().toLowerCase() === 'cviceni') {
      if (!exercises) {
        throw new ContentError(`Chyba ve cvičení: ${where.file} › ${where.lesson || 'mimo lekce'}: blok cviceni může být jen uvnitř lekce.`);
      }
      flush();
      const ex = parseExercise(t.content);
      exercises.push(ex);
      parts.push({ t: 'ex', ex });
    } else buf.push(t);
  }
  flush();
  return parts;
}

/** Počet slov čitelného textu (bez bloků kódu a cvičení). */
export function wordCount(src: string): number {
  let n = 0;
  for (const t of md.parse(src, {})) {
    if (t.type !== 'inline' || !t.children) continue;
    for (const c of t.children) {
      if (c.type === 'text' || c.type === 'code_inline') n += c.content.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
    }
  }
  return n;
}

const EX_MINUTES: Record<Exercise['typ'], number> = { volba: 2, rozrad: 2, skala: 2, odpoved: 4, kroky: 10 };
export const READING_WPM = 180;

function renderInline(src: string, links: SourceLink[]): string {
  const tokens = md.parseInline(src, {});
  collectLinks(tokens, links);
  return md.renderer.render(tokens, md.options, {});
}

type Block = { title: string; body: string };

/** Rozdělí text podle nadpisů dané úrovně. Text před prvním nadpisem je v `lead`. */
function splitBy(src: string, level: 2 | 3): { lead: string; blocks: Block[] } {
  const re = new RegExp(`^${'#'.repeat(level)}\\s+(.*?)\\s*#*\\s*$`);
  const lines = src.split(/\r?\n/);
  const blocks: Block[] = [];
  const lead: string[] = [];
  let cur: { title: string; lines: string[] } | null = null;
  let inFence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const m = !inFence && line.match(re);
    if (m) {
      if (cur) blocks.push({ title: cur.title, body: cur.lines.join('\n').trim() });
      cur = { title: m[1].trim(), lines: [] };
    } else if (cur) cur.lines.push(line);
    else lead.push(line);
  }
  if (cur) blocks.push({ title: cur.title, body: cur.lines.join('\n').trim() });
  return { lead: lead.join('\n').trim(), blocks };
}

function sectionKind(title: string): SectionKind {
  const t = title.toLowerCase();
  if (t.startsWith('teorie') || t.startsWith('výklad') || t.startsWith('vyklad')) return 'theory';
  if (t.startsWith('případ') || t.startsWith('pripad') || t.startsWith('case')) return 'case';
  if (t.startsWith('primární') || t.startsWith('primarni')) return 'primary';
  if (t.startsWith('cvičení') || t.startsWith('cviceni')) return 'exercises';
  if (t.startsWith('na tvoje') || t.startsWith('na tvé') || t.startsWith('na tve')) return 'apply';
  if (t.startsWith('pojmy') || t.startsWith('slovníček')) return 'terms';
  return 'other';
}

function parseTerms(body: string, lessonId: string, links: SourceLink[]): Term[] {
  const terms: Term[] = [];
  const re = new RegExp(`^\\s*[-*+]\\s+\\*\\*(.+?)\\*\\*\\s*(?:${DASH}|:)?\\s*(.*)$`);
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(re);
    if (m) terms.push({ term: m[1].trim(), html: renderInline(m[2].trim(), links), lessonId });
  }
  return terms;
}

/**
 * Úkol (např. lekce 5): najde první číslovaný seznam, jehož položky začínají
 * tučným textem, a z každé položky udělá otázku s vlastním polem na odpověď.
 */
function parseTask(src: string, lessonId: string, links: SourceLink[]): Lesson['task'] | undefined {
  const tokens = md.parse(src, {});
  const start = tokens.findIndex((t) => t.type === 'ordered_list_open' && t.level === 0);
  if (start < 0) return undefined;
  let end = start;
  while (end < tokens.length && !(tokens[end].type === 'ordered_list_close' && tokens[end].level === 0)) end++;

  const prompts: Prompt[] = [];
  let i = start + 1;
  while (i < end) {
    if (tokens[i].type !== 'list_item_open' || tokens[i].level !== 1) { i++; continue; }
    let j = i + 1;
    while (j < end && !(tokens[j].type === 'list_item_close' && tokens[j].level === 1)) j++;
    const inner = tokens.slice(i + 1, j);
    const inline = inner.find((t) => t.type === 'inline');
    let title = '';
    if (inline?.children) {
      const first = inline.children.findIndex((c) => !(c.type === 'text' && !c.content.trim()));
      const s = first >= 0 && inline.children[first].type === 'strong_open' ? first : -1;
      if (s >= 0) {
        for (let k = s + 1; k < inline.children.length && inline.children[k].type !== 'strong_close'; k++) {
          title += inline.children[k].content;
        }
      }
    }
    if (!title) return undefined; // není to seznam otázek
    collectLinks(inner, links);
    prompts.push({
      id: `${lessonId}-q${prompts.length + 1}`,
      title: title.trim(),
      html: md.renderer.render(inner, md.options, {}),
    });
    i = j + 1;
  }
  if (!prompts.length) return undefined;

  const beforeLinks: SourceLink[] = [];
  const afterLinks: SourceLink[] = [];
  const before = tokens.slice(0, start);
  const after = tokens.slice(end + 1);
  collectLinks(before, beforeLinks);
  collectLinks(after, afterLinks);
  // pořadí odkazů: před seznamem, v seznamu, po seznamu
  const inList = links.splice(0, links.length);
  links.push(...beforeLinks, ...inList, ...afterLinks);
  return {
    beforeHtml: md.renderer.render(before, md.options, {}),
    prompts,
    afterHtml: md.renderer.render(after, md.options, {}),
  };
}

const ANCHORS: Partial<Record<SectionKind, string>> = {
  theory: 'vyklad',
  case: 'pripady',
  primary: 'primarni-zdroj',
  exercises: 'cviceni',
  terms: 'pojmy',
};

function parseLesson(week: number, n: number, title: string, body: string): { lesson: Lesson; linkCount: number } {
  const id = `t${week}-l${n}`;
  where.lesson = `Lekce ${n}`;
  const { lead, blocks } = splitBy(body, 3);
  const links: SourceLink[] = [];
  const sections: Section[] = [];
  const terms: Term[] = [];
  const exercises: Exercise[] = [];
  let leadParts: Part[] = [];
  let task: Lesson['task'];
  let words = 0;
  let extraMinutes = 0;

  if (!blocks.length) {
    // lekce bez podsekcí – úkol (starý formát s číslovaným seznamem otázek, nebo úvod + cvičení)
    const taskLinks: SourceLink[] = [];
    task = lead.includes('```cviceni') ? undefined : parseTask(lead, id, taskLinks);
    if (task) {
      links.push(...taskLinks);
      extraMinutes += 4 * task.prompts.length;
    } else leadParts = renderParts(lead, links, exercises);
  } else {
    leadParts = renderParts(lead, links, exercises);
    let applyCount = 0;
    const anchored = new Set<string>();
    for (const b of blocks) {
      const kind = sectionKind(b.title);
      const anchor = ANCHORS[kind] && !anchored.has(ANCHORS[kind]!) ? ANCHORS[kind] : undefined;
      if (anchor) anchored.add(anchor);
      if (kind === 'theory' || kind === 'case' || kind === 'primary') words += wordCount(b.body);
      if (kind === 'terms') {
        const sectionLinks: SourceLink[] = [];
        const parsed = parseTerms(b.body, id, sectionLinks);
        if (parsed.length) {
          terms.push(...parsed);
          links.push(...sectionLinks);
          // zbylý text mimo položky pojmů (kdyby tam nějaký byl)
          const rest = b.body
            .split(/\r?\n/)
            .filter((l) => !/^\s*[-*+]\s+\*\*/.test(l))
            .join('\n')
            .trim();
          sections.push({ kind, title: b.title, anchor, parts: rest ? renderParts(rest, links, exercises) : [] });
          continue;
        }
      }
      const section: Section = { kind, title: b.title, anchor, parts: renderParts(b.body, links, exercises) };
      if (kind === 'apply') {
        applyCount++;
        section.noteId = applyCount === 1 ? id : `${id}-${applyCount}`;
        extraMinutes += 4;
      }
      sections.push(section);
    }
  }

  // Odhad času: slova výkladu, případů a primárního zdroje / 180 + minuty za cvičení.
  const raw = words / READING_WPM + extraMinutes + exercises.reduce((m, e) => m + EX_MINUTES[e.typ], 0);
  const minutes = Math.max(5, Math.round(raw / 5) * 5);

  const hasApply = sections.some((s) => s.kind === 'apply');
  const lesson: Lesson = {
    id,
    week,
    n,
    title,
    kind: !blocks.length && (task || exercises.length) && !hasApply ? 'task' : 'lesson',
    minutes,
    leadParts,
    exercises,
    sections,
    task,
    terms,
    links: dedupe(links),
  };
  where.lesson = '';
  return { lesson, linkCount: links.length };
}

function dedupe(links: SourceLink[]): SourceLink[] {
  const seen = new Set<string>();
  return links.filter((l) => (seen.has(l.href) ? false : (seen.add(l.href), true)));
}

/** Počet markdownových odkazů v surovém textu – pro kontrolu, že se žádný neztratil. */
export function countRawLinks(src: string): number {
  const tokens = md.parse(src, {});
  const all: SourceLink[] = [];
  collectLinks(tokens, all);
  return all.length;
}

export function parseWeek(src: string, fileWeek: number, warn: (m: string) => void = () => {}, file = `content/tyden-${fileWeek}.md`): Week {
  where = { file, lesson: '' };
  const h1 = src.match(new RegExp(`^#\\s+(?:Týden|Tyden)\\s+(\\d+)\\s*(?:${DASH}\\s*(.*))?$`, 'mi'));
  const n = h1 ? Number(h1[1]) : fileWeek;
  if (h1 && n !== fileWeek) warn(`tyden-${fileWeek}.md: nadpis říká „Týden ${n}“, beru číslo z nadpisu.`);
  const title = (h1?.[2] ?? '').trim() || `Týden ${n}`;
  const withoutH1 = src.replace(/^#\s+.*$/m, '');
  const { lead, blocks } = splitBy(withoutH1, 2);

  const week: Week = {
    n,
    title,
    introTitle: 'Jak s lekcemi pracovat',
    introHtml: '',
    lessons: [],
    literatureTitle: 'Literatura k týdnu',
    literatureHtml: '',
    extras: [],
  };
  const sink: SourceLink[] = [];
  let collected = 0;
  const html = (body: string) => renderParts(body, sink, null).map((p) => (p.t === 'html' ? p.html : '')).join('');
  if (lead) {
    week.introHtml = html(lead);
  }
  const lessonRe = new RegExp(`^Lekce\\s+(\\d+)\\s*(?:${DASH}|:|\\.)?\\s*(.*)$`, 'i');
  for (const b of blocks) {
    const lm = b.title.match(lessonRe);
    if (/^jak s lekcemi/i.test(b.title) || (!week.lessons.length && /^úvod/i.test(b.title))) {
      week.introTitle = b.title;
      week.introHtml += html(b.body);
    } else if (lm) {
      const ln = Number(lm[1]);
      if (week.lessons.some((l) => l.n === ln)) {
        warn(`Týden ${n}: lekce ${ln} je v souboru dvakrát, druhý výskyt přeskakuji.`);
        continue;
      }
      const { lesson, linkCount } = parseLesson(n, ln, lm[2].trim() || `Lekce ${ln}`, b.body);
      collected += linkCount;
      week.lessons.push(lesson);
    } else if (/^literatura|^zdroje/i.test(b.title)) {
      week.literatureTitle = b.title;
      week.literatureHtml += html(b.body);
    } else {
      week.extras.push({ title: b.title, html: html(b.body) });
    }
  }
  week.lessons.sort((a, b) => a.n - b.n);

  // Kontrola: počet odkazů ve výstupu = počet odkazů v Markdownu.
  collected += sink.length;
  const expected = countRawLinks(src);
  if (collected !== expected) {
    throw new Error(`Týden ${n}: v Markdownu je ${expected} odkazů, ve výstupu ${collected}. Nějaký se ztratil.`);
  }
  return week;
}

export const TOTAL_WEEKS = 8;

export function loadCourse(dir: string, warn: (m: string) => void = console.warn): Course {
  const weeks: Week[] = [];
  usedIds = new Map();
  if (existsSync(dir)) {
    const files = readdirSync(dir)
      .map((f) => ({ f, m: f.match(/^tyden-(\d+)\.md$/i) }))
      .filter((x) => x.m)
      .sort((a, b) => Number(a.m![1]) - Number(b.m![1]));
    for (const { f, m } of files) {
      const src = readFileSync(join(dir, f), 'utf8');
      const week = parseWeek(src, Number(m![1]), warn, `content/${f}`);
      if (weeks.some((w) => w.n === week.n)) {
        warn(`${f}: týden ${week.n} už existuje, soubor přeskakuji.`);
        continue;
      }
      if (!week.lessons.length) warn(`${f}: nenašel jsem žádnou lekci („## Lekce N – název“).`);
      weeks.push(week);
    }
  }
  weeks.sort((a, b) => a.n - b.n);
  const maxWeek = weeks.reduce((m, w) => Math.max(m, w.n), 0);
  return { totalWeeks: Math.max(TOTAL_WEEKS, maxWeek), weeks };
}
