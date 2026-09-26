// The popup with the details of a Pokémon.
// The content comes from the tabs in js/tabs/: each file calls registerTab(),
// and the order of the <script> tags in index.html is the order of the tabs.

const detailOverlay = document.getElementById("detail-overlay");
const matchupsTabId = "Matchups"; // a click on a type in the popup header leads there

// A tab is { tabId, label, icon, render(pokemon), afterRender(tabPanel) }. render returns the HTML
// as text, or as a Promise if data still has to be loaded first. afterRender is
// optional and runs as soon as the HTML is in the popup (e.g. to start observers).
// tabId serves as the id of the tab container in the popup, icon is an SVG (see icons in configuration.js).
const registeredTabs = [];

function registerTab(tab) {
  registeredTabs.push(tab);
}

// ---------- Opening, browsing and closing ----------

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
  if (requestNumber !== latestDetailRequestNumber) return; // in the meantime another Pokémon was clicked or everything was closed
  displayPokemonDetail(pokemon);
  preloadNeighbourPokemon(pokemonId);
}

function displayPokemonDetail(pokemon) {
  let isFirstOpening = detailOverlay.classList.contains("hidden");
  pokemonInDetailView = pokemon;
  detailOverlay.innerHTML = pokemonDetailHtml(pokemon);
  // The fade-in only runs on opening; nothing should pop up when browsing from Pokémon to Pokémon
  detailOverlay.classList.toggle("first-open", isFirstOpening);
  showDetailOverlay();
  showTab(registeredTabs[0].tabId);
  showSpeciesSummary(pokemon);
}

// Preload the neighbors so that a click on the arrows responds immediately
function preloadNeighbourPokemon(pokemonId) {
  for (let stepDirection of [-1, 1]) {
    fetchPokemonById(getNeighbourPokemonId(pokemonId, stepDirection)).catch(() => {});
  }
}

// stepDirection is -1 (previous Pokémon) or 1 (next Pokémon).
// Before the first and after the last Pokémon it wraps around to the other end.
// Works via the position in the list instead of the ID itself, because the IDs
// jump to 10001+ from the alternate forms/mega evolutions onward and are therefore
// not numbered continuously from 1 to allPokemonNamesAndIds.length.
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
  latestDetailRequestNumber++; // a request that is still running must not reopen the view
  pokemonInDetailView = null;
  detailOverlay.innerHTML = "";
  detailOverlay.classList.add("hidden");
  pokedexElement.classList.remove("pokedex-dimmed");
  updateLoadButtonsVisibility();
}

// only closes if the click hits the background and not the Pokémon card itself
function closeDetailIfOverlayClicked(clickEvent) {
  if (clickEvent.target === clickEvent.currentTarget) closePokemonDetail();
}

// ---------- Popup structure: card, header, toolbar, name, image ----------

// Header (type gradient) with toolbar, name, types, image and tab bar;
// below it the scrollable content, which overlaps the header with a rounded edge
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

// Not every Pokémon has a shiny image or a cry
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

// Round glass buttons in the header: browse, shiny, cry, close
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

// How many characters the longest word has: the font size of the name depends on it
// (a word should never break in the middle, but "Landorus Incarnate" may span two lines)
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

// A click on the type shows the weaknesses and strengths, provided the Matchups tab exists
function detailHeaderTypeHtml(typeName) {
  let typeLabel = formatNameForDisplay(typeName);
  if (!registeredTabs.some((tab) => tab.tabId === matchupsTabId)) {
    return `<span class="detail-type">${typeLabel}</span>`;
  }
  return `<button type="button" class="detail-type" onclick="showTab('${matchupsTabId}')" title="Show type matchups">${typeLabel}</button>`;
}

// ---------- Tabs ----------

// On narrow screens only the active tab shows its label, the others only the icon
function tabButtonHtml(tab) {
  return /* html */ `<button type="button" class="detail-tab" role="tab" data-tab-id="${tab.tabId}" aria-label="${tab.label}" title="${tab.label}" onclick="showTab('${tab.tabId}')">${tab.icon || ""}<span class="detail-tab-label">${tab.label}</span></button>`;
}

function tabPanelHtml(tab) {
  return /* html */ `<div class="tab-panel hidden" id="${tab.tabId}" role="tabpanel"></div>`;
}

// Shows the tab and builds its content on first opening
async function showTab(tabId) {
  registeredTabs.forEach((tab) => setTabActive(tab, tab.tabId === tabId));
  document.querySelector(".detail-body").scrollTop = 0;
  let tabPanel = document.getElementById(tabId);
  if (tabPanel.dataset.rendered) return; // each tab is only built once per Pokémon
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
  if (pokemon !== pokemonInDetailView) return; // only if it is still the same Pokémon
  showTabContent(tabPanel, tab, tabContent);
}

function showTabContent(tabPanel, tab, tabContent) {
  tabPanel.innerHTML = tabContent;
  if (tab.afterRender) tab.afterRender(tabPanel);
}

function showTabLoadError(tabPanel, pokemonOfThisRequest) {
  if (pokemonOfThisRequest !== pokemonInDetailView) return;
  delete tabPanel.dataset.rendered; // clicking the tab again tries once more
  tabPanel.innerHTML = tabMessageHtml("The details could not be loaded.");
}

// ---------- Line below the name ----------

// "Seed Pokémon · Generation I". Comes from the species data that the About tab loads anyway,
// and appears as soon as it is available
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

// ---------- Shiny and cry ----------

// Switches the image between normal and shiny, with a short flash
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
  void figureElement.offsetWidth; // forces the animation to restart when the class is set again
  figureElement.classList.add("flash");
}

function playPokemonCry() {
  let cryAudio = new Audio(pokemonInDetailView.cries.latest);
  cryAudio.volume = 0.5;
  cryAudio.play().catch(() => {}); // the browser may refuse playback, in which case it stays silent
}

// ---------- Keyboard ----------

// Keyboard while the popup is open: Esc closes, left/right arrow browses
function handleDetailKeyDown(keyEvent) {
  if (pokemonInDetailView === null) return;
  if (keyEvent.altKey || keyEvent.ctrlKey || keyEvent.metaKey) return;
  if (keyEvent.key === "Escape") closePokemonDetail();
  else if (keyEvent.key === "ArrowLeft" || keyEvent.key === "ArrowRight") stepWithArrowKey(keyEvent);
}

function stepWithArrowKey(keyEvent) {
  if (keyEvent.target.closest?.("input, textarea, select")) return; // there the arrows move the cursor
  keyEvent.preventDefault();
  let stepDirection = keyEvent.key === "ArrowLeft" ? -1 : 1;
  openPokemonDetail(getNeighbourPokemonId(pokemonInDetailView.id, stepDirection));
}

document.addEventListener("keydown", handleDetailKeyDown);
