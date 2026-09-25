registerTab({
  name: "About",
  label: "About",
  icon: icons.about,
  render: aboutHtml,
});

async function aboutHtml(pokemon) {
  let [species, encounters, abilities] = await Promise.all([
    fetchJson(pokemon.species.url),
    fetchJson(pokemon.location_area_encounters),
    // Die Fähigkeiten stehen offen da, ihre Texte kommen deshalb gleich mit. Fehlt einer, zeigt seine Karte
    // nur den Namen, der Rest des Tabs bleibt heil.
    Promise.all(
      pokemon.abilities.map((entry) => fetchJson(entry.ability.url).catch(() => null)),
    ),
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
    <div class="card-list">
      ${pokemon.abilities.map((entry, index) => abilityHtml(entry, abilities[index])).join("")}
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

function abilityHtml(entry, ability) {
  let hiddenTag = entry.is_hidden ? `<span class="tag">Hidden</span>` : "";
  let description =
    (ability &&
      (englishText(ability.effect_entries, "short_effect") ||
        englishText(ability.flavor_text_entries, "flavor_text"))) ||
    "No description available.";
  return /* html */ `
    <article class="ability-card">
      <h4 class="ability-name">${formatName(entry.ability.name)}${hiddenTag}</h4>
      <p class="ability-description">${description}</p>
    </article>
  `;
}
