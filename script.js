const baseUrl = "https://pokeapi.co/api/v2";
const totalPokemon = 154; // so viele Pokémon enthält der Pokédex
const pageSize = 20; // so viele Pokémon kommen pro Klick auf "Mehr Pokémon" dazu
const infoTabs = ["About", "Base-Stats", "Moves"];
const maxStatValue = 255; // bei diesem Wert ist der Balken eines Stats voll
const maxTotalValue = 780; // bei diesem Wert ist der Total-Balken voll
const topMovesCount = 10;

// Rand- und Füllfarbe je Balken: erst die sechs Stats, zuletzt die Summe (Total)
const statColors = [
  { border: "#ff7793", fill: "#ffe1e6" }, // hp
  { border: "#ffc791", fill: "#ffecdb" }, // attack
  { border: "#ffd984", fill: "#fff4df" }, // defense
  { border: "#66c8c8", fill: "#def2f2" }, // special-attack
  { border: "#53aeee", fill: "#d9ecfb" }, // special-defense
  { border: "#b087ff", fill: "#ebe0ff" }, // speed
  { border: "#ff4500", fill: "#ffc6b0" }, // total
];

const typePokemonBackgroundColor = {
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

const typePokemonBackgroundColorDiv = {
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

const cache = new Map(); // url -> Promise mit der Antwort, jede URL wird nur einmal geladen
let pokemonIndex = []; // { id, name } aller Pokémon, wird einmal beim Start geladen
let matches = []; // der Teil von pokemonIndex, der zur aktuellen Suche passt
let shownCount = 0; // wie viele der matches schon auf der Seite stehen
let currentPokemon = null; // Pokémon der Detailansicht, null solange sie geschlossen ist
let listRequest = 0; // Nummer der letzten Listen-Aktualisierung, ältere werden verworfen
let infoRequest = 0; // dasselbe für die Detailansicht
let searchTimer;

async function init() {
  try {
    let list = await fetchJson(
      `${baseUrl}/pokemon?limit=${totalPokemon}&offset=0`
    );
    pokemonIndex = list.results.map((entry) => ({
      id: Number(entry.url.split("/").filter(Boolean).pop()),
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

function loadPokemon(id) {
  return fetchJson(`${baseUrl}/pokemon/${id}`);
}

function startSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applySearch, 250); // erst suchen, wenn der Nutzer kurz aufhört zu tippen
}

async function applySearch() {
  let search = document.getElementById("search").value.trim().toLowerCase();
  matches = pokemonIndex.filter((entry) => entry.name.includes(search));
  shownCount = 0;
  document.querySelectorAll(".all-pokemon-div").forEach((card) => card.remove());
  await loadNextPokemon();
}

async function loadNextPokemon() {
  let request = ++listRequest;
  let batch = matches.slice(shownCount, shownCount + pageSize);
  showMessage(matches.length ? "Loading Pokémon..." : "No Pokémon found.");
  try {
    let pokemons = await Promise.all(
      batch.map((entry) => loadPokemon(entry.id))
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
  document
    .getElementById("pokedex-message")
    .insertAdjacentHTML("beforebegin", pokemons.map(pokemonHtml).join(""));
}

function showMessage(text) {
  let message = document.getElementById("pokedex-message");
  message.textContent = text;
  message.classList.toggle("hidden", !text);
}

function updateLoadMoreButton() {
  let hasMore = shownCount < matches.length;
  document
    .getElementById("button-loadPokemon")
    .classList.toggle("hidden", !hasMore || currentPokemon !== null);
}

function pokemonHtml(pokemon) {
  let backgroundColor = generateBackgroundColor(pokemon);
  let typeColor = generateBackgroundColorTypeDiv(pokemon);
  let name = formatName(pokemon.name);
  let types = pokemon.types
    .map(
      (entry) =>
        `<p class="pokemon-type" style="background-color: ${typeColor};">${formatName(
          entry.type.name
        )}</p>`
    )
    .join("");
  return /* html */ `
    <div class="all-pokemon-div" onclick="pokemonInfo(${pokemon.id})">
      <div class="all-pokemon" style="background-color: ${backgroundColor};">
        <div class="name-and-id-div">
          <h1>${name}</h1>
          <h1>№ ${pokemon.id}</h1>
        </div>
        <div class="pokemon-type-and-image-div">
          <div class="pokemon-type-div">
            <p>Type:</p>
            ${types}
          </div>
          <img src="${listImage(pokemon)}" alt="${name}">
        </div>
      </div>
    </div>
  `;
}

function generateBackgroundColor(pokemon) {
  return typePokemonBackgroundColor[pokemon.types[0].type.name] || "blue";
}

function generateBackgroundColorTypeDiv(pokemon) {
  return typePokemonBackgroundColorDiv[pokemon.types[0].type.name] || "blue";
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

async function pokemonInfo(id) {
  let request = ++infoRequest;
  try {
    let pokemon = await loadPokemon(id);
    if (request !== infoRequest) return; // inzwischen wurde ein anderes Pokémon angeklickt oder alles geschlossen
    currentPokemon = pokemon;
    document.getElementById("info-pokemon-Container").innerHTML =
      pokemonInfoHtml(pokemon);
    showInfoView();
    about();
    // Nachbarn schon laden, damit ein Klick auf die Pfeile sofort reagiert
    for (let step of [-1, 1]) {
      loadPokemon(neighbourId(id, step)).catch(() => {});
    }
  } catch (error) {
    console.error(error);
  }
}

// Vor dem ersten und nach dem letzten Pokémon geht es wieder von vorne los
function neighbourId(id, step) {
  let total = pokemonIndex.length;
  return ((id - 1 + step + total) % total) + 1;
}

function pokemonInfoHtml(pokemon) {
  let backgroundColor = generateBackgroundColor(pokemon);
  let name = formatName(pokemon.name);
  return /* html */ `
    <div class="border">
      <div class="AllPokemonInfoAllPokemonInfo" style="background-color: ${backgroundColor};">
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
            <img class="directionPointer left" onclick="pokemonInfo(${neighbourId(
              pokemon.id,
              -1
            )})" src="image./left.webp" alt="Previous Pokémon">
            <img class="directionPointer right" onclick="pokemonInfo(${neighbourId(
              pokemon.id,
              1
            )})" src="image./right.webp" alt="Next Pokémon">
          </div>
          <div class="quickLink-div">
            <a class="quickLink" onclick="about(); return false;" href="#">About</a>
            <a class="quickLink" onclick="baseStats(); return false;" href="#">Base Stats</a>
            <a class="quickLink" onclick="moves(); return false;" href="#">Moves</a>
          </div>
        </div>

        <div class="About" id="About"></div>

        <div class="Base-Stats hidden" id="Base-Stats">
          ${baseStatsHtml(pokemon)}
        </div>

        <div class="Moves hidden" id="Moves">
          ${movesHtml(pokemon)}
        </div>
        <img class="directionPointer back" onclick="closePokemon()" src="image./road-sign.webp" alt="Close">
      </div>
    </div>
  `;
}

async function about() {
  showTab("About");
  let pokemon = currentPokemon;
  let aboutElement = document.getElementById("About");
  aboutElement.innerHTML = aboutMessageHtml(pokemon, "Loading...");
  let html;
  try {
    html = await detailedInfoHtml(pokemon);
  } catch (error) {
    console.error(error);
    html = aboutMessageHtml(pokemon, "The details could not be loaded.");
  }
  if (pokemon === currentPokemon) aboutElement.innerHTML = html; // nur, wenn es noch dasselbe Pokémon ist
}

async function detailedInfoHtml(pokemon) {
  let color = generateBackgroundColorTypeDiv(pokemon);
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
      ${rows.map(([label, value]) => aboutRowHtml(label, value, color)).join("")}
      ${aboutRowHtml("Location Area Encounters", locations || "Unknown", color, "Location")}
    </div>
  `;
}

function aboutRowHtml(label, value, color, className = "") {
  return /* html */ `
    <p class="${className}" style="background-color: ${color};">
      <b>${label}</b> ${value}
    </p>
  `;
}

function aboutMessageHtml(pokemon, text) {
  let color = generateBackgroundColorTypeDiv(pokemon);
  return /* html */ `
    <div class="About-div">
      <p style="background-color: ${color};">${text}</p>
    </div>
  `;
}

// gender_rate sind Achtel weiblich, -1 bedeutet geschlechtslos
function genderText(genderRate) {
  if (genderRate === -1) return "Genderless";
  let female = (genderRate / 8) * 100;
  return `♂️ ${100 - female}% / ♀️ ${female}%`;
}

function baseStatsHtml(pokemon) {
  let stats = pokemon.stats.map((entry) => ({
    name: entry.stat.name === "hp" ? "HP" : formatName(entry.stat.name),
    value: entry.base_stat,
    max: maxStatValue,
  }));
  let total = stats.reduce((sum, stat) => sum + stat.value, 0);
  stats.push({ name: "Total", value: total, max: maxTotalValue });
  return /* html */ `
    <div class="bar-list">
      ${stats
        .map((stat, index) =>
          barRowHtml(stat.name, stat.value, stat.max, statColors[index])
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
  let max = Math.max(1, ...topMoves.map((move) => move.versions));
  let color = generateBackgroundColor(pokemon);
  return /* html */ `
    <div class="bar-list">
      <p class="bar-caption">Top ${topMovesCount} moves by number of game versions</p>
      ${topMoves
        .map((move) =>
          barRowHtml(move.name, move.versions, max, { border: color, fill: color })
        )
        .join("")}
    </div>
  `;
}

function barRowHtml(label, value, max, color) {
  let percent = Math.min(100, (value / max) * 100).toFixed(1);
  return /* html */ `
    <div class="bar-row">
      <span class="bar-label">${label}</span>
      <span class="bar-value">${value}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width: ${percent}%; background-color: ${color.fill}; border-color: ${color.border};"></div>
      </div>
    </div>
  `;
}

function baseStats() {
  showTab("Base-Stats");
}

function moves() {
  showTab("Moves");
}

function showTab(name) {
  for (let tab of infoTabs) {
    document.getElementById(tab).classList.toggle("hidden", tab !== name);
  }
}

function closePokemon() {
  infoRequest++; // eine noch laufende Anfrage darf die Ansicht nicht wieder öffnen
  currentPokemon = null;
  let container = document.getElementById("info-pokemon-Container");
  container.innerHTML = "";
  container.classList.add("hidden");
  document.getElementById("pokedex").classList.remove("pokedex-opacity");
  updateLoadMoreButton();
}

function showInfoView() {
  document.getElementById("pokedex").classList.add("pokedex-opacity");
  document.getElementById("info-pokemon-Container").classList.remove("hidden");
  updateLoadMoreButton();
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// "special-attack" -> "Special Attack"
function formatName(name) {
  return name.split("-").map(capitalize).join(" ");
}
