// Die Übersicht: Start, Suche, Karten und die Knöpfe "Mehr fangen" / "Alle anzeigen"

// Feste Elemente aus dem HTML, die von Anfang an existieren
const searchInput = document.getElementById("search-input");
const pokedexElement = document.getElementById("pokedex");
const pokedexMessageElement = document.getElementById("pokedex-message");
const loadButtonsContainer = document.getElementById("load-buttons");
const loadAllButtonLabel = document.getElementById("load-all-label");
const loadAllButtonDefaultText = loadAllButtonLabel.textContent;

// ---------- Start ----------

async function initializePokedex() {
  try {
    allPokemonNamesAndIds = await fetchAllPokemonNamesAndIds();
    await runSearch();
  } catch (error) {
    console.error(error);
    showPokedexMessage("The Pokémon could not be loaded. Please reload the page.");
  }
}

async function fetchAllPokemonNamesAndIds() {
  let totalPokemonCount = await fetchTotalPokemonCount();
  let fullListResponse = await fetchJsonWithCache(
    `${pokeApiBaseUrl}/pokemon?limit=${totalPokemonCount}&offset=0`,
  );
  return fullListResponse.results.map(toPokemonNameAndId);
}

// Erst die Gesamtzahl abfragen, damit wirklich alle Pokémon geladen werden, egal wie viele es gibt
async function fetchTotalPokemonCount() {
  let countResponse = await fetchJsonWithCache(`${pokeApiBaseUrl}/pokemon?limit=1&offset=0`);
  return countResponse.count;
}

function toPokemonNameAndId(listEntry) {
  return { pokemonId: extractIdFromUrl(listEntry.url), name: listEntry.name };
}

// ---------- Suche ----------

// Sucht erst, wenn eine kurze Zeit lang nichts mehr getippt wurde
function scheduleSearch() {
  clearTimeout(searchDelayTimerId);
  searchDelayTimerId = setTimeout(runSearch, searchDelayMilliseconds);
}

// Leert die Übersicht und zeigt die erste Seite der Treffer
async function runSearch() {
  searchResults = findPokemonMatchingSearchText(searchInput.value);
  displayedPokemonCount = 0;
  removeAllPokemonCards();
  await loadNextPokemonPage();
}

function findPokemonMatchingSearchText(rawSearchText) {
  let searchText = rawSearchText.trim().toLowerCase();
  return allPokemonNamesAndIds.filter((listEntry) => listEntry.name.includes(searchText));
}

function removeAllPokemonCards() {
  document
    .querySelectorAll(`.${pokemonCardWrapperClassName}`)
    .forEach((pokemonCard) => pokemonCard.remove());
}

// ---------- Nachladen: "Mehr fangen" und "Alle anzeigen" ----------

async function loadNextPokemonPage() {
  let thisRequestNumber = ++latestListRequestNumber;
  showPokedexMessage(searchResults.length ? "Loading Pokémon..." : "No Pokémon found.");
  await runListLoading(thisRequestNumber, () => appendNextPage(thisRequestNumber));
}

// Lädt alle noch fehlenden Treffer blockweise nach; jeder Block erscheint sofort, der Knopf zeigt den Fortschritt
async function loadAllRemainingPokemon() {
  let thisRequestNumber = ++latestListRequestNumber;
  setLoadButtonsDisabled(true);
  await runListLoading(thisRequestNumber, () => appendAllRemainingBatches(thisRequestNumber));
}

// Führt die Ladeschritte aus, meldet Fehler und aktualisiert danach die Knöpfe. Hat inzwischen eine
// neuere Suche oder ein neuer Klick übernommen, passiert nichts mehr.
async function runListLoading(requestNumber, loadingSteps) {
  try {
    await loadingSteps();
  } catch (error) {
    if (!isOutdatedListRequest(requestNumber)) showListLoadingError(error);
  }
  if (!isOutdatedListRequest(requestNumber)) updateLoadButtonsVisibility();
}

function isOutdatedListRequest(requestNumber) {
  return requestNumber !== latestListRequestNumber;
}

function showListLoadingError(error) {
  console.error(error);
  showPokedexMessage("Some Pokémon could not be loaded. Please try again.");
}

async function appendNextPage(requestNumber) {
  let isStillLatest = await appendNextBatch(pokemonPerPage, requestNumber);
  if (isStillLatest && searchResults.length) showPokedexMessage("");
}

