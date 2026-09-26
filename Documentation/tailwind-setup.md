# Tailwind CSS in dieses Projekt einbauen

Dieses Projekt ist aktuell eine reine HTML/CSS/JS-Seite (`index.html`, `style.css`,
`script.js`) ohne Build-Tools und ohne `package.json`. Es gibt zwei Wege, Tailwind
hinzuzufügen: einen schnellen (CDN, ohne Installation) und einen sauberen (CLI-Build,
empfohlen). Beide sind unten beschrieben.

---

## Option A — Schnellstart über CDN (kein Node.js nötig)

Ideal zum Ausprobieren, **nicht** für die fertige/produktive Seite gedacht (Tailwind
warnt selbst davor, das CDN-Skript in Produktion zu nutzen — es ist langsamer und lädt
das komplette Framework im Browser).

1. Öffne `index.html`.
2. Füge im `<head>`, **vor** deinem eigenen `<link rel="stylesheet" href="style.css">`,
   folgende Zeile ein:

   ```html
   <script src="https://cdn.tailwindcss.com"></script>
   ```

3. Fertig. Ab jetzt kannst du in jedem HTML-Element Tailwind-Klassen benutzen, z. B.:

   ```html
   <button class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
     Mehr Pokémon
   </button>
   ```

   Deine bestehende `style.css` bleibt zusätzlich aktiv — beide Systeme können
   parallel existieren, solange Klassennamen sich nicht widersprechen.

**Nachteile:** kein Tree-Shaking (die ganze Bibliothek wird im Browser generiert),
keine Möglichkeit eigene Tailwind-Konfiguration (Farben, Fonts) sauber zu verwalten,
nicht empfohlen für die Live-Version auf GitHub Pages.

---

## Option B — Richtige Installation mit Tailwind CLI (empfohlen)

Damit bekommst du eine einzige, kleine, optimierte CSS-Datei, die du wie deine
`style.css` per `<link>` einbindest. Node.js ist auf diesem Rechner bereits installiert
(`node -v` → v24), du brauchst also nichts zusätzlich zu installieren.

### 1. Projekt als npm-Projekt initialisieren

Im Terminal, im Projektordner `Pokemon/`:

```bash
npm init -y
```

Das erstellt eine `package.json` (verwaltet die Abhängigkeiten des Projekts).

### 2. Tailwind installieren

```bash
npm install tailwindcss @tailwindcss/cli
```

### 3. Input-CSS-Datei anlegen

Tailwind braucht eine eigene "Quelldatei", aus der es die finale CSS-Datei baut.
Lege dafür `src/input.css` an mit folgendem Inhalt:

```css
@import "tailwindcss";
```

> Tipp: Deinen bestehenden Code aus `style.css` kannst du entweder komplett in
> Tailwind-Klassen im HTML umwandeln, oder du importierst deine alte `style.css`
> zusätzlich in `src/input.css`:
> ```css
> @import "tailwindcss";
> @import "../style.css";
> ```
> So verlierst du nichts von deinem bisherigen Design und kannst nach und nach auf
> Tailwind-Klassen umstellen.

### 4. Build-Skript in `package.json` einrichten

Öffne die generierte `package.json` und ergänze im Bereich `"scripts"`:

```json
"scripts": {
  "build:css": "tailwindcss -i ./src/input.css -o ./style.css --minify",
  "watch:css": "tailwindcss -i ./src/input.css -o ./style.css --watch"
}
```

* `build:css` erzeugt einmalig die fertige, minimierte `style.css`.
* `watch:css` beobachtet deine Dateien und baut automatisch neu, während du
  entwickelst.

### 5. Tailwind beim Entwickeln laufen lassen

```bash
npm run watch:css
```

Das Terminal offen lassen, während du an `index.html` / `script.js` arbeitest.
Jede gespeicherte Änderung wird automatisch in `style.css` übernommen.

### 6. Tailwind-Klassen im HTML benutzen

`style.css` bleibt wie gewohnt über den vorhandenen Link eingebunden — daran musst
du nichts ändern:

```html
<link rel="stylesheet" href="style.css">
```

Jetzt einfach Tailwind-Klassen in `index.html` verwenden, z. B.:

```html
<header class="flex items-center justify-between gap-4 bg-gray-900 p-4">
  <img class="pokedex-logo h-12 w-12" src="images/pokemon.webp" alt="Pokémon">
  <input
    class="icon-search rounded-full border border-gray-300 px-4 py-2"
    type="search" placeholder="Search" aria-label="Search Pokémon" id="search"
    oninput="startSearch()">
</header>
```

### 7. Vor dem Veröffentlichen (Build für Produktion)

Bevor du mit `up.sh` (dein bestehendes Deploy-Skript) pushst, einmal den
Produktions-Build erzeugen:

```bash
npm run build:css
```

Da dieses Projekt **kein** CI/Build-System hat (die Seite wird vermutlich direkt als
statische Datei über GitHub Pages ausgeliefert), muss die gebaute `style.css` mit
committed und gepusht werden — nicht in `.gitignore` aufnehmen.

### 8. `.gitignore` ergänzen

Der `node_modules`-Ordner sollte **nicht** ins Git-Repo:

```
node_modules/
```

Lege dafür eine Datei `.gitignore` im Projekt-Root an (falls noch nicht vorhanden)
und trage die Zeile ein.

---

## Kurzüberblick: Welche Option wählen?

| | Option A (CDN) | Option B (CLI) |
|---|---|---|
| Setup-Aufwand | 1 Zeile HTML | npm-Projekt + Build-Skript |
| Geeignet für | Schnelles Ausprobieren | Fertige/produktive Seite |
| Performance | Schlechter (volles Framework im Browser) | Gut (nur genutzte Klassen im CSS) |
| Eigene Konfiguration (Farben, Fonts) | Eingeschränkt | Voll möglich |
| Empfehlung für dieses Projekt | Zum Testen | ✅ Für die finale Version |

---

## Nützliche Links

* Offizielle Doku: https://tailwindcss.com/docs/installation
* Klassen-Referenz ("Utility Classes"): https://tailwindcss.com/docs/styling-with-utility-classes
