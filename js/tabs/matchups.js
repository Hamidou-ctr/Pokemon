registerTab({
  tabId: matchupsTabId,
  label: "Matchups",
  icon: icons.matchups,
  render: matchupsHtml,
});

// Von der stärksten Schwäche bis zur Immunität; Gruppen ohne Typen werden nicht angezeigt
const matchupGroups = [
  { multiplier: 4, multiplierText: "×4", label: "Very weak to", className: "matchup-weak" },
  { multiplier: 2, multiplierText: "×2", label: "Weak to", className: "matchup-weak" },
  { multiplier: 0.5, multiplierText: "×½", label: "Resists", className: "matchup-resist" },
  { multiplier: 0.25, multiplierText: "×¼", label: "Strongly resists", className: "matchup-resist" },
  { multiplier: 0, multiplierText: "×0", label: "Immune to", className: "matchup-immune" },
];

async function matchupsHtml(pokemon) {
  let pokemonTypes = await Promise.all(
    pokemon.types.map((typeEntry) => fetchJsonWithCache(typeEntry.type.url)),
  );
  let damageMultiplierByAttackingType = calculateDamageMultipliers(pokemonTypes);
  let groupsHtml = matchupGroups
    .map((matchupGroup) => {
      let attackingTypeNames = Object.keys(damageMultiplierByAttackingType).filter(
        (attackingTypeName) => damageMultiplierByAttackingType[attackingTypeName] === matchupGroup.multiplier,
      );
      return attackingTypeNames.length ? matchupGroupHtml(matchupGroup, attackingTypeNames) : "";
    })
    .join("");
  return /* html */ `
    <div class="matchup-list">${groupsHtml}</div>
    <p class="matchup-note">All other types deal normal damage.</p>
  `;
}

// Schaden, den jeder Angriffstyp beim Pokémon anrichtet. Bei zwei Typen werden die Faktoren
// multipliziert: Schwäche (×2) und Resistenz (×½) heben sich auf, eine Immunität (×0) gewinnt immer.
function calculateDamageMultipliers(pokemonTypes) {
  let damageMultiplierByAttackingType = {};
  for (let attackingTypeName of allTypeNames) {
    damageMultiplierByAttackingType[attackingTypeName] = 1;
  }
  let damageRelationRules = [
    ["double_damage_from", 2],
    ["half_damage_from", 0.5],
    ["no_damage_from", 0],
  ];
  for (let pokemonType of pokemonTypes) {
    for (let [relationName, damageFactor] of damageRelationRules) {
      for (let attackingType of pokemonType.damage_relations[relationName]) {
        if (attackingType.name in damageMultiplierByAttackingType) {
          damageMultiplierByAttackingType[attackingType.name] *= damageFactor;
        }
      }
    }
  }
  return damageMultiplierByAttackingType;
}

function matchupGroupHtml(matchupGroup, attackingTypeNames) {
  return /* html */ `
    <div class="matchup-group ${matchupGroup.className}">
      <div class="matchup-heading">
        <b class="matchup-multiplier">${matchupGroup.multiplierText}</b>
        <span>${matchupGroup.label}</span>
      </div>
      <div class="matchup-types">${attackingTypeNames.map(typeBadgeHtml).join("")}</div>
    </div>
  `;
}
