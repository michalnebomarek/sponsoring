# Etapa

Osobní masterclass sportovních partnerství: 8 týdnů po 5 lekcích, 30 minut denně.
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

```markdown
# Týden 2 – Název týdne

## Jak s lekcemi pracovat
Úvod týdne (zobrazí se jako úvodní karta, nepočítá se jako lekce).

## Lekce 1 – Název
Úvodní věta lekce.

### Teorie
### Případ: Název           ← může jich být víc (Případ 1, Případ 2 …)
### Na tvoje závody         ← pod touto sekcí je pole na odpověď
### Pojmy
- **Pojem** – vysvětlení    ← jde do Slovníčku

## Lekce 5 – Úkol
Číslovaný seznam, kde každá položka začíná **tučným názvem**,
dostane u každé položky vlastní pole na odpověď.

## Literatura k týdnu
Zdroje, zobrazí se na konci týdne.
```

- Odkazy piš běžně: `[text](https://…)`. V aplikaci se z nich stanou odkazy otevírané v Chromu a sesbírají se do „Zdrojů této lekce“.
- Drobné odchylky nevadí. Chybějící sekce nebo sekce s jiným názvem se zobrazí jako obyčejný text.
- Postup se ukládá podle čísla týdne a lekce (`t2-l3`). Úprava textu lekce proto postup nesmaže. Přečíslování lekcí ale ano.
- Build zkontroluje, že se neztratil žádný odkaz. Když se něco nepovede, na záložce Actions bude červený křížek a online zůstane předchozí verze.

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

- `build/content.ts` – parser Markdownu (běží při buildu, výsledek jde do aplikace jako JSON).
- `src/` – aplikace (Preact + TypeScript), `src/styles.css` – barvy jako CSS proměnné nahoře v souboru.
- `src/fonts/` – Fraunces a Figtree (licence SIL OFL), hostované lokálně kvůli offline režimu.
- `npm run icons` – znovu vygeneruje ikony v `public/` (potřebuje Playwright).
