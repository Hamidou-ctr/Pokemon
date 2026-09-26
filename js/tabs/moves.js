registerTab({
  tabId: "Moves",
  label: "Moves",
  icon: icons.moves,
  render: movesHtml,
  afterRender: observeMoveCards,
});

// All game versions in order of release, with display names and generation (for the groups of the list). The API's IDs are
// not suitable for this (the Japanese versions have late IDs). Unknown, newer entries go to the end.
// apiName is the name of the "version group" in the PokéAPI, generation is the Roman numeral of the generation.
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

// How a Pokémon learns a move, in the order of the filters. Everything rare (special cases of individual
// games) goes under "other". tagText returns the text of the small pill at the start of each row.
const learnMethods = [
  { apiName: "level-up", label: "Level up", tagText: (move) => (move.levelLearnedAt ? `Lv ${move.levelLearnedAt}` : "Evo") },
  { apiName: "machine", label: "TM / HM", tagText: () => "TM" },
  { apiName: "egg", label: "Egg", tagText: () => "Egg" },
  { apiName: "tutor", label: "Tutor", tagText: () => "Tutor" },
  { apiName: "other", label: "Other", tagText: () => "Other" },
];

// Upper limits of the bars in the detail view (power rarely goes above 150)
const maximumMovePower = 200;
const maximumMoveAccuracy = 100;
const maximumMovePowerPoints = 40; // "PP" in the games: how often the move can be used

// The bars glow in a light shade of the move's type; if that isn't loaded yet, they use the Pokémon's shade
const moveMeterColors = {
  startColor: "color-mix(in srgb, var(--move-color, var(--pokemon-main-color)) 60%, white)",
  endColor: "color-mix(in srgb, var(--move-color, var(--pokemon-main-color)) 30%, white)",
};

// Game versions of the displayed Pokémon, newest first:
// { versionGroupName, versionGroupId, movesByLearnMethod: { learnMethodApiName: [move] } }
// with move = { apiName, displayName, levelLearnedAt }
let learnsetPerGame = [];
let movesSelection = { versionGroupName: "", learnMethodApiName: "" }; // current selection, reset for every Pokémon
let moveCardVisibilityObserver; // only loads the details of a card once it is almost in view

function movesHtml(pokemon) {
  learnsetPerGame = buildLearnsetPerGame(pokemon);
  if (!learnsetPerGame.length) return tabMessageHtml(`${formatNameForDisplay(pokemon.name)} does not learn any moves.`);
  let preselectedGame = findNewestGameWithLevelUpMoves();
  movesSelection = { versionGroupName: preselectedGame.versionGroupName, learnMethodApiName: "" };
  return /* html */ `
    <div class="moves-header">
      ${gameSelectHtml(preselectedGame)}
      ${movesHelpHtml()}
    </div>
    <div id="moves-view">${movesViewHtml()}</div>
  `;
}

// The newest game with level-up moves is preselected: battle games
// like "Champions" only know TMs, so the most important list would be missing there
function findNewestGameWithLevelUpMoves() {
  return learnsetPerGame.find((game) => game.movesByLearnMethod["level-up"]) || learnsetPerGame[0];
}

// ---------- Games: names and order ----------

function getGameDisplayName(versionGroupName) {
  let knownGame = findKnownGame(versionGroupName);
  return knownGame ? knownGame.displayName : formatNameForDisplay(versionGroupName);
}

// "" for games that are not in the table yet
function getGameGeneration(versionGroupName) {
  let knownGame = findKnownGame(versionGroupName);
  return knownGame ? knownGame.generation : "";
}

function findKnownGame(versionGroupName) {
  return knownGameVersionGroups.find((knownGame) => knownGame.apiName === versionGroupName);
}

// Known games by their position in the table, unknown (newer) ones after them by ID
function getGameReleaseRank(game) {
  let positionInTable = knownGameVersionGroups.findIndex(
    (knownGame) => knownGame.apiName === game.versionGroupName,
  );
  return positionInTable === -1 ? knownGameVersionGroups.length + game.versionGroupId : positionInTable;
}

function compareGamesNewestFirst(firstGame, secondGame) {
  return getGameReleaseRank(secondGame) - getGameReleaseRank(firstGame);
}

// ---------- Organizing a Pokémon's moves by game and learn method ----------

// Newest version first
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

// Rare learn methods are grouped under "other"
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

// ---------- Filters and list for the selected game ----------

// Filters (with counts) and list for the selected game
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

// If the selected game has no moves for the selected learn method, the first available one is used
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

// ---------- A move card ----------

// Level (or learn method) and name are there immediately. Everything else (type, category, values, description)
// comes from the network once the card is almost in view. The placeholder already has roughly the height
// of the finished content so that nothing jumps when it loads. The empty elements must really be empty
// (no whitespace inside), because the CSS shows the placeholder with :empty.
function moveCardHtml(move, learnMethod) {
  return /* html */ `
    <article class="move-card" data-move-api-name="${move.apiName}">
      ${moveHeadingHtml(move, learnMethod)}
      <div class="move-body"></div>
    </article>
  `;
}

// No <header> element for the heading row: layout.css gives every <header> on the page the style of the red page header
function moveHeadingHtml(move, learnMethod) {
  return /* html */ `
    <div class="move-heading">
      <span class="move-learn-tag">${learnMethod.tagText(move)}</span>
      <h4 class="move-name">${move.displayName}</h4>
      <span class="move-badges"></span>
    </div>
  `;
}

// ---------- Load card details only once they become visible ----------

// Loads the details of a card only once it is almost in view: with over a hundred moves
// that would otherwise be over a hundred requests at once.
function observeMoveCards() {
  if (moveCardVisibilityObserver) moveCardVisibilityObserver.disconnect();
  moveCardVisibilityObserver = createMoveCardObserver();
  document
    .querySelectorAll("#moves-list .move-card")
    .forEach((moveCard) => moveCardVisibilityObserver.observe(moveCard));
}

// The lead distance is generous so that hardly any placeholders are visible while scrolling
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
    if (!moveCard.isConnected) return; // in the meantime a different list or a different Pokémon is being shown
    showMoveDetails(moveCard, moveDetails);
  } catch (error) {
    console.error(error);
    showMoveDetailsError(moveCard);
  }
}

// The card takes on the color of the move's type
function showMoveDetails(moveCard, moveDetails) {
  moveCard.style.setProperty("--move-color", mainColorByTypeName[moveDetails.type.name] || fallbackTypeColor);
  moveCard.querySelector(".move-badges").innerHTML = moveBadgesHtml(moveDetails);
  moveCard.querySelector(".move-body").innerHTML = moveBodyHtml(moveDetails);
  moveCard.classList.add("loaded");
}

function showMoveDetailsError(moveCard) {
  moveCard.classList.add("failed"); // removes the placeholders; level and name stay
  moveCard.querySelector(".move-body").innerHTML =
    `<p class="move-description">The details could not be loaded.</p>`;
}

// Type and category (physical, special, status)
function moveBadgesHtml(moveDetails) {
  let damageClassName = moveDetails.damage_class.name;
  return `${typeBadgeHtml(moveDetails.type.name)}<span class="move-category move-category-${damageClassName}">${formatNameForDisplay(damageClassName)}</span>`;
}

// ---------- Values and description of a move ----------

// Power, accuracy and PP as three bars side by side, with the description below
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

// Status moves have no power, some have no accuracy (they always hit): then "–" and an empty bar
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
