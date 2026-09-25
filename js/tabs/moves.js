registerTab({
  name: "Moves",
  label: "Moves",
  icon: icons.moves,
  render: movesHtml,
  afterRender: observeMoveCards,
});

// Alle Spielversionen in der Reihenfolge ihres Erscheinens, mit Anzeigenamen. Die IDs der API taugen
// dafür nicht (die japanischen Fassungen haben späte IDs). Unbekannte, neuere Einträge kommen ans Ende.
const versionGroups = [
  ["red-green-japan", "Red / Green (JP)"],
  ["blue-japan", "Blue (JP)"],
  ["red-blue", "Red / Blue"],
  ["yellow", "Yellow"],
  ["gold-silver", "Gold / Silver"],
  ["crystal", "Crystal"],
  ["ruby-sapphire", "Ruby / Sapphire"],
  ["colosseum", "Colosseum"],
  ["firered-leafgreen", "FireRed / LeafGreen"],
  ["emerald", "Emerald"],
  ["xd", "XD"],
  ["diamond-pearl", "Diamond / Pearl"],
  ["platinum", "Platinum"],
  ["heartgold-soulsilver", "HeartGold / SoulSilver"],
  ["black-white", "Black / White"],
  ["black-2-white-2", "Black 2 / White 2"],
  ["x-y", "X / Y"],
  ["omega-ruby-alpha-sapphire", "Omega Ruby / Alpha Sapphire"],
  ["sun-moon", "Sun / Moon"],
  ["ultra-sun-ultra-moon", "Ultra Sun / Ultra Moon"],
  ["lets-go-pikachu-lets-go-eevee", "Let's Go Pikachu / Eevee"],
  ["sword-shield", "Sword / Shield"],
  ["the-isle-of-armor", "Isle of Armor"],
  ["the-crown-tundra", "Crown Tundra"],
  ["brilliant-diamond-shining-pearl", "Brilliant Diamond / Shining Pearl"],
  ["legends-arceus", "Legends: Arceus"],
  ["scarlet-violet", "Scarlet / Violet"],
  ["the-teal-mask", "The Teal Mask"],
  ["the-indigo-disk", "The Indigo Disk"],
  ["legends-za", "Legends: Z-A"],
  ["mega-dimension", "Mega Dimension"],
  ["champions", "Champions"],
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
    <div class="moves-header">
      <label class="game-select">
        <span class="tile-label">Game</span>
        <select onchange="selectMovesGame(this.value)" aria-label="Game">
          ${learnset
            .map(
              (group) =>
                `<option value="${group.name}"${group === newest ? " selected" : ""}>${versionGroupLabel(group.name)}</option>`,
            )
            .join("")}
        </select>
      </label>
    </div>
    <div id="moves-view">${movesViewHtml()}</div>
  `;
}

function versionGroupLabel(name) {
  let known = versionGroups.find(([key]) => key === name);
  return known ? known[1] : formatName(name);
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

function selectMovesGame(name) {
  movesView.game = name;
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
