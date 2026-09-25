registerTab({
  tabId: "About",
  label: "About",
  icon: icons.about,
  render: aboutHtml,
});

async function aboutHtml(pokemon) {
  let [species, encounterAreas, abilityDetailsList] = await fetchAboutData(pokemon);
  return /* html */ `
    ${descriptionQuoteHtml(species)}
    ${basicFactTilesHtml(pokemon, species)}
    ${genderAndEggGroupTilesHtml(species)}
    ${abilitiesSectionHtml(pokemon, abilityDetailsList)}
    ${locationsSectionHtml(encounterAreas)}
  `;
}

function fetchAboutData(pokemon) {
  return Promise.all([
    fetchJsonWithCache(pokemon.species.url),
    fetchJsonWithCache(pokemon.location_area_encounters),
    fetchAllAbilityDetails(pokemon),
  ]);
}

// Die Fähigkeiten stehen offen da, ihre Texte kommen deshalb gleich mit. Fehlt einer, zeigt seine Karte
// nur den Namen, der Rest des Tabs bleibt heil.
function fetchAllAbilityDetails(pokemon) {
  return Promise.all(
    pokemon.abilities.map((abilityEntry) => fetchJsonWithCache(abilityEntry.ability.url).catch(() => null)),
  );
}

// ---------- Beschreibung und Kacheln ----------

function descriptionQuoteHtml(species) {
  // Die Spieltexte schreiben den Namen der Reihe in Großbuchstaben
  let pokedexDescription = findLatestEnglishText(species.flavor_text_entries, "flavor_text")
    .replaceAll("POKéMON", "Pokémon")
    .replaceAll("POKÉMON", "Pokémon");
  return pokedexDescription ? `<blockquote class="about-quote">${pokedexDescription}</blockquote>` : "";
}

function basicFactTilesHtml(pokemon, species) {
  return /* html */ `
    <div class="about-tiles">
      ${tileHtml("Height", `${pokemon.height * 10} cm`)}
      ${tileHtml("Weight", `${(pokemon.weight / 10).toFixed(1)} kg`)}
      ${tileHtml("Egg Cycle", species.hatch_counter)}
    </div>
  `;
}

function genderAndEggGroupTilesHtml(species) {
  let eggGroupNames = species.egg_groups.map((eggGroup) => formatNameForDisplay(eggGroup.name));
  return /* html */ `
    <div class="about-tiles about-tiles-wide">
      ${genderTileHtml(species.gender_rate)}
      ${tileHtml("Egg Groups", chipListHtml(eggGroupNames))}
    </div>
  `;
}

function tileHtml(label, valueHtml) {
  return /* html */ `
    <div class="about-tile">
      <span class="tile-label">${label}</span>
      <span class="tile-value">${valueHtml}</span>
    </div>
  `;
}

// genderRate sind Achtel weiblich, -1 bedeutet geschlechtslos
function genderTileHtml(genderRate) {
  if (genderRate === -1) return tileHtml("Gender", "Genderless");
  let femalePercent = (genderRate / 8) * 100;
  let malePercent = 100 - femalePercent;
  return tileHtml("Gender", genderBarHtml(malePercent, femalePercent) + genderLegendHtml(malePercent, femalePercent));
}

// blau für männlich, rosa für weiblich
function genderBarHtml(malePercent, femalePercent) {
  return /* html */ `
    <span class="gender-bar" aria-hidden="true">
      <span class="gender-male" style="width: ${malePercent}%"></span>
      <span class="gender-female" style="width: ${femalePercent}%"></span>
    </span>
  `;
}

function genderLegendHtml(malePercent, femalePercent) {
  return /* html */ `
    <span class="gender-legend">
      <span class="gender-male-text">♂ ${malePercent}%</span>
      <span class="gender-female-text">♀ ${femalePercent}%</span>
    </span>
  `;
}

// Kleine Pillen, z. B. für Ei-Gruppen und Fundorte
function chipListHtml(chipTexts, extraClassName = "") {
  return `<div class="chip-list ${extraClassName}">${chipTexts.map((chipText) => `<span class="chip">${chipText}</span>`).join("")}</div>`;
}

// ---------- Fähigkeiten ----------

function abilitiesSectionHtml(pokemon, abilityDetailsList) {
  return /* html */ `
    <h3 class="detail-section-title">Abilities</h3>
    <div class="card-list">
      ${pokemon.abilities.map((abilityEntry, index) => abilityCardHtml(abilityEntry, abilityDetailsList[index])).join("")}
    </div>
  `;
}

// abilityDetails ist null, wenn die Texte der Fähigkeit nicht geladen werden konnten
function abilityCardHtml(abilityEntry, abilityDetails) {
  let hiddenAbilityTagHtml = abilityEntry.is_hidden ? `<span class="ability-tag">Hidden</span>` : "";
  return /* html */ `
    <article class="ability-card">
      <h4 class="ability-name">${formatNameForDisplay(abilityEntry.ability.name)}${hiddenAbilityTagHtml}</h4>
      <p class="ability-description">${abilityDescriptionText(abilityDetails)}</p>
    </article>
  `;
}

function abilityDescriptionText(abilityDetails) {
  if (!abilityDetails) return noDescriptionText;
  return (
    findLatestEnglishText(abilityDetails.effect_entries, "short_effect") ||
    findLatestEnglishText(abilityDetails.flavor_text_entries, "flavor_text") ||
    noDescriptionText
  );
}

// ---------- Fundorte ----------

function locationsSectionHtml(encounterAreas) {
  let locationNames = encounterAreas.map((encounterArea) => formatNameForDisplay(encounterArea.location_area.name));
  return /* html */ `
    <h3 class="detail-section-title">Locations</h3>
    ${chipListHtml(locationNames.length ? locationNames : ["Unknown"], "chip-list-scroll")}
  `;
}
