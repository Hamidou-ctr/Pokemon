registerTab({
  name: "Moves",
  label: "Moves",
  icon: icons.moves,
  render: movesHtml,
  afterRender: observeMoveCards,
});

// Alle Spielversionen in der Reihenfolge ihres Erscheinens, mit Anzeigenamen und Generation (für die Gruppen der Liste). Die IDs der API taugen
// dafür nicht (die japanischen Fassungen haben späte IDs). Unbekannte, neuere Einträge kommen ans Ende.
const versionGroups = [
  ["red-green-japan", "Red / Green (JP)", "I"],
  ["blue-japan", "Blue (JP)", "I"],
  ["red-blue", "Red / Blue", "I"],
  ["yellow", "Yellow", "I"],
  ["gold-silver", "Gold / Silver", "II"],
  ["crystal", "Crystal", "II"],
  ["ruby-sapphire", "Ruby / Sapphire", "III"],
  ["colosseum", "Colosseum", "III"],
  ["firered-leafgreen", "FireRed / LeafGreen", "III"],
  ["emerald", "Emerald", "III"],
  ["xd", "XD", "III"],
  ["diamond-pearl", "Diamond / Pearl", "IV"],
  ["platinum", "Platinum", "IV"],
  ["heartgold-soulsilver", "HeartGold / SoulSilver", "IV"],
  ["black-white", "Black / White", "V"],
  ["black-2-white-2", "Black 2 / White 2", "V"],
  ["x-y", "X / Y", "VI"],
  ["omega-ruby-alpha-sapphire", "Omega Ruby / Alpha Sapphire", "VI"],
  ["sun-moon", "Sun / Moon", "VII"],
  ["ultra-sun-ultra-moon", "Ultra Sun / Ultra Moon", "VII"],
  ["lets-go-pikachu-lets-go-eevee", "Let's Go Pikachu / Eevee", "VII"],
  ["sword-shield", "Sword / Shield", "VIII"],
  ["the-isle-of-armor", "Isle of Armor", "VIII"],
  ["the-crown-tundra", "Crown Tundra", "VIII"],
  ["brilliant-diamond-shining-pearl", "Brilliant Diamond / Shining Pearl", "VIII"],
  ["legends-arceus", "Legends: Arceus", "VIII"],
  ["scarlet-violet", "Scarlet / Violet", "IX"],
  ["the-teal-mask", "The Teal Mask", "IX"],
  ["the-indigo-disk", "The Indigo Disk", "IX"],
  ["legends-za", "Legends: Z-A", "IX"],
  ["mega-dimension", "Mega Dimension", "IX"],
  ["champions", "Champions", "IX"],
];

// Wie ein Pokémon eine Attacke lernt, in der Reihenfolge der Filter. Alles Seltene (Sonderfälle einzelner
// Spiele) steht unter "other". tag ist die kleine Pille am Anfang jeder Zeile.
const learnMethods = [
  { key: "level-up", label: "Level up", tag: (move) => (move.level ? `Lv ${move.level}` : "Evo") },
  { key: "machine", label: "TM / HM", tag: () => "TM" },
  { key: "egg", label: "Egg", tag: () => "Egg" },
  { key: "tutor", label: "Tutor", tag: () => "Tutor" },
  { key: "other", label: "Other", tag: () => "Other" },
];

// Obergrenzen der Balken in der Detailansicht (Power geht selten über 150)
const maximumMovePower = 200;
const maximumMoveAccuracy = 100;
const maximumMovePp = 40;

// Die Balken leuchten in einem hellen Ton des Attacken-Typs; ist der noch nicht geladen, nehmen sie den Ton des Pokémon
const moveMeterColors = {
  border: "color-mix(in srgb, var(--move-color, var(--primary)) 60%, white)",
  fill: "color-mix(in srgb, var(--move-color, var(--primary)) 30%, white)",
};

let learnset = []; // Spielversionen des angezeigten Pokémon, neueste zuerst: { name, methods: { key: [move] } }
let movesView = { game: "", method: "" }; // aktuelle Auswahl, wird bei jedem Pokémon neu gesetzt
let moveCardObserver; // lädt die Details einer Karte erst nach, wenn sie fast im Bild ist

