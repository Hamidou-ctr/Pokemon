const baseUrl = "https://pokeapi.co/api/v2";
const pageSize = 20; // so viele Pokémon kommen pro Klick auf "Mehr Pokémon" dazu
const searchDebounceMilliseconds = 250; // erst suchen, wenn der Nutzer so lange nicht mehr getippt hat
const maximumStatisticValue = 255; // bei diesem Wert ist der Balken einer Statistik voll
const maximumTotalValue = 780; // bei diesem Wert ist der Total-Balken voll
const topMovesCount = 10;
const defaultTypeColor = "blue"; // Fallback, falls ein Typ mal nicht in den Farbtabellen steht
const pokemonCardClass = "all-pokemon-div";

const aboutTabName = "About";
const baseStatisticsTabName = "Base-Stats";
const movesTabName = "Moves";
const tabNames = [aboutTabName, baseStatisticsTabName, movesTabName];

const icons = {
  previous: /* html */ `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 6 9 12 15 18"></polyline></svg>`,
  next: /* html */ `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"></polyline></svg>`,
  close: /* html */ `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>`,
};

// Rand- und Füllfarbe je Balken: erst die sechs Statistiken, zuletzt die Summe (Total)
const statisticColors = [
  { border: "#ff7793", fill: "#ffe1e6" }, // hp
  { border: "#ffc791", fill: "#ffecdb" }, // attack
  { border: "#ffd984", fill: "#fff4df" }, // defense
  { border: "#66c8c8", fill: "#def2f2" }, // special-attack
  { border: "#53aeee", fill: "#d9ecfb" }, // special-defense
  { border: "#b087ff", fill: "#ebe0ff" }, // speed
  { border: "#ff4500", fill: "#ffc6b0" }, // total
];

const typePokemonPrimaryBackgroundColor = {
  grass: "rgb(0, 102, 0)",
  fire: "rgb(241,79,14)",
  water: "rgb(49,124,218)",
  normal: "rgb(100, 99, 99)",
  electric: "rgb(198, 182, 7)",
  ice: "rgb(116,207,192)",
  fighting: "rgb(186,85,68)",
  poison: "rgb(149,83,204)",
  ground: "rgb(166,116,57)",
  bug: "rgb(115,29,12)",
  flying: "rgb(150,202,254)",
  rock: "rgb(187,170,102)",
  psychic: "rgb(255,98,128)",
  ghost: "rgb(110,67,111)",
  dragon: "rgb(85,112,189)",
  steel: "rgb(170,170,187)",
  fairy: "rgb(236,142,230)",
  dark: "rgb(78,68,69)",
};

const typePokemonSecondaryBackgroundColor = {
  grass: "rgb(14, 43, 14)",
  fire: "rgb(149, 46, 11)",
  water: "rgb(7, 70, 147)",
  normal: "rgb(58, 54, 54)",
  electric: "rgb(228, 210, 6)",
  ice: "rgb(28, 161, 139)",
  fighting: "rgb(181, 35, 9)",
  poison: "rgb(138, 56, 205)",
  ground: "rgb(149, 92, 27)",
  bug: "rgb(133, 53, 37)",
  flying: "rgb(133, 190, 246)",
  rock: "rgb(181, 160, 76)",
  psychic: "rgb(234, 88, 115)",
  ghost: "rgb(133, 56, 134)",
  dragon: "rgb(70, 100, 185)",
  steel: "rgb(152, 152, 180)",
  fairy: "rgb(222, 121, 216)",
  dark: "rgb(77, 51, 53)",
};

// Feste Elemente aus dem HTML, die von Anfang an existieren
const searchInput = document.getElementById("search");
const pokedexElement = document.getElementById("pokedex");
const messageElement = document.getElementById("pokedex-message");
const loadMoreButton = document.getElementById("button-loadPokemon");
const informationContainer = document.getElementById("info-pokemon-Container");

