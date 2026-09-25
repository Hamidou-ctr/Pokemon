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

// ---------- Öffnen, Blättern und Schließen ----------

async function openPokemonDetail(pokemonId) {
  let thisRequestNumber = ++latestDetailRequestNumber;
  try {
    await displayPokemonIfStillLatest(pokemonId, thisRequestNumber);
  } catch (error) {
    console.error(error);
  }
}

async function displayPokemonIfStillLatest(pokemonId, requestNumber) {
  let pokemon = await fetchPokemonById(pokemonId);
  if (requestNumber !== latestDetailRequestNumber) return; // inzwischen wurde ein anderes Pokémon angeklickt oder alles geschlossen
  displayPokemonDetail(pokemon);
  preloadNeighbourPokemon(pokemonId);
}

function displayPokemonDetail(pokemon) {
  let isFirstOpening = detailOverlay.classList.contains("hidden");
  pokemonInDetailView = pokemon;
  detailOverlay.innerHTML = pokemonDetailHtml(pokemon);
  // Das Einblenden läuft nur beim Öffnen, beim Blättern von Pokémon zu Pokémon soll nichts aufpoppen
  detailOverlay.classList.toggle("first-open", isFirstOpening);
  showDetailOverlay();
  showTab(registeredTabs[0].tabId);
  showSpeciesSummary(pokemon);
}

