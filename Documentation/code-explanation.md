# Pokédex – Code Documentation

This file explains **what each file in the project does** and **how the parts work together**.
It is structured so that you can read it from top to bottom (overview → structure →
flows → details) or look up individual sections directly.

> Status of this documentation: 2026-09-25, code state: commit `f5c6103`. If you change the
> code significantly later, check sections 4 to 8 in particular for accuracy.

## Table of contents

1. [What is this project?](#1-what-is-this-project)
2. [Running the project locally](#2-running-the-project-locally)
3. [Folder structure](#3-folder-structure)
4. [Architecture: How the parts work together](#4-architecture-how-the-parts-work-together)
5. [Step-by-step flows](#5-step-by-step-flows)
6. [The PokéAPI: Which data comes from where](#6-the-pokéapi-which-data-comes-from-where)
7. [JavaScript: file by file](#7-javascript-file-by-file)
8. [CSS: file by file](#8-css-file-by-file)
9. [HTML files](#9-html-files)
10. [Important concepts explained](#10-important-concepts-explained)
11. [Guides: How to extend the project](#11-guides-how-to-extend-the-project)
12. [Deployment and helper files](#12-deployment-and-helper-files)
13. [Observations about the current code](#13-observations-about-the-current-code)
14. [Glossary](#14-glossary)

---

## 1. What is this project?

A **Pokédex in the browser**: an overview of all Pokémon as colorful cards, a search, and
a popup with all the details of a Pokémon.

**What the site can do**

- Show all Pokémon as cards, either 20 at a time ("Catch more") or all of them
  in batches ("Show all").
- Search by name (the list updates shortly after typing).
- Click a card: a popup shows the image, types, number, generation and five tabs:
  **About**, **Stats**, **Evolution**, **Matchups**, **Moves**.
- In the popup: browse to the previous/next Pokémon (buttons or arrow keys), look at the
  shiny image, play the cry, close with `Esc`.
- Hovering over a card switches the image to the shiny version.

**Technology in one sentence:** plain HTML, CSS and JavaScript, **no framework, no build tool,
no `package.json`, no backend of its own**. The data comes live from the
[PokéAPI](https://pokeapi.co/), the sprites from the PokéAPI's GitHub repository. The
fonts are stored locally in the `fonts/` folder (no fonts are loaded from Google or similar).

**What it does not have:** no automated tests, no storage in the browser
(`localStorage`, cookies), no user accounts. This matches the site's
[privacy policy](../privacy-policy.html).

**Browsers:** Modern CSS/JS is used (`color-mix()`, `:where()`, `backdrop-filter`,
`Array.at()`, `IntersectionObserver` …). Current versions of Chrome, Firefox, Safari
and Edge are enough.

---

## 2. Running the project locally

There is nothing to install and nothing to build. You only need an **internet connection**
(because of the PokéAPI).

**Option A – simplest:** open `index.html` in the browser with a double click.

**Option B – cleaner, with a small local server** (behaves like the real site):

```bash
cd /Users/hamidou/Documents/Pokemon
python3 -m http.server 8000
# then in the browser: http://localhost:8000
```

Alternatively, use the VS Code extension "Live Server".

**Viewing errors:** Open the developer tools (`Cmd + Option + I`) → *Console* tab.
The code writes errors there (`console.error`) and additionally shows the user a
short message.

---

## 3. Folder structure

```text
Pokemon/
├── index.html                  The app's only page (entry point)
├── legal-notice.html           Legal page
├── privacy-policy.html         Legal page
│
├── css/                        All styles, split by area
│   ├── base.css                Fonts, base values, page background
│   ├── layout.css              Header, search field, card grid, footer
│   ├── buttons.css             "Catch more" / "Show all"
│   ├── pokemon-cards.css       The cards of the overview + type badges
│   ├── pokemon-detail.css      The popup (frame, header, tab bar, animations)
│   ├── bars.css                Bars and radar chart (Stats tab)
│   ├── about.css               About tab (and shared building blocks)
│   ├── evolution.css           Evolution tab
│   ├── matchups.css            Matchups tab
│   ├── moves.css               Moves tab (game selection, filters, move cards)
│   ├── legal.css               Legal notice and privacy policy
│   └── utilities.css           Only the .hidden class (must be loaded last)
│
├── js/                         All logic
│   ├── configuration.js        Constants, icons, type colors
│   ├── state.js                Shared state (global variables)
│   ├── text-and-image-helpers.js   Small helpers for texts, colors, image URLs
│   ├── data-loading.js         Fetching data from the API (with cache)
│   ├── components.js           HTML building blocks used by several tabs
│   ├── pokemon-list.js         Overview: startup, search, cards, loading more
│   ├── pokemon-detail.js       Popup: opening, tabs, browsing, keyboard
│   └── tabs/                   One tab per file
│       ├── about.js
│       ├── stats.js
│       ├── evolution.js
│       ├── matchups.js
│       ├── moves.js
│       └── moves-game-select.js   The game selection of the Moves tab
│
├── fonts/                      Font files (.woff2), included locally
├── images/
│   ├── pokemon.webp            Logo and favicon (Poké Ball)
│   └── search.svg              Magnifying glass in the search field
│
├── Documentation/              This documentation and the guides for deployment/Tailwind
├── .github/
│   ├── workflows/deploy.yml    Automatic deployment on push to main
│   └── dependabot.yml          Keeps the GitHub Actions up to date
├── up.sh                       Shortcut: pull, add, commit, push
├── plan.drawio                 Early sketch (not part of the site)
└── .gitignore                  Protects keys and credentials from being committed
```

**Recommended reading order of the code** (from simple to complex):

1. `configuration.js` → `state.js` → `text-and-image-helpers.js` (basics)
2. `data-loading.js` → `components.js` (fetching data, building blocks)
3. `pokemon-list.js` (the overview)
4. `pokemon-detail.js` (the popup and the tab system)
5. `tabs/about.js` → `stats.js` → `matchups.js` → `evolution.js` → `moves.js` → `moves-game-select.js`

---

## 4. Architecture: How the parts work together

### 4.1 No modules, everything shares one global scope

The code uses **no** `import`/`export` modules. Every file is loaded with a normal
`<script defer src="...">`. This means:

- All top-level functions and variables are **visible everywhere**. A function from
  `text-and-image-helpers.js` can be used directly in `about.js`.
- **Names must be unique.** Two files must not declare the same name.
  With `const`/`let` this causes an error in the console. With `function`, on the other hand,
  **the later file silently wins**, which is harder to find. That is why names have such
  long, descriptive forms (`fetchAllPokemonNamesAndIds`, `moveCardHtml` …).
- **The order of the `<script>` tags in `index.html` matters.** Whatever a file
  uses immediately on load must be in a file *above* it. Functions that are only called
  later (e.g. on a click) may also be defined further down.
- HTML attributes like `onclick="openPokemonDetail(25)"` call these global functions.

`defer` means: the scripts load in parallel but only run **after** the HTML text
has been fully read, and **in the order of the tags**. That is why
`pokemon-list.js` can use `document.getElementById("search-input")` right at the start.

### 4.2 Load order and who needs whom

| No. | File | Needs | Provides |
| --- | --- | --- | --- |
| 1 | `configuration.js` | nothing | URLs, page sizes, `icons`, type colors, `allTypeNames` |
| 2 | `state.js` | nothing | shared state variables |
| 3 | `text-and-image-helpers.js` | 1 | formatting, color and image helpers |
| 4 | `data-loading.js` | 1 | `fetchJsonWithCache`, `fetchPokemonById` |
| 5 | `components.js` | 1, 3 | bars, type badge, tab message |
| 6 | `pokemon-list.js` | 1–5 | startup, search, cards, loading more |
| 7 | `pokemon-detail.js` | 1–6 | popup, `registerTab`, `showTab` |
| 8 | `tabs/about.js` | 1–7 | registers the "About" tab |
| 9 | `tabs/stats.js` | 1–7 | registers "Base-Stats" |
| 10 | `tabs/evolution.js` | 1–7 | registers "Evolution" |
| 11 | `tabs/matchups.js` | 1–7 | registers "Matchups" |
| 12 | `tabs/moves.js` | 1–7 | registers "Moves" |
| 13 | `tabs/moves-game-select.js` | 12 | game selection (uses variables from `moves.js`) |

The **order of the tabs in the popup** is the order of the tab scripts in `index.html`
(items 8 to 12). More on this in [section 7.7](#77-jstabs--the-five-tabs).

### 4.3 Layer diagram

```text
                        index.html
                            │  <body onload="initializePokedex()">
                            ▼
   ┌─────────────────────────────────────────────────────────────┐
   │  pokemon-list.js   Overview: search, cards, loading more    │
   └───────────────┬─────────────────────────────────────────────┘
                   │ click on a card: openPokemonDetail(id)
                   ▼
   ┌─────────────────────────────────────────────────────────────┐
   │  pokemon-detail.js   Popup + tabs (registerTab/showTab)     │
   └───────────────┬─────────────────────────────────────────────┘
                   │ calls per tab: tab.render(pokemon)
                   ▼
   ┌─────────────────────────────────────────────────────────────┐
   │  tabs/about · stats · evolution · matchups · moves          │
   └───────────────┬─────────────────────────────────────────────┘
                   │ all of them use
                   ▼
   ┌─────────────────────────────────────────────────────────────┐
   │  Basics: configuration · state · text-and-image-helpers     │
   │          data-loading · components                          │
   └───────────────┬─────────────────────────────────────────────┘
                   ▼
              PokéAPI (internet)
```

`pokemon-list.js` and `pokemon-detail.js` know each other: the list opens the
popup, and the popup tells the list via `updateLoadButtonsVisibility()` that the
"Catch more"/"Show all" buttons should disappear while it is open.

### 4.4 How data becomes screen content

All of the code follows the same pattern:

```text
API data (JSON)  →  function builds an HTML string  →  innerHTML  →  CSS styles it
```

- Almost all functions ending in `...Html` **return HTML as a string** (template
  strings with backticks). The comment `/* html */` directly before the backtick is only
  a hint for the editor (syntax colors); it has no effect.
- Large building blocks are composed of small ones (`pokemonCardHtml` calls
  `pokemonCardHeadingHtml` and `pokemonCardTypesAndImageHtml` …). Each function does only one thing.
- The finished HTML is put into the page via `innerHTML` or `insertAdjacentHTML`.
- **For safety:** The texts come from the PokéAPI. The text from the search field is
  only used for comparing (`includes`) and is **never** inserted as HTML. If you later
  displayed texts from users, they would have to be escaped first.

### 4.5 The structure of the popup (DOM)

```text
#detail-overlay                        dark, blurred background (index.html)
└─ .detail-card                        the card (role="dialog"), carries the type colors
   ├─ .detail-header                   header with the type's gradient
   │  ├─ .detail-pokeball-watermark    rotating Poké Ball in the background
   │  ├─ .detail-toolbar               Previous/Next  |  Shiny, Cry, Close
   │  ├─ .detail-hero                  Name, number, subtitle, types  |  large image
   │  └─ .detail-tab-bar               one button per tab
   └─ .detail-body                     the scrollable content
      ├─ #About        .tab-panel      (initially empty and hidden)
      ├─ #Base-Stats   .tab-panel
      ├─ #Evolution    .tab-panel
      ├─ #Matchups     .tab-panel
      └─ #Moves        .tab-panel
```

All five tab containers exist immediately, but are empty and hidden with `.hidden`.
Their content is only created when the tab is opened for the first time.

---

## 5. Step-by-step flows

### 5.1 Page startup

1. The browser loads `index.html` and the stylesheets.
2. The scripts (`defer`) run one after another. They only create functions and constants;
   `pokemon-list.js` looks up the fixed HTML elements. The tab files call `registerTab()`.
3. When the page has finished loading, `<body onload="initializePokedex()">` calls the startup.
4. `initializePokedex()` first fetches the **total count** of Pokémon
   (`/pokemon?limit=1`) and then, in **one** request, the names and URLs of **all**
   Pokémon (`/pokemon?limit=<count>`). This produces `allPokemonNamesAndIds`
   (entries of the form `{ pokemonId, name }`). These are only names, no details yet.
5. `runSearch()` runs with an empty search field: all Pokémon match, the first 20 are
   loaded (`/pokemon/<id>` for each Pokémon) and displayed as cards.
6. If something fails: the message "The Pokémon could not be loaded. Please reload the page."

### 5.2 Search

1. On every keystroke, the search field calls `scheduleSearch()` (`oninput`).
2. `scheduleSearch()` resets and restarts a timer of **250 ms**. Only when nothing has been
   typed for that long does `runSearch()` run (*debounce*).
3. `runSearch()` filters `allPokemonNamesAndIds` by names that **contain** the search text
   (lowercase, whitespace at the edges removed), sets `displayedPokemonCount = 0`,
   removes all old cards and loads the first page of results.

The search only checks the **English API name** (e.g. `mr-mime` with a hyphen), not
the number and not the type.

### 5.3 "Catch more" and "Show all"

- **Catch more:** `loadNextPokemonPage()` loads the next `pokemonPerPage` (20) results.
- **Show all:** `loadAllRemainingPokemon()` loads all remaining results in batches of
  `pokemonPerLoadAllBatch` (50). Each batch appears immediately, so the page grows
  gradually. The button shows the progress ("Loading 150 / 1300") and both buttons are disabled.
- After every loading process, `updateLoadButtonsVisibility()` decides: the buttons are only
  visible if there are more results **and** no popup is open.
- If the user clicks something else in the meantime (e.g. a new search), the
  running loading processes are **discarded** (see [request numbers](#103-discarding-outdated-requests-request-numbers)).

### 5.4 Opening a popup

1. Click on a card → `openPokemonDetail(pokemonId)`.
2. The function increments `latestDetailRequestNumber` and loads the Pokémon
   (`fetchPokemonById`). It is usually already in the cache because the card loaded it.
3. If another Pokémon was clicked or the popup was closed in the meantime, the
   function ends silently.
4. `displayPokemonDetail(pokemon)`:
   - remembers the Pokémon in `pokemonInDetailView`,
   - builds the complete popup (`pokemonDetailHtml`) and puts it into `#detail-overlay`,
   - sets the class `first-open` **only on the first opening** (fade-in animation), not when
     browsing from Pokémon to Pokémon,
   - fades in the overlay and dims the overview (`.pokedex-dimmed`),
   - opens the **first** tab (`showTab(registeredTabs[0].tabId)`),
   - loads the "species" data in the background for the line below the name
     ("Seed Pokémon · Generation I · ★ Legendary").
5. `preloadNeighbourPokemon` preloads the previous and next Pokémon so that
   browsing responds immediately.

### 5.5 Opening a tab

`showTab(tabId)` in `pokemon-detail.js`:

1. All tabs are set to active/inactive (class `.active`, `aria-selected`, `.hidden`).
2. The content scrolls to the top.
3. If the tab has **already been built** for this Pokémon (`data-rendered`), you are done.
4. Otherwise `tab.render(pokemon)` is called:
   - If `render` returns **text**, it is displayed immediately.
   - If `render` returns a **Promise** (the tab first has to load data), the popup shows
     "Loading..." and waits.
5. If the Pokémon has changed in the meantime, the result is discarded.
6. The HTML text is inserted, then `tab.afterRender(tabPanel)` optionally runs.
7. On an error, "The details could not be loaded." appears and the tab may be retried
   by clicking it again.

### 5.6 Browsing, closing, keyboard

- **Browsing:** arrow buttons in the header or `←` / `→`. `getNeighbourPokemonId` works via the
  **position in the list**, not via `id ± 1`, because the IDs jump to
  10001+ for the special forms. After the last Pokémon it starts again at the first (and vice versa).
- **Closing:** the ✕ button, `Esc` or a click on the dark background
  (`closeDetailIfOverlayClicked` only closes if the background was really hit,
  not the card).
- Arrow keys are ignored when the focus is in an input field, and keys with
  `Ctrl`/`Alt`/`Cmd` belong to the browser.

### 5.7 The Moves tab in detail

1. `movesHtml(pokemon)` organizes the Pokémon's moves **by game and learn method**
   (`buildLearnsetPerGame`). The result goes into `learnsetPerGame`, newest game first.
2. The newest game that has level-up moves is preselected
   (`findNewestGameWithLevelUpMoves`).
3. The tab shows the **game selection** at the top (`moves-game-select.js`), below it the filters
   (Level up, TM/HM, Egg, Tutor, Other, each with a count) and the list as cards.
4. Each card immediately shows level and name. Type, category, power, accuracy, PP and
   description are **only loaded once the card is almost visible**
   (`IntersectionObserver`). With over 100 moves, that would otherwise be over 100 requests at once.
5. When the user changes the game or filter, `renderMovesView()` rebuilds the filters and list
   and restarts the observation. The game selection itself stays in place.

---

## 6. The PokéAPI: Which data comes from where

Base URL: `https://pokeapi.co/api/v2` (constant `pokeApiBaseUrl` in `configuration.js`).

| Endpoint | Loaded by | Used for |
| --- | --- | --- |
| `/pokemon?limit=1&offset=0` | `fetchTotalPokemonCount` | only the `count` field (total number) |
| `/pokemon?limit=<count>&offset=0` | `fetchAllPokemonNamesAndIds` | names and URLs of all Pokémon for the search |
| `/pokemon/<id>` | `fetchPokemonById` | card, popup header, stats, types, abilities list, moves list, images, cry |
| `pokemon.species.url` (`/pokemon-species/<id>`) | About tab, Evolution tab, subtitle | description, egg cycle, gender, egg groups, genus, generation, "legendary" |
| `species.evolution_chain.url` | Evolution tab | the evolution chain |
| `pokemon.location_area_encounters` | About tab | locations |
| `abilityEntry.ability.url` (`/ability/<id>`) | About tab | description of each ability |
| `typeEntry.type.url` (`/type/<id>`) | Matchups tab | `damage_relations` (who deals how much damage) |
| `/move/<name>` | Moves tab | type, category, power, accuracy, PP, description |

**Images** (`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon`,
constant `pokemonSpriteBaseUrl`):

- Cards and popup use the **URLs that are already in the `/pokemon/<id>` result**
  (`sprites.other.showdown`, `dream_world`, `official-artwork`, …). More on this in
  [text-and-image-helpers.js](#74-jstext-and-image-helpersjs).
- The Evolution tab builds the image URL itself: `<base>/other/official-artwork/<id>.png`.

**The cache:** Each URL is only loaded **once** per page visit
(`responseCacheByUrl` in `data-loading.js`). The cache lives only in memory and
is gone after reloading the page. It is never stored permanently anywhere.

---

## 7. JavaScript: file by file

### 7.1 `js/configuration.js`

**Purpose:** All fixed values in one place. If you want to adjust something (page size, colors,
icons), look here first.

| Name | Meaning |
| --- | --- |
| `pokeApiBaseUrl` | Base URL of the PokéAPI |
| `pokemonSpriteBaseUrl` | Base URL of the sprite images on GitHub |
| `pokemonPerPage` | 20 – this many Pokémon are added per click on "Catch more" |
| `pokemonPerLoadAllBatch` | 50 – batch size for "Show all" |
| `searchDelayMilliseconds` | 250 – wait time after the last keystroke before searching |
| `fallbackTypeColor` | `"blue"` – color in case a type is not in the tables |
| `pokemonCardWrapperClassName` | CSS class of the card wrapper; also used to remove the cards |
| `noDescriptionText` | Text if the API provides no description |
| `strokeIconSvg(shapes)` | Helper function: wraps SVG shapes into a 24×24 stroke icon |
| `icons` | All icons as SVG text: `previous`, `next`, `close`, `sound`, `sparkle`, `about`, `stats`, `evolution`, `matchups`, `moves`, `check`, `chevronDown`, `pokeball` |
| `mainColorByTypeName` | Main color per type (badge and start of the gradient) |
| `gradientEndColorByTypeName` | End color of the gradient per type |
| `allTypeNames` | All type names (from the keys of `mainColorByTypeName`); the Matchups tab calculates with them |

The icons inherit their color from the surrounding text (`stroke="currentColor"`).

### 7.2 `js/state.js`

**Purpose:** The global variables that `pokemon-list.js` and `pokemon-detail.js` read and
modify together.

| Variable | Meaning |
| --- | --- |
| `allPokemonNamesAndIds` | `{ pokemonId, name }` of all Pokémon, loaded once at startup |
| `searchResults` | The part of it that matches the current search |
| `displayedPokemonCount` | How many of the `searchResults` are already on the page as cards |
| `pokemonInDetailView` | The Pokémon of the open popup, `null` if it is closed |
| `latestListRequestNumber` | Number of the latest list loading process (older ones are discarded) |
| `latestDetailRequestNumber` | The same for the popup |
| `searchDelayTimerId` | Timer ID of the search delay |

### 7.3 `js/data-loading.js`

**Purpose:** Everything to do with loading data from the network, with a cache.

| Function | Job |
| --- | --- |
| `fetchJsonWithCache(url)` | **The** loading function for everyone. Loads a URL only once and afterwards returns the remembered result |
| `fetchJsonAndForgetFailure(url)` | Removes a failed request from the cache again so that a new attempt is possible |
| `fetchJsonFromNetwork(url)` | The actual `fetch` |
| `readJsonOrThrow(response, url)` | Throws an error for an HTTP status outside 200–299, otherwise returns the JSON |
| `fetchPokemonById(id)` | Shorthand for `/pokemon/<id>` |

### 7.4 `js/text-and-image-helpers.js`

**Purpose:** Small, independent helpers.

| Function | Job |
| --- | --- |
| `capitalizeFirstLetter(text)` | first letter uppercase |
| `formatNameForDisplay(apiName)` | `"special-attack"` → `"Special Attack"` |
| `extractIdFromUrl(url)` | `".../pokemon-species/133/"` → `133` |
| `findLatestEnglishText(entries, fieldName)` | Searches a list of `{ language, <field> }` for the **last English** entry and removes line breaks |
| `getMainColorOfPokemon` / `getGradientEndColorOfPokemon` | Colors based on the Pokémon's **first** type |
| `getListSpriteUrl` | Small animated card image (`showdown`), otherwise the normal front image |
| `getShinyListSpriteUrl` | The same as shiny (fallback: normal image) |
| `getDetailImageUrl` | Large popup image: `dream_world` → `official-artwork` → front image |
| `getShinyDetailImageUrl` | Large shiny image or `null` if there is none (then the shiny button is missing) |

The order with `||` is a **fallback chain**: if the first image is missing, the
next one is used.

### 7.5 `js/components.js`

**Purpose:** HTML building blocks used by **several tabs**.

| Function | Job |
| --- | --- |
| `barTrackHtml(value, max, colors)` | The bar itself; fill in percent (at most 100 %), colors as CSS variables |
| `barCellsHtml(label, value, max, colors)` | Three cells: label, value, bar |
| `barRowHtml(...)` | A complete bar row (Stats tab) |
| `pokemonColorStyle(pokemon)` | The `style` text that sets `--pokemon-main-color` and `--pokemon-gradient-end-color` |
| `typeBadgeHtml(typeName)` | The colored type badge |
| `tabMessageHtml(text)` | Status message for a tab ("Loading...", error, "does not evolve") |

`barColors` is always an object `{ startColor, endColor }`.

### 7.6 `js/pokemon-list.js` and `js/pokemon-detail.js`

#### `js/pokemon-list.js` – the overview

Organization in the code:

| Section | Functions |
| --- | --- |
| **Fixed elements** (top) | `searchInput`, `pokedexElement`, `pokedexMessageElement`, `loadButtonsContainer`, `loadAllButtonLabel` |
| **Startup** | `initializePokedex`, `fetchAllPokemonNamesAndIds`, `fetchTotalPokemonCount`, `toPokemonNameAndId` |
| **Search** | `scheduleSearch`, `runSearch`, `findPokemonMatchingSearchText`, `removeAllPokemonCards` |
| **Loading more** | `loadNextPokemonPage`, `loadAllRemainingPokemon`, `runListLoading`, `isOutdatedListRequest`, `showListLoadingError`, `appendNextPage`, `appendAllRemainingBatches`, `appendNextBatch`, `fetchPokemonOfListEntries` |
| **Display** | `showLoadAllProgress`, `setLoadButtonsDisabled`, `appendPokemonCards`, `showPokedexMessage`, `updateLoadButtonsVisibility` |
| **A card** | `pokemonCardHtml`, `pokemonCardHeadingHtml`, `pokemonCardTypesAndImageHtml`, `typeBadgesOfPokemonHtml`, `pokemonCardImageHtml` |

Important details:

- `runListLoading` is the shared frame for both ways of loading more: it runs the
  steps, catches errors, shows a message and then updates the buttons,
  but only if the request is still current.
- `appendNextBatch` returns `false` if a newer request has taken over in the
  meantime; then nothing is displayed anymore.
- `appendPokemonCards` inserts new cards **before** the message element
  (`insertAdjacentHTML("beforebegin", …)`). This way the message always stays the last element
  in `#pokedex`.
- `pokemonCardImageHtml` creates **two** stacked images (normal and shiny).
  The CSS crossfades from one to the other on hover.
- Images have `loading="lazy"`: the browser only loads them when they are almost visible.

#### `js/pokemon-detail.js` – the popup and the tab system

Organization in the code:

| Section | Functions |
| --- | --- |
| **Tab management** (top) | `detailOverlay`, `matchupsTabId`, `registeredTabs`, `registerTab` |
| **Opening, browsing, closing** | `openPokemonDetail`, `displayPokemonIfStillLatest`, `displayPokemonDetail`, `preloadNeighbourPokemon`, `getNeighbourPokemonId`, `showDetailOverlay`, `closePokemonDetail`, `closeDetailIfOverlayClicked` |
| **Popup structure** | `pokemonDetailHtml`, `detailHeaderHtml`, `detailToolbarHtml`, `detailNavigationHtml`, `detailActionsHtml`, `hasCrySound`, `detailRoundButtonHtml`, `previousPokemonButtonHtml`, `nextPokemonButtonHtml`, `shinyButtonHtml`, `cryButtonHtml`, `closeButtonHtml`, `detailHeroHtml`, `detailHeadingHtml`, `detailTitleHtml`, `getLongestWordLength`, `detailFigureHtml`, `detailHeaderTypeHtml` |
| **Tabs** | `tabButtonHtml`, `tabPanelHtml`, `showTab`, `setTabActive`, `fillTabPanel`, `renderTabContent`, `showTabContent`, `showTabLoadError` |
| **Line below the name** | `showSpeciesSummary`, `displaySubtitle`, `speciesSummaryText`, `getSpecialStatusText` |
| **Shiny and cry** | `toggleShinyImage`, `showDetailImage`, `flashDetailFigure`, `playPokemonCry` |
| **Keyboard** | `handleDetailKeyDown`, `stepWithArrowKey` (registered via `document.addEventListener("keydown", …)`) |

**The tab format** (comment at the top of the file):

```js
{
  tabId: "About",         // unique; used as the HTML id of the container
  label: "About",         // label in the tab button
  icon: icons.about,      // SVG text (see configuration.js)
  render: aboutHtml,      // (pokemon) => HTML text OR Promise with HTML text
  afterRender: fn         // optional: (tabPanel) => …, runs after the HTML is in the popup
}
```

Important details:

- `getLongestWordLength` returns the length of the longest word in the name. CSS calculates
  the font size from it (`--name-longest-word-length`) so that a word never breaks in the
  middle ("Landorus Incarnate" may span two lines, though).
- `detailHeaderTypeHtml` turns the types in the header into buttons that jump to the Matchups tab,
  but only if that tab exists. Without it they are plain labels.
- `flashDetailFigure` uses `void figureElement.offsetWidth` to force the
  flash animation to restart, even if the class was only just removed.
- `playPokemonCry` catches a refusal by the browser (autoplay rules); then it stays silent.

### 7.7 `js/tabs/` – the five tabs

Each tab file starts with `registerTab({ … })`. The tab's functions follow.

#### `tabs/about.js` – "About"

Shows the description text, height/weight/egg cycle, gender, egg groups, abilities and locations.

| Function | Job |
| --- | --- |
| `aboutHtml` | Loads everything and assembles the parts |
| `fetchAboutData` | Loads simultaneously (`Promise.all`): species, locations, abilities |
| `fetchAllAbilityDetails` | Loads each ability; if one fails, it becomes `null` (only that card then shows no text, the rest stays intact) |
| `descriptionQuoteHtml` | The Pokédex text from the games (replaces "POKéMON" with "Pokémon") |
| `basicFactTilesHtml` | Tiles Height, Weight, Egg Cycle |
| `genderAndEggGroupTilesHtml`, `genderTileHtml`, `genderBarHtml`, `genderLegendHtml` | Gender ratio as a two-color bar |
| `tileHtml`, `chipListHtml` | Small building blocks: tile and pills |
| `abilitiesSectionHtml`, `abilityCardHtml`, `abilityDescriptionText` | Ability cards (with a "Hidden" tag) |
| `locationsSectionHtml` | Locations as scrollable pills ("Unknown" if none are known) |

Conversions: the API returns height in **decimeters** (`× 10` = cm) and weight in
**hectograms** (`÷ 10` = kg). `gender_rate` is **eighths** female (`-1` = genderless).

#### `tabs/stats.js` – "Stats" (tabId `Base-Stats`)

Shows a **radar chart** (hexagon) and six **bars** plus a total bar.

| Area | Functions |
| --- | --- |
| Bars | `baseStatisticsHtml`, `toStatistic`, `createTotalBarEntry`, `statisticBarRowHtml` |
| Radar: geometry | `radarCornerAngleInRadians`, `radarPointCoordinates`, `radarPolygonPoints` |
| Radar: drawing | `radarChartHtml`, `radarRingsHtml`, `radarAxesHtml`, `radarAxisHtml`, `radarDotsHtml`, `radarDotHtml`, `radarLabelsHtml`, `radarLabelHtml`, `radarTextAnchor` |

Constants and their effect:

- `maximumStatisticValue = 255` and `maximumTotalValue = 780`: at these values the bar is full.
- `radarMaximumValue = 150`: from this value on the chart reaches the edge.
- `statisticBarColors`: gradient per bar, the order corresponds to HP, Attack,
  Defense, Sp. Attack, Sp. Defense, Speed, Total.
- `radarCornerLabels`: short names at the corners (HP, ATK, DEF, SpA, SpD, SPE).

The radar is a **hand-drawn SVG** (no library). A corner lies at
`angle = -90° + corner × 60°` (corner 0 = top). From the angle and a distance ratio
(0 = center, 1 = edge), `radarPointCoordinates` calculates a point with `cos` and `sin`.
The guide rings (at 25/50/75/100 %), the axes, the area and the dots are
all the same calculation with different ratios.

#### `tabs/evolution.js` – "Evolution"

Shows the evolution chain as a tree of Pokémon tiles and arrows with conditions.

| Function | Job |
| --- | --- |
| `evolutionHtml` | Loads species and chain; "does not evolve" if there is no evolution |
| `fetchEvolutionChain` | Returns the chain or `null` |
| `evolutionStageHtml` | **Recursive:** a Pokémon plus everything it evolves into (which is why branches like Eevee's also work) |
| `getWideLayoutClassName` | With more than `wideEvolutionBranchCount` (3) branches, it is drawn as a grid (`.wide`) |
| `evolutionBranchesHtml`, `evolutionBranchHtml` | Arrow with condition and the target Pokémon |
| `evolutionNodeHtml`, `evolutionNodeActionAttribute`, `evolutionNodeContentHtml` | The tile; the current Pokémon is not clickable, all others open their popup |
| `evolutionConditionText` | Several ways are joined with "or", duplicate texts are dropped |
| `evolutionDetailText` and `evolutionTriggerText`, `itemAndMoveConditionTexts`, `friendshipConditionTexts`, `circumstanceConditionTexts`, `partyAndStatsConditionTexts`, `attackVersusDefenseText` | Translate the API fields into text ("Level 16", "Use Fire Stone", "at night", "friendship 220+" …) |

The tile ID is the **species ID**. It is also the ID of the default form, so
a click can directly call `openPokemonDetail(speciesId)`.

#### `tabs/matchups.js` – "Matchups"

Shows which attacking types the Pokémon is weak to, resists or is immune to.

| Function | Job |
| --- | --- |
| `matchupsHtml` | Loads the types, calculates, builds the groups |
| `fetchTypesOfPokemon` | Loads the Pokémon's 1 or 2 types |
| `calculateDamageMultipliers` | Determines the damage factor per attacking type |
| `createNeutralDamageMultipliers` | Starting value: each of the 18 types has factor 1 |
| `applyDamageRelations`, `multiplyDamage` | Multiplies in the factors from `damage_relations` |
| `matchupGroupsHtml`, `matchupGroupHtmlIfNotEmpty`, `matchupGroupHtml`, `matchupHeadingHtml` | Display groups like "Very weak to ×4" |

**The calculation:** start at ×1. For each type of the Pokémon: `double_damage_from` → ×2,
`half_damage_from` → ×½, `no_damage_from` → ×0. With **two types** the factors are
multiplied. This produces ×4 (weak twice), ×¼ (resistant twice), weakness and
resistance cancel out to ×1, and ×0 (immunity) always wins. Groups without types are
not shown, ×1 is not listed at all ("All other types deal normal damage.").

#### `tabs/moves.js` – "Moves"

Shows all moves by game and learn method. The longest tab file.

| Area | Functions |
| --- | --- |
| Entry point | `movesHtml`, `findNewestGameWithLevelUpMoves` |
| Games: names, order | `getGameDisplayName`, `getGameGeneration`, `findKnownGame`, `getGameReleaseRank`, `compareGamesNewestFirst` |
| Organizing moves | `buildLearnsetPerGame`, `addMoveToLearnset`, `getOrCreateGame`, `createGame`, `toKnownLearnMethodApiName`, `createLearnedMove` |
| Filters and list | `movesViewHtml`, `findSelectedGame`, `ensureValidLearnMethodSelection`, `learnMethodFiltersHtml`, `learnMethodFilterButtonHtml`, `moveCardListHtml`, `sortMovesForDisplay`, `compareMovesByLevelThenName`, `selectLearnMethod`, `renderMovesView` |
| Card | `moveCardHtml`, `moveHeadingHtml` |
| Loading when visible | `observeMoveCards` (also registered as `afterRender`), `createMoveCardObserver`, `fillMoveCardsThatBecameVisible`, `fillMoveCard`, `showMoveDetails`, `showMoveDetailsError`, `moveBadgesHtml` |
| Values and description | `moveBodyHtml`, `moveEffectDescription`, `moveMeterHtml`, `meterLabelRowHtml` |

Important data structures and constants:

- `knownGameVersionGroups`: **table of all games in order of release** with display name
  and generation. The API IDs are not suitable for this (Japanese versions have late IDs).
  Unknown, newer games are appended at the end and appear under "Newer games".
- `learnMethods`: learn methods in filter order (`level-up`, `machine`, `egg`, `tutor`,
  `other`). Rare special cases are grouped into `other`
  (`toKnownLearnMethodApiName`). `tagText` returns the small pill at the start of a row
  ("Lv 16", "Evo", "TM" …).
- `learnsetPerGame`: list of the Pokémon's games, newest first. Shape:
  `{ versionGroupName, versionGroupId, movesByLearnMethod: { "level-up": [ { apiName, displayName, levelLearnedAt } ] } }`.
- `movesSelection`: current selection `{ versionGroupName, learnMethodApiName }`. Reset for every
  Pokémon. If the newly chosen game does not have the chosen learn method, the first
  available one is used (`ensureValidLearnMethodSelection`).
- `moveMeterColors`: colors of the bars via `color-mix` with `--move-color` (color of the
  move's type) or, as a fallback, the Pokémon's color.
- `maximumMovePower` (200), `maximumMoveAccuracy` (100), `maximumMovePowerPoints` (40): upper limits of the bars.

Status moves have no power, and some have no accuracy (they always hit): then
`moveMeterHtml` shows "–" and an empty bar.

#### `tabs/moves-game-select.js` – the game selection

A **custom-built dropdown** instead of `<select>`, because the list of a real `<select>` is drawn by the
operating system and cannot be styled. It follows the accessibility pattern
"listbox with `aria-activedescendant`": the button keeps the focus,
the list only marks the "active" option.

| Area | Functions |
| --- | --- |
| Structure | `gameSelectHtml`, `gameButtonHtml`, `gameListItemsHtml`, `gameListItemHtml`, `startsNewGeneration`, `generationHeadingHtml`, `gameOptionHtml`, `countMovesOfGame` |
| Opening/closing | `getGameOptionElements`, `isGameListOpen`, `toggleGameList`, `openGameList`, `markGameButtonExpanded`, `measureFreeSpaceBelowGameButton`, `limitGameListHeight`, `centerSelectedGameOption`, `scrollGameListIntoView`, `closeGameList`, `closeGameListIfClickedOutside` |
| Highlighting | `setActiveGameOption`, `scrollGameOptionIntoView`, `findActiveGameOption`, `getNeighbourGameOption` |
| Selection | `selectGame`, `showSelectedGameInSelect` |
| Keyboard | `gameSelectKeyHandlers` (table of key → function), `handleGameSelectKeyDown`, `keepKeyAwayFromPopup`, `moveHighlightWithArrowKey`, `moveHighlightToEdge`, `chooseHighlightedGame`, `closeGameListWithEscape`, `keepHorizontalArrowInsideOpenList` |

Keyboard operation with the list open: `↑` `↓` move, `Home`/`End` jump, `Enter` or
Space selects, `Esc` closes only the list, `Tab` closes it.
`keepKeyAwayFromPopup` calls `stopPropagation()` so that `Esc` and the arrow keys do not
reach the popup (otherwise `Esc` would close the whole popup and `←`/`→` would switch
the Pokémon).

The height of the opened list adapts to the free space in the popup but stays
between `minimumGameListHeight` (180 px) and `maximumGameListHeight` (340 px).

---

## 8. CSS: file by file

### 8.1 The order matters

In `index.html` it says: *"Order matters: later rules override earlier ones (utilities last)"*.
`utilities.css` contains only `.hidden { display: none; }`. It must come **last** so that
it overrides rules like `.detail-overlay { display: flex }` with the same specificity.

The legal pages only load `base.css`, `layout.css` and `legal.css`.

### 8.2 The files

| File | Content |
| --- | --- |
| `base.css` | 11 `@font-face` blocks for 7 font families, font variables (`--font-…`), `box-sizing: border-box`, page background (dark gradient, fixed), base values for `h1`, `p`, `img` |
| `layout.css` | **Header** (fixed at the top, 76 px, red), logo (rotates on hover), search field with magnifying glass, **card grid** `.pokedex`, dimming while a popup is open `.pokedex-dimmed`, message `.pokedex-message`, footer |
| `buttons.css` | The buttons "Catch more" (red) and "Show all" (blue, `.load-all`): thick bottom edge, shine streak, pressed in on click, disabled state |
| `pokemon-cards.css` | The card (type gradient, hover lift, shine streak), name, number, normal/shiny image switch, floating animation, **`.type-badge`** (also used in Matchups and Moves) |
| `pokemon-detail.css` | The popup: overlay (blur), **the card's color variables** (see 8.3), header with gradient, round glass buttons, name/types/image, tab bar, scrollable content, all popup animations, rules for narrow screens |
| `bars.css` | Bars (`.bar-row`, `.bar-track`, `.bar-fill`), Stats layout, the complete radar chart |
| `about.css` | About tab: quote, tiles, gender bar, pills, ability cards. **Also contains shared classes** (`.tab-message`, `.detail-section-title`, `.tile-label`, `.card-list`, `.chip-list`) that other tabs use too |
| `evolution.css` | Tree of tiles and arrows, wide variant `.wide`, vertical layout on phones |
| `matchups.css` | Group rows with a colored left border (red = weak, green = resistant, gray = immune) |
| `moves.css` | Game selection and its list, learn method filters (stick to the top while scrolling), move cards, placeholders with shimmer animation, value bars |
| `legal.css` | Readable text column for the legal notice and privacy policy |
| `utilities.css` | `.hidden` |

### 8.3 The color system (CSS variables)

A Pokémon's colors are **not** defined in CSS but written by the JavaScript as
CSS variables onto the elements. The CSS only uses them.

| Variable | Set by | Used for |
| --- | --- | --- |
| `--pokemon-main-color`, `--pokemon-gradient-end-color` | `pokemonColorStyle()` in `components.js`, as `style` on card and popup | Gradient of the card and the popup header; everything else derives from it |
| `--type-color` | `typeBadgeHtml()` | Color of a type badge |
| `--bar-start-color`, `--bar-end-color` | `barTrackHtml()` | Gradient of a bar |
| `--move-color` | `showMoveDetails()` in `moves.js` | Color of a move card after loading |
| `--name-longest-word-length` | `detailTitleHtml()` | Font size of the name in the popup |

In `.detail-card` (`pokemon-detail.css`) the **popup's colors** are derived from these:
`--accent-color` (light version of the type color), `--panel-background-color`, `--surface-color`,
`--surface-strong-color`, `--border-color`, `--text-color`, `--muted-text-color`.
All tab styles (`about.css`, `evolution.css`, `matchups.css`, `moves.css`) use these names.
**If you want to recolor the popup, change them in this one place.**

`color-mix(in srgb, <color> 55%, white)` mixes colors directly in CSS (lighter, more transparent).
Some rules have a simpler line in front of them as a **fallback** for browsers without `color-mix`.

### 8.4 Responsive behavior and motion

- **Breakpoint 520 px** (phone): smaller spacing, the title in the header disappears,
  in the popup only the **active** tab shows its label, Evolution becomes vertical,
  move type and category move to their own row.
- **560 px:** in the Stats tab the radar then sits above the bars instead of next to them.
- **1200 px:** `h1` becomes a fixed 2.5 rem.
- **`prefers-reduced-motion: reduce`:** anyone who has set "Reduce motion" in the operating system
  gets **no** animations in the popup (`animation: none`) and hardly any transitions. The
  logo in the header and the two loading buttons drop their rotation and shine effects.
  The overview's cards have no rule of their own for this (they keep floating).
- **Layout of the card grid:** `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`,
  i.e. as many columns as fit into the width.

---

## 9. HTML files

### 9.1 `index.html`

The app's only page. Structure from top to bottom:

| Element | Job |
| --- | --- |
| `<head>` | Favicon, all stylesheets (order matters), all scripts with `defer` (order matters) |
| `<body onload="initializePokedex()">` | Starts the app as soon as the page has loaded |
| `<header>` | Logo, title and search field `#search-input` (`oninput="scheduleSearch()"`) |
| `#pokedex` | The card grid; initially contains only the message `#pokedex-message`. JS inserts the cards |
| `#load-buttons` | The two buttons. Initially `hidden`; `#load-all-label` is the label of "Show all" |
| `#detail-overlay` | Empty container for the popup; JS fills it. `onclick` closes on a click on the background |
| `<footer>` | Links to the privacy policy and the legal notice |

IDs that the JavaScript looks up: `search-input`, `pokedex`, `pokedex-message`,
`load-buttons`, `load-all-label`, `detail-overlay`. If you rename one of them, you have to
adjust `pokemon-list.js` or `pokemon-detail.js`.

### 9.2 `legal-notice.html` and `privacy-policy.html`

Pure text pages (English). They have the same header as the app, but without the search field, and
only load `base.css`, `layout.css` and `legal.css`. No JavaScript. The content is in
`<section>` blocks with `<h2>` headings.

Both are opened **in a new tab** from the app's footer
(`target="_blank" rel="noopener"`).

---

## 10. Important concepts explained

### 10.1 Promises and `async`/`await`

Network requests take time. A **Promise** is a promise of a later result.
`await` waits for it without freezing the page. An `async` function always returns a
Promise. That is why a tab's `render` can simply be an `async function`: the
popup recognizes the Promise and shows "Loading..." until it is done.

`Promise.all([a, b, c])` starts several requests **at the same time** and waits for all of them. This is how the
About tab loads species, locations and abilities in parallel instead of one after another.

### 10.2 The cache stores Promises instead of results

```js
function fetchJsonWithCache(url) {
  if (!responseCacheByUrl.has(url)) {
    responseCacheByUrl.set(url, fetchJsonAndForgetFailure(url));
  }
  return responseCacheByUrl.get(url);
}
```

What is stored is the **Promise**, not the finished result. If two places request the same URL
almost simultaneously (e.g. the subtitle and the About tab the species data), they share
**one** network request. If it fails, it is removed from the cache so that a new attempt
is possible.

### 10.3 Discarding outdated requests (request numbers)

Problem: the user clicks on Pokémon A, then quickly on B. If A responds **after** B,
A would suddenly be displayed. Solution: every request gets a number.

```js
let thisRequestNumber = ++latestDetailRequestNumber;   // take a number
let pokemon = await fetchPokemonById(pokemonId);        // wait …
if (requestNumber !== latestDetailRequestNumber) return; // overtaken in the meantime → do nothing
```

The same pattern exists for the list (`latestListRequestNumber`). Closing the
popup also increments the number so that a request that is still running does not reopen it. Similarly,
tabs check with `pokemon !== pokemonInDetailView` whether it is still the same Pokémon.

### 10.4 Debouncing the search

Do not search on every letter, but only once there has been 250 ms of quiet.
`clearTimeout` cancels the old timer, `setTimeout` starts a new one.

### 10.5 Loading only when visible (`IntersectionObserver`)

An `IntersectionObserver` reports when an element enters an area. The
Moves tab observes every card in the popup's scroll area with `rootMargin: "600px 0px"`, i.e.
**600 px before** it becomes visible. This way hardly any placeholders are seen while scrolling, but
still not all moves are loaded at once. `fillMoveCard` uses
`moveCard.isConnected` to check whether the card is still on the page.

### 10.6 Placeholders without jumping (`:empty`)

Move cards already have a suitable height before loading (`.move-body:empty { height: 92px }`),
so that the page does not jump when the details load. Important: the empty elements must be **really empty**
(no space or line break inside either), otherwise `:empty` does not apply. That is why there is a note
in the code in `moveCardHtml`.

### 10.7 Tab registration

Instead of `pokemon-detail.js` knowing the tabs, the **tabs register themselves**
(`registerTab`). The popup builds buttons and containers from the list `registeredTabs`. A new tab
is therefore just a new file plus a `<script>` tag (see [11.1](#111-adding-a-new-tab)).

### 10.8 Accessibility (ARIA) and keyboard

- Popup: `role="dialog"`, `aria-modal="true"`, `aria-label` with the name.
- Tabs: `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`.
- Shiny button: `aria-pressed`. Icon buttons have `aria-label` and `title`.
- Game selection: `aria-haspopup`, `aria-expanded`, `role="listbox"`/`"option"`, `aria-activedescendant`.
- Decorative SVGs have `aria-hidden="true"`, the radar has `role="img"` with `aria-label`.
- Focus ring: rules with `:focus-visible`.
- Keyboard: see [5.6](#56-browsing-closing-keyboard) and the game selection in [7.7](#77-jstabs--the-five-tabs).

---

## 11. Guides: How to extend the project

### 11.1 Adding a new tab

1. Create a new file `js/tabs/my-tab.js`:

   ```js
   registerTab({
     tabId: "Team",          // unique, used as the HTML id (no spaces)
     label: "Team",          // text in the tab button
     icon: icons.about,      // existing icon, or create a new one in configuration.js
     render: teamHtml,
   });

   async function teamHtml(pokemon) {
     let species = await fetchJsonWithCache(pokemon.species.url);
     return /* html */ `<p>${formatNameForDisplay(species.name)}</p>`;
   }
   ```

2. In `index.html`, add the script **after the other tabs**. The order there is
   the order of the tabs in the popup:

   ```html
   <script defer src="js/tabs/my-tab.js"></script>
   ```

3. If needed, create a CSS file of your own and include it in `index.html` **before**
   `utilities.css`. You can use the popup's colors (`var(--text-color)`, `var(--accent-color)` …)
   directly.

Good to know:

- If `render` throws an error, the popup automatically shows "The details could not be loaded." and
  tries again on the next click on the tab.
- For code that may only run once the HTML is in the popup (observers, events),
  there is `afterRender: (tabPanel) => { … }`.
- Reusable building blocks: `barRowHtml`, `typeBadgeHtml`, `tabMessageHtml`, `tileHtml`,
  `chipListHtml`.
- The `tabId` `"Matchups"` is special: the type buttons in the header jump to it.

### 11.2 More or fewer Pokémon per click

In `configuration.js`: `pokemonPerPage` (for "Catch more") and `pokemonPerLoadAllBatch`
(batch size for "Show all").

### 11.3 Changing the search delay

`searchDelayMilliseconds` in `configuration.js`.

### 11.4 Changing a type's color

In `configuration.js`, adjust both tables: `mainColorByTypeName` (badge and start
of the gradient) and `gradientEndColorByTypeName` (end of the gradient). If you add a
**new type** here, it also automatically appears in the Matchups tab, because `allTypeNames` is built from
the keys of `mainColorByTypeName`.

### 11.5 Adding a new game to the Moves tab

In `moves.js`, extend the table `knownGameVersionGroups` with `{ apiName, displayName, generation }`,
**at the position that corresponds to the release date** (the position determines the
sorting). You can find the `apiName` (name of the "version group") in the `/pokemon/<id>` result under
`moves[].version_group_details[].version_group.name`. Without an entry the game still appears, with the formatted API name under "Newer games".

### 11.6 Adding a new icon

In `configuration.js`, create a new entry in the `icons` object, most simply with
`strokeIconSvg("<line …></line>")` (24×24 grid, color from the text). Use it with `icons.myIcon`.

### 11.7 Changing the popup's colors or font

Colors: the variables in `.detail-card` (`pokemon-detail.css`). Fonts: the
`--font-…` variables in `base.css`. New font: put the `.woff2` file in `fonts/` and add an
`@font-face` block in `base.css`. Load fonts **locally**, not from a third-party server
(the privacy policy assumes this).

### 11.8 Testing

There are no automated tests. Check by hand: cards load, search, "Catch more"/"Show
all", popup with all five tabs, browsing, `Esc`. Useful **special cases** to test:

| Pokémon | Why it is interesting |
| --- | --- |
| Eevee | Many branches in the evolution (grid layout) |
| Tyrogue | Evolution depends on Attack/Defense |
| Magnemite | Two types (factors ×4/×¼ in the Matchups tab) |
| Ditto | Genderless, no evolution |
| a Pokémon with a high ID (10000+) | Special form: browsing via the position in the list |
| a legendary | Subtitle "★ Legendary" |
| Landorus Incarnate | Long name, line break in the header |

---

## 12. Deployment and helper files

### 12.1 From change to live site

```text
Change in the editor
   │  ./up.sh "message"          (git pull, git add ., git commit, git push)
   ▼
Push to main
   ▼
GitHub Actions: .github/workflows/deploy.yml
   ├─ checks that index.html, css/ and js/ exist
   ├─ sets up SSH (key from the GitHub secrets)
   ├─ uploads via rsync (--delete: removes files that are missing in the repo)
   ├─ deletes the key again
   └─ checks that the site responds (curl)
```

There is **no build step**: the folder content is uploaded as it is.

**Not uploaded** (via `--exclude`): `.git/`, `.github/`, `.vscode/`,
`.well-known/`, `.DS_Store`, `.gitignore`, `Documentation/`, `plan.drawio` and `up.sh`.
So this documentation is never on the server.

The setup (key, secrets, server) is described in
[deployment-setup.md](deployment-setup.md). It also explains **why** the
repository contains no server data (it is public).

### 12.2 `up.sh`

```bash
git pull
git add .
git commit -m "$*"
git push
```

Usage: `./up.sh My message` (all words become the commit message). Note:
`git add .` includes **everything** that is not in `.gitignore`, and the push to `main`
**starts the deployment immediately**. Check beforehand with `git status` what is included.

### 12.3 `.gitignore`

Ignores `.DS_Store` and `.vscode/`. Also keys and credentials
(`.env`, `*.pem`, `*.key`, `id_ed25519*`, `id_rsa*`, `*_deploy`, `*_deploy.pub`) so that
they never accidentally end up in the public repository.

### 12.4 `.github/dependabot.yml`

Checks weekly whether there are newer versions of the GitHub Actions used in `deploy.yml`
and proposes them as a pull request. The actions are pinned in `deploy.yml` by
commit SHA (protection against tampered updates).

### 12.5 `plan.drawio`

An early sketch of the idea (for [draw.io](https://draw.io)). It is not part of the
site and is not uploaded.

### 12.6 `Documentation/`

- `code-explanation.md`: this file.
- `deployment-setup.md`: setting up the automatic deployment.
- `tailwind-setup.md`: guide to retrofitting Tailwind CSS (currently **not** in use).

---

## 13. Observations about the current code

This is not a list of bugs to work through, but a collection of places you might
come across while reading. I have not changed any of them.

| Where | What stands out | Possible consequence / suggestion |
| --- | --- | --- |
| `css/buttons.css`, line 14 | `--button-edge: var(--button-edge);` refers to **itself**. According to the CSS rules, such a cycle is invalid. The blue button is not affected because `.load-all` sets its own value | The red "Catch more" button probably has no dark "bottom edge" (the `box-shadow` with `var(--button-edge)` becomes invalid). I have not checked this in the browser. Fix: enter a real color there (e.g. a dark red) |
| `css/pokemon-cards.css`, line 60 | `.pokemon-card:hover::before` – but the card has no `::before` | The rule has no effect and can be removed |
| `css/base.css` | The fonts **Diplomata** and **Pacifico** (and `--font-diplomata`, `--font-pacifico`) are not used anywhere | Browsers do not load unused fonts, but the files (approx. 60 KB) sit in the repo. They can be removed |
| `Documentation/tailwind-setup.md` | Mentions `style.css` and `script.js`, which no longer exist (split into `css/` and `js/`) | The guide would need updating before use |
| `up.sh` | `git add .` includes everything and the push triggers the deployment immediately | Check `git status` beforehand |
| whole project | No tests | For larger refactorings, click through all tabs by hand |

---

## 14. Glossary

| Term | Meaning |
| --- | --- |
| **PokéAPI** | Free web interface with all Pokémon data (pokeapi.co) |
| **Sprite** | A small image of a Pokémon |
| **Shiny** | Rare, differently colored variant of a Pokémon |
| **Species** | A Pokémon's "kind". Contains description, genus, generation, egg groups and the link to the evolution chain |
| **Version group** | A game or a pair of games (e.g. "Red / Blue"); this is what the API calls the games |
| **Learnset** | All moves that a Pokémon can learn |
| **Learn method** | How a move is learned: level-up, TM/HM, egg, tutor, other |
| **TM / HM** | Technical/Hidden Machine, an item that teaches a move |
| **PP** | Power Points: how often a move can be used |
| **Matchup** | How good or bad one type is against another |
| **Overlay** | The layer above the page, here: the popup with the dark background |
| **Tab panel** | The content area of a tab |
| **DOM** | The tree structure of the page in the browser, which JavaScript can change |
| **Debounce** | Only performing an action once nothing has happened for a while |
| **Promise** | A promise of a later result (`async`/`await`) |
| **Lazy loading** | Only loading when needed (images with `loading="lazy"`, move details) |
| **ARIA** | Additional HTML attributes so that screen readers understand the page |
| **CSS variable** | A value like `--accent-color` that many rules use with `var(--accent-color)` |
| **Fallback** | Replacement value in case the first one is missing (`a \|\| b`) |
