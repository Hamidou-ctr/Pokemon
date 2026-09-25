// Die Spiel-Auswahl im Moves-Tab (Teil von moves.js, dort stehen learnsetPerGame und movesSelection).
// Eine eigene Liste statt <select>: die Liste des Browsers zeichnet das Betriebssystem, sie lässt sich nicht
// gestalten. Der Knopf behält den Fokus, die Liste folgt dem Muster "Listbox mit aria-activedescendant".

// Höhe der aufgeklappten Liste in Pixeln: sie passt sich dem freien Platz an, bleibt aber in diesem Rahmen
const minimumGameListHeight = 180;
const maximumGameListHeight = 340;
const gameListBottomMargin = 24; // so viel Abstand bleibt zwischen Liste und Rand des Popups
const gameOptionScrollMargin = 8; // so viel Abstand bleibt beim Ins-Bild-Scrollen einer Option

// ---------- Aufbau ----------

function gameSelectHtml(selectedGame) {
  return /* html */ `
    <div class="game-select" data-game="${selectedGame.versionGroupName}" onkeydown="handleGameSelectKeyDown(event)">
      <span class="tile-label" id="game-label">Game</span>
      ${gameButtonHtml(selectedGame)}
      <ul class="game-list" id="game-list" role="listbox" aria-labelledby="game-label" hidden>${gameListItemsHtml(selectedGame)}</ul>
    </div>
  `;
}

function gameButtonHtml(selectedGame) {
  return /* html */ `
    <button type="button" class="game-button" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="game-label game-current" onclick="toggleGameList()">
      <span id="game-current">${getGameDisplayName(selectedGame.versionGroupName)}</span>
      ${icons.chevronDown}
    </button>
  `;
}

// Die Spiele stehen nach Generation gruppiert, neueste zuerst; bei jedem steht, wie viele Attacken es dort gibt
function gameListItemsHtml(selectedGame) {
  return learnsetPerGame
    .map((game, index) => gameListItemHtml(game, index, selectedGame))
    .join("");
}

function gameListItemHtml(game, index, selectedGame) {
  let optionHtml = gameOptionHtml(game, game === selectedGame);
  if (!startsNewGeneration(index)) return optionHtml;
  return generationHeadingHtml(getGameGeneration(game.versionGroupName)) + optionHtml;
}

function startsNewGeneration(gameIndex) {
  if (gameIndex === 0) return true;
  let generation = getGameGeneration(learnsetPerGame[gameIndex].versionGroupName);
  return generation !== getGameGeneration(learnsetPerGame[gameIndex - 1].versionGroupName);
}

function generationHeadingHtml(generation) {
  return `<li class="game-generation-heading" role="presentation">${generation ? `Generation ${generation}` : "Newer games"}</li>`;
}

function gameOptionHtml(game, isSelected) {
  return /* html */ `
    <li class="game-option${isSelected ? " active" : ""}" id="game-option-${game.versionGroupName}" role="option" data-game="${game.versionGroupName}" aria-selected="${isSelected}" onclick="selectGame('${game.versionGroupName}')" onmouseover="setActiveGameOption(this)">
      ${icons.check}
      <span class="game-name">${getGameDisplayName(game.versionGroupName)}</span>
      <span class="game-move-count">${countMovesOfGame(game)} moves</span>
    </li>
  `;
}

function countMovesOfGame(game) {
  return Object.values(game.movesByLearnMethod).reduce((sum, movesOfLearnMethod) => sum + movesOfLearnMethod.length, 0);
}

// ---------- Öffnen und Schließen ----------

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
  gameListElement.hidden = false;
  markGameButtonExpanded();
  let freeSpaceBelowButton = measureFreeSpaceBelowGameButton(gameListElement);
  gameListElement.style.maxHeight = `${limitGameListHeight(freeSpaceBelowButton)}px`;
  centerSelectedGameOption(gameListElement);
  if (freeSpaceBelowButton < minimumGameListHeight) scrollGameListIntoView(gameListElement);
}

function markGameButtonExpanded() {
  let gameButton = document.querySelector(".game-button");
  gameButton.setAttribute("aria-expanded", "true");
  gameButton.focus(); // Safari fokussiert Knöpfe beim Mausklick nicht, ohne Fokus kämen die Pfeiltasten nicht an
}

// Die Liste bekommt nur so viel Höhe, wie unter dem Knopf im sichtbaren Bereich frei ist,
// damit sie nicht über den Rand des Panels ragt und das Panel nicht mitgeschoben werden muss
function measureFreeSpaceBelowGameButton(gameListElement) {
  let bottomOfPanel = document.querySelector(".detail-body").getBoundingClientRect().bottom;
  return bottomOfPanel - gameListElement.getBoundingClientRect().top - gameListBottomMargin;
}

function limitGameListHeight(freeSpaceBelowButton) {
  return Math.max(minimumGameListHeight, Math.min(maximumGameListHeight, freeSpaceBelowButton));
}

// Hebt das gewählte Spiel hervor und rückt es in die Mitte der Liste
function centerSelectedGameOption(gameListElement) {
  let selectedOption = gameListElement.querySelector('[aria-selected="true"]');
  setActiveGameOption(selectedOption);
  gameListElement.scrollTop = selectedOption.offsetTop - (gameListElement.clientHeight - selectedOption.offsetHeight) / 2;
}