// Nachbarn schon laden, damit ein Klick auf die Pfeile sofort reagiert
function preloadNeighbourPokemon(pokemonId) {
  for (let stepDirection of [-1, 1]) {
    fetchPokemonById(getNeighbourPokemonId(pokemonId, stepDirection)).catch(() => {});
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

function showDetailOverlay() {
  pokedexElement.classList.add("pokedex-dimmed");
  detailOverlay.classList.remove("hidden");
  updateLoadButtonsVisibility();
}

function closePokemonDetail() {
  latestDetailRequestNumber++; // eine noch laufende Anfrage darf die Ansicht nicht wieder öffnen
  pokemonInDetailView = null;
  detailOverlay.innerHTML = "";
  detailOverlay.classList.add("hidden");
  pokedexElement.classList.remove("pokedex-dimmed");
  updateLoadButtonsVisibility();
}

// schließt nur, wenn der Klick den Hintergrund trifft und nicht die Pokémon-Karte selbst
function closeDetailIfOverlayClicked(clickEvent) {
  if (clickEvent.target === clickEvent.currentTarget) closePokemonDetail();
}

// ---------- Aufbau des Popups: Karte, Kopf, Werkzeugleiste, Name, Bild ----------

// Kopf (Farbverlauf des Typs) mit Werkzeugleiste, Name, Typen, Bild und Tab-Leiste;
// darunter der scrollbare Inhalt, der mit abgerundeter Kante über den Kopf ragt
function pokemonDetailHtml(pokemon) {
  return /* html */ `
    <div class="detail-card" role="dialog" aria-modal="true" aria-label="${formatNameForDisplay(pokemon.name)}" style="${pokemonColorStyle(pokemon)}">
      ${detailHeaderHtml(pokemon)}
      <div class="detail-body">${registeredTabs.map(tabPanelHtml).join("")}</div>
    </div>
  `;
}

function detailHeaderHtml(pokemon) {
  return /* html */ `
    <div class="detail-header">
      <span class="detail-pokeball-watermark">${icons.pokeball}</span>
      ${detailToolbarHtml(pokemon)}
      ${detailHeroHtml(pokemon)}
      <div class="detail-tab-bar" role="tablist">${registeredTabs.map(tabButtonHtml).join("")}</div>
    </div>
  `;
}

function detailToolbarHtml(pokemon) {
  return /* html */ `
    <div class="detail-toolbar">
      ${detailNavigationHtml(pokemon)}
      ${detailActionsHtml(pokemon)}
    </div>
  `;
}

function detailNavigationHtml(pokemon) {
  return /* html */ `
    <div class="detail-navigation">
      ${previousPokemonButtonHtml(pokemon)}
      ${nextPokemonButtonHtml(pokemon)}
    </div>
  `;
}

// Nicht jedes Pokémon hat ein Shiny-Bild oder einen Schrei
function detailActionsHtml(pokemon) {
  return /* html */ `
    <div class="detail-actions">
      ${getShinyDetailImageUrl(pokemon) ? shinyButtonHtml() : ""}
      ${hasCrySound(pokemon) ? cryButtonHtml() : ""}
      ${closeButtonHtml()}
    </div>
  `;
}

function hasCrySound(pokemon) {
  return Boolean(pokemon.cries && pokemon.cries.latest);
}

// Runde Glas-Knöpfe im Kopf: Blättern, Shiny, Schrei, Schließen
function detailRoundButtonHtml({ onclick, label, title, icon, extraAttributes = "" }) {
  return `<button type="button" class="detail-round-button" ${extraAttributes} onclick="${onclick}" aria-label="${label}" title="${title}">${icon}</button>`;
}

function previousPokemonButtonHtml(pokemon) {
  let onclick = `openPokemonDetail(${getNeighbourPokemonId(pokemon.id, -1)})`;
  return detailRoundButtonHtml({ onclick, label: "Previous Pokémon", title: "Previous (←)", icon: icons.previous });
}

function nextPokemonButtonHtml(pokemon) {
  let onclick = `openPokemonDetail(${getNeighbourPokemonId(pokemon.id, 1)})`;
  return detailRoundButtonHtml({ onclick, label: "Next Pokémon", title: "Next (→)", icon: icons.next });
}

function shinyButtonHtml() {
  let extraAttributes = 'id="detail-shiny-button" aria-pressed="false"';
  return detailRoundButtonHtml({ onclick: "toggleShinyImage()", label: "Show shiny", title: "Shiny", icon: icons.sparkle, extraAttributes });
}

function cryButtonHtml() {
  return detailRoundButtonHtml({ onclick: "playPokemonCry()", label: "Play cry", title: "Cry", icon: icons.sound });
}

function closeButtonHtml() {
  return detailRoundButtonHtml({ onclick: "closePokemonDetail()", label: "Close", title: "Close (Esc)", icon: icons.close });
}

function detailHeroHtml(pokemon) {
  return /* html */ `
    <div class="detail-hero">
      ${detailHeadingHtml(pokemon)}
      ${detailFigureHtml(pokemon)}
    </div>
  `;
}

function detailHeadingHtml(pokemon) {
  return /* html */ `
    <div class="detail-heading">
      ${detailTitleHtml(pokemon)}
      <p class="detail-subtitle" id="detail-subtitle"></p>
      <div class="detail-type-list">${pokemon.types.map((typeEntry) => detailHeaderTypeHtml(typeEntry.type.name)).join("")}</div>
    </div>
  `;
}

function detailTitleHtml(pokemon) {
  let displayName = formatNameForDisplay(pokemon.name);
  return /* html */ `
    <div class="detail-title">
      <span class="detail-pokemon-number"> ${pokemon.id}</span>
      <h1 style="--name-longest-word-length: ${getLongestWordLength(displayName)};">${displayName}</h1>
    </div>
  `;
}

// Wie viele Zeichen das längste Wort hat: danach richtet sich die Schriftgröße des Namens
// (ein Wort soll nie mitten im Wort umbrechen, "Landorus Incarnate" darf aber in zwei Zeilen stehen)
function getLongestWordLength(displayName) {
  return Math.max(...displayName.split(" ").map((word) => word.length));
}

function detailFigureHtml(pokemon) {
  return /* html */ `
    <div class="detail-figure" id="detail-figure">
      <img class="detail-image" id="detail-image" src="${getDetailImageUrl(pokemon)}" alt="${formatNameForDisplay(pokemon.name)}">
    </div>
  `;
}

// Ein Klick auf den Typ zeigt die Schwächen und Stärken, sofern es den Matchups-Tab gibt
function detailHeaderTypeHtml(typeName) {
  let typeLabel = formatNameForDisplay(typeName);
  if (!registeredTabs.some((tab) => tab.tabId === matchupsTabId)) {
    return `<span class="detail-type">${typeLabel}</span>`;
  }
  return `<button type="button" class="detail-type" onclick="showTab('${matchupsTabId}')" title="Show type matchups">${typeLabel}</button>`;
}

// ---------- Tabs ----------

// Auf schmalen Bildschirmen zeigt nur der aktive Tab seine Beschriftung, die anderen nur das Symbol
function tabButtonHtml(tab) {
  return /* html */ `<button type="button" class="detail-tab" role="tab" data-tab-id="${tab.tabId}" aria-label="${tab.label}" title="${tab.label}" onclick="showTab('${tab.tabId}')">${tab.icon || ""}<span class="detail-tab-label">${tab.label}</span></button>`;
}

function tabPanelHtml(tab) {
  return /* html */ `<div class="tab-panel hidden" id="${tab.tabId}" role="tabpanel"></div>`;
}

// Zeigt den Tab und baut seinen Inhalt beim ersten Öffnen auf
async function showTab(tabId) {
  registeredTabs.forEach((tab) => setTabActive(tab, tab.tabId === tabId));
  document.querySelector(".detail-body").scrollTop = 0;
  let tabPanel = document.getElementById(tabId);
  if (tabPanel.dataset.rendered) return; // pro Pokémon wird jeder Tab nur einmal gebaut
  tabPanel.dataset.rendered = "true";
  await fillTabPanel(tabPanel, tabId);
}

function setTabActive(tab, isActive) {
  document.getElementById(tab.tabId).classList.toggle("hidden", !isActive);
  let tabButton = document.querySelector(`.detail-tab[data-tab-id="${tab.tabId}"]`);
  tabButton.classList.toggle("active", isActive);
  tabButton.setAttribute("aria-selected", String(isActive));
}

async function fillTabPanel(tabPanel, tabId) {
  let pokemonOfThisRequest = pokemonInDetailView;
  let tab = registeredTabs.find((registeredTab) => registeredTab.tabId === tabId);
  try {
    await renderTabContent(tabPanel, tab, pokemonOfThisRequest);
  } catch (error) {
    console.error(error);
    showTabLoadError(tabPanel, pokemonOfThisRequest);
  }
}

async function renderTabContent(tabPanel, tab, pokemon) {
  let tabContent = tab.render(pokemon);
  if (tabContent instanceof Promise) {
    tabPanel.innerHTML = tabMessageHtml("Loading...");
    tabContent = await tabContent;
  }
  if (pokemon !== pokemonInDetailView) return; // nur, wenn es noch dasselbe Pokémon ist
  showTabContent(tabPanel, tab, tabContent);
}

function showTabContent(tabPanel, tab, tabContent) {
  tabPanel.innerHTML = tabContent;
  if (tab.afterRender) tab.afterRender(tabPanel);
}

function showTabLoadError(tabPanel, pokemonOfThisRequest) {
  if (pokemonOfThisRequest !== pokemonInDetailView) return;
  delete tabPanel.dataset.rendered; // ein erneuter Klick auf den Tab versucht es noch einmal
  tabPanel.innerHTML = tabMessageHtml("The details could not be loaded.");
}

// ---------- Zeile unter dem Namen ----------

// "Seed Pokémon · Generation I". Kommt aus den Species-Daten, die der About-Tab ohnehin lädt,
// und erscheint, sobald sie da sind
async function showSpeciesSummary(pokemon) {
  try {
    let species = await fetchJsonWithCache(pokemon.species.url);
    if (pokemon === pokemonInDetailView) displaySubtitle(speciesSummaryText(species));
  } catch (error) {
    console.error(error);
  }
}

function displaySubtitle(subtitleText) {
  let subtitleElement = document.getElementById("detail-subtitle");
  if (!subtitleElement) return;
  subtitleElement.textContent = subtitleText;
  subtitleElement.classList.add("loaded");
}

function speciesSummaryText(species) {
  let genusText = findLatestEnglishText(species.genera, "genus");
  let generationText = `Generation ${species.generation.name.replace("generation-", "").toUpperCase()}`;
  return [genusText, generationText, getSpecialStatusText(species)].filter(Boolean).join(" · ");
}

function getSpecialStatusText(species) {
  if (species.is_legendary) return "★ Legendary";
  if (species.is_mythical) return "★ Mythical";
  if (species.is_baby) return "Baby";
  return "";
}

// ---------- Shiny und Schrei ----------

// Wechselt das Bild zwischen normal und shiny, mit einem kurzen Aufblitzen
function toggleShinyImage() {
  let shinyButton = document.getElementById("detail-shiny-button");
  let showShiny = shinyButton.getAttribute("aria-pressed") !== "true";
  shinyButton.setAttribute("aria-pressed", String(showShiny));
  showDetailImage(showShiny);
  flashDetailFigure();
}

function showDetailImage(showShiny) {
  document.getElementById("detail-image").src = showShiny
    ? getShinyDetailImageUrl(pokemonInDetailView)
    : getDetailImageUrl(pokemonInDetailView);
}

function flashDetailFigure() {
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

// ---------- Tastatur ----------

// Tastatur bei geöffnetem Popup: Esc schließt, Pfeil links/rechts blättert
function handleDetailKeyDown(keyEvent) {
  if (pokemonInDetailView === null) return;
  if (keyEvent.altKey || keyEvent.ctrlKey || keyEvent.metaKey) return;
  if (keyEvent.key === "Escape") closePokemonDetail();
  else if (keyEvent.key === "ArrowLeft" || keyEvent.key === "ArrowRight") stepWithArrowKey(keyEvent);
}

function stepWithArrowKey(keyEvent) {
  if (keyEvent.target.closest?.("input, textarea, select")) return; // dort bewegen die Pfeile den Cursor
  keyEvent.preventDefault();
  let stepDirection = keyEvent.key === "ArrowLeft" ? -1 : 1;
  openPokemonDetail(getNeighbourPokemonId(pokemonInDetailView.id, stepDirection));
}

document.addEventListener("keydown", handleDetailKeyDown);
