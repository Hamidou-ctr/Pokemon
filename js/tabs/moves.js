registerTab({ name: "Moves", label: "Moves", render: movesHtml });

const topMovesCount = 10;

function movesHtml(pokemon) {
  // Die Attacken, die in den meisten Spielversionen gelernt werden können
  let topMoves = pokemon.moves
    .map((entry) => ({
      id: entry.move.name,
      name: formatName(entry.move.name),
      versions: entry.version_group_details.length,
    }))
    .sort((a, b) => b.versions - a.versions)
    .slice(0, topMovesCount);
  let maximumVersionCount = Math.max(
    1,
    ...topMoves.map((move) => move.versions),
  );
  let moveBarColor = generatePrimaryBackgroundColor(pokemon);
  return /* html */ `
    <div class="bar-list">
      <p class="bar-caption">Top ${topMovesCount} moves by number of game versions. Click a move for details.</p>
      ${topMoves
        .map((move) =>
          expandableHtml(
            barCellsHtml(move.name, move.versions, maximumVersionCount, {
              border: moveBarColor,
              fill: moveBarColor,
            }),
            moveDetailsHtml,
            move.id,
            "bar-row",
          ),
        )
        .join("")}
    </div>
  `;
}

async function moveDetailsHtml(name) {
  let move = await fetchJson(`${baseUrl}/move/${name}`);
  let effect =
    englishText(move.effect_entries, "short_effect").replaceAll(
      "$effect_chance",
      move.effect_chance,
    ) ||
    englishText(move.flavor_text_entries, "flavor_text") ||
    "No description available.";
  return /* html */ `
    <div class="facts">
      ${typeBadgeHtml(move.type.name)}
      ${factHtml("Category", formatName(move.damage_class.name))}
      ${factHtml("Power", move.power ?? "–")}
      ${factHtml("Accuracy", move.accuracy === null ? "–" : `${move.accuracy}%`)}
      ${factHtml("PP", move.pp ?? "–")}
    </div>
    <p>${effect}</p>
  `;
}
