registerTab({ name: "About", label: "About", render: aboutHtml });

async function aboutHtml(pokemon) {
  let secondaryBackgroundColor = generateSecondaryBackgroundColor(pokemon);
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
    [
      "Abilities",
      pokemon.abilities
        .map((entry) => formatName(entry.ability.name))
        .join(", "),
    ],
    ["Gender", genderText(species.gender_rate)],
    [
      "Egg Groups",
      species.egg_groups.map((group) => formatName(group.name)).join(", "),
    ],
    ["Egg Cycle", species.hatch_counter],
  ];
  return /* html */ `
    <div class="About-div">
      ${rows.map(([label, value]) => aboutRowHtml(label, value, secondaryBackgroundColor)).join("")}
      ${aboutRowHtml("Location Area Encounters", locations || "Unknown", secondaryBackgroundColor, "Location")}
    </div>
  `;
}

function aboutRowHtml(label, value, backgroundColor, className = "") {
  return /* html */ `
    <p class="${className}" style="background-color: ${backgroundColor};">
      <b>${label}</b> ${value}
    </p>
  `;
}

// gender_rate sind Achtel weiblich, -1 bedeutet geschlechtslos
function genderText(genderRate) {
  if (genderRate === -1) return "Genderless";
  let female = (genderRate / 8) * 100;
  return `♂️ ${100 - female}% / ♀️ ${female}%`;
}
