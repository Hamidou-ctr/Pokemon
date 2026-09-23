// Das Popup mit den Details eines Pokémon.
// Der Inhalt kommt aus den Tabs in js/tabs/: jede Datei ruft registerTab() auf,
// die Reihenfolge der <script>-Tags in index.html ist die Reihenfolge der Tabs.

const informationContainer = document.getElementById("info-pokemon-Container");

// Ein Tab ist { name, label, render(pokemon) }. render liefert das HTML als
// Text oder als Promise, wenn erst noch Daten nachgeladen werden müssen.
// name dient als id und Klasse des Tab-Containers im Popup.
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
            ${tabs.map(quickLinkHtml).join("")}
          </div>
        </div>

        ${tabs.map(tabContainerHtml).join("")}
        <button type="button" class="directionPointer back" onclick="closePokemon()" aria-label="Close">${icons.close}</button>
      </div>
    </div>
  `;
}

function quickLinkHtml(tab) {
  return /* html */ `<a class="quickLink" onclick="showTab('${tab.name}'); return false;" href="#">${tab.label}</a>`;
}

function tabContainerHtml(tab) {
  return /* html */ `<div class="${tab.name} hidden" id="${tab.name}"></div>`;
}

// Zeigt den Tab und baut seinen Inhalt beim ersten Öffnen auf
async function showTab(tabName) {
  for (let tab of tabs) {
    document
      .getElementById(tab.name)
      .classList.toggle("hidden", tab.name !== tabName);
  }
  let element = document.getElementById(tabName);
  if (element.dataset.rendered) return; // pro Pokémon wird jeder Tab nur einmal gebaut
  element.dataset.rendered = "true";
  let pokemon = currentPokemon;
  try {
    let content = tabs.find((tab) => tab.name === tabName).render(pokemon);
    if (content instanceof Promise) {
      element.innerHTML = tabMessageHtml(pokemon, "Loading...");
      content = await content;
    }
    if (pokemon === currentPokemon) element.innerHTML = content; // nur, wenn es noch dasselbe Pokémon ist
  } catch (error) {
    console.error(error);
    if (pokemon !== currentPokemon) return;
    delete element.dataset.rendered; // ein erneuter Klick auf den Tab versucht es noch einmal
    element.innerHTML = tabMessageHtml(
      pokemon,
      "The details could not be loaded.",
    );
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
