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
  if (!learnsetPerGame.length) {
    return tabMessageHtml(`${formatNameForDisplay(pokemon.name)} does not learn any moves.`);
  }
  // Vorausgewählt ist das neueste Spiel, in dem es Attacken durch Level-up gibt: Kampfspiele
  // wie "Champions" kennen nur TMs, dort würde die wichtigste Liste fehlen
  let newestGameWithLevelUpMoves =
    learnsetPerGame.find((game) => game.movesByLearnMethod["level-up"]) || learnsetPerGame[0];
  movesSelection = { versionGroupName: newestGameWithLevelUpMoves.versionGroupName, learnMethodApiName: "" };
  return /* html */ `
    <div class="moves-header">${gameSelectHtml(newestGameWithLevelUpMoves)}</div>
    <div id="moves-view">${movesViewHtml()}</div>
  `;
}

function getGameDisplayName(versionGroupName) {
  let knownGame = knownGameVersionGroups.find((game) => game.apiName === versionGroupName);
  return knownGame ? knownGame.displayName : formatNameForDisplay(versionGroupName);
}

// "" bei Spielen, die noch nicht in der Tabelle stehen
function getGameGeneration(versionGroupName) {
  let knownGame = knownGameVersionGroups.find((game) => game.apiName === versionGroupName);
  return knownGame ? knownGame.generation : "";
}

// Ordnet die Attacken nach Spielversion und Lernmethode: neueste Version zuerst
function buildLearnsetPerGame(pokemon) {
  let gamesByVersionGroupName = new Map();
  for (let moveEntry of pokemon.moves) {
    for (let versionGroupDetail of moveEntry.version_group_details) {
      let versionGroupName = versionGroupDetail.version_group.name;
      if (!gamesByVersionGroupName.has(versionGroupName)) {
        gamesByVersionGroupName.set(versionGroupName, {
          versionGroupName,
          versionGroupId: extractIdFromUrl(versionGroupDetail.version_group.url),
          movesByLearnMethod: {},
        });
      }
      let learnMethodApiName = learnMethods.some(
        (learnMethod) => learnMethod.apiName === versionGroupDetail.move_learn_method.name,
      )
        ? versionGroupDetail.move_learn_method.name
        : "other";
      let movesByLearnMethod = gamesByVersionGroupName.get(versionGroupName).movesByLearnMethod;
      if (!movesByLearnMethod[learnMethodApiName]) movesByLearnMethod[learnMethodApiName] = [];
      movesByLearnMethod[learnMethodApiName].push({
        apiName: moveEntry.move.name,
        displayName: formatNameForDisplay(moveEntry.move.name),
        levelLearnedAt: versionGroupDetail.level_learned_at,
      });
    }
  }
  return [...gamesByVersionGroupName.values()].sort(
    (firstGame, secondGame) => getGameReleaseRank(secondGame) - getGameReleaseRank(firstGame),
  );
}

// Bekannte Spiele nach ihrer Position in der Tabelle, unbekannte (neuere) dahinter nach ID
function getGameReleaseRank(game) {
  let positionInTable = knownGameVersionGroups.findIndex(
    (knownGame) => knownGame.apiName === game.versionGroupName,
  );
  return positionInTable === -1 ? knownGameVersionGroups.length + game.versionGroupId : positionInTable;
}

