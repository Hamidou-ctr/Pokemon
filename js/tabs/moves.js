registerTab({
  tabId: "Moves",
  label: "Moves",
  icon: icons.moves,
  render: movesHtml,
  afterRender: observeMoveCards,
});

// Alle Spielversionen in der Reihenfolge ihres Erscheinens, mit Anzeigenamen und Generation (für die Gruppen der Liste). Die IDs der API taugen
// dafür nicht (die japanischen Fassungen haben späte IDs). Unbekannte, neuere Einträge kommen ans Ende.
// apiName ist der Name der "version group" in der PokéAPI, generation die römische Ziffer der Generation.
const knownGameVersionGroups = [
  { apiName: "red-green-japan", displayName: "Red / Green (JP)", generation: "I" },
  { apiName: "blue-japan", displayName: "Blue (JP)", generation: "I" },
  { apiName: "red-blue", displayName: "Red / Blue", generation: "I" },
  { apiName: "yellow", displayName: "Yellow", generation: "I" },
  { apiName: "gold-silver", displayName: "Gold / Silver", generation: "II" },
  { apiName: "crystal", displayName: "Crystal", generation: "II" },
  { apiName: "ruby-sapphire", displayName: "Ruby / Sapphire", generation: "III" },
  { apiName: "colosseum", displayName: "Colosseum", generation: "III" },
  { apiName: "firered-leafgreen", displayName: "FireRed / LeafGreen", generation: "III" },
  { apiName: "emerald", displayName: "Emerald", generation: "III" },
  { apiName: "xd", displayName: "XD", generation: "III" },
  { apiName: "diamond-pearl", displayName: "Diamond / Pearl", generation: "IV" },
  { apiName: "platinum", displayName: "Platinum", generation: "IV" },
  { apiName: "heartgold-soulsilver", displayName: "HeartGold / SoulSilver", generation: "IV" },
  { apiName: "black-white", displayName: "Black / White", generation: "V" },
  { apiName: "black-2-white-2", displayName: "Black 2 / White 2", generation: "V" },
  { apiName: "x-y", displayName: "X / Y", generation: "VI" },
  { apiName: "omega-ruby-alpha-sapphire", displayName: "Omega Ruby / Alpha Sapphire", generation: "VI" },
  { apiName: "sun-moon", displayName: "Sun / Moon", generation: "VII" },
  { apiName: "ultra-sun-ultra-moon", displayName: "Ultra Sun / Ultra Moon", generation: "VII" },
  { apiName: "lets-go-pikachu-lets-go-eevee", displayName: "Let's Go Pikachu / Eevee", generation: "VII" },
  { apiName: "sword-shield", displayName: "Sword / Shield", generation: "VIII" },
  { apiName: "the-isle-of-armor", displayName: "Isle of Armor", generation: "VIII" },
  { apiName: "the-crown-tundra", displayName: "Crown Tundra", generation: "VIII" },
  { apiName: "brilliant-diamond-shining-pearl", displayName: "Brilliant Diamond / Shining Pearl", generation: "VIII" },
  { apiName: "legends-arceus", displayName: "Legends: Arceus", generation: "VIII" },
  { apiName: "scarlet-violet", displayName: "Scarlet / Violet", generation: "IX" },
  { apiName: "the-teal-mask", displayName: "The Teal Mask", generation: "IX" },
  { apiName: "the-indigo-disk", displayName: "The Indigo Disk", generation: "IX" },
  { apiName: "legends-za", displayName: "Legends: Z-A", generation: "IX" },
  { apiName: "mega-dimension", displayName: "Mega Dimension", generation: "IX" },
  { apiName: "champions", displayName: "Champions", generation: "IX" },
];

// Wie ein Pokémon eine Attacke lernt, in der Reihenfolge der Filter. Alles Seltene (Sonderfälle einzelner
// Spiele) steht unter "other". tagText liefert den Text der kleinen Pille am Anfang jeder Zeile.
const learnMethods = [
  { apiName: "level-up", label: "Level up", tagText: (move) => (move.levelLearnedAt ? `Lv ${move.levelLearnedAt}` : "Evo") },
  { apiName: "machine", label: "TM / HM", tagText: () => "TM" },
  { apiName: "egg", label: "Egg", tagText: () => "Egg" },
  { apiName: "tutor", label: "Tutor", tagText: () => "Tutor" },
  { apiName: "other", label: "Other", tagText: () => "Other" },
];

// Obergrenzen der Balken in der Detailansicht (Power geht selten über 150)
const maximumMovePower = 200;
const maximumMoveAccuracy = 100;
const maximumMovePowerPoints = 40; // "PP" in den Spielen: wie oft die Attacke eingesetzt werden kann

