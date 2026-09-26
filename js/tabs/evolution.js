registerTab({
  tabId: "Evolution",
  label: "Evolution",
  icon: icons.evolution,
  render: evolutionHtml,
});

const wideEvolutionBranchCount = 3; // more branches than this are shown as a grid instead of side by side

async function evolutionHtml(pokemon) {
  let species = await fetchJsonWithCache(pokemon.species.url);
  let evolutionChain = await fetchEvolutionChain(species);
  if (!evolutionChain) return tabMessageHtml(`${formatNameForDisplay(species.name)} does not evolve.`);
  return /* html */ `
    <div class="evolution-tree">${evolutionStageHtml(evolutionChain, species.name)}</div>
  `;
}

// null if the chain contains no evolution at all
async function fetchEvolutionChain(species) {
  if (!species.evolution_chain) return null;
  let evolutionChain = (await fetchJsonWithCache(species.evolution_chain.url)).chain;
  return evolutionChain.evolves_to.length ? evolutionChain : null;
}

// ---------- Tree of Pokémon and arrows ----------

// A Pokémon of the chain together with everything it evolves into (recursive, so branching like Eevee works too)
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

// With many branches (Eevee has 8) the chain would be far too tall horizontally, so they are arranged as a grid below the Pokémon
function getWideLayoutClassName(chainLink) {
  return chainLink.evolves_to.length > wideEvolutionBranchCount ? " wide" : "";
}

function evolutionBranchesHtml(chainLink, currentSpeciesName) {
  return chainLink.evolves_to
    .map((nextChainLink) => evolutionBranchHtml(nextChainLink, currentSpeciesName))
    .join("");
}

// An arrow with the condition, followed by the Pokémon it evolves into
function evolutionBranchHtml(nextChainLink, currentSpeciesName) {
  return /* html */ `
    <div class="evolution-branch">
      <div class="evolution-link"><span>${evolutionConditionText(nextChainLink.evolution_details)}</span></div>
      ${evolutionStageHtml(nextChainLink, currentSpeciesName)}
    </div>
  `;
}

// The species ID is also the ID of the default form, so a click directly opens the popup of this Pokémon
function evolutionNodeHtml(chainLink, currentSpeciesName) {
  let speciesId = extractIdFromUrl(chainLink.species.url);
  let isCurrentPokemon = chainLink.species.name === currentSpeciesName;
  return /* html */ `
    <button type="button" class="evolution-node${isCurrentPokemon ? " current" : ""}" ${evolutionNodeActionAttribute(speciesId, isCurrentPokemon)}>
      ${evolutionNodeContentHtml(chainLink.species.name, speciesId)}
    </button>
  `;
}

// The Pokémon that is currently open cannot be clicked; all others open their popup
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

// ---------- Evolution conditions ----------

// A Pokémon can evolve in several ways (e.g. day or night); the ways are separated with "or"
function evolutionConditionText(evolutionDetailsList) {
  let alternativeTexts = evolutionDetailsList.map(evolutionDetailText).filter(Boolean);
  return [...new Set(alternativeTexts)].join(" or ");
}

// The trigger and all additional conditions of one way, separated by commas
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

// Time of day, location, gender and weather
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

// For example Tyrogue: Hitmonlee if Attack > Defense, Hitmonchan if <, Hitmontop if =
function attackVersusDefenseText(evolutionDetail) {
  if (typeof evolutionDetail.relative_physical_stats !== "number") return "";
  let comparisonSign = { 1: ">", 0: "=", "-1": "<" }[evolutionDetail.relative_physical_stats];
  return `Attack ${comparisonSign} Defense`;
}