const cache = new Map(); // url -> Promise mit der Antwort, jede URL wird nur einmal geladen
let pokemonIndex = []; // { pokemonId, name } aller Pokémon, wird einmal beim Start geladen
let matches = []; // der Teil von pokemonIndex, der zur aktuellen Suche passt
let shownCount = 0; // wie viele der matches schon auf der Seite stehen
let currentPokemon = null; // Pokémon der Detailansicht, null solange sie geschlossen ist
let listRequest = 0; // Nummer der letzten Listen-Aktualisierung, ältere werden verworfen
let informationRequest = 0; // dasselbe für die Detailansicht
let searchTimer;

async function initialize() {
  try {
    // erst die Gesamtzahl abfragen, damit wirklich alle Pokémon geladen werden, egal wie viele es gibt
    let firstPage = await fetchJson(`${baseUrl}/pokemon?limit=1&offset=0`);
    let list = await fetchJson(
      `${baseUrl}/pokemon?limit=${firstPage.count}&offset=0`,
    );
    pokemonIndex = list.results.map((entry) => ({
      pokemonId: Number(entry.url.split("/").filter(Boolean).pop()),
      name: entry.name,
    }));
    await applySearch();
  } catch (error) {
    console.error(error);
    showMessage("The Pokémon could not be loaded. Please reload the page.");
  }
}

