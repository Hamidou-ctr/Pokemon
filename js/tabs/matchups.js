registerTab({
  name: matchupsTabName,
  label: "Matchups",
  icon: icons.matchups,
  render: matchupsHtml,
});

// Von der stärksten Schwäche bis zur Immunität; Gruppen ohne Typen werden nicht angezeigt
const matchupGroups = [
  { multiplier: 4, symbol: "×4", label: "Very weak to", className: "matchup-weak" },
  { multiplier: 2, symbol: "×2", label: "Weak to", className: "matchup-weak" },
  { multiplier: 0.5, symbol: "×½", label: "Resists", className: "matchup-resist" },
  { multiplier: 0.25, symbol: "×¼", label: "Strongly resists", className: "matchup-resist" },
  { multiplier: 0, symbol: "×0", label: "Immune to", className: "matchup-immune" },
];

async function matchupsHtml(pokemon) {
  let types = await Promise.all(
    pokemon.types.map((entry) => fetchJson(entry.type.url)),
  );
  let multipliers = damageMultipliers(types);
  let groups = matchupGroups
    .map((group) => {
      let attackers = Object.keys(multipliers).filter(
        (attacker) => multipliers[attacker] === group.multiplier,
      );
      return attackers.length ? matchupGroupHtml(group, attackers) : "";
    })
    .join("");
  return /* html */ `
    <div class="matchup-list">${groups}</div>
    <p class="matchup-note">All other types deal normal damage.</p>
  `;
}

// Schaden, den jeder Angriffstyp beim Pokémon anrichtet. Bei zwei Typen werden die Faktoren
// multipliziert: Schwäche (×2) und Resistenz (×½) heben sich auf, eine Immunität (×0) gewinnt immer.
function damageMultipliers(types) {
  let multipliers = {};
  for (let attacker of Object.keys(typePokemonPrimaryBackgroundColor)) {
    multipliers[attacker] = 1;
  }
  let relations = [
    ["double_damage_from", 2],
    ["half_damage_from", 0.5],
    ["no_damage_from", 0],
  ];
  for (let type of types) {
    for (let [relation, factor] of relations) {
      for (let attacker of type.damage_relations[relation]) {
        if (attacker.name in multipliers) multipliers[attacker.name] *= factor;
      }
    }
  }
  return multipliers;
}

function matchupGroupHtml(group, attackers) {
  return /* html */ `
    <div class="matchup-group ${group.className}">
      <div class="matchup-head">
        <b class="matchup-multiplier">${group.symbol}</b>
        <span>${group.label}</span>
      </div>
      <div class="matchup-types">${attackers.map(typeBadgeHtml).join("")}</div>
    </div>
  `;
}
