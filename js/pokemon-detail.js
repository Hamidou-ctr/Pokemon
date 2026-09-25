// Das Popup mit den Details eines Pokémon.
// Der Inhalt kommt aus den Tabs in js/tabs/: jede Datei ruft registerTab() auf,
// die Reihenfolge der <script>-Tags in index.html ist die Reihenfolge der Tabs.

const detailOverlay = document.getElementById("detail-overlay");
const matchupsTabId = "Matchups"; // dorthin führt ein Klick auf einen Typ im Kopf des Popups

// Ein Tab ist { tabId, label, icon, render(pokemon), afterRender(tabPanel) }. render liefert das HTML
// als Text oder als Promise, wenn erst noch Daten nachgeladen werden müssen. afterRender ist
// optional und läuft, sobald das HTML im Popup steht (z. B. um Beobachter zu starten).
// tabId dient als id des Tab-Containers im Popup, icon ist ein SVG (siehe icons in configuration.js).
const registeredTabs = [];

function registerTab(tab) {
  registeredTabs.push(tab);
}

async function openPokemonDetail(pokemonId) {
  let thisRequestNumber = ++latestDetailRequestNumber;
  try {
    let pokemon = await fetchPokemonById(pokemonId);
    if (thisRequestNumber !== latestDetailRequestNumber) return; // inzwischen wurde ein anderes Pokémon angeklickt oder alles geschlossen
    let isFirstOpening = detailOverlay.classList.contains("hidden");
    pokemonInDetailView = pokemon;
    detailOverlay.innerHTML = pokemonDetailHtml(pokemon);
    // Das Einblenden läuft nur beim Öffnen, beim Blättern von Pokémon zu Pokémon soll nichts aufpoppen
    detailOverlay.classList.toggle("first-open", isFirstOpening);
    showDetailOverlay();
    showTab(registeredTabs[0].tabId);
    showSpeciesSummary(pokemon);
    // Nachbarn schon laden, damit ein Klick auf die Pfeile sofort reagiert
    for (let stepDirection of [-1, 1]) {
      fetchPokemonById(getNeighbourPokemonId(pokemonId, stepDirection)).catch(() => {});
    }
  } catch (error) {
    console.error(error);
  }
}

// stepDirection ist -1 (vorheriges Pokémon) oder 1 (nächstes Pokémon).
// Vor dem ersten und nach dem letzten Pokémon geht es wieder von vorne los.
// Läuft über die Position in der Liste statt über die ID selbst, weil die IDs
// ab den Alternativformen/Mega-Entwicklungen auf 10001+ springen und somit
// nicht lückenlos von 1 bis allPokemonNamesAndIds.length durchnummeriert sind.
function getNeighbourPokemonId(pokemonId, stepDirection) {
  let totalPokemonCount = allPokemonNamesAndIds.length;
  let positionInList = allPokemonNamesAndIds.findIndex((listEntry) => listEntry.pokemonId === pokemonId);
  if (positionInList === -1) return pokemonId;
  return allPokemonNamesAndIds[(positionInList + stepDirection + totalPokemonCount) % totalPokemonCount].pokemonId;
}