async function appendAllRemainingBatches(requestNumber) {
  while (displayedPokemonCount < searchResults.length) {
    showLoadAllProgress();
    let isStillLatest = await appendNextBatch(pokemonPerLoadAllBatch, requestNumber);
    if (!isStillLatest) return;
  }
  showPokedexMessage("");
}

// Lädt die nächsten Treffer und zeigt sie an. Gibt false zurück, wenn inzwischen eine neuere Anfrage übernommen hat
async function appendNextBatch(batchSize, requestNumber) {
  let listEntriesToLoad = searchResults.slice(displayedPokemonCount, displayedPokemonCount + batchSize);
  let loadedPokemon = await fetchPokemonOfListEntries(listEntriesToLoad);
  if (isOutdatedListRequest(requestNumber)) return false;
  appendPokemonCards(loadedPokemon);
  displayedPokemonCount += listEntriesToLoad.length;
  return true;
}

function fetchPokemonOfListEntries(listEntries) {
  return Promise.all(listEntries.map((listEntry) => fetchPokemonById(listEntry.pokemonId)));
}

// ---------- Anzeige von Meldung, Knöpfen und Karten ----------

function showLoadAllProgress() {
  loadAllButtonLabel.textContent = `Lade ${displayedPokemonCount} / ${searchResults.length}`;
}

function setLoadButtonsDisabled(isDisabled) {
  loadButtonsContainer
    .querySelectorAll("button")
    .forEach((button) => (button.disabled = isDisabled));
}

// Die Meldung ist das letzte Element im Pokédex, die Karten kommen immer davor
function appendPokemonCards(pokemonToShow) {
  pokedexMessageElement.insertAdjacentHTML(
    "beforebegin",
    pokemonToShow.map(pokemonCardHtml).join(""),
  );
}

function showPokedexMessage(messageText) {
  pokedexMessageElement.textContent = messageText;
  pokedexMessageElement.classList.toggle("hidden", !messageText);
}

// Die Knöpfe sind nur sichtbar, solange es noch weitere Treffer gibt und kein Popup offen ist
function updateLoadButtonsVisibility() {
  setLoadButtonsDisabled(false);
  loadAllButtonLabel.textContent = loadAllButtonDefaultText;
  let hasMorePokemonToLoad = displayedPokemonCount < searchResults.length;
  loadButtonsContainer.classList.toggle(
    "hidden",
    !hasMorePokemonToLoad || pokemonInDetailView !== null,
  );
}

// ---------- Eine Karte der Übersicht ----------

function pokemonCardHtml(pokemon) {
  return /* html */ `
    <div class="${pokemonCardWrapperClassName}" onclick="openPokemonDetail(${pokemon.id})">
      <div class="pokemon-card" style="${pokemonColorStyle(pokemon)}">
        ${pokemonCardHeadingHtml(pokemon)}
        ${pokemonCardTypesAndImageHtml(pokemon)}
      </div>
    </div>
  `;
}

function pokemonCardHeadingHtml(pokemon) {
  return /* html */ `
    <div class="pokemon-card-heading">
      <p class="pokemon-card-name">${formatNameForDisplay(pokemon.name)}</p>
      <span class="pokemon-card-number">${pokemon.id}</span>
    </div>
  `;
}

function pokemonCardTypesAndImageHtml(pokemon) {
  return /* html */ `
    <div class="pokemon-card-types-and-image">
      <div class="pokemon-card-types">${typeBadgesOfPokemonHtml(pokemon)}</div>
      ${pokemonCardImageHtml(pokemon)}
    </div>
  `;
}

function typeBadgesOfPokemonHtml(pokemon) {
  return pokemon.types.map((typeEntry) => typeBadgeHtml(typeEntry.type.name)).join("");
}

// Zwei übereinanderliegende Bilder: normal und shiny, beim Darüberfahren wird überblendet
function pokemonCardImageHtml(pokemon) {
  let displayName = formatNameForDisplay(pokemon.name);
  return /* html */ `
    <div class="pokemon-card-image-wrapper">
      <img class="pokemon-card-sprite pokemon-card-sprite-default" loading="lazy" src="${getListSpriteUrl(pokemon)}" alt="${displayName}">
      <img class="pokemon-card-sprite pokemon-card-sprite-shiny" loading="lazy" src="${getShinyListSpriteUrl(pokemon)}" alt="${displayName} (shiny)">
      <span class="shiny-badge">✨</span>
    </div>
  `;
}
