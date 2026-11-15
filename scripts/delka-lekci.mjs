#!/usr/bin/env node
// Spočítá délku lekcí v content/tyden-N.md stejným vzorcem, jaký používá aplikace.
//
// Použití:
//   node scripts/delka-lekci.mjs                 všechny týdny v content/
//   node scripts/delka-lekci.mjs content/tyden-2.md
//
// Vzorec (stejný jako v aplikaci, viz CLAUDE.md):
//   slova všech textových sekcí lekce kromě „Cvičení“ a „Pojmy“ / 180
//   + 10 min, pokud lekce má sekci „Primární zdroj (10 minut)“
//   + 2 min za cvičení typu volba, rozrad, skala
//   + 4 min za odpoved
//   + 10 min za kroky
//   výsledek zaokrouhlený na celých 5 minut
//
// Slova se počítají bez bloků cviceni, bez URL odkazů (počítá se jen text odkazu)
// a bez markdownových značek.
//
// Kontrola: lekce 1–4 musí vyjít aspoň na 30 min (po zaokrouhlení),
// lekce 5 aspoň na 20 min. Pokud ne, skript skončí s kódem 1.

import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const WPM = 180;
const MIN_LEKCE = 30;     // lekce 1–4
const MIN_UKOL = 20;      // lekce 5
const VAROVANI_MAX = 45;  // nad tuto hodnotu jen varování
const MINUTY_CVICENI = { volba: 2, rozrad: 2, skala: 2, odpoved: 4, kroky: 10 };
const BEZ_POCITANI = ['Cvičení', 'Pojmy'];

function pocetSlov(text) {
  const cisty = text
    .replace(/```[\s\S]*?```/g, ' ')                 // bloky kódu (cviceni)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')           // obrázky
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')         // odkazy -> jen text
    .replace(/<[^>]+>/g, ' ')                        // HTML
    .replace(/[*_`>#|]/g, ' ');                      // značky markdownu
  return cisty.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

function cviceniVBloku(text) {
  const vysledek = [];
  for (const blok of text.matchAll(/```cviceni\n([\s\S]*?)```/g)) {
    // jen typ na nejvyšší úrovni (bez odsazení); vnořené `typ:` v krocích ignoruj
    const m = blok[1].match(/^typ:\s*(\S+)/m);
    const id = (blok[1].match(/^id:\s*(\S+)/m) || [])[1] || '?';
    vysledek.push({ typ: m ? m[1] : '?', id });
  }
  return vysledek;
}

function rozdelLekce(md) {
  const casti = md.split(/^## /m).slice(1);
  return casti
    .map((c) => {
      const [nadpis, ...zbytek] = c.split('\n');
      return { nadpis: nadpis.trim(), telo: zbytek.join('\n') };
    })
    .filter((c) => /^Lekce\s+\d+/.test(c.nadpis));
}

function rozdelSekce(telo) {
  // úvod lekce před první ### je sekce „Úvod“
  const casti = telo.split(/^### /m);
  const sekce = [{ nazev: 'Úvod', text: casti[0] }];
  for (const c of casti.slice(1)) {
    const [nazev, ...zbytek] = c.split('\n');
    sekce.push({ nazev: nazev.trim(), text: zbytek.join('\n') });
  }
  return sekce;
}

function spocitejLekci(lekce) {
  const sekce = rozdelSekce(lekce.telo);
  let slova = 0;
  let primarni = false;
  const rozpis = [];
  for (const s of sekce) {
    const pocitat = !BEZ_POCITANI.some((n) => s.nazev.startsWith(n));
    const n = pocetSlov(s.text);
    if (s.nazev.startsWith('Primární zdroj')) primarni = true;
    if (pocitat) slova += n;
    rozpis.push({ sekce: s.nazev, slova: n, pocita: pocitat });
  }
  const cviceni = cviceniVBloku(lekce.telo);
  const minCviceni = cviceni.reduce((a, c) => a + (MINUTY_CVICENI[c.typ] ?? 0), 0);
  const minCteni = slova / WPM;
  const presne = minCteni + (primarni ? 10 : 0) + minCviceni;
  const zaokrouhleno = Math.round(presne / 5) * 5;
  return { slova, minCteni, primarni, cviceni, minCviceni, presne, zaokrouhleno, rozpis };
}

function zkontrolujSoubor(cesta, podrobne) {
  const md = readFileSync(cesta, 'utf8');
  const lekce = rozdelLekce(md);
  let chyby = 0;
  console.log(`\n${basename(cesta)}`);
  if (lekce.length !== 5) {
    console.log(`  CHYBA: soubor má ${lekce.length} lekcí, čekám 5`);
    chyby++;
  }
  for (const l of lekce) {
    const cislo = Number(l.nadpis.match(/^Lekce\s+(\d+)/)[1]);
    const r = spocitejLekci(l);
    const limit = cislo === 5 ? MIN_UKOL : MIN_LEKCE;
    const ok = r.zaokrouhleno >= limit;
    const stav = ok ? 'OK ' : 'MÁLO';
    const typy = r.cviceni.map((c) => c.typ).join(', ') || 'žádná';
    console.log(
      `  [${stav}] ${l.nadpis}\n` +
        `         ${r.slova} slov = ${r.minCteni.toFixed(1)} min čtení` +
        `${r.primarni ? ' + 10 min primární zdroj' : ''}` +
        ` + ${r.minCviceni} min cvičení (${typy})` +
        ` = ${r.presne.toFixed(1)} min → v aplikaci ≈ ${r.zaokrouhleno} min (minimum ${limit})`
    );
    if (podrobne) {
      for (const s of r.rozpis) {
        console.log(`           ${s.pocita ? ' ' : '-'} ${s.sekce}: ${s.slova}`);
      }
    }
    if (!ok) chyby++;
    if (r.zaokrouhleno > VAROVANI_MAX) {
      console.log(`         varování: přes ${VAROVANI_MAX} min, zvaž zkrácení`);
    }
    if (cislo <= 4 && r.cviceni.length === 0) {
      console.log('         CHYBA: lekce nemá žádné cvičení');
      chyby++;
    }
  }
  return chyby;
}

const args = process.argv.slice(2);
const podrobne = args.includes('--podrobne');
let soubory = args.filter((a) => !a.startsWith('--'));
if (soubory.length === 0) {
  soubory = readdirSync('content')
    .filter((f) => /^tyden-\d+\.md$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))
    .map((f) => join('content', f));
}

let celkem = 0;
for (const s of soubory) celkem += zkontrolujSoubor(s, podrobne);
if (celkem > 0) {
  console.log(`\n${celkem} problém(y). Doplň obsah, nebo uprav cvičení.`);
  process.exit(1);
}
console.log('\nVšechny lekce splňují minimální délku.');