function movesHtml(pokemon) {
  learnset = buildLearnset(pokemon);
  if (!learnset.length) {
    return tabMessageHtml(`${formatName(pokemon.name)} does not learn any moves.`);
  }
  // Vorausgewählt ist das neueste Spiel, in dem es Attacken durch Level-up gibt: Kampfspiele
  // wie "Champions" kennen nur TMs, dort würde die wichtigste Liste fehlen
  let newest = learnset.find((group) => group.methods["level-up"]) || learnset[0];
  movesView = { game: newest.name, method: "" };
  return /* html */ `
    <div class="moves-header">${gameSelectHtml(newest)}</div>
    <div id="moves-view">${movesViewHtml()}</div>
  `;
}

function versionGroupLabel(name) {
  let known = versionGroups.find(([key]) => key === name);
  return known ? known[1] : formatName(name);
}

// "" bei Spielen, die noch nicht in der Tabelle stehen
function versionGeneration(name) {
  let known = versionGroups.find(([key]) => key === name);
  return known ? known[2] : "";
}

// Ordnet die Attacken nach Spielversion und Lernmethode: neueste Version zuerst
function buildLearnset(pokemon) {
  let groups = new Map();
  for (let entry of pokemon.moves) {
    for (let detail of entry.version_group_details) {
      let name = detail.version_group.name;
      if (!groups.has(name)) groups.set(name, { name, id: idFromUrl(detail.version_group.url), methods: {} });
      let key = learnMethods.some((m) => m.key === detail.move_learn_method.name)
        ? detail.move_learn_method.name
        : "other";
      let methods = groups.get(name).methods;
      if (!methods[key]) methods[key] = [];
      methods[key].push({
        id: entry.move.name,
        name: formatName(entry.move.name),
        level: detail.level_learned_at,
      });
    }
  }
  return [...groups.values()].sort((a, b) => versionRank(b) - versionRank(a));
}

// Bekannte Spiele nach ihrer Position in der Tabelle, unbekannte (neuere) dahinter nach ID
function versionRank(group) {
  let index = versionGroups.findIndex(([key]) => key === group.name);
  return index === -1 ? versionGroups.length + group.id : index;
}

// Filter (mit Anzahl) und Liste für das gewählte Spiel
function movesViewHtml() {
  let group = learnset.find((entry) => entry.name === movesView.game);
  let available = learnMethods.filter((method) => group.methods[method.key]);
  if (!available.some((method) => method.key === movesView.method)) {
    movesView.method = available[0].key;
  }
  let method = available.find((entry) => entry.key === movesView.method);
  let moves = [...group.methods[method.key]].sort(
    (a, b) => a.level - b.level || a.name.localeCompare(b.name),
  );
  return /* html */ `
    <div class="moves-methods" role="group" aria-label="How the moves are learned">
      ${available
        .map((entry) => {
          let isActive = entry.key === method.key;
          return `<button type="button" class="moves-method${isActive ? " active" : ""}" aria-pressed="${isActive}" onclick="selectMovesMethod('${entry.key}')">${entry.label}<span class="count">${group.methods[entry.key].length}</span></button>`;
        })
        .join("")}
    </div>
    <div class="card-list" id="moves-list">
      ${moves.map((move) => moveCardHtml(move, method)).join("")}
    </div>
  `;
}

// Eine Karte: Level (oder Lernart) und Name stehen sofort da. (Kein <header>-Element für die Kopfzeile:
// layout.css gibt jedem <header> der Seite den Stil des roten Seitenkopfes.) Alles Weitere (Typ, Kategorie, Werte,
// Beschreibung) kommt aus dem Netz, sobald die Karte fast im Bild ist. Der Platzhalter hat schon
// ungefähr die Höhe des fertigen Inhalts, damit beim Nachladen nichts springt.
function moveCardHtml(move, method) {
  return /* html */ `
    <article class="move-card" data-name="${move.id}">
      <div class="move-head">
        <span class="move-tag">${method.tag(move)}</span>
        <h4 class="move-name">${move.name}</h4>
        <span class="move-badges"></span>
      </div>
      <div class="move-body"></div>
    </article>
  `;
}

// ---------- Spiel-Auswahl ----------
// Eine eigene Liste statt <select>: die Liste des Browsers zeichnet das Betriebssystem, sie lässt sich nicht
// gestalten. Der Knopf behält den Fokus, die Liste folgt dem Muster "Listbox mit aria-activedescendant".

