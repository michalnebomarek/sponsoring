# Etapa – pokyny pro Claude Code

Tento repozitář obsahuje dvě věci:

1. **Aplikaci Etapa.** Je to PWA pro jednoho uživatele, Michala: Vite a TypeScript, nasazená na GitHub Pages. Původní zadání a doplněk o cvičeních jsou v historii repozitáře. Aplikace funguje, takže na kód sahej jen tehdy, když o to Michal požádá.
2. **Obsah kurzu.** Osmitýdenní masterclass o partnerstvích sportovních eventů, jeden soubor na týden: `content/tyden-N.md`. Většina práce v tomto repozitáři bude psaní dalších týdnů. Zbytek souboru popisuje, jak se to dělá.

## Pro koho a proč

Michal pracuje v agentuře na partnerstvích cyklistických závodů **Czech Tour** a **Závod míru**. Partnery jsou mimo jiné Seznam, ČEZ, ŠKODA AUTO, Mattoni a Allwyn. Kurz čte každý pracovní den, zhruba 30 minut, na iPhonu.

Co od kurzu čeká:

- **Hloubku.** Výsledkem má být skutečná masterclass, žádné shrnutí povrchu. Když lekce jde po povrchu nebo je krátká, Michal to pozná a právem si stěžuje.
- **Praktickou využitelnost.** Každá lekce končí tím, co z ní plyne pro jeho závody.
- **Témata.** Sponzoring závodů a sportovních eventů napříč sporty: aktivace, práce s fanoušky a účastníky, kanály. Příklady z cyklistiky jsou plus, ale nesmí převážit.
- **Co ho nezajímá.** Výše smluv („zaplatili 5 milionů“) a týmový sponzoring postavený na logu na dresu.
- **Příklady.** Ke každé lekci reálné a ověřené příklady, ideálně méně známé a co nejčerstvější (2025–2027). Škodu a Tissot na Tour de France zná, ty nepoužívej.

## Zdroje

Toto je nejdůležitější pravidlo celého kurzu.

**Povolené zdroje, v pořadí důvěryhodnosti:**

1. **Recenzovaný výzkum** z předních časopisů, například Journal of Marketing, Journal of Consumer Research, Journal of Advertising, Journal of the Academy of Marketing Science, Journal of Business Research, Journal of Sport Management, Sport Management Review, Psychology & Marketing, Journal of Advertising Research a International Journal of Sports Marketing and Sponsorship. Klíčová autorka oboru je T. Bettina Cornwell. Metaanalýzy a replikace mají přednost před jednotlivými studiemi.
2. **Top praktici s doloženou praxí,** například Kim Skildum-Reid (Power Sponsorship) nebo Stuart Wareman (dříve Accor a Marriott). Uváděj je výslovně jako názor praktika, ne jako výzkum.
3. **Ověřené případové studie:** ESA Awards (sponsorship.org), WARC, oficiální stránky organizátorů a partnerů a kvalitní oborová média (Sportcal, SportBusiness, Cyclingnews, The Sponsor). U přihlášek do soutěží vždy uveď, že čísla dodal sám přihlašovatel.
4. **Oborová data** (ESA, IEG/ESP, GlobalData, Nielsen). Jen pro orientaci a s poznámkou, že metodika často není veřejná.

**Zakázané:** příspěvky na LinkedInu, osobní blogy bez doložené odbornosti, obsahové farmy agentur, AI-generované přehledy, Medium, Wikipedia jako zdroj tvrzení, nepodložené „statistiky“ bez původního zdroje.

**Pravidla ověřování:**

- **Každý odkaz otevři.** Ověř, že stránka existuje a říká to, co jí připisuješ. Do textu nedávej odkaz, který jsi neotevřel.
- **Studii čti v plném textu,** pokud je volně dostupná: z repozitáře univerzity, z přijatého rukopisu nebo v open access. Pokud máš jen abstrakt, piš jen to, co v abstraktu je, a odkaz označ slovem „abstrakt“.
- **U studie uveď:** kdo, kde a v jakém časopise, na kom a jak se zkoumalo (vzorek, metoda), co vyšlo s konkrétními čísly, a limity, které uvádějí autoři, plus ty, které vidíš ty.
- **Nevymýšlej čísla, citace ani benchmarky.** Když něco nevíš, napiš to.
- **Odliš fakta od svého úsudku.** Vlastní závěr, který z žádného zdroje přímo neplyne, uveď slovy „Moje čtení:“.
- **Ke každé lekci aspoň jeden sporný, neúspěšný nebo varovný případ.** Kurz nesmí být sbírka úspěchů.
- **Nepoužívej zdroje z nelegálních knihoven ani proxy univerzitních knihoven** (Sci-Hub, `*.elogim.com` apod.).

