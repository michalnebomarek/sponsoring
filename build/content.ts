/**
 * Převod souborů content/tyden-N.md na data pro aplikaci.
 * Běží jen při buildu (ve Vite pluginu), do prohlížeče jde hotový JSON.
 *
 * Parser je záměrně tolerantní: chybějící nebo navíc přidané podsekce
 * nevyhodí chybu, jen se zobrazí jako obecný blok textu.
 * Jedinou tvrdou kontrolou je počet odkazů – žádný se nesmí ztratit.
 */
import MarkdownIt from 'markdown-it';
import type { Token } from 'markdown-it';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export type SourceLink = { href: string; text: string; domain: string };

export type SectionKind = 'theory' | 'case' | 'apply' | 'terms' | 'other';

export type Section = {
  kind: SectionKind;
  title: string;
  html: string;
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
  leadHtml: string;
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

function render(src: string, links: SourceLink[]): string {
  const tokens = md.parse(src, {});
  collectLinks(tokens, links);
  return md.renderer.render(tokens, md.options, {});
}

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
  if (t.startsWith('teorie')) return 'theory';
  if (t.startsWith('případ') || t.startsWith('pripad') || t.startsWith('case')) return 'case';
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

function parseLesson(week: number, n: number, title: string, body: string): { lesson: Lesson; linkCount: number } {
  const id = `t${week}-l${n}`;
  const { lead, blocks } = splitBy(body, 3);
  const links: SourceLink[] = [];
  const sections: Section[] = [];
  const terms: Term[] = [];
  let leadHtml = '';
  let task: Lesson['task'];

  if (!blocks.length) {
    // lekce bez podsekcí – může to být úkol
    const taskLinks: SourceLink[] = [];
    task = parseTask(lead, id, taskLinks);
    if (task) links.push(...taskLinks);
    else leadHtml = render(lead, links);
  } else {
    leadHtml = render(lead, links);
    let applyCount = 0;
    for (const b of blocks) {
      const kind = sectionKind(b.title);
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
          sections.push({ kind, title: b.title, html: rest ? render(rest, links) : '' });
          continue;
        }
      }
      const section: Section = { kind, title: b.title, html: render(b.body, links) };
      if (kind === 'apply') {
        applyCount++;
        section.noteId = applyCount === 1 ? id : `${id}-${applyCount}`;
      }
      sections.push(section);
    }
  }

  const hasApply = sections.some((s) => s.kind === 'apply');
  const lesson: Lesson = {
    id,
    week,
    n,
    title,
    kind: task && !hasApply ? 'task' : 'lesson',
    leadHtml,
    sections,
    task,
    terms,
    links: dedupe(links),
  };
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

export function parseWeek(src: string, fileWeek: number, warn: (m: string) => void = () => {}): Week {
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
  if (lead) {
    week.introHtml = render(lead, sink);
  }
  const lessonRe = new RegExp(`^Lekce\\s+(\\d+)\\s*(?:${DASH}|:|\\.)?\\s*(.*)$`, 'i');
  for (const b of blocks) {
    const lm = b.title.match(lessonRe);
    if (/^jak s lekcemi/i.test(b.title) || (!week.lessons.length && /^úvod/i.test(b.title))) {
      week.introTitle = b.title;
      week.introHtml += render(b.body, sink);
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
      week.literatureHtml += render(b.body, sink);
    } else {
      week.extras.push({ title: b.title, html: render(b.body, sink) });
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
  if (existsSync(dir)) {
    const files = readdirSync(dir)
      .map((f) => ({ f, m: f.match(/^tyden-(\d+)\.md$/i) }))
      .filter((x) => x.m)
      .sort((a, b) => Number(a.m![1]) - Number(b.m![1]));
    for (const { f, m } of files) {
      const src = readFileSync(join(dir, f), 'utf8');
      const week = parseWeek(src, Number(m![1]), warn);
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
