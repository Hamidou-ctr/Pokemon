// HTML-Bausteine, die mehrere Tabs gemeinsam nutzen

// Der Balken selbst: eine Spur mit dem gefüllten Anteil. barColors sind zwei beliebige
// CSS-Farben, der Balken läuft von border nach fill.
function barTrackHtml(value, maximumValue, barColors) {
  let percent = Math.min(100, (value / maximumValue) * 100).toFixed(1);
  return /* html */ `
    <div class="bar-track">
      <div class="bar-fill" style="width: ${percent}%; --bar-from: ${barColors.border}; --bar-to: ${barColors.fill};"></div>
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

function typeBadgeHtml(typeName) {
  let color = typePokemonPrimaryBackgroundColor[typeName] || defaultTypeColor;
  return `<span class="pokemon-type" style="--type-color: ${color};">${formatName(typeName)}</span>`;
}

// Statusmeldung ("Loading...", Fehler) für einen Tab
function tabMessageHtml(text) {
  return `<p class="tab-message">${text}</p>`;
}
