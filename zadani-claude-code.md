# Zadání: aplikace „Etapa“ – osobní masterclass sportovních partnerství

## Co stavíme

Jednoduchou webovou aplikaci (PWA) pro jednoho uživatele, Michala. Bude se v ní osm týdnů učit partnerství sportovních eventů, 30 minut denně. Aplikaci si přidá na plochu iPhonu 17 Pro a bude ji otevírat jako normální aplikaci. Neprochází App Store, nemá účty ani backend.

Ráno otevře aplikaci, uvidí dnešní lekci, přečte si ji, zapíše odpověď na otázku, odškrtne lekci a zavře. Během dne si z plochy otevře poznámky nebo slovníček.

## Obsah

- Kurz má 8 týdnů po 5 lekcích, celkem 40 lekcí. Obsah vzniká postupně, teď je hotový týden 1.
- Každý týden je jeden Markdown soubor v `content/`, například `content/tyden-1.md`. Soubor k tomuto zadání přikládám. Další týdny budu přidávat stejným způsobem, takže přidání týdne musí znamenat jen vložení souboru a nový build. Na kód se sahat nebude.
- Struktura souboru:
  - `# Týden N – název`
  - `## Jak s lekcemi pracovat` – úvod týdne. Zobrazit jako úvodní kartu týdne, nepočítat jako lekci.
  - `## Lekce 1 – název` až `## Lekce 5 – název`. Uvnitř podsekce `### Teorie`, `### Případ…` (může jich být víc), `### Na tvoje závody` a `### Pojmy`. Lekce 5 je úkol a má jinou strukturu.
  - `## Literatura k týdnu` – zdroje. Zobrazit na konci týdne.
- Odkazy v textu se otevírají v Google Chrome mimo aplikaci. Podrobnosti v sekci „Odkazy na zdroje“.
- Parser musí snést drobné odchylky (chybějící podsekce, dvě sekce „Případ“) a nesmí spadnout.
- Odkaz na týden, který ještě nemá soubor, zobraz jako zamčenou etapu s textem „Připravuje se“.

## Obrazovky

Spodní lišta se čtyřmi záložkami, ovladatelná palcem:

1. **Dnes** – pozdrav podle denní doby („Dobré ráno, Michale“), karta dnešní lekce (první neodškrtnutá), odhad „30 min“ a velké tlačítko „Začít“. Pod tím malý přehled: kolik lekcí hotovo, série dní v řadě.
2. **Trasa** – přehled celého kurzu (viz nápad s profilem etapy níže). Klepnutím na týden se otevře seznam jeho lekcí. Lekce jdou otevírat i mimo pořadí.
3. **Poznámky** – všechny odpovědi z částí „Na tvoje závody“, seskupené po týdnech. Tlačítko „Sdílet týden“ přes `navigator.share` (fallback: kopírovat do schránky). Michal je v lekci 5 skládá do jedné stránky.
4. **Slovníček** – všechny „Pojmy“ ze všech lekcí, abecedně, s vyhledáváním a odkazem zpět do lekce.

**Detail lekce:**
- Tenký ukazatel postupu čtení nahoře, ve stylu čáry trasy.
- Čitelná typografie. Základ 17–18 px, řádkování kolem 1,6, šířka textu do 65 znaků.
- Pod sekcí „Na tvoje závody“ textové pole na odpověď. Automaticky se ukládá a jde do záložky Poznámky.
- Na konci tlačítko „Dojel jsem do cíle“ pro odškrtnutí. Odškrtnutí půjde vrátit.

## Odkazy na zdroje

Každá studie, teorie a case study v lekcích má odkaz na zdroj. Michal si je bude často otevírat, takže to musí fungovat bez tření:

