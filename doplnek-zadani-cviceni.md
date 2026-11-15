# Doplněk zadání: nová struktura lekcí a interaktivní cvičení

Aplikace Etapa běží a funguje. Obsah kurzu jsem přepracoval: lekce jsou delší a hlubší a místo jedné otázky obsahují interaktivní cvičení. Tento doplněk popisuje, co je potřeba v aplikaci upravit. Všechno ostatní z původního zadání platí dál.

Nový soubor `tyden-1.md` nahraď za stávající `content/tyden-1.md`.

## 1. Nová struktura lekce

Každá lekce (`## Lekce N – název`) teď může obsahovat tyto podsekce v tomto pořadí:

- `### Výklad` – delší text, uvnitř podnadpisy `####`.
- `### Případ 1: …`, `### Případ 2: …` – jeden nebo dva rozebrané případy.
- `### Primární zdroj (10 minut)` – volitelná sekce, zatím jen v lekci 3.
- `### Cvičení` – jeden nebo víc bloků `cviceni` (viz níže).
- `### Pojmy` – seznam ve formátu `**pojem** – vysvětlení`, stejně jako dosud.

Lekce 5 má jen úvodní odstavce a jeden blok `cviceni`.

Týden začíná sekcí `## Jak s lekcemi pracovat` a končí `## Literatura k týdnu`. Obojí zůstává jako dosud.

**Zpětná kompatibilita:** parser musí dál zvládat i staré sekce `### Teorie` a `### Na tvoje závody` a nesmí spadnout na neznámé podsekci, prostě ji zobrazí jako text. Starší odpovědi uložené k sekci „Na tvoje závody“ nemaž. V záložce Poznámky je zobraz pod nadpisem „Starší odpovědi“.

**Navigace v dlouhé lekci:** pod nadpisem lekce zobraz řadu malých štítků (Výklad, Případy, Primární zdroj, Cvičení, Pojmy), které skočí na danou sekci. Zobrazuj jen ty, které lekce obsahuje. Při posunu dolů se objeví nenápadné tlačítko „nahoru“.

**Odhad času:** žádný pevný text „30 min“. Počítej ho: počet slov výkladu, případů a primárního zdroje vyděl 180 (rychlost pozorného čtení odborného textu v češtině) a přičti 2 minuty za každé cvičení typu `volba`, `rozrad` nebo `skala`, 4 minuty za `odpoved` a 10 minut za `kroky`. Zaokrouhli na celých 5 minut a zobraz jako „≈ 30 min“. Stejný údaj použij na obrazovce Dnes.

## 2. Formát cvičení

Cvičení jsou v Markdownu zapsaná jako blok kódu s jazykem `cviceni`. Obsah je YAML:

````
```cviceni
typ: volba
id: t1-l1-c2
...
```
````

- Parsuj při buildu (např. `js-yaml`) a ulož do JSON spolu s lekcí.
- Validuj: pokud blok chybí `typ` nebo `id`, má neznámý typ nebo nesedí struktura, **build selže** s jasnou hláškou (soubor, lekce, id cvičení, co je špatně). V produkci nesmí nikdy vzniknout rozbitá karta.
- `id` jsou stabilní a jedinečné napříč kurzem. Odpovědi se ukládají pod `id`, takže úprava textu cvičení odpovědi nesmaže.

Pět typů:

### `rozrad` – třídění do kategorií

```yaml
typ: rozrad
id: t1-l1-c1
zadani: Text zadání
kategorie: [Kategorie A, Kategorie B, Kategorie C]
polozky:
  - text: Položka
    spravne: Kategorie A
    vysvetleni: Proč
```

### `volba` – výběr jedné odpovědi

```yaml
typ: volba
id: t1-l1-c2
otazka: Text otázky
moznosti:
  - text: Odpověď
    spravne: true
    vysvetleni: Proč
```

### `skala` – hodnocení položek na stupnici 1–5 (bez správných odpovědí)

```yaml
typ: skala
id: t1-l2-c3
zadani: Text zadání
min_popis: Popis hodnoty 1
max_popis: Popis hodnoty 5
polozky: [Položka 1, Položka 2]
```

### `odpoved` – krátká textová odpověď

```yaml
typ: odpoved
id: t1-l2-c4
zadani: Text zadání
napoveda: Text placeholderu
```

### `kroky` – průvodce po krocích

```yaml
typ: kroky
id: t1-l3-c2
nazev: Název
kroky:
  - otazka: Otázka
    typ: text            # nebo: volba
    napoveda: Placeholder   # u typu text
    moznosti: [A, B]        # u typu volba
```