## Jazyk a styl

- **Čeština, tykání.** Věcný tón zkušeného kolegy: bez motivačního patosu a bez marketingových frází.
- **Nepoužívej kontrastní konstrukce** typu „není to X, je to Y“, „neděláme X, děláme Y“ nebo „nejde o X, ale o Y“. Myšlenku vyjádři přímo.
- **Zakázané fráze:** „posunout na další úroveň“, „autentická komunikace“, „rezonovat s publikem“, „skutečná hodnota“, „silný storytelling“, „game changer“, „win-win“, „synergie“, „360°“, „inovativní přístup“ a podobné. Pokud pojem potřebuješ, musí mít v kontextu přesný význam.
- **Krátké věty a aktivní slovesa.** Odborné pojmy při prvním použití vysvětli.
- **Bez vaty.** Délku dávají studie, případy a praktické kroky, nikdy opakování a obecné úvody.

## Struktura souboru `content/tyden-N.md`

Vzor je `content/tyden-1.md`. Drž přesně tyto nadpisy, aplikace je parsuje.

```
# Týden N – Název týdne

## Jak s lekcemi pracovat
(cíl týdne, 2–4 odstavce, poznámka ke zdrojům)

## Lekce 1 – Název
(1–2 věty: hlavní myšlenka lekce)

### Výklad
#### Podnadpis …
#### Hlavní studie lekce: …
#### Co víme a co ne        (volitelné)

### Případ 1: Značka a event (sport)
### Případ 2: …
### Případ 3 (sporný | neúspěšný | varovný): …
### Případ 4: …              (podle potřeby)

### Jak to použít v praxi

### Primární zdroj (10 minut)   (jen když je studie top tier a volně dostupná)

### Cvičení
(1–3 bloky cviceni)

### Pojmy
- **pojem** – vysvětlení

… Lekce 2–4 stejně …

## Lekce 5 – Úkol
(úvodní odstavce, jeden blok cviceni typu kroky, vyplněný vzor pro vymyšleného partnera)

## Literatura k týdnu
**Recenzovaný výzkum** / **Shrnutí výzkumu** / **Oborová data** / **Praxe** / **Případy**
```

### Co má obsahovat každá lekce 1–4

- **Výklad.** Mechanismus a pojmy podložené výzkumem, včetně toho, kde se výzkum rozchází nebo kde praxe stojí jen na zvyku.
- **Hlavní studie lekce.** Jedna studie rozebraná do hloubky, zhruba 400–500 slov. Pořadí: otázka, design studie (vzorek, metoda), co vyšlo s čísly, jak to autoři vysvětlují, limity a co z toho plyne pro závody.
- **Případy.** 3–5 případů, z toho aspoň jeden sporný nebo neúspěšný. U každého: jaký problém značka měla, co na eventu udělala s fanoušky nebo účastníky, přes jaké kanály to rozšířila a jaký byl výsledek, s uvedením, kdo čísla dodal. Pak krátký „Rozbor“ podle principu z výkladu.
- **Jak to použít v praxi.** 4–5 konkrétních kroků pro Czech Tour a Závod míru, poslední vždy „Čemu se vyhnout“.
- **Primární zdroj.** Jen pokud existuje volně dostupná studie z předního časopisu. Obsahuje odkaz, proč ji číst, co v ní je, co přesně přečíst (kapitoly a strany) a tři otázky k zamyšlení. Pokud taková studie není, sekci vynech a nahraď ji dalším případem nebo hlubším výkladem. Slabší studii jako „primární zdroj“ nedávej.

### Cvičení

Bloky kódu s jazykem `cviceni`, obsah je YAML. Typy jsou `rozrad`, `volba`, `skala`, `odpoved` a `kroky`, formát přesně podle `content/tyden-1.md`.

- `id` ve tvaru `tN-lM-cK`, jedinečné napříč kurzem. Jednou použité `id` už neměň.
- Cvičení musí jít udělat palcem na telefonu. Žádné dlouhé psaní: `odpoved` chce 2–4 věty.
- Cvičení ověřuje pochopení a přenos na Michalovy závody. Pouhé opakování faktů nestačí.
- U `rozrad` a `volba` musí mít každá položka vysvětlení, proč je správná nebo špatná, s odkazem na studii nebo případ z lekce.

## Délka lekce

Cíl je **30 minut** na lekci 1–4 a aspoň 20 minut na lekci 5. Aplikace počítá čas takto:

- slova všech textových sekcí kromě „Cvičení“ a „Pojmy“, vydělená 180,
- plus 10 minut za sekci „Primární zdroj (10 minut)“,
- plus 2 minuty za každé cvičení `volba`, `rozrad` nebo `skala`, 4 minuty za `odpoved` a 10 minut za `kroky`,
- výsledek se zaokrouhlí na celých 5 minut.