// Kopf (Farbverlauf des Typs) mit Werkzeugleiste, Name, Typen, Bild und Tab-Leiste;
// darunter der scrollbare Inhalt, der mit abgerundeter Kante über den Kopf ragt
function pokemonDetailHtml(pokemon) {
  let displayName = formatNameForDisplay(pokemon.name);
  let mainColor = getMainColorOfPokemon(pokemon);
  let gradientEndColor = getGradientEndColorOfPokemon(pokemon);
  let hasShinyImage = Boolean(getShinyDetailImageUrl(pokemon));
  let hasCrySound = Boolean(pokemon.cries && pokemon.cries.latest);
  return /* html */ `
    <div class="detail-card" role="dialog" aria-modal="true" aria-label="${displayName}" style="--pokemon-main-color: ${mainColor}; --pokemon-gradient-end-color: ${gradientEndColor};">
      <div class="detail-header">
        <span class="detail-pokeball-watermark">${icons.pokeball}</span>
        <div class="detail-toolbar">
          <div class="detail-navigation">
            <button type="button" class="detail-round-button" onclick="openPokemonDetail(${getNeighbourPokemonId(
              pokemon.id,
              -1,
            )})" aria-label="Previous Pokémon" title="Previous (←)">${icons.previous}</button>
            <button type="button" class="detail-round-button" onclick="openPokemonDetail(${getNeighbourPokemonId(
              pokemon.id,
              1,
            )})" aria-label="Next Pokémon" title="Next (→)">${icons.next}</button>
          </div>
          <div class="detail-actions">
            ${hasShinyImage ? `<button type="button" class="detail-round-button" id="detail-shiny-button" onclick="toggleShinyImage()" aria-label="Show shiny" aria-pressed="false" title="Shiny">${icons.sparkle}</button>` : ""}
            ${hasCrySound ? `<button type="button" class="detail-round-button" onclick="playPokemonCry()" aria-label="Play cry" title="Cry">${icons.sound}</button>` : ""}
            <button type="button" class="detail-round-button" onclick="closePokemonDetail()" aria-label="Close" title="Close (Esc)">${icons.close}</button>
          </div>
        </div>
        <div class="detail-hero">
          <div class="detail-heading">
            <div class="detail-title">
              <span class="detail-pokemon-number"> ${pokemon.id}</span>
              <h1 style="--name-longest-word-length: ${getLongestWordLength(displayName)};">${displayName}</h1>
            </div>
            <p class="detail-subtitle" id="detail-subtitle"></p>
            <div class="detail-type-list">
              ${pokemon.types.map((typeEntry) => detailHeaderTypeHtml(typeEntry.type.name)).join("")}
            </div>
          </div>
          <div class="detail-figure" id="detail-figure">
            <img class="detail-image" id="detail-image" src="${getDetailImageUrl(pokemon)}" alt="${displayName}">
          </div>
        </div>
        <div class="detail-tab-bar" role="tablist">
          ${registeredTabs.map(tabButtonHtml).join("")}
        </div>
      </div>
      <div class="detail-body">
        ${registeredTabs.map(tabPanelHtml).join("")}
      </div>
    </div>
  `;
}

// Wie viele Zeichen das längste Wort hat: danach richtet sich die Schriftgröße des Namens
// (ein Wort soll nie mitten im Wort umbrechen, "Landorus Incarnate" darf aber in zwei Zeilen stehen)
function getLongestWordLength(displayName) {
  return Math.max(...displayName.split(" ").map((word) => word.length));
}

// Ein Klick auf den Typ zeigt die Schwächen und Stärken, sofern es den Matchups-Tab gibt
function detailHeaderTypeHtml(typeName) {
  let typeLabel = formatNameForDisplay(typeName);
  if (!registeredTabs.some((tab) => tab.tabId === matchupsTabId)) {
    return `<span class="detail-type">${typeLabel}</span>`;
  }
  return `<button type="button" class="detail-type" onclick="showTab('${matchupsTabId}')" title="Show type matchups">${typeLabel}</button>`;
}

// Auf schmalen Bildschirmen zeigt nur der aktive Tab seine Beschriftung, die anderen nur das Symbol
function tabButtonHtml(tab) {
  return /* html */ `<button type="button" class="detail-tab" role="tab" data-tab-id="${tab.tabId}" aria-label="${tab.label}" title="${tab.label}" onclick="showTab('${tab.tabId}')">${tab.icon || ""}<span class="detail-tab-label">${tab.label}</span></button>`;
}

function tabPanelHtml(tab) {
  return /* html */ `<div class="tab-panel hidden" id="${tab.tabId}" role="tabpanel"></div>`;
}

// Zeigt den Tab und baut seinen Inhalt beim ersten Öffnen auf
async function showTab(tabId) {
  for (let tab of registeredTabs) {
    let isActive = tab.tabId === tabId;
    document.getElementById(tab.tabId).classList.toggle("hidden", !isActive);
    let tabButton = document.querySelector(`.detail-tab[data-tab-id="${tab.tabId}"]`);
    tabButton.classList.toggle("active", isActive);
    tabButton.setAttribute("aria-selected", String(isActive));
  }
  document.querySelector(".detail-body").scrollTop = 0;
  let tabPanel = document.getElementById(tabId);
  if (tabPanel.dataset.rendered) return; // pro Pokémon wird jeder Tab nur einmal gebaut
  tabPanel.dataset.rendered = "true";
  let pokemonOfThisRequest = pokemonInDetailView;
  try {
    let tab = registeredTabs.find((registeredTab) => registeredTab.tabId === tabId);
    let tabContent = tab.render(pokemonOfThisRequest);
    if (tabContent instanceof Promise) {
      tabPanel.innerHTML = tabMessageHtml("Loading...");
      tabContent = await tabContent;
    }
    if (pokemonOfThisRequest !== pokemonInDetailView) return; // nur, wenn es noch dasselbe Pokémon ist
    tabPanel.innerHTML = tabContent;
    if (tab.afterRender) tab.afterRender(tabPanel);
  } catch (error) {
    console.error(error);
    if (pokemonOfThisRequest !== pokemonInDetailView) return;
    delete tabPanel.dataset.rendered; // ein erneuter Klick auf den Tab versucht es noch einmal
    tabPanel.innerHTML = tabMessageHtml("The details could not be loaded.");
  }
}

