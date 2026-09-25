// HTML-Bausteine, die mehrere Tabs gemeinsam nutzen

// Der Balken selbst: eine Spur mit dem gefüllten Anteil. barColors sind zwei beliebige
// CSS-Farben, der Balken läuft als Farbverlauf von startColor nach endColor.
function barTrackHtml(value, maximumValue, barColors) {
  let filledPercent = Math.min(100, (value / maximumValue) * 100).toFixed(1);
  return /* html */ `
    <div class="bar-track">
      <div class="bar-fill" style="width: ${filledPercent}%; --bar-start-color: ${barColors.startColor}; --bar-end-color: ${barColors.endColor};"></div>
    </div>
  `;
}

// Die drei Zellen einer Balkenzeile: Beschriftung, Wert, Balken
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

// Die zwei Farben, aus denen Karte und Popup ihren Farbverlauf zeichnen (als Wert für ein style-Attribut)
function pokemonColorStyle(pokemon) {
  return `--pokemon-main-color: ${getMainColorOfPokemon(pokemon)}; --pokemon-gradient-end-color: ${getGradientEndColorOfPokemon(pokemon)};`;
}

function typeBadgeHtml(typeName) {
  let typeColor = mainColorByTypeName[typeName] || fallbackTypeColor;
  return `<span class="type-badge" style="--type-color: ${typeColor};">${formatNameForDisplay(typeName)}</span>`;
}

// Statusmeldung ("Loading...", Fehler) für einen Tab
function tabMessageHtml(messageText) {
  return `<p class="tab-message">${messageText}</p>`;
}