function fetchJson(url) {
  if (!cache.has(url)) {
    let request = fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${url}`);
      }
      return response.json();
    });
    request.catch(() => cache.delete(url)); // fehlgeschlagene Anfragen dürfen erneut versucht werden
    cache.set(url, request);
  }
  return cache.get(url);
}

function loadPokemon(pokemonId) {
  return fetchJson(`${baseUrl}/pokemon/${pokemonId}`);
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
    .map(
      (entry) =>
        `<span class="pokemon-type" style="--type-color: ${
          typePokemonPrimaryBackgroundColor[entry.type.name] ||
          defaultTypeColor
        };">${formatName(entry.type.name)}</span>`,
    )
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
            <img src="${listImage(pokemon)}" alt="${name}">
          </div>
        </div>
      </div>
    </div>
  `;
}

function formatId(id) {
  return `${String(id)}`;
}

function generatePrimaryBackgroundColor(pokemon) {
  return (
    typePokemonPrimaryBackgroundColor[pokemon.types[0].type.name] ||
    defaultTypeColor
  );
}

function generateSecondaryBackgroundColor(pokemon) {
  return (
    typePokemonSecondaryBackgroundColor[pokemon.types[0].type.name] ||
    defaultTypeColor
  );
}

function listImage(pokemon) {
  let sprites = pokemon.sprites;
  return sprites.other.showdown.front_default || sprites.front_default;
}

function detailImage(pokemon) {
  let sprites = pokemon.sprites;
  return (
    sprites.other.dream_world.front_default ||
    sprites.other["official-artwork"].front_default ||
    sprites.front_default
  );
}

async function pokemonInformation(pokemonId) {
  let request = ++informationRequest;
  try {
    let pokemon = await loadPokemon(pokemonId);
    if (request !== informationRequest) return; // inzwischen wurde ein anderes Pokémon angeklickt oder alles geschlossen
    currentPokemon = pokemon;
    informationContainer.innerHTML = pokemonInformationHtml(pokemon);
    showInformationView();
    about();
    // Nachbarn schon laden, damit ein Klick auf die Pfeile sofort reagiert
    for (let step of [-1, 1]) {
      loadPokemon(neighbourPokemonId(pokemonId, step)).catch(() => {});
    }
  } catch (error) {
    console.error(error);
  }
}

// Vor dem ersten und nach dem letzten Pokémon geht es wieder von vorne los
function neighbourPokemonId(pokemonId, step) {
  let total = pokemonIndex.length;
  return ((pokemonId - 1 + step + total) % total) + 1;
}

function pokemonInformationHtml(pokemon) {
  let primaryBackgroundColor = generatePrimaryBackgroundColor(pokemon);
  let name = formatName(pokemon.name);
  return /* html */ `
    <div class="border">
      <div class="AllPokemonInfoAllPokemonInfo" style="background-color: ${primaryBackgroundColor};">
        <div class="NameAndIdDivInfo">
          <div class="NameIdDivInfo">
            <h1>${name.toUpperCase()}</h1>
            <h1>№ ${pokemon.id}</h1>
          </div>
        </div>
        <div class="OnPokemonImage-div">
          <img class="OnPokemonImage" src="${detailImage(pokemon)}" alt="${name}">
        </div>
      </div>
      <div class="InfoContentDiv">
        <div class="navigationLinks">
          <div class="directionPointer-div">
            <button type="button" class="directionPointer left" onclick="pokemonInformation(${neighbourPokemonId(
              pokemon.id,
              -1,
            )})" aria-label="Previous Pokémon">${icons.previous}</button>
            <button type="button" class="directionPointer right" onclick="pokemonInformation(${neighbourPokemonId(
              pokemon.id,
              1,
            )})" aria-label="Next Pokémon">${icons.next}</button>
          </div>
          <div class="quickLink-div">
            <a class="quickLink" onclick="about(); return false;" href="#">About</a>
            <a class="quickLink" onclick="baseStatistics(); return false;" href="#">Base Stats</a>
            <a class="quickLink" onclick="moves(); return false;" href="#">Moves</a>
          </div>
        </div>

        <div class="${aboutTabName}" id="${aboutTabName}"></div>

        <div class="${baseStatisticsTabName} hidden" id="${baseStatisticsTabName}">
          ${baseStatisticsHtml(pokemon)}
        </div>

        <div class="${movesTabName} hidden" id="${movesTabName}">
          ${movesHtml(pokemon)}
        </div>
        <button type="button" class="directionPointer back" onclick="closePokemon()" aria-label="Close">${icons.close}</button>
      </div>
    </div>
  `;
}

async function about() {
  showTab(aboutTabName);
  let pokemon = currentPokemon;
  let aboutElement = document.getElementById(aboutTabName);
  aboutElement.innerHTML = aboutMessageHtml(pokemon, "Loading...");
  let html;
  try {
    html = await detailedInformationHtml(pokemon);
  } catch (error) {
    console.error(error);
    html = aboutMessageHtml(pokemon, "The details could not be loaded.");
  }
  if (pokemon === currentPokemon) aboutElement.innerHTML = html; // nur, wenn es noch dasselbe Pokémon ist
}

async function detailedInformationHtml(pokemon) {
  let secondaryBackgroundColor = generateSecondaryBackgroundColor(pokemon);
  let [species, encounters] = await Promise.all([
    fetchJson(pokemon.species.url),
    fetchJson(pokemon.location_area_encounters),
  ]);
  let locations = encounters
    .map((encounter) => formatName(encounter.location_area.name))
    .join(", ");
  let rows = [
    ["Height", `${pokemon.height * 10} cm`],
    ["Weight", `${(pokemon.weight / 10).toFixed(1)} kg`],
    [
      "Abilities",
      pokemon.abilities
        .map((entry) => formatName(entry.ability.name))
        .join(", "),
    ],
    ["Gender", genderText(species.gender_rate)],
    [
      "Egg Groups",
      species.egg_groups.map((group) => formatName(group.name)).join(", "),
    ],
    ["Egg Cycle", species.hatch_counter],
  ];
  return /* html */ `
    <div class="About-div">
      ${rows.map(([label, value]) => aboutRowHtml(label, value, secondaryBackgroundColor)).join("")}
      ${aboutRowHtml("Location Area Encounters", locations || "Unknown", secondaryBackgroundColor, "Location")}
    </div>
  `;
}

function aboutRowHtml(label, value, backgroundColor, className = "") {
  return /* html */ `
    <p class="${className}" style="background-color: ${backgroundColor};">
      <b>${label}</b> ${value}
    </p>
  `;
}

function aboutMessageHtml(pokemon, text) {
  let secondaryBackgroundColor = generateSecondaryBackgroundColor(pokemon);
  return /* html */ `
    <div class="About-div">
      <p style="background-color: ${secondaryBackgroundColor};">${text}</p>
    </div>
  `;
}

// gender_rate sind Achtel weiblich, -1 bedeutet geschlechtslos
function genderText(genderRate) {
  if (genderRate === -1) return "Genderless";
  let female = (genderRate / 8) * 100;
  return `♂️ ${100 - female}% / ♀️ ${female}%`;
}

function baseStatisticsHtml(pokemon) {
  let statistics = pokemon.stats.map((entry) => ({
    name: entry.stat.name === "hp" ? "HP" : formatName(entry.stat.name),
    value: entry.base_stat,
    maximum: maximumStatisticValue,
  }));
  let total = statistics.reduce((sum, statistic) => sum + statistic.value, 0);
  statistics.push({ name: "Total", value: total, maximum: maximumTotalValue });
  return /* html */ `
    <div class="bar-list">
      ${statistics
        .map((statistic, index) =>
          barRowHtml(
            statistic.name,
            statistic.value,
            statistic.maximum,
            statisticColors[index],
          ),
        )
        .join("")}
    </div>
  `;
}

function movesHtml(pokemon) {
  // Die Attacken, die in den meisten Spielversionen gelernt werden können
  let topMoves = pokemon.moves
    .map((entry) => ({
      name: formatName(entry.move.name),
      versions: entry.version_group_details.length,
    }))
    .sort((a, b) => b.versions - a.versions)
    .slice(0, topMovesCount);
  let maximumVersionCount = Math.max(
    1,
    ...topMoves.map((move) => move.versions),
  );
  let moveBarColor = generatePrimaryBackgroundColor(pokemon);
  return /* html */ `
    <div class="bar-list">
      <p class="bar-caption">Top ${topMovesCount} moves by number of game versions</p>
      ${topMoves
        .map((move) =>
          barRowHtml(move.name, move.versions, maximumVersionCount, {
            border: moveBarColor,
            fill: moveBarColor,
          }),
        )
        .join("")}
    </div>
  `;
}

function barRowHtml(label, value, maximumValue, barColors) {
  let percent = Math.min(100, (value / maximumValue) * 100).toFixed(1);
  return /* html */ `
    <div class="bar-row">
      <span class="bar-label">${label}</span>
      <span class="bar-value">${value}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${percent}%; background-color: ${barColors.fill}; border-color: ${barColors.border};"></div>
      </div>
    </div>
  `;
}

function baseStatistics() {
  showTab(baseStatisticsTabName);
}

function moves() {
  showTab(movesTabName);
}

function showTab(activeTabName) {
  for (let tabName of tabNames) {
    document
      .getElementById(tabName)
      .classList.toggle("hidden", tabName !== activeTabName);
  }
}

// schließt nur, wenn der Klick den Hintergrund trifft und nicht die Pokémon-Karte selbst
function closePokemonIfBackgroundClicked(event) {
  if (event.target === event.currentTarget) closePokemon();
}

function closePokemon() {
  informationRequest++; // eine noch laufende Anfrage darf die Ansicht nicht wieder öffnen
  currentPokemon = null;
  informationContainer.innerHTML = "";
  informationContainer.classList.add("hidden");
  pokedexElement.classList.remove("pokedex-opacity");
  updateLoadMoreButton();
}

function showInformationView() {
  pokedexElement.classList.add("pokedex-opacity");
  informationContainer.classList.remove("hidden");
  updateLoadMoreButton();
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// "special-attack" -> "Special Attack"
function formatName(name) {
  return name.split("-").map(capitalize).join(" ");
}
