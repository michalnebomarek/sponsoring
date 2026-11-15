# Etapa

Osobní masterclass sportovních partnerství: 8 týdnů po 5 lekcích, s interaktivními cvičeními.
Webová aplikace (PWA), kterou si přidáš na plochu iPhonu. Funguje offline, data zůstávají jen v telefonu.

Adresa: **https://michalnebomarek.github.io/sponsoring/**

## Jak přidat nový týden

1. Na GitHubu otevři složku `content/` a klepni na **Add file → Upload files** (nebo **Create new file**).
2. Soubor pojmenuj `tyden-N.md`, kde N je číslo týdne (např. `tyden-2.md`).
3. Dole klepni na **Commit changes**. Commit uloží změnu do historie repozitáře. Nech zvolené „Commit directly to the main branch“.
4. Asi za dvě minuty je nový týden online. Průběh uvidíš na záložce **Actions**: zelená fajfka znamená hotovo, červený křížek chybu.
5. V telefonu aplikaci zavři a znovu otevři. Při dalším spuštění se ukáže pruh „Přibyl nový týden“.

Na kód se při tom sahat nemusí.

### Struktura souboru

````markdown
# Týden 2 – Název týdne

## Jak s lekcemi pracovat
Úvod týdne (zobrazí se jako úvodní karta, nepočítá se jako lekce).

## Lekce 1 – Název
Úvodní odstavec lekce.

### Výklad
#### Podnadpis
Text…

### Případ 1: Název          ← jeden nebo dva případy
### Jak to použít v praxi   ← štítek „V praxi“
### Primární zdroj (10 minut) ← volitelné, štítek „Zdroj“, +10 min
### Cvičení
```cviceni
typ: volba
id: t2-l1-c1
otazka: …
```
### Pojmy
- **Pojem** – vysvětlení    ← jde do Slovníčku

## Lekce 5 – Název
Úvodní odstavce a jeden blok cviceni (obvykle typ kroky).

## Literatura k týdnu
````

Pod nadpisem lekce se zobrazí štítky (Výklad, Případy, V praxi, Zdroj, Cvičení, Pojmy), ale jen pro sekce, které lekce má. Starý formát (`### Teorie`, `### Na tvoje závody`) funguje dál.

### Cvičení

Každé cvičení je blok ```` ```cviceni ```` s obsahem v YAML. Pět typů:

| typ | co dělá | povinná pole |
|---|---|---|
| `rozrad` | třídění položek do kategorií | `zadani`, `kategorie`, `polozky` (každá `text`, `spravne`, volitelně `vysvetleni`) |
| `volba` | výběr jedné odpovědi | `otazka`, `moznosti` (každá `text`, `spravne: true/false`, volitelně `vysvetleni`) |
| `skala` | hodnocení 1–5 | `zadani`, `polozky`, volitelně `min_popis`, `max_popis` |
| `odpoved` | krátký text | `zadani`, volitelně `napoveda` |
| `kroky` | průvodce po krocích | `nazev`, `kroky` (každý `otazka`, `typ: text` s `napoveda` nebo `typ: volba` s `moznosti`) |

Pravidla:

- **`id` musí být jedinečné v celém kurzu** a neměnit se, např. `t2-l3-c1` (týden 2, lekce 3, cvičení 1). Odpovědi se ukládají pod `id`, takže úprava textu cvičení odpovědi nesmaže. Změna `id` ano.
- Odsazení je důležité: položky seznamu začínají pomlčkou a jejich pole jsou odsazená o dvě mezery víc (viz `content/tyden-1.md`).
- Dvojtečka uvnitř textu („limity: jeden turnaj“) nevadí, aplikace si ji ohlídá.
- Když je blok rozbitý (chybí `id` nebo `typ`, neznámý typ, `spravne` neodpovídá žádné kategorii, krok typu `volba` nemá `moznosti`, dvě cvičení se stejným `id`…), **build se zastaví**. Na záložce Actions bude červený křížek s hláškou typu:
  `Chyba ve cvičení: content/tyden-2.md › Lekce 2 › t2-l2-c3: chybí pole „zadani“.`
  Online zůstane předchozí funkční verze.

### Odhad času

Aplikace ho počítá sama: slova ve všech textových sekcích lekce kromě Cvičení a Pojmů děleno 180. Patří sem i úvod lekce, „Jak to použít v praxi“ a podsekce `####` (např. „Hlavní studie lekce“, „Vzorová karta“). K tomu se přičte 10 minut za sekci „Primární zdroj“, 2 minuty za každé cvičení `volba`, `rozrad` a `skala`, 4 minuty za `odpoved` a 10 minut za `kroky`. Výsledek se zaokrouhlí na 5 minut. Rozpis pro každou lekci vypíše `node scripts/inspect.ts`.

### Další pravidla

- Odkazy piš běžně: `[text](https://…)`. V aplikaci se z nich stanou odkazy otevírané v Chromu a sesbírají se do „Zdrojů této lekce“.
- Drobné odchylky nevadí. Chybějící sekce nebo sekce s jiným názvem se zobrazí jako obyčejný text.
- Postup se ukládá podle čísla týdne a lekce (`t2-l3`). Úprava textu lekce proto postup nesmaže. Přečíslování lekcí ale ano.
- Build zkontroluje, že se neztratil žádný odkaz.

## Nasazení (jednorázově)

Aplikaci hostuje **GitHub Pages** zdarma a s HTTPS. Sestavení a nasazení obstarává **GitHub Action**, automatický skript v `.github/workflows/deploy.yml`, který se spustí při každé změně ve větvi `main`.

Jednou je potřeba Pages zapnout: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Přidání na plochu iPhonu

1. Otevři adresu aplikace v **Safari** (ne v Chromu, přidání na plochu funguje jen ze Safari).
2. Klepni na **Sdílet** → **Přidat na plochu** → **Přidat**.
3. Aplikaci od té doby otevírej ikonou **Etapa** na ploše.

Aplikace na ploše má vlastní data, oddělená od Safari. Když ji smažeš, data zmizí, proto občas použij **Nastavení → Zálohovat**.

## Pro vývoj

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

- `build/content.ts` – parser Markdownu a bloků `cviceni` (běží při buildu, výsledek jde do aplikace jako JSON).
- `node scripts/inspect.ts` – vypíše strukturu kurzu: sekce, cvičení a odhad času každé lekce.
- `src/components/Exercises.tsx` – cvičení, `src/exlogic.ts` – jejich vyhodnocení.
- `src/` – aplikace (Preact + TypeScript), `src/styles.css` – barvy jako CSS proměnné nahoře v souboru.
- `src/fonts/` – Fraunces a Figtree (licence SIL OFL), hostované lokálně kvůli offline režimu.
- `npm run icons` – znovu vygeneruje ikony v `public/` (potřebuje Playwright).