- **Všechny odkazy z Markdownu zachovej** a vykresli je jako klikatelné. Žádný se při parsování nesmí ztratit, ani v seznamech a závorkách.
- **Odkaz musí být na první pohled poznat.** Podtržení v akcentové barvě a malá ikona šipky ven za textem odkazu. Dotyková plocha minimálně 44 bodů na výšku (zvětši ji paddingem, nikoli velikostí písma).
- **Otevírání v Chromu:** Michal používá na iPhonu Google Chrome, takže externí odkazy se mají otevírat tam.
  - Na iOS se to dělá URL schématem Chromu: `https://…` → `googlechromes://…` (a `http://…` → `googlechrome://…`). Při klepnutí na odkaz přepiš adresu a otevři ji přes `window.location.href`. iOS se poprvé zeptá „Otevřít v Chromu?“, to je v pořádku.
  - Původní `https` adresu nech v atributu `href`. Dlouhé podržení odkazu tak nabídne běžné možnosti iOS (kopírovat, otevřít jinde).
  - **Pojistka:** v Nastavení přidej přepínač „Otevírat zdroje v Chromu“ (výchozí: zapnuto). Když je vypnutý, nebo když se Chrome do zhruba 1,5 s neotevře (stránka zůstala viditelná, `visibilitychange` nenastal), otevři odkaz normálně přes `target="_blank"`, `rel="noopener noreferrer"`.
  - Ověř na skutečném iPhonu v režimu aplikace na ploše. Odkaz se nesmí otevřít uvnitř okna PWA a zablokovat ho tak, že se nedá vrátit.
- **Návrat na stejné místo:** když se Michal z Chromu vrátí, lekce zůstane otevřená na stejné pozici. Pozici posunu ukládej při každém opuštění stránky (`visibilitychange`, `pagehide`) a obnov ji i v případě, že iOS aplikaci mezitím ukončil.
- **Zdroje lekce:** na konci každé lekce vygeneruj sekci „Zdroje této lekce“ se všemi odkazy z ní v pořadí výskytu, bez duplicit. Ke každému zobraz text odkazu a doménu (např. „sponsorship.org“), ať je jasné, kam vede.
- **Offline:** bez připojení se odkaz neotevře. Místo tichého selhání ukaž krátké upozornění „Zdroj se otevře, až budeš online.“
- **Placené zdroje:** některé odkazy vedou na abstrakt nebo stránku s předplatným (např. ProQuest, WARC). V obsahu jsou označené slovem „abstrakt“ nebo „shrnutí“. Aplikace s nimi zachází stejně jako s ostatními.

## Design

Minimalistický, klidný, přívětivý a osobní. Žádný generický dashboard ani sada barevných karet.

**Písmo:** nepoužívej Inter, systémové písmo ani Roboto.
- Nadpisy: **Fraunces** (variabilní serif, jemná optická velikost, mírně „měkké“ tvary).
- Text a UI: **Figtree**.
- Obě písma hostuj lokálně (woff2 v projektu), aby aplikace fungovala i offline. Žádné načítání z Google Fonts za běhu.

**Barvy:** definuj je jako CSS proměnné, ať je půjde snadno doladit.
- Světlý režim: teplý papír (kolem `#F6F2EA`), inkoust (kolem `#1D1C1A`), jedna výrazná barva. Navrhuji teplou šafránovou žluť, která odkazuje na žlutý dres lídra (kolem `#E2A33B`), jen na postup a hlavní akce.
- Tmavý režim podle systému: teplá tmavá (ne čistě černá), stejná akcentová barva o něco tlumenější.
- Kontrast textu minimálně WCAG AA.

**Designové vychytávky, cyklistické, ale nenápadné:**
1. **Kurz jako výškový profil etapového závodu.** Na záložce Trasa je celý kurz nakreslený jako profil závodu: jedna souvislá čára s kopci, 8 etap (týdnů) a 40 kilometrovníků (lekcí). Projetá část je v akcentové barvě, zbytek tence šedě. Tečka jezdce ukazuje, kde Michal je. Profil generuj jako SVG s pevným tvarem, aby vypadal pokaždé stejně. Na Dnes ho ukaž zmenšený.
2. **Průjezd cílem.** Po klepnutí na „Dojel jsem do cíle“ přes tlačítko krátce přejede pruh šachovnicové vlajky, tečka na profilu se posune a počítadlo hotových lekcí naskočí o jedna. Animace kolem 600 ms, decentní, bez konfet.
3. **Dresy za týdny.** Za dokončený týden Michal získá malou ikonu dresu, jednoduchou liniovou kresbu. Na Trase se sbírají v řadě. Dresy pro týdny 1–8 se mohou lišit detailem (pruh, puntíky, číslo).
4. **Série jako „dny v sedle“.** Počet dní v řadě s alespoň jednou dokončenou lekcí. Víkend sérii nepřerušuje.
5. **Pozdrav a tón.** Krátké lidské texty v češtině, tykání, žádný motivační patos. Příklad: „Dnes tě čeká lekce 3. Asi 30 minut.“
6. **Prázdné stavy.** Bez poznámek: „Zatím nic. Odpovědi z lekcí se objeví tady.“

