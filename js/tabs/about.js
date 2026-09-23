registerTab({ name: "About", label: "About", render: aboutHtml });

async function aboutHtml(pokemon) {
  let [species, encounters] = await Promise.all([
    fetchJson(pokemon.species.url),
    fetchJson(pokemon.location_area_encounters),
  ]);
  let locations = encounters
    .map((encounter) => formatName(encounter.location_area.name))
    .join(", ");
  let rows = [
    ["Height", `${pokemon.height * 10} cm`],
    ["Weight", `${(pokemon.weight / 10).toFixed(1)} kg`],
    ["Gender", genderText(species.gender_rate)],
    [
      "Egg Groups",
      species.egg_groups.map((group) => formatName(group.name)).join(", "),
    ],
    ["Egg Cycle", species.hatch_counter],
  ];
  return /* html */ `
    <div class="info-rows">
      ${rows.map(([label, value]) => aboutRowHtml(label, value)).join("")}
    </div>
    <h3 class="info-heading">Abilities</h3>
    <div class="expandable-list">
      ${pokemon.abilities.map(abilityHtml).join("")}
    </div>
    <h3 class="info-heading">Location Area Encounters</h3>
    <div class="info-rows">
      ${aboutRowHtml("", locations || "Unknown", "info-row-stack")}
    </div>
  `;
}

function aboutRowHtml(label, value, className = "") {
  return /* html */ `
    <div class="info-row ${className}">
      ${label ? `<b>${label}</b>` : ""}
      <span>${value}</span>
    </div>
  `;
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

// gender_rate sind Achtel weiblich, -1 bedeutet geschlechtslos
function genderText(genderRate) {
  if (genderRate === -1) return "Genderless";
  let female = (genderRate / 8) * 100;
  return `♂️ ${100 - female}% / ♀️ ${female}%`;
}