Lekce s primárním zdrojem tak potřebuje kolem 2 000 slov, lekce bez něj kolem 3 000 slov.

**Před každým commitem nového týdne spusť:**

```
node scripts/delka-lekci.mjs content/tyden-N.md --podrobne
```

Když skript skončí chybou, lekci doplň o obsah s vlastní hodnotou: další studii, další případ nebo hlubší rozbor limitů. Nenafukuj text. Délku nikdy neuváděj odhadem, vždy podle výstupu skriptu.

**Jednorázový úkol pro kód:** aplikace má počítat čas stejnou funkcí jako `scripts/delka-lekci.mjs`, aby se čísla nikdy nerozcházela. Vytáhni výpočet do sdíleného modulu a použij ho v buildu. V navigaci lekce mají být i štítky „V praxi“ a „Zdroj“.

## Osnova týdnů 2–8

Témata jsou daná, příklady jsou výchozí návrh. Před použitím je ověř a doplň čerstvějšími.

Případy použité v týdnu 1 neopakuj jako hlavní případ, nanejvýš se na ně odkaž: Accor × Roland-Garros, TCS × Londýnský maraton, William Hill, Swapfiets, Husqvarna × AIG Women's Open, American Express × US Open, Chevrolet × Manchester United, Van Rysel, Deep Heat × HYROX, eBay × Silverstone, FC St. Pauli, Vhi Women's Mini Marathon, Danone GetPRO, Tour of Britain bez titulárního partnera, Flanders Classics fan zóny a Zwift × Tour de France Femmes.

Studie použité v týdnu 1 (nepoužívej je znovu jako hlavní studii): Bredikhina & Kunkel 2022, Weeks, Cornwell & Drennan 2008, Woisetschläger, Backhaus & Cornwell 2017, Dreisbach a kol. 2021, Silva 2021, Cornwell a kol. 2006, Gwinner & Eaton 1999, Kwon a kol. 2016, Johar & Pham 1999 a Mazodier & Quester 2014.

U studií v osnově níže jsou názvy časopisů a roky orientační. Před použitím každou ověř a dohledej plný text.

### Týden 2 – Pohled partnera
1. **Jak partner vydělává a jak se rozhoduje.** Kdo ve firmě o partnerství rozhoduje a podle čeho. Zdroje: Stuart Wareman (The Sponsor), Cornwell & Kwon 2020 (JAMS), Jensen & Cornwell 2017 (Journal of Sport Management, proč partnerství končí).
2. **Co značka hledá v nabídce.** Zdroje: Wareman pro ESA („5 things a brand looks for in a rights proposal“), Skildum-Reid. Výzkum vztahu partner–organizátor: Farrelly 2010 (Journal of Sport Management, proč se partnerství rozpadají).
3. **Produkt partnera jako součást eventu.** Funkční shoda v praxi, tedy služba, kterou event skutečně používá. Husqvarnu už znáš, hledej nové případy.
4. **Event pro vlastní zaměstnance.** Interní využití partnerství. Příklad: Pfizer Ireland Cycle (ESA 2026). Výzkum dopadu sponzoringu na zaměstnance: Hickman, Lawrence & Ward 2005 (Sport Marketing Quarterly), ověř a hledej novější.
5. **Úkol.** Rozhovor s partnerem: připrav a veď 20minutový rozhovor podle karty partnera z týdne 1. Zapiš, co se potvrdilo a co ne.

### Týden 3 – Práva a jejich využití
1. **Co je v balíčku:** branding, hospitality, data, obsah, licence a exkluzivita. Příklad: nabídka práv Flanders Classics.
2. **Pojmenování části eventu:** naming rights soutěží, zón a etap. Výzkum: jak naming rights působí na vnímané motivy partnera.
3. **Celá cesta účastníka, nejen závodní den.** Hledej nový případ, Danone je použitý.
4. **Exkluzivita a ambush marketing.** Výzkum ambush marketingu (Meenaghan, Chadwick & Burton) a čerstvé případy z velkých eventů.
5. **Úkol.** Inventura práv Czech Tour: co se prodává, co partneři reálně využili a co zůstalo ležet.

### Týden 4 – Aktivace na místě
1. **Fan zóna jako produkt.** Výzkum event marketingu: Sneath, Finney & Close 2005 a Close a kol. 2006 (Journal of Advertising Research).
2. **Lokální ukotvení** v hostitelských městech a regionech.
3. **Rituál eventu jako příležitost.** Příklady: FedEx a předání trofeje Ligy mistrů, EDF a elektrický olympijský oheň (ESA 2026).
4. **Malá služba divákovi u trati.** Příklad: Gorillas na Alpe d'Huez (Team Visma | Lease a Bike – partner activations).
5. **Úkol.** Návrh jedné aktivace na místě pro partnera Závodu míru 2027: cíl, mechanika, co je potřeba od organizátora, jak se změří.

