registerTab({
  tabId: "Evolution",
  label: "Evolution",
  icon: icons.evolution,
  render: evolutionHtml,
});

const wideEvolutionBranchCount = 3; // mehr Zweige als das werden als Raster statt nebeneinander gezeigt

async function evolutionHtml(pokemon) {
  let species = await fetchJsonWithCache(pokemon.species.url);
  let evolutionChain = await fetchEvolutionChain(species);
  if (!evolutionChain) return tabMessageHtml(`${formatNameForDisplay(species.name)} does not evolve.`);
  return /* html */ `
    <div class="evolution-tree">${evolutionStageHtml(evolutionChain, species.name)}</div>
  `;
}

// null, wenn die Kette gar keine Entwicklung enthält
async function fetchEvolutionChain(species) {
  if (!species.evolution_chain) return null;
  let evolutionChain = (await fetchJsonWithCache(species.evolution_chain.url)).chain;
  return evolutionChain.evolves_to.length ? evolutionChain : null;
}

// ---------- Baum aus Pokémon und Pfeilen ----------

// Ein Pokémon der Kette samt allem, wozu es sich weiterentwickelt (rekursiv, damit auch Verzweigungen wie Evoli passen)
function evolutionStageHtml(chainLink, currentSpeciesName) {
  let pokemonNodeHtml = evolutionNodeHtml(chainLink, currentSpeciesName);
  if (!chainLink.evolves_to.length) return pokemonNodeHtml;
  return /* html */ `
    <div class="evolution-stage${getWideLayoutClassName(chainLink)}">
      ${pokemonNodeHtml}
      <div class="evolution-branches">${evolutionBranchesHtml(chainLink, currentSpeciesName)}</div>
    </div>
  `;
}

// Bei vielen Zweigen (Evoli hat 8) wäre die Kette waagerecht viel zu hoch, dann werden sie als Raster unter dem Pokémon angeordnet
function getWideLayoutClassName(chainLink) {
  return chainLink.evolves_to.length > wideEvolutionBranchCount ? " wide" : "";
}

function evolutionBranchesHtml(chainLink, currentSpeciesName) {
  return chainLink.evolves_to
    .map((nextChainLink) => evolutionBranchHtml(nextChainLink, currentSpeciesName))
    .join("");
}

// Ein Pfeil mit der Bedingung und dahinter das Pokémon, zu dem es sich entwickelt
function evolutionBranchHtml(nextChainLink, currentSpeciesName) {
  return /* html */ `
    <div class="evolution-branch">
      <div class="evolution-link"><span>${evolutionConditionText(nextChainLink.evolution_details)}</span></div>
      ${evolutionStageHtml(nextChainLink, currentSpeciesName)}
    </div>
  `;
}

// Die Species-ID ist zugleich die ID der Standardform, daher öffnet ein Klick direkt das Popup dieses Pokémon
function evolutionNodeHtml(chainLink, currentSpeciesName) {
  let speciesId = extractIdFromUrl(chainLink.species.url);
  let isCurrentPokemon = chainLink.species.name === currentSpeciesName;
  return /* html */ `
    <button type="button" class="evolution-node${isCurrentPokemon ? " current" : ""}" ${evolutionNodeActionAttribute(speciesId, isCurrentPokemon)}>
      ${evolutionNodeContentHtml(chainLink.species.name, speciesId)}
    </button>
  `;
}

// Das gerade offene Pokémon lässt sich nicht anklicken, alle anderen öffnen ihr Popup
function evolutionNodeActionAttribute(speciesId, isCurrentPokemon) {
  return isCurrentPokemon ? 'aria-current="true"' : `onclick="openPokemonDetail(${speciesId})"`;
}

function evolutionNodeContentHtml(speciesName, speciesId) {
  return /* html */ `
    <img src="${pokemonSpriteBaseUrl}/other/official-artwork/${speciesId}.png" alt="" loading="lazy">
    <span class="evolution-name">${formatNameForDisplay(speciesName)}</span>
    <small>№ ${speciesId}</small>
  `;
}

