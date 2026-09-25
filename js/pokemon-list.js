// Die Übersicht: Start, Suche, Karten und die Knöpfe "Mehr fangen" / "Alle anzeigen"

// Feste Elemente aus dem HTML, die von Anfang an existieren
const searchInput = document.getElementById("search-input");
const pokedexElement = document.getElementById("pokedex");
const pokedexMessageElement = document.getElementById("pokedex-message");
const loadButtonsContainer = document.getElementById("load-buttons");
const loadAllButtonLabel = document.getElementById("load-all-label");
const loadAllButtonDefaultText = loadAllButtonLabel.textContent;

async function initializePokedex() {
  try {
    // erst die Gesamtzahl abfragen, damit wirklich alle Pokémon geladen werden, egal wie viele es gibt
    let countResponse = await fetchJsonWithCache(`${pokeApiBaseUrl}/pokemon?limit=1&offset=0`);
    let fullListResponse = await fetchJsonWithCache(
      `${pokeApiBaseUrl}/pokemon?limit=${countResponse.count}&offset=0`,
    );
    allPokemonNamesAndIds = fullListResponse.results.map((listEntry) => ({
      pokemonId: extractIdFromUrl(listEntry.url),
      name: listEntry.name,
    }));
    await runSearch();
  } catch (error) {
    console.error(error);
    showPokedexMessage("The Pokémon could not be loaded. Please reload the page.");
  }
}

// Sucht erst, wenn eine kurze Zeit lang nichts mehr getippt wurde
function scheduleSearch() {
  clearTimeout(searchDelayTimerId);
  searchDelayTimerId = setTimeout(runSearch, searchDelayMilliseconds);
}

// Leert die Übersicht und zeigt die erste Seite der Treffer
async function runSearch() {
  let searchText = searchInput.value.trim().toLowerCase();
  searchResults = allPokemonNamesAndIds.filter((listEntry) => listEntry.name.includes(searchText));
  displayedPokemonCount = 0;
  document
    .querySelectorAll(`.${pokemonCardWrapperClassName}`)
    .forEach((pokemonCard) => pokemonCard.remove());
  await loadNextPokemonPage();
}

async function loadNextPokemonPage() {
  let thisRequestNumber = ++latestListRequestNumber;
  let listEntriesToLoad = searchResults.slice(displayedPokemonCount, displayedPokemonCount + pokemonPerPage);
  showPokedexMessage(searchResults.length ? "Loading Pokémon..." : "No Pokémon found.");
  try {
    let loadedPokemon = await Promise.all(
      listEntriesToLoad.map((listEntry) => fetchPokemonById(listEntry.pokemonId)),
    );
    if (thisRequestNumber !== latestListRequestNumber) return; // eine neuere Suche oder ein neuer Klick hat übernommen
    appendPokemonCards(loadedPokemon);
    displayedPokemonCount += listEntriesToLoad.length;
    if (searchResults.length) showPokedexMessage("");
  } catch (error) {
    if (thisRequestNumber !== latestListRequestNumber) return;
    console.error(error);
    showPokedexMessage("Some Pokémon could not be loaded. Please try again.");
  }
  updateLoadButtonsVisibility();
}

// Lädt alle noch fehlenden Treffer blockweise nach; jeder Block erscheint sofort, der Knopf zeigt den Fortschritt
async function loadAllRemainingPokemon() {
  let thisRequestNumber = ++latestListRequestNumber;
  setLoadButtonsDisabled(true);
  try {
    while (displayedPokemonCount < searchResults.length) {
      showLoadAllProgress();
      let listEntriesToLoad = searchResults.slice(displayedPokemonCount, displayedPokemonCount + pokemonPerLoadAllBatch);
      let loadedPokemon = await Promise.all(
        listEntriesToLoad.map((listEntry) => fetchPokemonById(listEntry.pokemonId)),
      );
      if (thisRequestNumber !== latestListRequestNumber) return; // eine neuere Suche oder ein neuer Klick hat übernommen
      appendPokemonCards(loadedPokemon);
      displayedPokemonCount += listEntriesToLoad.length;
    }
    showPokedexMessage("");
  } catch (error) {
    if (thisRequestNumber !== latestListRequestNumber) return;
    console.error(error);
    showPokedexMessage("Some Pokémon could not be loaded. Please try again.");
  }
  updateLoadButtonsVisibility();
}

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

function pokemonCardHtml(pokemon) {
  let mainColor = getMainColorOfPokemon(pokemon);
  let gradientEndColor = getGradientEndColorOfPokemon(pokemon);
  let displayName = formatNameForDisplay(pokemon.name);
  let typeBadgesHtml = pokemon.types
    .map((typeEntry) => typeBadgeHtml(typeEntry.type.name))
    .join("");
  return /* html */ `
    <div class="${pokemonCardWrapperClassName}" onclick="openPokemonDetail(${pokemon.id})">
      <div class="pokemon-card" style="--pokemon-main-color: ${mainColor}; --pokemon-gradient-end-color: ${gradientEndColor};">
        <div class="pokemon-card-heading">
          <p class="pokemon-card-name">${displayName}</p>
          <span class="pokemon-card-number">${pokemon.id}</span>
        </div>
        <div class="pokemon-card-types-and-image">
          <div class="pokemon-card-types">
            ${typeBadgesHtml}
          </div>
          <div class="pokemon-card-image-wrapper">
            <img class="pokemon-card-sprite pokemon-card-sprite-default" loading="lazy" src="${getListSpriteUrl(pokemon)}" alt="${displayName}">
            <img class="pokemon-card-sprite pokemon-card-sprite-shiny" loading="lazy" src="${getShinyListSpriteUrl(pokemon)}" alt="${displayName} (shiny)">
            <span class="shiny-badge">✨</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