### Týden 5 – Obsah, digitál, tvůrci
1. **Z tiskové konference obsah.** Příklad: Guinness a zahájení Six Nations v Římě (ESA 2026).
2. **Sociální sítě a sentiment kolem partnerů.** Výzkum: Delia & Armstrong 2015 (Journal of Sport Management, #FrenchOpen).
3. **Technologie na expu a v aplikaci.** Příklad: TCS a „digitální dvojčata“ na běžeckém expu (ESA 2025). TCS aplikaci už znáš.
4. **Tvůrci obsahu.** Příklady: LCL a influenceři mimo cyklistiku na Tour 2025, eBay a seriál „Drive to Silverstone“.
5. **Úkol.** Obsahový plán jednoho partnera na týden závodu: formáty, kanály, kdo co dodá.

### Týden 6 – Měření a reporting
1. **Limity mediální hodnoty (AVE).** Výzkum: Meenaghan 2013 (Psychology & Marketing, měření výkonu sponzoringu), Crompton 2004 (Leisure Studies).
2. **Return on objectives.** Příklad: jak BBVA hodnotila jednotlivá práva podle KPI (MASB).
3. **Metriky, které partnera zajímají.** Jak měřit znalost partnerů s kontrolními značkami a jak měřit nákupní záměr.
4. **Report, který partner přepošle šéfovi.** Příklad: whitepaper Flanders Classics s výsledky partnerů Proximus a MAES.
5. **Úkol.** Přestavba jednoho závěrečného reportu podle cílů partnera.

### Týden 7 – Prodej, cena, smlouva
1. **Cena bez vzorce.** Zdroje: Skildum-Reid („Sponsorship Pricing Basics“), The Sponsor (media value vs market value).
2. **Nabídka postavená na problému značky.** Zdroj: Skildum-Reid („Rightsholder strategies“).
3. **Netypické kategorie partnerů.** Příklad: Mango de España jako oficiální mango Vuelty (Sportcal). Případ NIVEA na Tour 2027 měl v osnově jako zdroj LinkedIn, ten nahraď oficiální tiskovou zprávou, nebo případ vyřaď.
4. **Smlouva:** exkluzivita, kategorie, barter a plnění. Zdroj: advokátní kancelář se sportovní praxí (Brabners), ideálně i výzkum vztahů partner–organizátor.
5. **Úkol.** Přepsat rozpracovanou nabídku pro nového partnera podle týdnů 2, 3 a 7.

### Týden 8 – Obnova a trendy
1. **Dlouhá partnerství.** Výzkum: Jensen & Cornwell 2017 a co prodlužuje a ukončuje vztah. Příklady: Proximus a Flanders Classics do 2028, American Express a US Open.
2. **Když hlavní partner odejde.** Tour of Britain je v týdnu 1, hledej další případ.
3. **Ženský sport a ženské eventy** jako příležitost. Zwift je v týdnu 1, hledej nové případy a aktuální data.
4. **Trendy 2026–2027:** AI, účast amatérů, ženský sport a udržitelnost. Zdroje: IMG, vítězové ESA Awards 2026 a 2027, pokud už jsou.
5. **Závěrečný úkol.** Partnerský plán 2027 pro jednoho partnera: cíl, aktivace, měření a kroky k obnově.

## Postup při tvorbě týdne

1. **Zjisti, který týden je na řadě.** Je to nejvyšší existující `content/tyden-N.md` plus jedna. Po týdnu 8 nic nevytvářej.
2. **Přečti si podklady:** `CLAUDE.md` celý, `content/tyden-1.md` jako vzor kvality a formátu a předchozí týden, abys navázal a neopakoval se.
3. **Rešerše.** Ke každé lekci najdi hlavní studii (plný text), 3–5 ověřených případů a aspoň jeden sporný. Každý odkaz otevři.
4. **Napiš `content/tyden-N.md`** podle struktury výše.
5. **Spusť `node scripts/delka-lekci.mjs content/tyden-N.md --podrobne`** a doplň lekce, které nesplňují délku.
6. **Spusť build** (`npm run build`). Musí projít včetně validace cvičení.
7. **Commitni a pushni na `main`.** GitHub Action nasadí novou verzi. Commit message: `Týden N: název`.
8. **Na konci napiš krátký report:**
   - délku každé lekce podle skriptu,
   - hlavní studii každé lekce,
   - co se nepodařilo ověřit nebo co je jen „Moje čtení“,
   - odkazy, které vedou jen na abstrakt.