## 3. Jak mají cvičení vypadat a fungovat na iPhonu

Obecně: všechno se ovládá palcem, žádné přetahování ani drobné prvky. Karty cvičení mají stejný klidný styl jako zbytek aplikace (Fraunces na nadpisy, Figtree na text, papírové pozadí, šafránový akcent jen pro hlavní akce a správné odpovědi). Žádná červená pro chybu. Chybnou odpověď označ tlumeně a hned ukaž vysvětlení, cílem je učení, ne známka.

**`rozrad`**
- Položky se zobrazují po jedné jako velká karta uprostřed. Kategorie jsou pod ní jako široká tlačítka přes celou šířku v dolní třetině obrazovky.
- Po klepnutí na kategorii se karta otočí nebo rozbalí a ukáže, jestli to sedí, a vysvětlení. Tlačítko „Další“.
- Žádné drag & drop: na mobilu koliduje se scrollováním.
- Na konci krátké shrnutí („5 ze 7“) a tlačítko „Zkusit znovu“.

**`volba`**
- Možnosti jako velké klikací karty pod sebou.
- Po výběru se ukáže správná odpověď a vysvětlení u zvolené i u správné možnosti. Výběr se zamkne, „Zkusit znovu“ ho resetuje.

**`skala`**
- Každá položka má pod sebou řadu pěti velkých segmentových tlačítek 1–5. Posuvník nepoužívej, na telefonu se špatně trefuje.
- Popisky `min_popis` a `max_popis` zobraz jednou nad seznamem.
- Hodnoty se ukládají hned.

**`odpoved`**
- Textové pole, které roste s textem, placeholder z `napoveda`, písmo aspoň 16 px.
- Automatické ukládání a decentní „Uloženo“.
- Při otevřené klávesnici musí být pole celé vidět. Použij `visualViewport` a posuň obsah tak, aby klávesnice nic nepřekryla. Tlačítko „Hotovo“ klávesnici zavře.

**`kroky`**
- Spustí se tlačítkem „Začít“ a otevře se přes celou obrazovku jako průvodce: jedna otázka na obrazovku, nahoře tenký ukazatel postupu (ve stylu čáry trasy), dole „Zpět“ a „Další“ těsně nad klávesnicí.
- Typ `text` = textové pole, typ `volba` = velké klikací karty.
- Odpovědi se ukládají průběžně. Když průvodce zavřeš, příště pokračuješ tam, kde jsi skončil.
- Na konci se ukáže **souhrnná karta** se všemi odpověďmi, hezky naformátovaná (otázka drobně, odpověď výrazně). Tlačítko „Sdílet“ pošle kartu jako čistý text přes `navigator.share` (fallback: kopírovat do schránky). Tlačítko „Upravit“ vrátí průvodce na první krok.

## 4. Poznámky, záloha, dokončení lekce

- Do záložky **Poznámky** přidej odpovědi z `odpoved`, celé souhrny z `kroky` a hodnocení ze `skala`, seskupené po týdnech a lekcích. U `rozrad` a `volba` stačí výsledek („5 ze 7“).
- **Záloha a obnova** musí zahrnovat i odpovědi na cvičení.
- Tlačítko **„Dojel jsem do cíle“** zůstává vždy dostupné. Pokud v lekci zbývají nevyplněná cvičení, ukaž nad ním jemnou poznámku („Zbývají 2 cvičení“). Dokončení neblokuj.

## 5. Hotovo je, když

1. Nový `tyden-1.md` se sestaví bez chyb a všech 5 lekcí se zobrazí se správnými sekcemi a štítky navigace.
2. Všechna cvičení v týdnu 1 (rozrad, volba, skala, odpoved, kroky) fungují na 402 × 874 ve světlém i tmavém režimu, bez přesahů pod Dynamic Island a home indikátor.
3. Při psaní do `odpoved` i do textových kroků nepřekrývá klávesnice pole ani tlačítka.
4. Odpovědi přežijí zavření aplikace, jsou v Poznámkách a v záloze.
5. Odhad času se počítá podle vzorce a liší se mezi lekcemi.
6. Úmyslně rozbitý blok `cviceni` (např. chybějící `id`) zastaví build se srozumitelnou chybou.
7. Postup dosavadních lekcí (stabilní ID `t1-l1` až `t1-l5`) zůstal zachován.

Než začneš, shrň plán změn. Na konci napiš, co jsi změnil a jak to otestovat na iPhonu.
