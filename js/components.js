// HTML building blocks shared by several tabs

// The bar itself: a track with the filled portion. barColors are two arbitrary
// CSS colors; the bar runs as a gradient from startColor to endColor.
function barTrackHtml(value, maximumValue, barColors) {
  let filledPercent = Math.min(100, (value / maximumValue) * 100).toFixed(1);
  return /* html */ `
    <div class="bar-track">
      <div class="bar-fill" style="width: ${filledPercent}%; --bar-start-color: ${barColors.startColor}; --bar-end-color: ${barColors.endColor};"></div>
    </div>
  `;
}

// The three cells of a bar row: label, value, bar
function barCellsHtml(label, value, maximumValue, barColors) {
  return /* html */ `
    <span class="bar-label">${label}</span>
    <span class="bar-value">${value}</span>
    ${barTrackHtml(value, maximumValue, barColors)}
  `;
}

function barRowHtml(label, value, maximumValue, barColors) {
  return /* html */ `
    <div class="bar-row">${barCellsHtml(label, value, maximumValue, barColors)}</div>
  `;
}

// The two colors from which the card and popup draw their gradient (as a value for a style attribute)
function pokemonColorStyle(pokemon) {
  return `--pokemon-main-color: ${getMainColorOfPokemon(pokemon)}; --pokemon-gradient-end-color: ${getGradientEndColorOfPokemon(pokemon)};`;
}

function typeBadgeHtml(typeName) {
  let typeColor = mainColorByTypeName[typeName] || fallbackTypeColor;
  return `<span class="type-badge" style="--type-color: ${typeColor};">${formatNameForDisplay(typeName)}</span>`;
}

// Status message ("Loading...", error) for a tab
function tabMessageHtml(messageText) {
  return `<p class="tab-message">${messageText}</p>`;
}