// Zeile unter dem Namen: "Seed Pokémon · Generation I". Kommt aus den Species-Daten, die der
// About-Tab ohnehin lädt, und erscheint, sobald sie da sind
async function showSpeciesSummary(pokemon) {
  try {
    let species = await fetchJsonWithCache(pokemon.species.url);
    let subtitleElement = document.getElementById("detail-subtitle");
    if (pokemon !== pokemonInDetailView || !subtitleElement) return;
    let subtitleParts = [
      findLatestEnglishText(species.genera, "genus"),
      `Generation ${species.generation.name.replace("generation-", "").toUpperCase()}`,
    ];
    if (species.is_legendary) subtitleParts.push("★ Legendary");
    else if (species.is_mythical) subtitleParts.push("★ Mythical");
    else if (species.is_baby) subtitleParts.push("Baby");
    subtitleElement.textContent = subtitleParts.filter(Boolean).join(" · ");
    subtitleElement.classList.add("loaded");
  } catch (error) {
    console.error(error);
  }
}

// Wechselt das Bild zwischen normal und shiny, mit einem kurzen Aufblitzen
function toggleShinyImage() {
  let shinyButton = document.getElementById("detail-shiny-button");
  let showShiny = shinyButton.getAttribute("aria-pressed") !== "true";
  shinyButton.setAttribute("aria-pressed", String(showShiny));
  document.getElementById("detail-image").src = showShiny
    ? getShinyDetailImageUrl(pokemonInDetailView)
    : getDetailImageUrl(pokemonInDetailView);
  let figureElement = document.getElementById("detail-figure");
  figureElement.classList.remove("flash");
  void figureElement.offsetWidth; // erzwingt, dass die Animation beim erneuten Setzen der Klasse neu startet
  figureElement.classList.add("flash");
}

function playPokemonCry() {
  let cryAudio = new Audio(pokemonInDetailView.cries.latest);
  cryAudio.volume = 0.5;
  cryAudio.play().catch(() => {}); // der Browser darf das Abspielen ablehnen, dann bleibt es still
}

// schließt nur, wenn der Klick den Hintergrund trifft und nicht die Pokémon-Karte selbst
function closeDetailIfOverlayClicked(clickEvent) {
  if (clickEvent.target === clickEvent.currentTarget) closePokemonDetail();
}

function closePokemonDetail() {
  latestDetailRequestNumber++; // eine noch laufende Anfrage darf die Ansicht nicht wieder öffnen
  pokemonInDetailView = null;
  detailOverlay.innerHTML = "";
  detailOverlay.classList.add("hidden");
  pokedexElement.classList.remove("pokedex-dimmed");
  updateLoadButtonsVisibility();
}

function showDetailOverlay() {
  pokedexElement.classList.add("pokedex-dimmed");
  detailOverlay.classList.remove("hidden");
  updateLoadButtonsVisibility();
}

// Tastatur bei geöffnetem Popup: Esc schließt, Pfeil links/rechts blättert
document.addEventListener("keydown", (keyEvent) => {
  if (pokemonInDetailView === null) return;
  if (keyEvent.altKey || keyEvent.ctrlKey || keyEvent.metaKey) return;
  if (keyEvent.key === "Escape") {
    closePokemonDetail();
  } else if (keyEvent.key === "ArrowLeft" || keyEvent.key === "ArrowRight") {
    if (keyEvent.target.closest?.("input, textarea, select")) return; // dort bewegen die Pfeile den Cursor
    keyEvent.preventDefault();
    let stepDirection = keyEvent.key === "ArrowLeft" ? -1 : 1;
    openPokemonDetail(getNeighbourPokemonId(pokemonInDetailView.id, stepDirection));
  }
});