// Die Balken leuchten in einem hellen Ton des Attacken-Typs; ist der noch nicht geladen, nehmen sie den Ton des Pokémon
const moveMeterColors = {
  startColor: "color-mix(in srgb, var(--move-color, var(--pokemon-main-color)) 60%, white)",
  endColor: "color-mix(in srgb, var(--move-color, var(--pokemon-main-color)) 30%, white)",
};

// Spielversionen des angezeigten Pokémon, neueste zuerst:
// { versionGroupName, versionGroupId, movesByLearnMethod: { learnMethodApiName: [move] } }
// mit move = { apiName, displayName, levelLearnedAt }
let learnsetPerGame = [];
let movesSelection = { versionGroupName: "", learnMethodApiName: "" }; // aktuelle Auswahl, wird bei jedem Pokémon neu gesetzt
let moveCardVisibilityObserver; // lädt die Details einer Karte erst nach, wenn sie fast im Bild ist

function movesHtml(pokemon) {
  learnsetPerGame = buildLearnsetPerGame(pokemon);
  if (!learnsetPerGame.length) return tabMessageHtml(`${formatNameForDisplay(pokemon.name)} does not learn any moves.`);
  let preselectedGame = findNewestGameWithLevelUpMoves();
  movesSelection = { versionGroupName: preselectedGame.versionGroupName, learnMethodApiName: "" };
  return /* html */ `
    <div class="moves-header">${gameSelectHtml(preselectedGame)}</div>
    <div id="moves-view">${movesViewHtml()}</div>
  `;
}

// Vorausgewählt ist das neueste Spiel, in dem es Attacken durch Level-up gibt: Kampfspiele
// wie "Champions" kennen nur TMs, dort würde die wichtigste Liste fehlen
function findNewestGameWithLevelUpMoves() {
  return learnsetPerGame.find((game) => game.movesByLearnMethod["level-up"]) || learnsetPerGame[0];
}

// ---------- Spiele: Namen und Reihenfolge ----------

function getGameDisplayName(versionGroupName) {
  let knownGame = findKnownGame(versionGroupName);
  return knownGame ? knownGame.displayName : formatNameForDisplay(versionGroupName);
}

// "" bei Spielen, die noch nicht in der Tabelle stehen
function getGameGeneration(versionGroupName) {
  let knownGame = findKnownGame(versionGroupName);
  return knownGame ? knownGame.generation : "";
}

function findKnownGame(versionGroupName) {
  return knownGameVersionGroups.find((knownGame) => knownGame.apiName === versionGroupName);
}

// Bekannte Spiele nach ihrer Position in der Tabelle, unbekannte (neuere) dahinter nach ID
function getGameReleaseRank(game) {
  let positionInTable = knownGameVersionGroups.findIndex(
    (knownGame) => knownGame.apiName === game.versionGroupName,
  );
  return positionInTable === -1 ? knownGameVersionGroups.length + game.versionGroupId : positionInTable;
}

function compareGamesNewestFirst(firstGame, secondGame) {
  return getGameReleaseRank(secondGame) - getGameReleaseRank(firstGame);
}

// ---------- Die Attacken eines Pokémon nach Spiel und Lernmethode ordnen ----------

// Neueste Version zuerst
function buildLearnsetPerGame(pokemon) {
  let gamesByVersionGroupName = new Map();
  for (let moveEntry of pokemon.moves) {
    for (let versionGroupDetail of moveEntry.version_group_details) {
      addMoveToLearnset(gamesByVersionGroupName, moveEntry.move, versionGroupDetail);
    }
  }
  return [...gamesByVersionGroupName.values()].sort(compareGamesNewestFirst);
}

function addMoveToLearnset(gamesByVersionGroupName, move, versionGroupDetail) {
  let game = getOrCreateGame(gamesByVersionGroupName, versionGroupDetail.version_group);
  let learnMethodApiName = toKnownLearnMethodApiName(versionGroupDetail.move_learn_method.name);
  if (!game.movesByLearnMethod[learnMethodApiName]) game.movesByLearnMethod[learnMethodApiName] = [];
  game.movesByLearnMethod[learnMethodApiName].push(createLearnedMove(move, versionGroupDetail));
}

function getOrCreateGame(gamesByVersionGroupName, versionGroup) {
  if (!gamesByVersionGroupName.has(versionGroup.name)) {
    gamesByVersionGroupName.set(versionGroup.name, createGame(versionGroup));
  }
  return gamesByVersionGroupName.get(versionGroup.name);
}

function createGame(versionGroup) {
  return {
    versionGroupName: versionGroup.name,
    versionGroupId: extractIdFromUrl(versionGroup.url),
    movesByLearnMethod: {},
  };
}

