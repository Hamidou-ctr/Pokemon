// Die Übersicht: Start, Suche, Karten und die Knöpfe "Mehr fangen" / "Alle anzeigen"

// Feste Elemente aus dem HTML, die von Anfang an existieren
const searchInput = document.getElementById("search");
const pokedexElement = document.getElementById("pokedex");
const messageElement = document.getElementById("pokedex-message");
const loadMoreButton = document.getElementById("button-loadPokemon");
const loadAllLabel = document.getElementById("load-all-label");
const loadAllLabelText = loadAllLabel.textContent;

async function initialize() {
  try {
    // erst die Gesamtzahl abfragen, damit wirklich alle Pokémon geladen werden, egal wie viele es gibt
    let firstPage = await fetchJson(`${baseUrl}/pokemon?limit=1&offset=0`);
    let list = await fetchJson(
      `${baseUrl}/pokemon?limit=${firstPage.count}&offset=0`,
    );
    pokemonIndex = list.results.map((entry) => ({
      pokemonId: idFromUrl(entry.url),
      name: entry.name,
    }));
    await applySearch();
  } catch (error) {
    console.error(error);
    showMessage("The Pokémon could not be loaded. Please reload the page.");
  }
}

function startSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applySearch, searchDebounceMilliseconds);
}

async function applySearch() {
  let search = searchInput.value.trim().toLowerCase();
  matches = pokemonIndex.filter((entry) => entry.name.includes(search));
  shownCount = 0;
  document
    .querySelectorAll(`.${pokemonCardClass}`)
    .forEach((card) => card.remove());
  await loadNextPokemon();
}

async function loadNextPokemon() {
  let request = ++listRequest;
  let batch = matches.slice(shownCount, shownCount + pageSize);
  showMessage(matches.length ? "Loading Pokémon..." : "No Pokémon found.");
  try {
    let pokemons = await Promise.all(
      batch.map((entry) => loadPokemon(entry.pokemonId)),
    );
    if (request !== listRequest) return; // eine neuere Suche oder ein neuer Klick hat übernommen
    renderPokemonList(pokemons);
    shownCount += batch.length;
    if (matches.length) showMessage("");
  } catch (error) {
    if (request !== listRequest) return;
    console.error(error);
    showMessage("Some Pokémon could not be loaded. Please try again.");
  }
  updateLoadMoreButton();
}

// Lädt alle noch fehlenden Treffer blockweise nach; jeder Block erscheint sofort, der Knopf zeigt den Fortschritt
async function loadAllPokemon() {
  let request = ++listRequest;
  setLoadButtonsDisabled(true);
  try {
    while (shownCount < matches.length) {
      showLoadAllProgress();
      let batch = matches.slice(shownCount, shownCount + loadAllChunkSize);
      let pokemons = await Promise.all(
        batch.map((entry) => loadPokemon(entry.pokemonId)),
      );
      if (request !== listRequest) return; // eine neuere Suche oder ein neuer Klick hat übernommen
      renderPokemonList(pokemons);
      shownCount += batch.length;
    }
    showMessage("");
  } catch (error) {
    if (request !== listRequest) return;
    console.error(error);
    showMessage("Some Pokémon could not be loaded. Please try again.");
  }
  updateLoadMoreButton();
}

function showLoadAllProgress() {
  loadAllLabel.textContent = `Lade ${shownCount} / ${matches.length}`;
}

function setLoadButtonsDisabled(disabled) {
  loadMoreButton
    .querySelectorAll("button")
    .forEach((button) => (button.disabled = disabled));
}

// Die Meldung ist das letzte Element im Pokédex, die Karten kommen immer davor
function renderPokemonList(pokemons) {
  messageElement.insertAdjacentHTML(
    "beforebegin",
    pokemons.map(pokemonHtml).join(""),
  );
}

function showMessage(text) {
  messageElement.textContent = text;
  messageElement.classList.toggle("hidden", !text);
}

function updateLoadMoreButton() {
  setLoadButtonsDisabled(false);
  loadAllLabel.textContent = loadAllLabelText;
  let hasMore = shownCount < matches.length;
  loadMoreButton.classList.toggle(
    "hidden",
    !hasMore || currentPokemon !== null,
  );
}

function pokemonHtml(pokemon) {
  let primaryBackgroundColor = generatePrimaryBackgroundColor(pokemon);
  let secondaryBackgroundColor = generateSecondaryBackgroundColor(pokemon);
  let name = formatName(pokemon.name);
  let types = pokemon.types
    .map((entry) => typeBadgeHtml(entry.type.name))
    .join("");
  return /* html */ `
    <div class="${pokemonCardClass}" onclick="pokemonInformation(${pokemon.id})">
      <div class="all-pokemon" style="--primary: ${primaryBackgroundColor}; --secondary: ${secondaryBackgroundColor};">
        <div class="name-and-id-div">
          <p class="pokemon-name">${name}</p>
          <span class="pokemon-id">${formatId(pokemon.id)}</span>
        </div>
        <div class="pokemon-type-and-image-div">
          <div class="pokemon-type-div">
            ${types}
          </div>
          <div class="pokemon-image-wrap">
            <img class="pokemon-sprite pokemon-sprite-default" loading="lazy" src="${listImage(pokemon)}" alt="${name}">
            <img class="pokemon-sprite pokemon-sprite-shiny" loading="lazy" src="${listShinyImage(pokemon)}" alt="${name} (shiny)">
            <span class="shiny-badge">✨</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
