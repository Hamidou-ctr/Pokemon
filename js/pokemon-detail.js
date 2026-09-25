// Das Popup mit den Details eines Pokémon.
// Der Inhalt kommt aus den Tabs in js/tabs/: jede Datei ruft registerTab() auf,
// die Reihenfolge der <script>-Tags in index.html ist die Reihenfolge der Tabs.

const informationContainer = document.getElementById("info-pokemon-Container");
const matchupsTabName = "Matchups"; // dorthin führt ein Klick auf einen Typ im Kopf des Popups

// Ein Tab ist { name, label, icon, render(pokemon), afterRender(element) }. render liefert das HTML
// als Text oder als Promise, wenn erst noch Daten nachgeladen werden müssen. afterRender ist
// optional und läuft, sobald das HTML im Popup steht (z. B. um Beobachter zu starten).
// name dient als id des Tab-Containers im Popup, icon ist ein SVG (siehe icons in config.js).
const tabs = [];

function registerTab(tab) {
  tabs.push(tab);
}

async function pokemonInformation(pokemonId) {
  let request = ++informationRequest;
  try {
    let pokemon = await loadPokemon(pokemonId);
    if (request !== informationRequest) return; // inzwischen wurde ein anderes Pokémon angeklickt oder alles geschlossen
    let isOpening = informationContainer.classList.contains("hidden");
    currentPokemon = pokemon;
    informationContainer.innerHTML = pokemonInformationHtml(pokemon);
    // Das Einblenden läuft nur beim Öffnen, beim Blättern von Pokémon zu Pokémon soll nichts aufpoppen
    informationContainer.classList.toggle("first-open", isOpening);
    showInformationView();
    showTab(tabs[0].name);
    showSpeciesSummary(pokemon);
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

// Kopf (Farbverlauf des Typs) mit Werkzeugleiste, Name, Typen, Bild und Tab-Leiste;
// darunter der scrollbare Inhalt, der mit abgerundeter Kante über den Kopf ragt
function pokemonInformationHtml(pokemon) {
  let name = formatName(pokemon.name);
  let primaryBackgroundColor = generatePrimaryBackgroundColor(pokemon);
  let secondaryBackgroundColor = generateSecondaryBackgroundColor(pokemon);
  let hasShinyImage = Boolean(shinyDetailImage(pokemon));
  let hasCry = Boolean(pokemon.cries && pokemon.cries.latest);
  return /* html */ `
    <div class="info-card" role="dialog" aria-modal="true" aria-label="${name}" style="--primary: ${primaryBackgroundColor}; --secondary: ${secondaryBackgroundColor};">
      <div class="info-header">
        <span class="info-pokeball">${icons.pokeball}</span>
        <div class="info-toolbar">
          <div class="info-nav">
            <button type="button" class="info-button" onclick="pokemonInformation(${neighbourPokemonId(
              pokemon.id,
              -1,
            )})" aria-label="Previous Pokémon" title="Previous (←)">${icons.previous}</button>
            <button type="button" class="info-button" onclick="pokemonInformation(${neighbourPokemonId(
              pokemon.id,
              1,
            )})" aria-label="Next Pokémon" title="Next (→)">${icons.next}</button>
          </div>
          <div class="info-actions">
            ${hasShinyImage ? `<button type="button" class="info-button" id="info-shiny-button" onclick="toggleShiny()" aria-label="Show shiny" aria-pressed="false" title="Shiny">${icons.sparkle}</button>` : ""}
            ${hasCry ? `<button type="button" class="info-button" onclick="playCry()" aria-label="Play cry" title="Cry">${icons.sound}</button>` : ""}
            <button type="button" class="info-button" onclick="closePokemon()" aria-label="Close" title="Close (Esc)">${icons.close}</button>
          </div>
        </div>
        <div class="info-hero">
          <div class="info-heading">
            <div class="info-title">
              <span class="info-number"> ${String(pokemon.id)}</span>
              <h1 style="--name-length: ${longestWordLength(name)};">${name}</h1>
            </div>
            <p class="info-subtitle" id="info-subtitle"></p>
            <div class="info-types">
              ${pokemon.types.map((entry) => headerTypeHtml(entry.type.name)).join("")}
            </div>
          </div>
          <div class="info-figure" id="info-figure">
            <img class="info-image" id="info-image" src="${detailImage(pokemon)}" alt="${name}">
          </div>
        </div>
        <div class="info-tabs" role="tablist">
          ${tabs.map(tabButtonHtml).join("")}
        </div>
      </div>
      <div class="info-body">
        ${tabs.map(tabContainerHtml).join("")}
      </div>
    </div>
  `;
}

// Wie viele Zeichen das längste Wort hat: danach richtet sich die Schriftgröße des Namens
// (ein Wort soll nie mitten im Wort umbrechen, "Landorus Incarnate" darf aber in zwei Zeilen stehen)
function longestWordLength(name) {
  return Math.max(...name.split(" ").map((word) => word.length));
}

// Ein Klick auf den Typ zeigt die Schwächen und Stärken, sofern es den Matchups-Tab gibt
function headerTypeHtml(typeName) {
  let label = formatName(typeName);
  if (!tabs.some((tab) => tab.name === matchupsTabName)) {
    return `<span class="info-type">${label}</span>`;
  }
  return `<button type="button" class="info-type" onclick="showTab('${matchupsTabName}')" title="Show type matchups">${label}</button>`;
}

// Auf schmalen Bildschirmen zeigt nur der aktive Tab seine Beschriftung, die anderen nur das Symbol
function tabButtonHtml(tab) {
  return /* html */ `<button type="button" class="info-tab" role="tab" data-tab="${tab.name}" aria-label="${tab.label}" title="${tab.label}" onclick="showTab('${tab.name}')">${tab.icon || ""}<span class="info-tab-label">${tab.label}</span></button>`;
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
    let tab = tabs.find((entry) => entry.name === tabName);
    let content = tab.render(pokemon);
    if (content instanceof Promise) {
      element.innerHTML = tabMessageHtml("Loading...");
      content = await content;
    }
    if (pokemon !== currentPokemon) return; // nur, wenn es noch dasselbe Pokémon ist
    element.innerHTML = content;
    if (tab.afterRender) tab.afterRender(element);
  } catch (error) {
    console.error(error);
    if (pokemon !== currentPokemon) return;
    delete element.dataset.rendered; // ein erneuter Klick auf den Tab versucht es noch einmal
    element.innerHTML = tabMessageHtml("The details could not be loaded.");
  }
}

// Zeile unter dem Namen: "Seed Pokémon · Generation I". Kommt aus den Species-Daten, die der
// About-Tab ohnehin lädt, und erscheint, sobald sie da sind
async function showSpeciesSummary(pokemon) {
  try {
    let species = await fetchJson(pokemon.species.url);
    let subtitle = document.getElementById("info-subtitle");
    if (pokemon !== currentPokemon || !subtitle) return;
    let parts = [
      englishText(species.genera, "genus"),
      `Generation ${species.generation.name.replace("generation-", "").toUpperCase()}`,
    ];
    if (species.is_legendary) parts.push("★ Legendary");
    else if (species.is_mythical) parts.push("★ Mythical");
    else if (species.is_baby) parts.push("Baby");
    subtitle.textContent = parts.filter(Boolean).join(" · ");
    subtitle.classList.add("loaded");
  } catch (error) {
    console.error(error);
  }
}

// Wechselt das Bild zwischen normal und shiny, mit einem kurzen Aufblitzen
function toggleShiny() {
  let button = document.getElementById("info-shiny-button");
  let showShiny = button.getAttribute("aria-pressed") !== "true";
  button.setAttribute("aria-pressed", String(showShiny));
  document.getElementById("info-image").src = showShiny
    ? shinyDetailImage(currentPokemon)
    : detailImage(currentPokemon);
  let figure = document.getElementById("info-figure");
  figure.classList.remove("flash");
  void figure.offsetWidth; // erzwingt, dass die Animation beim erneuten Setzen der Klasse neu startet
  figure.classList.add("flash");
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
