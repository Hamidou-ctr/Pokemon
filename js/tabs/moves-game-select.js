// The game selection in the Moves tab (part of moves.js, which holds learnsetPerGame and movesSelection).
// A custom list instead of <select>: the browser's list is drawn by the operating system and cannot be
// styled. The button keeps the focus; the list follows the "listbox with aria-activedescendant" pattern.

// Height of the opened list in pixels: it adapts to the free space but stays within this range
const minimumGameListHeight = 180;
const maximumGameListHeight = 340;
const gameListBottomMargin = 24; // this much space remains between the list and the edge of the popup
const gameOptionScrollMargin = 8; // this much space remains when scrolling an option into view

// ---------- Structure ----------

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

// The games are grouped by generation, newest first; each one shows how many moves there are
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

// ---------- Opening and closing ----------

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
  gameButton.focus(); // Safari doesn't focus buttons on mouse click; without focus the arrow keys wouldn't arrive
}

// The list only gets as much height as is free below the button in the visible area,
// so that it doesn't stick out past the edge of the panel and the panel doesn't have to be pushed along
function measureFreeSpaceBelowGameButton(gameListElement) {
  let bottomOfPanel = document.querySelector(".detail-body").getBoundingClientRect().bottom;
  return bottomOfPanel - gameListElement.getBoundingClientRect().top - gameListBottomMargin;
}

function limitGameListHeight(freeSpaceBelowButton) {
  return Math.max(minimumGameListHeight, Math.min(maximumGameListHeight, freeSpaceBelowButton));
}

// Highlights the selected game and moves it to the middle of the list
function centerSelectedGameOption(gameListElement) {
  let selectedOption = gameListElement.querySelector('[aria-selected="true"]');
  setActiveGameOption(selectedOption);
  gameListElement.scrollTop = selectedOption.offsetTop - (gameListElement.clientHeight - selectedOption.offsetHeight) / 2;
}

// If the button is at the very bottom, the panel has to scroll along
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

// A click outside closes the list
function closeGameListIfClickedOutside(clickEvent) {
  if (isGameListOpen() && !clickEvent.target.closest(".game-select")) closeGameList();
}

// ---------- Highlighted option (mouse or arrow keys) ----------

// Highlights an option and scrolls it into view in the list if needed
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

// ---------- Selection ----------

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

// ---------- Keyboard ----------

// While the list is open, Esc and the arrow keys belong to the list: stopPropagation keeps them away
// from the popup, which would otherwise close on Esc and switch the Pokémon on left/right
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
  if (!isGameListOpen()) return; // when the list is closed, the click opens it
  keepKeyAwayFromPopup(keyEvent);
  selectGame(findActiveGameOption().dataset.game);
}

function closeGameListWithEscape(keyEvent) {
  if (!isGameListOpen()) return; // then the popup may close
  keepKeyAwayFromPopup(keyEvent);
  closeGameList();
}

function keepHorizontalArrowInsideOpenList(keyEvent) {
  if (isGameListOpen()) keepKeyAwayFromPopup(keyEvent);
}

document.addEventListener("click", closeGameListIfClickedOutside);
