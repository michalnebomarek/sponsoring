// Výpis struktury kurzu (pro kontrolu obsahu): node scripts/inspect.ts
import { loadCourse } from '../build/content.ts';
const c = loadCourse(new URL('../content', import.meta.url).pathname);
for (const w of c.weeks) {
  console.log(`Týden ${w.n} – ${w.title}`);
  for (const l of w.lessons) {
    console.log(`  ${l.id} [${l.kind}] ${l.title} · ≈ ${l.minutes} min`);
    console.log(`    sekce: ${l.sections.map((s) => s.kind + (s.anchor ? '#' + s.anchor : '')).join(', ') || '–'}`);
    console.log(`    cvičení: ${l.exercises.map((e) => `${e.id} (${e.typ})`).join(', ') || '–'} · pojmy ${l.terms.length} · zdroje ${l.links.length}`);
  }
}
