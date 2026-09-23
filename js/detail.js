// Das Popup mit den Details eines Pokémon.
// Der Inhalt kommt aus den Tabs in js/tabs/: jede Datei ruft registerTab() auf,
// die Reihenfolge der <script>-Tags in index.html ist die Reihenfolge der Tabs.

const informationContainer = document.getElementById("info-pokemon-Container");
const matchupsTabName = "Matchups"; // dorthin führt ein Klick auf einen Typ im Kopf des Popups

// Ein Tab ist { name, label, render(pokemon) }. render liefert das HTML als
// Text oder als Promise, wenn erst noch Daten nachgeladen werden müssen.
// name dient als id des Tab-Containers im Popup.
const tabs = [];

function registerTab(tab) {
  tabs.push(tab);
}

async function pokemonInformation(pokemonId) {
  let request = ++informationRequest;
  try {
    let pokemon = await loadPokemon(pokemonId);
    if (request !== informationRequest) return; // inzwischen wurde ein anderes Pokémon angeklickt oder alles geschlossen
    currentPokemon = pokemon;
    informationContainer.innerHTML = pokemonInformationHtml(pokemon);
    showInformationView();
    showTab(tabs[0].name);
    // Nachbarn schon laden, damit ein Klick auf die Pfeile sofort reagiert
    for (let step of [-1, 1]) {
      loadPokemon(neighbourPokemonId(pokemonId, step)).catch(() => {});
    }
  } catch (error) {
    console.error(error);
  }
}

// Vor dem ersten und nach dem letzten Pokémon geht es wieder von vorne los.
// Läuft über die Position im Index statt über die ID selbst, weil die IDs
// ab den Alternativformen/Mega-Entwicklungen auf 10001+ springen und somit
// nicht lückenlos von 1 bis pokemonIndex.length durchnummeriert sind.
function neighbourPokemonId(pokemonId, step) {
  let total = pokemonIndex.length;
  let index = pokemonIndex.findIndex((entry) => entry.pokemonId === pokemonId);
  if (index === -1) return pokemonId;
  return pokemonIndex[(index + step + total) % total].pokemonId;
}

// Kopf mit Name, Typen, Bild und Knöpfen; darunter die Tab-Leiste und der scrollbare Inhalt
function pokemonInformationHtml(pokemon) {
  let name = formatName(pokemon.name);
  let primaryBackgroundColor = generatePrimaryBackgroundColor(pokemon);
  let secondaryBackgroundColor = generateSecondaryBackgroundColor(pokemon);
  let hasShinyImage = Boolean(shinyDetailImage(pokemon));
  let hasCry = Boolean(pokemon.cries && pokemon.cries.latest);
  return /* html */ `
    <div class="info-card" role="dialog" aria-modal="true" aria-label="${name}" style="--primary: ${primaryBackgroundColor}; --secondary: ${secondaryBackgroundColor};">
      <div class="info-header">
        <button type="button" class="info-button info-arrow left" onclick="pokemonInformation(${neighbourPokemonId(
          pokemon.id,
          -1,
        )})" aria-label="Previous Pokémon">${icons.previous}</button>
        <button type="button" class="info-button info-arrow right" onclick="pokemonInformation(${neighbourPokemonId(
          pokemon.id,
          1,
        )})" aria-label="Next Pokémon">${icons.next}</button>
        <button type="button" class="info-button info-close" onclick="closePokemon()" aria-label="Close">${icons.close}</button>
        <div class="info-title">
          <h1>${name.toUpperCase()}</h1>
          <span class="info-number">№ ${pokemon.id}</span>
        </div>
        <div class="info-types">
          ${pokemon.types.map((entry) => headerTypeHtml(entry.type.name)).join("")}
        </div>
        <img class="info-image" id="info-image" src="${detailImage(pokemon)}" alt="${name}">
        <div class="info-tools">
          ${hasShinyImage ? `<button type="button" class="info-button" id="info-shiny-button" onclick="toggleShiny()" aria-label="Show shiny" aria-pressed="false">✨</button>` : ""}
          ${hasCry ? `<button type="button" class="info-button" onclick="playCry()" aria-label="Play cry">🔊</button>` : ""}
        </div>
      </div>
      <div class="info-tabs" role="tablist">
        ${tabs.map(tabButtonHtml).join("")}
      </div>
      <div class="info-body">
        ${tabs.map(tabContainerHtml).join("")}
      </div>
    </div>
  `;
}

// Ein Klick auf den Typ zeigt die Schwächen und Stärken, sofern es den Matchups-Tab gibt
function headerTypeHtml(typeName) {
  let label = formatName(typeName);
  if (!tabs.some((tab) => tab.name === matchupsTabName)) {
    return `<span class="info-type">${label}</span>`;
  }
  return `<button type="button" class="info-type" onclick="showTab('${matchupsTabName}')" title="Show type matchups">${label}</button>`;
}

function tabButtonHtml(tab) {
  return /* html */ `<button type="button" class="info-tab" role="tab" data-tab="${tab.name}" onclick="showTab('${tab.name}')">${tab.label}</button>`;
}

function tabContainerHtml(tab) {
  return /* html */ `<div class="tab-panel hidden" id="${tab.name}" role="tabpanel"></div>`;
}

// Zeigt den Tab und baut seinen Inhalt beim ersten Öffnen auf
async function showTab(tabName) {
  for (let tab of tabs) {
    let isActive = tab.name === tabName;
    document.getElementById(tab.name).classList.toggle("hidden", !isActive);
    let button = document.querySelector(`.info-tab[data-tab="${tab.name}"]`);
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  }
  document.querySelector(".info-body").scrollTop = 0;
  let element = document.getElementById(tabName);
  if (element.dataset.rendered) return; // pro Pokémon wird jeder Tab nur einmal gebaut
  element.dataset.rendered = "true";
  let pokemon = currentPokemon;
  try {
    let content = tabs.find((tab) => tab.name === tabName).render(pokemon);
    if (content instanceof Promise) {
      element.innerHTML = tabMessageHtml("Loading...");
      content = await content;
    }
    if (pokemon === currentPokemon) element.innerHTML = content; // nur, wenn es noch dasselbe Pokémon ist
  } catch (error) {
    console.error(error);
    if (pokemon !== currentPokemon) return;
    delete element.dataset.rendered; // ein erneuter Klick auf den Tab versucht es noch einmal
    element.innerHTML = tabMessageHtml("The details could not be loaded.");
  }
}

// Wechselt das Bild zwischen normal und shiny
function toggleShiny() {
  let button = document.getElementById("info-shiny-button");
  let showShiny = button.getAttribute("aria-pressed") !== "true";
  button.setAttribute("aria-pressed", String(showShiny));
  document.getElementById("info-image").src = showShiny
    ? shinyDetailImage(currentPokemon)
    : detailImage(currentPokemon);
}

function playCry() {
  let cry = new Audio(currentPokemon.cries.latest);
  cry.volume = 0.5;
  cry.play().catch(() => {}); // der Browser darf das Abspielen ablehnen, dann bleibt es still
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

// Tastatur bei geöffnetem Popup: Esc schließt, Pfeil links/rechts blättert
document.addEventListener("keydown", (event) => {
  if (currentPokemon === null) return;
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "Escape") {
    closePokemon();
  } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    if (event.target.closest?.("input, textarea, select")) return; // dort bewegen die Pfeile den Cursor
    event.preventDefault();
    let step = event.key === "ArrowLeft" ? -1 : 1;
    pokemonInformation(neighbourPokemonId(currentPokemon.id, step));
  }
});
