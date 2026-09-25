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

// Welche Angriffstypen wie viel Schaden machen (Faktor) – so steht es in den Typ-Daten der API
const damageRelationRules = [
  ["double_damage_from", 2],
  ["half_damage_from", 0.5],
  ["no_damage_from", 0],
];

async function matchupsHtml(pokemon) {
  let pokemonTypes = await fetchTypesOfPokemon(pokemon);
  let damageMultiplierByAttackingType = calculateDamageMultipliers(pokemonTypes);
  return /* html */ `
    <div class="matchup-list">${matchupGroupsHtml(damageMultiplierByAttackingType)}</div>
    <p class="matchup-note">All other types deal normal damage.</p>
  `;
}

function fetchTypesOfPokemon(pokemon) {
  return Promise.all(pokemon.types.map((typeEntry) => fetchJsonWithCache(typeEntry.type.url)));
}

// ---------- Berechnung des Schadens ----------

// Schaden, den jeder Angriffstyp beim Pokémon anrichtet. Bei zwei Typen werden die Faktoren
// multipliziert: Schwäche (×2) und Resistenz (×½) heben sich auf, eine Immunität (×0) gewinnt immer.
function calculateDamageMultipliers(pokemonTypes) {
  let damageMultiplierByAttackingType = createNeutralDamageMultipliers();
  for (let pokemonType of pokemonTypes) {
    applyDamageRelations(damageMultiplierByAttackingType, pokemonType.damage_relations);
  }
  return damageMultiplierByAttackingType;
}

// Am Anfang macht jeder Typ normalen Schaden (Faktor 1)
function createNeutralDamageMultipliers() {
  return Object.fromEntries(allTypeNames.map((typeName) => [typeName, 1]));
}

function applyDamageRelations(damageMultiplierByAttackingType, damageRelations) {
  for (let [relationName, damageFactor] of damageRelationRules) {
    multiplyDamage(damageMultiplierByAttackingType, damageRelations[relationName], damageFactor);
  }
}

function multiplyDamage(damageMultiplierByAttackingType, attackingTypes, damageFactor) {
  for (let attackingType of attackingTypes) {
    if (attackingType.name in damageMultiplierByAttackingType) {
      damageMultiplierByAttackingType[attackingType.name] *= damageFactor;
    }
  }
}

// ---------- Anzeige der Gruppen ----------

function matchupGroupsHtml(damageMultiplierByAttackingType) {
  return matchupGroups
    .map((matchupGroup) => matchupGroupHtmlIfNotEmpty(matchupGroup, damageMultiplierByAttackingType))
    .join("");
}

function matchupGroupHtmlIfNotEmpty(matchupGroup, damageMultiplierByAttackingType) {
  let attackingTypeNames = Object.keys(damageMultiplierByAttackingType).filter(
    (attackingTypeName) => damageMultiplierByAttackingType[attackingTypeName] === matchupGroup.multiplier,
  );
  return attackingTypeNames.length ? matchupGroupHtml(matchupGroup, attackingTypeNames) : "";
}

function matchupGroupHtml(matchupGroup, attackingTypeNames) {
  return /* html */ `
    <div class="matchup-group ${matchupGroup.className}">
      ${matchupHeadingHtml(matchupGroup)}
      <div class="matchup-types">${attackingTypeNames.map(typeBadgeHtml).join("")}</div>
    </div>
  `;
}

function matchupHeadingHtml(matchupGroup) {
  return /* html */ `
    <div class="matchup-heading">
      <b class="matchup-multiplier">${matchupGroup.multiplierText}</b>
      <span>${matchupGroup.label}</span>
    </div>
  `;
}