// Die Spiele stehen nach Generation gruppiert, neueste zuerst; bei jedem steht, wie viele Attacken es dort gibt
function gameSelectHtml(current) {
  let items = "";
  let lastGeneration = null;
  for (let group of learnset) {
    let generation = versionGeneration(group.name);
    if (generation !== lastGeneration) {
      items += `<li class="game-group" role="presentation">${generation ? `Generation ${generation}` : "Newer games"}</li>`;
      lastGeneration = generation;
    }
    items += gameOptionHtml(group, group === current);
  }
  return /* html */ `
    <div class="game-select" data-game="${current.name}" onkeydown="handleGameKeys(event)">
      <span class="tile-label" id="game-label">Game</span>
      <button type="button" class="game-button" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="game-label game-current" onclick="toggleGameList()">
        <span id="game-current">${versionGroupLabel(current.name)}</span>
        ${icons.chevronDown}
      </button>
      <ul class="game-list" id="game-list" role="listbox" aria-labelledby="game-label" hidden>${items}</ul>
    </div>
  `;
}

function gameOptionHtml(group, isSelected) {
  let total = Object.values(group.methods).reduce((sum, list) => sum + list.length, 0);
  return /* html */ `
    <li class="game-option${isSelected ? " active" : ""}" id="game-option-${group.name}" role="option" data-game="${group.name}" aria-selected="${isSelected}" onclick="selectMovesGame('${group.name}')" onmouseover="setActiveGameOption(this)">
      ${icons.check}
      <span class="game-name">${versionGroupLabel(group.name)}</span>
      <span class="game-count">${total} moves</span>
    </li>
  `;
}

function gameOptions() {
  return Array.from(document.querySelectorAll("#game-list .game-option"));
}

function isGameListOpen() {
  let list = document.getElementById("game-list");
  return Boolean(list) && !list.hidden;
}

function toggleGameList() {
  if (isGameListOpen()) closeGameList();
  else openGameList();
}

function openGameList() {
  let list = document.getElementById("game-list");
  let button = document.querySelector(".game-button");
  list.hidden = false;
  button.setAttribute("aria-expanded", "true");
  button.focus(); // Safari fokussiert Knöpfe beim Mausklick nicht, ohne Fokus kämen die Pfeiltasten nicht an
  // Die Liste bekommt nur so viel Höhe, wie unter dem Knopf im sichtbaren Bereich frei ist,
  // damit sie nicht über den Rand des Panels ragt und das Panel nicht mitgeschoben werden muss
  let free = document.querySelector(".info-body").getBoundingClientRect().bottom - list.getBoundingClientRect().top - 24;
  list.style.maxHeight = `${Math.max(180, Math.min(340, free))}px`;
  let selected = list.querySelector('[aria-selected="true"]');
  setActiveGameOption(selected);
  // Das gewählte Spiel in die Mitte der Liste rücken
  list.scrollTop = selected.offsetTop - (list.clientHeight - selected.offsetHeight) / 2;
  if (free < 180) list.scrollIntoView({ block: "nearest", behavior: "smooth" }); // Knopf ganz unten: dann muss das Panel nachrücken
}

function closeGameList() {
  let list = document.getElementById("game-list");
  if (!list) return;
  list.hidden = true;
  let button = document.querySelector(".game-button");
  button.setAttribute("aria-expanded", "false");
  button.removeAttribute("aria-activedescendant");
}

// Hebt eine Option hervor (Maus oder Pfeiltasten) und scrollt sie bei Bedarf in der Liste ins Bild
function setActiveGameOption(option) {
  let list = document.getElementById("game-list");
  gameOptions().forEach((entry) => entry.classList.toggle("active", entry === option));
  document.querySelector(".game-button").setAttribute("aria-activedescendant", option.id);
  if (option.offsetTop < list.scrollTop) {
    list.scrollTop = option.offsetTop - 8;
  } else if (option.offsetTop + option.offsetHeight > list.scrollTop + list.clientHeight) {
    list.scrollTop = option.offsetTop + option.offsetHeight - list.clientHeight + 8;
  }
}

// Bei offener Liste gehören Esc und die Pfeiltasten der Liste: stopPropagation hält sie vom
// Popup fern, das sonst bei Esc schließen und bei links/rechts das Pokémon wechseln würde
function handleGameKeys(event) {
  let isOpen = isGameListOpen();
  let options = gameOptions();
  let index = options.findIndex((option) => option.classList.contains("active"));
  let claim = () => {
    event.preventDefault();
    event.stopPropagation();
  };
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    claim();
    if (!isOpen) return openGameList();
    let step = event.key === "ArrowDown" ? 1 : -1;
    setActiveGameOption(options[(index + step + options.length) % options.length]);
  } else if (event.key === "Home" || event.key === "End") {
    if (!isOpen) return;
    claim();
    setActiveGameOption(options[event.key === "Home" ? 0 : options.length - 1]);
  } else if (event.key === "Enter" || event.key === " ") {
    if (!isOpen) return; // bei geschlossener Liste öffnet der Klick sie
    claim();
    selectMovesGame(options[index].dataset.game);
  } else if (event.key === "Escape") {
    if (!isOpen) return; // dann darf das Popup schließen
    claim();
    closeGameList();
  } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    if (isOpen) claim();
  } else if (event.key === "Tab") {
    closeGameList();
  }
}