// Filter (mit Anzahl) und Liste für das gewählte Spiel
function movesViewHtml() {
  let selectedGame = learnsetPerGame.find((game) => game.versionGroupName === movesSelection.versionGroupName);
  let learnMethodsWithMoves = learnMethods.filter((learnMethod) => selectedGame.movesByLearnMethod[learnMethod.apiName]);
  if (!learnMethodsWithMoves.some((learnMethod) => learnMethod.apiName === movesSelection.learnMethodApiName)) {
    movesSelection.learnMethodApiName = learnMethodsWithMoves[0].apiName;
  }
  let selectedLearnMethod = learnMethodsWithMoves.find(
    (learnMethod) => learnMethod.apiName === movesSelection.learnMethodApiName,
  );
  let sortedMoves = [...selectedGame.movesByLearnMethod[selectedLearnMethod.apiName]].sort(
    (firstMove, secondMove) =>
      firstMove.levelLearnedAt - secondMove.levelLearnedAt ||
      firstMove.displayName.localeCompare(secondMove.displayName),
  );
  return /* html */ `
    <div class="learn-method-filters" role="group" aria-label="How the moves are learned">
      ${learnMethodsWithMoves
        .map((learnMethod) => {
          let isActive = learnMethod.apiName === selectedLearnMethod.apiName;
          return `<button type="button" class="learn-method-filter${isActive ? " active" : ""}" aria-pressed="${isActive}" onclick="selectLearnMethod('${learnMethod.apiName}')">${learnMethod.label}<span class="learn-method-count">${selectedGame.movesByLearnMethod[learnMethod.apiName].length}</span></button>`;
        })
        .join("")}
    </div>
    <div class="card-list" id="moves-list">
      ${sortedMoves.map((move) => moveCardHtml(move, selectedLearnMethod)).join("")}
    </div>
  `;
}