// Seltene Lernmethoden werden unter "other" zusammengefasst
function toKnownLearnMethodApiName(learnMethodApiName) {
  let isKnown = learnMethods.some((learnMethod) => learnMethod.apiName === learnMethodApiName);
  return isKnown ? learnMethodApiName : "other";
}

function createLearnedMove(move, versionGroupDetail) {
  return {
    apiName: move.name,
    displayName: formatNameForDisplay(move.name),
    levelLearnedAt: versionGroupDetail.level_learned_at,
  };
}

// ---------- Filter und Liste für das gewählte Spiel ----------

// Filter (mit Anzahl) und Liste für das gewählte Spiel
function movesViewHtml() {
  let selectedGame = findSelectedGame();
  let learnMethodsWithMoves = learnMethods.filter((learnMethod) => selectedGame.movesByLearnMethod[learnMethod.apiName]);
  ensureValidLearnMethodSelection(learnMethodsWithMoves);
  let selectedLearnMethod = learnMethodsWithMoves.find((learnMethod) => learnMethod.apiName === movesSelection.learnMethodApiName);
  return /* html */ `
    ${learnMethodFiltersHtml(selectedGame, learnMethodsWithMoves, selectedLearnMethod)}
    ${moveCardListHtml(selectedGame, selectedLearnMethod)}
  `;
}

function findSelectedGame() {
  return learnsetPerGame.find((game) => game.versionGroupName === movesSelection.versionGroupName);
}

// Hat das gewählte Spiel keine Attacken für die gewählte Lernmethode, gilt die erste vorhandene
function ensureValidLearnMethodSelection(learnMethodsWithMoves) {
  let isSelectionAvailable = learnMethodsWithMoves.some(
    (learnMethod) => learnMethod.apiName === movesSelection.learnMethodApiName,
  );
  if (!isSelectionAvailable) movesSelection.learnMethodApiName = learnMethodsWithMoves[0].apiName;
}

function learnMethodFiltersHtml(selectedGame, learnMethodsWithMoves, selectedLearnMethod) {
  let buttonsHtml = learnMethodsWithMoves
    .map((learnMethod) => learnMethodFilterButtonHtml(learnMethod, selectedGame, selectedLearnMethod))
    .join("");
  return `<div class="learn-method-filters" role="group" aria-label="How the moves are learned">${buttonsHtml}</div>`;
}

function learnMethodFilterButtonHtml(learnMethod, selectedGame, selectedLearnMethod) {
  let isActive = learnMethod.apiName === selectedLearnMethod.apiName;
  let moveCount = selectedGame.movesByLearnMethod[learnMethod.apiName].length;
  return `<button type="button" class="learn-method-filter${isActive ? " active" : ""}" aria-pressed="${isActive}" onclick="selectLearnMethod('${learnMethod.apiName}')">${learnMethod.label}<span class="learn-method-count">${moveCount}</span></button>`;
}

function moveCardListHtml(selectedGame, selectedLearnMethod) {
  let sortedMoves = sortMovesForDisplay(selectedGame.movesByLearnMethod[selectedLearnMethod.apiName]);
  return /* html */ `
    <div class="card-list" id="moves-list">
      ${sortedMoves.map((move) => moveCardHtml(move, selectedLearnMethod)).join("")}
    </div>
  `;
}

function sortMovesForDisplay(moves) {
  return [...moves].sort(compareMovesByLevelThenName);
}

function compareMovesByLevelThenName(firstMove, secondMove) {
  return (
    firstMove.levelLearnedAt - secondMove.levelLearnedAt ||
    firstMove.displayName.localeCompare(secondMove.displayName)
  );
}

function selectLearnMethod(learnMethodApiName) {
  movesSelection.learnMethodApiName = learnMethodApiName;
  renderMovesView();
}

function renderMovesView() {
  document.getElementById("moves-view").innerHTML = movesViewHtml();
  observeMoveCards();
}

// ---------- Eine Attacken-Karte ----------

// Level (oder Lernart) und Name stehen sofort da. Alles Weitere (Typ, Kategorie, Werte, Beschreibung)
// kommt aus dem Netz, sobald die Karte fast im Bild ist. Der Platzhalter hat schon ungefähr die Höhe
// des fertigen Inhalts, damit beim Nachladen nichts springt. Die leeren Elemente müssen wirklich leer
// sein (kein Leerraum darin), denn das CSS zeigt den Platzhalter mit :empty.
function moveCardHtml(move, learnMethod) {
  return /* html */ `
    <article class="move-card" data-move-api-name="${move.apiName}">
      ${moveHeadingHtml(move, learnMethod)}
      <div class="move-body"></div>
    </article>
  `;
}

