# Pokédex – Code-Dokumentation

Diese Datei erklärt, **was jede Datei im Projekt macht** und **wie die Teile zusammenspielen**.
Sie ist so aufgebaut, dass du sie von oben nach unten lesen kannst (Überblick → Aufbau →
Abläufe → Details) oder gezielt einzelne Abschnitte nachschlägst.

> Stand dieser Doku: 25.09.2026, Code-Stand: Commit `f5c6103`. Wenn du den Code später
> stark änderst, prüfe vor allem die Abschnitte 4 bis 8 auf Aktualität.

## Inhaltsverzeichnis

1. [Was ist dieses Projekt?](#1-was-ist-dieses-projekt)
2. [Projekt lokal starten](#2-projekt-lokal-starten)
3. [Ordnerstruktur](#3-ordnerstruktur)
4. [Architektur: Wie die Teile zusammenspielen](#4-architektur-wie-die-teile-zusammenspielen)
5. [Abläufe Schritt für Schritt](#5-abläufe-schritt-für-schritt)
6. [Die PokéAPI: Welche Daten woher kommen](#6-die-pokéapi-welche-daten-woher-kommen)
7. [JavaScript: Datei für Datei](#7-javascript-datei-für-datei)
8. [CSS: Datei für Datei](#8-css-datei-für-datei)
9. [HTML-Dateien](#9-html-dateien)
10. [Wichtige Konzepte erklärt](#10-wichtige-konzepte-erklärt)
11. [Anleitungen: So erweiterst du das Projekt](#11-anleitungen-so-erweiterst-du-das-projekt)
12. [Deployment und Hilfsdateien](#12-deployment-und-hilfsdateien)
13. [Auffälligkeiten im aktuellen Code](#13-auffälligkeiten-im-aktuellen-code)
14. [Glossar](#14-glossar)

---

## 1. Was ist dieses Projekt?

Ein **Pokédex im Browser**: Eine Übersicht aller Pokémon als bunte Karten, eine Suche und
ein Popup mit allen Details zu einem Pokémon.

**Was die Seite kann**

- Alle Pokémon als Karten anzeigen, jeweils 20 auf einmal ("Mehr fangen") oder alle
  blockweise ("Alle anzeigen").
- Nach dem Namen suchen (die Liste aktualisiert sich kurz nach dem Tippen).
- Auf eine Karte klicken: Ein Popup zeigt Bild, Typen, Nummer, Generation und fünf Tabs:
  **About**, **Stats**, **Evolution**, **Matchups**, **Moves**.
- Im Popup: zum vorherigen/nächsten Pokémon blättern (Knöpfe oder Pfeiltasten), das
  Shiny-Bild ansehen, den Schrei abspielen, mit `Esc` schließen.
- Beim Darüberfahren über eine Karte wechselt das Bild zur Shiny-Version.

**Technik in einem Satz:** reines HTML, CSS und JavaScript, **ohne Framework, ohne Build-Tool,
ohne `package.json`, ohne eigenes Backend**. Die Daten kommen live von der
[PokéAPI](https://pokeapi.co/), die Sprites aus dem GitHub-Repository der PokéAPI. Die
Schriften liegen lokal im Ordner `fonts/` (es werden keine Schriften von Google o. Ä. geladen).

**Was es nicht gibt:** keine automatischen Tests, keine Speicherung im Browser
(`localStorage`, Cookies), keine Benutzerkonten. Das passt zur
[Datenschutzerklärung](../datenschutzt.html) der Seite.

**Browser:** Es wird modernes CSS/JS benutzt (`color-mix()`, `:where()`, `backdrop-filter`,
`Array.at()`, `IntersectionObserver` …). Aktuelle Versionen von Chrome, Firefox, Safari
und Edge genügen.

---

## 2. Projekt lokal starten

Es gibt nichts zu installieren und nichts zu bauen. Du brauchst nur eine **Internetverbindung**
(wegen der PokéAPI).

**Variante A – am einfachsten:** `index.html` per Doppelklick im Browser öffnen.

**Variante B – sauberer, mit kleinem lokalen Server** (verhält sich wie die echte Seite):

```bash
cd /Users/hamidou/Documents/Pokemon
python3 -m http.server 8000
# dann im Browser: http://localhost:8000
```

Alternativ die VS-Code-Erweiterung "Live Server" benutzen.

**Fehler ansehen:** Öffne die Entwicklerwerkzeuge (`Cmd + Option + I`) → Tab *Console*.
Der Code schreibt Fehler dorthin (`console.error`) und zeigt dem Nutzer zusätzlich eine
kurze Meldung.

---

## 3. Ordnerstruktur

```text
Pokemon/
├── index.html                  Die einzige Seite der App (Startpunkt)
├── Impressum.html              Rechtliche Seite
├── datenschutzt.html           Rechtliche Seite (Dateiname mit "t", siehe Abschnitt 13)
│
├── css/                        Alle Stile, aufgeteilt nach Bereichen
│   ├── base.css                Schriften, Grundwerte, Seitenhintergrund
│   ├── layout.css              Kopfzeile, Suchfeld, Kartenraster, Fußzeile
│   ├── buttons.css            "Mehr fangen" / "Alle anzeigen"
│   ├── pokemon-cards.css       Die Karten der Übersicht + Typ-Plaketten
│   ├── pokemon-detail.css      Das Popup (Rahmen, Kopf, Tab-Leiste, Animationen)
│   ├── bars.css                Balken und Radar-Diagramm (Stats-Tab)
│   ├── about.css               About-Tab (und geteilte Bausteine)
│   ├── evolution.css           Evolution-Tab
│   ├── matchups.css            Matchups-Tab
│   ├── moves.css               Moves-Tab (Spielauswahl, Filter, Attacken-Karten)
│   ├── legal.css               Impressum und Datenschutz
│   └── utilities.css           Nur die Klasse .hidden (muss zuletzt geladen werden)
│
├── js/                         Alle Logik
│   ├── configuration.js        Konstanten, Icons, Typ-Farben
│   ├── state.js                Gemeinsamer Zustand (globale Variablen)
│   ├── text-and-image-helpers.js   Kleine Helfer für Texte, Farben, Bild-URLs
│   ├── data-loading.js         Daten von der API holen (mit Cache)
│   ├── components.js           HTML-Bausteine, die mehrere Tabs nutzen
│   ├── pokemon-list.js         Übersicht: Start, Suche, Karten, Nachladen
│   ├── pokemon-detail.js       Popup: Öffnen, Tabs, Blättern, Tastatur
│   └── tabs/                   Ein Tab pro Datei
│       ├── about.js
│       ├── stats.js
│       ├── evolution.js
│       ├── matchups.js
│       ├── moves.js
│       └── moves-game-select.js   Die Spiel-Auswahl des Moves-Tabs
│
├── fonts/                      Schriftdateien (.woff2), lokal eingebunden
├── images/
│   ├── pokemon.webp            Logo und Favicon (Pokéball)
│   └── search.svg              Lupe im Suchfeld
│
├── Dokumentation/              Diese Doku und die Anleitungen zu Deployment/Tailwind
├── .github/
│   ├── workflows/deploy.yml    Automatisches Deployment bei Push auf main
│   └── dependabot.yml          Hält die GitHub-Actions aktuell
├── up.sh                       Kurzbefehl: pull, add, commit, push
├── plan.drawio                 Frühe Skizze (kein Teil der Seite)
└── .gitignore                  Schützt Schlüssel und Zugangsdaten vor dem Einchecken
```

**Empfohlene Lesereihenfolge des Codes** (von einfach nach komplex):

1. `configuration.js` → `state.js` → `text-and-image-helpers.js` (Grundlagen)
2. `data-loading.js` → `components.js` (Daten holen, Bausteine)
3. `pokemon-list.js` (die Übersicht)
4. `pokemon-detail.js` (das Popup und das Tab-System)
5. `tabs/about.js` → `stats.js` → `matchups.js` → `evolution.js` → `moves.js` → `moves-game-select.js`

---

## 4. Architektur: Wie die Teile zusammenspielen

### 4.1 Keine Module, alles teilt sich einen globalen Bereich

Der Code benutzt **keine** `import`/`export`-Module. Jede Datei wird mit einem normalen
`<script defer src="...">` geladen. Dadurch gilt:

- Alle Funktionen und Variablen auf oberster Ebene sind **überall sichtbar**. Eine Funktion aus
  `text-and-image-helpers.js` kann direkt in `about.js` benutzt werden.
- **Namen müssen eindeutig sein.** Zwei Dateien dürfen nicht denselben Namen deklarieren.
  Bei `const`/`let` gibt es dann einen Fehler in der Konsole. Bei `function` gewinnt dagegen
  **still die spätere Datei**, was schwerer zu finden ist. Deshalb haben die Namen so
  ausführliche, sprechende Formen (`fetchAllPokemonNamesAndIds`, `moveCardHtml` …).
- **Die Reihenfolge der `<script>`-Tags in `index.html` ist wichtig.** Was eine Datei
  beim Laden sofort benutzt, muss in einer Datei *darüber* stehen. Funktionen, die erst
  später aufgerufen werden (z. B. bei einem Klick), dürfen auch weiter unten definiert sein.
- HTML-Attribute wie `onclick="openPokemonDetail(25)"` rufen diese globalen Funktionen auf.

`defer` bedeutet: Die Skripte laden parallel, laufen aber erst, **nachdem** der HTML-Text
fertig gelesen wurde, und zwar **in der Reihenfolge der Tags**. Deshalb kann
`pokemon-list.js` gleich zu Beginn `document.getElementById("search-input")` benutzen.

### 4.2 Ladereihenfolge und wer wen braucht

| Nr. | Datei | Braucht | Stellt bereit |
| --- | --- | --- | --- |
| 1 | `configuration.js` | nichts | URLs, Seitengrößen, `icons`, Typ-Farben, `allTypeNames` |
| 2 | `state.js` | nichts | gemeinsame Zustandsvariablen |
| 3 | `text-and-image-helpers.js` | 1 | Formatierung, Farb- und Bild-Helfer |
| 4 | `data-loading.js` | 1 | `fetchJsonWithCache`, `fetchPokemonById` |
| 5 | `components.js` | 1, 3 | Balken, Typ-Plakette, Tab-Meldung |
| 6 | `pokemon-list.js` | 1–5 | Start, Suche, Karten, Nachladen |
| 7 | `pokemon-detail.js` | 1–6 | Popup, `registerTab`, `showTab` |
| 8 | `tabs/about.js` | 1–7 | registriert den Tab "About" |
| 9 | `tabs/stats.js` | 1–7 | registriert "Base-Stats" |
| 10 | `tabs/evolution.js` | 1–7 | registriert "Evolution" |
| 11 | `tabs/matchups.js` | 1–7 | registriert "Matchups" |
| 12 | `tabs/moves.js` | 1–7 | registriert "Moves" |
| 13 | `tabs/moves-game-select.js` | 12 | Spiel-Auswahl (nutzt Variablen aus `moves.js`) |

Die **Reihenfolge der Tabs im Popup** ist die Reihenfolge der Tab-Skripte in `index.html`
(Punkte 8 bis 12). Mehr dazu in [Abschnitt 7.7](#77-jstabs--die-fünf-tabs).

### 4.3 Schichtenbild

```text
                        index.html
                            │  <body onload="initializePokedex()">
                            ▼
   ┌─────────────────────────────────────────────────────────────┐
   │  pokemon-list.js   Übersicht: Suche, Karten, Nachladen      │
   └───────────────┬─────────────────────────────────────────────┘
                   │ Klick auf Karte: openPokemonDetail(id)
                   ▼
   ┌─────────────────────────────────────────────────────────────┐
   │  pokemon-detail.js   Popup + Tab-System (registerTab/showTab)│
   └───────────────┬─────────────────────────────────────────────┘
                   │ ruft je Tab: tab.render(pokemon)
                   ▼
   ┌─────────────────────────────────────────────────────────────┐
   │  tabs/about · stats · evolution · matchups · moves          │
   └───────────────┬─────────────────────────────────────────────┘
                   │ benutzen alle
                   ▼
   ┌─────────────────────────────────────────────────────────────┐
   │  Grundlagen: configuration · state · text-and-image-helpers │
   │              data-loading · components                      │
   └───────────────┬─────────────────────────────────────────────┘
                   ▼
              PokéAPI (Internet)
```

`pokemon-list.js` und `pokemon-detail.js` kennen sich gegenseitig: Die Liste öffnet das
Popup, das Popup meldet der Liste über `updateLoadButtonsVisibility()`, dass die Knöpfe
"Mehr fangen"/"Alle anzeigen" verschwinden sollen, solange es offen ist.

### 4.4 Wie aus Daten ein Bildschirminhalt wird

Der ganze Code folgt demselben Muster:

```text
API-Daten (JSON)  →  Funktion baut einen HTML-Text  →  innerHTML  →  CSS gestaltet ihn
```

- Fast alle Funktionen, die auf `...Html` enden, **geben HTML als Text zurück** (Template-
  Strings mit Backticks). Der Kommentar `/* html */` direkt vor dem Backtick ist nur
  ein Hinweis für den Editor (Syntax-Farben), er hat keine Wirkung.
- Große Bausteine setzen sich aus kleinen zusammen (`pokemonCardHtml` ruft
  `pokemonCardHeadingHtml` und `pokemonCardTypesAndImageHtml` auf …). Jede Funktion macht nur eine Sache.
- Das fertige HTML wird per `innerHTML` oder `insertAdjacentHTML` in die Seite gesetzt.
- **Zur Sicherheit:** Die Texte stammen aus der PokéAPI. Der Text aus dem Suchfeld wird
  nur zum Vergleichen (`includes`) benutzt und **nie** als HTML eingefügt. Würdest du später
  Texte von Nutzern anzeigen, müssten sie zuerst maskiert werden.

### 4.5 Der Aufbau des Popups (DOM)

```text
#detail-overlay                        dunkler, unscharfer Hintergrund (index.html)
└─ .detail-card                        die Karte (role="dialog"), trägt die Typ-Farben
   ├─ .detail-header                   Kopf mit Farbverlauf des Typs
   │  ├─ .detail-pokeball-watermark    drehender Pokéball im Hintergrund
   │  ├─ .detail-toolbar               Zurück/Weiter  |  Shiny, Schrei, Schließen
   │  ├─ .detail-hero                  Name, Nummer, Untertitel, Typen  |  großes Bild
   │  └─ .detail-tab-bar               ein Knopf pro Tab
   └─ .detail-body                     der scrollbare Inhalt
      ├─ #About        .tab-panel      (anfangs leer und versteckt)
      ├─ #Base-Stats   .tab-panel
      ├─ #Evolution    .tab-panel
      ├─ #Matchups     .tab-panel
      └─ #Moves        .tab-panel
```

Alle fünf Tab-Container existieren sofort, sind aber leer und mit `.hidden` versteckt.
Ihr Inhalt wird erst beim ersten Öffnen des Tabs erzeugt.

---

## 5. Abläufe Schritt für Schritt

### 5.1 Start der Seite

1. Der Browser lädt `index.html` und die Stylesheets.
2. Die Skripte (`defer`) laufen der Reihe nach. Dabei legen sie nur Funktionen und Konstanten an;
   `pokemon-list.js` sucht die festen HTML-Elemente. Die Tab-Dateien rufen `registerTab()` auf.
3. Wenn die Seite fertig geladen ist, ruft `<body onload="initializePokedex()">` den Start auf.
4. `initializePokedex()` holt zuerst die **Gesamtzahl** der Pokémon
   (`/pokemon?limit=1`) und dann in **einer** Anfrage die Namen und URLs **aller**
   Pokémon (`/pokemon?limit=<Anzahl>`). Daraus entsteht `allPokemonNamesAndIds`
   (Einträge der Form `{ pokemonId, name }`). Das sind nur Namen, noch keine Details.
5. `runSearch()` läuft mit leerem Suchfeld: Alle Pokémon passen, die ersten 20 werden
   geladen (`/pokemon/<id>` je Pokémon) und als Karten angezeigt.
6. Schlägt etwas fehl: Meldung "The Pokémon could not be loaded. Please reload the page."

### 5.2 Suche

1. Bei jedem Tastendruck ruft das Suchfeld `scheduleSearch()` auf (`oninput`).
2. `scheduleSearch()` setzt einen Timer von **250 ms** zurück und neu. Erst wenn so lange
   nicht getippt wurde, läuft `runSearch()` (Entprellen, im Englischen *debounce*).
3. `runSearch()` filtert `allPokemonNamesAndIds` nach Namen, die den Suchtext **enthalten**
   (Kleinschreibung, Leerzeichen am Rand entfernt), setzt `displayedPokemonCount = 0`,
   entfernt alle alten Karten und lädt die erste Seite der Treffer.

Die Suche prüft nur den **englischen API-Namen** (z. B. `mr-mime` mit Bindestrich), nicht
die Nummer und nicht den Typ.

### 5.3 "Mehr fangen" und "Alle anzeigen"

- **Mehr fangen:** `loadNextPokemonPage()` lädt die nächsten `pokemonPerPage` (20) Treffer.
- **Alle anzeigen:** `loadAllRemainingPokemon()` lädt alle übrigen Treffer in Blöcken zu
  `pokemonPerLoadAllBatch` (50). Jeder Block erscheint sofort, die Seite wächst also nach
  und nach. Der Knopf zeigt den Fortschritt ("Lade 150 / 1300") und beide Knöpfe sind gesperrt.
- Nach jedem Ladevorgang entscheidet `updateLoadButtonsVisibility()`: Die Knöpfe sind nur
  sichtbar, wenn es noch weitere Treffer gibt **und** kein Popup offen ist.
- Klickt der Nutzer währenddessen etwas anderes an (z. B. eine neue Suche), werden die
  laufenden Ladevorgänge **verworfen** (siehe [Request-Nummern](#103-veraltete-anfragen-verwerfen-request-nummern)).

### 5.4 Ein Popup öffnen

1. Klick auf eine Karte → `openPokemonDetail(pokemonId)`.
2. Die Funktion zählt `latestDetailRequestNumber` hoch und lädt das Pokémon
   (`fetchPokemonById`). Meist ist es schon im Cache, weil die Karte es geladen hat.
3. Wurde inzwischen ein anderes Pokémon angeklickt oder das Popup geschlossen, endet die
   Funktion still.
4. `displayPokemonDetail(pokemon)`:
   - merkt sich das Pokémon in `pokemonInDetailView`,
   - baut das komplette Popup (`pokemonDetailHtml`) und setzt es in `#detail-overlay`,
   - setzt die Klasse `first-open` **nur beim ersten Öffnen** (Einblend-Animation), nicht beim
     Blättern von Pokémon zu Pokémon,
   - blendet das Overlay ein und dunkelt die Übersicht ab (`.pokedex-dimmed`),
   - öffnet den **ersten** Tab (`showTab(registeredTabs[0].tabId)`),
   - lädt im Hintergrund die "Species"-Daten für die Zeile unter dem Namen
     ("Seed Pokémon · Generation I · ★ Legendary").
5. `preloadNeighbourPokemon` lädt das vorherige und nächste Pokémon schon vor, damit das
   Blättern sofort reagiert.

### 5.5 Einen Tab öffnen

`showTab(tabId)` in `pokemon-detail.js`:

1. Alle Tabs werden auf aktiv/inaktiv gesetzt (Klasse `.active`, `aria-selected`, `.hidden`).
2. Der Inhalt scrollt nach oben.
3. Wurde der Tab für dieses Pokémon **schon gebaut** (`data-rendered`), ist man fertig.
4. Sonst wird `tab.render(pokemon)` aufgerufen:
   - Liefert `render` **Text**, wird er sofort angezeigt.
   - Liefert `render` ein **Promise** (der Tab muss erst Daten laden), zeigt das Popup
     "Loading..." und wartet.
5. Ist das Pokémon inzwischen ein anderes, wird das Ergebnis verworfen.
6. Der HTML-Text wird eingesetzt, danach läuft optional `tab.afterRender(tabPanel)`.
7. Bei einem Fehler erscheint "The details could not be loaded." und der Tab darf durch
   erneutes Anklicken noch einmal versucht werden.

### 5.6 Blättern, Schließen, Tastatur

- **Blättern:** Pfeil-Knöpfe im Kopf oder `←` / `→`. `getNeighbourPokemonId` läuft über die
  **Position in der Liste**, nicht über `id ± 1`, weil die IDs bei den Sonderformen auf
  10001+ springen. Nach dem letzten Pokémon geht es wieder beim ersten los (und umgekehrt).
- **Schließen:** Knopf ✕, `Esc` oder ein Klick auf den dunklen Hintergrund
  (`closeDetailIfOverlayClicked` schließt nur, wenn wirklich der Hintergrund getroffen
  wurde, nicht die Karte).
- Pfeiltasten werden ignoriert, wenn der Fokus in einem Eingabefeld liegt, und Tasten mit
  `Ctrl`/`Alt`/`Cmd` gehören dem Browser.

### 5.7 Der Moves-Tab im Detail

1. `movesHtml(pokemon)` sortiert die Attacken des Pokémon **nach Spiel und Lernart**
   (`buildLearnsetPerGame`). Ergebnis in `learnsetPerGame`, neuestes Spiel zuerst.
2. Vorausgewählt wird das neueste Spiel, das Level-up-Attacken kennt
   (`findNewestGameWithLevelUpMoves`).
3. Der Tab zeigt oben die **Spiel-Auswahl** (`moves-game-select.js`), darunter die Filter
   (Level up, TM/HM, Egg, Tutor, Other, je mit Anzahl) und die Liste als Karten.
4. Jede Karte zeigt sofort Level und Name. Typ, Kategorie, Power, Genauigkeit, AP und
   Beschreibung werden **erst nachgeladen, wenn die Karte fast sichtbar ist**
   (`IntersectionObserver`). Bei über 100 Attacken wären das sonst über 100 Anfragen auf einmal.
5. Wechselt der Nutzer Spiel oder Filter, baut `renderMovesView()` Filter und Liste neu
   und startet die Beobachtung neu. Die Spiel-Auswahl selbst bleibt bestehen.

---

## 6. Die PokéAPI: Welche Daten woher kommen

Basis-URL: `https://pokeapi.co/api/v2` (Konstante `pokeApiBaseUrl` in `configuration.js`).

| Endpunkt | Geladen von | Wofür |
| --- | --- | --- |
| `/pokemon?limit=1&offset=0` | `fetchTotalPokemonCount` | nur das Feld `count` (Gesamtzahl) |
| `/pokemon?limit=<count>&offset=0` | `fetchAllPokemonNamesAndIds` | Namen und URLs aller Pokémon für die Suche |
| `/pokemon/<id>` | `fetchPokemonById` | Karte, Popup-Kopf, Stats, Typen, Fähigkeiten-Liste, Attacken-Liste, Bilder, Schrei |
| `pokemon.species.url` (`/pokemon-species/<id>`) | About-Tab, Evolution-Tab, Untertitel | Beschreibung, Ei-Zyklus, Geschlecht, Ei-Gruppen, Gattung, Generation, "legendär" |
| `species.evolution_chain.url` | Evolution-Tab | die Entwicklungskette |
| `pokemon.location_area_encounters` | About-Tab | Fundorte |
| `abilityEntry.ability.url` (`/ability/<id>`) | About-Tab | Beschreibung jeder Fähigkeit |
| `typeEntry.type.url` (`/type/<id>`) | Matchups-Tab | `damage_relations` (wer wie viel Schaden macht) |
| `/move/<name>` | Moves-Tab | Typ, Kategorie, Power, Genauigkeit, AP, Beschreibung |

**Bilder** (`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon`,
Konstante `pokemonSpriteBaseUrl`):

- Karten und Popup benutzen die **URLs, die schon im `/pokemon/<id>`-Ergebnis stehen**
  (`sprites.other.showdown`, `dream_world`, `official-artwork`, …). Mehr dazu in
  [text-and-image-helpers.js](#74-jstext-and-image-helpersjs).
- Der Evolution-Tab baut die Bild-URL selbst: `<Basis>/other/official-artwork/<id>.png`.

**Der Cache:** Jede URL wird pro Seitenaufruf nur **einmal** geladen
(`responseCacheByUrl` in `data-loading.js`). Der Cache lebt nur im Arbeitsspeicher und
ist nach einem Neuladen der Seite weg. Er wird nirgends dauerhaft gespeichert.

---

## 7. JavaScript: Datei für Datei

### 7.1 `js/configuration.js`

**Zweck:** Alle festen Werte an einem Ort. Wer etwas anpassen will (Seitengröße, Farben,
Icons), sucht zuerst hier.

| Name | Bedeutung |
| --- | --- |
| `pokeApiBaseUrl` | Basis-URL der PokéAPI |
| `pokemonSpriteBaseUrl` | Basis-URL der Sprite-Bilder auf GitHub |
| `pokemonPerPage` | 20 – so viele Pokémon kommen pro Klick auf "Mehr fangen" dazu |
| `pokemonPerLoadAllBatch` | 50 – Blockgröße bei "Alle anzeigen" |
| `searchDelayMilliseconds` | 250 – Wartezeit nach dem letzten Tastendruck, bevor gesucht wird |
| `fallbackTypeColor` | `"blue"` – Farbe, falls ein Typ nicht in den Tabellen steht |
| `pokemonCardWrapperClassName` | CSS-Klasse der Karten-Hülle; wird auch zum Entfernen der Karten benutzt |
| `noDescriptionText` | Text, wenn die API keine Beschreibung liefert |
| `strokeIconSvg(shapes)` | Hilfsfunktion: verpackt SVG-Formen in ein 24×24-Strich-Icon |
| `icons` | Alle Icons als SVG-Text: `previous`, `next`, `close`, `sound`, `sparkle`, `about`, `stats`, `evolution`, `matchups`, `moves`, `check`, `chevronDown`, `pokeball` |
| `mainColorByTypeName` | Hauptfarbe je Typ (Plakette und Beginn des Farbverlaufs) |
| `gradientEndColorByTypeName` | Endfarbe des Farbverlaufs je Typ |
| `allTypeNames` | Alle Typnamen (aus den Schlüsseln von `mainColorByTypeName`); der Matchups-Tab rechnet damit |

Die Icons erben ihre Farbe vom umgebenden Text (`stroke="currentColor"`).

### 7.2 `js/state.js`

**Zweck:** Die globalen Variablen, die `pokemon-list.js` und `pokemon-detail.js` gemeinsam
lesen und ändern.

| Variable | Bedeutung |
| --- | --- |
| `allPokemonNamesAndIds` | `{ pokemonId, name }` aller Pokémon, einmal beim Start geladen |
| `searchResults` | Der Teil davon, der zur aktuellen Suche passt |
| `displayedPokemonCount` | Wie viele der `searchResults` schon als Karten auf der Seite stehen |
| `pokemonInDetailView` | Das Pokémon des offenen Popups, `null` wenn es geschlossen ist |
| `latestListRequestNumber` | Nummer des letzten Listen-Ladevorgangs (ältere werden verworfen) |
| `latestDetailRequestNumber` | Dasselbe für das Popup |
| `searchDelayTimerId` | Timer-ID der Such-Verzögerung |

### 7.3 `js/data-loading.js`

**Zweck:** Alles, was mit dem Laden von Daten aus dem Netz zu tun hat, mit Cache.

| Funktion | Aufgabe |
| --- | --- |
| `fetchJsonWithCache(url)` | **Die** Ladefunktion für alle. Lädt eine URL nur einmal und gibt danach das gemerkte Ergebnis zurück |
| `fetchJsonAndForgetFailure(url)` | Wirft eine fehlgeschlagene Anfrage wieder aus dem Cache, damit ein neuer Versuch möglich ist |
| `fetchJsonFromNetwork(url)` | Der eigentliche `fetch` |
| `readJsonOrThrow(response, url)` | Wirft einen Fehler bei HTTP-Status außerhalb von 200–299, sonst liefert es das JSON |
| `fetchPokemonById(id)` | Kurzform für `/pokemon/<id>` |

### 7.4 `js/text-and-image-helpers.js`

**Zweck:** Kleine, unabhängige Helfer.

| Funktion | Aufgabe |
| --- | --- |
| `capitalizeFirstLetter(text)` | erster Buchstabe groß |
| `formatNameForDisplay(apiName)` | `"special-attack"` → `"Special Attack"` |
| `extractIdFromUrl(url)` | `".../pokemon-species/133/"` → `133` |
| `findLatestEnglishText(entries, fieldName)` | Sucht in einer Liste von `{ language, <Feld> }` den **letzten englischen** Eintrag und entfernt Zeilenumbrüche |
| `getMainColorOfPokemon` / `getGradientEndColorOfPokemon` | Farben nach dem **ersten** Typ des Pokémon |
| `getListSpriteUrl` | Kleines animiertes Bild der Karte (`showdown`), sonst das normale Vorderbild |
| `getShinyListSpriteUrl` | Dasselbe als Shiny (Ersatz: normales Bild) |
| `getDetailImageUrl` | Großes Popup-Bild: `dream_world` → `official-artwork` → Vorderbild |
| `getShinyDetailImageUrl` | Großes Shiny-Bild oder `null`, wenn es keines gibt (dann fehlt der Shiny-Knopf) |

Die Reihenfolge mit `||` ist eine **Rückfallkette**: Fehlt das erste Bild, wird das
nächste benutzt.

### 7.5 `js/components.js`

**Zweck:** HTML-Bausteine, die von **mehreren Tabs** genutzt werden.

| Funktion | Aufgabe |
| --- | --- |
| `barTrackHtml(value, max, colors)` | Der Balken selbst; Füllung in Prozent (höchstens 100 %), Farben als CSS-Variablen |
| `barCellsHtml(label, value, max, colors)` | Drei Zellen: Beschriftung, Wert, Balken |
| `barRowHtml(...)` | Eine komplette Balkenzeile (Stats-Tab) |
| `pokemonColorStyle(pokemon)` | Der `style`-Text, der `--pokemon-main-color` und `--pokemon-gradient-end-color` setzt |
| `typeBadgeHtml(typeName)` | Die farbige Typ-Plakette |
| `tabMessageHtml(text)` | Statusmeldung für einen Tab ("Loading...", Fehler, "does not evolve") |

`barColors` ist immer ein Objekt `{ startColor, endColor }`.

### 7.6 `js/pokemon-list.js` und `js/pokemon-detail.js`

#### `js/pokemon-list.js` – die Übersicht

Gliederung im Code:

| Abschnitt | Funktionen |
| --- | --- |
| **Feste Elemente** (oben) | `searchInput`, `pokedexElement`, `pokedexMessageElement`, `loadButtonsContainer`, `loadAllButtonLabel` |
| **Start** | `initializePokedex`, `fetchAllPokemonNamesAndIds`, `fetchTotalPokemonCount`, `toPokemonNameAndId` |
| **Suche** | `scheduleSearch`, `runSearch`, `findPokemonMatchingSearchText`, `removeAllPokemonCards` |
| **Nachladen** | `loadNextPokemonPage`, `loadAllRemainingPokemon`, `runListLoading`, `isOutdatedListRequest`, `showListLoadingError`, `appendNextPage`, `appendAllRemainingBatches`, `appendNextBatch`, `fetchPokemonOfListEntries` |
| **Anzeige** | `showLoadAllProgress`, `setLoadButtonsDisabled`, `appendPokemonCards`, `showPokedexMessage`, `updateLoadButtonsVisibility` |
| **Eine Karte** | `pokemonCardHtml`, `pokemonCardHeadingHtml`, `pokemonCardTypesAndImageHtml`, `typeBadgesOfPokemonHtml`, `pokemonCardImageHtml` |

Wichtige Details:

- `runListLoading` ist der gemeinsame Rahmen für beide Nachlade-Wege: Er führt die
  Schritte aus, fängt Fehler ab, zeigt eine Meldung und aktualisiert danach die Knöpfe,
  aber nur, wenn die Anfrage noch aktuell ist.
- `appendNextBatch` gibt `false` zurück, wenn inzwischen eine neuere Anfrage
  übernommen hat, dann wird nichts mehr angezeigt.
- `appendPokemonCards` fügt neue Karten **vor** dem Meldungs-Element ein
  (`insertAdjacentHTML("beforebegin", …)`). Die Meldung bleibt so immer das letzte Element
  im `#pokedex`.
- `pokemonCardImageHtml` erzeugt **zwei** übereinanderliegende Bilder (normal und shiny).
  Das CSS blendet beim Darüberfahren von einem zum anderen über.
- Bilder haben `loading="lazy"`: Der Browser lädt sie erst, wenn sie fast sichtbar sind.

#### `js/pokemon-detail.js` – das Popup und das Tab-System

Gliederung im Code:

| Abschnitt | Funktionen |
| --- | --- |
| **Tab-Verwaltung** (oben) | `detailOverlay`, `matchupsTabId`, `registeredTabs`, `registerTab` |
| **Öffnen, Blättern, Schließen** | `openPokemonDetail`, `displayPokemonIfStillLatest`, `displayPokemonDetail`, `preloadNeighbourPokemon`, `getNeighbourPokemonId`, `showDetailOverlay`, `closePokemonDetail`, `closeDetailIfOverlayClicked` |
| **Aufbau des Popups** | `pokemonDetailHtml`, `detailHeaderHtml`, `detailToolbarHtml`, `detailNavigationHtml`, `detailActionsHtml`, `hasCrySound`, `detailRoundButtonHtml`, `previousPokemonButtonHtml`, `nextPokemonButtonHtml`, `shinyButtonHtml`, `cryButtonHtml`, `closeButtonHtml`, `detailHeroHtml`, `detailHeadingHtml`, `detailTitleHtml`, `getLongestWordLength`, `detailFigureHtml`, `detailHeaderTypeHtml` |
| **Tabs** | `tabButtonHtml`, `tabPanelHtml`, `showTab`, `setTabActive`, `fillTabPanel`, `renderTabContent`, `showTabContent`, `showTabLoadError` |
| **Zeile unter dem Namen** | `showSpeciesSummary`, `displaySubtitle`, `speciesSummaryText`, `getSpecialStatusText` |
| **Shiny und Schrei** | `toggleShinyImage`, `showDetailImage`, `flashDetailFigure`, `playPokemonCry` |
| **Tastatur** | `handleDetailKeyDown`, `stepWithArrowKey` (registriert per `document.addEventListener("keydown", …)`) |

**Das Tab-Format** (Kommentar am Anfang der Datei):

```js
{
  tabId: "About",         // eindeutig; wird als HTML-id des Containers benutzt
  label: "About",         // Beschriftung im Tab-Knopf
  icon: icons.about,      // SVG-Text (siehe configuration.js)
  render: aboutHtml,      // (pokemon) => HTML-Text ODER Promise mit HTML-Text
  afterRender: fn         // optional: (tabPanel) => …, läuft nachdem das HTML im Popup steht
}
```

Wichtige Details:

- `getLongestWordLength` liefert die Länge des längsten Wortes im Namen. CSS berechnet
  daraus die Schriftgröße (`--name-longest-word-length`), damit ein Wort nie mitten im
  Wort umbricht ("Landorus Incarnate" darf aber in zwei Zeilen stehen).
- `detailHeaderTypeHtml` macht die Typen im Kopf zu Knöpfen, die zum Matchups-Tab springen,
  aber nur, wenn es diesen Tab gibt. Ohne ihn sind es einfache Beschriftungen.
- `flashDetailFigure` erzwingt mit `void figureElement.offsetWidth`, dass die
  Blitz-Animation neu startet, auch wenn die Klasse gerade erst entfernt wurde.
- `playPokemonCry` fängt eine Ablehnung des Browsers ab (Autoplay-Regeln), dann bleibt es still.

### 7.7 `js/tabs/` – die fünf Tabs

Jede Tab-Datei beginnt mit `registerTab({ … })`. Danach folgen die Funktionen des Tabs.

#### `tabs/about.js` – "About"

Zeigt Beschreibungstext, Größe/Gewicht/Ei-Zyklus, Geschlecht, Ei-Gruppen, Fähigkeiten und Fundorte.

| Funktion | Aufgabe |
| --- | --- |
| `aboutHtml` | Lädt alles und setzt die Teile zusammen |
| `fetchAboutData` | Lädt gleichzeitig (`Promise.all`): Species, Fundorte, Fähigkeiten |
| `fetchAllAbilityDetails` | Lädt jede Fähigkeit; schlägt eine fehl, wird sie zu `null` (nur diese Karte zeigt dann keinen Text, der Rest bleibt heil) |
| `descriptionQuoteHtml` | Der Pokédex-Text aus den Spielen (ersetzt "POKéMON" durch "Pokémon") |
| `basicFactTilesHtml` | Kacheln Height, Weight, Egg Cycle |
| `genderAndEggGroupTilesHtml`, `genderTileHtml`, `genderBarHtml`, `genderLegendHtml` | Geschlechterverhältnis als zweifarbiger Balken |
| `tileHtml`, `chipListHtml` | Kleine Bausteine: Kachel und Pillen |
| `abilitiesSectionHtml`, `abilityCardHtml`, `abilityDescriptionText` | Fähigkeiten-Karten (mit "Hidden"-Marke) |
| `locationsSectionHtml` | Fundorte als scrollbare Pillen ("Unknown", wenn keine bekannt) |

Umrechnungen: Die API liefert Größe in **Dezimetern** (`× 10` = cm) und Gewicht in
**Hektogramm** (`÷ 10` = kg). `gender_rate` sind **Achtel** weiblich (`-1` = geschlechtslos).

#### `tabs/stats.js` – "Stats" (tabId `Base-Stats`)

Zeigt ein **Radar-Diagramm** (Sechseck) und sechs **Balken** plus einen Total-Balken.

| Bereich | Funktionen |
| --- | --- |
| Balken | `baseStatisticsHtml`, `toStatistic`, `createTotalBarEntry`, `statisticBarRowHtml` |
| Radar: Geometrie | `radarCornerAngleInRadians`, `radarPointCoordinates`, `radarPolygonPoints` |
| Radar: Zeichnung | `radarChartHtml`, `radarRingsHtml`, `radarAxesHtml`, `radarAxisHtml`, `radarDotsHtml`, `radarDotHtml`, `radarLabelsHtml`, `radarLabelHtml`, `radarTextAnchor` |

Konstanten und ihre Wirkung:

- `maximumStatisticValue = 255` und `maximumTotalValue = 780`: Bei diesen Werten ist der Balken voll.
- `radarMaximumValue = 150`: Ab diesem Wert reicht das Diagramm bis zum Rand.
- `statisticBarColors`: Farbverlauf je Balken, die Reihenfolge entspricht HP, Attack,
  Defense, Sp. Attack, Sp. Defense, Speed, Total.
- `radarCornerLabels`: Kurznamen an den Ecken (HP, ATK, DEF, SpA, SpD, SPE).

Das Radar ist ein **selbst gezeichnetes SVG** (keine Bibliothek). Eine Ecke liegt bei
`Winkel = -90° + Ecke × 60°` (Ecke 0 = oben). Aus dem Winkel und einem Abstands-Anteil
(0 = Mitte, 1 = Rand) berechnet `radarPointCoordinates` mit `cos` und `sin` einen Punkt.
Die Hilfslinien (Ringe bei 25/50/75/100 %), die Achsen, die Fläche und die Punkte sind
alle derselbe Rechenweg mit anderen Anteilen.

#### `tabs/evolution.js` – "Evolution"

Zeigt die Entwicklungskette als Baum aus Pokémon-Kacheln und Pfeilen mit Bedingung.

| Funktion | Aufgabe |
| --- | --- |
| `evolutionHtml` | Lädt Species und Kette; "does not evolve", wenn es keine Entwicklung gibt |
| `fetchEvolutionChain` | Liefert die Kette oder `null` |
| `evolutionStageHtml` | **Rekursiv:** ein Pokémon plus alles, wozu es sich entwickelt (deshalb funktionieren auch Verzweigungen wie bei Evoli) |
| `getWideLayoutClassName` | Ab mehr als `wideEvolutionBranchCount` (3) Zweigen wird als Raster gezeichnet (`.wide`) |
| `evolutionBranchesHtml`, `evolutionBranchHtml` | Pfeil mit Bedingung und das Ziel-Pokémon |
| `evolutionNodeHtml`, `evolutionNodeActionAttribute`, `evolutionNodeContentHtml` | Die Kachel; das aktuelle Pokémon ist nicht klickbar, alle anderen öffnen ihr Popup |
| `evolutionConditionText` | Mehrere Wege werden mit "or" verbunden, doppelte Texte entfallen |
| `evolutionDetailText` und `evolutionTriggerText`, `itemAndMoveConditionTexts`, `friendshipConditionTexts`, `circumstanceConditionTexts`, `partyAndStatsConditionTexts`, `attackVersusDefenseText` | Übersetzen die API-Felder in Text ("Level 16", "Use Fire Stone", "at night", "friendship 220+" …) |

Die Kachel-ID ist die **Species-ID**. Sie ist zugleich die ID der Standardform, deshalb
kann ein Klick direkt `openPokemonDetail(speciesId)` aufrufen.

#### `tabs/matchups.js` – "Matchups"

Zeigt, gegen welche Angriffstypen das Pokémon schwach, resistent oder immun ist.

| Funktion | Aufgabe |
| --- | --- |
| `matchupsHtml` | Lädt die Typen, rechnet, baut die Gruppen |
| `fetchTypesOfPokemon` | Lädt die 1 oder 2 Typen des Pokémon |
| `calculateDamageMultipliers` | Bestimmt den Schadensfaktor je Angriffstyp |
| `createNeutralDamageMultipliers` | Startwert: jeder der 18 Typen hat Faktor 1 |
| `applyDamageRelations`, `multiplyDamage` | Multipliziert die Faktoren aus `damage_relations` ein |
| `matchupGroupsHtml`, `matchupGroupHtmlIfNotEmpty`, `matchupGroupHtml`, `matchupHeadingHtml` | Gruppen wie "Very weak to ×4" anzeigen |

**Die Rechnung:** Start bei ×1. Für jeden Typ des Pokémon gilt: `double_damage_from` → ×2,
`half_damage_from` → ×½, `no_damage_from` → ×0. Bei **zwei Typen** werden die Faktoren
multipliziert. So entstehen ×4 (zweimal schwach), ×¼ (zweimal resistent), Schwäche und
Resistenz heben sich zu ×1 auf, und ×0 (Immunität) gewinnt immer. Gruppen ohne Typen werden
nicht angezeigt, ×1 wird gar nicht gelistet ("All other types deal normal damage.").

#### `tabs/moves.js` – "Moves"

Zeigt alle Attacken nach Spiel und Lernart. Die längste Tab-Datei.

| Bereich | Funktionen |
| --- | --- |
| Einstieg | `movesHtml`, `findNewestGameWithLevelUpMoves` |
| Spiele: Namen, Reihenfolge | `getGameDisplayName`, `getGameGeneration`, `findKnownGame`, `getGameReleaseRank`, `compareGamesNewestFirst` |
| Attacken ordnen | `buildLearnsetPerGame`, `addMoveToLearnset`, `getOrCreateGame`, `createGame`, `toKnownLearnMethodApiName`, `createLearnedMove` |
| Filter und Liste | `movesViewHtml`, `findSelectedGame`, `ensureValidLearnMethodSelection`, `learnMethodFiltersHtml`, `learnMethodFilterButtonHtml`, `moveCardListHtml`, `sortMovesForDisplay`, `compareMovesByLevelThenName`, `selectLearnMethod`, `renderMovesView` |
| Karte | `moveCardHtml`, `moveHeadingHtml` |
| Nachladen bei Sichtbarkeit | `observeMoveCards` (auch als `afterRender` eingetragen), `createMoveCardObserver`, `fillMoveCardsThatBecameVisible`, `fillMoveCard`, `showMoveDetails`, `showMoveDetailsError`, `moveBadgesHtml` |
| Werte und Beschreibung | `moveBodyHtml`, `moveEffectDescription`, `moveMeterHtml`, `meterLabelRowHtml` |

Wichtige Datenstrukturen und Konstanten:

- `knownGameVersionGroups`: **Tabelle aller Spiele in Erscheinungsreihenfolge** mit Anzeigename
  und Generation. Die API-IDs taugen dafür nicht (japanische Fassungen haben späte IDs).
  Unbekannte, neuere Spiele hängen hinten an und erscheinen unter "Newer games".
- `learnMethods`: Lernarten in Filter-Reihenfolge (`level-up`, `machine`, `egg`, `tutor`,
  `other`). Seltene Sonderfälle werden zu `other` zusammengefasst
  (`toKnownLearnMethodApiName`). `tagText` liefert die kleine Pille am Zeilenanfang
  ("Lv 16", "Evo", "TM" …).
- `learnsetPerGame`: Liste der Spiele des Pokémon, neueste zuerst. Form:
  `{ versionGroupName, versionGroupId, movesByLearnMethod: { "level-up": [ { apiName, displayName, levelLearnedAt } ] } }`.
- `movesSelection`: aktuelle Auswahl `{ versionGroupName, learnMethodApiName }`. Wird bei jedem
  Pokémon neu gesetzt. Hat das neu gewählte Spiel die gewählte Lernart nicht, gilt die erste
  vorhandene (`ensureValidLearnMethodSelection`).
- `moveMeterColors`: Farben der Balken über `color-mix` mit `--move-color` (Farbe des
  Attacken-Typs) oder ersatzweise der Farbe des Pokémon.
- `maximumMovePower` (200), `maximumMoveAccuracy` (100), `maximumMovePowerPoints` (40): Obergrenzen der Balken.

Statusattacken haben keine Power, manche keine Genauigkeit (sie treffen immer): Dann zeigt
`moveMeterHtml` "–" und einen leeren Balken.

#### `tabs/moves-game-select.js` – die Spiel-Auswahl

Ein **selbstgebautes Dropdown** statt `<select>`, weil die Liste eines echten `<select>` vom
Betriebssystem gezeichnet wird und sich nicht gestalten lässt. Es folgt dem
Barrierefreiheits-Muster "Listbox mit `aria-activedescendant`": Der Knopf behält den Fokus,
die Liste markiert nur die "aktive" Option.

| Bereich | Funktionen |
| --- | --- |
| Aufbau | `gameSelectHtml`, `gameButtonHtml`, `gameListItemsHtml`, `gameListItemHtml`, `startsNewGeneration`, `generationHeadingHtml`, `gameOptionHtml`, `countMovesOfGame` |
| Öffnen/Schließen | `getGameOptionElements`, `isGameListOpen`, `toggleGameList`, `openGameList`, `markGameButtonExpanded`, `measureFreeSpaceBelowGameButton`, `limitGameListHeight`, `centerSelectedGameOption`, `scrollGameListIntoView`, `closeGameList`, `closeGameListIfClickedOutside` |
| Hervorhebung | `setActiveGameOption`, `scrollGameOptionIntoView`, `findActiveGameOption`, `getNeighbourGameOption` |
| Auswahl | `selectGame`, `showSelectedGameInSelect` |
| Tastatur | `gameSelectKeyHandlers` (Tabelle Taste → Funktion), `handleGameSelectKeyDown`, `keepKeyAwayFromPopup`, `moveHighlightWithArrowKey`, `moveHighlightToEdge`, `chooseHighlightedGame`, `closeGameListWithEscape`, `keepHorizontalArrowInsideOpenList` |

Tastaturbedienung bei offener Liste: `↑` `↓` bewegen, `Home`/`End` springen, `Enter` oder
Leertaste wählt, `Esc` schließt nur die Liste, `Tab` schließt sie.
`keepKeyAwayFromPopup` ruft `stopPropagation()` auf, damit `Esc` und die Pfeiltasten nicht
zum Popup durchdringen (sonst würde `Esc` das ganze Popup schließen und `←`/`→` das Pokémon
wechseln).

Die Höhe der aufgeklappten Liste passt sich dem freien Platz im Popup an, bleibt aber
zwischen `minimumGameListHeight` (180 px) und `maximumGameListHeight` (340 px).

---

## 8. CSS: Datei für Datei

### 8.1 Die Reihenfolge ist wichtig

In `index.html` steht: *"spätere Regeln überschreiben frühere (utilities zuletzt)"*.
`utilities.css` enthält nur `.hidden { display: none; }`. Das muss **zuletzt** kommen, damit
es Regeln wie `.detail-overlay { display: flex }` mit gleicher Gewichtung überstimmt.

Die Rechtsseiten laden nur `base.css`, `layout.css` und `legal.css`.

### 8.2 Die Dateien

| Datei | Inhalt |
| --- | --- |
| `base.css` | 11 `@font-face`-Blöcke für 7 Schriftfamilien, Schrift-Variablen (`--font-…`), `box-sizing: border-box`, Seitenhintergrund (dunkler Farbverlauf, fixiert), Grundwerte für `h1`, `p`, `img` |
| `layout.css` | **Kopfzeile** (fest oben, 76 px, rot), Logo (dreht sich beim Darüberfahren), Suchfeld mit Lupe, **Kartenraster** `.pokedex`, Abdunkeln bei offenem Popup `.pokedex-dimmed`, Meldung `.pokedex-message`, Fußzeile |
| `buttons.css` | Die Knöpfe "Mehr fangen" (rot) und "Alle anzeigen" (blau, `.load-all`): dicker Boden, Glanzstreifen, eingedrückt beim Klick, gesperrter Zustand |
| `pokemon-cards.css` | Die Karte (Farbverlauf des Typs, Hover-Anheben, Glanzstreifen), Name, Nummer, Bild-Wechsel normal/shiny, schwebende Animation, **`.type-badge`** (auch in Matchups und Moves benutzt) |
| `pokemon-detail.css` | Das Popup: Overlay (Unschärfe), **die Farb-Variablen der Karte** (siehe 8.3), Kopf mit Farbverlauf, runde Glas-Knöpfe, Name/Typen/Bild, Tab-Leiste, scrollbarer Inhalt, alle Popup-Animationen, Regeln für schmale Bildschirme |
| `bars.css` | Balken (`.bar-row`, `.bar-track`, `.bar-fill`), Stats-Layout, das komplette Radar-Diagramm |
| `about.css` | About-Tab: Zitat, Kacheln, Geschlechter-Balken, Pillen, Fähigkeiten-Karten. **Enthält auch geteilte Klassen** (`.tab-message`, `.detail-section-title`, `.tile-label`, `.card-list`, `.chip-list`), die andere Tabs mitbenutzen |
| `evolution.css` | Baum aus Kacheln und Pfeilen, breite Variante `.wide`, senkrechte Anordnung auf Handys |
| `matchups.css` | Gruppen-Zeilen mit farbigem linken Rand (rot = schwach, grün = resistent, grau = immun) |
| `moves.css` | Spiel-Auswahl und ihre Liste, Lernart-Filter (kleben oben beim Scrollen), Attacken-Karten, Platzhalter mit Schimmer-Animation, Werte-Balken |
| `legal.css` | Lesbare Textspalte für Impressum und Datenschutz |
| `utilities.css` | `.hidden` |

### 8.3 Das Farbsystem (CSS-Variablen)

Die Farben eines Pokémon werden **nicht** in CSS festgelegt, sondern vom JavaScript als
CSS-Variablen an die Elemente geschrieben. Das CSS benutzt sie nur.

| Variable | Wer setzt sie | Wofür |
| --- | --- | --- |
| `--pokemon-main-color`, `--pokemon-gradient-end-color` | `pokemonColorStyle()` in `components.js`, als `style` auf Karte und Popup | Farbverlauf der Karte und des Popup-Kopfes; alles andere leitet sich davon ab |
| `--type-color` | `typeBadgeHtml()` | Farbe einer Typ-Plakette |
| `--bar-start-color`, `--bar-end-color` | `barTrackHtml()` | Farbverlauf eines Balkens |
| `--move-color` | `showMoveDetails()` in `moves.js` | Farbe einer Attacken-Karte nach dem Nachladen |
| `--name-longest-word-length` | `detailTitleHtml()` | Schriftgröße des Namens im Popup |

In `.detail-card` (`pokemon-detail.css`) werden daraus die **Farben des Popups** abgeleitet:
`--accent-color` (helle Version der Typ-Farbe), `--panel-background-color`, `--surface-color`,
`--surface-strong-color`, `--border-color`, `--text-color`, `--muted-text-color`.
Alle Tab-Stile (`about.css`, `evolution.css`, `matchups.css`, `moves.css`) benutzen diese Namen.
**Willst du das Popup umfärben, ändere sie an dieser einen Stelle.**

`color-mix(in srgb, <Farbe> 55%, white)` mischt Farben direkt im CSS (heller, transparenter).
Bei einigen Regeln steht davor eine einfachere Zeile als **Rückfall** für Browser ohne `color-mix`.

### 8.4 Responsives Verhalten und Bewegung

- **Haltepunkt 520 px** (Handy): kleinere Abstände, Titel in der Kopfzeile verschwindet,
  im Popup zeigt nur der **aktive** Tab seine Beschriftung, Evolution wird senkrecht,
  Attacken-Typ und Kategorie rutschen in eine eigene Zeile.
- **560 px:** Im Stats-Tab steht das Radar dann über den Balken statt daneben.
- **1200 px:** `h1` wird fest 2.5 rem groß.
- **`prefers-reduced-motion: reduce`:** Wer im Betriebssystem "Bewegung reduzieren" eingestellt
  hat, bekommt im Popup **keine** Animationen (`animation: none`) und kaum Übergänge. Das
  Logo in der Kopfzeile und die beiden Lade-Knöpfe verzichten auf ihre Dreh- und Glanz-Effekte.
  Die Karten der Übersicht haben dafür keine eigene Regel (sie schweben weiter).
- **Layout des Kartenrasters:** `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`,
  also so viele Spalten, wie in die Breite passen.

---

## 9. HTML-Dateien

### 9.1 `index.html`

Die einzige Seite der App. Aufbau von oben nach unten:

| Element | Aufgabe |
| --- | --- |
| `<head>` | Favicon, alle Stylesheets (Reihenfolge wichtig), alle Skripte mit `defer` (Reihenfolge wichtig) |
| `<body onload="initializePokedex()">` | Startet die App, sobald die Seite geladen ist |
| `<header>` | Logo, Titel und Suchfeld `#search-input` (`oninput="scheduleSearch()"`) |
| `#pokedex` | Das Kartenraster; enthält anfangs nur die Meldung `#pokedex-message`. Die Karten fügt JS ein |
| `#load-buttons` | Die beiden Knöpfe. Anfangs `hidden`; `#load-all-label` ist die Beschriftung von "Alle anzeigen" |
| `#detail-overlay` | Leerer Container für das Popup; JS füllt ihn. `onclick` schließt bei Klick auf den Hintergrund |
| `<footer>` | Links zu Datenschutz und Impressum |

IDs, die das JavaScript sucht: `search-input`, `pokedex`, `pokedex-message`,
`load-buttons`, `load-all-label`, `detail-overlay`. Benennst du eine davon um, musst du
`pokemon-list.js` bzw. `pokemon-detail.js` anpassen.

### 9.2 `Impressum.html` und `datenschutzt.html`

Reine Textseiten (Deutsch). Sie haben dieselbe Kopfzeile wie die App, aber ohne Suchfeld, und
laden nur `base.css`, `layout.css` und `legal.css`. Kein JavaScript. Der Inhalt steht in
`<section>`-Blöcken mit `<h2>`-Überschriften.

Beide werden im Footer der App **in einem neuen Tab** geöffnet
(`target="_blank" rel="noopener"`).

---

## 10. Wichtige Konzepte erklärt

### 10.1 Promises und `async`/`await`

Netzwerkanfragen dauern. Ein **Promise** ist ein Versprechen auf ein späteres Ergebnis.
`await` wartet darauf, ohne die Seite einzufrieren. Eine `async`-Funktion gibt immer ein
Promise zurück. Deshalb kann ein Tab in `render` einfach `async function` sein: Das
Popup erkennt das Promise und zeigt "Loading...", bis es fertig ist.

`Promise.all([a, b, c])` startet mehrere Anfragen **gleichzeitig** und wartet auf alle. So
lädt der About-Tab Species, Fundorte und Fähigkeiten parallel statt nacheinander.

### 10.2 Der Cache speichert Promises statt Ergebnisse

```js
function fetchJsonWithCache(url) {
  if (!responseCacheByUrl.has(url)) {
    responseCacheByUrl.set(url, fetchJsonAndForgetFailure(url));
  }
  return responseCacheByUrl.get(url);
}
```

Gespeichert wird das **Promise**, nicht das fertige Ergebnis. Fragen zwei Stellen fast
gleichzeitig dieselbe URL an (z. B. Untertitel und About-Tab die Species-Daten), teilen sie sich
**eine** Netzwerkanfrage. Schlägt sie fehl, fliegt sie aus dem Cache, damit ein neuer Versuch
möglich ist.

### 10.3 Veraltete Anfragen verwerfen (Request-Nummern)

Problem: Der Nutzer klickt auf Pokémon A, dann schnell auf B. Antwortet A **nach** B,
würde plötzlich A angezeigt. Lösung: Jede Anfrage bekommt eine Nummer.

```js
let thisRequestNumber = ++latestDetailRequestNumber;   // Nummer ziehen
let pokemon = await fetchPokemonById(pokemonId);        // warten …
if (requestNumber !== latestDetailRequestNumber) return; // inzwischen überholt → nichts tun
```

Dasselbe Muster gibt es für die Liste (`latestListRequestNumber`). Auch das Schließen des
Popups zählt hoch, damit eine noch laufende Anfrage es nicht wieder öffnet. Ähnlich prüfen
Tabs mit `pokemon !== pokemonInDetailView`, ob es noch dasselbe Pokémon ist.

### 10.4 Entprellen der Suche (Debounce)

Nicht bei jedem Buchstaben suchen, sondern erst, wenn 250 ms Ruhe ist.
`clearTimeout` bricht den alten Timer ab, `setTimeout` startet einen neuen.

### 10.5 Nachladen erst bei Sichtbarkeit (`IntersectionObserver`)

Ein `IntersectionObserver` meldet, wenn ein Element in einen Bereich hineinkommt. Der
Moves-Tab beobachtet jede Karte im Popup-Scrollbereich mit `rootMargin: "600px 0px"`, also
**600 px bevor** sie sichtbar wird. So sieht man beim Scrollen kaum Platzhalter, es werden
aber trotzdem nicht alle Attacken auf einmal geladen. `fillMoveCard` prüft mit
`moveCard.isConnected`, ob die Karte noch auf der Seite ist.

### 10.6 Platzhalter ohne Springen (`:empty`)

Karten der Attacken haben schon vor dem Laden eine passende Höhe (`.move-body:empty { height: 92px }`),
damit die Seite beim Nachladen nicht springt. Wichtig: Die leeren Elemente müssen **wirklich leer** sein
(auch kein Leerzeichen oder Zeilenumbruch darin), sonst greift `:empty` nicht. Deshalb steht
im Code der Hinweis in `moveCardHtml`.

### 10.7 Tab-Registrierung

Statt dass `pokemon-detail.js` die Tabs kennt, **melden sich die Tabs selbst an**
(`registerTab`). Das Popup baut Knöpfe und Container aus der Liste `registeredTabs`. Ein neuer Tab
ist darum nur eine neue Datei plus ein `<script>`-Tag (siehe [11.1](#111-einen-neuen-tab-hinzufügen)).

### 10.8 Barrierefreiheit (ARIA) und Tastatur

- Popup: `role="dialog"`, `aria-modal="true"`, `aria-label` mit dem Namen.
- Tabs: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`.
- Shiny-Knopf: `aria-pressed`. Icon-Knöpfe haben `aria-label` und `title`.
- Spiel-Auswahl: `aria-haspopup`, `aria-expanded`, `role="listbox"`/`"option"`, `aria-activedescendant`.
- Dekorative SVGs haben `aria-hidden="true"`, das Radar hat `role="img"` mit `aria-label`.
- Fokus-Rahmen: Regeln mit `:focus-visible`.
- Tastatur: siehe [5.6](#56-blättern-schließen-tastatur) und die Spiel-Auswahl in [7.7](#77-jstabs--die-fünf-tabs).

---

## 11. Anleitungen: So erweiterst du das Projekt

### 11.1 Einen neuen Tab hinzufügen

1. Neue Datei `js/tabs/mein-tab.js` anlegen:

   ```js
   registerTab({
     tabId: "Team",          // eindeutig, wird als HTML-id benutzt (keine Leerzeichen)
     label: "Team",          // Text im Tab-Knopf
     icon: icons.about,      // vorhandenes Icon, oder ein neues in configuration.js anlegen
     render: teamHtml,
   });

   async function teamHtml(pokemon) {
     let species = await fetchJsonWithCache(pokemon.species.url);
     return /* html */ `<p>${formatNameForDisplay(species.name)}</p>`;
   }
   ```

2. In `index.html` das Skript **hinter den anderen Tabs** eintragen. Die Reihenfolge dort ist
   die Reihenfolge der Tabs im Popup:

   ```html
   <script defer src="js/tabs/mein-tab.js"></script>
   ```

3. Bei Bedarf eine eigene CSS-Datei anlegen und in `index.html` **vor** `utilities.css`
   einbinden. Die Farben des Popups (`var(--text-color)`, `var(--accent-color)` …) kannst du
   direkt benutzen.

Gut zu wissen:

- Wirft `render` einen Fehler, zeigt das Popup automatisch "The details could not be loaded." und
  versucht es beim nächsten Klick auf den Tab erneut.
- Für Code, der erst laufen darf, wenn das HTML im Popup steht (Beobachter, Ereignisse),
  gibt es `afterRender: (tabPanel) => { … }`.
- Wiederverwendbare Bausteine: `barRowHtml`, `typeBadgeHtml`, `tabMessageHtml`, `tileHtml`,
  `chipListHtml`.
- Die `tabId` `"Matchups"` ist besonders: Die Typ-Knöpfe im Kopf springen dorthin.

### 11.2 Mehr oder weniger Pokémon pro Klick

In `configuration.js`: `pokemonPerPage` (bei "Mehr fangen") und `pokemonPerLoadAllBatch`
(Blockgröße bei "Alle anzeigen").

### 11.3 Die Such-Wartezeit ändern

`searchDelayMilliseconds` in `configuration.js`.

### 11.4 Die Farbe eines Typs ändern

In `configuration.js` beide Tabellen anpassen: `mainColorByTypeName` (Plakette und Beginn
des Verlaufs) und `gradientEndColorByTypeName` (Ende des Verlaufs). Fügst du hier einen
**neuen Typ** ein, taucht er automatisch auch im Matchups-Tab auf, weil `allTypeNames` aus
den Schlüsseln von `mainColorByTypeName` gebildet wird.

### 11.5 Ein neues Spiel im Moves-Tab eintragen

In `moves.js` die Tabelle `knownGameVersionGroups` um `{ apiName, displayName, generation }`
ergänzen, **an der Stelle, die dem Erscheinungsdatum entspricht** (die Position bestimmt die
Sortierung). Den `apiName` (Namen der "version group") findest du im `/pokemon/<id>`-Ergebnis unter
`moves[].version_group_details[].version_group.name`. Ohne Eintrag erscheint das Spiel trotzdem, mit dem formatierten API-Namen unter "Newer games".

### 11.6 Ein neues Icon hinzufügen

In `configuration.js` im Objekt `icons` einen neuen Eintrag anlegen, am einfachsten mit
`strokeIconSvg("<line …></line>")` (24×24-Raster, Farbe vom Text). Benutzen mit `icons.meinIcon`.

### 11.7 Farben oder Schrift des Popups ändern

Farben: die Variablen in `.detail-card` (`pokemon-detail.css`). Schriften: die
`--font-…`-Variablen in `base.css`. Neue Schrift: `.woff2`-Datei in `fonts/` legen und einen
`@font-face`-Block in `base.css` ergänzen. Lade Schriften **lokal**, nicht von einem Fremdserver
(die Datenschutzerklärung geht davon aus).

### 11.8 Testen

Es gibt keine automatischen Tests. Prüfe von Hand: Karten laden, Suche, "Mehr fangen"/"Alle
anzeigen", Popup mit allen fünf Tabs, Blättern, `Esc`. Sinnvolle **Sonderfälle** zum Testen:

| Pokémon | Warum interessant |
| --- | --- |
| Eevee (Evoli) | Viele Zweige in der Entwicklung (Raster-Layout) |
| Tyrogue | Entwicklung abhängig von Angriff/Verteidigung |
| Magnemite | Zwei Typen (Faktoren ×4/×¼ im Matchups-Tab) |
| Ditto | Geschlechtslos, keine Entwicklung |
| ein Pokémon mit hoher ID (10000+) | Sonderform: Blättern über die Position in der Liste |
| ein Legendäres | Untertitel "★ Legendary" |
| Landorus Incarnate | Langer Name, Umbruch im Kopf |

---

## 12. Deployment und Hilfsdateien

### 12.1 Ablauf von der Änderung bis zur Live-Seite

```text
Änderung im Editor
   │  ./up.sh "Nachricht"        (git pull, git add ., git commit, git push)
   ▼
Push auf main
   ▼
GitHub Actions: .github/workflows/deploy.yml
   ├─ prüft, dass index.html, css/ und js/ vorhanden sind
   ├─ richtet SSH ein (Schlüssel aus den GitHub-Secrets)
   ├─ lädt per rsync hoch (--delete: entfernt Dateien, die im Repo fehlen)
   ├─ löscht den Schlüssel wieder
   └─ prüft, dass die Seite antwortet (curl)
```

Es gibt **keinen Build-Schritt**: Der Ordnerinhalt wird so, wie er ist, hochgeladen.

**Nicht hochgeladen** werden (per `--exclude`): `.git/`, `.github/`, `.vscode/`,
`.well-known/`, `.DS_Store`, `.gitignore`, `Dokumentation/`, `plan.drawio` und `up.sh`.
Diese Doku liegt also nie auf dem Server.

Die Einrichtung (Schlüssel, Secrets, Server) steht in
[deployment-einrichten.md](deployment-einrichten.md). Dort steht auch, **warum** das
Repository keine Server-Daten enthält (es ist öffentlich).

### 12.2 `up.sh`

```bash
git pull
git add .
git commit -m "$*"
git push
```

Aufruf: `./up.sh Meine Nachricht` (alle Wörter werden zur Commit-Nachricht). Achtung:
`git add .` nimmt **alles** mit, was nicht in `.gitignore` steht, und der Push auf `main`
**startet sofort das Deployment**. Prüfe vorher mit `git status`, was mitgeht.

### 12.3 `.gitignore`

Ignoriert `.DS_Store` und `.vscode/`. Außerdem Schlüssel und Zugangsdaten
(`.env`, `*.pem`, `*.key`, `id_ed25519*`, `id_rsa*`, `*_deploy`, `*_deploy.pub`), damit
sie nie versehentlich in das öffentliche Repository gelangen.

### 12.4 `.github/dependabot.yml`

Prüft wöchentlich, ob es neuere Versionen der in `deploy.yml` verwendeten GitHub-Actions
gibt, und schlägt sie als Pull Request vor. Die Actions sind in `deploy.yml` per
Commit-SHA festgelegt (Schutz vor manipulierten Updates).

### 12.5 `plan.drawio`

Eine frühe Skizze der Idee (für [draw.io](https://draw.io)). Sie gehört nicht zur
Seite und wird nicht hochgeladen.

### 12.6 `Dokumentation/`

- `code-erklaerung.md`: diese Datei.
- `deployment-einrichten.md`: Einrichtung des automatischen Deployments.
- `tailwind-einrichten.md`: Anleitung, Tailwind CSS nachzurüsten (aktuell **nicht** im Einsatz).

---

## 13. Auffälligkeiten im aktuellen Code

Das ist keine Fehlerliste zum Abarbeiten, sondern eine Sammlung von Stellen, die dir beim
Lesen begegnen könnten. Ich habe nichts davon geändert.

| Wo | Was auffällt | Mögliche Folge / Vorschlag |
| --- | --- | --- |
| `css/buttons.css`, Zeile 14 | `--button-edge: var(--button-edge);` verweist auf **sich selbst**. Laut CSS-Regeln ist so ein Kreis ungültig. Der blaue Knopf ist nicht betroffen, weil `.load-all` einen eigenen Wert setzt | Der rote Knopf "Mehr fangen" hat wahrscheinlich keinen dunklen "Boden" (der `box-shadow` mit `var(--button-edge)` wird ungültig). Ich habe es nicht im Browser geprüft. Fix: dort eine echte Farbe eintragen (z. B. ein dunkles Rot) |
| `css/pokemon-cards.css`, Zeile 60 | `.pokemon-card:hover::before` – aber die Karte hat kein `::before` | Die Regel bewirkt nichts und kann weg |
| `css/base.css` | Die Schriften **Diplomata** und **Pacifico** (und `--font-diplomata`, `--font-pacifico`) werden nirgends benutzt | Browser laden ungenutzte Schriften nicht, aber die Dateien (ca. 60 KB) liegen im Repo. Können entfernt werden |
| `datenschutzt.html` | Dateiname mit "t" am Ende. Außerdem heißt die andere Seite `Impressum.html` (großes I), alle anderen Dateien im Projekt sind kleingeschrieben | Funktioniert, weil der Footer-Link denselben Namen benutzt. Beim Umbenennen den Link in `index.html` mit anpassen |
| `index.html` | `<html lang="en">`, aber Knöpfe sind deutsch ("Mehr fangen", "Alle anzeigen", "Lade 10 / 50"), der Rest englisch | Nur ein Stilbruch. Sprache für Screenreader ist ggf. nicht ganz passend |
| `Dokumentation/tailwind-einrichten.md` | Nennt `style.css` und `script.js`, die es nicht mehr gibt (aufgeteilt in `css/` und `js/`) | Anleitung wäre vor einem Einsatz zu aktualisieren |
| `up.sh` | `git add .` nimmt alles mit und der Push löst sofort das Deployment aus | Vorher `git status` prüfen |
| ganzes Projekt | Keine Tests | Bei größeren Umbauten von Hand alle Tabs durchklicken |

---

## 14. Glossar

| Begriff | Bedeutung |
| --- | --- |
| **PokéAPI** | Kostenlose Web-Schnittstelle mit allen Pokémon-Daten (pokeapi.co) |
| **Sprite** | Ein kleines Bild eines Pokémon |
| **Shiny** | Seltene, andersfarbige Variante eines Pokémon |
| **Species** | Die "Art" eines Pokémon. Enthält Beschreibung, Gattung, Generation, Ei-Gruppen und den Link zur Entwicklungskette |
| **Version group** | Ein Spiel oder ein Spielpaar (z. B. "Red / Blue"), so nennt die API die Spiele |
| **Learnset** | Alle Attacken, die ein Pokémon lernen kann |
| **Lernart** | Wie eine Attacke gelernt wird: Level-up, TM/HM, Ei, Tutor, Sonstiges |
| **TM / HM** | Technische/Versteckte Maschine, ein Gegenstand, der eine Attacke beibringt |
| **PP (AP)** | Wie oft eine Attacke eingesetzt werden kann |
| **Matchup** | Wie gut oder schlecht ein Typ gegen einen anderen ist |
| **Overlay** | Die Ebene über der Seite, hier: das Popup mit dem dunklen Hintergrund |
| **Tab-Panel** | Der Inhaltsbereich eines Tabs |
| **DOM** | Die Baumstruktur der Seite im Browser, die JavaScript ändern kann |
| **Debounce** | Eine Aktion erst ausführen, wenn eine Weile nichts passiert ist |
| **Promise** | Ein Versprechen auf ein späteres Ergebnis (`async`/`await`) |
| **Lazy Loading** | Erst laden, wenn es gebraucht wird (Bilder mit `loading="lazy"`, Attacken-Details) |
| **ARIA** | Zusätzliche HTML-Attribute, damit Screenreader die Seite verstehen |
| **CSS-Variable** | Ein Wert wie `--accent-color`, den viele Regeln mit `var(--accent-color)` benutzen |
| **Rückfall (Fallback)** | Ersatzwert, falls das Erste fehlt (`a || b`) |