// ---------- Bedingungen der Entwicklung ----------

// Ein Pokémon kann auf mehreren Wegen entwickeln (z. B. Tag oder Nacht), die Wege stehen mit "or" getrennt
function evolutionConditionText(evolutionDetailsList) {
  let alternativeTexts = evolutionDetailsList.map(evolutionDetailText).filter(Boolean);
  return [...new Set(alternativeTexts)].join(" or ");
}

// Die Auslöser und alle zusätzlichen Bedingungen eines Weges, durch Kommas getrennt
function evolutionDetailText(evolutionDetail) {
  return [
    evolutionTriggerText(evolutionDetail),
    ...itemAndMoveConditionTexts(evolutionDetail),
    ...friendshipConditionTexts(evolutionDetail),
    ...circumstanceConditionTexts(evolutionDetail),
    ...partyAndStatsConditionTexts(evolutionDetail),
  ].join(", ");
}

function evolutionTriggerText(evolutionDetail) {
  let triggerName = evolutionDetail.trigger.name;
  if (triggerName === "level-up") return evolutionDetail.min_level ? `Level ${evolutionDetail.min_level}` : "Level up";
  if (triggerName === "use-item") return evolutionDetail.item ? `Use ${formatNameForDisplay(evolutionDetail.item.name)}` : "Use item";
  if (triggerName === "trade") return evolutionDetail.trade_species ? `Trade for ${formatNameForDisplay(evolutionDetail.trade_species.name)}` : "Trade";
  return formatNameForDisplay(triggerName);
}

function itemAndMoveConditionTexts(evolutionDetail) {
  return [
    evolutionDetail.held_item && `holding ${formatNameForDisplay(evolutionDetail.held_item.name)}`,
    evolutionDetail.known_move && `knowing ${formatNameForDisplay(evolutionDetail.known_move.name)}`,
    evolutionDetail.known_move_type && `knowing a ${formatNameForDisplay(evolutionDetail.known_move_type.name)} move`,
  ].filter(Boolean);
}

function friendshipConditionTexts(evolutionDetail) {
  return [
    evolutionDetail.min_happiness && `friendship ${evolutionDetail.min_happiness}+`,
    evolutionDetail.min_affection && `affection ${evolutionDetail.min_affection}+`,
    evolutionDetail.min_beauty && `beauty ${evolutionDetail.min_beauty}+`,
  ].filter(Boolean);
}

// Tageszeit, Ort, Geschlecht und Wetter
function circumstanceConditionTexts(evolutionDetail) {
  return [
    evolutionDetail.time_of_day && `at ${evolutionDetail.time_of_day}`,
    evolutionDetail.location && `at ${formatNameForDisplay(evolutionDetail.location.name)}`,
    evolutionDetail.gender && (evolutionDetail.gender === 1 ? "female" : "male"),
    evolutionDetail.needs_overworld_rain && "while raining",
    evolutionDetail.turn_upside_down && "console upside down",
  ].filter(Boolean);
}

function partyAndStatsConditionTexts(evolutionDetail) {
  return [
    evolutionDetail.party_species && `with ${formatNameForDisplay(evolutionDetail.party_species.name)} in party`,
    evolutionDetail.party_type && `with a ${formatNameForDisplay(evolutionDetail.party_type.name)} type in party`,
    attackVersusDefenseText(evolutionDetail),
  ].filter(Boolean);
}

// Zum Beispiel Tyrogue: Hitmonlee bei Angriff > Verteidigung, Hitmonchan bei <, Hitmontop bei =
function attackVersusDefenseText(evolutionDetail) {
  if (typeof evolutionDetail.relative_physical_stats !== "number") return "";
  let comparisonSign = { 1: ">", 0: "=", "-1": "<" }[evolutionDetail.relative_physical_stats];
  return `Attack ${comparisonSign} Defense`;
}
