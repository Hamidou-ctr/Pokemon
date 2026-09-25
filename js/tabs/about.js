registerTab({
  tabId: "About",
  label: "About",
  icon: icons.about,
  render: aboutHtml,
});

async function aboutHtml(pokemon) {
  let [species, encounterAreas, abilityDetailsList] = await Promise.all([
    fetchJsonWithCache(pokemon.species.url),
    fetchJsonWithCache(pokemon.location_area_encounters),
    // Die Fähigkeiten stehen offen da, ihre Texte kommen deshalb gleich mit. Fehlt einer, zeigt seine Karte
    // nur den Namen, der Rest des Tabs bleibt heil.
    Promise.all(
      pokemon.abilities.map((abilityEntry) => fetchJsonWithCache(abilityEntry.ability.url).catch(() => null)),
    ),
  ]);
  // Die Spieltexte schreiben den Namen der Reihe in Großbuchstaben
  let pokedexDescription = findLatestEnglishText(species.flavor_text_entries, "flavor_text")
    .replaceAll("POKéMON", "Pokémon")
    .replaceAll("POKÉMON", "Pokémon");
  let eggGroupNames = species.egg_groups.map((eggGroup) => formatNameForDisplay(eggGroup.name));
  let locationNames = encounterAreas.map((encounterArea) =>
    formatNameForDisplay(encounterArea.location_area.name),
  );
  return /* html */ `
    ${pokedexDescription ? `<blockquote class="about-quote">${pokedexDescription}</blockquote>` : ""}
    <div class="about-tiles">
      ${tileHtml("Height", `${pokemon.height * 10} cm`)}
      ${tileHtml("Weight", `${(pokemon.weight / 10).toFixed(1)} kg`)}
      ${tileHtml("Egg Cycle", species.hatch_counter)}
    </div>
    <div class="about-tiles about-tiles-wide">
      ${genderTileHtml(species.gender_rate)}
      ${tileHtml("Egg Groups", chipListHtml(eggGroupNames))}
    </div>
    <h3 class="detail-section-title">Abilities</h3>
    <div class="card-list">
      ${pokemon.abilities.map((abilityEntry, index) => abilityCardHtml(abilityEntry, abilityDetailsList[index])).join("")}
    </div>
    <h3 class="detail-section-title">Locations</h3>
    ${chipListHtml(locationNames.length ? locationNames : ["Unknown"], "chip-list-scroll")}
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

function chipListHtml(chipTexts, extraClassName = "") {
  return `<div class="chip-list ${extraClassName}">${chipTexts.map((chipText) => `<span class="chip">${chipText}</span>`).join("")}</div>`;
}

// genderRate sind Achtel weiblich, -1 bedeutet geschlechtslos
function genderTileHtml(genderRate) {
  if (genderRate === -1) return tileHtml("Gender", "Genderless");
  let femalePercent = (genderRate / 8) * 100;
  let malePercent = 100 - femalePercent;
  return tileHtml(
    "Gender",
    /* html */ `
      <span class="gender-bar" aria-hidden="true">
        <span class="gender-male" style="width: ${malePercent}%"></span>
        <span class="gender-female" style="width: ${femalePercent}%"></span>
      </span>
      <span class="gender-legend">
        <span class="gender-male-text">♂ ${malePercent}%</span>
        <span class="gender-female-text">♀ ${femalePercent}%</span>
      </span>
    `,
  );
}

// abilityDetails ist null, wenn die Texte der Fähigkeit nicht geladen werden konnten
function abilityCardHtml(abilityEntry, abilityDetails) {
  let hiddenAbilityTagHtml = abilityEntry.is_hidden ? `<span class="ability-tag">Hidden</span>` : "";
  let abilityDescription =
    (abilityDetails &&
      (findLatestEnglishText(abilityDetails.effect_entries, "short_effect") ||
        findLatestEnglishText(abilityDetails.flavor_text_entries, "flavor_text"))) ||
    "No description available.";
  return /* html */ `
    <article class="ability-card">
      <h4 class="ability-name">${formatNameForDisplay(abilityEntry.ability.name)}${hiddenAbilityTagHtml}</h4>
      <p class="ability-description">${abilityDescription}</p>
    </article>
  `;
}