// Ist der Knopf ganz unten, muss das Panel nachrücken
function scrollGameListIntoView(gameListElement) {
  gameListElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function closeGameList() {
  let gameListElement = document.getElementById("game-list");
  if (!gameListElement) return;
  gameListElement.hidden = true;
  let gameButton = document.querySelector(".game-button");
  gameButton.setAttribute("aria-expanded", "false");
  gameButton.removeAttribute("aria-activedescendant");
}

// Ein Klick außerhalb schließt die Liste
function closeGameListIfClickedOutside(clickEvent) {
  if (isGameListOpen() && !clickEvent.target.closest(".game-select")) closeGameList();
}

// ---------- Hervorgehobene Option (Maus oder Pfeiltasten) ----------

// Hebt eine Option hervor und scrollt sie bei Bedarf in der Liste ins Bild
function setActiveGameOption(optionElement) {
  getGameOptionElements().forEach((gameOption) => gameOption.classList.toggle("active", gameOption === optionElement));
  document.querySelector(".game-button").setAttribute("aria-activedescendant", optionElement.id);
  scrollGameOptionIntoView(optionElement);
}

function scrollGameOptionIntoView(optionElement) {
  let gameListElement = document.getElementById("game-list");
  let optionBottom = optionElement.offsetTop + optionElement.offsetHeight;
  if (optionElement.offsetTop < gameListElement.scrollTop) {
    gameListElement.scrollTop = optionElement.offsetTop - gameOptionScrollMargin;
  } else if (optionBottom > gameListElement.scrollTop + gameListElement.clientHeight) {
    gameListElement.scrollTop = optionBottom - gameListElement.clientHeight + gameOptionScrollMargin;
  }
}

function findActiveGameOption() {
  return getGameOptionElements().find((gameOption) => gameOption.classList.contains("active"));
}

function getNeighbourGameOption(stepDirection) {
  let gameOptionElements = getGameOptionElements();
  let activeOptionIndex = gameOptionElements.indexOf(findActiveGameOption());
  return gameOptionElements[(activeOptionIndex + stepDirection + gameOptionElements.length) % gameOptionElements.length];
}

// ---------- Auswahl ----------

function selectGame(versionGroupName) {
  movesSelection.versionGroupName = versionGroupName;
  showSelectedGameInSelect(versionGroupName);
  closeGameList();
  document.querySelector(".game-button").focus();
  renderMovesView();
}

function showSelectedGameInSelect(versionGroupName) {
  document.querySelector(".game-select").dataset.game = versionGroupName;
  document.getElementById("game-current").textContent = getGameDisplayName(versionGroupName);
  getGameOptionElements().forEach((gameOption) =>
    gameOption.setAttribute("aria-selected", String(gameOption.dataset.game === versionGroupName)),
  );
}

// ---------- Tastatur ----------

// Bei offener Liste gehören Esc und die Pfeiltasten der Liste: stopPropagation hält sie vom
// Popup fern, das sonst bei Esc schließen und bei links/rechts das Pokémon wechseln würde
const gameSelectKeyHandlers = new Map([
  ["ArrowDown", moveHighlightWithArrowKey],
  ["ArrowUp", moveHighlightWithArrowKey],
  ["Home", moveHighlightToEdge],
  ["End", moveHighlightToEdge],
  ["Enter", chooseHighlightedGame],
  [" ", chooseHighlightedGame],
  ["Escape", closeGameListWithEscape],
  ["ArrowLeft", keepHorizontalArrowInsideOpenList],
  ["ArrowRight", keepHorizontalArrowInsideOpenList],
  ["Tab", closeGameList],
]);

function handleGameSelectKeyDown(keyEvent) {
  let handleKey = gameSelectKeyHandlers.get(keyEvent.key);
  if (handleKey) handleKey(keyEvent);
}

function keepKeyAwayFromPopup(keyEvent) {
  keyEvent.preventDefault();
  keyEvent.stopPropagation();
}

function moveHighlightWithArrowKey(keyEvent) {
  keepKeyAwayFromPopup(keyEvent);
  if (!isGameListOpen()) return openGameList();
  let stepDirection = keyEvent.key === "ArrowDown" ? 1 : -1;
  setActiveGameOption(getNeighbourGameOption(stepDirection));
}

function moveHighlightToEdge(keyEvent) {
  if (!isGameListOpen()) return;
  keepKeyAwayFromPopup(keyEvent);
  let gameOptionElements = getGameOptionElements();
  setActiveGameOption(keyEvent.key === "Home" ? gameOptionElements[0] : gameOptionElements.at(-1));
}

function chooseHighlightedGame(keyEvent) {
  if (!isGameListOpen()) return; // bei geschlossener Liste öffnet der Klick sie
  keepKeyAwayFromPopup(keyEvent);
  selectGame(findActiveGameOption().dataset.game);
}

function closeGameListWithEscape(keyEvent) {
  if (!isGameListOpen()) return; // dann darf das Popup schließen
  keepKeyAwayFromPopup(keyEvent);
  closeGameList();
}

function keepHorizontalArrowInsideOpenList(keyEvent) {
  if (isGameListOpen()) keepKeyAwayFromPopup(keyEvent);
}

document.addEventListener("click", closeGameListIfClickedOutside);