**Pohyb:** všechny animace respektují `prefers-reduced-motion`. Přechody mezi obrazovkami jemné a krátké (do 250 ms). Kde to jde, použij View Transitions API.

## iPhone 17 Pro a chování jako aplikace

- Cílový viewport je zhruba 402 × 874 bodů s Dynamic Islandem nahoře a home indikátorem dole. Displej je ProMotion 120 Hz, takže animuj jen `transform` a `opacity`.
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` a všude respektuj `env(safe-area-inset-*)`. Obsah nesmí zajet pod Dynamic Island ani pod home indikátor. Spodní lišta sedí nad home indikátorem.
- PWA: `manifest.webmanifest` s `display: standalone`, názvem „Etapa“, barvami motivu a ikonami. Přidej `apple-touch-icon` (180 × 180) a `apple-mobile-web-app-status-bar-style`. Ikonu navrhni jednoduše: profil kopce s tečkou v akcentové barvě na papírovém pozadí.
- Service worker: aplikace a obsah fungují offline (precache buildu a všech souborů týdnů). Po nasazení nového týdne se nová verze načte při dalším otevření a v aplikaci se ukáže nenápadný pruh „Přibyl nový týden“.
- Dotykové cíle minimálně 44 × 44 bodů. Hlavní akce v dolní třetině obrazovky.
- Zakázat nechtěné zvětšování při psaní do pole: písmo inputu aspoň 16 px.
- Na webu v iOS nefungují vibrace (`navigator.vibrate`), takže na hmatové odezvě nic nestav.

## Data

- Postup, poznámky a sérii ukládej lokálně v zařízení (IndexedDB, případně localStorage), jen pro tohoto uživatele.
- Klíčuj lekce stabilním ID (`t1-l3`), ne pořadím v souboru. Úpravy textu lekce tak nesmažou postup.
- V Nastavení (ikona na obrazovce Dnes) přidej „Zálohovat“ (export JSON přes share sheet) a „Obnovit ze zálohy“. Data v aplikaci na ploše jsou oddělená od Safari a při smazání aplikace zmizí.
- Žádná analytika ani externí požadavky kromě odkazů, které otevře sám uživatel.

## Ranní připomínka

Webová aplikace na iOS neumí naplánovat lokální notifikaci. Web Push by vyžadoval server, a to tu nechceme. Řešení:
- V Nastavení přidej obrazovku „Ranní připomínka“ s krátkým českým návodem, jak si v aplikaci **Zkratky** vytvořit osobní automatizaci: Čas (např. 7:00, pracovní dny) → Zobrazit oznámení / Otevřít URL aplikace. Na URL přidej tlačítko „Kopírovat odkaz“.
- URL `/?dnes` otevře rovnou dnešní lekci.

## Technika

- Vite + TypeScript. Na UI stačí čisté TS nebo Preact, bez těžkého frameworku. Markdown parsuj při buildu (např. `marked` nebo `markdown-it`) do JSON, aby aplikace startovala hned.
- Nasazení zdarma s HTTPS na **GitHub Pages** (GitHub Action při pushi) nebo Netlify. Na konci mi napiš přesný postup a výslednou URL.
- README s návodem, jak přidat nový týden: vložit soubor do `content/`, commit, push.

## Hotovo je, když

1. Aplikace jde přes Safari na iPhonu přidat na plochu a otevírá se bez lišty prohlížeče.
2. Funguje offline.
3. Dnešní lekce se zobrazuje správně, odškrtnutí posune tečku na profilu a přidá dres po dokončení týdne.
4. Poznámky se ukládají, jde je sdílet, a záloha a obnova fungují.
5. Rozložení sedí na 402 × 874 bez přesahů pod Dynamic Island a home indikátor, ve světlém i tmavém režimu.
6. Přidání `content/tyden-2.md` a nový build zpřístupní týden 2 bez změny kódu.
7. Každý odkaz z `tyden-1.md` jde v aplikaci otevřít v Chromu a po návratu je lekce na stejném místě. Ověř na všech odkazech týdne 1.

Než začneš psát kód, krátce shrň plán a zeptej se mě jen na to, co z tohoto zadání nejde vyčíst.
