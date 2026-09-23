registerTab({ name: "Moves", label: "Moves", render: movesHtml });

const topMovesCount = 10;

function movesHtml(pokemon) {
  // Die Attacken, die in den meisten Spielversionen gelernt werden können
  let topMoves = pokemon.moves
    .map((entry) => ({
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
      <p class="bar-caption">Top ${topMovesCount} moves by number of game versions</p>
      ${topMoves
        .map((move) =>
          barRowHtml(move.name, move.versions, maximumVersionCount, {
            border: moveBarColor,
            fill: moveBarColor,
          }),
        )
        .join("")}
    </div>
  `;
}
