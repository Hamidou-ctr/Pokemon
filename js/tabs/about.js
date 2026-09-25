registerTab({
  name: "About",
  label: "About",
  icon: icons.about,
  render: aboutHtml,
});

async function aboutHtml(pokemon) {
  let [species, encounters] = await Promise.all([
    fetchJson(pokemon.species.url),
    fetchJson(pokemon.location_area_encounters),
  ]);
  // Die Spieltexte schreiben den Namen der Reihe in Großbuchstaben
  let description = englishText(species.flavor_text_entries, "flavor_text")
    .replaceAll("POKéMON", "Pokémon")
    .replaceAll("POKÉMON", "Pokémon");
  let eggGroups = species.egg_groups.map((group) => formatName(group.name));
  let locations = encounters.map((encounter) =>
    formatName(encounter.location_area.name),
  );
  return /* html */ `
    ${description ? `<blockquote class="about-quote">${description}</blockquote>` : ""}
    <div class="about-tiles">
      ${tileHtml("Height", `${pokemon.height * 10} cm`)}
      ${tileHtml("Weight", `${(pokemon.weight / 10).toFixed(1)} kg`)}
      ${tileHtml("Egg Cycle", species.hatch_counter)}
    </div>
    <div class="about-tiles about-tiles-wide">
      ${genderTileHtml(species.gender_rate)}
      ${tileHtml("Egg Groups", chipsHtml(eggGroups))}
    </div>
    <h3 class="info-section-title">Abilities</h3>
    <div class="expandable-list">
      ${pokemon.abilities.map(abilityHtml).join("")}
    </div>
    <h3 class="info-section-title">Locations</h3>
    ${chipsHtml(locations.length ? locations : ["Unknown"], "chip-list-scroll")}
  `;
}

function tileHtml(label, valueHtml) {
  return /* html */ `
    <div class="info-row about-tile">
      <span class="tile-label">${label}</span>
      <span class="tile-value">${valueHtml}</span>
    </div>
  `;
}

function chipsHtml(names, className = "") {
  return `<div class="chip-list ${className}">${names.map((name) => `<span class="chip">${name}</span>`).join("")}</div>`;
}

// gender_rate sind Achtel weiblich, -1 bedeutet geschlechtslos
function genderTileHtml(genderRate) {
  if (genderRate === -1) return tileHtml("Gender", "Genderless");
  let female = (genderRate / 8) * 100;
  let male = 100 - female;
  return tileHtml(
    "Gender",
    /* html */ `
      <span class="gender-bar" aria-hidden="true">
        <span class="gender-male" style="width: ${male}%"></span>
        <span class="gender-female" style="width: ${female}%"></span>
      </span>
      <span class="gender-legend">
        <span class="gender-male-text">♂ ${male}%</span>
        <span class="gender-female-text">♀ ${female}%</span>
      </span>
    `,
  );
}

function abilityHtml(entry) {
  let hiddenTag = entry.is_hidden ? `<span class="tag">Hidden</span>` : "";
  return expandableHtml(
    `${formatName(entry.ability.name)}${hiddenTag}`,
    abilityDetailsHtml,
    entry.ability.name,
  );
}

async function abilityDetailsHtml(name) {
  let ability = await fetchJson(`${baseUrl}/ability/${name}`);
  let description =
    englishText(ability.effect_entries, "short_effect") ||
    englishText(ability.flavor_text_entries, "flavor_text") ||
    "No description available.";
  return `<p>${description}</p>`;
}
