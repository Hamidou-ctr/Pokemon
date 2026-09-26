// The overview: startup, search, cards, and the "Catch more" / "Show all" buttons

// Fixed elements from the HTML that exist from the start
const searchInput = document.getElementById("search-input");
const pokedexElement = document.getElementById("pokedex");
const pokedexMessageElement = document.getElementById("pokedex-message");
const loadButtonsContainer = document.getElementById("load-buttons");
const loadAllButtonLabel = document.getElementById("load-all-label");
const loadAllButtonDefaultText = loadAllButtonLabel.textContent;

// ---------- Startup ----------

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

// Query the total count first so that really all Pokémon are loaded, no matter how many there are
async function fetchTotalPokemonCount() {
  let countResponse = await fetchJsonWithCache(`${pokeApiBaseUrl}/pokemon?limit=1&offset=0`);
  return countResponse.count;
}

function toPokemonNameAndId(listEntry) {
  return { pokemonId: extractIdFromUrl(listEntry.url), name: listEntry.name };
}

// ---------- Search ----------

// Only searches once nothing has been typed for a short while
function scheduleSearch() {
  clearTimeout(searchDelayTimerId);
  searchDelayTimerId = setTimeout(runSearch, searchDelayMilliseconds);
}

// Clears the overview and shows the first page of results
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

// ---------- Loading more: "Catch more" and "Show all" ----------

async function loadNextPokemonPage() {
  let thisRequestNumber = ++latestListRequestNumber;
  showPokedexMessage(searchResults.length ? "Loading Pokémon..." : "No Pokémon found.");
  await runListLoading(thisRequestNumber, () => appendNextPage(thisRequestNumber));
}

// Loads all remaining results in batches; each batch appears immediately, the button shows the progress
async function loadAllRemainingPokemon() {
  let thisRequestNumber = ++latestListRequestNumber;
  setLoadButtonsDisabled(true);
  await runListLoading(thisRequestNumber, () => appendAllRemainingBatches(thisRequestNumber));
}

// Runs the loading steps, reports errors and then updates the buttons. If a newer search
// or a newer click has taken over in the meantime, nothing happens anymore.
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

// Loads the next results and displays them. Returns false if a newer request has taken over in the meantime
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

// ---------- Display of message, buttons and cards ----------

function showLoadAllProgress() {
  loadAllButtonLabel.textContent = `Loading ${displayedPokemonCount} / ${searchResults.length}`;
}

function setLoadButtonsDisabled(isDisabled) {
  loadButtonsContainer
    .querySelectorAll("button")
    .forEach((button) => (button.disabled = isDisabled));
}

// The message is the last element in the Pokédex; the cards always come before it
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

// The buttons are only visible while there are more results and no popup is open
function updateLoadButtonsVisibility() {
  setLoadButtonsDisabled(false);
  loadAllButtonLabel.textContent = loadAllButtonDefaultText;
  let hasMorePokemonToLoad = displayedPokemonCount < searchResults.length;
  loadButtonsContainer.classList.toggle(
    "hidden",
    !hasMorePokemonToLoad || pokemonInDetailView !== null,
  );
}

// ---------- A card in the overview ----------

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

// Two stacked images: normal and shiny, crossfaded on hover
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
