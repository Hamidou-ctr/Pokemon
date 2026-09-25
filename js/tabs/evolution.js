registerTab({
  tabId: "Evolution",
  label: "Evolution",
  icon: icons.evolution,
  render: evolutionHtml,
});

const wideEvolutionBranchCount = 3; // mehr Zweige als das werden als Raster statt nebeneinander gezeigt

async function evolutionHtml(pokemon) {
  let species = await fetchJsonWithCache(pokemon.species.url);
  let speciesDisplayName = formatNameForDisplay(species.name);
  if (!species.evolution_chain) {
    return tabMessageHtml(`${speciesDisplayName} does not evolve.`);
  }
  let evolutionChain = (await fetchJsonWithCache(species.evolution_chain.url)).chain;
  if (!evolutionChain.evolves_to.length) {
    return tabMessageHtml(`${speciesDisplayName} does not evolve.`);
  }
  return /* html */ `
    <div class="evolution-tree">${evolutionStageHtml(evolutionChain, species.name)}</div>
  `;
}

// Ein Pokémon der Kette samt allem, wozu es sich weiterentwickelt (rekursiv, damit auch Verzweigungen wie Evoli passen)
function evolutionStageHtml(chainLink, currentSpeciesName) {
  let pokemonNodeHtml = evolutionNodeHtml(chainLink, currentSpeciesName);
  if (!chainLink.evolves_to.length) return pokemonNodeHtml;
  let branchesHtml = chainLink.evolves_to
    .map(
      (nextChainLink) => /* html */ `
        <div class="evolution-branch">
          <div class="evolution-link"><span>${evolutionConditionText(nextChainLink.evolution_details)}</span></div>
          ${evolutionStageHtml(nextChainLink, currentSpeciesName)}
        </div>
      `,
    )
    .join("");
  // Bei vielen Zweigen (Evoli hat 8) wäre die Kette waagerecht viel zu hoch, dann werden sie als Raster unter dem Pokémon angeordnet
  let wideLayoutClassName = chainLink.evolves_to.length > wideEvolutionBranchCount ? " wide" : "";
  return /* html */ `
    <div class="evolution-stage${wideLayoutClassName}">
      ${pokemonNodeHtml}
      <div class="evolution-branches">${branchesHtml}</div>
    </div>
  `;
}

// Die Species-ID ist zugleich die ID der Standardform, daher öffnet ein Klick direkt das Popup dieses Pokémon
function evolutionNodeHtml(chainLink, currentSpeciesName) {
  let speciesId = extractIdFromUrl(chainLink.species.url);
  let speciesDisplayName = formatNameForDisplay(chainLink.species.name);
  let isCurrentPokemon = chainLink.species.name === currentSpeciesName;
  let clickOrCurrentAttribute = isCurrentPokemon ? 'aria-current="true"' : `onclick="openPokemonDetail(${speciesId})"`;
  return /* html */ `
    <button type="button" class="evolution-node${isCurrentPokemon ? " current" : ""}" ${clickOrCurrentAttribute}>
      <img src="${pokemonSpriteBaseUrl}/other/official-artwork/${speciesId}.png" alt="" loading="lazy">
      <span class="evolution-name">${speciesDisplayName}</span>
      <small>№ ${speciesId}</small>
    </button>
  `;
}

// Ein Pokémon kann auf mehreren Wegen entwickeln (z. B. Tag oder Nacht), die Wege stehen mit "or" getrennt
function evolutionConditionText(evolutionDetailsList) {
  let alternativeTexts = evolutionDetailsList.map(evolutionDetailText).filter(Boolean);
  return [...new Set(alternativeTexts)].join(" or ");
}

function evolutionDetailText(evolutionDetail) {
  let triggerName = evolutionDetail.trigger.name;
  let conditionParts = [];
  if (triggerName === "level-up") {
    conditionParts.push(evolutionDetail.min_level ? `Level ${evolutionDetail.min_level}` : "Level up");
  } else if (triggerName === "use-item") {
    conditionParts.push(evolutionDetail.item ? `Use ${formatNameForDisplay(evolutionDetail.item.name)}` : "Use item");
  } else if (triggerName === "trade") {
    conditionParts.push(
      evolutionDetail.trade_species
        ? `Trade for ${formatNameForDisplay(evolutionDetail.trade_species.name)}`
        : "Trade",
    );
  } else {
    conditionParts.push(formatNameForDisplay(triggerName));
  }
  if (evolutionDetail.held_item) conditionParts.push(`holding ${formatNameForDisplay(evolutionDetail.held_item.name)}`);
  if (evolutionDetail.known_move) conditionParts.push(`knowing ${formatNameForDisplay(evolutionDetail.known_move.name)}`);
  if (evolutionDetail.known_move_type) {
    conditionParts.push(`knowing a ${formatNameForDisplay(evolutionDetail.known_move_type.name)} move`);
  }
  if (evolutionDetail.min_happiness) conditionParts.push(`friendship ${evolutionDetail.min_happiness}+`);
  if (evolutionDetail.min_affection) conditionParts.push(`affection ${evolutionDetail.min_affection}+`);
  if (evolutionDetail.min_beauty) conditionParts.push(`beauty ${evolutionDetail.min_beauty}+`);
  if (evolutionDetail.time_of_day) conditionParts.push(`at ${evolutionDetail.time_of_day}`);
  if (evolutionDetail.location) conditionParts.push(`at ${formatNameForDisplay(evolutionDetail.location.name)}`);
  if (evolutionDetail.gender) conditionParts.push(evolutionDetail.gender === 1 ? "female" : "male");
  if (evolutionDetail.needs_overworld_rain) conditionParts.push("while raining");
  if (evolutionDetail.turn_upside_down) conditionParts.push("console upside down");
  if (evolutionDetail.party_species) {
    conditionParts.push(`with ${formatNameForDisplay(evolutionDetail.party_species.name)} in party`);
  }
  if (evolutionDetail.party_type) {
    conditionParts.push(`with a ${formatNameForDisplay(evolutionDetail.party_type.name)} type in party`);
  }
  if (typeof evolutionDetail.relative_physical_stats === "number") {
    let comparisonSign = { 1: ">", 0: "=", "-1": "<" }[evolutionDetail.relative_physical_stats];
    conditionParts.push(`Attack ${comparisonSign} Defense`);
  }
  return conditionParts.join(", ");
}
