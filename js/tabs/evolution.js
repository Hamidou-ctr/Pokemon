registerTab({
  name: "Evolution",
  label: "Evolution",
  icon: icons.evolution,
  render: evolutionHtml,
});

const wideEvolutionBranchCount = 3; // mehr Zweige als das werden als Raster statt nebeneinander gezeigt

async function evolutionHtml(pokemon) {
  let species = await fetchJson(pokemon.species.url);
  let name = formatName(species.name);
  if (!species.evolution_chain) {
    return tabMessageHtml(`${name} does not evolve.`);
  }
  let chain = (await fetchJson(species.evolution_chain.url)).chain;
  if (!chain.evolves_to.length) {
    return tabMessageHtml(`${name} does not evolve.`);
  }
  return /* html */ `
    <div class="evolution-tree">${evolutionStageHtml(chain, species.name)}</div>
  `;
}

// Ein Pokémon der Kette samt allem, wozu es sich weiterentwickelt (rekursiv, damit auch Verzweigungen wie Evoli passen)
function evolutionStageHtml(link, currentSpeciesName) {
  let node = evolutionNodeHtml(link, currentSpeciesName);
  if (!link.evolves_to.length) return node;
  let branches = link.evolves_to
    .map(
      (child) => /* html */ `
        <div class="evolution-branch">
          <div class="evolution-link"><span>${evolutionConditionText(child.evolution_details)}</span></div>
          ${evolutionStageHtml(child, currentSpeciesName)}
        </div>
      `,
    )
    .join("");
  // Bei vielen Zweigen (Evoli hat 8) wäre die Kette waagerecht viel zu hoch, dann werden sie als Raster unter dem Pokémon angeordnet
  let layout = link.evolves_to.length > wideEvolutionBranchCount ? " wide" : "";
  return /* html */ `
    <div class="evolution-stage${layout}">
      ${node}
      <div class="evolution-branches">${branches}</div>
    </div>
  `;
}

// Die Species-ID ist zugleich die ID der Standardform, daher öffnet ein Klick direkt das Popup dieses Pokémon
function evolutionNodeHtml(link, currentSpeciesName) {
  let id = idFromUrl(link.species.url);
  let name = formatName(link.species.name);
  let isCurrent = link.species.name === currentSpeciesName;
  let action = isCurrent ? 'aria-current="true"' : `onclick="pokemonInformation(${id})"`;
  return /* html */ `
    <button type="button" class="evolution-node${isCurrent ? " current" : ""}" ${action}>
      <img src="${spriteBaseUrl}/other/official-artwork/${id}.png" alt="" loading="lazy">
      <span class="evolution-name">${name}</span>
      <small>№ ${id}</small>
    </button>
  `;
}

// Ein Pokémon kann auf mehreren Wegen entwickeln (z. B. Tag oder Nacht), die Wege stehen mit "or" getrennt
function evolutionConditionText(detailsList) {
  let texts = detailsList.map(evolutionDetailText).filter(Boolean);
  return [...new Set(texts)].join(" or ");
}

function evolutionDetailText(detail) {
  let trigger = detail.trigger.name;
  let parts = [];
  if (trigger === "level-up") {
    parts.push(detail.min_level ? `Level ${detail.min_level}` : "Level up");
  } else if (trigger === "use-item") {
    parts.push(detail.item ? `Use ${formatName(detail.item.name)}` : "Use item");
  } else if (trigger === "trade") {
    parts.push(
      detail.trade_species
        ? `Trade for ${formatName(detail.trade_species.name)}`
        : "Trade",
    );
  } else {
    parts.push(formatName(trigger));
  }
  if (detail.held_item) parts.push(`holding ${formatName(detail.held_item.name)}`);
  if (detail.known_move) parts.push(`knowing ${formatName(detail.known_move.name)}`);
  if (detail.known_move_type) {
    parts.push(`knowing a ${formatName(detail.known_move_type.name)} move`);
  }
  if (detail.min_happiness) parts.push(`friendship ${detail.min_happiness}+`);
  if (detail.min_affection) parts.push(`affection ${detail.min_affection}+`);
  if (detail.min_beauty) parts.push(`beauty ${detail.min_beauty}+`);
  if (detail.time_of_day) parts.push(`at ${detail.time_of_day}`);
  if (detail.location) parts.push(`at ${formatName(detail.location.name)}`);
  if (detail.gender) parts.push(detail.gender === 1 ? "female" : "male");
  if (detail.needs_overworld_rain) parts.push("while raining");
  if (detail.turn_upside_down) parts.push("console upside down");
  if (detail.party_species) {
    parts.push(`with ${formatName(detail.party_species.name)} in party`);
  }
  if (detail.party_type) {
    parts.push(`with a ${formatName(detail.party_type.name)} type in party`);
  }
  if (typeof detail.relative_physical_stats === "number") {
    let sign = { 1: ">", 0: "=", "-1": "<" }[detail.relative_physical_stats];
    parts.push(`Attack ${sign} Defense`);
  }
  return parts.join(", ");
}