// Kein <header>-Element für die Kopfzeile: layout.css gibt jedem <header> der Seite den Stil des roten Seitenkopfes
function moveHeadingHtml(move, learnMethod) {
  return /* html */ `
    <div class="move-heading">
      <span class="move-learn-tag">${learnMethod.tagText(move)}</span>
      <h4 class="move-name">${move.displayName}</h4>
      <span class="move-badges"></span>
    </div>
  `;
}

// ---------- Details der Karten erst nachladen, wenn sie sichtbar werden ----------

// Lädt die Details einer Karte erst, wenn sie fast im Bild ist: bei über hundert Attacken
// wären das sonst über hundert Anfragen auf einmal.
function observeMoveCards() {
  if (moveCardVisibilityObserver) moveCardVisibilityObserver.disconnect();
  moveCardVisibilityObserver = createMoveCardObserver();
  document
    .querySelectorAll("#moves-list .move-card")
    .forEach((moveCard) => moveCardVisibilityObserver.observe(moveCard));
}

// Der Vorlauf ist großzügig, damit beim Scrollen kaum Platzhalter zu sehen sind
function createMoveCardObserver() {
  return new IntersectionObserver(fillMoveCardsThatBecameVisible, {
    root: document.querySelector(".detail-body"),
    rootMargin: "600px 0px",
  });
}

function fillMoveCardsThatBecameVisible(intersectionEntries) {
  for (let intersectionEntry of intersectionEntries) {
    if (!intersectionEntry.isIntersecting) continue;
    moveCardVisibilityObserver.unobserve(intersectionEntry.target);
    fillMoveCard(intersectionEntry.target);
  }
}

async function fillMoveCard(moveCard) {
  try {
    let moveDetails = await fetchJsonWithCache(`${pokeApiBaseUrl}/move/${moveCard.dataset.moveApiName}`);
    if (!moveCard.isConnected) return; // inzwischen ist eine andere Liste oder ein anderes Pokémon zu sehen
    showMoveDetails(moveCard, moveDetails);
  } catch (error) {
    console.error(error);
    showMoveDetailsError(moveCard);
  }
}

// Die Karte färbt sich in der Farbe des Attacken-Typs
function showMoveDetails(moveCard, moveDetails) {
  moveCard.style.setProperty("--move-color", mainColorByTypeName[moveDetails.type.name] || fallbackTypeColor);
  moveCard.querySelector(".move-badges").innerHTML = moveBadgesHtml(moveDetails);
  moveCard.querySelector(".move-body").innerHTML = moveBodyHtml(moveDetails);
  moveCard.classList.add("loaded");
}

function showMoveDetailsError(moveCard) {
  moveCard.classList.add("failed"); // nimmt die Platzhalter weg, Level und Name bleiben stehen
  moveCard.querySelector(".move-body").innerHTML =
    `<p class="move-description">The details could not be loaded.</p>`;
}

// Typ und Kategorie (physisch, speziell, Status)
function moveBadgesHtml(moveDetails) {
  let damageClassName = moveDetails.damage_class.name;
  return `${typeBadgeHtml(moveDetails.type.name)}<span class="move-category move-category-${damageClassName}">${formatNameForDisplay(damageClassName)}</span>`;
}

// ---------- Werte und Beschreibung einer Attacke ----------

// Power, Genauigkeit und AP als drei Balken nebeneinander, darunter die Beschreibung
function moveBodyHtml(moveDetails) {
  return /* html */ `
    <div class="move-meters">
      ${moveMeterHtml("Power", moveDetails.power, maximumMovePower)}
      ${moveMeterHtml("Accuracy", moveDetails.accuracy, maximumMoveAccuracy, "%")}
      ${moveMeterHtml("PP", moveDetails.pp, maximumMovePowerPoints)}
    </div>
    <p class="move-description">${moveEffectDescription(moveDetails)}</p>
  `;
}

function moveEffectDescription(moveDetails) {
  let shortEffect = findLatestEnglishText(moveDetails.effect_entries, "short_effect")
    .replaceAll("$effect_chance", moveDetails.effect_chance);
  return shortEffect || findLatestEnglishText(moveDetails.flavor_text_entries, "flavor_text") || noDescriptionText;
}

// Statusattacken haben keine Power, manche keine Genauigkeit (sie treffen immer): dann "–" und ein leerer Balken
function moveMeterHtml(label, value, maximumValue, unitSuffix = "") {
  let hasValue = value !== null && value !== undefined;
  return /* html */ `
    <div class="meter">
      ${meterLabelRowHtml(label, hasValue ? `${value}${unitSuffix}` : "–")}
      ${barTrackHtml(hasValue ? value : 0, maximumValue, moveMeterColors)}
    </div>
  `;
}

function meterLabelRowHtml(label, valueText) {
  return /* html */ `
    <div class="meter-label-row">
      <span class="meter-label">${label}</span>
      <span class="meter-value">${valueText}</span>
    </div>
  `;
}