// Eine Karte: Level (oder Lernart) und Name stehen sofort da. (Kein <header>-Element für die Kopfzeile:
// layout.css gibt jedem <header> der Seite den Stil des roten Seitenkopfes.) Alles Weitere (Typ, Kategorie, Werte,
// Beschreibung) kommt aus dem Netz, sobald die Karte fast im Bild ist. Der Platzhalter hat schon
// ungefähr die Höhe des fertigen Inhalts, damit beim Nachladen nichts springt.
function moveCardHtml(move, learnMethod) {
  return /* html */ `
    <article class="move-card" data-move-api-name="${move.apiName}">
      <div class="move-heading">
        <span class="move-learn-tag">${learnMethod.tagText(move)}</span>
        <h4 class="move-name">${move.displayName}</h4>
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
function gameSelectHtml(selectedGame) {
  let listItemsHtml = "";
  let previousGeneration = null;
  for (let game of learnsetPerGame) {
    let generation = getGameGeneration(game.versionGroupName);
    if (generation !== previousGeneration) {
      listItemsHtml += `<li class="game-generation-heading" role="presentation">${generation ? `Generation ${generation}` : "Newer games"}</li>`;
      previousGeneration = generation;
    }
    listItemsHtml += gameOptionHtml(game, game === selectedGame);
  }
  return /* html */ `
    <div class="game-select" data-game="${selectedGame.versionGroupName}" onkeydown="handleGameSelectKeyDown(event)">
      <span class="tile-label" id="game-label">Game</span>
      <button type="button" class="game-button" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="game-label game-current" onclick="toggleGameList()">
        <span id="game-current">${getGameDisplayName(selectedGame.versionGroupName)}</span>
        ${icons.chevronDown}
      </button>
      <ul class="game-list" id="game-list" role="listbox" aria-labelledby="game-label" hidden>${listItemsHtml}</ul>
    </div>
  `;
}

function gameOptionHtml(game, isSelected) {
  let totalMoveCount = Object.values(game.movesByLearnMethod).reduce(
    (sum, movesOfLearnMethod) => sum + movesOfLearnMethod.length,
    0,
  );
  return /* html */ `
    <li class="game-option${isSelected ? " active" : ""}" id="game-option-${game.versionGroupName}" role="option" data-game="${game.versionGroupName}" aria-selected="${isSelected}" onclick="selectGame('${game.versionGroupName}')" onmouseover="setActiveGameOption(this)">
      ${icons.check}
      <span class="game-name">${getGameDisplayName(game.versionGroupName)}</span>
      <span class="game-move-count">${totalMoveCount} moves</span>
    </li>
  `;
}

function getGameOptionElements() {
  return Array.from(document.querySelectorAll("#game-list .game-option"));
}

function isGameListOpen() {
  let gameListElement = document.getElementById("game-list");
  return Boolean(gameListElement) && !gameListElement.hidden;
}

function toggleGameList() {
  if (isGameListOpen()) closeGameList();
  else openGameList();
}

function openGameList() {
  let gameListElement = document.getElementById("game-list");
  let gameButton = document.querySelector(".game-button");
  gameListElement.hidden = false;
  gameButton.setAttribute("aria-expanded", "true");
  gameButton.focus(); // Safari fokussiert Knöpfe beim Mausklick nicht, ohne Fokus kämen die Pfeiltasten nicht an
  // Die Liste bekommt nur so viel Höhe, wie unter dem Knopf im sichtbaren Bereich frei ist,
  // damit sie nicht über den Rand des Panels ragt und das Panel nicht mitgeschoben werden muss
  let freeSpaceBelowButton =
    document.querySelector(".detail-body").getBoundingClientRect().bottom -
    gameListElement.getBoundingClientRect().top -
    24;
  gameListElement.style.maxHeight = `${Math.max(180, Math.min(340, freeSpaceBelowButton))}px`;
  let selectedOption = gameListElement.querySelector('[aria-selected="true"]');
  setActiveGameOption(selectedOption);
  // Das gewählte Spiel in die Mitte der Liste rücken
  gameListElement.scrollTop =
    selectedOption.offsetTop - (gameListElement.clientHeight - selectedOption.offsetHeight) / 2;
  if (freeSpaceBelowButton < 180) gameListElement.scrollIntoView({ block: "nearest", behavior: "smooth" }); // Knopf ganz unten: dann muss das Panel nachrücken
}

function closeGameList() {
  let gameListElement = document.getElementById("game-list");
  if (!gameListElement) return;
  gameListElement.hidden = true;
  let gameButton = document.querySelector(".game-button");
  gameButton.setAttribute("aria-expanded", "false");
  gameButton.removeAttribute("aria-activedescendant");
}

// Hebt eine Option hervor (Maus oder Pfeiltasten) und scrollt sie bei Bedarf in der Liste ins Bild
function setActiveGameOption(optionElement) {
  let gameListElement = document.getElementById("game-list");
  getGameOptionElements().forEach((gameOption) => gameOption.classList.toggle("active", gameOption === optionElement));
  document.querySelector(".game-button").setAttribute("aria-activedescendant", optionElement.id);
  if (optionElement.offsetTop < gameListElement.scrollTop) {
    gameListElement.scrollTop = optionElement.offsetTop - 8;
  } else if (optionElement.offsetTop + optionElement.offsetHeight > gameListElement.scrollTop + gameListElement.clientHeight) {
    gameListElement.scrollTop = optionElement.offsetTop + optionElement.offsetHeight - gameListElement.clientHeight + 8;
  }
}

// Bei offener Liste gehören Esc und die Pfeiltasten der Liste: stopPropagation hält sie vom
// Popup fern, das sonst bei Esc schließen und bei links/rechts das Pokémon wechseln würde
function handleGameSelectKeyDown(keyEvent) {
  let isListOpen = isGameListOpen();
  let gameOptionElements = getGameOptionElements();
  let activeOptionIndex = gameOptionElements.findIndex((gameOption) => gameOption.classList.contains("active"));
  let keepKeyAwayFromPopup = () => {
    keyEvent.preventDefault();
    keyEvent.stopPropagation();
  };
  if (keyEvent.key === "ArrowDown" || keyEvent.key === "ArrowUp") {
    keepKeyAwayFromPopup();
    if (!isListOpen) return openGameList();
    let stepDirection = keyEvent.key === "ArrowDown" ? 1 : -1;
    setActiveGameOption(gameOptionElements[(activeOptionIndex + stepDirection + gameOptionElements.length) % gameOptionElements.length]);
  } else if (keyEvent.key === "Home" || keyEvent.key === "End") {
    if (!isListOpen) return;
    keepKeyAwayFromPopup();
    setActiveGameOption(gameOptionElements[keyEvent.key === "Home" ? 0 : gameOptionElements.length - 1]);
  } else if (keyEvent.key === "Enter" || keyEvent.key === " ") {
    if (!isListOpen) return; // bei geschlossener Liste öffnet der Klick sie
    keepKeyAwayFromPopup();
    selectGame(gameOptionElements[activeOptionIndex].dataset.game);
  } else if (keyEvent.key === "Escape") {
    if (!isListOpen) return; // dann darf das Popup schließen
    keepKeyAwayFromPopup();
    closeGameList();
  } else if (keyEvent.key === "ArrowLeft" || keyEvent.key === "ArrowRight") {
    if (isListOpen) keepKeyAwayFromPopup();
  } else if (keyEvent.key === "Tab") {
    closeGameList();
  }
}

// Ein Klick außerhalb schließt die Liste
document.addEventListener("click", (clickEvent) => {
  if (isGameListOpen() && !clickEvent.target.closest(".game-select")) closeGameList();
});

function selectGame(versionGroupName) {
  movesSelection.versionGroupName = versionGroupName;
  document.querySelector(".game-select").dataset.game = versionGroupName;
  document.getElementById("game-current").textContent = getGameDisplayName(versionGroupName);
  getGameOptionElements().forEach((gameOption) =>
    gameOption.setAttribute("aria-selected", String(gameOption.dataset.game === versionGroupName)),
  );
  closeGameList();
  document.querySelector(".game-button").focus();
  renderMovesView();
}

function selectLearnMethod(learnMethodApiName) {
  movesSelection.learnMethodApiName = learnMethodApiName;
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
  if (moveCardVisibilityObserver) moveCardVisibilityObserver.disconnect();
  moveCardVisibilityObserver = new IntersectionObserver(
    (intersectionEntries) => {
      for (let intersectionEntry of intersectionEntries) {
        if (!intersectionEntry.isIntersecting) continue;
        moveCardVisibilityObserver.unobserve(intersectionEntry.target);
        fillMoveCard(intersectionEntry.target);
      }
    },
    { root: document.querySelector(".detail-body"), rootMargin: "600px 0px" },
  );
  document
    .querySelectorAll("#moves-list .move-card")
    .forEach((moveCard) => moveCardVisibilityObserver.observe(moveCard));
}

// Die Karte färbt sich in der Farbe des Attacken-Typs
async function fillMoveCard(moveCard) {
  try {
    let moveDetails = await fetchJsonWithCache(`${pokeApiBaseUrl}/move/${moveCard.dataset.moveApiName}`);
    if (!moveCard.isConnected) return; // inzwischen ist eine andere Liste oder ein anderes Pokémon zu sehen
    moveCard.style.setProperty(
      "--move-color",
      mainColorByTypeName[moveDetails.type.name] || fallbackTypeColor,
    );
    moveCard.querySelector(".move-badges").innerHTML =
      `${typeBadgeHtml(moveDetails.type.name)}<span class="move-category move-category-${moveDetails.damage_class.name}">${formatNameForDisplay(moveDetails.damage_class.name)}</span>`;
    moveCard.querySelector(".move-body").innerHTML = moveBodyHtml(moveDetails);
    moveCard.classList.add("loaded");
  } catch (error) {
    console.error(error);
    moveCard.classList.add("failed"); // nimmt die Platzhalter weg, Level und Name bleiben stehen
    moveCard.querySelector(".move-body").innerHTML =
      `<p class="move-description">The details could not be loaded.</p>`;
  }
}

// Power, Genauigkeit und AP als drei Balken nebeneinander, darunter die Beschreibung
function moveBodyHtml(moveDetails) {
  let effectDescription =
    findLatestEnglishText(moveDetails.effect_entries, "short_effect").replaceAll(
      "$effect_chance",
      moveDetails.effect_chance,
    ) ||
    findLatestEnglishText(moveDetails.flavor_text_entries, "flavor_text") ||
    "No description available.";
  return /* html */ `
    <div class="move-meters">
      ${moveMeterHtml("Power", moveDetails.power, maximumMovePower)}
      ${moveMeterHtml("Accuracy", moveDetails.accuracy, maximumMoveAccuracy, "%")}
      ${moveMeterHtml("PP", moveDetails.pp, maximumMovePowerPoints)}
    </div>
    <p class="move-description">${effectDescription}</p>
  `;
}

// Statusattacken haben keine Power, manche keine Genauigkeit (sie treffen immer): dann "–" und ein leerer Balken
function moveMeterHtml(label, value, maximumValue, unitSuffix = "") {
  let hasValue = value !== null && value !== undefined;
  return /* html */ `
    <div class="meter">
      <div class="meter-label-row">
        <span class="meter-label">${label}</span>
        <span class="meter-value">${hasValue ? `${value}${unitSuffix}` : "–"}</span>
      </div>
      ${barTrackHtml(hasValue ? value : 0, maximumValue, moveMeterColors)}
    </div>
  `;
}