// Ein Klick außerhalb schließt die Liste
document.addEventListener("click", (event) => {
  if (isGameListOpen() && !event.target.closest(".game-select")) closeGameList();
});

function selectMovesGame(name) {
  movesView.game = name;
  document.querySelector(".game-select").dataset.game = name;
  document.getElementById("game-current").textContent = versionGroupLabel(name);
  gameOptions().forEach((option) =>
    option.setAttribute("aria-selected", String(option.dataset.game === name)),
  );
  closeGameList();
  document.querySelector(".game-button").focus();
  renderMovesView();
}

function selectMovesMethod(key) {
  movesView.method = key;
  renderMovesView();
}

function renderMovesView() {
  document.getElementById("moves-view").innerHTML = movesViewHtml();
  observeMoveCards();
}

// Lädt die Details einer Karte erst, wenn sie fast im Bild ist: bei über hundert Attacken
// wären das sonst über hundert Anfragen auf einmal. Der Vorlauf ist großzügig, damit beim
// Scrollen kaum Platzhalter zu sehen sind.
function observeMoveCards() {
  if (moveCardObserver) moveCardObserver.disconnect();
  moveCardObserver = new IntersectionObserver(
    (entries) => {
      for (let entry of entries) {
        if (!entry.isIntersecting) continue;
        moveCardObserver.unobserve(entry.target);
        fillMoveCard(entry.target);
      }
    },
    { root: document.querySelector(".info-body"), rootMargin: "600px 0px" },
  );
  document
    .querySelectorAll("#moves-list .move-card")
    .forEach((card) => moveCardObserver.observe(card));
}

// Die Karte färbt sich in der Farbe des Attacken-Typs
async function fillMoveCard(card) {
  try {
    let move = await fetchJson(`${baseUrl}/move/${card.dataset.name}`);
    if (!card.isConnected) return; // inzwischen ist eine andere Liste oder ein anderes Pokémon zu sehen
    card.style.setProperty(
      "--move-color",
      typePokemonPrimaryBackgroundColor[move.type.name] || defaultTypeColor,
    );
    card.querySelector(".move-badges").innerHTML =
      `${typeBadgeHtml(move.type.name)}<span class="category category-${move.damage_class.name}">${formatName(move.damage_class.name)}</span>`;
    card.querySelector(".move-body").innerHTML = moveBodyHtml(move);
    card.classList.add("loaded");
  } catch (error) {
    console.error(error);
    card.classList.add("failed"); // nimmt die Platzhalter weg, Level und Name bleiben stehen
    card.querySelector(".move-body").innerHTML =
      `<p class="move-description">The details could not be loaded.</p>`;
  }
}

// Power, Genauigkeit und AP als drei Balken nebeneinander, darunter die Beschreibung
function moveBodyHtml(move) {
  let effect =
    englishText(move.effect_entries, "short_effect").replaceAll(
      "$effect_chance",
      move.effect_chance,
    ) ||
    englishText(move.flavor_text_entries, "flavor_text") ||
    "No description available.";
  return /* html */ `
    <div class="move-meters">
      ${moveMeterHtml("Power", move.power, maximumMovePower)}
      ${moveMeterHtml("Accuracy", move.accuracy, maximumMoveAccuracy, "%")}
      ${moveMeterHtml("PP", move.pp, maximumMovePp)}
    </div>
    <p class="move-description">${effect}</p>
  `;
}

// Statusattacken haben keine Power, manche keine Genauigkeit (sie treffen immer): dann "–" und ein leerer Balken
function moveMeterHtml(label, value, maximum, suffix = "") {
  let hasValue = value !== null && value !== undefined;
  return /* html */ `
    <div class="meter">
      <div class="meter-top">
        <span class="meter-label">${label}</span>
        <span class="meter-value">${hasValue ? `${value}${suffix}` : "–"}</span>
      </div>
      ${barTrackHtml(hasValue ? value : 0, maximum, moveMeterColors)}
    </div>
  `;
}
